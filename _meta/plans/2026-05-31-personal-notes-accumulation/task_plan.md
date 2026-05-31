# 方法论调整：个人积累与 pull 上提

> 计划目录：`_meta/plans/2026-05-31-personal-notes-accumulation/`
> 启动日期：2026-05-31

## 目标声明

在**不破坏 hact-method 仓 push 权限边界**（开发者无 hact-method 写权限）的前提下，让"全局积累（公共方法论规范）"与"个人积累（开发者私人总结）"都能完成，并能从个人汇聚上升为公共。

## 根因（为什么改）

wrap-up 第二步 feedback 分流的 6 类目的地中，4 类落在 hact-method 仓（standards / checklist / 方法论待议 / 跨项目机制）。为保持方法论仓干净关闭了开发者 push 权限后，这 4 类积累开发者一条都完不成 → wrap-up 跑不完，个人经验无处沉淀。且 `templates/retrospectives.md` 是空模板、未接入流程，方法论本就缺"个人/项目级积累"的永久落点。这条"往中心仓 push"的链也违背了方法论自己的 pull 哲学（BRIEF 决策 #4）。

## 已确认设计决策（与用户对齐）

| # | 决策 | 取舍理由 |
|---|------|---------|
| D1 | **个人积累跟人走、私有**：每人独立 gitee 仓 `hact-notes-{姓名}`，本地 `E:\group-code\hact-notes-{name}\`，本人独享 push、别人无读权限 | 真正私有；单一共享仓会因 git 整仓 clone 导致人人本地揣全员草稿，与"私人"冲突（已否决） |
| D2 | **notes 条目打标签**：`[规范]`/`[checklist]`/`[方法论]`（可上提）+ `[心得]`（纯私人，永不上提） | 区分"该公开成规范的原料"与"私人心得" |
| D3 | **上提 = pull**：新增 `harvest-notes` task（management discipline），管理者跑，对成员仓**只读**，遍历 `_meta/hact-config.md` 登记的成员仓收割未上提条目，去重择优写进公共层 | 与 pull 拉取池哲学一致；权限边界一寸不动 |
| D4 | **收割游标、不回写成员仓**：上提进度记在 hact-method 侧（上次收割点），下次只看新增 | 管理者对成员仓只需只读权限，避免写他人仓 |
| D5 | **wrap-up 第二步改造**：原 4 类指向 hact-method 的反馈 → 誊进执行人自己 hact-notes（打标签）；`decisions.md`（项目架构决策）仍留项目仓不变；`feedback.md` 仍清空 | 开发者不再撞 hact-method 权限墙 |
| D6 | **双源规范 = 设计甲**：`draft-tech-design` 生成 `iterations/vN/standards-*.md` 时，从「公共 hact-method `templates/standards`」+「执行人本人 hact-notes 的 `[规范]`」双源取数，写入共享 standards | 当前架构与开发高度重叠，执行人本人 notes 注入即覆盖真实开发者；设计乙（develop 会话叠加）冗余 |
| D7 | **设计乙留待团队分化**：将来架构与开发分离时，再评估给 develop/code-review 加"会话内叠加加载本人 notes" | 记入方法论待议，不在本次做 |

## 阶段拆解（已并入通读发现的连带影响 C1–C5；详见 findings.md）

- [x] **阶段1 · 骨架与配置层** ✅ 2026-05-31
  - `skeleton/01-identity.md`：补"个人积累 hact-notes 特殊权限模型"段（写入不走 discipline 准入，权限绑身份）【C5】
  - `skeleton/02-workspaces.md`：引入第三类工作区/心态「个人积累仓 hact-notes」
  - `skeleton/03-disciplines.md`：management 边界补"跨项目积累汇聚（harvest-notes）"
  - `skeleton/04-task-catalog.md`：注册 `harvest-notes`（management）
  - `_meta/hact-config.md`：新增成员仓登记表（人 → notes 仓地址）+ 收割游标存放约定【支撑 C2】
- [x] **阶段2 · 新建 harvest-notes 规范** ✅ 2026-05-31
  - `specs-structural/harvest-notes.md`（契约）+ `specs-execution/harvest-notes.md`（执行：遍历成员仓 → 收割 → 去重择优 → 写公共层 → 推进游标）；明确触发频率、游标落点、去重择优策略
- [x] **阶段3 · 改 wrap-up-iteration（A 类收尾分流）** ✅ 2026-05-31
  - `specs-execution/` + `specs-structural/wrap-up-iteration.md`：第二步分流目的地改写（4 类 → 本人 notes 打标签）+ 红线第14行理顺 + 产物/接口同步
- [x] **阶段4 · 改 draft-tech-design（双源 + 去重）** ✅ 2026-05-31
  - `specs-execution/` + `specs-structural/draft-tech-design.md`：生成 standards 加"本人 hact-notes [规范] 取数"；**vN+1 对照上期 standards 去重，只追加未收录条目**【C4】
- [x] **阶段5 · B 类积累通道** ✅ 2026-05-31（develop Step10 按 source 分；B 类就地分流进 notes）
  - B 类 `develop` 移交时就地"轻量分流"（编码/checklist/方法论 → 本人 notes；架构 → decisions.md；无价值删），不依赖 wrap-up
  - 涉及 `specs-execution/develop.md` Step10 + `specs-structural/develop.md` + 可能 `dispatch-new` / `skeleton/05-state-machine.md`
- [x] **阶段6 · 成员上线 / notes 仓创建【C2】** ✅ 2026-05-31（init-project Step4.5）
  - `init-project`（或独立环节）补：确认参与者 → 检查/建 `hact-notes-{name}` → 登记进 hact-config.md
- [x] **阶段7 · 跨会话同步【C3】** ✅ 2026-05-31（templates/CLAUDE.md Step0）
  - `templates/CLAUDE.md` Step0 加同步个人 notes 仓 + 声明扩展
- [x] **阶段8 · 个人积累仓模板** ✅ 2026-05-31（templates/hact-notes/）
  - `templates/hact-notes/notes.md`（标签说明）+ `templates/hact-notes/CLAUDE.md`（可选）
- [x] **阶段9 · 顶层文档** ✅ 2026-05-31（BRIEF#21-23 / CLAUDE / STATUS / 待议 / guide 00·02·99 / README）
  - `CLAUDE.md`（工作区指南 + 方法论调整信息来源）、`BRIEF.md`（补决策：个人积累 pull 上提 / 双源设计甲 / notes 权限例外）、`STATUS.md`、`_meta/plans/方法论待议.md`（补 D7 + O1 checklist 对称）、`guide/*.md`（核心概念"两→三工作区"等）
- [x] **阶段10 · 一致性自检** ✅ 2026-05-31
  - 命名/数量一致核对：补改 skeleton/README（两→三工作区、12→13 task、20→23 决策）；hact-notes 49 处/21 文件、harvest-notes 59 处/24 文件铺开无矛盾
  - retrospectives.md 已 `git rm`（确认无 spec 引用）

## 范围决策（已锁定 2026-05-31）
- **C1 B 类积累通道**：✅ 本次一起补（阶段5）。
- **O1 checklist 当期生效**：留待议——阶段9 写入方法论待议，与设计乙 D7 同组；本次**不**在 develop 自检加叠加加载。
- **O4 retrospectives.md**：✅ 直接删（阶段10：确认无引用后 git rm）。

## 红线

- **master 分支不自行 push**（用户全局规范 + 本仓红线）：全部改完、自检通过后，向用户报告再由其决定推送。
- 改方法论文件，不碰任何具体项目仓。

## 遇到的错误
| 错误 | 尝试次数 | 解决方案 |
|------|---------|---------|
| — | — | — |

## 当前阶段
✅ 全部 10 阶段完成（2026-05-31）。改动落地、自检通过，待用户确认后 push（master 红线，不自行 push）。
