# exec: dispatch-new

> 运行时加载本文时，当前任务是处理一条 B 类入口：收到 bug 报告或优化需求，判断是否属于 B 类，写任务包入 queue，记入 b-tasks.md。
> 本 task 是轻量派发任务，通常 10 分钟内完成。

**上下文密度**：低。不加载代码，按需读 trd.md（判断是否涉及接口 schema 变更）。

---

## 红线

- **B 类判定有疑问时，倾向升级 A 类**：宁可多走流程，不遗漏产品决策
- **intent/oracle 写不清不写任务包**：bug 复现路径不清晰或 optimization 判据不可验证时先追问；普通 example 可省。无法复现的 bug 记为 evidence-gap，不伪装成 behavior-bug
- **`urgency=hotfix` 写完立即通知**：不等积累，立即告知相关 develop 执行人优先拾取

---

> **步骤协议**：每步完成输出 `✅ [步骤] 完成：[2–3 句结论] → 下一步：[步骤] — [一句说明]` 后**直接继续**（非 🚫 步骤不问"继续？"、不等回应）；🚫 处必须停下等用户明确回应；⚖️ 处按既定规则默认判定，输出结论 + 理由后直接继续，用户可随时推翻（推翻则修正后再继续）。

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
5. 不应被影响的相邻行为（举例；不确定可留空，下一步 AI 会补提）
```

**`target-source=optimization`**：
```
请提供：
1. 改进目标（想达到什么效果）
2. 当前状态（基线指标，如有）
3. 验收标准（怎么算做成了，需可观测 / 可验证）
4. 不应改变的现有行为（举例；不确定可留空，下一步 AI 会补提）
```

**`layer=frontend` 额外（两个 source 均适用）**：对应画面 / 交互在 `design.md` 的节点或 `prototype.html` 的路径（不确定可留空）。

🚫 等用户提供信息；收到回答后先判断能否写清 intent 与可验证 oracle；不能则继续追问，禁止带模糊判据进下一步。

---

## Step 3：判断 urgency

| 条件 | urgency |
|------|---------|
| 影响核心功能且用户无法绕过 | `hotfix` |
| 其余 | `normal` |

---

## Step 3.5：行为契约草稿

AI 基于 Step 2 信息主动起草；循环直到用户明确确认后才进 Step 4。

```
行为契约草稿：

【AC】
intent: {用户可观察结果}
oracle: {可验证判据}
example: {可选；按 oracle 派生的封闭示例}
golden: false
（逐条列出；只有独立复算通过的封闭例子才可改为 golden: true）

【do-not 禁动边界】
- {不应受影响的相邻行为}
（AI 根据改动范围主动列出，用户确认 / 补充 / 删除）

【files 初步估填】
- {预计改动的文件 / 组件}

[layer=frontend 时额外输出]
【视觉参照】design.md §{节} / prototype.html {路径}
无对应规格时：明确写「无对应设计规格，以 do-not 边界为准」
```

写不出 intent/oracle → 返回 Step 2 追问；只缺 example 不阻断。

🚫 等用户确认；有修正则更新后重提，直到明确确认

---

## Step 4：写任务包

按 `specs-structural/develop.md §字段规范` 写完整任务包（全部字段），写入 `b-queue/{task-id}.md`，状态 `[可取]`。

关键字段确认（写完对照检查）：

| 字段 | 要求 |
|------|------|
| `task-id` | `{项目缩写}-b-{三位序号}`，如 `hact-b-001` |
| `source` | 与 `target-source` 一致（`bug` 或 `optimization`） |
| `urgency` | Step 3 判断结果 |
| `risk` | 默认 `standard`；若触及权限/认证/数据隔离、不可逆数据操作、金额/计费计算、对外不可撤销副作用，则填 `sensitive`；**存疑即 sensitive**（只升不降，决策#29——B 类无 G3 检查器，误标由 develop 有效 risk 判定 + 末端 diff 独立预检兜底） |
| `acceptance-criteria` | 按 `intent-oracle-v1` 写 Step 3.5 确认的 intent/oracle；example 可选，未经独立复算保持 `golden: false`。纯加法 schema 变更另加技术 AC 指向已更新 TRD 章节 |
| `do-not` | 直接使用 Step 3.5 确认的禁动边界列表 |
| `files` | Step 3.5 初步估填的预计改动文件 / 组件清单 |
| `known-risks` | bug 复现步骤不明确时在此标注；`urgency=hotfix` 且与当前 sprint 任务可能改动重叠文件时，标注冲突文件，由 develop 执行人协调合并顺序；**含纯加法 schema 变更时**必须写明：最坏情况 / 如何发现 / 如何回滚 |
| `api-contract`（条件） | 仅 `layers=[backend]` 且新增接口被前端消费时填，否则整段删除（与 develop §字段规范一致） |

**全部字段无空值方可写入 queue**（schema 变更**不另立字段**——落在上述 `acceptance-criteria` / `known-risks` / `api-contract`，与 develop §字段规范单一真相对齐）。

**同步往项目根 `status.yml` 的 `tasks[]` 追加一条**（机器侧状态契约，B 类为项目级、跨迭代——`source: {bug/optimization}`、`type: develop`、`iteration: null`、`sprint: null`、`delivery: null`、`status: 可取`，`urgency` 取 Step 3 结果；字段见 `../hact-method-lab/skeleton/07-status-contract.md`；文件不存在则先从 `../hact-method-lab/templates/status.yml` 补建）。

> B 类放 `iteration: null` 而非某迭代——两个迭代之间无活跃迭代时 B 类照样有家，与 项目根 `b-tasks.md` 同为项目级。

---

## Step 5：记入 b-tasks.md

在 项目根 `b-tasks.md` 追加一行：

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
✅ dispatch-new 完成：{task-id}（{target-source} / {urgency}）已写入 b-queue，等待 develop 拾取。
```

**`urgency=hotfix` 时额外输出**：
```
⚠️ hotfix 任务，请立即通知相关 develop 执行人优先拾取 {task-id}。
```

---

## 上下文管理

本 task 无需断点续做——任务包写入 queue 后即完成，状态持久化在文件中。

**同一 bug 重复报告时**：先读 项目根 `b-tasks.md` 确认是否已有对应条目；有则在已有条目的任务包 `known-risks` 追加频次备注，不新建任务包。
