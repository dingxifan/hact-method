# 06 — Gates

> **本文回答**：5 个 Gate 是什么？怎么由 task 状态聚合？A 类 vs B 类有什么差别？多迭代并行下怎么展示？
>
> **不回答**：每个 task 是什么（→ `04-task-catalog.md`）；任务状态枚举与流转（→ `05-state-machine.md`）；身份/拉取（→ `01-identity.md`）；工作区（→ `02-workspaces.md`）。

---

## 1. 5 个 Gate 内涵

| Gate | 内涵 | 签于哪个 task |
|---|---|---|
| **G1** | 本期 PRD 通过——产品需求清晰、用户故事完整、acceptance criteria 制定 | `draft-prd-vN` 任务尾部 |
| **G2** | 本期技术设计通过——TRD（接口/数据结构）+ 验证入口完成；**V0 走骨架**：仅获准 V0 行实际档达标 + 一根最薄切片设计 + 验证入口 | `draft-tech-design`（V1+）/ `draft-foundation`（V0）任务尾部 |
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
| **G2** | V1+：本期 `draft-tech-design` [merged] + 任意 `revise-doc(target=trd\|foundation)` [merged]（如有）；**V0：本期 `draft-foundation`（签 G2(v0) 即地基设计验收，走骨架 `develop(source=foundation)` 在 G2 后建）** |
| **G3** | 本期 `plan-sprint` [merged] |
| **G4** | 本期所有 `develop(source=sprint)` [merged] + `generate-integration-tests` [merged] + 所有 `develop(source=integration)` [merged] + `manual-test` [merged] + 所有 `develop(source=manual-test)` [merged] |
| **G5** | 本期 `wrap-up-iteration` [merged] + 本期 `deploy` [merged]（部署失败 / 纯文档迭代不阻断 G5 签字，见下注） |

注：`revise-doc` 在 G1/G2 关联里以"任意"出现——意思是 G1/G2 已签后再发生的 revise-doc 不撤销 Gate（详见 §6），但 revise-doc 自身仍要走 `[merged]` 才结束。

注：`deploy` 在 G5 关联里**不阻断签字**——deploy 与 `wrap-up-iteration` 并行、无强依赖，部署失败或纯文档迭代（无需部署）时，只要收尾三步完成即可签 G5（详见 `specs-execution/wrap-up-iteration.md` 第三步「project.md 合并」状态标注 + 顶部说明）。

---

## 3. Gate 子状态（聚合视图）

子状态是给人看的进度视图，**不是状态机层面的状态**——状态机管单 task（详见 `05`），Gate 子状态是 task 集合的聚合查询结果。

| 子状态 | 判定条件 |
|---|---|
| **未开始** | 关联任务都 `可取`，或前置 Gate 未签（前置不满足，任务还不会触发） |
| **进行中** | 至少一个关联任务 `taken-by` 或 `done` |
| **阻塞** | 至少一个关联任务长期无进展，或异常转移频繁（具体阈值由使用方按项目节奏定）|
| **待签** | 关联任务集合全部 [merged]，但 Gate 签字字段未设 |
| **已签** | Gate 签字字段已设（含签字人 + 时间戳）|

子状态服务于"本期到哪一步了"这一问——底层数据是 `status.yml` 里 task 状态的聚合查询结果，不存独立字段。

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

- vN G4 期（开发循环）时，vN+1 可以并行做 G1（PRD 起草）+ G2（TRD/foundation）+ G3（sprint 拆解）
- 一旦 vN G4 完成，vN+1 自然进入开发循环——无缝衔接

**展示形态**（项目根视图）：

- 多迭代分组视图：每个迭代独立的 Gate 时间线
- 跨迭代依赖明示：vN+1 G3 待签状态显示"前置：vN G4 完成中"
- 推荐"压缩并行"——准备段并行，开发段串行

---

## 6. Gate 跟修订的关系

**已签的 Gate 不撤销**——即使后期通过 `revise-doc` 修订了 PRD/TRD/foundation：

- G1 已签 + 之后 `revise-doc(target=prd)` → G1 仍是"已签"，但 PRD 内容更新；revise-doc 自身要走 `[merged]` 才结束
- 这种设计避免"已经走到 G3 还要回头折腾 G1 状态"的混乱
- 修订记录在 `backlog.md`，给 `wrap-up-iteration`（G5 阶段）反向更新参考

为什么不撤销？因为 Gate 签的是"在这个时刻产物已通过审视"，是历史事实；后续修订是新的事件，不重写历史。`backlog.md` + revise-doc 任务包构成完整的变更追溯。

---

## 7. 签 Gate 前 · 完成判据核对

> 适用 G1–G5。本节是**单一来源**：各 task 的 `specs-execution` 在签字步骤前引用本节（带 `Gate=G{N}`），不重抄正文——避免 5 份拷贝各自漂移。

完成判据按**核对机制**分两类：

- **【linter】判据**：结构完备（字段/段落在不在）+ 交叉一致（PRD↔TRD、queue↔sprint↔status）+ 状态/文件可查（任务全 merged、报告结论、feedback 清空）这类，由确定性检查器机械核——跑一万次结果一致、不受上下文失真影响。**G1–G5 全覆盖**：**G1/G2** 用 `scripts/check-docs.js`（PRD/TRD 结构 + 交叉）、**G3** 用 `scripts/check-sprint.js`（任务包字段/AC回链/三方一致）、**G4/G5** 用 `scripts/check-gate.js`（状态 + 文件薄检查）。
- **语义判据**：如"用户故事完整""AC 是否用户真要的""用户是否真验收通过""feedback 分流对不对"，机器判不了，由**对应职能的人**在签字时确认。

哪几条判据标【linter】由各 task 的 `specs-structural` 完成判据节标注。**统一模型**：所有 Gate = 跑对应检查器（退出码 0 = 结构判据通过）+ 脚本 `🧑` 段列出的语义残量由签字人确认——**不额外派隔离核对单元**（各 Gate 通用）。

**判官 + 门卫**：检查器是**判官**（查产物结构对不对），但"记得跑判官、退出码 0 才签"若只写成散文，仍是一条会在 context 里失真的规则。`scripts/pre-commit-hook.sh` 是**门卫**——签字 commit 时按 staged 文件自动跑对应 check-\*.js，红则拦 commit。判官说红就过不去，于是各 Gate 不再需要"记得跑 + 退出码 0 才签"的强制散文，机制本身使"通过判官"成为提交的唯一出路。门卫由 init-project 装（`specs-execution/init-project.md` Step 4.1）；**存量仓未装门卫 / 未铺脚本 → 退回签字人手工核对**（见各 Gate「存量项目兜底」），与 `--no-verify` 同属"护栏非密码锁"，是合作者的强制出路、非安全边界。

### G1 / G2（已有结构 linter）

> `check-docs.js` 覆盖 PRD/TRD 的 ①结构完备 ②交叉一致。设计沉淀：`_meta/plans/2026-06-19-structural-review/sub3-gate重定义-design.md`。

1. 跑 `node scripts/check-docs.js ...`（G1 仅 PRD；G2 含 PRD↔TRD 交叉对账）。退出码 0 = 该 task 全部【linter】判据通过；退出码 1 → 按报告逐条修产物、重跑到绿（签字 commit 的门卫会强制此事——红则拦 commit，跳过/伪造 pass 机制上做不到）。
2. 未标【linter】的**语义判据**由签字人确认：PRD 在 `draft-prd-vN` 逐功能确认中已把关；TRD 的 AC 覆盖**齐全性**已由 check-docs 机械核（PRD AC↔`# 满足 AC` 回链逐条对账），残留语义（载体是否**真承接**所回链的 AC、PRD 行为例子是否齐全、TRD 精化例子规格是否忠实该行为例子）+ 后续 `develop` 内置独立审查的技术保真在签字时复核，无需另派隔离单元。
3. **存量项目兜底**：项目仓无 `scripts/check-docs.js`（未铺）→ 签字人**逐条手工核对**该 task 完成判据（不额外派隔离单元），并提示补铺（见 `specs-execution/init-project.md` Step 3）。补铺后即自动切回 linter 路。

### G4 / G5（薄检查器 check-gate.js）

> `check-gate.js` 覆盖 G4/G5 完成判据里**确定性可查**的部分（G4：source=manual-test 修复任务全 merged + 验收报告结论=通过；G5：feedback.md 已清空 + project.md 无"开发中"）。语义核心（用户是否真验收通过、feedback 分流对不对、偏离处理对不对）机器判不了，显式留签字人确认。设计沉淀：`_meta/plans/2026-06-19-structural-review/sub3b-G345检查器-design.md`。

1. 跑 `node scripts/check-gate.js G{N} vN`（在项目仓根目录）。退出码 0 = 该 task 全部【linter】判据通过；退出码 1 → 按报告逐条修产物、重跑到绿（签字 commit 的门卫会强制此事——红则拦 commit，跳过/伪造 pass 机制上做不到）。
2. 脚本 `🧑 留签字人确认` 段列出的语义残量由签字人确认（G4：用户明确说验收通过、反馈问题已处理；G5：backlog `[偏离]` 处理得当、feedback 分流准确）。签字时复核，无需另派隔离单元。
3. **存量项目兜底**：项目仓无 `scripts/check-gate.js`（未铺）→ 签字人**逐条手工核对**完成判据（不额外派隔离单元），并提示补铺。补铺后即自动切回 linter 路。

### G3（检查器 check-sprint.js）

> 任务包序列化锁定为 YAML frontmatter（`templates/queue/task-package.md`），`check-sprint.js` 据此覆盖 G3 完成判据里**确定性可查**的部分——机械字段完备（`risk` 缺省按 `standard`，不做必填校验；敏感启发词命中而未标 `sensitive` → `🧑` 段提示，决策#29）、`reference` 含行号（前端含 ux-flows / 后端含 trd 条目）、AC 带 `(源：PRD AC-nn)`/`(技术)` 回链 tag + 逐条 AC 反向覆盖（按 PRD `AC-nn` id）、`depends_on` 在册、queue↔sprint.md↔status.yml 三方一致。设计沉淀：`_meta/plans/2026-06-19-structural-review/sub3c-G3任务包规范化-design.md`。

1. 跑 `node scripts/check-sprint.js vN`（在项目仓根目录）。退出码 0 = 该 task 全部【linter】判据通过；退出码 1 → 按报告逐条修产物、重跑到绿（签字 commit 的门卫会强制此事——红则拦 commit，跳过/伪造 pass 机制上做不到）。
2. 脚本 `🧑 留签字人确认` 段列出的语义残量由签字人确认：疑点清单已逐条确认、TRD 每模块都有任务包、`plan-sprint` Step 3.5 独审无遗留阻断、PRD **逐条** AC（非功能级）均被覆盖。签字时复核，无需另派隔离单元。
3. **存量项目兜底**：项目仓无 `scripts/check-sprint.js`（未铺，或任务包仍是旧序列化格式）→ 签字人**逐条手工核对**完成判据（不额外派隔离单元），并提示补铺 + 新 sprint 套用 `templates/queue/task-package.md`。补铺后即自动切回 linter 路。

> **与 `plan-sprint` Step 3.5 独审的关系**：Step 3.5 是针对特定维度（任务包对 PRD/TRD 保真）的语义深审，其结论是 G3 一条语义判据的输入，由上面步骤 2 的 `🧑` 段提示签字人复核——与确定性检查器互补，各自保留。

---

## 8. 边界（不在本文档讲）

| 你想知道 | 去哪个文档 |
|---|---|
| 有哪些 task type | `04-task-catalog.md` |
| 任务前置依赖怎么判 | `04-task-catalog.md` §"任务前置检查" |
| 任务状态枚举与流转 | `05-state-machine.md` |
| 哪个工作区做哪类任务 | `02-workspaces.md` |
| 关键设计决策（多迭代约束、合并部署等） | `../BRIEF.md` "关键设计决策" 段 |
