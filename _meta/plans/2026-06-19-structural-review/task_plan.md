# task_plan — hact-method 结构性审查 · 2026-06-19

**性质**：方法论方向性转变（质量模型：规范遵循 → 输出可测试性）
**状态**：方向 `design.md` 已复审通过。**子计划 1 / 3 / 2 / 3b 均已实施**，累积在分支 `feat/sub1-foundation`（**全本地、未合并、未推送**）。子计划 3b（G4/G5 检查器 + §7 部分塌缩）于会话 3 完成，**未 commit**（工作树有改动待提交）。剩：sub3c（G3 + 任务包规范化，新拆出）/ 子计划 4（可视区收口，最低优先）/ G3-5 散文大头整段拔（待 sub3c）。loop 概念关系已澄清补入 `design.md §2.5`。

---

## 进度

| 阶段 | 状态 |
|------|------|
| 结构性审查（4 段分析 + subagent 对抗审查） | ✅ `findings.md` |
| 待议清单记入 4 条方向 | ✅ `方法论待议.md` 2026-06-19 |
| brainstorming 收敛方向 | ✅ 见下「已达成定调」 |
| 两次迁移演练验证普适性 | ✅ backend-checklist 85% / Gate 冷核 病灶活体 |
| 固化设计稿 | ✅ `design.md` |
| 用户复审 design.md | ✅ 通过 |
| 子计划 1（地基：产物结构化） | 🔨 **实施完成**，待用户验收（分支 `feat/sub1-foundation`，未合 master、未 push） |
| 子计划 3（Gate 重定义：G1/G2 linter 接闸 + 删冷核） | 🔨 **实施完成**，待用户验收（同分支 `feat/sub1-foundation`，未合 master、未 push）；设计稿 `sub3-gate重定义-design.md` |
| 子计划 3 独立对抗审查（聚焦 diff） | ✅ 无 blocker；3 条 suggestion 已整改（commit `e911323`）——核心是收窄 PRD 过宽【linter】标签（入口→·非空、draft-ux→·枚举），使标签与 check-docs 实际检查项一一对应 |
| 子计划 2（不可视区迁移：AC→可运行测试） | 🔨 **实施完成**，待用户验收（同分支 `feat/sub1-foundation`，未合 master、未 push）；设计稿 `sub2-不可视区测试-design.md`。定调：AC 操作化@draft-tech-design + 一次全做 |
| 子计划 2 独立对抗审查（聚焦 diff） | ✅ 2 BLOCKER 已整改：① 安全覆盖洞（注入/路径穿越在 checklist 重写时丢失，与 design §8 的 T 清单冲突）→ 补「安全·注入/穿越」测试品类 + 留人判；② 测试运行器悬空假设（无 spec 负责建测试基建）→ draft-tech-design standards 生成确立「测试框架约定」owner + develop 无运行器非死锁处理。3 SUGGESTION（前端非视觉审查降级诚实记账 / lint 自定义规则前提 / 契约跨字段口径）已纳入 |

---

## 已达成定调（详见 design.md）

1. **核心命题**：正确性维度从"散文/AI 肉眼"迁成"确定性检查"，每迁一条删一条散文。**成功判据 = spec 净收缩**，不是新增验证。
2. **分区**：火力集中不可视区（后端/数据/逻辑——人没法兜）；可视区（前端视觉）留人走查。
3. **核心抓手**：A（AC→可运行测试，验正确性），B/C 退为支撑层。用户拍板"逻辑真对"。
4. **保真**：路 2 主干（AC 操作化/spec-by-example）+ 路 1 兜残（pr-review 技术人确认）。
5. **前置地基**：产物结构化——待议 A1/A2/check-status/B3 hook 扶正为骨干。
6. **Gate 重定义**：确定性检查器全绿 + 语义人签；非技术管理者退为"信凭证"。
7. **三窟窿**：测试完备性（checklist 降维成测试品类清单）/ 测不动残项 / 谁写测试。
8. **不做**：PRD 语义验证、协调流程规则（留 prose）。

---

## 子计划 1 实施记录（分支 `feat/sub1-foundation`）

设计稿：`sub1-地基-design.md`。已落地交付物：
- 新建 `templates/prd.md` / `templates/trd.md`（结构化模板，空槽 + 固定 header）
- 新建 `templates/scripts/check-docs.js`（纯 Node linter，无依赖；已自测：原始模板全面 FAIL、填好全 PASS、缺表交叉 FAIL、标签后缀兼容）
- 改 `specs-execution/init-project.md`：Step2 建 `scripts/`、Step3 铺 check-docs.js
- 改 `specs-execution/draft-prd-vN.md`：Step4 功能块对齐模板 + 加 `涉及实体`；Step7 套模板；新增 **Step 7.4 linter 自检**（PRD-only，冷核前）；v2+ 功能 header 改兼容写法
- 改 `specs-execution/draft-tech-design.md`：Step3 表/接口对齐固定 header + 模板符合；新增 **Step 5.4 linter 自检**（含 PRD↔TRD 交叉对账）
- 改两份 structural 契约：完成判据标 **【linter】**（子计划 3 删冷核埋点）+ 产物引用模板 + 必含段落补字段

**净收缩账**：本子计划建能力为主，散文删除有限；【linter】项的冷核删除待子计划 3 接闸后兑现（见 design §6）。

## 子计划 3 实施记录（同分支 `feat/sub1-foundation`）

设计稿：`sub3-gate重定义-design.md`。本轮定调：**只 G1/G2**（linter 现仅覆盖 PRD/TRD）、**不做 hook**。已落地：
- `skeleton/06-gates.md` §7：改「冷核协议」→「完成判据核对」两层模型——G1/G2 走 linter+人签语义（**删 subagent 冷核**，存量无脚本则退回兜底）；G3/G4/G5 沿用 subagent 冷核（原协议步骤完整保留，冠以适用范围 N∈{3,4,5}）。
- `specs-execution/draft-prd-vN.md`：Step 7.4 升格为【linter】判据最终判定；**删 Step 7.5 冷核整步**；Step 8 签字前置改 linter 退出码 0；commit 去 `gate-checks/G1.md`；Subagent 段改"PRD 全程零 subagent"。
- `specs-execution/draft-tech-design.md`：Step 5.4 升格（含交叉对账）；**删 Step 5.5 冷核整步**；Step 6 前置改；commit 去 `gate-checks/G2.md`；Subagent 表删冷核行。
- 两份 structural（draft-prd-vN / draft-tech-design）：删【linter】删除埋点括注；"完成判据已冷核"行改为"linter 全绿 + 语义人签（存量退回兜底）"。
- 三处 G3/G4/G5 引用（plan-sprint Step4.7 / manual-test 签G4前 / wrap-up 签G5前）：§7 引用标题随重命名更新为「完成判据核对」G3/G4/G5 段，功能不变。

**净收缩账**：实时路径删除 **2 个 subagent 冷核步骤**（G1 Step7.5、G2 Step5.5）+ PRD 全程零 subagent；structural 删 2 行埋点括注。§7 因保留 G3-5 协议略增。全 5 关 + §7 主体的彻底删除待 G3/G4/G5 建检查器后兑现。

## 子计划 2 实施记录（同分支 `feat/sub1-foundation`）

设计稿：`sub2-不可视区测试-design.md`。定调：**AC 操作化压 draft-tech-design** + **一次全做**。已落地：
- **AC→可运行测试**为不可视区正确性主轴：draft-tech-design 把不可视区 AC 操作化成 Given/When/Then 例子（挂 `# 满足 AC` 回链旁，散文约定不进 linter）→ plan-sprint 写进 backend 任务包 → develop 1:1 落成测试+跑绿 → pr-review 路1 兜残。
- **删 develop Step 5.5 AI 对抗审查整步**（~64 行）；Step 5 加 `npm run test` + 测试品类自检 + 升级逻辑（测试反复红→根因 AC/TRD→revise-doc）。
- **backend-checklist 重写**为测试品类清单（6 类：鉴权/边界/错误路径/契约/数据并发/**安全注入·穿越** + lint 归集 + 4 留人判）。
- pr-review 路1 兜残（通过/打回条件 + 第五步测试保真核查）；4 份 structural 同步；修 3 处对已删 Step5.5 的悬挂引用。
- **整改（对抗审查 2 BLOCKER）**：① 补回安全测试品类（注入/路径穿越，曾在重写时丢失）；② 测试框架约定 owner 落到 draft-tech-design standards 生成 + develop 无运行器非死锁处理。

**净收缩账**：删 1 个大 AI-肉眼步骤 + checklist 砍半；ADD 是"写真测试/验输出"非"堆 generator 规则"，不背叛 §2。

---

## 本轮总结（2026-06-19，为下次对话铺接续）

- **完成**：design.md 方向定稿（含 §2.5 loop 关系澄清）+ 子计划 1（地基 linter）+ 3（Gate G1/G2 重定义）+ 2（不可视区 AC→test），三块各过聚焦 diff 的独立对抗审查并整改。
- **产物全在分支 `feat/sub1-foundation`**：7 commit ahead of master，working tree clean，**未合 master、未 push**（用户明确要求：全局未完成前全本地处理）。
- **关键概念锚点**（详见 design.md §2.5）：lint/test = loop 的确定性验证器，不是 loop 之外的东西；前向信息有效性（lint）与正确性（test）是同一 loop 的两个验证维度；净收缩目前"及格但不漂亮"——删 AI/人眼步骤为主，散文大头（§7 主体 / develop 471 行）埋点待 G3-5 建检查器；最初 loop 的"第二层"（per-module subagent 小循环 / TRD shared-type-first）本轮未做、仍 parked。

## 子计划 3b 实施记录（同分支 `feat/sub1-foundation`，会话 3）

设计稿：`sub3b-G345检查器-design.md`（含 §8 阻断发现 + §9 定档 + §10 sub3c 待办）。用户定调：**拆分**（选项 2）——本轮 G4/G5，G3 另起 sub3c。已落地：
- 新建 `templates/scripts/check-gate.js`（G4：status.yml 核 manual-test 任务全 merged + 验收报告结论；G5：feedback 清空 + project.md 无开发中；语义残量留人）。自测 6 场景全过 + 真 hact-app 烟测（G5 PASS、G4 走存量兜底）。
- `skeleton/06-gates.md` §7 **部分塌缩**：新增「G4/G5 薄检查器」段（check-gate，linter+人签）；原「G3/G4/G5 冷核」收窄为「G3」段（待 sub3c）；协议 N∈{3}；修 draft-ux Step3.5 悬挂引用。
- 3 exec（manual-test/wrap-up 冷核步→check-gate + 删 G4/G5 凭证 commit；plan-sprint §7 引用改 G3 段 + 标注 sub3c；init-project 铺 check-gate.js）+ 2 structural（manual-test/wrap-up 完成判据改写 + 标【linter】）。

**阻断发现（重要）**：建 check-sprint.js（G3）前实测 hact-app 任务包——**格式未规范化、跨迭代漂移（v1: 5字段+markdown段；v3: 14键YAML）、与 develop.md 17 字段 spec 背离**（缺 depends_on/api-contract/AC回链，`layer` 单数）。G3 linter 真前置 = 任务包规范化（sub1 同款），故拆出 sub3c。详见 sub3b-design §8。

**净收缩诚实账**：删 G4/G5 各 1 冷核步（-2 实时路径）+ 删 G4/G5 凭证产物 + structural 改写。**§7 未整段拔**（G3 协议主体仍在）——散文大头本轮**部分兑现**，整段拔待 sub3c。

---

## 下一步（候选，待用户定）

0. **commit 本轮 sub3b**：工作树有改动（check-gate.js + §7 + 5 spec），待提交到分支 `feat/sub1-foundation`（**推送需用户明确确认，master 严格**）。
1. **sub3c（G3 + 任务包规范化）**：① 任务包格式规范化（templates/queue 模板 + 校正 develop.md §字段规范 + 存量决定）② 建 check-sprint.js ③ §7「G3」段整段拔 → **兑现 design §2.5 散文大头整段删除**。见 sub3b-design §10。
2. **全局验收**：用户复审各块 diff（`git diff master..HEAD`）/ 试跑 linter / 决定是否合 master + push。
3. **子计划 4（可视区收口，design §11.4，最低优先）**：frontend-checklist 可机械部分迁 lint/test，视觉明确归人走查。
4. **loop 第二层（更狠的减规则）**：TRD shared-type-first → per-module 小循环（design §2.5 + findings §二，parked；与 sub3c 任务包规范化有协同）。

---

## 相关文件

- 分析底稿：`findings.md`
- 方向设计稿：`design.md`
- 待议条目：`../方法论待议.md`（2026-06-19 四条 + 2026-06-18 Gate 冷核硬化 + 2026-06-16 check-status.js）
- 演练对象：`specs-execution/develop.md`、`templates/checklists/backend-checklist.md`、`templates/checklists/frontend-checklist.md`、`skeleton/06-gates.md` §7
