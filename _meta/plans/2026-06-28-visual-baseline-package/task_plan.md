# task_plan.md — 视觉地基包三件套落地

## 目标
把 v8 视觉低级错误暴露的结构缝补进方法论，**并入 2026-06-22 前端一致性框架**。三件套：
- ① 视觉地基包（治 R2/R3，真新增）
- ② token 落地门禁（治 R1，concretize 待议 #17，落在 develop lint 层）
- ③ 视觉冒烟断言（治 R4，前移捕捉网到 generate-integration-tests，含 ④ design.md 锚点）

设计与分析见 `findings.md`。诚实账：①是 ADD（核心增量），②是把已 parked 的想清楚的事落地 + 类别纠正，③是复用既有 pinchtab 的小 ADD。

## 阶段

| 阶段 | 内容 | 状态 |
|---|---|---|
| 0 · grounding | 读 plan-sprint / gen-it / check-sprint / check-gate / standards-frontend / frontend-checklist / design.md / task-package / develop / scaffold-first | ✅ complete |
| 1 · 设计定稿 | findings 写完，用户确认三口径 | ✅ complete |
| 2 · 件① 地基包 | plan-sprint Step2 规则 + Step3.5 brief 第⑤维度；check-sprint 硬核；task-package 标记说明 | ✅ complete |
| 3 · 件② token 落地 | standards-frontend 两条规则；frontend-checklist 两项机械；draft-tech-design 播种 owner | ✅ complete |
| 4 · 件③④ 冒烟 | generate-integration-tests 完整档必跑 + 3 断言；design.md 冒烟锚点段 | ✅ complete |
| 5 · 镜像 + 收口 | structural 完成判据同步；develop §字段规范加 baseline；2026-06-22 findings + 待议 #17 标注；STATUS 里程碑 | ✅ complete |
| 6 · 验证 | check-sprint `node --check` + 三用例 fixture（v1 FAIL / baseline pass / v2 human）全过；grep 验 五类/baseline 一致 | ✅ complete |

## 关键决策（已定 + 用户确认口径）
- ② 落 develop lint 层，**不进 check-sprint/check-gate**（范畴纠正，findings §四纠正1）
- 具体 stylelint 规则是技术栈层，**不在 hact-method 建通用脚本**（findings §四纠正2）
- 拒绝像素快照/导出工具链/per-task token 字段/check-gate 视觉核（findings §五）
- **地基包触发：v1 硬性必有（check-sprint FAIL）+ design.md 变更触发（vN+1 退 human）**
- **视觉冒烟：涉视觉基线迭代·完整档必跑**
- **本轮只落三件**，组件复用部分留待议 #17

## 状态
全部编辑完成 + 自测通过。**未 commit、未 push**（master/推送严格，待用户明确）。下一步：用户决定是否 commit 到 method-lab。

## 错误记录
| 错误 | 尝试 | 解决 |
|---|---|---|
| — | — | — |
