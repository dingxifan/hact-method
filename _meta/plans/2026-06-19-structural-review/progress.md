# progress — hact-method 结构性审查 · 会话日志

> 跨会话接续用。最新在最上。打开本仓时：读 `_meta/.current_plan` → 本目录 task_plan.md（全局状态 + 下一步）+ design.md（方向，§2.5 loop 关系）+ 本文件。

---

## 2026-06-19 · 会话 9（loop 第二层 park → 子计划 7：develop 拆分）

**起点**：用户「开始 loop 第二层的工作」。读 design §2.5 + findings §二后判定 loop 第二层 ROI 被 sub1-6 摊薄（per-API 拆分是编排 ADD/不删散文；develop 模块级 loop 已被 sub2 删 Step5.5+加 npm run test 做掉）→ 向用户确认 → **正式 park loop 第二层**，火力转 **develop 拆分**（findings §三 #1，471 行 spec 是真正 generator-fat 杠杆）。

**develop 拆分（方案 A，用户两次拍板：先选方向 develop 拆分，再选形状 A）**：
- 关键认识：source 分歧集中在**边缘**（intake/handoff），核心 Step 1–7 source 无关；自然分组 **3 不是 5**（findings #1 略夸大 checklist 差异——实为 layer 驱动）。
- 落地：`develop.md`（417 行）→ `develop-core.md`（Step 1–8 共享核心 + 会话收尾共用段）+ 3 薄壳 `develop-sprint`/`develop-repair`/`develop-b`，source 选壳，task_type（dev-frontend/backend）正交不变。10 处接线（CLAUDE.md 路由/Step1 表、skeleton/04 catalog、skeleton/07+status.yml type 枚举 12→14、structural develop 家族契约 + **顺手修 dispatch-new b-queue pre-existing bug**、plan-sprint/gen-it/manual-test/dispatch-new 的 status.yml type 补全、draft-tech-design/pr-review 执行层指针、guide 00/03/99）。
- **诚实净收缩账**：**这不是 §2 净收缩**——reorg 不删规则，总行 +102（417→519）。我在 AskUserQuestion 误把方案 A 框成「满足 §2」，已纠正。真收益 = 结构正确性：#14 兑现（task.type 真路由）+ per-session context 降（repair 349/−68、b 354/−63；sprint 432/+15）+ 各会话不载别路径逻辑。硬红线（壳复制核心）未触发。
- **用户拍板**：明知 +102 不是行数净收缩，仍选「接受 A，本地 commit」（结构收益 > 行数代价；raw 行数是 reorg 的错判据）。

**git**：本地 master，未 push（master 严格）。

---

## 2026-06-19 · 会话 8（子计划 6：TRD↔PRD AC 覆盖机械化 — 复用 sub5 的 AC-nn id 地基）

**起点**：用户「继续工作」→ 确认 scope 后选「建 TRD↔PRD AC 机械化」（task_plan 会话 7 定的默认下一步）。

**关键认识**：摸 scope 时发现 sub5 担心的「可视/不可视分叉」**不成立**——回链 tag `# 满足 AC：AC-nn` 载体无关（接口/前端模块/ux-flows 场景同一行格式），linter 全局扫即可，不必区分载体类型。残量 = 忠实性（载体真承接 vs 仅 id 在场），与 sub5 同款留人模型。

**做了什么**（本地 master）：
1. `check-docs.js`：`checkPRD` 返回 `acIds`；`checkTRD` 全局扫 `# 满足 AC` 抽 `acRefs`；`checkCross` 加逐条正向（挡悬空）+ 逐条反向（验覆盖），存量退 🧑；新增 `human` 级别 + 🧑 段报告。
2. `trd.md` 模板：接口块 `# 满足 AC：<待填>` + 注释；模块段注释（纯前端 AC 写回链）。
3. spec 接线：draft-tech-design exec（覆盖映射 bullet 人工→回链+机械、Step5.4 两条交叉、FAIL 处置、签字前置）+ structural（完成判据 +1【linter】+ 覆盖映射行拆分）+ skeleton 06-gates G2。
4. 自测 6 场景全过 + 真 hact-app v4 存量烟测不崩走兜底。

**净收缩**：删 1 个人工逐条对照步→升 linter 机械 FAIL；AC 链路三段（PRD→TRD→任务包→测试）至此全机械对账。ADD 是 linter 代码（code≠prose）。

**下次起点**：push 决定（待用户）；loop 第二层（parked）；PRD AC id 跨迭代永久化（低优先）。

---

## 2026-06-19 · 会话 6（子计划 4：可视区收口 — frontend-checklist 迁 lint/test，视觉归人）

**起点**：用户「继续子计划 4」。承 design §11.4（可视区收口，最低优先）+ §8 演练二（frontend ~50%）+ §3（可视区人是 validator）。

**关键认识**：frontend 链路其实已基本建好——视觉/交互保真早在 2026-06-18 落到 pr-review 第四步 + manual-test + integration（pinchtab），类型对接落 vue-tsc，develop L199（子计划 2）已路由"视觉残量归 manual-test/pr-review"。**唯一仍停在旧「11 段逐条挑刺审代码」形态的产物 = frontend-checklist.md 本体**（design §9 窟窿2 点名的 inspect-code 长清单）。本子计划 = 只收口这一件。

**三决策**（见 `sub4-可视区收口-design.md`）：
1. **frontend 不设硬性"测试品类"强制**（区别 backend）——可视区人能当 validator + 三重兜底，取「可测则测」，渲染行为不硬卡。
2. **最干净机械赢面 = lint/type-check**，尤其 **stylelint 禁硬编码字面值**（直击 org-krm-v2 跨 v3→v5 复发）。诚实前提：靠项目真配规则才查得出，未配落留人。
3. **视觉/交互保真不新增 wiring**（已被覆盖），只重写 checklist。

**做了什么**（本地 master）：
1. 重写 `frontend-checklist.md`：11 段→**三段式**（一·归 lint/vue-tsc/stylelint｜二·可测逻辑写测试｜三·留人走查）+ 输出格式 + 诚实前提。旧全项映射无静默丢（design §3 映射表逐项核）。
2. 微调 `develop.md` 5 处（L193 标题/L195 描述符/L199 三段式路由/L201 报告名 layer 化/L403 差异表）+ structural develop L77。pr-review/manual-test/integration 不动。
3. grep 扫净：无悬挂引用（旧 11 段仅按文件名被引、无段号引用）。

**净收缩**：纯 prose 收缩+重组，**无新检查器代码**——本方向最贴 §2 判据的一块。但 **frontend 净收缩 < backend**：视觉残量合法大头（§3），§9 窟窿2「降维不是清零」在此最明显。**四子计划全落，本方向收口**。

**下次起点**：push 决定（待用户）；loop 第二层（parked）。

---

## 2026-06-19 · 会话 5（子计划 3c：G3 任务包规范化 + check-sprint.js + §7 整段拔）

**起点**：用户「做 sub3c」。承 sub3b §10 待办 + design §2.5「散文大头整段拔」目标。

**三个定档决策**（对齐既有 sub1/sub3/sub3b 模式，非新发明，见 `sub3c-G3任务包规范化-design.md`）：
1. **序列化锁定 YAML frontmatter**（v4 实况，最新格式；v1 markdown 段布局退役）——linter 可靠 parse 的前提，同 sub1 给 PRD/TRD 锁固定 header。
2. **存量冻结**：hact-app v1–v4 不回填 `depends_on`/`api-contract`/AC 回链；check-sprint 只对新 sprint 生效，存量退兜底（同 check-docs/check-gate）。真漂移（depends_on/api-contract）vs 有意前置（AC 回链/Given-When-Then）逐字段分清。
3. **AC 反向覆盖 = 功能级机械 + 逐条留人**：正向（每条 AC 带 tag）+ 反向功能级（每个 PRD `### 功能` 被引用，check-docs 实体↔表同款）机械化；逐条 AC 反向覆盖因 PRD AC 无稳定 id 留人（加 id 是未来一桩规范化，parked）。

**做了什么**（分支 = 本地 master，已 commit）：
1. 新建 `templates/queue/task-package.md`（YAML frontmatter 全 17 字段 + 条件 api-contract，`<待填>` 空槽 + 注释提示）。
2. 新建 `templates/scripts/check-sprint.js`（纯 Node 无依赖，自带 frontmatter 容错 parser；覆盖字段完备 / reference 行号 + ux-flows·trd 链 / AC 正向 tag + 功能级反向覆盖 / api-contract 条件必填 / 三方一致 queue↔sprint↔status；🧑 段留人）。**自测**：真 hact-app v4 正确解析→legacy FAIL/exit1；合成 PASS fixture exit0；api-contract/反向覆盖/三方一致 FAIL 路径 + usage exit2 全验证；`depends_on: []` 正确不判空。
3. **§7 整段拔**：删「G3」段冷核协议主体（为什么需要 / 软版边界 / 5 步 / 凭证模板 / 🚫 / 与既有审查关系）；intro 塌缩成单一模型（G1–G5 全检查器覆盖）；新增极简「G3（check-sprint.js）」段同 G4/G5 形态。
4. **接线**：develop.md §字段规范加序列化锁注 + 引模板；plan-sprint Step3 套模板、Step4.7 冷核→check-sprint、Step5 前置、commit 去 gate-checks/G3.md、Subagent 表删冷核行；structural plan-sprint 完成判据标【linter】+ 冷核行改写；init-project Step3 铺 check-sprint.js。
5. **悬挂引用大扫除**（防 5cfdedb 类静默回退）：删协议后，5 处 G1/G2/G4/G5 存量兜底原指「§7 subagent 冷核协议」全部失效 → 改「人工逐条核对（无 subagent）」（draft-prd-vN ×2 exec + structural、draft-tech-design exec + structural、manual-test、wrap-up）。两轮 grep 扫净，仅 STATUS.md 历史日志 + check-gate.js 注释「原 §7」过去式保留。

**净收缩**：删 §7「G3」段 ~35 行冷核协议 + plan-sprint Step4.7 冷核步 + Subagent 表行 + structural 冷核行 + gate-checks/G3.md 凭证产物。**§7 三关全清、整段拔净**，从 ~60 行两层模型塌缩成单层。ADD 是 check-sprint.js（真检查器，code≠prose）+ task-package 模板（结构化地基）。design §2.5 目标达成：净收缩从「部分兑现」→「整段拔净」。

**下次起点**：push 决定（待用户）→ 子计划 4（可视区，最低优先）/ loop 第二层（parked）。

---

## 2026-06-19 · 会话 4（全局验收 + 合并入本地 master）

**起点**：用户选「全局验收 + 合并」（task_plan 下一步 #2）。sub3b 已于上轮 commit（`2e6662e`），工作树 clean。

**做了什么**：
1. **验收**：实跑两个 linter 确认退出码（check-docs 空模板→17 FAIL/exit 1；check-gate 缺文件→exit 1、无参→exit 2）；grep 全 spec 确认无悬挂引用（gate-checks/G1/G2/G4/G5 删净、只剩 G3.md；Step5.5/7.5 全是墓碑注释）；读 §7 确认三段式 partial-collapse 读得通；算净收缩——**spec 散文 17 文件净 −14 行**（develop −53 / backend-checklist −32 大头，被 gates.md +27 / AC 操作化 +21 接线吃掉），ADD 567 行是 checker 代码 + 结构化模板（按 design §2 不计入反账）。与计划"及格但不漂亮"自评一致。
2. **合并**：master 未分叉，`git merge --ff-only` 干净 fast-forward 9 commit 入本地 master（`976a399`→`2e6662e`）。
3. **未 push**：本地 master 领先 origin/master（`89d01ff`）10 commit，按规矩待用户明确确认。

**下次起点**：push 决定（待用户）→ sub3c（G3 + 任务包规范化，兑现 §7 散文大头整段拔）/ 子计划 4 / loop 第二层。

---

## 2026-06-19 · 会话 3（子计划 3b：G4/G5 检查器 + §7 部分塌缩；G3 拆出 sub3c）

**起点**：用户选"兑现散文大头删除"（task_plan 下一步 #3）——给 G3/G4/G5 建检查器、删 §7 冷核主体。

**做了什么**（分支 `feat/sub1-foundation`，**未 commit**）：
1. **分析定档**：写 `sub3b-G345检查器-design.md`——三关非对称（G3 重结构化需真 linter / G4 可视区人判 / G5 薄文件检查）。两个用户决策：G4/G5 建薄脚本 `check-gate.js`、不做 hook（软版）。
2. **阻断发现**：建 G3 的 check-sprint.js 前实测 hact-app 任务包，发现格式未规范化 + 跨迭代漂移（v1 markdown段 / v3 14键YAML）+ 与 17 字段 spec 背离。G3 linter 真前置 = 任务包规范化。用户拍板**拆分**：本轮 G4/G5，G3 另起 **sub3c**。
3. **实施 G4/G5**：新建 `check-gate.js`（自测 6 场景全过 + 真 hact-app 烟测）；§7 部分塌缩（加 G4/G5 薄检查器段、冷核段收窄为 G3 段、协议 N∈{3}、修 draft-ux 悬挂引用）；3 exec + 2 structural 同步；init-project 铺脚本。

**净收缩**：删 G4/G5 各 1 冷核步 + 凭证产物；§7 未整段拔（G3 仍冷核），散文大头**部分兑现**，整段拔待 sub3c。

**下次起点**：见 task_plan「下一步」——#0 commit 本轮 / #1 sub3c（G3+任务包规范化，兑现整段拔）/ #2 全局验收 / #4 loop 第二层（与 sub3c 协同）。

---

## 2026-06-19 · 会话 2（子计划 3 → 2 + loop 概念澄清）

**起点**：子计划 1（地基）已实施待验收（分支 `feat/sub1-foundation`）。

**做了什么**（均在分支 `feat/sub1-foundation`，未合 master、未 push）：
1. **子计划 3 · Gate 重定义**（commit `6b57e7d`）：§7 冷核协议→两层「完成判据核对」，G1/G2 走 linter+人签、删 2 个 subagent 冷核步骤；G3/G4/G5 暂留冷核。范围只 G1/G2、不做 hook。
2. **子计划 3 对抗审查整改**（`e911323`/`f9373e2`）：收窄 PRD 过宽【linter】标签（入口→·非空、draft-ux→·枚举），对齐 check-docs 实际检查项。
3. **子计划 2 · 不可视区 AC→test**（`fe76207`）：AC 操作化@draft-tech-design + 删 develop Step5.5 对抗审查 + backend-checklist 降维测试品类清单 + pr-review 路1 兜残。一次全做。
4. **子计划 2 对抗审查整改**（`e75a7f5`）：补回安全测试品类（注入/路径穿越）；测试框架约定 owner 落 draft-tech-design + develop 无运行器非死锁处理；前端非视觉审查降级诚实记账。
5. **loop 概念澄清**：用户追问"lint固化 / 前向信息有效性 与 loop 的关系"——补 `design.md §2.5`：loop=机制、删规则=收益、前向有效性(lint)/正确性(test)=同一 loop 两维度；净收缩"及格但不漂亮"；loop 第二层(per-module 小循环)未做仍 parked。

**当前状态**：design.md 定稿 + 子计划 1/3/2 实施完成 + 各过对抗审查 + 整改。7 commit ahead of master，clean，全本地。

**下次起点**：见 task_plan.md「下一步」——全局验收 / 子计划 4（可视区，最低优先）/ 兑现散文大头删除（G3-5 检查器）/ loop 第二层。合并推送均待用户明确确认。

---

## 2026-06-19 · 会话 1（结构性审查 → 方向定稿 → 子计划 1）

- 结构性审查（4 段分析 + 独立 subagent 对抗审查）→ `findings.md`：定性两个全局错误（A 质量模型方向错 / B AI 不可靠当成规范写作问题）。
- brainstorming 收敛 + 两次迁移演练 → `design.md`（方向 + 净收缩判据 + §11 四子计划拆解）。用户复审通过。
- 子计划 1（地基）实施：`templates/prd.md`/`trd.md` 结构化模板 + `templates/scripts/check-docs.js` linter + 5 份 spec 接线。linter 自测通过。
