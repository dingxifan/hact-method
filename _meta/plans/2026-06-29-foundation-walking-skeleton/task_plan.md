# task_plan — 地基层 + V0 走骨架（主管线重构）

## 目标

把"跨切面地基"从"每迭代逐功能兜网"的隐性盲区，升级成项目起手的**显式地基层**：
1. **init-project** 加一场发散的「项目共识讨论」，产出 **`foundation.md`**（地基蓝图：领域地图 + 地基关注点登记 + 强制边诊断）。
2. 新增 **iteration V0 = 走骨架（walking skeleton）**：在 V1 之前，由 developer 拾取任务包、真把地基代码建出来（穿透前端→API→DB 的最小空壳，五种形式各立一根、安全项焊到构造级）。
3. **draft-tech-design 劈两半**：栈选型 + 跨切面架构（= 地基设计）前移进 V0；逐功能接口契约（= 功能 TRD）留在 V1 且变轻。
4. 下游接线：draft-prd 功能挂 foundation 领域地图；draft-ux 把 token 真值填进 V0 已建好的主题框架；plan-sprint 把昨天的「视觉地基包」收编为 V0 地基包的一个特例；develop 加 `source=foundation` + 独立审查拿 foundation.md 的应有档验收。

## 已锁决策（用户 2026-06-29 拍板）

- **D1 完整重构**：不是只写蓝图文档，而是蓝图 + 走骨架阶段 + 栈前移 + TRD 劈半，全套。
- **D2 V0 走骨架**：走骨架用 **iteration v0** 这个壳（复用迭代一等公民结构，只是没 PRD/功能）。
- 形式模型见 findings：五种形式（说它/穿过它/住进它/被它笼罩/往里填）+ 强制边三档（构造上不可能 > 机械探测 > 人审）+ 两进料口（技术内生/领域涌现）+ 准入门槛（已证明跨切面 + 稳定；init 证据最少 → 只收明摆着的）。
- **不撞 #20**：发散的"共识讨论/蓝图"骑在 init 里、不 task 化；"建骨架代码"是清晰 spec 的实现活、本就该 task 化（= develop source=foundation）。

## 新起手管线（目标形态）

```
init-project
  ├─ 机械 setup（现 Step 1–5 不动）
  ├─【新】项目共识讨论（发散，读 background.md，不列功能）→ foundation.md
  │     一、领域地图（核心实体 / 主数据草图 / 什么贯穿全局）
  │     二、地基关注点登记（技术内生清单 + 领域涌现；每项标 5 形式之一 + 落点前/后端）
  │     三、强制边诊断（init 立"应有档"bar；安全项=构造级不可议价；形式/实际档下游填）
  └─ 移交
        ↓
iteration V0 · 走骨架
  ├─ 地基设计（draft-tech-design 劈出的前半：定栈 + 跨切面架构 + 每块地基关注点选具体形式 + 播种 standards）
  ├─ 走骨架任务包生成（地基范围的 plan-sprint，或直接生成）
  └─ develop(source=foundation)：拾取 → 建骨架（瓶颈管道 + 作用域 base repo + AppLayout 外壳 + 主题框架 + 四态骨架 + 错误信封）→ 自测 → 独立审查拿应有档验收 → 合并
        V0 完成 = 骨架端到端跑通 + 全部应有档达标
        ↓
V1（及之后）
  ├─ draft-prd-vN：功能挂 foundation 领域地图
  ├─ draft-ux：token 真值填进 V0 已建好的主题框架
  ├─ draft-tech-design（功能 TRD，劈出的后半，变轻）：在已建骨架上做逐功能接口契约，不再选栈
  ├─ plan-sprint：功能包；视觉地基包概念已被 V0 收编/泛化
  └─ develop：功能往骨架上插
```

## 受影响文件清单（待逐一改）

| 文件 | 改动性质 |
|------|---------|
| `specs-execution/init-project.md` + `specs-structural/init-project.md` | 加共识讨论 + foundation.md 产物（新 Step，移交后置） |
| `templates/foundation.md`（新建） | 地基蓝图模板，三段，按项目尺寸伸缩 |
| `specs-execution/draft-foundation.md` + structural（**新建**，Q1=A） | V0 地基设计：抬 draft-tech-design 首期簇（栈/standards 首播/测试基建/视觉地基）+ 按 foundation.md 选形式填「实际档」+ 定走骨架穿透切片 + G2(V0) 判据 |
| `specs-execution/draft-tech-design.md` + structural | **瘦身为纯功能 TRD**：会话启动改"读 project.md 栈"、standards 只增补、删首期簇（测试/视觉地基约定迁出）；feature-TRD/AC 回链不动 |
| `specs-execution/develop.md` + structural | 加 `source=foundation`；属性/状态机 |
| `templates/review-briefs/foundation-review.md`（新建） | 独立审查拿 foundation.md 应有档验收（尤其安全项构造级） |
| `specs-execution/plan-sprint.md` + structural | 地基范围 sprint（V0）；视觉地基包收编为 foundation 包特例 |
| `skeleton/04-task-catalog.md` | 新 source/属性；地基设计落点 |
| `skeleton/06-gates.md` | V0 有没有 Gate？（开放 Q2） |
| `skeleton/07-status-contract.md` + `templates/status.yml` | V0 迭代表示 + foundation task 状态 + type/source 枚举 |
| 迭代模型相关（CLAUDE.md 结构图 / skeleton 迭代一等公民处） | v0 是"无 PRD 迭代"的表示 |
| `BRIEF.md` | 新增决策（#25 地基层 + V0 走骨架；修订 #17 迭代模型 + #23/standards 关系） |
| `STATUS.md` | 里程碑记录 |
| 收编：`_meta/plans/2026-06-28-blueprint-layer`（parked） | 领域涌现半边 = 蓝图层精简版，标注合并关系 |

## 开放问题（设计阶段要定）

- **Q1 地基设计的落点**：✅ **改定 A**（先定 B，阶段 3 读真 spec 后翻案）—— **新建 `draft-foundation` task**（discipline=architecture、Gate=G2）。理由：draft-tech-design 从头到尾 PRD/AC 驱动（G1 检查/疑点对 PRD/接口配 AC 回链/实体建表），V0 无 PRD → "V0 模式"会几乎全跳过转做不相交的事 = 那个"丑 if/else"触发条件。两者不相交 > 省一个 task。draft-foundation 大半是把 draft-tech-design 的首期机器抬出来（非从零）。
- **Q1-Gate（原 Q2）**：✅ **定 B** —— 复用 **G2（architecture）**，不加新 Gate。同一个 G2 槽、按迭代两套判据：V0 的 G2 = ①每块关注点选定形式 ②实际档≥应有档（安全项构造级）③走骨架切片已定；V1+ 的 G2 = feature-TRD 站得住。V0 这个迭代**只有 G2**（无 PRD→无 G1；有无 G3 取决于走骨架包走不走 plan-sprint，留阶段 5）。A 让两套判据各在各文件、不打架。
- **Q2（栈搬哪，已扩）**：整个**首期簇**搬 V0：栈选型 + standards **首期播种** + 测试基建约定 + 视觉地基约定。draft-tech-design 变轻：从 project.md **读**栈、standards 只**增补**、不再首播测试/视觉地基约定。
- **Q4（标杆切片）**：**定**在 `draft-foundation`（挑哪根穿透切片当范本）；**建+登记**在 V0 `develop(source=foundation)` 末端（按范本质量写 + reusables.md 落"参考实现"指针）。
- **Q3 走骨架任务包谁生成**：地基范围 plan-sprint，还是地基设计步直接产包？
- **Q4 design.md 时序**：主题框架 V0 建（占位 token），真值 draft-ux 填——design.md 的空桩/占位/真值三态怎么在 init/V0/V1 之间切；和昨天视觉地基包的关系。
- **Q5 命名**：`foundation.md`？走骨架 source 名（`foundation`）？V0 对外叫"地基阶段"还是"iteration v0"？
- **Q6 过早抽象护栏**：怎么在 spec 里把"薄走骨架（一根端到端切片）"写成强约束，挡住"建投机完整框架"。

## 分阶段（执行次序）

- **阶段 0 · 沉淀设计**（进行中）：写 task_plan / findings / progress。✅ 本会话
- **阶段 1 · 定开放问题**：Q1–Q6 逐个和用户敲定（尤其 Q1 落点 / Q2 Gate，决定后面所有接线）。
- **阶段 2 · foundation.md + init-project**：先落最前、最独立的一块——蓝图模板 + init 共识步。
- **阶段 3 · 新建 `draft-foundation` + draft-tech-design 瘦身**（Q1=A）：动主管线核心。
- **阶段 4 · V0 迭代表示 + develop source=foundation + foundation-review brief**：把"建"接通。
- **阶段 5 · plan-sprint 收编视觉地基包 + 下游接线（draft-prd/draft-ux）**。
- **阶段 6 · skeleton/status/BRIEF/STATUS 同步 + 全仓 grep 验零悬挂引用**。
- **阶段 7 · 收编 parked blueprint-layer + 验收**。

> 纪律：每阶段一个或少数几个 commit，本地 method-lab 分支，**push 前必须人类确认**（master/推送严格）。

## 当前状态

- 阶段 0：✅ 完成（设计沉淀）
- 阶段 1：✅ 完成（Q1=B / Q2=B 已定）
- 阶段 2：✅ 完成（`templates/foundation.md` 新建；init-project exec 加 Step 6 共识讨论 + Step 7 移交指向 V0；init-project structural 同步产物/判据/接口）。**本地未 commit。**
- 命门纳入（用户 2026-06-29「让按规范做最省力」一段，findings §八）：① 代码生成**整条删**（CC 即生成器）；**A** 命门=foundation.md 成功度量 ✅ 已补入模板头；**B** V0 标杆切片（→阶段4 V0 spec + reusables 登记）；**C** foundation-review 必问命门（→阶段4 brief）。③ 标杆模块因删①升为 CC 漂移主防线。standards 诚实化（每条标执行者）用户定**先不动**。
- 阶段 3：✅ 完成（1376ee4）— ① 新建 `draft-foundation`（exec+structural）② draft-tech-design 瘦身（首期簇→存量兜底）③ CLAUDE.md 路由表。
- 阶段 4：✅ 完成（1376ee4 之后，**未 commit**）— **不拆 develop**（评估：foundation build 与 develop 共享核心、只差进料口 = sub7 撤回的格；draft-foundation 是身子不相交才拆——相反格）。落地：① develop exec 加「source=foundation 进料块」（G2 预检 + 全栈 + 建造单元=foundation-design.md + 单分支 foundation-v0 + 跳前端设计门 + 三处替换：阶段A自读地基件 / 阶段B用 foundation-review / 末端v0状态+登记标杆进 reusables）+ 第零步/阶段B/移交/Subagent 表 4 处小注 ② 新建 `templates/review-briefs/foundation-review.md`（逐关注点穷举验实际档≥应有档、安全项主动找反例验构造级、命门必问 C、标杆质量、走骨架完整且薄）③ develop structural 补 source 枚举/前置/判据/输入。**B（标杆登记 reusables）在 develop 移交；C（命门）在 foundation-review。**
- 阶段 5：✅ 完成（ebe7328 之后，**未 commit**）— ① plan-sprint 视觉地基包**框架/值二分**：走过 V0 的新项目 v1 地基包缩成"把 design.md 真值填进 V0 已建的 variables.scss 框架"，存量项目建全套兜底；check-sprint 的 baseline:visual 标记规则不动（核标记不核内容）② draft-prd 加载上下文加读 `foundation.md` 领域地图（功能挂核心实体、不另起领域）③ **draft-ux 不改**（它填 design.md 规格、V0 建 variables.scss 框架，两个产物；真值接线归 plan-sprint v1 地基包）。
- 阶段 6（骨架+status 同步，**未 commit**）：✅ skeleton/04（catalog 12→13 + draft-foundation 节 + source/develop 条目加 foundation）/06（G2 内涵+聚合标注 V0）/07（type 12→13、discipline 9→8、source 枚举、状态流转加 V0 两行）/README（12→13）/ templates/status.yml（v0 块示例 + source 枚举 + 计数）。grep 验：task-package.md 正确不含 foundation（走骨架无任务包）、skeleton/05 单任务生命周期无需改。**顺手修了 #24 遗留的 discipline 9→8 陈旧计数。**
- BRIEF#25 + STATUS 里程碑：✅ 完成（**未 commit**）。
- 阶段 7：✅ 完成（**未 commit**）— blueprint-layer 讨论小结加「收编标注」（领域涌现半边=其精简落地、ERP 重型蓝图仍 parked、层级判断完全继承）；全链路 grep 通读（16 文件一致铺开、无断链）。
- **重构闭环。本地 method-lab 6 commit（阶段2-6）+ 本批（BRIEF/STATUS/收编/计划）未推。push 待人类明确。**

## 完成总览（2026-06-29 闭环）
| 阶段 | 内容 | commit |
|---|---|---|
| 2 | init-project 共识步 + foundation.md 蓝图 | ce7e639 |
| 3 | draft-foundation 新建 + tech-design 瘦身 + 路由 | 1376ee4 |
| 4 | develop 接 source=foundation + foundation-review | ebe7328 |
| 5 | plan-sprint 视觉地基包二分 + draft-prd 接 foundation | d70de1d |
| 6 | 骨架(04/06/07/README)+status.yml 同步 | 8ad216f |
| 记录 | BRIEF#25 + STATUS 里程碑 + blueprint 收编 | 待 commit |
