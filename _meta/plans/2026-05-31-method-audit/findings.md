# hact-method 方法论审查报告

> **执行进度（2026-05-31）**
> 
> - ✅ **R1–R4 已修复**：个人积累/纯方法论仓回灌、`iteration_vN.md` 命名、v1 角色残留（11 文件）
> - ✅ **R6 已修复**：dispatch-new 16/12 字段、≤15 误套、空占位符、`layers` 数组统一、`task_type` 登记（含顺带对齐 `pr-link`→`pr-links`）
> - ✅ **R7 已修复**：G5 deploy 软化注（06-gates §2）、revise-doc 复议孤儿判据删除（04）
> - ⏳ **R5 待办（战略决策）**：structural/execution 双层架构——运行时只加载 execution，structural 几乎没人读却大面积重复且 init-project 已漂移。需先定方案甲（structural 砍成纯契约）或乙（机械任务合并单文件），再动。
> - ⏳ **R8 待办（冗余/TOKEN）**：步骤协议/断点续做/快速通道 boilerplate 抽 `_conventions.md`、03-disciplines 整节重复删除、项目目录树/BRIEF 决策/guide 单源化。建议与 R5 同批做（都涉及抽单源）。可省 ~300-400 行。
> - 尚未 `git commit`（按用户规范，提交/推送需确认）。

---

> 生成：2026-05-31 ｜ 方法：分层一致性审查（多 Agent 工作流，50 agents）
> 范围：skeleton + specs-structural + specs-execution + skills + templates + guide + BRIEF/CLAUDE/STATUS（排除 _meta/plans 历史）
> 候选 61 条 → 确认 52 条 → 对抗复核剔除误报 9 条
> 三维度：A 逻辑错误 ｜ B 冗余 ｜ C TOKEN/简化

---

## 0. 一句话结论

方法论**模型层是自洽的**——状态机、Gate 聚合、discipline 授权、A/B 类流程这些核心设计经对抗复核都站得住（9 条"疑似矛盾"全部被证明是有意的分层设计）。真正的问题集中在两类：

1. **两次重构（2026-05-08 纯方法论仓、2026-05-31 个人积累）没有回灌到上游文档**，留下一批过期陈述（最系统、最该先修）。
2. **structural / execution 双层架构的投资回报正在恶化**——运行时只加载 execution，structural 几乎没人读却在大面积重复 execution，已经实际漂移。这是唯一需要你做战略决策的一项。

下面按**根因聚类**呈现（比 52 条散点更可操作），每簇标 `严重度` 与涉及的 finding ID。

---

## 簇 R1 ｜ 2026-05-31「个人积累」改造未回灌上游　【高 · 系统性】

一次改造（新增 hact-notes 第三工作区 + harvest-notes 第 13 个 task）在多处留下过期数字与缺口：

| #    | 问题                                                                                           | 位置                                                                           | 修法                                               |
| ---- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| R1-1 | BRIEF 决策#2 仍写「工作区 **2 个**」，但 #21/skeleton/CLAUDE 全是「三工作区」                                    | `BRIEF.md:52`（另 :7 :15）                                                      | 改「3 个：hact-method/项目根/hact-notes」并补 2026-05-31 注 |
| R1-2 | 任务数 **12 vs 13** 口径不一（漏 harvest-notes）                                                       | `STATUS.md:19,20,48` `CLAUDE.md:112` `guide/99:3`                            | 统一为 13，STATUS 括号清单补 harvest-notes                |
| R1-3 | `guide/99` 工作区表称 hact-method「仅 init-project 和方法论调整」，漏 harvest-notes（与同文件 :57 冲突）             | `guide/99:94`                                                                | 补 harvest-notes 收割                               |
| R1-4 | **structural/init-project 完全没有 hact-notes 仓创建步骤**，execution 有完整 Step4.5                      | `specs-structural/init-project.md`                                           | 结构层补 Step4.5 + 产物 + 完成判据                         |
| R1-5 | harvest-notes 把 `shared` 当作 backend/frontend 文件内的「段」，但实际存在独立 `templates/standards/shared.md` | `specs-structural/harvest-notes.md:58` `specs-execution/harvest-notes.md:91` | 写入目的地改 `{backend\|frontend\|shared}.md`，删「两份都补」  |

> 涉及 finding：decisions-conformance#1/#3、refs-and-terminology#2/#4/#6、task-consistency-C#7/#8、structural-execution-redundancy#4

---

## 簇 R2 ｜ 2026-05-08「纯方法论仓」重构未回灌 skeleton/04 与 BRIEF#17　【中】

projects/ 目录早已移除、改为 group-code 下独立项目仓，但骨架简表与 BRIEF#17 还在用旧路径模型：

| #    | 问题                                                            | 位置                                                          | 修法                             |
| ---- | ------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------ |
| R2-1 | `projects/{项目}/...` 旧路径前缀残留（8 处）                              | `skeleton/04-task-catalog.md:58,73,88-91,106`、`BRIEF.md:67` | 改为 `iterations/vN/...` 项目仓相对路径 |
| R2-2 | init-project「项目记入 **registry**」在结构层/执行层均无落点（全仓仅此一处提 registry） | `skeleton/04:58`                                            | 删除该句，或在 spec 定义 registry       |

> 涉及 finding：decisions-conformance#2、task-consistency-A#2/#3、token-simplification#4

---

## 簇 R3 ｜ `iteration_vN.md` 命名孤例　【中 · 单点可修】

`skeleton/06-gates.md:65` 把 A 类总账文件叫 `iteration_vN.md（Gate 状态+主任务清单）`，**全仓其余 26 处一律用 `iterations/vN/gates.md`**，模板文件也是 `templates/iterations/gates.md`。这一处被 4 个不同 agent 独立发现。

- **修法**：`06-gates.md:65` 改为 `iterations/vN/gates.md`。一处改完即解。
- 涉及 finding：decisions-conformance#4、task-consistency-A#1、task-consistency-B#3、refs-and-terminology#3

---

## 簇 R4 ｜ v1 角色术语残留　【中】

`BRIEF.md:14` 关键变化对比表的 hact-method 列写「角色数 5（管理员/PM/架构师/**devmgr**/前后端开发；Gate5 归 devmgr 兼任）」，与自己的决策#1/#16（废弃角色身份）+ skeleton/03 的「9 个 discipline」+ G5 归 `management` 直接打架。devmgr 是 v1 旧名。

- **修法**：该行 hact-method 列改用 discipline 口径（「9 个 discipline；G5 收尾归 management」）。
- 注：复核纠正了原始证据——`BRIEF.md:17` 的「devmgr 写 pending」其实在 **v1 列**，是正确的新旧对照，不是错误。
- 涉及 finding：refs-and-terminology#5

---

## 簇 R5 ｜ structural / execution 双层架构　【高 · 需你战略决策】

这是最值得决策的一项。核心事实（已对抗复核确认）：

- **运行时只加载 execution**：`templates/CLAUDE.md` 的 12 条 task→spec 映射**全部**指向 `specs-execution/`，没有一条加载 structural。
- **structural 只有 3 处被当 schema 字典引用**（develop §字段规范被 plan-sprint/dispatch-new 引、init-project §主要产物被引）。**其余 structural 段落（工作内容/边界场景/异常处理）写了没人读、改了易漂移。**
- 多个 task 的两层已大面积重复甚至漂移：

| task             | 重复/漂移情况                                                     | finding    |
| ---------------- | ----------------------------------------------------------- | ---------- |
| **init-project** | 已实质漂移：execution 多出整套 Gitee/webhook/notes 流程，structural 完全没有 | str-exec#4 |
| **develop**      | 规模评估/hotfix/PR 五段三处规则两层同写，改一处要同步两文件                         | str-exec#2 |
| pr-review      | layer 推断表、checklist 维度、直修边界 逐字重复                            | str-exec#1 |
| draft-prd-vN     | PRD 段落定义、AC「3-5 条」、五要素 两处各写                                 | str-exec#3 |
| manual-test      | 验收报告模板、特殊反馈分支 逐字重复                                          | str-exec#5 |
| deploy           | 七步序列、deploy-log 格式、边界场景 平行重复                                | str-exec#6 |

此外，多处结构层完成判据**缺**执行层已有的输入/路径（decisions.md 输入、直修通道、B 类独立部署前置），属同源漂移。

**两个候选方向（建议你二选一）：**

- **方案甲（重构保留分层）**：structural 只留真正被跨 task 复用的纯契约（字段规范表/产物路径/完成判据/接口约定），删掉与 execution 重叠的叙述段；execution 做 `§` 引用。
- **方案乙（按任务合并）**：对 init-project/deploy 这类机械任务直接合并为单文件（契约内嵌表格），消除双写。

> 涉及 finding：structural-execution-redundancy#1~#7、task-consistency-A#8/#9/#10、task-consistency-C#3/#5/#6

---

## 簇 R6 ｜ 执行层内部的实在错误（数字/措辞）　【中 · 直接改】

这些是 execution 文件自身的硬错，不依赖架构决策：

| #    | 问题                                                                     | 位置                                                     | 修法                          |
| ---- | ---------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------- |
| R6-1 | dispatch-new 同一文件内「**16 字段**」与「**12 字段**」并存（应为 16）                     | `specs-execution/dispatch-new.md:84 vs 96`             | :96 改 16                    |
| R6-2 | gen-integration-tests 把「**≤15 条**」上限错套到「所有测试场景」（应仅限前端 pinchtab，后端不设上限） | `specs-execution/generate-integration-tests.md:243`    | 限定回前端                       |
| R6-3 | develop 用 `layers`(string[])，骨架/pr-review 用 `layer`(单值)，命名+基数不一致     | `specs-structural/develop.md:5,28` vs `skeleton/04:40` | 统一命名与基数                     |
| R6-4 | develop 自造属性 `task_type`，骨架两处属性表均未登记（取值还与 discipline 重复）               | `specs-structural/develop.md:5,30`                     | 去冗余或在 04 登记                 |
| R6-5 | `draft-prd-vN` 结构层前置/交接表里空反引号占位符 ``` `` ``` 未填                         | `specs-structural/draft-prd-vN.md:13,84`               | 补 `{name}/` 或 `iterations/` |

> 涉及 finding：task-consistency-B#1/#2/#4/#5/#6、task-consistency-A#6

---

## 簇 R7 ｜ Gate 签署语义的措辞缺口　【中 · 需确认意图】

| #    | 问题                                                                                                               | 位置                                                                          | 说明                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| R7-1 | **G5 是否要求 deploy [merged]**：骨架 §2「Gate 已签=关联集合全部 merged」且 G5 含 deploy，但 wrap-up 规范说「deploy 失败 G5 可独立签」——签署前提两层冲突 | `skeleton/06-gates.md:27,35` vs `specs-structural/wrap-up-iteration.md:118` | 建议给 06 的 G5·deploy 加「（失败不阻断签字）」软化注，与 G1/G2 的 revise-doc 处理对齐 |
| R7-2 | revise-doc「触发原 Gate 复议（如需要）」是孤儿判据，结构/执行两层都无落点                                                                    | `skeleton/04:123`                                                           | 删除该项，或在 spec 定义"复议"含义                                        |

> 注：与此相邻的 4 条"疑似矛盾"（deploy 属不属于 G5 集合、B 类 deploy 入账、多迭代 G3/G4 阈值、deploy 前置 vs B 类无 Gate）经对抗复核**全部判为误读**——模型本身正确，见文末"已剔除"。
> 涉及 finding：task-consistency-C#2/#6

---

## 簇 R8 ｜ 跨文档冗余 / TOKEN 优化　【中-低 · 量大】

### 明确的复制粘贴残留（应直接删）

- **`skeleton/03-disciplines.md:174-191 与 195-212`「关于 CC 上下文管理」整节重复两遍**（仅个别加粗不同）→ 删一份，省 ~20 行。`token#2 / cross-doc#6`

### Boilerplate 应抽单源

| 重复物                        | 范围                                    | 节省估算     | finding              |
| -------------------------- | ------------------------------------- | -------- | -------------------- |
| 「步骤协议 / 🚫 等待」前导行          | 13 份 execution 逐字相同                   | ~40 行    | token#3, cross-doc#3 |
| 「断点续做」三步段 + progress.md 模板 | 6+ 份 execution                        | ~40-60 行 | token#5, token#9     |
| 「快速通道自检」块                  | pr-review/manual-test/gen-tests 3 份 | ~84 行    | token#1              |

- **建议**：新建 `specs-execution/_conventions.md`（执行层通用协议单源，对应已有的 `specs-structural/_template.md`），各 spec 一行引用。

### 单源化（信息被画/写多遍且已漂移）

| 重复物                                                | 范围                                     | finding     |
| -------------------------------------------------- | -------------------------------------- | ----------- |
| 项目仓目录树（已漂移：含不含 deployment.config/prd.md 各处不一）      | CLAUDE.md / guide/01 / init-project ×3 | cross-doc#1 |
| init-project 内联的初始模板 vs `templates/*.md` 全文重复      | structural §主要产物                       | cross-doc#2 |
| BRIEF 23 决策正文被 skeleton 整句复写（应只留 `(BRIEF #N)` 引用）  | skeleton 多处                            | cross-doc#4 |
| guide/00 与 skeleton 01-06 重复讲授「13 task×Gate×工作区」清单 | guide/00, guide/99                     | cross-doc#5 |

### 单文件瘦身

- `develop.md` 单/批量会话 Step5-9 平行重抄（批量应只列差异）→ ~40-50 行。`token#7`
- `develop.md` 单/批量认领 commit 块逐字重复 → ~8 行。`token#10`
- `skeleton/04` 逐 task 重复总览表已有的 discipline/Gate 两列 → ~25 行。`token#4`
- `guide/02`「AI 做/你做」8 张低密度表 → ~30-40 行。`token#6`
- `init-project` Step5.5 webhook 轮询两种写法重复 + 冗长旁注 → ~15 行。`token#8`

> 冗余簇粗略合计可省 **~300-400 行 / 约 8-12k token**，且消除多处"改一处要同步多处"的维护负担。

---

## 附：对抗复核剔除的 9 条误报（模型其实是对的）

这些一度被标为"矛盾"，但复核读原文后确认是**有意的分层设计**，不要去改：

1. init-project 远端推送顺序/master 分支（A#4, A#5）——结构层显式把远端委派给执行层
2. **deploy 属不属于 G5 集合**（C#1）——"关联 Gate=签哪个 Gate" vs "聚合集合成员"是两个正交概念，文档一致
3. manual-test feedback.md 在 G4 后（C#4）——feedback 是可选复盘，本就不是完成门槛
4. STATUS 引用 retrospectives.md（refs#1）——05-08 创建/05-31 删除，时序自洽
5. **多迭代 v1 G3 vs G4 阈值**（sm#1）——G3 是 v1 旧基线(对照列)，G4 是新模型阈值，guide 的"G3 之后"指同一时间窗
6. deploy 前置 G4 vs B 类无 Gate（sm#2）——04:209 同行已带 hotfix/B 类例外括注
7. B 类 deploy 入账（sm#3）——deploy 是共享合并部署 task，记在 deploy-log 而非 b-tasks，分层正确
8. draft-prd 用户确认不对称（A#7）——兄弟 spec 完成判据其实都含"用户确认"，原指控反了

---

## 建议执行顺序（待你批准）

1. **先批量修簇 R1-R4 + R6**（纯过期/笔误，无争议，~15 处编辑，低风险）——这批做完方法论的"事实层"就干净了。
2. **R7 需你确认意图**（G5/deploy 软化注的措辞）后再改。
3. **R5 双层架构**是战略决策，建议单独开一轮讨论定方案甲/乙，再动。
4. **R8 冗余**可作为独立一轮（抽 `_conventions.md` + 单源化），与 R5 一起做最省力。

> 全部修改将在你逐簇/批量批准后进行，本报告不含任何文件改动。
