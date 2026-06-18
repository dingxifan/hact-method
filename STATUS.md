# STATUS.md — hact-method

## 当前状态
- 当前阶段：**第三阶段·开发 hact-app**（进行中）
- 上次更新：2026-06-18

## 各阶段完成情况

| 阶段 | 状态 | 完成日期 |
|------|------|---------|
| 第一阶段·搭骨架 | ✅ 完成 | 2026-05-07 |
| 第二阶段·写结构层规范 + 主线执行规范 | ✅ 完成 | 2026-05-08 |
| 第三阶段·开发 hact-app | 🔄 进行中 | — |
| 第四阶段·写执行层规范（剩余7份）| ⏸️ 边用边补 | — |
| 第五阶段·团队引入 | ⏸️ 未开始 | — |

## 本阶段进展（第二阶段，2026-05-08 完成）

- **specs-structural/**：13 份任务契约全部完成（develop / pr-review / draft-prd-vN / draft-tech-design / plan-sprint / revise-doc / dispatch-new / generate-integration-tests / manual-test / deploy / wrap-up-iteration / init-project / harvest-notes）
- **specs-execution/**：13 份执行规范全部完成（init-project / draft-prd-vN / draft-tech-design / plan-sprint / develop / pr-review / manual-test / deploy / wrap-up-iteration / dispatch-new / generate-integration-tests / revise-doc / harvest-notes）；经评审修复 + 业务流程一致性检查
- **templates/**：初始化完成（standards/backend.md + standards/frontend.md + design.md + reusables.md + feedback.md + retrospectives.md）
- **重构**：hact-method 改为纯方法论仓（移除 projects/ 目录）；项目协调文件合并进各自项目仓
- **CLAUDE.md 更新**：补充工作区使用指南（何时在 hact-method 开会话 / 何时在项目仓开会话）
- **Gitee 推送**：https://gitee.com/dingxifan/hact-method

## 第三阶段当前进展（2026-05-08）

- `init-project` 已执行：`E:\group-code\hact-app\` 创建完成，_meta/input/background.md 已放入
- `draft-prd-vN` 进行中：已在 hact-app 工作区开启 PRD 会话

## 下一个起点

在 `E:\group-code\hact-app\` 工作区继续 `draft-prd-vN`（PRD 未完成）。

## 仓库拓扑

| 仓库 | 路径 | 用途 | 远端 |
|------|------|------|------|
| hact-method | `E:\group-code\hact-method\` | 纯方法论（skeleton + specs + templates） | gitee.com/dingxifan/hact-method |
| hact-app | `E:\group-code\hact-app\` | hact-app 代码 + 协调文件 | 用户自行推送 |
| human-ai-col | `E:\group-code\human-ai-col\` | v1 方法论（冻结） | gitee.com/dingxifan/human-ai-col |

## 已知风险

| 风险 | 可能性 | 影响 | 应对 |
|------|--------|------|------|
| hact-app 开发中发现骨架/规范有结构性缺陷 | 中 | 高 | hact-app 即压力测试，发现问题即修规范 |
| exec spec 覆盖不完整（仅写了主线5份） | ✅ 已解决 | — | 13/13 全部完成，已通过评审和一致性检查 |

## 历史里程碑

### 2026-06-18 方法论调整：Gate 签署前完成判据冷核（B 软版）+ draft-ux 回退修复

- **背景**：起于"同事开发时方法论没同步到最新"。推演发现该症状底下有三类根因：① 真·同步滞后（没拉新，git 能修）② 假·同步滞后（拉了、规范也在，但没照做）③ 已落地改动被后续提交悄悄回退。本轮主攻第②类。
- **病根（三层真相）**：CC 执行依据的是上下文里的快照而非"执行那刻的最新文件"，且最致命的第③层是"印象执行"——最新判据即便在上下文也按熟悉旧形状填、逐条漏核（hact-app V4 PRD 缺 `入口`/`draft-ux` 字段即此，判据 `6b39b49`/2026-06-03 早已生效）。重读不够（同上下文锚定），只能换隔离上下文的陌生 subagent 比"产物 vs 判据"。
- **意外发现（第③类活体证据）**：`5d53088` 落地的 draft-ux Step 2.5/3.5 冷审，被 16 分钟后 `5cfdedb`（自称"docs(meta)…表格格式化内容不变"）实际 -87/+34 删除，导致 execution spec 与 structural 契约 + 孤儿 ux-checklist 三者矛盾、运行时无冷审。已 `9074062` 从 5d53088 增量恢复。
- **落地（B 软版，hook 与上游 linter 延后）**：
  - `skeleton/06-gates.md` 新增 **§7「完成判据冷核协议」**（单一来源，G1–G5 参数化引用，防 5 份拷贝漂移）：派全新 subagent 隔离上下文逐条对抗核判据、自写凭证 `iterations/vN/gate-checks/G{N}.md`（带产物指纹）、人驱动项标 `N/A·人工`、🚫 人工抽看凭证兜底。
  - 5 份 `specs-execution`（draft-prd-vN Step7.5 / draft-tech-design Step5.5 / plan-sprint Step4.7 / manual-test 签 G4 前 / wrap-up 签 G5 前）各插短步骤引用 §7 + 签字前置 + 凭证纳入签字 commit；draft-tech-design / plan-sprint 的 Subagent 表补冷核行。
  - 5 份 `specs-structural` 完成判据各补「完成判据已冷核」。
  - 与既有 plan-sprint Step3.5 独审 / draft-ux Step3.5 冷审 **互补不合并**（深审是某条判据的输入，本协议核整张清单）。
- **明确取舍**：软版无机械防线——"彻底不做"和"假装做（六种伪造 pass）"都靠人在 Gate 现场抽看凭证兜底，待后续上 hook 补硬闸。
- **延后**：B3 hook 闸门、Layer A（模板空槽 + 产物 linter）、第①类 Step 0 改造。
- **记录**：`_meta/plans/2026-06-18-gate-criteria-cold-check/`（design.md 完整方案 + findings F1–F8）

### 2026-06-18 方法论调整：draft-ux 交互质量（②造前探选 + ③subagent 冷审 + ①行为化清单）

- **背景**：前一轮 design-fidelity 解决的是"保真"（照设计做得出来），本轮解决"设计质量"（设计本身好不好）。聚焦方向 A——CC 自己在 draft-ux 阶段怎么设计得更好。
- **病根**：不是"不懂 UX 原则"，是 ① 回归平均（无目标时输出最通用平庸解）+ ② 自评宽松（同上下文自我 review 被锚定、盖章）。抽象原则清单对此无效。
- **落地三招**：
  - **①** 新建 `templates/checklists/ux-checklist.md`：行为化、靠看就能答的问题（抗盖章）；只管结构/交互层，视觉归 design.md；与 frontend-checklist『设计保真』分工不同。
  - **②** Step 2.5 交互方案探选：非平凡画面 2-3 方案 + 取舍 + 选型（治回归平均），纯 CRUD 跳过。
  - **③** Step 3.5 交互质量冷审：**派全新 subagent 陌生视角审**（只喂 prototype.html + ux-checklist + 场景列表，不喂决策理由与生成对话）——经用户追问"自己对抗自己有效吗"后，由内联自我走查升级为上下文隔离冷审。自我批判只扛"可检查的遗漏/不一致"，判断/品味交人的 🚫 兜底。
- **修改文件**：新建 `templates/checklists/ux-checklist.md`；`specs-execution/draft-ux.md`（读清单+红线+状态表+Step2.5+Step3.5+收尾+Subagent 表）；`specs-structural/draft-ux.md`（判据+2、产物+2 段、输入+清单）。
- **parked**：同模型共享盲区 + ④ 跨项目 UX 参考样例库（harvest-notes `[UX]`）——先跑 subagent 冷审积累经验后再评估。
- **记录**：`_meta/plans/2026-06-18-ux-design-quality/findings.md`

### 2026-06-18 方法论调整：前端设计保真（design.md 必读 + pr-review 保真维度）

- **背景**：用户反映前端产出物经常偏离前置设计（交互/字体字号/组件复用）。专题研究（跨 hact-app + org-krm-v2）确认为**系统性、跨迭代复发**：29 条偏离记录，其中 org-krm-v2 硬编码颜色/间距横跨 v3→v5 至少 6 处（变量已定义却仍硬编码）；交互偏离（Tab 结构与 AC 不符、缺标签、分支遗漏）均拖到联调/验收才暴露。
- **病因**（与 2026-06-16 develop-loading-audit 吻合）：① design.md 在 develop 是"涉及视觉时"条件加载，靠自判 → 字号字体无人负责落地；② prototype.html 全程失联；③ develop/pr-review 只对照 standards，无设计保真对账闸口，唯一对账落在 manual-test（太晚）。
- **决策**：本轮落地 fix 1 + fix 2（fix 3 原型重新接入链路留待后续）。
  - **Fix 1**：`design.md` 升级为 frontend develop **无条件必读全文**；prototype.html 对应交互路径作实现基准。
  - **Fix 2**：pr-review 增设计保真维度——额外加载 design.md + prototype.html，新增通过/打回条件与「第四步：设计保真核查」。
- **修改文件**：
  - `specs-execution/develop.md`：精确加载上下文 +2 条（design.md 必读 / prototype.html 基准）；Step 4 视觉先对照 design.md 用 SCSS 变量；前后端差异表额外加载列改写
  - `specs-structural/develop.md`：relevant-standards 字段说明注明 design.md 为无条件必读
  - `templates/checklists/frontend-checklist.md`：新增「十一、设计保真」5 项
  - `specs-execution/pr-review.md`：frontend standards 加载 +design.md/prototype.html；通过条件第 4 条；打回条件 +1；评估方法「第四步」；快速通道允许变量替换、禁交互改动
  - `specs-structural/pr-review.md`：完成判据 +frontend 设计保真核查
- **研究与记录**：`_meta/plans/2026-06-18-design-fidelity/findings.md`

### 2026-06-18 方法论调整（续）：prototype.html 接入链路（fix 3）+ fix 2 口径收口

- **关键认识**：交互保真分两段——sprint/develop「照规格造」原型新鲜、AI 按约定实现；联调/人工「照现实迭代」人驱动、原型变旧。按阶段收口即可，无需"活规格/漂移维护"制度。
- **口径定案**：`design.md` 视觉对照适用**全部 frontend PR**（视觉规格跨迭代稳定）；`prototype.html` 交互对照**仅 `source=sprint` 的 PR**（联调/人工/B 类派生修复 PR 原型已旧，再卡=误打回）。
- **落地**：
  - `specs-execution/pr-review.md`（4 处）+ `specs-structural/pr-review.md`（1 处）：prototype 交互对照限定 source=sprint，design.md 视觉对照不限
  - `specs-execution/draft-tech-design.md`（2 处）：必读清单加 prototype.html；§接口设计加"逐画面对照确认接口字段满足画面数据需求"（develop 之前、原型最新鲜）
  - `specs-execution/generate-integration-tests.md`（3 处）：脚本生成读取集合加 prototype.html；前端场景用原型**软核对覆盖齐全**（不设硬闸口，超 15 条照旧降级 backlog）
- **明确不做**：manual-test 不动（人工阶段）；plan-sprint 不加原型锚点（与 ux-flows 行号重复）；不引入活规格制度；fix 1（develop 读 prototype）维持软参照。

### 2026-06-16 方法论调整：集成测试脚本移至 generate-integration-tests 阶段生成

- **背景**：org-krm v5 联调阶段，前端 pinchtab 脚本（预生成于 draft-tech-design G2 后）在实际执行时暴露出系统性假设错误，导致 15 条场景全部失败、脚本修正反复经历 8 轮迭代才稳定。主要问题：
  1. **路由假设错误**：脚本导航 `/org/$DEPT_ID`，但应用无此路由参数，必须点击树节点
  2. **pinchtab 工具行为未知**：`$PT url` 命令实际无输出；`"用户名 input"` role 不匹配（应为 `textbox`）；`<div @click>` 无 ARIA role 不可被 `find` 识别
  3. **数据假设错误**：`detail_md` 字段在 DB 中为 null，与 AC 描述的"渲染区块"形成缺口
  4. **认证注入不完整**：仅注入 token 不够，还需注入含 `review_scope` 的 user 数据
  - 后端脚本（curl）相对稳定，主要问题是一处字段名（`deptId` vs `dept_id`），1 轮修正即通过
  - 根本原因：TRD 阶段只有接口契约，没有实际运行的前端，**无法验证**路由、组件可访问性、工具行为、数据状态——脚本是"空中建筑"，只能在 develop 完成后才能写出稳定的脚本

- **决策**：废除 draft-tech-design 阶段的集成测试脚本预生成步骤；改在 generate-integration-tests 阶段（develop 全部合并后）主动生成脚本并立即执行

- **修改文件**：
  - `specs-execution/draft-tech-design.md`：删除 Step 6 中"集成测试脚本预生成"子任务（spawn subagent 预生成 + commit）；subagent 表格对应行同步删除
  - `specs-execution/generate-integration-tests.md`：将"脚本缺失时 Explore subagent 补写"从 fallback 升级为**主线**；删除"脚本已预生成"的前提假设；调整 Step 2 开头说明和上下文密度描述

- **不变**：draft-tech-design 仍输出 `scripts-vN.md` 索引格式约定（供 generate-integration-tests 参考场景覆盖范围），但不再预生成可执行脚本本体

### 2026-06-08 方法论清理：移除全部 Dynamic Workflow（计费口径对齐）
- 背景：Anthropic 2026-06-15 起将 Agent SDK / `claude -p` headless / GitHub Actions 等程序化 agentic 用量从订阅额度池剥离，改走独立 Agent Credit Pool 按 API 价计费。DW（`Workflow` 工具）是全仓唯一接近"自动化 agentic 用量"的形态，计费口径存在歧义
- 处置：将仅存的测试产物 DW 及其所有引用彻底删除，方法论全面回归"交互式会话 + `Agent` 工具"——后者跟随会话走 Max 订阅，不进 Credit Pool
- 删除：`workflows/` 整个目录（`adversarial-review.js` + `README.md`）；`docs/superpowers/` 下两份构建档案（plan 内嵌完整可运行脚本副本 + spec），删后 `docs/` 空目录一并移除
- 修改：`templates/CLAUDE.md` 移除「B 类自动修复（DW）」死引用段（原指向已于 2026-06-06 删除的 `b-class-develop.js`），改指向 `adversarial-review` skill；`skills/adversarial-review/SKILL.md` 删去指向 `b-class-develop workflow` 的跳过条件
- 保留：`adversarial-review` skill 本体（用 `Agent` 工具、交互式、不计费）；`_meta/plans/` 历史记录（纯日志、不含可运行脚本）
- 结果：hact-method 全仓零 DW、零 `claude -p`、零 GitHub Actions、零 Agent SDK——无任何会进 Agent Credit Pool 的内容

### 2026-05-31 方法论调整：status.yml 状态契约（hact-app 取数稳定化）
- 背景：hact-app 靠解析 queue/sprint.md/gates.md 等叙述性 markdown 取状态，格式漂移导致持续取错数
- 方案：新增**项目根 `status.yml`**（机器侧唯一数据源、项目级单文件、YAML 锁死 schema），现有 markdown 降级为「人看的视图」一字不动；状态进 YAML、文档正文走 API
- 项目级而非迭代级：B 类（bug/optimization）跨迭代、`iteration: null`，两迭代之间无活跃迭代时照样有家；多迭代并行靠 `iterations` 按版本分块 + task 带 `iteration` 字段
- 落地：新增 `skeleton/07-status-contract.md` 契约 + `templates/status.yml` 模板；10 份 exec spec 插入「做一个填一个」更新步骤（init-project 建文件；draft-prd-vN/draft-tech-design/plan-sprint/manual-test/wrap-up-iteration 签 Gate；develop 认领+done；pr-review merged+CR；generate-integration-tests/manual-test/dispatch-new 各自派任务追加 tasks[]）
- 总规则：凡往 queue/ 写任务包处同步追加 tasks[]（带 source/iteration），状态流转按 task-id 改
- 本轮只改 hact-method，不动 hact-app（其 sync 改读 YAML + 文档走 API 留待 hact-app 自身迭代）；CC 启动接续逻辑暂不改
- 计划与设计：`_meta/plans/2026-05-31-status-contract/design.md`

### 2026-05-31 方法论调整：个人积累与 pull 上提
- 引入"个人积累仓" `hact-notes-{姓名}`（每人独立私有仓）+ `harvest-notes` 上提 task（pull、只读、游标）
- wrap-up 第二步分流改向个人 notes；B 类 develop 就地分流（补 B 类无 wrap-up 盲点）
- draft-tech-design 双源（公共 + 本人 notes `[规范]`）+ vN+1 去重
- 骨架（01 权限例外 / 02 三工作区 / 03 management 边界 / 04 注册 harvest-notes）+ init-project Step4.5 成员 notes 登记 + CLAUDE.md Step0 同步 notes 仓 + 删除空模板 retrospectives.md
- 计划与发现：`_meta/plans/2026-05-31-personal-notes-accumulation/`

### 2026-06-03 方法论调整：新增 draft-ux 交互原型任务
- 痛点：开发完成后频繁出现交互设计缺陷（仅有 happy path、路径分支遗漏、入口不明确），根因是 PRD→TRD 之间缺乏对业务流的显式确认环节
- 方案：新增可选 task type `draft-ux`，插入 G1（PRD）与 G2（TRD）之间，产出场景列表 + mermaid 流程图 + 自包含 HTML 原型；三层递进：场景枚举（用户视角业务流） → 流程图（分支可视化） → 原型（路径可走通）
- PRD 联动：每个功能模板新增 `**入口**` 字段（触发来源）和 `**draft-ux**` 字段（需要/不需要）；完成判据补两条；G1 签署前明确触发决策
- TRD 联动：会话启动新增 draft-ux 就绪前置检查；必读文件加 `ux-flows.md`；接口设计段每个 API 注明服务于哪条流程路径（`# 服务流程：{场景名}`）
- 跳过条件：PRD 中全部功能标记 `draft-ux: 不需要` 时，TRD 前置检查自动通过，无需运行本 task
- 落地文件：`specs-structural/draft-ux.md` + `specs-execution/draft-ux.md`（新增）；`specs-structural/draft-prd-vN.md` + `specs-execution/draft-prd-vN.md` + `specs-structural/draft-tech-design.md` + `specs-execution/draft-tech-design.md`（修改）
- 方法论验证：以 hact-app v1 F3 Sprint 任务看板为对象跑通全流程，7 条场景 → mermaid 流程图 → HTML 原型，原型存 `hact-app/iterations/v1/prototype.html`

### 2026-05-08 第二阶段完成 + 第三阶段启动
- specs-structural/ 12 份 + specs-execution/ 5 份（主线）完成并推送
- hact-method 重构为纯方法论仓（projects/ 移除）
- init-project 执行，hact-app 本地仓创建
- PRD 背景文件写入 hact-app/_meta/input/background.md
- draft-prd-vN 会话开启

### 2026-05-07 第一阶段·搭骨架 完成
- 骨架 7 文档全部就位（01-06 + README）
- BRIEF.md 决策清单 20 条
- 骨架自检通过

### 2026-05-07 仓库初始化
- E:\group-code\hact-method\ 创建，git init
- 目录结构确定：迭代一等公民切法
