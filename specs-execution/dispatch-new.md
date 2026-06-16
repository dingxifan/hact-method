# exec: dispatch-new

> CC 加载本文时，当前任务是处理一条 B 类入口：收到 bug 报告或优化需求，判断是否属于 B 类，写任务包入 queue，记入 b-tasks.md。
> 本 task 是轻量派发任务，通常 10 分钟内完成。

**上下文密度**：低。不加载代码，按需读 trd.md（判断是否涉及接口 schema 变更）。

---

## 红线

- **B 类判定有疑问时，倾向升级 A 类**：宁可多走流程，不遗漏产品决策
- **复现步骤不明确不写任务包**：先追问，无法复现的 bug 在任务包 `known-risks` 中标注，不写"复现步骤不明"的包
- **优化需求没有量化验收标准不写任务包**：先与用户确认可观测的成功指标，再写
- **`urgency=hotfix` 写完立即通知**：不等积累，立即告知相关 develop 执行人优先拾取

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

读任务包，确认 `target-source` 字段：`bug` 或 `optimization`。

---

## Step 1：B 类判定

**硬升 A 类（无条件，满足任意一条即升级）**：

| 条件 | 说明 |
|------|------|
| 影响两个及以上模块的核心逻辑 | 跨模块重构 |
| 需要产品决策（新用户场景 / 新功能边界） | 超出已有 PRD 范围 |
| 修改或删除已有接口路径 / 参数 / 字段 | breaking change，可能影响已有客户端或数据 |

**涉及接口或数据结构纯加法时，逐条判定**（新增可选字段 / 参数，不修改 / 删除已有项）：

| 判定项 | 升 A 类条件 | 可走 B 类条件 |
|--------|------------|--------------|
| 业务逻辑复杂度 | 涉及条件分支、约束变更、或影响既有行为 | 改动影响范围在任务包内可完整描述，不依赖其他模块的隐含假设 |
| 风险可控性 | 无法说清最坏情况 / 如何发现 / 如何回滚 | 能在 `known-risks` 里完整写出 |

三条判定项**全部满足 B 类条件**才可走 B 类；任意一条无法满足 → 升 A 类。

**升级 A 类时输出**：
```
此需求涉及 {跨模块核心逻辑 / 产品决策 / breaking change / 业务逻辑复杂 / 风险不可控}，需走 A 类流程。
本 dispatch-new task 终止，请在项目仓开 draft-prd-vN 会话。
```

**全部不满足升 A 条件** → 继续 Step 2。

---

## Step 2：收集信息

**`target-source=bug`**：
```
请提供：
1. 现象描述（看到了什么 / 期望是什么）
2. 复现步骤（最小复现路径）
3. 已尝试的解决方案（如有）
4. 最可能的修复方向（如有判断）
```

**`target-source=optimization`**：
```
请提供：
1. 改进目标（想达到什么效果）
2. 当前状态（基线指标，如有）
3. 验收标准（怎么算做成了，需可观测 / 可验证）
```

🚫 等用户提供信息；信息不完整时继续追问，不提前进入下一步

---

## Step 3：判断 urgency

| 条件 | urgency |
|------|---------|
| 影响核心功能且用户无法绕过 | `hotfix` |
| 其余 | `normal` |

---

## Step 4：写任务包

按 `specs-structural/develop.md §字段规范` 写完整 17 字段任务包，写入 `b-queue/{task-id}.md`，状态 `[可取]`。

关键字段确认（写完对照检查）：

| 字段 | 要求 |
|------|------|
| `task-id` | `{项目缩写}-b-{三位序号}`，如 `hact-b-001` |
| `source` | 与 `target-source` 一致（`bug` 或 `optimization`） |
| `urgency` | Step 3 判断结果 |
| `schema-change` | `true`（本任务含接口或数据结构纯加法变更）/ `false`（默认） |
| `acceptance-criteria` | bug → 现象消失 + 复现步骤无法复现；optimization → 用户提供的可观测验收标准；`schema-change=true` 时额外加一条：「TRD 已更新（`iterations/vN/trd.md` {对应章节}）」 |
| `known-risks` | bug 复现步骤不明确时在此标注；`urgency=hotfix` 且与当前 sprint 任务可能改动重叠文件时，标注冲突文件，由 develop 执行人协调合并顺序；`schema-change=true` 时必须写明：最坏情况 / 如何发现 / 如何回滚 |

**17 字段无空字段方可写入 queue**。

**同步往项目根 `status.yml` 的 `tasks[]` 追加一条**（机器侧状态契约，B 类为项目级、跨迭代——`source: {bug/optimization}`、`iteration: null`、`sprint: null`、`delivery: null`、`status: 可取`，`urgency` 取 Step 3 结果；字段见 `../hact-method/skeleton/07-status-contract.md`；文件不存在则先从 `../hact-method/templates/status.yml` 补建）。

> B 类放 `iteration: null` 而非某迭代——两个迭代之间无活跃迭代时 B 类照样有家，与 `b-tasks.md` 同为项目级。

---

## Step 5：记入 b-tasks.md

在 `b-tasks.md` 追加一行：

```markdown
| {task-id} | {target-source} | {urgency} | {任务标题} | [可取] | {YYYY-MM-DD} |
```

---

## Step 6：移交

执行 commit + push，任务包对所有协作者可见：
```bash
git add b-queue/{task-id}.md b-tasks.md status.yml
git commit -m "chore(dispatch): 派发 {task-id}（{target-source}/{urgency}）"
git push origin master
```

```
✅ dispatch-new 完成：{task-id}（{target-source} / {urgency}）已写入 queue，等待 develop 拾取。
```

**`urgency=hotfix` 时额外输出**：
```
⚠️ hotfix 任务，请立即通知相关 develop 执行人优先拾取 {task-id}。
```

---

## 上下文管理

本 task 无需断点续做——任务包写入 queue 后即完成，状态持久化在文件中。

**同一 bug 重复报告时**：先读 `b-tasks.md` 确认是否已有对应条目；有则在已有条目的任务包 `known-risks` 追加频次备注，不新建任务包。
