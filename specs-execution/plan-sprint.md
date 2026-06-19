# exec: plan-sprint

> CC 加载本文时，当前任务是读 TRD 拆任务、写任务包入 queue、输出 sprint.md，签 G3。
> 三层顺序：**骨架**（任务清单对齐）→ **结构层**（完整任务包）→ **收尾**（sprint.md + G3）

**上下文密度**：高。需读多份文件，写多份任务包。骨架确认前不开始写任务包。

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

**前置检查：G2 是否已签**

读 `iterations/vN/gates.md`：
- G2 未签 → 阻断：「⚠️ G2 未通过，TRD 尚未确认，请先完成 draft-tech-design 再启动 Sprint 规划。」
- G2 已签 → 继续

**必读文件**（Explore subagent 并行读取）：
- `iterations/vN/prd.md`（AC 来源——任务包 AC 须能回链到此，G2 后开发链中段唯一回看 PRD 的窗口）
- `iterations/vN/trd.md`
- `iterations/vN/standards-shared.md`
- `iterations/vN/standards-frontend.md`
- `iterations/vN/standards-backend.md`
- `reusables.md`
- `decisions.md`
- `iterations/vN/ux-flows.md`（若存在，用于写前端任务包的 `reference` 字段）

**选项列表**（G2 已满足，确认要做什么）：

```
{项目名} · G2 已签，TRD + standards 已确认

可做的任务：
[1] plan-sprint — 拆任务包，规划 Sprint ← 主线

其他可做（输入「展开」/ 自由描述）：
- revise-doc(target=trd) — 若发现 TRD 或 standards 有需修订之处，先修再规划
- revise-doc(target=prd) — 若发现 PRD 有需修订之处

请选 [1]，或输入「展开」，或直接说你要做什么。
```

🚫 等用户选择后再继续

用户选 [1] → 继续下方步骤（读必读文件 → 疑点清单 → 任务骨架）
用户选其他 → 按用户描述判断，加载对应 exec spec 执行

开场说：「我将分三层完成 sprint 规划：先输出疑点清单和任务骨架等你确认，确认后再写完整任务包。骨架确认前不开始写任务包。」

---

## 第一层：骨架（任务清单对齐）

### Step 1：疑点清单

读完 TRD 后列出实现边界不清晰的点（格式同 draft-tech-design Step 1）。

无疑点时明确说"已通读，无疑点"。

🚫 等用户逐条确认疑点

---

### Step 2：输出任务骨架

疑点确认后，输出任务骨架——**每个任务只写一行**，不写详细字段：

```markdown
## Sprint 骨架 · v{N} · {项目名}

| task-id | 标题 | layers | 依赖 | 交付 |
|---------|------|--------|------|------|
| {name}-v{N}-001 | {一句话描述} | backend | — | 独立 |
| {name}-v{N}-002 | {一句话描述} | backend | — | 批量 |
| {name}-v{N}-003 | {一句话描述} | frontend | {name}-v{N}-001 | 批量 |
```

任务 ID 命名规则：`{项目缩写}-v{N}-{三位序号}`，如 `auth-v1-001`。

某 TRD 模块耦合过深、无法拆成独立 develop 任务时：先写一个大任务包，在其 `known-risks` 中标注耦合点，不强行拆分。

🚫 等用户确认任务拆分合理性（粒度 / 依赖关系 / 有无遗漏 / 交付方式）

---

### Step 2.5：判断交付方式

**在用户确认骨架之后、写任务包之前**，对每条 `依赖` 列不为 `—` 的任务逐一判断，其余任务默认 `批量`。

**判断标准（针对上游任务，即被依赖的那个任务）**：

| 判断问题 | 结论 |
|---------|------|
| 下游任务的代码需要直接调用上游新增的 API 端点，且在开发/自检时该端点必须实际存在于 master 才能跑通 | 上游 → `独立` |
| 下游任务引用上游新增的共享类型或接口定义，且编译时必须依赖该定义 | 上游 → `独立` |
| 两个任务逻辑相关但无代码级调用关系，或同属一个 layer 可在同一分支内按顺序实现 | 上游 → `批量` |

**交付方式的含义**：

- `独立`：该任务单独建分支、单独 PR、**必须合并到 master 后**，依赖它的任务才能开始 develop 会话
- `批量`：该任务与同 layer 其余批量任务合并在一个分支、一个 PR 里统一交付

**输出确认**（逐条说明判断理由）：

```
交付方式判断：
- {task-001}：独立 — 前端 {task-003} 调用其新增接口，必须先合并
- {task-002}：批量 — 与 {task-004} 同属后端，无跨 layer 调用关系
- {task-003}：批量 — 前端任务，等 {task-001} 合并后统一实现
继续写任务包？
```

🚫 等用户确认交付方式无误

---

## 第二层：结构层（完整任务包）

### Step 3：逐个写任务包

骨架确认后，按 `specs-structural/develop.md §字段规范` 为每个任务写完整 17 字段任务包。**套用 `../hact-method/templates/queue/task-package.md` 模板（YAML frontmatter 序列化）**——`check-sprint.js`（Step 4.7）据此 parse，旧的 markdown 段布局不再用。`depends_on` 无依赖写 `[]`（不留占位）；`api-contract` 不需要时整段删除（注释掉不算填）。

**字段完整性自检**（每包写完前对照 `specs-structural/develop.md §字段规范` 检查 17 字段，无空字段方可写入 queue；`layers=[backend]` 且有前端消费时，还须检查 `api-contract` 已填写）。

**depends_on 填写**：每个任务包的 `depends_on` 填入 Step2 骨架已确认的「依赖」（与 sprint.md「依赖」列、status.yml `depends_on` 三处一致），无依赖填 `[]`。共享资产消费关系（多任务共享同一表 / 枚举 / 共享类型）也走 `depends_on`——消费方指向 source-of-truth 任务，不另存消费方列表（消费方由反查得出）。
> 团队期加固（暂不做，记 `_meta/plans/方法论待议.md`）：Step3.5 独审增一类「共享资产依赖完备性」——交叉比对各任务包 `files`，≥2 任务碰同一共享文件/表/枚举则校验 `depends_on` 边是否标全。单人串行开发本人有全局上下文，暂靠 Step2.5 交付判断 + 既有拾取顺序兜。

**字段保真自检（机械可查，区别于上面的非空检查）**：
- `reference` 每条必含行号范围（如 `L142` 或 `142-160`）；填"全文"或无行号范围的不通过——reference 指向已存在的代码/文档，行号可查，必须精确
- `layers` 含 `frontend` 且 `ux-flows.md` 存在 → `reference` 必含 `ux-flows.md` 对应功能段的行号条目（把下方"前端任务 reference 字段补充"的"须补入"从无校验变成硬卡，堵住"手抄漏抄→develop 退化为 title 字面匹配"）
- `layers` 含 `backend` 的任务包 → `reference` 必含该接口在 TRD 的**错误码清单段 + `# 服务流程：{场景名}` 标注段**的行号条目，使后端失败回退 / 状态分支 / 校验分支进 develop 上下文（与前端 ux-flows 硬卡对称——后端失败分支的权威来源是 TRD，不是 ux-flows）
> `files` 行号**不在此卡**：它指向本任务将要改、可能尚未存在的目标文件，无法机械核对，维持"已知则填"（见 `specs-structural/develop.md §字段规范`）。
> `relevant-standards` 是否覆盖 files 所属强制规范，属语义判断（standards 无"文件类型→规范"映射表，机械查不了），移交 Step 3.5 独立审查第④类。

**AC 回链（PRD AC 溯源）**：每个任务包的 `acceptance-criteria` 每条须标注其覆盖的 PRD AC id，格式 `(源：PRD AC-nn)`（可选人读后缀 `(源：PRD AC-nn·删除二次确认)`，check-sprint 只读 `AC-nn`）；无 PRD AC 来源的纯技术约束（加索引 / DTO 校验 / 错误码对齐等）标 `(技术)`。不得凭 TRD 派生发明无来源的 AC——任务包 AC 的权威来源是 PRD。

**不可视区 AC 写成可执行例子**：对 **backend（不可视区）任务**，`acceptance-criteria` 各条以 `draft-tech-design` 在 TRD 接口段已操作化的 **Given/When/Then 例子**形式写入（输入→期望输出），供 develop 1:1 落成测试；仍带 `(源：PRD …)` 回链——**操作化是 PRD AC 的忠实翻译，不是 TRD 派生发明**（权威来源仍是 PRD，TRD 只提供可测形式）。TRD 未操作化某条不可视区 AC → 回链对不上，应在写包时发现并补（或回 `revise-doc(target=trd)`）。前端任务维持散文 AC。

**AC 双向对账自检**（全部任务包写完后、生成 sprint.md 前执行，缺一不可）：
- 纵向：每条任务包 AC 都能指回某条 PRD AC（或标 `(技术)`），无凭空发明
- 横向：PRD 每条 AC 都至少被一个任务包 AC 覆盖，无整条遗漏——**现由 check-sprint 据 AC id 逐条机械核（Step 4.7 linter 步），本处自审退为辅助/早发现**
- 不满足 → 列出失配项（漏覆盖的 PRD AC / 无来源的任务包 AC），向用户报告并补齐，不静默放过

> 切分：逐条**覆盖**（PRD AC-nn 有没有被引用）已机械（check-sprint）；逐条**忠实性**（任务包 AC 内容是否真覆盖其回链的那条 PRD AC，有无偏离/缩水/夹带）仍是语义，归 Step 3.5 独立审查 + 签字人。

**前端任务 reference 字段补充**：对 `layers` 含 `frontend` 的任务包，若 `ux-flows.md` 存在，`reference` 字段须补入 `ux-flows.md` 对应功能段的行号范围（格式与其他 reference 条目一致），使 develop 执行时可精确定位交互路径，不遗漏替代路径实现。

**后端任务 reference 字段补充**：对 `layers` 含 `backend` 的任务包，`reference` 字段须补入该接口在 `trd.md` 的**错误码清单段** + **`# 服务流程：{场景名}` 标注段**的行号范围，使 develop 实现后端时拿得到失败回退 / 状态分支 / 校验分支等替代路径，不只做 happy path（draft-ux 红线把后端校验排除在 ux-flows 外，后端分支的来源在 TRD）。
> **前后端对齐锚点**：前端 reference 链 `ux-flows.md` 的场景名、后端 reference 链 TRD 同名 `# 服务流程：{场景名}` 接口——同一场景名使前端（UI 反馈）与后端（校验/状态）对同一条分支不重不漏。

**api-contract 推导**（对每个 `layers=[backend]` 且被前端任务依赖的任务）：
- **来源**：同时参考 `trd.md`（数据模型）+ `standards-frontend.md`（组件字段需求）+ 已写的前端任务包草稿（表格列 / 表单字段）
- **request 侧**：从 TRD 接口描述中提取 query params 和 request body
- **response 侧**：从前端 standards / 任务包的 UI 描述中提取实际消费字段，**必须平铺**，不要嵌套（嵌套须注明原因）
- **确认节点**：所有后端任务包写完后，列出全部 api-contract 统一向用户确认：「以下接口的 api-contract 由前端消费需求推导，请确认字段结构是否符合预期」，等确认后再继续

**任务包数量策略**：
- ≤ 4 个任务 → 主线逐个写
- > 4 个任务 → 启动并行 subagent（每个 subagent 负责 2–3 个任务包，见 Subagent 使用）

每个任务包写入 `iterations/vN/queue/{task-id}.md`，状态 [可取]。

```
✅ 任务包写完：共 [N] 个，全部入 queue，字段自检通过。
→ 下一步：任务包独立对抗审查
继续？
```

---

### Step 3.5：任务包独立对抗审查

任务包是 develop 唯一消费的工单、杠杆最大的产物，但前面的字段自检 / AC 双向对账是 CC 自审（自己审自己写的）。此处补一道**独立眼睛**——派从未参与任务包写作的 sub-agent 对抗审查任务包：在源头堵住"任务包 AC 偏离 PRD"，确保下游 develop 据任务包 AC 写的测试本身就在验**正确的东西**（不可视区 AC 的 Given/When/Then 例子忠于 PRD，测试才不会"测得很对却测错了需求"）。

**【构建 prompt — 独立性约束】**

审查 sub-agent **只从 `queue/*.md` 读最终任务包产物**，传入：
- 全部任务包（queue 内本期所有 `[可取]` 包）
- PRD 全文（`iterations/vN/prd.md`）
- TRD（`iterations/vN/trd.md`）+ 三份 standards

禁止传递：写包过程的中间叙事、"为什么这么拆"的推导理由、骨架讨论记录——审查员只对照"需求事实 vs 产物"，不被规划思路带偏（只看需求事实与产物、不看生成过程，是独立审查的通则）。

任务包多时（> 4 个）**按任务包分批审**，不一次性全量塞入，利于 loop 收敛。

**【sub-agent mandate】**

```
你是一名独立审查员，从未参与这批任务包的拆分与写作。

【输入】
PRD（用户 G1 签字认可的需求事实，含各功能 Acceptance Criteria）：
{prd.md 全文}

TRD + standards（技术契约）：
{trd.md + standards 摘要}

任务包（待审产物）：
{queue 内全部任务包}

【默认假设】
任务包存在问题。你的任务是找出所有"产物不忠于需求事实"的地方，不是确认它对。

【逐类检查】（每类必须有明确结论，不允许跳过）

1. AC 忠实性：每条任务包 `acceptance-criteria` 是否忠实覆盖其回链的 PRD AC（`(源：PRD ...)`）？逐条比对两段文本——有无偏离、缩水、夹带 PRD 没有的要求、或把 PRD 一条 AC 实现成另一回事。标 `(技术)` 的无 PRD 来源条目，确认它确实是技术约束而非漏标的需求。
2. AC 完备性：PRD 每条 AC 是否都被至少一个任务包覆盖？逐条核对，找出整条遗漏的 PRD AC。
3. api-contract 推导正确性：`layers=[backend]` 且被前端消费的任务包，其 `api-contract` 的 response 字段是否覆盖了前端任务包 / standards 描述的全部消费字段？有无漏字段、类型错配、该平铺却嵌套。
4. relevant-standards 覆盖：每个任务包的 `relevant-standards` 是否覆盖了其 `files` 涉及文件应当适用的强制规范？按文件用途语义判断（如 controller 应含响应格式 / 入参验证规范，.vue 应含设计系统 / 组件规范等）。漏列会导致 develop 静默不加载该规范——逐包核对，指出漏列项。

【边界 — 不审以下，这些归用户确认 / 留下游】
- 任务拆分粒度、依赖方向、交付方式（独立/批量）——这是用户在 Step2/2.5 的决策权，你不得否决。
- `files` 字段行号是否精确——目标文件此刻尚未写出，无法核对，留 develop 阶段。

【输出格式】
每条 finding：
- 类别：{AC忠实性 / AC完备性 / api-contract / relevant-standards覆盖}
- 位置：{任务包 task-id / PRD 功能名}
- 问题：{具体描述，一句话}
- 严重程度：{阻断 / 建议}

某类无发现时明确写「{类别}：无发现」；全部无发现输出 findings: []。禁止输出「整体看起来不错」等总结性正面评价。
```

**【loop 逻辑】**

| sub-agent 输出 | 动作 |
|---|---|
| `findings: []` | 退出，进入 Step 4 |
| 只有 `[建议]` | 记入 `feedback.md`（供 wrap-up 分流）；退出，进入 Step 4 |
| 有 `[阻断]` | 主线修对应任务包（改 AC 回链 / 补漏覆盖的 PRD AC / 修 api-contract），重审 |
| 同一 `[阻断]` 修 3 次仍出现 | 停止 loop，上报用户；判断根因——若在 TRD（漂移点①：TRD 丢了 AC）则创建 `revise-doc(target=trd)`，不在本会话硬改 |

```
✅ 任务包独立审查完成：[findings: [] / 修复 {N} 条阻断后通过]，AC 忠于 PRD、无遗漏。
→ 下一步：生成 sprint.md 汇总视图
继续？
```

---

## 第三层：收尾

### Step 4：写 sprint.md

汇总生成 sprint.md：

```markdown
# Sprint v{N} · {项目名}

| task-id | title | layers | 依赖 | 状态 | PR | 交付 |
|---------|-------|--------|------|------|----|------|
| {id} | {标题} | backend | — | [可取] | — | 独立 |
| {id} | {标题} | backend | — | [可取] | — | 批量 |
| {id} | {标题} | frontend | {依赖 id} | [可取] | — | 批量 |

## 依赖说明
- {task-id}（批量）blocked-by {task-id}（独立）：{原因一句话，说明为何必须先合并}
```

> 多迭代并行（vN 与 vN+1 同时有任务）时，各迭代各写自己的 sprint.md（`iterations/vN/sprint.md` / `iterations/vN+1/sprint.md`），queue 天然隔离于各自迭代目录，互不干扰。

---

### Step 4.5：填充 status.yml 的 tasks[]

把本期全部任务追加进项目根 `status.yml` 的 `tasks[]`（机器侧状态契约，项目级单文件，字段见 `../hact-method/skeleton/07-status-contract.md`；文件不存在则先从 `../hact-method/templates/status.yml` 补建）。

每个任务一条，`source: sprint`、`iteration: vN`、`sprint: {编号}`，初始 `status: 可取`、`assigned_to: null`、`pr: null`，其余字段（id / title / type / discipline / layer / parent_id / depends_on / delivery / urgency）取自刚写的任务包与 sprint.md。

> 这是「状态 vs 文件」分离的落点：sprint.md 是人看的视图，status.yml 是 hact-app 取数的唯一来源；任务包正文（17 字段）不进 YAML，由 hact-app 用到时走 API 现拉。

---

### Step 4.7：签 G3 前 · 完成判据核对

执行 `../hact-method/skeleton/06-gates.md` §7「完成判据核对」**G3 段**，`Gate=G3`：在项目仓根目录跑 `node scripts/check-sprint.js vN`。退出码 0 = G3 全部【linter】判据通过（任务包 17 字段完备 / `reference` 含行号（前端 ux-flows、后端 trd 条目）/ AC 带 `(源：PRD AC-nn)`/`(技术)` 回链 tag + 逐条 id 存在性 + 逐条 AC 反向覆盖 / `depends_on` 在册 / queue↔sprint.md↔status.yml 三方一致）；退出码 1 → 按报告逐条修任务包、重跑到 0，**不得手改报告、不得跳过**。

脚本 `🧑` 段列出的**语义残量**由签字人确认：疑点清单已逐条确认、TRD 每模块都有任务包、Step 3.5 独审无遗留阻断、任务包 AC 逐条**忠实**于其回链的 PRD AC（内容真覆盖，非仅 id 在场）。

> 与 Step 3.5 独审互补：独审深查任务包对 PRD/TRD 保真（是其中一条语义判据），由上面 `🧑` 段提示复核。
> 存量项目（无 `scripts/check-sprint.js`，或任务包仍是旧序列化格式）→ 退回 §7 G3 段人工逐条核对兜底，并提示新 sprint 套用 `templates/queue/task-package.md`。

---

### Step 5：G3

> **签字前置**：Step 4.7 `check-sprint.js` 退出码 0（或存量兜底已人工逐条核对），`🧑` 段语义残量已确认。

```
✅ Sprint 规划完成：[N] 个任务包已入 queue，sprint.md 已生成，依赖关系已标注。
要签 G3 吗？
```

🚫 等用户确认

用户确认 → 写 `iterations/vN/gates.md`：
```markdown
- [x] G3：开发包就绪 — {YYYY-MM-DD}
```

**更新项目根 `status.yml`**：将 `iterations.vN.gates.G3` 改为 `{ signed: true, date: {YYYY-MM-DD} }`（tasks[] 已在 Step 4.5 填好）。

执行 `git add iterations/vN/queue/ iterations/vN/sprint.md iterations/vN/gates.md status.yml && git commit -m "feat(sprint): v{N} sprint 规划完成，G3 签署 [{项目名}]" && git push`

**feedback 检查**（签 G3 后）：
- 疑点清单超过 3 条且根因集中（如 TRD 某类接口描述普遍不完整）→ 写入 `feedback.md`（格式：`{日期} | {发现} | 建议在 draft-tech-design 的疑点确认步骤中加强 {哪类场景}`）
- 任务拆分过程中发现 TRD 有多处遗漏，需要反复修订 → 写入 `feedback.md`
- 无发现 → 跳过

移交：「Sprint 已规划，开发者可开始从 queue 拾取任务，下一步 `develop`。」

---

## Subagent 使用

| 触发点 | Subagent 任务 | Subagent Prompt 要点 | 失败处理 |
|--------|-------------|---------------------|---------|
| 会话启动 | Explore 并行读 6 份输入文件 | — | 读取失败则主线单独读 |
| Step 3（任务 > 4 个） | 并行 subagent 各写 2–3 个任务包 | 传入：task 标题 / layers / task_type / sprint_id / TRD 对应模块 / standards 相关章节 / reusables 相关条目；输出完整 17 字段 YAML | 失败则主线接管该包 |
| Step 3.5 独立审查 | 独立 sub-agent 审任务包对 PRD/TRD/standards 保真（AC忠实性 / AC完备性 / api-contract / relevant-standards覆盖） | **只读 queue 最终产物 + PRD/TRD/standards**，禁传写包叙事与拆分理由；任务多则按包分批 | 同一阻断 3 次→上报；根因在 TRD 则创 `revise-doc(target=trd)` |

**重要**：subagent 只返回任务包内容，**由主线负责写入文件**，不让 subagent 直接操作文件系统。

---

## 上下文管理

- Step 2（任务骨架确认后）做一次 compact，再开始写任务包——骨架确认是探索讨论阶段的天然终点，任务包写作需要跨任务保持依赖关系和字段一致性
- compact 前在 `_meta/sessions/plan-sprint-progress.md` 记录：任务骨架表（task-id / 标题 / layer / 依赖）+ 疑点清单各条答案摘要
- Step 3.5 独立审查 + 修包发生在 compact 之后的高密度区；修包若需回看 PRD 细节而上下文已瘦，重读 `prd.md` 对应功能段再改，不凭记忆修

**断点续做**：
- 读 `queue/` 目录，统计已写任务包数量
- 读 `_meta/sessions/plan-sprint-progress.md` 获取任务骨架表，对照找出未写的任务
- 从未完成的任务包继续
