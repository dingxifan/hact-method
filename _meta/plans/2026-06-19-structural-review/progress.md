# progress — hact-method 结构性审查 · 会话日志

> 跨会话接续用。最新在最上。打开本仓时：读 `_meta/.current_plan` → 本目录 task_plan.md（全局状态 + 下一步）+ design.md（方向，§2.5 loop 关系）+ 本文件。

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
