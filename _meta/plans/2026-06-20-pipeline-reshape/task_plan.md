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
`draft-prd-vN`✅ → `draft-ux`✅(确认无改) → `draft-tech-design`✅ → `plan-sprint`✅ → **develop 站：先撤销 sub7 家族拆分✅(本轮) → 待在单文件基础上致密化** → pr-review → generate-integration-tests → manual-test。

**⚠️ develop 站本轮：撤销 sub7 家族拆分（用户拍板，2026-06-20）**
- **判定**：sub7（2026-06-19）把 `develop.md`(417) 拆成 `develop-core`(308)+3 薄壳(124/41/46)=519，**净 +102 行、1→4 文件、跨文件步号耦合、三倍 intake/handoff 样板**。用户判**负收益**，决定「取回原文件、灭掉家族、在单文件基础上重新讨论致密化方案」。（注：sub7 当初的 per-session context 收益只对 repair/b 会话省 ~40 行，远抵不过维护代价。structural 侧当初就以"拆则复制共享判据"为由**没拆**，exec 与它矛盾。）
- **已落（本会话，未 commit→见下）**：① `git show 755d04a:specs-execution/develop.md` 还原单文件 develop.md（417）② 补回 3 个 post-sub7 delta（standards 归位路径 / 测试脊柱 Step5 例子规格 / fb9fa9f 步号引用 Step7）③ `git rm` 四个家族文件 ④ **外科式反转**14 处接线（非整体 restore——这些文件都有 pipeline-reshape 后续工作必须保留）：structural develop.md（家族契约→单 task，**保 b-queue 修复 + 测试脊柱 AC 行**）/ CLAUDE.md 路由+Step1 表 / status.yml+skeleton07 type 枚举 14→12 / skeleton04 catalog+属性+§6 / dispatch-new+gen-it+manual-test+plan-sprint 的 status.yml `type: develop` / draft-tech-design+pr-review 执行层指针 develop-core→develop / guide 00·03·99。
- **保 delta 纪律（关键）**：sub7「顺手修 dispatch-new b-queue pre-existing bug」+「status.yml type 补全」+ d83e722 测试脊柱 + e83fb53 standards 归位 + fb9fa9f 重号——这些都**不回退**。反转规则=「develop-sprint/repair/b/core → develop；b-queue 保留；type 字段保留值改 develop」。
- **验证**：grep 全仓 live 文件零 `develop-core|sprint|repair|b` 残留（仅 STATUS.md 历史里程碑保留为日志）；develop.md 零 shell 引用、3 delta 在场、无 iterations/vN standards 残留。
- **"展开"打法（讨论定）**：develop 站特殊——四件机制只两件适用（**linter/门卫❌**无检查器、**末端 agent❌**末端是真测试非内容审；**template⚠️**部分、**换语气✅**主力）。沿"最短路径"梳理：任务包→PR 的不可再省骨架=**读懂→写→跑绿→交付**4 步；其余 ~半部 spec 是三类外挂（多人协调/把关 Gate/容错）。审外挂后唯一真减负靶子=**会话模式单/批量分叉**（其余外挂或内在 develop、或太小、或 failure-only）。

### Phase 2 进度（develop 站展开）
- **①单/批量合一✅**（commit `4a8aeda`，develop.md 417→356/−61）：单任务=批量 N=1 特例，处理对象抬成「任务集 size≥1」，删头部模式表+批量会话整章+双认领块，PR 模板并一套，Step6/8 按集合泛化，顺修 Step8 sprint.md「仅 source=sprint」。货币=结构简化(消分叉+去重)非换语气。与 sub7 相反(消分叉 vs 加分叉)。
- **②会话定标 + 批次=分支=PR + 两级循环 ✅ 已实现**（develop.md 356→360/+4，本地 master 未 commit→见下；3 项待拍已拍：批次名带任务 id 集 / 两级循环轻澄清 / Level1 一律串行）：
  - **落地 5 处**（仅 exec develop.md，structural 不涉分支命名/定标=纯执行层）：① Fast Mode 清单加「会话定标（取提议子集）」② 「拾取任务」段加会话定标——拆开 PR 粒度(plan-sprint 已管依赖)/会话容量(此处定标上下文)，批量路按 files 估改动面提议依赖序前缀子集 + 软锚点(~3-4 / files 合集大→分轮) + 🚫确认，剩余留下轮 ③ 两级循环轻澄清：第一层引子命名 Level1(任务级串行遍历)、Step4 命名 Level2(模块级 subagent)，借现有结构不开新章 ④ Step6 多元素集分支名 `{layer}-batch-v{N}-{各 task 序号连字符连接}`（如 `frontend-batch-v3-003-005-010`，携任务 id 集、无状态、跨会话唯一、破撞车）⑤ Step10 上下文重置触发记录接会话定标软锚点校准（明示重置协议保留、定标只降触发概率）。
  - **3 项待拍最终结果**：(a) 命名=**带任务 id 集**（用户改进首-id-only 提议为全集，更可追溯）(b) 两级循环=**轻澄清**(c) Level1=**一律串行**。(d) status.yml/sprint.md PR 列对应批次=**Step 8 现状已覆盖**（一批次一 PR、集合内每任务同 #N），无需改。
  - **诚实账兑现**：净 +4 行 = ADD（定标是主动定标替代被动重置，货币正确性/健壮性非净缩）+ 替换（批次命名同行数）+ 轻澄清（两级命名近零净）。与 sub7 相反方向（消混淆 vs 加分叉）。
  - 原设计讨论（下文保留为依据）：
  - **缺口（findings 新增）**：缺一个"会话定标"高度——"这一轮对话吃几个任务"现在是闷头自动规则（批量=本层全拿），不是被想过的决定。Step 2 是任务**内**拆分，没有任务**间/会话级**的计划。
  - **病根·概念混淆**：`PR 粒度`（依赖驱动，plan-sprint Step2.5 管，已管）≠ `会话容量`（上下文驱动，**没人管**）。plan-sprint 的"交付独立/批量"纯依赖判据、零容量概念；批量组多大纯看"本层恰好无阻断依赖的任务有几个"。等式"批量组=一PR=一会话"把两个正交维度捏成一件。现状对"装不下"只有**被动**的上下文重置协议（做爆才回退），无主动定标。
  - **决策①（用户拍）**：会话定标落**执行端**（develop 拾取时定标），不放 plan-sprint。理由：容量是运行时概念，规划端有全局视野但预估不了运行时上下文，执行端看得见运行时。
  - **决策②·定标设计（概念已认，待实现）**：批量场景——按依赖序列出本层可取批量任务，CC 按 `files` 估改动面**提议一个"装得下一轮"的前缀子集** → 🚫确认（Fast Mode 自动过）→ 确认子集=本轮任务集=一 PR，剩余留下轮。独立永远 1 个、不定标。前缀天然依赖闭合；跨会话依赖靠 Step6 已有的 `depends_on` 分支例外兜，不新增机制。
  - **决策③·阈值 = B 软锚点（用户拍）**：给软参考（如"批量 > ~3-4 个 / files 合集预估大 → 提议分轮"），CC 有抓手仍可判断偏离，同 Step 2「≤3 文件」风格。
  - **决策④·一批次=一分支=一PR（用户认）**：= 任务集统一模型直接结果。**衍生必修**：`{layer}-batch-vN` 命名在批次切分后会撞车（同层多轮都叫 backend-batch-v3）→ 须**按批次唯一命名**，倾向选项1「带首任务 id」如 `backend-batch-v3-002`（无状态/唯一/可追溯），**未最终拍**。
  - **中间段=两级循环（讨论清、方向未拍）**：Level1 遍历任务(依赖序)、Level2 遍历模块(subagent)。spec 已有一半雏形（"对集合每任务" + Step4 subagent 策略）。三边界：subagent 隔离划算才派（小而连贯主线做）/ 集成留主线 / 自检+交付留主线且**批次级**（subagent 管造、主线管验+交）。**联动**：subagent 隔离越好→批次可越大→B 阈值可放宽，**定标与循环要一起设计**。**历史诚实账**：per-module subagent 循环正式化 = 旧"loop 第二层"，park 过（加编排 ADD、ROI 摊薄、sub7 同源）；要清醒分"结构强化"vs"又一次 ADD"。
  - **诚实账（②整体）**：定标是 **ADD（~+6-8 行）**，货币=正确性/健壮性（主动定标替代被动重置），**非净缩**；重置协议仍留（单任务爆仍需）。
  - **待拍清单（下一轮先决）**：(a) 命名方案最终选（倾向1）；(b) 两级循环显式化程度——轻澄清 vs 重编排骨架；(c) Level1 独立任务是否并行（无依赖可并行/依赖链串行）vs 一律串行保简单；(d) status.yml/sprint.md 的 PR 列怎么对应到批次（提过未展开）。
- **③执行模型翻转：执行 subagent + 独立审查 loop + 前端设计门（全自动）✅ 已实现**（develop.md 360→270/−90，新建 develop-review.md +39，本地 commit→见 git）：
  - **用户拍板的设计**（多轮讨论收敛）：全程自洽全自动跑，用**独立对抗审查 loop** 取代逐步 🚫 人工门，人工只守**一个** upfront 门=「前端设计是否到位」。
  - **执行模型**：主线只编排（定标/设计门/浮决策/末端全量/提交）；每任务「读懂→计划→写→自绿」下沉到**执行 subagent**（隔离上下文 → 批次可放大，容量被 subagent 数解耦）；每任务质量由**独立审查 subagent**（对抗式、自读权威原文、绝不收执行体自评）把关，有阻断 finding 即回炉，3 轮超界升级 revise-doc/escape-hatch。
  - **独审输入源（用户核心问题的答案）**：权威原文——任务包 / git diff / standards 章节 / 测试代码+结果，**绝不喂执行 subagent 的自评**（否则自己批自己作业、独立性归零）。推广 review-briefs/ pattern 新建 `develop-review.md`（自包含、自读、逐类检查 AC忠实/do-not越界/标准合规/测试品类/留人判，存疑即阻断）。
  - **三层质量防线**：deterministic 绿（build/type/lint/test）先过 → 独审做语义 top-up（接管 sub5/sub6 留人的「逐条忠实性」）→ 人工只守前端设计到位。独审站绿之上、非唯一线（防「AI 判 AI 盖章」教训）。
  - **🚫 门收敛到 3**：①会话定标 ②前端设计到位（backend-only 跳过；把视觉决策从执行中途前移到开跑前一次，预堵无据可依视觉决策）③escape-hatch（执行/审查返 blocked 浮给用户）。其余全自动 loop。
  - **3 个待拍定案**：审查粒度=per-task 审为主 + 末端只全量绿+偏离（cross-task 一致性留 generate-integration-tests 不重复重审）；前端设计门=upfront 一次性确认/backend-only 跳过；审查员=先单个跑顺（不上多 lens）。风险 1（盖章）解法=对抗式 prompt（存疑即打回）+ 有界 loop；风险 2（执行体优雅 blocked 返回）复用现失败/重置协议。
  - **取代 ①②的 Level1/Level2 轻澄清**（结构翻转：subagent 升 per-task 执行体、模块拆分降为 subagent 内部事）。
  - **诚实账**：这是 develop **结构重写**，主货币=① 质量模型升级（独立对抗审查 loop 取代逐步人工自检门）② 上下文经济（per-task 载入下沉 → 批次可放大）。**净缩 −90 是真实附带结果**（逐步 🚫 叙述/路径分支/「继续?」骨架被自动 loop 取代），但 +39 是新 brief（ADD、按需读不占主 context）——不把整件框成「减肥」，是模型改动顺带压缩。所有 delta 已逐项核对保留。外部引用 2 处更新（pr-review Step6→末端 commit 分支规则 / draft-tech-design Step5→阶段 A 测试基建缺失）；structural 完成判据 +2（独立审查通过 / 全量检测全绿）。
- **④ 砍除 pr-review + merge-on-push ✅ 已实现**（27 文件改 + 删 2 spec ~324 行；BRIEF 决策 #24；本地 commit→见 git）：
  - **用户拍板路 A**：彻底砍 pr-review task + `review` discipline，develop 提交 PR 后立即自合并到 master；治理缺口（master 写入无第二人工门）用户明确接受。
  - **依据（CC 研究结论）**：新 develop 内置独立对抗审查后，pr-review 的内容复审（standards 合规 / 测试保真 / AC 忠实 / CR根因→revise-doc）全冗余；surviving 价值仅治理 + 跨PR视角 + 留痕 + 设计保真比对——前三个 rehome、第四个升进独审。
  - **3 缺口安置**：①安全敏感（权限/认证/数据隔离）→ develop 末端合并前 escape-hatch（architecture 授权者裁决）②设计保真比对（实现 vs design.md/prototype）→ 升进 develop-review.md brief 第 6 类（taste 仍留人）③ code_reviews[] 审计留痕 + backlog 建议项 → develop 末端写；跨 PR feedback → wrap-up。
  - **Fast Mode 一并删除**（用户提）：全自动模型下仅剩 3 个真人工门（定标/设计门/escape-hatch），无快进意义。
  - **状态流转变**：`[done]` 退为瞬态（同会话即审即合并），终态 `[merged]` 由 develop 自落定；无 develop→pr-review 联动。
  - **改动面**：删 specs-execution/structural pr-review.md；develop exec（merge-on-push + 安全预检 + code_reviews + 移交/硬边界改）+ structural（判据/产物/输出给）；brief 加设计保真；skeleton 01/02/03(discipline 9→8)/04(task 13→12 + 重号)/05(状态机联动)/06/07(CR owner)；templates CLAUDE 路由+推断表 / status.yml / 两 checklist；下游 revise-doc/plan-sprint/draft-tech-design/wrap-up 引用；guide 00/02/03/04/99；BRIEF #1/#17/#23 + 新 #24。全仓 grep 验残留=仅"记录砍除"的有意表述 + _meta/STATUS 历史日志。
  - **诚实账**：结构精简（删一个冗余 task + 一个 discipline），货币=去冗余（独审已扛质量）+ 流程缩短（merge-on-push）；净删 ~324（删文件）+ 各处 -32。治理是减法、明确接受。
- **更早的候选（多被 ③④ 吸收）**：换语气 pass（③ 重写时已大量指令体化）；parked（PR 模板外置？）。
- **纪律**：develop 无 linter 检查器（门卫无可跑）；③ 是模型重写，质量升级 + 上下文经济为主货币、净缩为附带，别只盯行数。

**plan-sprint 站本轮**（致密化，本地 master，未 push）：
- `specs-execution/plan-sprint.md` **340→275 行（−65/−19%）**。四象限拆账：① Step 3 折叠重抄（depends_on写法 / reference行号要求 / AC格式 / api-contract平铺等已在 `task-package.md` 模板 + check-sprint + structural完成判据三处，正文停止重抄、只留判断与跨文件来源）≈ 真减肥主力 ② 门卫散文收薄（Step 4.7「不得手改报告、不得跳过」+ Step 5「退出码0才签」前置 → 门卫 commit 时跑 check-sprint 强制兜底，同 PRD Step 7.4/8）③ 全文换指令体。
- **不可动部分**（解释为何 −19% 弱于 PRD −44%）：Step 3.5 sub-agent mandate ~36 行 brief 逐条保留（方法 §五 第 4 点：末端 agent 指令必须固化进 brief）+ 多个功能输出模板（选项菜单 / 骨架表 / 交付方式表 / sprint.md 格式）是结构非散文。真可压散文集中在 Step 3 + 语言。
- **AC 链**：plan-sprint 落点（任务包 `(源：AC-nn)` 回链 → check-sprint 逐条正反向）sub5/sub6 已机械，残量忠实性留 Step 3.5 + 签字人——**本站纯致密化、无 AC 链 bug**。
- **诚实账**：货币是致密语言（真净缩）+ 搬运到模板（防漂移）+ 门卫接管（forcing）；Step 3.5 是既存资产（=PRD Step 7.5），非本轮 ADD。无 structural 改动（契约字段/产物/判据未变，只动 exec 正文散文）。

**plan-sprint 站第二刀·brief/格式外置**（用户提的 loop 思想延伸；上一轮我误把 brief 框成"不可动地板"，用户点破"逐字保留≠必须在本文件"）：
- **抽离三判据**（本次定）：①成品非过程散文 ②单点/靠后/条件用 ③消费者按需读（subagent 隔离=最优 / 主线到那步才读）。判断散文/生成-map/主线逻辑一律留。
- **#1**：Step 3.5 brief → `templates/review-briefs/task-package-review.md`（新目录+类），改自包含（subagent 自读输入）；货币=主 context 减负（机制#1）+ 固化更强，**非净收缩（搬）**。Step 3.5 ~50→~22 行。
- **#2**：Step 4 sprint.md 格式 → `templates/sprint.md`，顺带去重 structural（指针化）。
- **命名规范**：产物格式 `templates/{产物名}.md`（root）；审查 brief `templates/review-briefs/{被审产物}-review.md`。live 引用、不入仓、不改 init-project。
- plan-sprint exec **275→226（−49）**。**review-briefs/ pattern 已立**——PRD 7.5 / tech-design 5 的 brief 待推广（`prd-review.md` / `trd-review.md`）。

**draft-tech-design 站本轮三件**（本地 master，未 push）：
1. 致密化 + Step 5 末端内容审查（`b090a2d`）——283→307 净 ADD（cram 单行拆 bullet + 验内容 ADD，非减肥）。
2. standards 归位项目级活文档（`e83fb53`，决策#17 修订，18 文件）——见 `findings.md` F1。
3. 步骤重排 + 整数重编号（`fb9fa9f`）——验证（linter+内容审查）前移到写完 TRD 后、用户确认前；Step 1–9 干净整数。
4. STATUS 里程碑 + 方法文档候选更新（`55223e6`）。

**下一轮起点 = `develop 家族` 站**（develop-core ~308 + 3 薄壳）。注意：**develop 家族 sub7 刚重构（2026-06-19），先评估再动**——方法文档 §六明示「develop 家族 sub7 刚重构，先放」。develop 无检查器（门卫无可跑、退 no-op），末端是 npm test/lint 实测而非 spec 内审，四象限里"验证→门卫"这格对它不适用。**先量账**：develop-core 哪些是教学体冗余（换语气主力）、哪些是 sub7 导航知识（抽即掏空）。若 develop 家族判定先放，则跳到 `pr-review` / `manual-test`（~289）。**入手前先问用户走哪站**（develop 家族刚重构，可能用户想先放）。

**纪律**：行数对 reorg/结构修正是错判据（draft-tech-design 净 + 仍对）；sub7 每删先答删哪条；保护 hact-app v1–v4；**master 领先 origin 二十余 commit、从未 push，待用户明确才推**。
