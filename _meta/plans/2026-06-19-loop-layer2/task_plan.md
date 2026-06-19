# task_plan — loop 第二层重启 · 2026-06-19

> ⏭️ **已被接替（2026-06-20）**：第 0 层决策定为「先重定形状」（findings §十四），后续工作迁至 `../2026-06-20-pipeline-reshape/`。loop 第二层降为"形状定下后再排优先级"的形状内杠杆。本目录 findings §六–十四 仍是有效的"瘦身机制地图"，pipeline-reshape 的 design 由 §十四 长出。

---

**性质**：承 structural-review（本方向收口 + retrospective）的 parked 项重启——loop 第二层（拆生成单元，让 generator 真正变瘦）。
**状态**：🟡 **刚起步，停在入口决策**。findings 框架已写，下次从「入口 fork」继续。

> **下次起点（按层级读）**：重读 `findings.md`——**先读 §十四（流水线形状之疑，本阶段真正的纲）**，再读 §六–十三（瘦身机制地图），最后 §一–五（loop 第二层本体）。
>
> **决策已抬升为两层**：
> - **第 0 层（纲，§十四）·先定形状**：是**在现流水线形状内打补丁**，还是**先重定形状**——垂直切片（满宽横片→单功能端到端薄片，缩反馈环）+ 测试脊柱前置（可执行 AC 拉到最前当全程不变量，而非末端操作化+验证步）。**这一步可能让下面的杠杆优先级整个重排。**
> - **第 1 层（形状内的杠杆，§十二）**：loop 第二层 / 蒸馏交接 / hook 门卫 / DRY 仪式。其中 **hook = 删散文的关键缺失拼图**；蒸馏交接有"信息有损"代价（§十四 14.1），需测试脊柱兜底才安全。
>
> **形状内入口（仅当第 0 层选"打补丁"才用，A/B/C 仍有效）**：
> - **A · 先做迁移演练**：拿真 TRD（hact-app v4）量 per-API 拆分到底删不删得动散文 = 防 sub7「reorg 误框成净收缩」廉价闸。
> - **B · 直接全量重构** draft-tech-design（Step 3 拆 3a 冻结共享类型 + 3b per-接口 subagent 并行 + check-docs 当 validator）。
> - **C · 先读 scaffold-first 技能**看共享类型先行骨架能复用多少（注：shared-type-first ≈ §十四 的"能走路的骨架"）。
>
> **关键关联**：shared-type-first（loop 第二层前置）= §十四"先立走路骨架 + 功能竖片穿过它"里的那具骨架——loop 第二层与"重定形状"在此接上，不是对立选项。
>
> **历程**：CC 曾抛 A/B/C → 用户要先澄清未作答 → 转随聊（行数→三机制→linter/hook→负载增长→**流水线形状本身是否有问题**）→ 沉淀进 findings（✅ §六–十四）。下次先在**第 0 层**与用户对齐"打补丁 vs 重定形状"，再往下选杠杆。

---

## 已完成（本会话）

1. **复盘落盘**：`../2026-06-19-structural-review/retrospective.md`（痛点→方案→规划 vs 落地→5 处偏差→落地盘点→总评）。核心结论：方向落地、判据（净收缩）部分落空、最深的 loop 第二层从头 park 到尾。
2. **新阶段脚手架**：建本目录 + `.current_plan` 指向 `2026-06-19-loop-layer2` + `findings.md` 框架。

## 关键锚点（别丢）

- loop 第二层 ≠ 第一层。第一层=换验证器类型（已 sub1-7 收口）；第二层=**拆生成单元**（per-模块/接口小循环），真正让 generator 变瘦。
- 核心未碰的是 **(a) TRD 按 API 并行**；(b) develop 模块级即写即验大部分已被 sub2 做掉。
- 前置硬障 = **shared-type-first**（先冻表结构 + standards-shared，再 per-API 引用）。
- **重启纪律**：动手前回答"per-API 到底删掉哪条散文"——删得动才是 §2 净收缩，删不动就老实记成结构/质量改进（学 sub7 诚实账，不再误框）。

## git

- 本会话只动 `_meta/plans/`（retrospective + loop-layer2 框架），未 commit、未 push。
- 注：structural-review 的 sub1-7 仍全在**本地 master**、领先 origin 十几 commit、**从未 push**（master 严格，待用户明确）。
