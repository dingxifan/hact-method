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
任务 ID 是 {task-id}，项目路径是 {本仓绝对路径}
```

Claude 会调用 Workflow 工具，传入：
```json
{
  "taskId": "{task-id}",
  "projectPath": "{本仓绝对路径}"
}
```

前提：`dispatch-new` 已完成，任务包已写入 `b-queue/{task-id}.md`，状态为 `[可取]`。

## 执行流程概览

```
人工触发（传 taskId + projectPath）
  │
  ├── Phase 1：认领任务
  │     读 b-queue/{task-id}.md → 改状态 [taken-by: dw-bot] → 更新 status.yml → commit
  │
  ├── Phase 2：Fix-Test Loop（最多 3 轮）
  │     ┌── agent-fix：读任务包 + 代码，实现修复
  │     └── 机械验证 agent：build + type-check + lint + test
  │           通过 → 退出 loop
  │           失败 → 下一轮（第 3 轮仍失败 → 升级给人）
  │
  ├── Phase 3：对抗审查
  │     独立 agent（只传 AC + diff，无实现上下文）审查 5 类问题
  │           无阻断 → 继续
  │           有阻断 → 修复 → 二次审查（再有阻断 → 升级给人）
  │           建议 → 写入 backlog.md
  │
  ├── Phase 4：Commit + PR
  │     commit → push → 创建 PR → 返回 PR 号
  │
  └── Phase 5：状态更新
        b-queue 状态 [done] → status.yml → b-tasks.md → commit + push
```

## 升级给人的四种情形

| 情形 | 触发条件 | 脚本行为 |
|------|---------|---------|
| 机械验证失败 | 同一任务 3 轮 build/lint/test 未过 | 任务回 `[可取]`，返回错误信息 |
| 审查二次阻断 | 对抗审查第 2 轮仍有 `[阻断]` | 任务回 `[可取]`，返回阻断详情 |
| 根因在设计层 | agent-fix 判断需修改 TRD/接口定义 | 脚本中止，提示人工走 `revise-doc` |
| hotfix 超范围 | 改动文件超出任务包 `files` 字段 | 脚本中止，提示人工确认范围 |

> 升级时任务状态回到 `[可取]`，人工可接手或重新触发 DW。

## 人工在 DW 后的动作

DW 执行完毕，仅需：
1. 收到通知 → 确认 PR 已创建（脚本输出 `pr_number`）
2. 在项目仓开 `pr-review` 会话，审查 PR 内容
3. 合并后流程结束（B 类无后续 Gate）

**脚本会自动 push 代码和状态提交**。触发 DW 即视为对本次 push 的授权。
