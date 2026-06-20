# exec: plan-sprint

> 任务：读 TRD 拆 develop 任务，写任务包入 queue，输出 sprint.md，签 G3。三层：**骨架**（任务清单对齐）→ **结构层**（完整任务包）→ **收尾**（sprint.md + G3）。
> 任务包套结构化模板 `../hact-method/templates/queue/task-package.md`——**模板已带 17 字段格式、AC 回链 tag、例子写法、reference 行号规则；本文只讲过程与判断，不重抄格式**。`check-sprint.js` 据模板 parse。

**上下文密度**：高。读多份文件、写多份任务包；骨架确认前不写任务包。

---

> **步骤协议**：每步完成输出 `✅ [步骤] 完成：[2–3 句结论] → 下一步：[步骤] — [一句说明] 继续？`；🚫 处等用户明确回应才继续。

---

## 会话启动

**前置：G2 是否已签** — 读 `iterations/vN/gates.md`：未签 → 阻断「⚠️ G2 未通过，TRD 未确认，先完成 draft-tech-design 再规划 Sprint」；已签 → 继续。

**必读文件**（Explore subagent 并行读）：
- `iterations/vN/prd.md`（AC 来源——任务包 AC 须回链至此，G2 后开发链中段唯一回看 PRD 的窗口）
- `iterations/vN/trd.md`
- 项目根 `standards-shared.md` / `standards-frontend.md` / `standards-backend.md`
- `reusables.md`（避免任务包重复指派已有实现）
- `decisions.md`
- `iterations/vN/ux-flows.md`（若存在，供前端任务包 `reference`）

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

🚫 等用户选择后再继续。选 [1] → 继续（疑点 → 任务骨架）；选其他 → 按描述加载对应 exec spec。

开场：「分三层完成 sprint 规划：先出疑点清单 + 任务骨架等你确认，确认后再写完整任务包。骨架确认前不写任务包。」

---

## 第一层：骨架

### Step 1：疑点清单

读完 TRD 列出实现边界不清晰的点（格式同 draft-tech-design Step 1）。无疑点明确说"已通读，无疑点"。

🚫 等用户逐条确认疑点

---

### Step 2：输出任务骨架

疑点确认后输出骨架——**每任务只一行**，不写详细字段：

```markdown
## Sprint 骨架 · v{N} · {项目名}

| task-id | 标题 | layers | 依赖 | 交付 |
|---------|------|--------|------|------|
| {name}-v{N}-001 | {一句话描述} | backend | — | 独立 |
| {name}-v{N}-002 | {一句话描述} | backend | — | 批量 |
| {name}-v{N}-003 | {一句话描述} | frontend | {name}-v{N}-001 | 批量 |
```

任务 ID：`{项目缩写}-v{N}-{三位序号}`，如 `auth-v1-001`。
某 TRD 模块耦合过深、拆不成独立 develop 任务 → 先写一个大任务包，在其 `known-risks` 标耦合点，不强拆。

🚫 等用户确认拆分合理性（粒度 / 依赖 / 遗漏 / 交付方式）

---

### Step 2.5：判断交付方式

**骨架确认后、写任务包前**，对 `依赖` 列非 `—` 的任务逐一判断，其余默认 `批量`。

**判断标准（针对被依赖的上游任务）**：

| 判断问题 | 结论 |
|---------|------|
| 下游需直接调用上游新增的 API 端点，且开发/自检时该端点必须实际存在于 master 才跑得通 | 上游 → `独立` |
| 下游引用上游新增的共享类型/接口定义，编译时必须依赖该定义 | 上游 → `独立` |
| 两任务逻辑相关但无代码级调用，或同属一 layer 可在同分支内按序实现 | 上游 → `批量` |

**含义**：`独立` = 单独建分支/PR、**合并 master 后**依赖它的任务才能开 develop 会话；`批量` = 与同 layer 其余批量任务合一个分支/PR 统一交付。

**输出确认**（逐条说理由）：

```
交付方式判断：
- {task-001}：独立 — 前端 {task-003} 调用其新增接口，必须先合并
- {task-002}：批量 — 与 {task-004} 同属后端，无跨 layer 调用关系
- {task-003}：批量 — 前端任务，等 {task-001} 合并后统一实现
继续写任务包？
```

🚫 等用户确认交付方式无误

---

## 第二层：结构层

### Step 3：逐个写任务包

骨架确认后，按 `specs-structural/develop.md §字段规范` 套 `../hact-method/templates/queue/task-package.md`（YAML frontmatter，`check-sprint.js` 据此 parse）为每任务写完整 17 字段包。**模板注释已含字段格式 / AC 回链 tag / 例子写法 / reference 行号规则——本文只讲模板讲不了的判断与跨文件来源**：

- **数量策略**：≤4 个主线逐个写；>4 个启动并行 subagent（每个 2–3 包，见 Subagent 使用）。每包写入 `iterations/vN/queue/{task-id}.md`，状态 `[可取]`。
- **depends_on 来源**：填 Step 2 已确认的依赖（与 sprint.md 依赖列、status.yml `depends_on` 三处一致）。共享资产消费（多任务共用同一表/枚举/共享类型）也走 `depends_on`——消费方指向 source-of-truth 任务，不另存消费方列表（反查得出）。
  > 团队期加固（暂不做，记 `_meta/plans/方法论待议.md`）：Step 3.5 独审增「共享资产依赖完备性」一类——交叉比对各包 `files`，≥2 任务碰同一共享文件/表/枚举则校验 `depends_on` 边是否标全。单人串行本人有全局上下文，暂靠 Step 2.5 + 拾取顺序兜。
- **AC 回链 + 测试脊柱**：每条 `acceptance-criteria` 标覆盖的 PRD AC id `(源：PRD AC-nn)`（纯技术约束标 `(技术)`）；**不得凭 TRD 派生发明无来源 AC**——权威来源是 PRD。**backend（不可视区）任务**各条携带**精化后的 Given/When/Then 例子规格**——行为源 PRD 幕 1、技术精度（状态码/错误码/断言）源 TRD 幕 2 接口段精化，供 develop 物化成可运行测试（任务包只携例子规格文本，**不预写 runnable**，物化点在 develop）；前端任务维持散文 AC。某条 backend AC 回链对不上（PRD 缺幕 1 / TRD 缺幕 2）→ 写包时即发现，回 `revise-doc(target=prd / trd)` 补，不在本会话硬造。
- **reference 跨文件锚点**：前端任务 reference 链 `ux-flows.md` 对应场景段、后端任务 reference 链 TRD **错误码清单段 + `# 服务流程：{场景名}` 段**（后端失败回退/状态分支/校验分支的权威来源是 TRD，不是 ux-flows——draft-ux 红线把后端校验排除在外）。**前后端用同一场景名对齐**：前端 UI 反馈与后端校验/状态对同一条分支不重不漏。（行号格式由模板规定、`check-sprint` 机械卡。）
  > 机械卡边界：`files` 行号"已知则填"（目标文件尚未写出，不机械核）；`relevant-standards` 是否覆盖 `files` 所属强制规范属语义判断（standards 无"文件类型→规范"映射表，机械查不了），移交 Step 3.5 第④类。
- **api-contract 推导**（每个 `layers=[backend]` 且被前端依赖的任务）：来源 = `trd.md`（数据模型）+ `standards-frontend.md`（组件字段需求）+ 已写前端任务包草稿（表格列/表单字段）；request 侧取 TRD query/body，response 侧取前端实际消费字段（平铺规则在模板）。**确认节点**：所有后端包写完后，列全部 api-contract 统一向用户确认「字段结构是否符合预期」，确认后再继续。

**写包自检**（linter 兜底，此处提前自查、早发现）：17 字段无空（`api-contract` 仅 backend 且有前端消费时填）；AC 双向对账（纵向每条回链某 PRD AC / 横向 PRD 每条 AC 被某包覆盖）**已由 check-sprint 逐条机械核（Step 4.7）**，此处顺手早发现失配即补、不静默放过；逐条**忠实性**（内容真覆盖回链的那条 PRD AC，非仅 id 在场）是语义，留 Step 3.5 + 签字人。

```
✅ 任务包写完：共 [N] 个，全部入 queue。
→ 下一步：任务包独立对抗审查
继续？
```

---

### Step 3.5：任务包独立对抗审查

任务包是 develop 唯一消费的工单、杠杆最大的产物，但前面字段自检 / AC 对账都是 CC 自审。此处补一道**独立眼睛**——派从未参与写作的 sub-agent 对抗审查，在源头堵"任务包 AC 偏离 PRD"，确保下游 develop 据任务包 AC 写的测试在验**正确的东西**（不可视区 AC 的例子忠于 PRD，测试才不会"测得很对却测错了需求"）。

**派发**：派一个全新 subagent，令其读 `../hact-method/templates/review-briefs/task-package-review.md` 按 brief 执行，只告知本期迭代版本 vN——subagent 据 brief **自读** prd.md / trd.md / standards / queue（隔离上下文，不传写包叙事与拆分理由）。任务包 >4 个**按包分批**派，利于 loop 收敛。
> brief 查四类（**AC 忠实性 / AC 完备性 / api-contract 推导正确性 / relevant-standards 覆盖**），默认假设"任务包有问题"、输出问题清单非盖章。审查维度原文固化在 brief 文件、改维度去改 brief（单一来源），此处不重述。

**【loop 逻辑】**（主线拿到 subagent findings 后的处置）

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

套模板 `../hact-method/templates/sprint.md` 汇总生成 `iterations/vN/sprint.md`——每行对应 queue/ 一个任务包（task-id / title / layers / 依赖 / 状态 `[可取]` / PR `—` / 交付），附「## 依赖说明」段（批量任务 blocked-by 独立任务 + 一句话原因）。

> 多迭代并行（vN 与 vN+1 同时有任务）时各迭代各写自己的 `iterations/vN/sprint.md`，queue 天然隔离于各自迭代目录，互不干扰。

---

### Step 4.5：填充 status.yml 的 tasks[]

把本期全部任务追加进项目根 `status.yml` 的 `tasks[]`（机器侧状态契约，项目级单文件，字段见 `../hact-method/skeleton/07-status-contract.md`；不存在则先从 `../hact-method/templates/status.yml` 补建）。

每任务一条：`source: sprint`、`type: develop-sprint`（source=sprint 推得）、`iteration: vN`、`sprint: {编号}`，初始 `status: 可取`、`assigned_to: null`、`pr: null`，其余字段（id / title / discipline / layer / parent_id / depends_on / delivery / urgency）取自刚写的任务包与 sprint.md。

> 「状态 vs 文件」分离的落点：sprint.md 是人看的视图，status.yml 是 hact-app 取数唯一来源；任务包正文（17 字段）不进 YAML，hact-app 用到时走 API 现拉。

---

### Step 4.7：签 G3 前 · 完成判据自检（提前跑，门卫兜底）

签 G3 前主动在项目仓根跑 `node scripts/check-sprint.js vN`，把 G3 全部【linter】判据机械核到绿：17 字段完备 / `reference` 含行号（前端 ux-flows、后端 trd 条目）/ AC 带 `(源：PRD AC-nn)`·`(技术)` 回链 tag + 逐条 id 存在性 + 逐条反向覆盖 / `depends_on` 在册 / queue↔sprint.md↔status.yml 三方一致。红 → 按报告逐条修任务包、重跑到绿。这步是**提前自查**；Step 5 签字 commit 时 pre-commit 门卫会再跑一遍、红则拦 commit——"跳过 linter 偷偷签字"机制上做不到，故不再写强制散文。

脚本 `🧑` 段语义残量由签字人确认：疑点已逐条确认、TRD 每模块都有任务包、Step 3.5 独审无遗留阻断、任务包 AC 逐条**忠实**于回链的 PRD AC（内容真覆盖，非仅 id 在场）。

> 与 Step 3.5 独审互补：独审深查任务包对 PRD/TRD 保真（是其中一条语义判据），由 `🧑` 段提示复核。
> 存量项目（无 `scripts/check-sprint.js` 且门卫未装，或任务包仍是旧序列化格式）→ 退回 `../hact-method/skeleton/06-gates.md` §7 G3 段人工逐条核对兜底，并提示新 sprint 套 `templates/queue/task-package.md`。

---

### Step 5：G3

> **签字前置**：Step 4.7 已自检（`🧑` 段语义残量已确认）。结构 linter 由签字 commit 的 pre-commit 门卫强制兜底，无需重述"退出码 0 才签"。

```
✅ Sprint 规划完成：[N] 个任务包入 queue，sprint.md 已生成，依赖已标注。
要签 G3 吗？
```

🚫 等用户确认

用户确认 → 写 `iterations/vN/gates.md`：`- [x] G3：开发包就绪 — {YYYY-MM-DD}`。

**更新 status.yml**：`iterations.vN.gates.G3` 改为 `{ signed: true, date: {YYYY-MM-DD} }`（tasks[] 已在 Step 4.5 填好）。

`git add iterations/vN/queue/ iterations/vN/sprint.md iterations/vN/gates.md status.yml && git commit -m "feat(sprint): v{N} sprint 规划完成，G3 签署 [{项目名}]" && git push`

**feedback 检查（签 G3 后）**：疑点超 3 条且根因集中（如 TRD 某类接口描述普遍不完整）/ 拆分中发现 TRD 多处遗漏需反复修订 → 写 `feedback.md`（`{日期} | {发现} | {建议}`）；无则跳过。

移交：「Sprint 已规划，开发者可从 queue 拾取任务，下一步 `develop`。」

---

## Subagent 使用

| 触发点 | Subagent 任务 | Prompt 要点 | 失败处理 |
|--------|-------------|------------|---------|
| 会话启动 | Explore 并行读 6 份输入文件 | — | 读取失败则主线单独读 |
| Step 3（任务 >4 个） | 并行 subagent 各写 2–3 个任务包 | 传入：task 标题 / layers / task_type / sprint_id / TRD 对应模块 / standards 相关章节 / reusables 相关条目；输出完整 17 字段 YAML | 失败则主线接管该包 |
| Step 3.5 独立审查 | 独立 sub-agent 审任务包保真，维度见 brief `../hact-method/templates/review-briefs/task-package-review.md` | 令 subagent 读该 brief 自执行（自读 prd/trd/standards/queue），只告知 vN；任务多则按包分批 | 同一阻断 3 次→上报；根因在 TRD 则创 `revise-doc(target=trd)` |

**重要**：subagent 只返回任务包内容，**由主线写入文件**，不让 subagent 直接操作文件系统。

---

## 上下文管理

- Step 2（骨架确认后）做一次 compact 再写任务包——骨架确认是探索讨论的天然终点，任务包写作需跨任务保持依赖与字段一致。
- compact 前在 `_meta/sessions/plan-sprint-progress.md` 记：任务骨架表（task-id / 标题 / layer / 依赖）+ 疑点清单各条答案摘要。
- Step 3.5 独审 + 修包在 compact 后高密度区；修包若需回看 PRD 细节而上下文已瘦 → 重读 `prd.md` 对应功能段再改，不凭记忆。

**断点续做**：读 `queue/` 统计已写任务包数 → 读 `_meta/sessions/plan-sprint-progress.md` 取骨架表，对照找未写任务 → 从未完成的任务包继续。
