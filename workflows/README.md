# workflows/ — Dynamic Workflow 脚本库

## 什么是 Dynamic Workflow（DW）

DW 是 Claude Code 的多 agent 编排能力：一个 JS 脚本用 `agent()` / `parallel()` / `pipeline()` 调度多个独立 Claude 实例并发或循环执行，每个 `agent()` 调用拥有独立上下文窗口。

与普通 exec spec（单 CC 会话 + 人工确认门）的本质区别：

| 维度 | exec spec（单会话） | Dynamic Workflow |
|------|--------------------|--------------------|
| 循环 | AI 被指示"去循环"（伪循环） | JS while 真循环 |
| 上下文 | 单一、累积、有污染 | 每个 agent 独立隔离 |
| 人工介入 | 每步 🚫 确认门 | 只在触发前 + 审 PR |
| 状态写入 | 分散在会话中 | 主脚本统一控制 |

## 本库包含

| 脚本 | 用途 |
|------|------|
| `b-class-develop.js` | B 类任务自动修复：dispatch-new 完成后一键执行修复→验证→审查→PR |

## 触发方式

在**项目仓** CC 会话中，告诉 Claude：

```
用 workflow 运行 B 类任务修复，脚本 ../hact-method/workflows/b-class-develop.js，
任务 ID 是 {task-id}
```

Claude 会调用 Workflow 工具，传入：
```json
{ "taskId": "{task-id}" }
```

脚本以**项目仓 CC 会话的 CWD（项目根目录）**为工作目录，所有文件路径均为相对路径，无需传项目路径。

前提：`dispatch-new` 已完成，任务包已写入 `b-queue/{task-id}.md`，状态为 `[可取]`。

### ⚠️ args 格式说明

harness 将 `args` 以 **JSON 字符串**传入脚本（不是 JS 对象）。脚本内部已处理 `JSON.parse`，调用侧无需特殊处理，直接传对象即可：

```js
Workflow({ scriptPath: '...', args: { taskId: 'krm-b-005' } })
```

### ⚠️ Resume 时必须重传 args

使用 `resumeFromRunId` 时，**必须同时传入 args**，否则脚本内 `taskId` 为 undefined：

```js
// ✅ 正确
Workflow({ scriptPath, resumeFromRunId: 'wf_xxx', args: { taskId: 'krm-b-005' } })

// ❌ 错误——taskId 会变成 undefined
Workflow({ scriptPath, resumeFromRunId: 'wf_xxx' })
```

修改脚本后建议 fresh run（不传 resumeFromRunId），避免旧缓存与新脚本行为不一致。

## 执行流程概览

```
人工触发（传 taskId）
  │
  ├── Phase 1：认领任务
  │     读全字段任务包（16字段）→ schema-change 检查（true 则立即升级）
  │     → b-queue/b-tasks.md/status.yml 全部改为 [taken-by: dw-bot] → commit
  │
  ├── Phase 2：Fix-Test Loop（最多 3 轮）
  │     ┌── 复用检查：Explore agent 读 reusables.md
  │     ├── agent-fix：完整上下文（context/standards/reference/known_risks）
  │     │     do-not 违反 → 回滚代码 → 升级给人
  │     │     escalate-if 触发 → 回滚代码 → 升级给人
  │     ├── 机械验证 agent：build + type-check + lint + test
  │     │     通过 → 退出 loop
  │     │     失败 → 下一轮（第 3 轮仍失败 → 升级给人）
  │     └── 偏离核查：实际改动 vs files 清单
  │           hotfix 超范围 → 升级给人
  │
  ├── Phase 3：对抗审查
  │     独立 agent（只传 AC + diff，无实现上下文）审查 6 类问题
  │     （第 6 类「接口契约对齐」条件触发：diff 含 api/controller/DTO 文件时）
  │           无阻断 → 继续
  │           有阻断 → 修复 → 二次审查（再有阻断 → 升级给人）
  │           建议 → 写入 backlog.md
  │
  ├── Phase 4：Commit + PR
  │     凭据检查（发现则停止 → 升级给人）
  │     → commit → push → 创建 PR（AC 验证段含具体验证方式）
  │
  └── Phase 5：状态更新
        b-queue [done] → status.yml pr 填入 → b-tasks.md 追加「PR#N 待审」→ commit + push
```

## 升级给人的情形

| 情形 | 触发条件 | 脚本行为 |
|------|---------|---------|
| schema-change | 任务包 `schema-change: true` | Phase 1 立即升级，不继续执行 |
| do-not 违反 | agent-fix 触碰任务包禁止边界 | 回滚代码，任务回 `[可取]` |
| escalate-if 触发 | agent-fix 满足上报条件（含前端视觉决策、上下文不足等） | 回滚代码，任务回 `[可取]` |
| 机械验证失败 | 同一任务 3 轮 build/lint/test 未过 | 回滚代码，任务回 `[可取]` |
| hotfix 超范围 | 改动文件超出任务包 `files` 字段 | 任务回 `[可取]`（代码不回滚，人工决定） |
| 审查二次阻断 | 对抗审查第 2 轮仍有 `[阻断]` | 任务回 `[可取]` |
| 凭据发现 | push 前发现疑似凭据 | 停止推送，任务回 `[可取]` |

> 升级时任务状态回到 `[可取]`，人工可接手或重新触发 DW。

## 人工在 DW 后的动作

DW 执行完毕，仅需：
1. 收到通知 → 确认 PR 已创建（脚本输出 `pr_number`）
2. 在项目仓开 `pr-review` 会话，审查 PR 内容
3. 合并后流程结束（B 类无后续 Gate）

**脚本会自动 push 代码和状态提交**。触发 DW 即视为对本次 push 的授权。

## 何时用 / 何时不用

| 适合 | 不适合 |
|------|--------|
| 后端 B 类（AC 可 build/lint/test 验证） | 视觉/样式类前端（无法截图验收） |
| 纯逻辑前端（无需看浏览器） | 改动 ≤ 3 行的简单 fix（手动 30 秒 vs workflow 5 分钟） |
| 任务包 context/files 完整清晰 | 需要交互式调试或探索的任务 |
| | 工作树有大量 untracked 临时文件 |

**原则**：估算"手动实现时间" ≤ 10 分钟 → 手动；否则 → workflow。

## 已知局限

| 局限 | 说明 | 人工如何补 |
|------|------|-----------|
| Step 10 feedback 就地分流 | exec spec 要求 B 类完成后即写入个人 notes（`hact-notes-{name}`）；DW 无用户身份，无法确定写入哪个 notes 仓 | PR review 完成后，执行人自行将本次发现写入个人 notes |
| 前端视觉决策 | exec spec 要求前端遇到 standards 未覆盖的视觉决策时暂停等人；DW 全自动无法暂停 | 任务包 `escalate-if` 字段中写明"遇到视觉决策上报"，agent-fix 会触发升级；或事前在任务包 `do-not` 中约定默认视觉方案 |
| checklist 自检 | 结构层规范要求 layer 对应 checklist 通过（`templates/checklists/{layer}-checklist.md`）；当前 DW 机械验证未包含此步 | pr-review 阶段人工核查 checklist；或后续为 DW 增加 checklist agent |
