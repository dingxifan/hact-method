# task_plan · schema 可视化工具

> 设计与估账见 `design.md`；MVP 原型产物见 `mvp-artifacts/`。
> **状态（2026-06-28）**：随便聊出方向 + 当场跑通 MVP（JHH-Nortion 真库）。**探索期，未立项、未进流程、未 commit。**

## 一句话
给"不可见区表结构"做一个 **pull 式、人主动调起、连真库生成、看完即弃**的可视化工具，补人在 AI 驱动开发下丢失的 schema 敏感性。底图=真库全量，叠加层=本期变化叙事（字段级去向=意图层=命门）。

## 已完成（MVP，真库跑通）
- ✅ PostgREST OpenAPI introspect JHH 真库 → 9 表/85 字段/7 外键（零密码、FK 白送）
- ✅ mermaid + svg-pan-zoom 自包含 HTML，缩放/平移
- ✅ subagent 考据用途 73/85 实锤，逮到 pages.type 五态 + view_configs 死表
- ✅ 字段用途→注释列 / 表用途→面板+hover / ※推测标记
- 产物：`mvp-artifacts/jhh_schema.html`（成品）+ `gen3.py`（生成器）+ `dump.py`（schema 抽取）+ `schema.json`/`purposes.json`（JHH 数据）+ `jhh_schema.mmd`

## 下一步候选（未定，下次开局先问用户挑哪个）
- [ ] **B·数据手感层**：每表行数 + 关键列 null 率/distinct/top-N（聚合不倒 PII），验"detail_md 全 null"那类意图-现实裂缝能否浮出
- [ ] **形态调整**：注释塞框 vs 点击侧栏展开（中文注释撑宽 pages 框，密度 vs 可读性）
- [ ] **大库压测**：拿 hact-app 或 org-krm 真大库（40+ 表）试 mermaid 会不会毛线球 → 决定 Phase 1 要不要 cytoscape
- [ ] **回去拍 Phase 1 立项**（pull-only 工具，倾向做）；Phase 2 声明链押后、门控在 Phase 1 证明价值后

## 关键决策记录（防绕回）
- pull 不 push、不进流程、不设 Gate（决策 #20 + 拉取哲学）
- 底图永远连真库全量；叠加靠"声明"不靠"两库相减"（后者判太麻烦）
- ghost 字段塌进 drill-in 文本，不画特殊节点
- 始终是生成产物；过悬崖的只有「活/存」，真要 live 家在 hact-app 面板
- 意图层优先 (a) 设计时声明 = 复活 parked 的 FIELD-id 链；(b) 代码 grep 是 Phase 1 的现实版起步
- introspect 路 PostgREST 特定；非 Supabase 项目用 ssh_db_query 打 INFORMATION_SCHEMA

## 接续关系
- **接** `2026-06-25-implicit-assumption-defense`：那条 parked 的「第二批 honor 半机械链 + FIELD-id + sub-C 充分必要检验」是本工具 Phase 2 意图叙事的源头（同一件事两头，见 design §3）。
- `_meta/.current_plan` 本轮指向本目录（用户要"下次继续"）。**主线 pipeline-reshape 仍 parked**，原 pointer 值 `2026-06-20-pipeline-reshape`，需要时切回。
- 全程**未 commit**（本仓 method-lab 分支，推送严格）。
