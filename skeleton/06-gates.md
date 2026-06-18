# 06 — Gates

> **本文回答**：5 个 Gate 是什么？怎么由 task 状态聚合？A 类 vs B 类有什么差别？多迭代并行下怎么展示？
>
> **不回答**：每个 task 是什么（→ `04-task-catalog.md`）；任务状态枚举与流转（→ `05-state-machine.md`）；身份/拉取（→ `01-identity.md`）；工作区（→ `02-workspaces.md`）。

---

## 1. 5 个 Gate 内涵

| Gate | 内涵 | 签于哪个 task |
|---|---|---|
| **G1** | 本期 PRD 通过——产品需求清晰、用户故事完整、acceptance criteria 制定 | `draft-prd-vN` 任务尾部 |
| **G2** | 本期技术设计通过——TRD（接口/数据结构）+ 3 份 standards 完成 | `draft-tech-design` 任务尾部 |
| **G3** | 开发包就绪——sprint 拆解完成、queue 写满、任务依赖明确 | `plan-sprint` 任务尾部 |
| **G4** | 开发完成——所有开发任务 [merged]、联调通过、人工验收通过 | `manual-test` 任务尾部 |
| **G5** | 迭代收尾——偏离对账 + feedback 分流 + project.md 合并 完成 | `wrap-up-iteration` 任务尾部 |

签字行为：每个含 Gate 的 task 在 spec 末尾询问"要不要签 G_n"——签了即设 Gate 状态字段为已签。具体见 `04-task-catalog.md` 各 task 条目。

---

## 2. Gate 是任务集合的聚合视图

Gate 不是独立的实体——它是**一组 task 的状态聚合**。

每个 Gate 的"已签"判定 = **关联任务集合全部 [merged]** **AND** **Gate 签字字段已设**：

| Gate | 关联任务集合 |
|---|---|
| **G1** | 本期 `draft-prd-vN` [merged] + 任意 `revise-doc(target=prd)` [merged]（如有） |
| **G2** | 本期 `draft-tech-design` [merged] + 任意 `revise-doc(target=trd\|standards)` [merged]（如有） |
| **G3** | 本期 `plan-sprint` [merged] |
| **G4** | 本期所有 `develop(source=sprint)` [merged] + `generate-integration-tests` [merged] + 所有 `develop(source=integration)` [merged] + `manual-test` [merged] + 所有 `develop(source=manual-test)` [merged] |
| **G5** | 本期 `wrap-up-iteration` [merged] + 本期 `deploy` [merged]（部署失败 / 纯文档迭代不阻断 G5 签字，见下注） |

注：`revise-doc` 在 G1/G2 关联里以"任意"出现——意思是 G1/G2 已签后再发生的 revise-doc 不撤销 Gate（详见 §6），但 revise-doc 自身仍要走 `[merged]` 才结束。

注：`deploy` 在 G5 关联里**不阻断签字**——deploy 与 `wrap-up-iteration` 并行、无强依赖，部署失败或纯文档迭代（无需部署）时，只要收尾三步完成即可签 G5（详见 `specs-execution/wrap-up-iteration.md` 第三步「project.md 合并」状态标注 + 顶部说明）。

---

## 3. Gate 子状态（前台展示）

子状态用于 UI 显示（hact-app），**不是状态机层面的状态**——状态机管单 task（详见 `05`），Gate 子状态是 task 集合的聚合查询结果。

| 子状态 | 判定条件 |
|---|---|
| **未开始** | 关联任务都 `可取`，或前置 Gate 未签（前置不满足，任务还不会触发） |
| **进行中** | 至少一个关联任务 `taken-by` 或 `done` |
| **阻塞** | 至少一个关联任务长期无进展，或异常转移频繁（具体阈值由 hact-app 实施时定）|
| **待签** | 关联任务集合全部 [merged]，但 Gate 签字字段未设 |
| **已签** | Gate 签字字段已设（含签字人 + 时间戳）|

子状态服务于 hact-app 的"Gate 时间线"展示——给所有人一眼看到"本期到哪一步了"。底层数据是 task 状态的聚合查询，不存独立字段。

---

## 4. A 类 vs B 类

| 维度 | A 类（完整迭代） | B 类（BUG / 优化） |
|---|---|---|
| Gate | G1-G5 全跑 | **无 Gate** |
| 入口 task | `init-project`（首次）/ `draft-prd-vN`（vN > v1） | `dispatch-new` |
| 流程 | 线性段（G1→G2→G3）+ 开发循环（G4 期）+ 收尾（G5）| 单任务流：dispatch-new → develop → merged → 部署 |
| 部署时机 | G4 已签后（默认合并部署）| hotfix 立即 / normal 等下次合并部署 |
| 总账文件 | `iterations/vN/gates.md`（Gate 签字状态）| `b-tasks.md`（项目内所有 B 类任务总账，恒定 2 会期）|
| 多迭代并行 | A 类一次只能一个迭代在 dispatch（vN+1 不早于 vN G4）| 不受 A 类约束，常态运行 |

**B 类没有 Gate 的原因**：

- B 类任务（BUG / 优化）是**单点工作**——一个任务从 `dispatch-new` 创建，到 `develop` 完成，到部署
- 没有"阶段性签字"的需要——单任务 [merged] 就是终态
- 复杂的 Gate 概念（如 G3 准备就绪、G4 联调验收）需要的是"一组任务都做完"——B 类没有这个集合概念

---

## 5. 多迭代并行的 Gate 展示

A 类约束（来自 BRIEF.md）：**vN+1 的 dispatch 阶段不早于 vN 的 G4 完成**——意味着同时只有一个迭代在"开发循环 + 收尾"段。

**但准备段（G1-G3）可以早起**：

- vN G4 期（开发循环）时，vN+1 可以并行做 G1（PRD 起草）+ G2（TRD/standards）+ G3（sprint 拆解）
- 一旦 vN G4 完成，vN+1 自然进入开发循环——无缝衔接

**UI 展示**（项目根 / hact-app）：

- 多迭代分组视图：每个迭代独立的 Gate 时间线
- 跨迭代依赖明示：vN+1 G3 待签状态显示"前置：vN G4 完成中"
- 推荐"压缩并行"——准备段并行，开发段串行

---

## 6. Gate 跟修订的关系

**已签的 Gate 不撤销**——即使后期通过 `revise-doc` 修订了 PRD/TRD/standards：

- G1 已签 + 之后 `revise-doc(target=prd)` → G1 仍是"已签"，但 PRD 内容更新；revise-doc 自身要走 `[merged]` 才结束
- 这种设计避免"已经走到 G3 还要回头折腾 G1 状态"的混乱
- 修订记录在 `backlog.md`，给 `wrap-up-iteration`（G5 阶段）反向更新参考

为什么不撤销？因为 Gate 签的是"在这个时刻产物已通过审视"，是历史事实；后续修订是新的事件，不重写历史。`backlog.md` + revise-doc 任务包构成完整的变更追溯。

---

## 7. 签 Gate 前 · 完成判据冷核协议

> 适用 G1–G5 全部 5 个 Gate。本节是**单一来源**：各 task 的 `specs-execution` 在签字步骤前只插一短步骤引用本节（带 `Gate=G{N}`），不重抄正文——避免 5 份拷贝各自漂移（这正是本协议要防的病）。

**为什么需要**：写产物的会话 = 签 Gate 的会话。同上下文自评易被锚定盖章；最新完成判据即便在上下文里，也常按"这类产物大概长这样"的印象填、逐条漏核（典型：判据要求的字段被静默跳过）。本协议用**隔离上下文的陌生 subagent** 抵消锚定，把"判据没被完整执行"挡在签字前。

**软版边界（当前形态）**：本协议是**软步骤**——靠执行规范被遵循 + 人在签字现场抽看凭证兜底，**无机械闸门**。它堵不住"主会话整步跳过"或"把 FAIL 洗成 pass"，那两种只能靠下面 🚫 的人工抽看。机械硬闸（hook 拦签字、产物 linter）为后续增强，设计见 `_meta/plans/2026-06-18-gate-criteria-cold-check/design.md`。

### 协议步骤（签 G{N} 前执行）

1. **派一个全新 subagent**（未参与本 task 产物生成）。只喂三样：
   - 本 task **产物**（签字 commit 将纳入的文件）；
   - 本 task **完成判据原文**（`specs-structural/{task}.md` 的「完成判据」节）；
   - 判据逐条对照所需的**源**（如 prd.md / trd.md / standards / ux-flows.md，按判据需要）。
   - **不喂**：本会话生成过程、决策理由、拆分叙事——隔离上下文是冷核有效的前提。
2. **逐条对抗核对**：对每条完成判据，尝试证伪、拿不准判 `FAIL`；每条用产物里的**具体原句 / 位置**作证据。两类判据特殊处理：
   - "G{N} 已签"与"完成判据已冷核"这两条**不自核**（签字在本步之后、冷核即本步）；
   - **人驱动**判据（如"用户明确说验收通过""feedback.md 已分流由人确认"）标 `N/A·人工`，subagent 不替人判定。
3. **subagent 自写凭证**到 `iterations/vN/gate-checks/G{N}.md`（subagent 直接落盘，主会话不经手结论，杜绝"把 FAIL 洗成 pass"）：
   ```markdown
   # G{N} 完成判据冷核 · v{N} · {YYYY-MM-DD}
   产物指纹：{文件名}@{git blob 或内容 hash}
   - [pass]      判据①：{判据原文} —— 证据：{产物原句/位置}
   - [fail]      判据②：{判据原文} —— 缺口：{具体缺什么}
   - [N/A·人工]  判据③：{判据原文} —— 归人工确认
   结论：{全 pass / 有 N 条 fail 待修}
   ```
4. **有 FAIL → 主会话修产物 → 重新派冷核**。不得自行把凭证改成 pass；不得换软措辞反复重派"刷到绿"。
5. 🚫 **人工抽看凭证**（签字前，人做）：翻一眼 `gate-checks/G{N}.md`——是逐条带具体证据，还是空壳盖章 / 证据含糊？这是软版**唯一**兜住"假装做"的闸，不可省。人认可后才进签字。凭证随签字 commit 一并入库（供追溯）。

### 与既有审查的关系（互补不合并）

- `plan-sprint` Step 3.5 独审、`draft-ux` Step 3.5 冷审是**针对特定维度**的深审（任务包保真 / UX 品味），其结论是某一条完成判据的输入；
- 本协议是**对整张完成判据清单**的逐条核对（含"那道深审是否真跑过"）。层级不同，各自保留。

---

## 8. 边界（不在本文档讲）

| 你想知道 | 去哪个文档 |
|---|---|
| 有哪些 task type | `04-task-catalog.md` |
| 任务前置依赖怎么判 | `04-task-catalog.md` §"任务前置检查" |
| 任务状态枚举与流转 | `05-state-machine.md` |
| 哪个工作区做哪类任务 | `02-workspaces.md` |
| 关键设计决策（多迭代约束、合并部署等） | `../BRIEF.md` "关键设计决策" 段 |
