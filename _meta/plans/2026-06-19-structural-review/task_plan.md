# task_plan — hact-method 结构性审查 · 2026-06-19

**性质**：方法论方向性转变（质量模型：规范遵循 → 输出可测试性）
**状态**：方向已收敛成 `design.md`，**待用户复审**；复审通过后进入子计划 1（地基）。

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
| 子计划 2（不可视区迁移：AC→可运行测试） | 🔨 **实施完成**，待用户验收 + 对抗审查（同分支 `feat/sub1-foundation`，未合 master、未 push）；设计稿 `sub2-不可视区测试-design.md`。定调：AC 操作化@draft-tech-design + 一次全做 |

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

## 下一步

1. **用户验收子计划 1 + 子计划 3**（同分支 `feat/sub1-foundation`，可看 diff / 试跑 linter）。
2. 验收 OK → 由用户决定是否合 master + push（推送需用户确认，master 严格）。
3. 之后按 `design.md` §11 进**子计划 2（不可视区迁移：AC→test；含 develop Step 5.5 对抗审查退场 + AC 操作化）**，或继续把 G3/G4/G5 建检查器以兑现 §7 主体的彻底删除。

---

## 相关文件

- 分析底稿：`findings.md`
- 方向设计稿：`design.md`
- 待议条目：`../方法论待议.md`（2026-06-19 四条 + 2026-06-18 Gate 冷核硬化 + 2026-06-16 check-status.js）
- 演练对象：`specs-execution/develop.md`、`templates/checklists/backend-checklist.md`、`templates/checklists/frontend-checklist.md`、`skeleton/06-gates.md` §7
