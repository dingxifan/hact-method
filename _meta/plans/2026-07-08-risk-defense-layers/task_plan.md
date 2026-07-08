# 2026-07-08 · 安全敏感判定多层化（risk 不信自报，决策 #29）

> 来源：`_meta/plans/2026-07-08-method-review/findings.md` 条目【全-1】——决策#24（自合并）+ #26（standard 降档 haiku）+ risk 由 plan-sprint 自报且 check-sprint 不校验，叠加出"漏标 sensitive → haiku 审 → 自动合并"的无机械拦截链。B 类同险（无 G3 检查）。
> 原则：risk 自报不再是安全档位的单点输入；启发式**只升不降**（误报代价 = 多花一次默认模型审查，可接受）。

## 五层防线

- [x] ① plan-sprint / dispatch-new 填包规则加"存疑即 sensitive"
- [x] ② task-package-review.md 新增第 6 类「risk 标注核对」（命中四类而标 standard → 阻断）
- [x] ③ templates/scripts/check-sprint.js 新增敏感启发词核对（命中而未标 sensitive → 🧑 段，非 FAIL）
- [x] ④ develop 阶段 B 模型分级改「有效 risk」（自报 ∨ 主线四类语义扫命中 → 不降档 + 回改字段）
- [x] ⑤ develop 末端预检显式基于 diff 独立判定 + 漏标闭环（曾降档审过 → 重派默认模型独审后才进 architecture 裁决）

## 联动

- [x] specs-structural/develop.md：risk 字段说明 + 完成判据「基于 diff 独立判定」
- [x] skeleton/06 G3 段：check-sprint 覆盖描述补启发核对
- [x] task-package-review.md 顺手清决策#27 漏网栈词（--el-color-primary / variables.scss / main.ts）
- [x] BRIEF 决策 #29；findings 状态表 全-1 → ✅；STATUS + status-history；commit
