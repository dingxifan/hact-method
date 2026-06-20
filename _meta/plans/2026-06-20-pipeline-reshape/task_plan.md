# task_plan — 流水线重定形状 · 2026-06-20

**性质**：承 `../2026-06-19-loop-layer2/findings.md §十四`。第 0 层决策已定——**先重定形状**（垂直切片 + 测试脊柱前置 + 走路骨架），而非在现形状内打补丁。loop 第二层 / hook / 蒸馏交接 / DRY 全部降为"形状定下后再排优先级"的形状内杠杆。
**状态**：🟢 乙-1+乙-2 + PRD 致密化已 commit 本地 master（未 push）。**HOOK 全局 rollout 仍 park**（净收缩量小，见「HOOK 存档」）；但**样本范围已重启并建成**——用户定调「把 PRD 阶段当样本做全套，再总结方法」。**DRY 量账后 park**（见「DRY 存档」）。**当前活线 = 单环节致密化方法（PRD 样本已收）**：四件机制（template✓/linter判官✓/门卫✓新建/末端agent✓）+ 致密语言全部到位，配方写入 `单环节致密化方法.md`。待用户定是否套到 plan-sprint/manual-test/draft-tech-design。

> ## 门卫（HOOK）样本建成（2026-06-20）
> 承用户「PRD 阶段当样本全部做完」定调——HOOK 不是全局铺，是补齐 PRD 样本缺的第 4 件机制（findings §七-3 forcing function，唯一没碰过的）。
> - **建** `templates/scripts/pre-commit-hook.sh`：按 staged 文件路由（prd/trd→check-docs、sprint/queue→check-sprint、gates.md 新增 G4/G5→check-gate）；脚本/node 缺失 no-op 放行；红拦 commit。**四场景实测全过**（红拦/绿放/无脚本放行/gate路由）。
> - **接线** init-project（Step3 hook 源入仓 tracked + Step4.1 git init 后装进 `.git/hooks/` + clone 重装说明）。
> - **删散文** draft-prd-vN Step7.4（降为提前自查+门卫兜底）/Step8（删"退出码0才签"前置）；06-gates §7 加「判官+门卫」模型段 + 三处「不得手改报告、不得跳过」→门卫接管。
> - **暗礁兑现**：存量 no-op ✓ / 跨平台 Git Bash（POSIX sh 实测）✓ / 护栏非密码锁（--no-verify 可绕、.git/hooks 不随 clone）已明示，是范围限制非拦路石。
> - **诚实账**：门卫删的强制散文 ~3–5 行/份（小净缩），ADD 是脚本（code 不进 context）；真减肥主力仍是致密语言（换语气，PRD 311→165）。四件凑齐 = 完整样本，单看行数会误判（见方法文 §四）。

> ## DRY 存档（2026-06-20 量账后 park）
> 测绘账（subagent 全读 16 份 specs-execution）：全语料仪式 ~520-580 行，可净删 ~80-90（近逐字）+ 参数化 ~110-125，**真净收缩上限 ~130-155 行**（回填引用后），**per-session context 几乎不动**（仍按需载共享段）。占大头的 **#2 会话启动/断点续做 ~240 行是 sub7 陷阱**（各 task 实质导航知识伪装成仪式，抽即掏空）+ #7 红线 ~70（task 专属）。clean top-3 = #6 快速通道直修（净删~55，近逐字 3 份仅 1 变量）/#3 选项菜单（参数化~55）/#4 签字三件套（参数化+净删~55）。结论：DRY 货币是「单一来源防漂移」非行数；用户判性价比不如换打法 → park，转单环节 loop 试点。

> ## 单环节 loop 试点（2026-06-20，活线）
> **思路（用户）**：linter+HOOK 覆盖格式 → 末端独立 agent 审内容；template 接走填写说明；语言对 CC 极简化。视觉移交 draft-ux（任务重划，不算减肥）。拿最熟的 PRD 试。
> **PRD 落地**：`draft-prd-vN.md` 311→**175 行（−136/−44%）**。拆账：① **思维1 极简语言 ~70 行**（教学体→指令体，无知识损失）② 思维2 template 接走 ~50 行（功能块格式+AC/例子机制+变更摘要33行→template 注释）③ 视觉移交删 Step5 ~11 行（draft-ux Step1.3 早拥有 design.md，原本重复）④ **思维3 新 Step 7.5 末端内容审查 +18 行**（陌生视角 subagent 审一致性/AC可验性/覆盖，输出问题清单非盖章；范围只查「看得出的」，"是否用户真要的"归用户守 design §10，与 draft-ux 3.5 同模型——与子计划3删的「格式冷核橡皮章」不冲突）。配套：prd.md template 收变更摘要格式 / structural 删 design.md 产物+加内容审查判据 / design.md template 归属指针改 draft-ux。
> **试点点破的真发现（比 hook/DRY 重要）**：最大那刀 ~70 行**不是去重/移交，是「换语气」**——spec 大量篇幅是给人读的教学体冗余，读者其实是 CC（要致密指令非散文教案）。findings §六「200行仪式大头」相当一部分是**给人读的冗余措辞**，非仪式重复。这条杠杆 hook/DRY 都没碰：**每份 spec 都能用 / 零 sub7 陷阱（不搬知识不抽共享段，只把同义写短）/ 唯一代价是纯人工逐份改+密度升高微增误读**。和方向自洽：格式归 linter+hook、内容归 agent、填写说明归 template → 正文只剩「过程与判断」自然致密。
> **用户验收**：「能接受，直觉还有 10-15% 压缩空间但已 <200 行，先这样」——PRD 不再压。
> **下一步候选（按 ROI，待用户点头）**：draft-tech-design（最胖 ~283）、plan-sprint、manual-test 大头优先；develop 家族 sub7 刚重构先放。

> ## HOOK 存档（2026-06-20 量账后 park，非删除）
> B 步「删散文反推」账已做（本会话）：hook 接闸只能删 **(b) 强制条款**（"退出码0才签/不得手改/不得跳过/签字前置"）≈ **10–15 行**，散在 6 文件（draft-prd-vN 2 / draft-tech-design 2 / plan-sprint 2 / manual-test 1 / wrap-up 1 / 06-gates §7 ×3）。(a)跑指令 /(c)🧑语义 /(d)存量兜底 全留，且 hook 必须保住 (d) 的 no-op 放行。hook 基建 ADD ≈ 60–85 行脚本（识别签哪个 Gate→跑对应 check-*.js + 无脚本 no-op + 跨平台 Git Bash）+ init-project 装 ~5 行。**结论：教科书 sub7 账（删 15 加 75）；脚本是 code 不进 context，真货币是 forcing-function（§七-3 唯一没碰的第三机制），但净收缩量小。** findings §六 点破：真 200 行肥肉是「交互仪式逐份重抄」=DRY 那把刀，不归 hook → 用户选先打 DRY。**暗礁（重启 hook 时必读）**：① 存量无脚本 hook 必 no-op 放行（不能拦死 hact-app v1-4/org-krm）② 跨平台 Git Bash ③ 护栏非密码锁、手改/关 hook 即绕过、验不了诚实（Goodhart）——是范围限制非拦路石。当初靶子（盯 gates.md 签字+验指纹）已随冷核凭证模型删除而过时，新靶子=自动跑 linter 拦 commit。

> **⚠️ 乙-2 落地纠正（第二次诚实账纠偏）**：原设计承诺"乙-2 删 manual-test 不可视区核对段=真净收缩"。读真实 manual-test 后站不住——它是**用户主导人工验收、无 CC 核对段可删**；末端集成+人工验收**本就该发生、删不掉**。乙-2 实际摘的是"人在末端逐条手验不可视区正确性"的**冗余负担**（改机械带过），**净行数近中性甚至略增**。**乙（1+2）的货币是结构收益（反馈环短/坏 AC 早暴露/验证归属清晰），不是净收缩**——已在设计稿 §四 + STATUS 口径纠正，不重演 sub7 误框。

## 决策推进（本会话）

- **甲 出局**：hact-app 不重要、随时可停 → 竖片演练的"保护存量 + 量删散文"两支柱都塌（用户 2026-06-20）。
- **乙/丙 之间选乙先行**：用户原偏向丙，CC 对着真实 spec 用重启纪律量出**丙删不动散文、纯加编排（sub7 同源）、且不推进重定形状本体（draft-tech-design 仍写满宽横片）**；乙直接落"脊柱前置"+ 真有删散文潜力（末端不可视区核对）→ 用户改选**乙先行**。
- **Q3 已拍**：两幕脊柱——幕1 操作化前移 PRD（CC 起草/产品验证行为例子）+ 幕2 TRD **精化**例子规格（补技术精度）。"非技术产品写不了例子"经查是伪障碍（CC 起草 + 产品验证，与验证其它 AC 同性质）。
- **⚠️ 幕2 硬纠正（落地前 CC 自查发现）**：原稿"幕2 编译成可运行红测试文件"**错**——撞项目 2026-06-16 决策（TRD 阶段无运行代码，预写可执行测试是空中建筑，org-krm v5 联调 15 条全废）。纠正为：**幕2 只精化例子规格（spec-by-example 文本），runnable 物化点守在 develop**。脊柱 = 例子规格（可执行形态的描述），不是 runnable 文件。"前置"前置的是规格、不前移物化点。

## 乙-1 落地清单（11 处，已落盘未 commit）

1. `templates/prd.md`：AC 槽下加 `例：Given/When/Then` 行 + 注释（幕1）
2. `specs-execution/draft-prd-vN.md`：Step4 加「AC 行为例子（幕1）」段 + 红线「禁止保留写不出行为例子的有行为 AC」
3. `specs-structural/draft-prd-vN.md`：完成判据 +1（有行为 AC 已写例子，语义留人，presence 留乙-3）
4. `specs-execution/draft-tech-design.md`：L131 操作化→精化（幕2，补技术精度，不创造、不落 runnable）+ 自检 header「AC 例子精化」+ 留人 bullet 改「精化忠实 PRD 例子」
5. `specs-structural/draft-tech-design.md`：接口段说明 + 完成判据「精化为技术精确规格」+ linter 注「精化例子忠实 PRD 行为例子」
6. `templates/trd.md`：接口块注释加幕2 精化示例 + 不落 runnable
7. `specs-execution/plan-sprint.md`：L141 任务包携带「精化后例子规格」（行为源 PRD/技术源 TRD）+ 不预写 runnable
8. `specs-execution/develop-core.md`：Step5 例子规格「物化成可运行测试」（守 2026-06-16）
9. `specs-structural/develop.md`：§字段规范 acceptance-criteria 改「例子规格，行为源 PRD 幕1/技术源 TRD 幕2」
10. `templates/checklists/backend-checklist.md`：例子来源注更新
11. `specs-execution/pr-review.md` L69 + `skeleton/06-gates.md` L123：路2/语义残量描述同步

## 乙-2 落地清单（4 处，已落盘未 commit）

1. `specs-execution/manual-test.md` Step2：验收范围告知聚焦可视区/业务 + 注明不可视区已脊柱+联调机械验、不需人工逐条手验
2. `specs-execution/manual-test.md` Step5：验收报告 AC 验证表加「验证来源」列（不可视区=脊柱+联调测试 / 可视区=人工验收）+ 重写对账 note（完备性对账保留全列、正确性不重复人工核不可视区）
3. `specs-structural/manual-test.md`：验收报告格式表同步 + 完成判据 +1（验证来源如实标注）
4. `specs-structural/manual-test.md` L69：顺手修 sub3c 遗留悬挂引用（"§7「G3」段 subagent 兜底"→"§7 G4/G5 段人工逐条核对兜底，无 subagent"）

## 诚实账（乙-1 兑现到哪）

- **乙-1 主体是"搬"**：操作化的行为判断从 TRD 搬到 PRD（最便宜处逼出坏 AC）+ 脊柱概念形式化。**真净收缩（末端收薄）在乙-2，乙-1 只立脊柱、未删末端**——不得据乙-1 宣称净收缩。主收益是结构（反馈环短、坏 AC 早暴露、脊柱给蒸馏一个机器盯得住的锚）。

---

## 已完成（本会话）

1. **第 0 层决策**：用户拍板「先重定形状」（AskUserQuestion）。
2. **建新阶段目录** `2026-06-20-pipeline-reshape` + `.current_plan` 指向它（从 loop-layer2 迁出）。
3. **design.md**：把 §十四 的纲落成具体方案——目标形状三件套（走路骨架 / 功能竖片 / 测试脊柱）+ 对现结构四硬冲突（Gate 退聚合 / 迭代=骨架+N竖片 / 测试脊柱落点 Q3 真 fork / 走路骨架不新增 task）+ 四个不可回避真冲突 + sub7 同源纪律 + 第一步三候选。

## 待决（已全部解决，留痕）

- ~~design §六 第一步 fork~~：甲出局、选乙先行（见上「决策推进」）。
- ~~design §三 Q3~~：两幕脊柱（幕1 PRD 行为例子 / 幕2 TRD 精化），幕2 不落 runnable（守 2026-06-16）。

## HOOK 起点种子（下一步，跨会话）

**是什么**：hook = **门卫**（findings §八）。linter（判官）只能新增能力、删不掉散文——因为「记得跑 check-*.js、退出码 0 才签字」**本身还是一条散文规则**。hook 自动跑检查器、红了就**拦 commit**，那句散文才能**整段删**——强制它的不再是文字，是闸门。这是 findings §七-3「forcing function」那第三种、也是**唯一没碰过**的机制，**真净收缩货币在此**（§十二：地基✓判官✓已就位，缺门卫）。

**删什么散文（净收缩落点，动手前先点清——守 sub7 纪律）**：每份 spec 的「签字前置：check-*.js 退出码 0」+「不得手改报告、不得跳过」散文。覆盖 check-docs（G1/G2）、check-sprint（G3）、check-gate（G4/G5）。hook 接闸后这些「记得跑+退0才签」可删/收薄——**这才是真删散文**（区别于乙的"搬"）。

**挂哪（两种，需定）**：
- **git-native pre-commit hook**（项目仓 `.git/hooks/pre-commit` 或 husky）：任何人 commit 都拦，最稳；要 init-project 装、跨平台（Win Git Bash 在用）、存量项目补装。
- **CC-harness PreToolUse hook**（settings.json 拦 Bash `git commit`）：只在 CC commit 时生效；用 `update-config` skill 配。**git-native 更对**（不挑 actor），CC-harness 可叠加。

**先挖的暗礁（当初为什么反复"不做/软版"——必读原文再动手）**：structural-review **子计划 1 + 子计划 3 design** 均明确「不做 hook、软版」「硬闸延后」，回去读理由（大概率：① 存量无脚本时 hook 拦死人 ② 安装成本 ③ 跨平台 ④ 软版先靠人现场抽看凭证兜底）。**存量兜底**：每份 spec 现有「项目无 check-*.js → 退回人工核对、不阻断」；hook 必须共存——无脚本项目 hook **no-op 放行**，不能把没装脚本的存量仓 commit 全拦死。

**入口候选**：A·先设计 hook 方案（pre-commit 脚本 + init-project 装 + 存量 no-op + 可删散文清单）后实施；B·先「删散文反推」——列全 14 份 spec「记得跑 linter 才签字」类散文确切位置+行数，量 hook 接闸后净收缩多少（防 hook 基建 ADD > 删的散文，又一个 sub7 闸）。**CC 倾向 B→A**（先量账确认删的散文 > 加的基建，再上基建）。相关技能：`update-config`。

## 关键纪律（别丢）

- **sub7 同源陷阱**：重定形状极可能加编排/交接散文。每落一处先答"删掉哪条散文/哪个末端验证步"。删不动诚实记成"形状改进"，不误框成净收缩（design §五）。
- **保护存量**：hact-app v1–v4 在跑。学结构性审查——增量、隔离分支、不全量推倒。
- **不取消阶段**：顺序是逻辑依赖非瀑布之错（14.4-1）；改的是切片方向 + 验证位置。

## git

- 本会话：乙-1+乙-2 spec（`d83e722` feat）+ pipeline-reshape 设计稿/前序记录（`892be13` docs）已 commit 本地 master，**未 push**。
- 注：structural-review sub1-7 + 本轮仍全在**本地 master**、领先 origin 十几 commit、**从未 push**（master 严格，待用户明确）。

---

## 管线行走进展 + 下一轮起点（2026-06-20 末次更新；上面「HOOK 起点种子」已兑现，勿当待办）

**形态**：pipeline-reshape 后期收敛为「**单环节致密化方法沿开发管线一站站走**」+「**同步审 AC 链有效性**」。两件货币不同：致密化=净行数收缩；AC 链审=结构正确性（常 ADD）。方法本体见 `单环节致密化方法.md`（四件机制：linter 判官 + 门卫 hook + template + 末端 agent，外加一把语言刀=换指令体）。

**已建地基（勿重做）**：门卫（HOOK）已建成（`templates/scripts/pre-commit-hook.sh`，init-project 装，按 staged 路由 check-docs/check-sprint/check-gate，红拦 commit，无脚本/无 node→no-op）。判官三件 + 结构化模板早就位。**上面 HOOK 起点种子那段是已完成记录，不是待办。**

**管线站点**（用户定序，非按行数 ROI）：
`draft-prd-vN`✅ → `draft-ux`✅(确认无改) → `draft-tech-design`✅ → **`plan-sprint`✅(本轮)** → develop 家族(下一站) → pr-review → generate-integration-tests → manual-test。

**plan-sprint 站本轮**（致密化，本地 master，未 push）：
- `specs-execution/plan-sprint.md` **340→275 行（−65/−19%）**。四象限拆账：① Step 3 折叠重抄（depends_on写法 / reference行号要求 / AC格式 / api-contract平铺等已在 `task-package.md` 模板 + check-sprint + structural完成判据三处，正文停止重抄、只留判断与跨文件来源）≈ 真减肥主力 ② 门卫散文收薄（Step 4.7「不得手改报告、不得跳过」+ Step 5「退出码0才签」前置 → 门卫 commit 时跑 check-sprint 强制兜底，同 PRD Step 7.4/8）③ 全文换指令体。
- **不可动部分**（解释为何 −19% 弱于 PRD −44%）：Step 3.5 sub-agent mandate ~36 行 brief 逐条保留（方法 §五 第 4 点：末端 agent 指令必须固化进 brief）+ 多个功能输出模板（选项菜单 / 骨架表 / 交付方式表 / sprint.md 格式）是结构非散文。真可压散文集中在 Step 3 + 语言。
- **AC 链**：plan-sprint 落点（任务包 `(源：AC-nn)` 回链 → check-sprint 逐条正反向）sub5/sub6 已机械，残量忠实性留 Step 3.5 + 签字人——**本站纯致密化、无 AC 链 bug**。
- **诚实账**：货币是致密语言（真净缩）+ 搬运到模板（防漂移）+ 门卫接管（forcing）；Step 3.5 是既存资产（=PRD Step 7.5），非本轮 ADD。无 structural 改动（契约字段/产物/判据未变，只动 exec 正文散文）。

**draft-tech-design 站本轮三件**（本地 master，未 push）：
1. 致密化 + Step 5 末端内容审查（`b090a2d`）——283→307 净 ADD（cram 单行拆 bullet + 验内容 ADD，非减肥）。
2. standards 归位项目级活文档（`e83fb53`，决策#17 修订，18 文件）——见 `findings.md` F1。
3. 步骤重排 + 整数重编号（`fb9fa9f`）——验证（linter+内容审查）前移到写完 TRD 后、用户确认前；Step 1–9 干净整数。
4. STATUS 里程碑 + 方法文档候选更新（`55223e6`）。

**下一轮起点 = `develop 家族` 站**（develop-core ~308 + 3 薄壳）。注意：**develop 家族 sub7 刚重构（2026-06-19），先评估再动**——方法文档 §六明示「develop 家族 sub7 刚重构，先放」。develop 无检查器（门卫无可跑、退 no-op），末端是 npm test/lint 实测而非 spec 内审，四象限里"验证→门卫"这格对它不适用。**先量账**：develop-core 哪些是教学体冗余（换语气主力）、哪些是 sub7 导航知识（抽即掏空）。若 develop 家族判定先放，则跳到 `pr-review` / `manual-test`（~289）。**入手前先问用户走哪站**（develop 家族刚重构，可能用户想先放）。

**纪律**：行数对 reorg/结构修正是错判据（draft-tech-design 净 + 仍对）；sub7 每删先答删哪条；保护 hact-app v1–v4；**master 领先 origin 二十余 commit、从未 push，待用户明确才推**。
