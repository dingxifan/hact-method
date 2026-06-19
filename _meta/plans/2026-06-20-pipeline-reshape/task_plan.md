# task_plan — 流水线重定形状 · 2026-06-20

**性质**：承 `../2026-06-19-loop-layer2/findings.md §十四`。第 0 层决策已定——**先重定形状**（垂直切片 + 测试脊柱前置 + 走路骨架），而非在现形状内打补丁。loop 第二层 / hook / 蒸馏交接 / DRY 全部降为"形状定下后再排优先级"的形状内杠杆。
**状态**：🟢 **乙-1 + 乙-2 已 commit 本地 master**（`d83e722` feat + `892be13` docs，未 push）。**存档：下一步 = HOOK，跨会话做**（上下文预算；本会话已偏满）。乙-3（linter presence）parked。

> **下次起点（HOOK，新会话）**：见下「## HOOK 起点种子」。先读它，再读 `findings`（loop-layer2）§七-3 / §八 / §九，再重读当初「hook 不做/软版」的决策原文（structural-review 子计划 1 + 子计划 3 design：均明确「不做 hook、软版」）——先弄清当初为什么缓，再设计。**别凭印象直接写 hook，先挖暗礁。**

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
