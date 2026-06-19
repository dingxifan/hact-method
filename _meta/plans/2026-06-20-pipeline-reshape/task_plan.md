# task_plan — 流水线重定形状 · 2026-06-20

**性质**：承 `../2026-06-19-loop-layer2/findings.md §十四`。第 0 层决策已定——**先重定形状**（垂直切片 + 测试脊柱前置 + 走路骨架），而非在现形状内打补丁。loop 第二层 / hook / 蒸馏交接 / DRY 全部降为"形状定下后再排优先级"的形状内杠杆。
**状态**：🟢 **乙-1 + 乙-2 落地完成**（spec 改动已落盘，未 commit）。下一步：乙-3（linter presence，真正的小净收缩）或暂收口本方向。

> **下次起点**：读 `subB-测试脊柱前置-design.md`（Q3 两幕脊柱 + 幕2 纠正 + §四 诚实账纠正）。乙-1/乙-2 已落；乙-3 = check-docs 加"AC 旁有例子 block"presence 机械核，吃掉一条留人（乙 里唯一的小净收缩落点）。

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

## 待决（下次先答）

- **design §六 第一步 fork**：甲（竖片演练，廉价闸）/ 乙（先定 Q3 脊柱落点 + 运行器 owner）/ 丙（先重排 draft-tech-design 成 shared-type-first）。CC 推荐 甲→据结果排乙/丙；想快出第一块改动则丙边界最清。
- **design §三 Q3**：测试脊柱在哪一棒由谁写——(a) 编译式（PRD 写 Given/When/Then 例子，TRD 编译成可执行）/ (b) 纯前置（骨架阶段建运行器）。

## 关键纪律（别丢）

- **sub7 同源陷阱**：重定形状极可能加编排/交接散文。每落一处先答"删掉哪条散文/哪个末端验证步"。删不动诚实记成"形状改进"，不误框成净收缩（design §五）。
- **保护存量**：hact-app v1–v4 在跑。学结构性审查——增量、隔离分支、不全量推倒。
- **不取消阶段**：顺序是逻辑依赖非瀑布之错（14.4-1）；改的是切片方向 + 验证位置。

## git

- 本会话只动 `_meta/plans/`（新建 pipeline-reshape 目录 + `.current_plan`），未 commit、未 push。
- 注：structural-review sub1-7 仍全在**本地 master**、领先 origin 十几 commit、**从未 push**（master 严格，待用户明确）。
