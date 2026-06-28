# STATUS.md — hact-method

## 当前状态
- 当前阶段：**第三阶段·开发 hact-app**（进行中）
- 上次更新：2026-06-28

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

`hact-method` 与 `hact-method-lab` 是**同一 git 仓库（gitee.com/dingxifan/hact-method）的两个 worktree**，共享对象库、检出不同分支，用于新旧方法**并行对比测试**：

| Worktree | 路径 | 分支 | 当前 tip | 角色 |
|------|------|------|---------|------|
| hact-method（旧版基线） | `E:\group-code\hact-method\` | `master` | `89d01ff` draft-ux 重构 | **旧方法**对照基线（已 reset 到 origin/master，2026-06-20） |
| hact-method-lab（最新） | `E:\Group-code-lab\hact-method-lab\` | `method-lab` | `ba9dce8` | **新方法**，含 loop-layer2 起的全部大改；与 `origin/method-lab` 同步 |
| hact-app | `E:\group-code\hact-app\` | — | — | hact-app 代码 + 协调文件（用户自行推送） |
| human-ai-col | `E:\group-code\human-ai-col\` | — | — | v1 方法论（冻结，gitee.com/dingxifan/human-ai-col） |

> 备注：`method-lab` 完整包含旧 master 的 51 个 commit（领先 17）。reset 前的本地 master tip `8304136` 已用 tag `master-pre-reset-8304136` 钉住，`git reset --hard master-pre-reset-8304136`（在 hact-method worktree 内）可完全还原。两 worktree 勿同时 checkout 同一分支。

## 已知风险

| 风险 | 可能性 | 影响 | 应对 |
|------|--------|------|------|
| hact-app 开发中发现骨架/规范有结构性缺陷 | 中 | 高 | hact-app 即压力测试，发现问题即修规范 |
| exec spec 覆盖不完整（仅写了主线5份） | ✅ 已解决 | — | 13/13 全部完成，已通过评审和一致性检查 |

## 历史里程碑

### 2026-06-28 视觉地基三件套 — 并入 2026-06-22 前端一致性框架，补「跨切面地基」结构盲区

> 触发：hact-app v8 开发包全 [merged] + 绿测试 + 联调 35 全绿，人工验收一打开即 15 条系统性视觉偏离（主色全错 EP 默认 #409eff vs 设计 #3370ff / 16px 视口外溢 / 侧栏宽 180 vs 208 / 脚栏带整块没做）。根因四缺口 R1（token 定义没接线）/R2（无全局基线层）/R3（跨组件地基活无人认领）/R4（像素无机械门禁）。本地 `method-lab`，**未 push**。

- **定性**：v8 与 parked 的 2026-06-22 前端一致性框架（待议 #17）**同根**。R1/R4 框架已识别；**真新增量 = R2/R3**——旧框架是「逐组件复用 + 逐规则 lint」视角，假设每个违规挂在某业务包里，但 EP 主题覆盖 / 全局 reset / body margin 这类**跨切面公共件不属于任何业务页**，plan-sprint 按页/组件切包天然漏掉（reusables 与 lint 两道防线之间的结构缝）。**「视觉地基包」是这次最有价值的产出**。
- **两处类别纠正**（用户原稿）：① token 落地**不能写进 check-sprint/check-gate**——这俩 linter 核 markdown 产物、**G3 时还没代码**；裸 hex grep / 主题覆盖 / 全局入口是**代码级**，必须落 develop 的 stylelint+lint 层。② 具体 stylelint 规则是**技术栈层**（哪个 UI 库/哪些路径），由 draft-tech-design 在项目仓播种，**不在 hact-method 建通用 check-visual-tokens.js**。
- **三件落地**（用户拍板口径：地基包 v1 硬性必有 + design.md 变更触发 / 视觉冒烟涉基线迭代必跑 / 本轮只落三件不碰组件复用）：
  - **① 视觉地基包**：plan-sprint Step 2 骨架规则（v1 含前端则地基包为前端首包、其余 frontend `depends_on` 它，内容 = 全局 reset + UI 库主题覆盖 + token 全局接线，标 `baseline: visual`；vN+1 design.md 变更触发地基跟进包）+ Step 3.5 brief 第⑤维度「视觉地基完备性」+ `check-sprint.js` 硬核（v1 含前端无 `baseline:visual` 包 → FAIL；vN+1 退 human）+ task-package 模板标记说明。
  - **② token 落地门禁**：`standards/frontend.md` 补两条强制（单一全局样式入口 + UI 库主题覆盖、禁库默认主色）+ `frontend-checklist.md` 段一加两机械项（全局入口存在 / 主题被覆盖，地基包 PR 必核）+ `draft-tech-design.md` Step 7 加「视觉地基约定」owner 块（与「测试基建约定」并列）。
  - **③④ 视觉冒烟断言**：`generate-integration-tests.md` 完整档涉视觉基线迭代**必跑**（不再问）+ 固化 3 条机械断言（实测 `--el-color-primary`==设计主色 / `scrollWidth-innerWidth<=0` / 关键容器尺寸==token），取数源 = `design.md` 新增「〇、视觉冒烟锚点」段（④并入③，不单列）。
- **拒绝的 over-engineering**（防膨胀）：像素快照/visual regression CI、design-tokens.json 导出工具链、per-task `visual-tokens-required` 字段、check-gate 加视觉核、通用 check-visual-tokens.js。理由记 `_meta/plans/2026-06-28-visual-baseline-package/findings.md §五`。
- **诚实账**：①是 ADD（核心增量，旧框架缺的格）；②是把 parked #17 想清的事落地 + 类别纠正（落对层）；③是复用既有 pinchtab 的小 ADD。`check-sprint.js` 已 `node --check` 过。
- **改动文件**：specs-execution（plan-sprint / draft-tech-design / generate-integration-tests）+ specs-structural（plan-sprint / generate-integration-tests / develop §字段规范 baseline）+ templates（queue/task-package / review-briefs/task-package-review / scripts/check-sprint.js / standards/frontend / checklists/frontend-checklist / design）+ 收口（待议 #17 / 2026-06-22 findings / 本 STATUS）。**已 commit `0784bf7` 并 push 到 `origin/method-lab`**（用户明确确认 push；分支非 master）；scoped commit，工作区其余无关 WIP 未纳入。

### 2026-06-20 develop 站「展开」四连改 — 单/批量合一 → 会话定标 → 执行模型翻转（独立审查 loop）→ 砍除 pr-review（merge-on-push）

> 接「撤销 sub7、单文件 develop.md(417)」。本会话沿 develop 站连做四步，把 develop 从「逐步人工门的线性 spec」改成「主线编排 + 执行 subagent + 独立对抗审查 loop + 自合并」的全自动模型，并连带砍除独立 pr-review。本地 `method-lab` 分支，**未 push**。

- **① 单/批量会话合一**（`4a8aeda`，417→356）：单任务=批量 N=1 特例，处理对象抬成「任务集 size≥1」，删头部模式表 + 批量会话整章 + 双认领块。货币=结构简化（消分叉），与 sub7 相反方向。
- **② 会话定标 + 批次名带 id 集 + 两级循环轻澄清**（`92fda1e`/`77b4c21`，356→360）：拆开 **PR 粒度**（依赖/plan-sprint 已管）与 **会话容量**（上下文/develop 拾取时定标）两个正交维度（findings F2）；批量按 files 估改动面提议依赖序前缀子集 + 软锚点 + 🚫确认。批次分支名 `{layer}-batch-v{N}-{id1}/{id2}/...` 携任务 id 集破撞车。Level1 任务级串行 / Level2 模块级 subagent 轻澄清。货币=正确性（主动定标替被动重置），ADD。
- **③ 执行模型翻转：主线编排 + 执行 subagent + 独立审查 loop**（`1f7b463`，360→270，新建 `templates/review-briefs/develop-review.md`）：全自动 loop 取代逐步 🚫 人工门，人工只守一个 upfront 门=前端设计到位。主线编排（定标/设计门/浮决策/末端全量/提交）；每任务「读懂→计划→写→自绿」下沉执行 subagent（隔离上下文→批次可放大）；每任务质量由**独立对抗审查 subagent**（自读权威原文=任务包/diff/standards/测试，绝不收执行体自评）把关，阻断即回炉、3 轮超界升级。三层防线（deterministic 绿 → 独审语义 top-up → 人工守设计品味）防「AI 判 AI 盖章」。findings F3：独审输入必须权威原文、唯一留人门是无权威原文的设计品味。诚实账：结构重写，主货币=质量升级 + 上下文经济，净缩 −90 为附带、+39 brief 是 ADD。
- **④ 砍除 pr-review + merge-on-push（BRIEF 决策 #24）**（27 文件改 + 删 2 spec ~324 行）：用户拍板路 A——新 develop 内置独立审查后，pr-review 的内容复审全冗余 → 废除 `pr-review` task + `review` discipline（discipline 9→8、task 13→12），develop 提交 PR 后自合并到 master。**治理代价明确接受**（master 写入无第二人工门），仅安全敏感改动（权限/认证/数据隔离）保留 architecture 人工裁决（develop 末端 escape-hatch）。3 缺口安置：安全→escape-hatch、设计保真比对→升进独审 brief 第 6 类、code_reviews[] 留痕→develop 末端写。Fast Mode 一并删（全自动下无快进意义）。`[done]` 退瞬态、终态 `[merged]` 由 develop 自落定。改动遍及 skeleton 01-07 / templates / 下游 specs / guide / BRIEF；全仓 grep 验零悬挂引用（残留均为「记录砍除」的有意表述）。
- **git**：本地 `method-lab` 含 ①②③④ 全部，领先 origin，**未 push**（master/推送严格，待用户明确）。

### 2026-06-20 develop 站：撤销 sub7 家族拆分 — 取回单文件 develop.md，灭掉 core+3 壳，在原基础上重启致密化

> 管线走到 develop 站。用户复盘 sub7（2026-06-19 把 develop 拆成 `develop-core`+3 薄壳）**判为负收益**，拍板「取回 sub7 之前的原文件、灭掉家族、在单文件基础上重新讨论致密化方案」。本轮只做**撤销 + 接线反转**（致密化"展开"留下一轮，先和用户讨论打法）。本地 master，未 push。

- **诊断（数据 wc -l 校正）**：sub7 是 `develop.md`(417) → 家族 519（core 308 + sprint 124 + repair 41 + b 46），**净 +102 / 1→4 文件 / 跨文件步号耦合 / 三倍 intake·handoff 样板**。唯一收益（repair·b 会话少载 ~40 行批量逻辑）远抵不过维护代价。**佐证**：structural 侧当初就以「拆则复制共享判据、反 §2 净收缩」为由**没拆**（保持单契约 79 行），exec 拆分与它自相矛盾——本轮让两侧重新一致。
- **撤销动作**：① `git show 755d04a:specs-execution/develop.md` 还原单文件（417）② 补回 3 个 post-sub7 delta（standards 归位路径 / 测试脊柱 Step5 例子规格 / fb9fa9f 步号 Step7）③ `git rm` 四家族文件 ④ 外科式反转 14 处接线（**非整体 git restore**——这些文件多承载 pipeline-reshape 后续大改，整体还原会抹掉）：structural 契约 / CLAUDE.md 路由+Step1 表 / status.yml+skeleton07 type 枚举 14→12 / skeleton04 catalog+属性+§6 / dispatch-new·gen-it·manual-test·plan-sprint 的 `type: develop` / draft-tech-design·pr-review 执行层指针 / guide 00·03·99。
- **保 delta 纪律（关键，没回退）**：sub7「顺手修 dispatch-new b-queue pre-existing bug」+「status.yml type 补全」+ d83e722 测试脊柱 + e83fb53 standards 归位 + fb9fa9f 重号——全部**保留**。反转规则=「`develop-sprint/repair/b/core → develop`；`b-queue` 保留；`type` 字段保留、值改 `develop`」。
- **验证**：grep 全仓 live 文件零家族残留（仅本 STATUS 历史里程碑保留为日志）；develop.md 零 shell 引用 / 3 delta 在场 / 无 iterations/vN standards 残留。`git diff` 净 −519 家族 + 反转接线、新增 develop.md 417 = 回到 ~原始 + 保留改进。
- **诚实账**：这是**撤销一次结构 reorg**、不是减肥也不是加规则——回到 sub7 前的单文件结构正确性（决策#14 的"task.type 真路由"本就不该靠拆 exec 文件实现：task.type 仍是 dev-frontend/dev-backend，source 是属性）。**真正的致密化（换语气那把刀）留"展开"轮**。
- **下一步**：在单文件 develop.md(417) 上致密化，但 develop 站特殊——**无检查器（门卫无可跑）**、末端 npm test/lint 实测非 spec 内审，四象限"验证→门卫"格不适用；可压的是教学体冗余 vs sub7 导航知识（抽即掏空）要分清。**先与用户定打法。**

### 2026-06-20 review-briefs/ pattern 推广到 PRD + tech-design — 三个末端审查 brief 全部外置，spec 正文只留派发指针

> 接 plan-sprint 站 brief 外置（建成 `templates/review-briefs/task-package-review.md` + 命名规范）。本轮把同款 pattern 推广到管线另两个末端内容审查：PRD Step 7.5、draft-tech-design Step 5。本地 master，未 push。

- **新建两份自包含 brief**（与 `task-package-review.md` 同结构：HTML 注释头 = 命名规范/派发/独立性 + 「你是独立审查员」+ 【自读输入】+ 【默认假设】+ 【逐类检查】+ 【边界】+ 【输出格式】）：
  - `templates/review-briefs/prd-review.md`：审 `iterations/vN/prd.md`，subagent **自读**定稿 prd.md（+ background.md），三维度（内部一致性 / AC 可验性 / 覆盖完整）。
  - `templates/review-briefs/trd-review.md`：审 `iterations/vN/trd.md`，subagent **自读** trd.md + prd.md（+ ux-flows / prototype），四维度（内部一致性 / AC 真承接 / 字段满足画面 / 覆盖完整）。
- **spec 正文塌缩为派发指针**：draft-prd-vN Step 7.5、draft-tech-design Step 5 各把 ~10 行 inline brief（逐条喂 subagent 的指令）→ 1 行「派全新 subagent 读该 brief、自读输入、输出问题清单」。两份 exec spec 共 **−17 行**。
- **货币（同 plan-sprint brief 外置，诚实账）**：主 context 减负 + 单一来源防漂移，**非净收缩**——内容是「搬」到 brief 文件（subagent 隔离按需读，主线全程不再持有审查维度清单）+ 升固化（subagent 自读权威原文，无主线转手失真）。新增两文件不进主 context。
- **pattern 钉死**：管线三个末端审查 brief（task-package / prd / trd）现全部入 `templates/review-briefs/`，命名 `{被审产物}-review.md`，live 引用、不入项目仓、不改 init-project；审查维度改动改 brief 单一来源、spec 正文不重述。
- **git**：本地 master 含此前全部 + 本轮，领先 origin 二十余 commit，**全部未 push**（master 严格）。

### 2026-06-20 管线续走 plan-sprint 站：致密化（340→275 / −19%）— Step 3 折叠重抄 + 门卫散文收薄 + 换指令体

> 接 draft-tech-design 站。沿管线往下到 `plan-sprint`（实测最胖 ~340 行）。照「单环节致密化方法」§五 6 步走四象限。**纯致密化、无结构改动**（契约字段/产物/判据未变，只动 exec 正文散文）；本地 master，未 push。

- **`specs-execution/plan-sprint.md` 340→275 行（−65/−19%）**。四象限拆账：
  - **格式→模板/linter（真减肥主力）**：Step 3 原把 `depends_on` 写法 / `reference` 行号要求 / AC 回链格式 / api-contract 平铺规则**逐字重抄**进正文，而这些已在 `templates/queue/task-package.md` 模板注释 + `check-sprint.js` + structural 完成判据**三处**存在。正文停止重抄，只留「模板讲不了的判断与跨文件来源」（数量策略 / AC 例子来源 PRD幕1·TRD幕2 + revise-doc 路由 / reference 前后端同场景名对齐锚点 / api-contract 推导来源 + 确认节点）。
  - **验证→门卫接管**：Step 4.7「不得手改报告、不得跳过」+ Step 5「退出码 0 才签」前置散文删——签字 commit（stage queue/+sprint.md+gates.md）时 pre-commit 门卫按路由跑 `check-sprint.js`、红则拦 commit，「跳过 linter 偷签」机制上做不到（同 PRD Step 7.4/8）。
  - **过程判断→换指令体**：全文教学体→指令体。
- **不可动部分（解释 −19% 弱于 PRD −44%）**：Step 3.5 sub-agent mandate ~36 行 brief 逐条保留（方法 §五 第 4 点：末端 agent 指令必须固化进 brief，否则退化泛扫+盖章）+ 选项菜单/骨架表/交付方式表/sprint.md 格式等功能输出模板是结构非散文。真可压散文集中在 Step 3 + 语言两处。
- **末端 agent 与 AC 链均为既存资产、非本轮 ADD**：Step 3.5 独立对抗审查 = PRD Step 7.5 的同款机制（plan-sprint 早有）；AC 链落点（任务包 `(源：AC-nn)` 回链 → check-sprint 逐条正反向）sub5/sub6 已机械，残量忠实性留 Step 3.5 + 签字人——**本站无 AC 链 bug 可修**。
- **诚实账**：货币 = 致密语言（真净缩，零 sub7）+ 搬运到模板（单一来源防漂移）+ 门卫接管（forcing）。不据某一件宣称总净收缩。
- **后续·brief/格式外置（同站第二刀，用户提的 loop 思想延伸）**：把"用即弃的成品文本"从 spec 正文搬到独立文件、消费时按需读——**货币是主 context 减负（机制 #1）+ 去重，非净收缩（总量是"搬"）**。
  - **抽离三判据**：①是"成品"非"过程散文" ②单点/靠后/条件用（全程驻留是死重）③消费者能按需读（subagent 隔离读=最优 / 主线到那步才读）。判断散文、生成-map、主线逻辑一律留。
  - **#1 Step 3.5 审查 brief（~36 行）→ `templates/review-briefs/task-package-review.md`**（新建目录+类）。brief 改**自包含**（subagent 自读 prd/trd/standards/queue，不再靠主线注入占位符）；主 context 全程不再持有 brief、3.5 时也不再转手喂（消除主+子双份）；固化更强（subagent 读权威原文，无转手失真）。Step 3.5 从 ~50 行塌到 ~22（留引子 + 派发 1 行 + 四类摘要 1 行 + loop 表）。
  - **#2 Step 4 sprint.md 格式 → `templates/sprint.md`**（与 prd.md/trd.md 同级 root）。顺带消掉 exec↔structural 的 sprint.md 重复（structural 改指针）。
  - **命名规范（本次定）**：产物格式模板 `templates/{产物名}.md`（root，镜像 iterations/vN/{产物}）；subagent 审查 brief `templates/review-briefs/{被审产物}-review.md`（live 引用、不入项目仓、不改 init-project）。
  - **plan-sprint exec 275→226（−49）**。**pattern 已立**：PRD Step 7.5 / draft-tech-design Step 5 的 brief 后续按 `prd-review.md` / `trd-review.md` 同规收入 `templates/review-briefs/`（样本跑顺后做）。
- **后续·Step 3 结构化（同站第三刀，用户提议）**：Step 3 那段"写包判断核"（depends_on / acceptance-criteria / reference / relevant-standards / api-contract 五字段的判断与跨文件来源）从 5 个 prose bullet → **逐字段表**（字段 | 怎么填 | **验证归属**）。**货币是理解 + surface「验证归属」模型（谁 check-sprint 机械、谁 Step 3.5/签字人留人）——非减肥，226→231（+5）**。结构化值当**仅因内容天然逐字段并行**（表格主场）+ 验证归属本散在各处、提成一列正好把"质量控制 not 规范控制"画进 spec。AC 行最富（五件事），全表版可读、未撑爆。残留格式重抄（AC tag、例子写法）已推回模板。如实记成"结构改进"不误框净收缩。
- **下一站**：`develop 家族`（develop-core ~308 + 3 薄壳），但 sub7 刚重构（2026-06-19）、且无检查器（门卫无可跑），**入手前先问用户走哪站**（可能先放，跳 pr-review/manual-test）。或先把 review-briefs/ pattern 推广到 PRD/tech-design。
- **git**：本地 master 含 sub1-7 + 乙 + PRD/门卫 + draft-tech-design 三件 + 本轮 plan-sprint（致密化 + brief/格式外置），领先 origin 二十余 commit，**全部未 push**（master 严格）。

### 2026-06-20 单环节续走 draft-tech-design：致密化 + standards 归位 + 步骤重排（三件依次落，沿管线往下走）

> 接「门卫样本建成 + 致密化方法成稿」。用户定调"沿整个开发管线一个个往下走，同时审 AC 链有效性"。管线顺序 draft-prd✅→draft-ux✅(无改)→**draft-tech-design 本轮**→plan-sprint→develop→…。本会话把 draft-tech-design 三件依次做掉，三个独立 commit（本地 master，未 push）。

- **件 3·致密化 + Step 5.5 末端内容审查**（commit `b090a2d`）：接口设计段从 cram 单行拆三 bullet（回链承接/幕2精化/字段对画面）；新增独立内容审查（陌生视角 subagent 派发 brief，验 linter 兜不住的内容有效性）。**诚实账**：283→307 净 ADD——§接口设计原为行高效 cram 单行，拆 bullet 增物理行但降阅读密度；Step 5.5 是"验内容"的 ADD 非堆规则。印证方法文档"单看行数会误判"。
- **件 1·standards 归位为项目级活文档**（commit `e83fb53`，18 文件，决策#17 修订）：`standards-{shared,frontend,backend}.md` 从 `iterations/vN/` 移到**项目根**，与 decisions/reusables/design 同级。生命周期从"每期从上期副本重生"→"v1 播种、vN+1 原地增补"的单一真相源。**病根**：standards 是代码库级编码约定、本质跨迭代，per-iteration 重生成产生副本链 + 真相源含糊 + **并行迭代约定漂移**（v2/v3 各持副本可不一致，错的）。`iterations/vN/` 混了真·迭代内容（PRD/TRD/gates/sprint）与错放的项目内容（standards）。历史基线靠 git，per-iteration 冻结快照无活消费者（review 永远用当前）。接线：draft-tech-design Step4 重生→增补 + 双源去重对照现有 standards；plan-sprint/develop-core/pr-review/manual-test/revise-doc/generate-integration-tests 加载路径改项目根；init-project 建三份空桩（与 design.md 同模式）；templates/standards 头注 + skeleton/04 + guide/02 + CLAUDE.md 结构图 + BRIEF #17/#23 同步。
- **件 2·步骤重排 + 整数重编号**（commit `fb9fa9f`）：把 TRD 验证（linter + 内容审查）从"签字前最末端"前移到"写完 TRD 立即"，排在用户确认与 standards 之前——**在最便宜处（机器/陌生视角）先验，用户看到的是已过两关的稿**。门卫在 Step9 签字 commit 复跑 linter 兜结构漂移（早验之所以安全正因门卫兜底）。去小数重编号：1 疑点 / 2 骨架 / 3 写TRD / **4 linter / 5 内容审查 / 6 TRD确认** / 7 维护standards / 8 知识沉淀 / 9 G2 签字。外部引用同步（structural / develop-core Step4→7 / init-project）。
- **AC 链审查结论（draft-tech-design 段）**：链路本身机械化已收口（check-docs 逐条正反向 + 门卫路由 trd→check-docs），无 bug；残量 = 精化忠实 + 载体真承接（固有语义），现由新 Step 5 末端审查 + 签字人 + pr-review 三层兜。本段不是减肥（致密化）就是结构修正（standards/重排），货币各异。
- **git**：本地 master 含 sub1-7 + 乙 + PRD/门卫 + 本轮三 commit，领先 origin 二十余 commit，**全部未 push**（master 严格）。

### 2026-06-20 门卫（HOOK）样本建成 + 单环节致密化方法成稿 — PRD 阶段四件机制凑齐，配方可复制

> 接 HOOK/DRY 双 park。用户定调：**HOOK 全局 rollout 仍不划算，但把 PRD 阶段当样本做"全套"再总结方法**。补齐 PRD 样本缺的第 4 件机制（findings §七-3 forcing function，唯一没碰过的），从完整样本抽出可复制配方。commit 本地 master，未 push。

- **门卫建成**：`templates/scripts/pre-commit-hook.sh`——签字 commit 时按 staged 文件路由跑对应 check-\*.js（prd/trd→check-docs、sprint/queue→check-sprint、gates.md 新增 G4/G5→check-gate），红则拦 commit。**四场景实测全过**：红 PRD 拦 / 绿 PRD 放 / 无脚本 no-op 放行（存量仓兼容）/ gate 路由正确抽 `G4 v2`。
- **判官+门卫模型钉死**（findings §八）：linter 是判官（查产物对不对），但"记得跑判官、退0才签"若只写散文仍会在 context 失真；门卫自动跑判官、红拦 commit，那句散文才能整段删——强制它的不再是文字、是闸门。这是本方向**唯一没碰过的第三机制**（地基✓判官✓早就位，缺门卫）。
- **接线**：init-project（Step3 hook 源 tracked 入仓 + Step4.1 git init 后装 `.git/hooks/` + clone 重装一行说明）；删 draft-prd-vN Step7.4 强制散文（降提前自查+门卫兜底）/Step8 签字前置；06-gates §7 加「判官+门卫」段 + 三处「不得手改报告、不得跳过」→门卫接管。
- **暗礁全兑现**：存量无脚本/无 node → no-op 放行（不拦死 hact-app v1-4）；跨平台 Git Bash（POSIX sh 实测）；护栏非密码锁（`--no-verify` 可绕、`.git/hooks` 不随 clone、队友须重装）已明示为**合作者强制出路、非安全边界**（Goodhart 接受）。
- **方法成稿** `_meta/plans/2026-06-20-pipeline-reshape/单环节致密化方法.md`：**四件机制 + 一把语言刀**的职责分工矩阵——格式→linter+门卫｜填写说明→template｜内容有效性→末端 agent｜过程判断→spec 正文（且换指令体）。正文只剩第四象限 → 自然致密。含**诚实账**（各机制货币不同：致密语言=真净收缩主力且零 sub7 陷阱；template/门卫=搬+forcing；末端 agent=ADD 但验内容非堆规则）+ **套下一份 spec 的 6 步**。
- **诚实账**：门卫删的强制散文小（~3-5 行/份），ADD 是脚本（不进 context）；真减肥主力仍是致密语言。四件凑齐才是完整样本，单看行数误判。
- **git**：本地 master 含 sub1-7 + 乙 + PRD 致密化 + 本轮门卫，领先 origin 十几 commit，**全部未 push**（master 严格）。

### 2026-06-20 HOOK/DRY 量账后双 park + 单环节 loop 试点（PRD 致密化）— 点破「换语气」是最高 ROI 减肥杠杆

> 接乙-1+乙-2。本会话先量 HOOK/DRY 两杠杆的账（防 sub7 陷阱），均判净收缩不划算 park；用户改提「单环节 loop」试点，拿最熟的 PRD 试三思维同走。commit `72902eb` feat + `50fc5bc` docs（本地 master，未 push）。

- **HOOK 量账后 park**：删 ~15 行强制散文（"退出码0才签/不得手改/不得跳过"散 6 文件）vs 加 ~60-85 行脚本（识别签哪 Gate→跑对应 check-*.js + 无脚本 no-op + 跨平台）。教科书 sub7 账；脚本是 code 不进 context，真货币是 forcing-function（§七-3 唯一没碰的第三机制）但净收缩小。暗礁挖清（存量 no-op/跨平台/护栏非锁）存档待重启。
- **DRY 量账后 park**：subagent 全读 16 份 specs-execution 测绘——全语料仪式 ~520-580 行，**真净收缩上限仅 ~130-155 且 per-session context 几乎不动**；占大头的 #2 会话启动/断点续做 ~240 行是 sub7 陷阱（各 task 实质导航知识伪装成仪式，抽即掏空）。clean top-3=快速通道直修/选项菜单/签字三件套。货币是「单一来源防漂移」非行数 → 用户判性价比不足 park。
- **单环节 loop 试点·PRD（活线）**：思路（用户）= linter+hook 管格式 / 末端独立 agent 审内容 / template 接填写说明 / 语言对 CC 极简化；视觉移交 draft-ux（任务重划非减肥）。`draft-prd-vN.md` **311→175 行（−136/−44%）**：① 极简语言 ~70 ② template 接走 ~50（含变更摘要 33 行→template 注释）③ 视觉移交删 Step5 ~11（draft-ux Step1.3 早拥有 design.md）④ 新 Step 7.5 末端内容审查 +18（陌生视角审一致性/AC可验性/覆盖，"是否用户真要的"归用户守 design §10，与子计划3删的格式冷核橡皮章不冲突）。配套 prd/design template + structural 同步。
- **真发现（写入 memory）**：最大那刀 ~70 行**不是去重/移交、是「换语气」**——spec 大量是给人读的教学体冗余，读者其实是 CC（要指令体）。findings §六「200行仪式」相当部分是给人读的冗余措辞，非仪式重复。**致密化 = 每份可用 / 零 sub7 陷阱（只把同义写短）/ 唯一代价纯人工逐份改+密度微增误读**——绕开 hook/DRY 碰不到的那块。
- **用户验收**：PRD「能接受，直觉还有 10-15% 空间但已 <200，先这样」→ PRD 不再压。**下一步候选（待点头）**：draft-tech-design(~283)/plan-sprint/manual-test；develop 家族 sub7 刚重构先放。
- **git**：本地 master 含 sub1-7 + 乙 + 本轮，领先 origin 十几 commit，**全部未 push**（master 严格）。

### 2026-06-20 pipeline-reshape 开启 + 测试脊柱前置（乙-1+乙-2）— 流水线从「末端验证瀑布」转「贯穿脊柱」，HOOK 待跨会话续

> 承 loop-layer2 §十四「流水线形状之疑」。第 0 层决策（用户拍板）：**先重定形状**（垂直切片 + 测试脊柱前置），非现形状内打补丁。loop 第二层 / hook / 蒸馏交接 / DRY 降为形状内杠杆。记录见 `_meta/plans/2026-06-20-pipeline-reshape/`（design.md + subB-测试脊柱前置-design.md + task_plan.md）。

- **第一步选乙先行**：甲（竖片演练）因「hact-app 不重要、随时可停」出局；丙（draft-tech-design shared-type-first）经重启纪律量出删不动散文（sub7 同源）且不推进形状本体 → 用户改选乙（测试脊柱前置）。
- **Q3 两幕脊柱**：幕1 AC 行为例子前移 PRD（CC 起草 / 产品验证，坏 AC 最便宜处暴露）+ 幕2 draft-tech-design 精化为技术精确规格。「非技术产品写不了例子」是伪障碍（CC 起草 + 产品验证同性质）。
- **幕2 硬纠正**：原稿「编译成可运行红测试文件」撞 2026-06-16 决策（TRD 无运行代码、预写测试是空中建筑，org-krm v5 联调 15 条全废）→ 改「只精化例子规格，runnable 物化守 develop」。
- **乙-1 立脊柱（11 处）+ 乙-2 末端收口（4 处）** 已落（commit `d83e722` feat + `892be13` docs，本地 master，未 push）。乙-2 摘 manual-test「人在末端逐条手验不可视区正确性」冗余，改脊柱+联调测试结果机械带过；顺修 sub3c 遗留悬挂引用（manual-test structural §7「G3」→ G4/G5 人工兜底）。
- **两次诚实账纠偏**：乙 的货币是**结构收益**（反馈环短 / 坏 AC 早暴露 / 验证归属清晰 / 脊柱给蒸馏一个机器盯得住的锚），**非 spec 净收缩**——主体是「搬」（操作化 TRD→PRD）+ 摘人冗余，非删大段散文。**真净收缩货币在 hook（forcing function）+ DRY 仪式去重，不在脊柱**（findings 地图 §七-九）。
- **乙-3（linter presence）parked；下一步 = HOOK**，待跨会话（上下文预算），起点种子见 pipeline-reshape/task_plan.md。
- **git**：本地 master 含 sub1-7 + 本轮，领先 origin 十几 commit，**全部未 push**（master 严格，待用户明确）。

### 2026-06-19 sub7：develop 拆分（loop 第二层先 park）— 471 行单 spec → 共享核心 + 3 薄壳，兑现决策 #14

> 接 sub6（结构性审查 AC 链路收口）。会话 9 起点是「开始 loop 第二层」，但读 design §2.5 + findings §二后判定 loop 第二层 ROI 被 sub1-6 摊薄（per-API 拆分是编排 ADD/不删散文；develop 模块级 loop 已被 sub2 删 Step5.5 做掉）→ 用户确认 **park loop 第二层**，火力转 **develop 拆分**（findings §三 #1：471 行 spec 是规范膨胀根本原因，违背决策 #14「task.type 是路由键」）。

- **关键认识**（校正 findings #1）：source 分歧集中在**边缘**（intake 拾取/Gate + handoff 移交/feedback），核心实现流 Step 1–7 **source 无关**；自然分组是 **3 不是 5**（integration/manual-test 组内仅移交文件名差异，bug/optimization 几乎无差异；checklist「完全不同」是 **layer** 驱动非 source，findings #1 略夸大）。
- **方案 A（用户拍板）**：`develop.md`（417 行）→ `develop-core.md`（Step 1–8 实现核心 + 会话收尾共用段，source 无关）+ 3 薄壳 `develop-sprint`（G3 前置 + sprint.md 拾取 + 单/批量会话）/ `develop-repair`（integration·manual-test，queue/，session 移交）/ `develop-b`（bug·optimization，b-queue/，b-tasks.md + 就地分流 notes）。`source` 选壳；`task_type`（dev-frontend/backend）正交不变。
- **接线 10 处**：templates/CLAUDE.md（路由表 + 家族说明 + Step1 推断表）、skeleton/04（catalog 拆 3 行 + §6 重写 + 属性表）、skeleton/07 + templates/status.yml（type 枚举 12→14 + 状态机行）、specs-structural/develop.md（家族共享契约 + **顺手修 dispatch-new b-queue pre-existing bug**）、plan-sprint/generate-integration-tests/manual-test/dispatch-new（status.yml tasks[] 补 type 字段）、draft-tech-design/pr-review（执行层指针改 develop-core.md）、guide 00/03/99。
- **诚实净收缩账（≠ §2 净收缩）**：这是**结构重构、不删规则**，总行 **+102**（417→519：core 308 + sprint 124 + repair 41 + b 46）。**未达 design §7 软目标「≤471」**——原 spec line-efficient 恰因它 cram。真收益是**结构正确性**：① 决策 #14 兑现（task.type 真路由，无内部 source 分支）② per-session context 降——repair 会话 349（−68）、b 会话 354（−63）、sprint 432（+15），crammed 进来的两条路径瘦身且各会话不再载别路径逻辑。硬红线（壳复制核心）未触发，壳真薄。**CC 曾在 AskUserQuestion 误把方案 A 框成「满足 §2」，已纠正；用户明知 +102 非行数净收缩，仍判定结构收益 > 行数代价（raw 行数对 reorg 是错判据），选接受。**
- **loop 第二层**：正式 park（非删除，地基仍在；若日后要更狠减 generator 规则可重启，前置 TRD shared-type-first）。
- **当前 git 状态**：本地 master 含 sub1–7 全部改动，领先 origin/master 多 commit，**全部未 push**（master 严格，待用户明确确认）。

### 2026-06-19 sub6：TRD↔PRD AC 覆盖机械化 — 「覆盖映射自检」从「留人」升「机械」（AC 链路三段全机械对账）

> 接 sub5（PRD AC 稳定 id）。sub5 铺好 `AC-nn` id 后，本轮把 draft-tech-design 仍留人的「覆盖映射自检」也升成机械——结构性审查方向的最后一段 AC 对账缺口。

- **关键认识**：sub5 task_plan 担心的「可视/不可视分叉」（前端交互类 AC 无后端接口可挂）**实测不成立**——回链 tag `# 满足 AC：AC-nn` 是**载体无关**的，无论挂在后端接口、前端模块还是 ux-flows 场景都是同一行格式。check-docs 全局扫 `满足 AC` 行抽 `AC-nn` 即可，不必区分载体。残量 = 忠实性（载体真承接 vs 仅 id 在场），与 sub5 同款留人模型。
- **落地**：`check-docs.js`（`checkPRD` 返 `acIds` / `checkTRD` 扫 `acRefs` / `checkCross` 加逐条正向挡悬空 + 逐条反向验覆盖 / 新增 `human` 级别 + 🧑 段，存量退兜底）；`trd.md` 模板（接口块 `# 满足 AC` 行 + 注释、模块段注释）；spec 接线 4 处（draft-tech-design exec 覆盖映射 bullet 人工→机械 + Step5.4 + FAIL 处置 + 签字前置；structural 完成判据；skeleton 06-gates G2）。
- **净收缩**：删 1 个人工逐条对照步 → 升 linter 机械 FAIL；签字人只兜忠实性。**AC 链路三段（PRD AC-nn → TRD `# 满足 AC` 回链 → 任务包 `(源：PRD AC-nn)` 回链 → 测试）至此全机械对账**。ADD 是 linter 代码（code≠prose）。
- **自测全过**：全覆盖 PASS / 漏覆盖+悬空 2 FAIL / 存量旧 AC1 退人工 / 真 hact-app v4 不崩走兜底 / 仅 PRD 不崩 / raw 模板 parse 不崩。
- **当前 git 状态**：本地 master 含 sub1–6 全部改动，领先 origin/master 多 commit，**全部未 push**（master 严格，待用户明确确认）。

### 2026-06-19 sub5（sub3c parked 衍生）：PRD AC 稳定 id — 逐条 AC 反向覆盖从「留人」升「机械」

> 接「结构性审查收官」里程碑。本条记四子计划收口后落地的 parked 衍生项（非原四子计划之一）。设计稿 `_meta/plans/2026-06-19-structural-review/sub5-AC-id-机械化-design.md`。

- **背景**：sub3c D3 只做到 AC 反向覆盖的**功能级**机械，**逐条** AC 反向覆盖因「PRD AC 无稳定 id、无法机械匹配任务包 tag 自由文本」而留人。本轮补齐。
- **三决策**（用户拍板/授权）：① id = **全局唯一 `AC-nn`**（跨功能连续，非功能内重号）② **append-only + 允许空号**（增删不复用号，避免编辑打散已落地 tag）③ **删功能级覆盖换纯 id 匹配**（逐条严格强于功能级，check-sprint 净瘦身）。
- **链路串 id**：PRD `AC-01` → TRD `# 满足 AC：AC-nn` → 任务包 `(源：PRD AC-nn)`（可选人读后缀 `·{关键词}`，linter 只读 id）→ check-sprint 精确串匹配。
- **落地**：模板（prd.md AC 槽 `AC1`→`AC-01` + 注释、task-package.md tag 注释）；`check-docs.js` 加 PRD AC id 全局唯一校验；`check-sprint.js` 加 `prdAcIds`/`acRefIds` + 逐条正向（id 存在性挡悬空）+ 逐条反向（每条被引用），删功能级覆盖块 + `referencedFeatures`/`reFeatRef`/`prdFeatures`，🧑 段「逐条覆盖留人」→「逐条忠实性留人」；spec 接线 6 处（draft-prd-vN/plan-sprint exec+structural/draft-tech-design/develop structural/skeleton 06-gates）。
- **残量切分**：逐条**覆盖**=机械 FAIL；逐条**忠实性**（内容真覆盖而非仅 id 在场）=语义，留 Step 3.5 独审 + 签字人。
- **自测全过**：check-docs 三场景 + check-sprint 五场景 + 真 hact-app v4 存量烟测（不崩、AC 逐条覆盖走 human 兜底，存量冻结边界正确）。
- **净收缩账**：删功能级覆盖代码 + 升 1 个 🧑 留人为机械 FAIL；逐条 AC 反向覆盖从「Step3 自审 + Step3.5 独审 + 签字人」三层人兜收成「linter 一道机械挡 + 签字人只兜忠实性」。ADD 是 linter 代码（§2 code≠prose）。
- **当前 git 状态**：本地 master 含 sub1/3/2/3b/3c/4/**5** 全部改动，领先 origin/master 多 commit，**全部未 push**（master 严格，待用户明确确认）。

### 2026-06-19 结构性审查收官：子计划 3b/3c/4 完成 + §7 冷核协议整段退场（四子计划全落，本方向收口）

> 接上一条「方法论方向转变」里程碑（sub1/3/2）。本条记 sub3b/3c + 全局验收 + 合并 + sub4 可视区收口。

- **子计划 3b·G4/G5 检查器**（commit `2e6662e`）：新建 `templates/scripts/check-gate.js`（G4 核 source=manual-test 任务全 merged + 验收报告结论；G5 核 feedback 清空 + project.md 无"开发中"）；§7 部分塌缩（G4/G5 迁 check-gate，G3 暂留冷核）；manual-test/wrap-up 冷核步→check-gate。实测发现 G3 被任务包格式漂移阻断 → 拆出 sub3c。
- **全局验收 + 合并（会话 4）**：linter 实跑确认退出码、无悬挂引用、§7 读通、spec 散文净 −14；子计划 1/3/2/3b 干净 fast-forward 合并入**本地 master**（`976a399`→`2e6662e`）。
- **子计划 3c·G3 检查器 + 任务包规范化 + §7 整段拔**（会话 5，已 commit 入本地 master）：
  - **三决策**：序列化锁定 YAML frontmatter（v4 实况，v1 markdown 段退役）；存量冻结（hact-app v1–v4 不回填，新 sprint 生效）；AC 反向覆盖功能级机械 + 逐条留人（PRD AC 无 id，加 id parked）。
  - 新建 `templates/queue/task-package.md`（YAML 全 17 字段 + 条件 api-contract）+ `templates/scripts/check-sprint.js`（字段完备 / reference 行号+ux-flows·trd 链 / AC 正向 tag+功能级反向覆盖 / api-contract 条件必填 / queue↔sprint↔status 三方一致；🧑 段留人）。自测：真 hact-app v4 解析正确→legacy FAIL；合成 PASS fixture exit0；各 FAIL 路径 + usage exit2 全验证。
  - **§7 冷核协议整段退场**：删「G3」段协议主体（为什么/软版边界/5步/凭证/🚫/与既有审查关系）；intro 塌缩成单一模型「所有 Gate = 检查器绿 + 🧑 段语义人签」；新增极简 G3（check-sprint.js）段。
  - 接线：develop.md §字段规范加序列化锁注；plan-sprint Step3 套模板 / Step4.7→check-sprint / commit 去 gate-checks/G3.md / Subagent 表删冷核行；structural plan-sprint 标【linter】；init-project 铺 check-sprint.js。
  - **悬挂引用大扫除**（防 5cfdedb 类静默回退）：删协议后 5 处 G1/G2/G4/G5 存量兜底原指「§7 subagent 冷核协议」全部改「人工逐条核对（无 subagent）」（draft-prd-vN/draft-tech-design/manual-test/wrap-up 的 exec+structural）。两轮 grep 扫净。
  - **净收缩兑现**：design §2.5「散文大头」三关全清（G1/G2 sub3、G4/G5 sub3b、G3 sub3c），§7 从 ~60 行两层模型塌缩成单层；净收缩从「部分兑现」推到「整段拔净」。ADD 全是检查器代码 + 结构化模板（code≠prose）。
- **子计划 4·可视区收口**（会话 6，已 commit 入本地 master）：
  - **关键认识**：frontend 链路其实已基本建好——视觉/交互保真早落 pr-review 第四步（2026-06-18）+ manual-test + integration（pinchtab），类型对接落 vue-tsc，develop L199（sub2）已路由"视觉残量归 manual-test/pr-review"。唯一仍停在旧「11 段逐条挑刺审代码」形态的产物 = `frontend-checklist.md` 本体（design §9 窟窿2 的 inspect-code 长清单）。
  - **三决策**：frontend **不设硬性"测试品类"强制**（区别 backend——可视区人能当 validator + 三重兜底，取「可测则测」）；最干净机械赢面 = lint/type-check，尤其 **stylelint 禁硬编码字面值**（直击 org-krm-v2 跨 v3→v5 复发）；视觉/交互保真**不新增 wiring**（已覆盖），只收口 checklist 一件。
  - 重写 `frontend-checklist.md`：11 段→**三段式**（一·归 lint/vue-tsc/stylelint｜二·可测逻辑写测试｜三·留人走查视觉/交互/冗余）+ 输出格式 + 诚实前提（项目未配规则的项落留人）；旧全项映射无静默丢。develop exec（5 处）/structural（L77）描述符同步；pr-review/manual-test/integration 不动。
  - **净收缩**：纯 prose 收缩+重组、**无新检查器代码**（lint/tsc/stylelint 是项目侧标准工具）——本方向最贴 §2 判据的一块。但 **frontend 净收缩 < backend**：视觉残量合法大头（design §3 可视区人是 validator），§9 窟窿2「降维不是清零」在此最明显。**四子计划全落，本方向收口。**
- **当前 git 状态**：本地 master 含 sub1/3/2/3b/3c/4 全部改动，领先 origin/master 多 commit，**全部未 push**（master 严格，待用户明确确认）。

### 2026-06-19 方法论方向转变：质量模型从"规范遵循"转向"输出可测试性"（结构性审查 + 子计划1·地基）

- **背景**：一轮对整套方法论的结构性审查（含独立 subagent 对抗审查），追问"无休止增加规范来规范 AI 是否可持续"。
- **两个全局结构性错误**（findings §四）：
  - **A · 质量模型方向错**——规范/Gate/冷核都在验"指令是否被遵循"，不是"产物是否真的正确"；真正验输出的只有末端 integration-tests + manual-test，"在最便宜处验最便宜的事、在最贵处发现最贵的问题"。
  - **B · AI 不可靠性被当成规范写作问题**——规则塞进 spec = 塞进 context = 越长越失真，正反馈退化回路（活体证据：2026-06-18 加的 Gate 冷核协议本身就是"用 AI 治 AI 盖章"的反模式）。
- **方向定案**（design.md）：正确性维度从"散文/AI 肉眼核"迁成"确定性检查（test+linter+一致性检查器）"，**每迁一条删一条散文**，成功判据 = **spec 净收缩**（非"新增验证"）。
  - **分区**：火力集中**不可视区**（后端/数据/逻辑——人没法兜，非技术管理者 Gate 本是橡皮章）；可视区（前端视觉）留人走查。演练实证：backend-checklist 85% 可机械 vs frontend ~50%。
  - **核心抓手 A**：AC→可运行测试（验正确性）；保真走路2（AC 操作化/spec-by-example）主干 + pr-review 兜残。
  - **Gate 重定义**：确定性检查器全绿 + 语义人签。
- **拆解**（design §11）：子计划1 地基（产物结构化，先行）→ 子计划2 不可视区 AC→test → 子计划3 Gate 重定义（删冷核兑现净收缩）。
- **子计划1·地基 已实施**（分支 `feat/sub1-foundation`，**未合 master、未 push，待验收**）：
  - 新建 `templates/prd.md` / `templates/trd.md`（结构化模板，`<待填>` 空槽 + 固定 header）+ `templates/scripts/check-docs.js`（纯 Node linter，验结构完备 + 实体↔表交叉一致）
  - 接线 5 份 spec：init-project 铺脚本；draft-prd-vN Step7.4 / draft-tech-design Step5.4 linter 自检（冷核前，不替代）；两份 structural 契约完成判据标【linter】（子计划3删冷核埋点）
  - linter 自测通过：原始模板全面 FAIL、填好全 PASS、缺表交叉 FAIL、标签后缀兼容
- **子计划3·Gate 重定义 已实施**（同分支 `feat/sub1-foundation`，**未合 master、未 push，待验收**；本轮定调：**只 G1/G2**（linter 现仅覆盖 PRD/TRD）+ **不做 hook**）：
  - `skeleton/06-gates.md` §7：「完成判据冷核协议」→「完成判据核对」两层模型——G1/G2 走 linter 退出码 + 人签语义，**删 subagent 冷核**（存量项目无脚本退回兜底）；G3/G4/G5 沿用 subagent 冷核（原协议完整保留，冠适用范围 N∈{3,4,5}）
  - 删 G1/G2 实时路径**两个 subagent 冷核步骤**（draft-prd-vN Step7.5、draft-tech-design Step5.5），PRD 全程零 subagent；两份 structural 兑现【linter】删除埋点；commit 去 `gate-checks/G1/G2.md`；三处 G3-5 引用同步改 §7 新标题
  - **净收缩货币**：删 2 个 AI-肉眼步骤（design §2 判据）；§7 主体彻底删除待 G3/G4/G5 建检查器后兑现
- **子计划2·不可视区迁移 已实施**（同分支 `feat/sub1-foundation`，**未合 master、未 push，待验收+对抗审查**；定调：**AC 操作化压 draft-tech-design** + **一次全做**）：
  - **AC→可运行测试**成为不可视区正确性验证主轴：draft-tech-design 把不可视区 AC 操作化成 Given/When/Then 例子（挂 `# 满足 AC` 回链旁，散文约定不进 linter）→ plan-sprint 写进 backend 任务包 `acceptance-criteria` → develop 1:1 落成测试 + 跑绿 → pr-review 路1 兜残（验测试忠实 AC）
  - **develop Step 5.5 AI 对抗审查整步删除**（~64 行 + Subagent 表行 + Fast Mode/批量引用）——design §8 实证它是"一次性人工跑的伪测试"，真测试套件取代之
  - **backend-checklist 87 行→~55 行测试品类清单**：33 项逐条审代码 → 5 测试品类（鉴权/边界/错误路径/契约/数据并发，各写测试）+ lint 项归 `npm run lint` 一句 + 4 留人判（N+1/日志隐私/冗余/并发竞态）
  - develop Step 5 加 `npm run test` + 测试品类自检 + 迁移升级逻辑（测试反复红→根因 AC/TRD→revise-doc）；4 份 structural（develop 字段+判据 / draft-tech-design 判据 / pr-review 判据）同步；修 3 处对 develop Step5.5 的悬挂引用（plan-sprint Step3.5 × 2 + revise-doc AC 漂移兜底）
  - **净收缩货币**：删 1 个大 AI-肉眼步骤 + 短化 checklist；ADD 是"写真测试/验输出"非"堆规则"，不背叛 §2。frontend-checklist 降维留子计划4
  - **对抗审查整改（2 BLOCKER）**：① 安全覆盖洞——重写 checklist 时丢了注入/路径穿越（与 design §8 的 T 清单冲突），补「安全·注入/穿越」测试品类 + 留人判；② 测试运行器悬空——无 spec 负责建测试基建，draft-tech-design standards 生成确立「测试框架约定」owner + develop 无运行器非死锁/非静默处理
- **loop 概念澄清**（补 `design.md §2.5`）：用户追问"lint 固化结构 / 前向信息有效性 与 loop 的关系"——钉清 loop=机制、删规则=收益、前向有效性(lint)/正确性(test)=同一 loop 两个验证维度；净收缩当前"及格但不漂亮"（删 AI/人眼步骤为主，散文大头埋点待 G3-5 检查器）；loop 第二层（per-module subagent 小循环 / TRD shared-type-first）本轮未做、仍 parked
- **记录**：`_meta/plans/2026-06-19-structural-review/`（findings.md 四段分析 + design.md 方向 + sub1-地基-design.md + sub3-gate重定义-design.md + sub2-不可视区测试-design.md + task_plan.md 接续）。master 仅 `976a399`（方向文档）；子计划1+3+2 操作改动隔离在分支保护存量项目。

### 2026-06-19 方法论调整：draft-ux 整体重构（角色姿态反转）

- **背景**：用户对当前 draft-ux 方法的痛点为「面对 36 条场景文字 + mermaid 流程图 + ASCII 线框时，信息消耗太大、文字→画面转换负担过重」；案例素材来自 `E:\design-t\`（hact 产出 vs Claude Design 产出对比）。本轮起点 `findings.md`（"导航架构/屏幕组成/组件细节"三层模型）在讨论中被用户判为过期、不沿用。
- **病根**：旧 draft-ux 把 CC 的工作过程（场景枚举 / 流程图 / 线框图）摊开给用户做判官——用户被迫做"交互工程师的助手"，做大量"文字→画面"的脑内转换。
- **决策（角色姿态反转）**：**CC = 交互工程师；用户 = 客户**。客户只参与上游业务沟通 + 下游设计稿走查，中间过程内部消化、不外露。
- **新主链路**：业务沟通（多轮文字）→ CC 内部消化（不外露）→ 出 HTML 原型 → 用户走查 + 反馈调整。
- **关键设计**：
  - **业务沟通文字常态；决策对答用中间产物**（mini HTML 默认 / 可点击小原型升级档），禁止结构化文字方案描述
  - **中间产物按需出**：触发条件 = 有多种合理走法 + 影响下游多画面；必须用 design.md 视觉变量
  - **视觉定位改写**：「不追求视觉精美」→「落实 design.md 视觉规范」，原型不做视觉创新
  - **首次 UX 时 design.md**：draft-ux 在 Step 1.3 顺手生成初稿（落盘特例）
  - **subagent 陌生视角冷审去除**：新姿态下用户直接看原型 = 真陌生视角，subagent 模拟反而冗余
  - **不引入 Claude Design**：无专职交互工程师时引入会打破方法论顺畅性
- **新步骤序列（Step 1–6）**：
  - Step 1 业务沟通（含 design.md 视觉对接）
  - Step 2 CC 内部消化（场景拆解 + 流程穿线 + 画面构思，必走清单，全程不外露）
  - Step 3 关键决策中间产物对答（按需触发）
  - Step 4 生成 HTML 原型（落实 design.md，6 项覆盖要求）
  - Step 5 用户走查 + 反馈调整（CC 给提示性清单，用户主动说 OK 才转）
  - Step 6 收尾移交（落盘精简 ux-flows.md + commit）
- **新红线 6 条**：
  1. 禁止跳过场景拆解和流程穿线直接出原型（替代旧"禁止从画面入手"）
  2. 禁止只覆盖主路径
  3. 禁止死路（流程图分支无明确去向 + 原型无死锚点）
  4. 禁止系统内部逻辑混入
  5. **禁止让用户审查工作过程产物**（新增：新姿态本质精神）
  6. **禁止视觉创新**（新增：视觉服从 design.md）
- **落盘规则变化**：精简 `ux-flows.md` 至 2 段（场景命名表 + mermaid 流程图，仅供 TRD 锚定 API 服务路径用）；旧版「死路检查 / 交互决策 / 交互质量走查记录」三段移除——前两段并入 CC 内部消化与 Step 3 对答，走查记录因 subagent 冷审去除而无产物。
- **修改文件**：
  - 重写 `specs-execution/draft-ux.md`
  - 重写 `specs-structural/draft-ux.md`
  - 删除 `templates/checklists/ux-checklist.md`（subagent 冷审去除 → 无消费者）
- **记录**：`_meta/plans/2026-06-19-draft-ux-restructure/`（task_plan.md 含完整定调与每步细节 + findings.md 标过期起点）

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
