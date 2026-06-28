# design · schema 可视化工具（不可见区 / 表结构敏感性）

**日期**：2026-06-28
**性质**：随便聊出来的方向 → 当场跑通 MVP。**还在探索期，未立项、未进流程、未 commit。**
**起点**：用户提"想聊不可见的地方，例如表结构"。

---

## 1. 问题（两层，表结构同时踩两层）

**第一层·不可见 = 人当不了验收官。** 后端/数据/逻辑是不可视区，非技术管理者在 Gate 上对着 schema 就是橡皮章（沿 2026-06-19 结构性审查的可视/不可视分区）。

**第二层·表结构独有 = 改起来最贵。** 坏 AC 在 PRD 最便宜处暴露；坏 schema 往往半年后做 migration 才暴露。test 验"行为是否符合 schema"，验不了"schema 设计本身对不对"。

**用户真正的痛点（本轮核心）**：**AI 驱动开发偷走了人对 schema 的掌控感。**
- 过去人亲手一条条写 migration，cardinality/索引/外键攒在脑子里——**敏感性是写代码的免费副产品**。
- 现在 AI 一段段生成，**每次只见部分字段**，人脑里那张全局图空了。
- 去库里看表是**读 ≠ 写**，补不回那种敏感性。
- 缺一个**整体视图**：从没有一张"所有表/字段/关系"的合并总图。

→ 命名：**敏感性过去白送，现在得当成设计出来的"养"——刻意造一张忠实全量视图 + 一个相遇节奏。**

---

## 2. 收敛的设计（用户拍的几个关键决策）

1. **pull 不 push**：人想看了自己调起的工具（类比 `/code-review`），**不进流程、不设 Gate、不强制**。符合决策 #20（低频复杂工作不强行 task 化）+ 拉取哲学。接受代价="没人调它敏感性照样萎缩"。
2. **底图 = 永远连真库、永远全量** introspect。图本身是纯现实，不掺规划。
3. **完成与否当开关**：用 `status.yml`（项目级状态契约，现成）判断有无活跃迭代——有 → 高亮本期变化表 + 叠加叙事；全完成 → 收敛回干净全库。
4. **叠加层靠"声明"不靠"算"**（本轮关键转弯）：早先想"连两个库相减"算 delta，判为太麻烦。改成"本期改了啥"本来就该是设计时写下来的东西（见 §4 接 parked 链）。
5. **ghost 塌进文本**：未 apply 的新字段不画成特殊虚线节点，**就是 drill-in 文本里一句话**（"本阶段新增、尚未 apply"）。图保持极简。
6. **drill-in 叙事 = 字段级 provenance/consumption（"由哪里生成、送到哪里消费"）= 命门**。这是意图/业务逻辑层，是别的 ERD 工具给不了的、也是养敏感性的关键。定义/数据机械可抽，唯独这层是数据流向、藏在代码和人脑里。
7. **始终是生成产物、不是应用**。缩放/钻取/连接/统计/甚至意图，全能塞进"调起→生成快照→看→丢"的自包含 HTML（cytoscape/mermaid 纯前端给可交互，零后端）。**过悬崖的只有「活」(随时反映库) 和「存」(批注/历史/多人)**，跟丰富度无关。真要 live，家在 **hact-app**（一个面板），不是独立 app。

---

## 3. 接上 parked 的 FIELD-id 链（关键联系）

drill-in 的"字段去向"叙事，源头有两条：
- **(a) 设计时声明**（倾向）：意图、便宜、写/审它本身就是养敏感性的 ritual。
- **(b) 代码 grep 重建**：反映现实、零人工税、但费劲且是"现实非意图"。

**(a) 正是 2026-06-25 implicit-assumption-defense 里整个 parked 的"第二批 honor 半机械链"**：
- 已落地（链尾）：`develop-review.md` 第 7 类「用户输入去向追踪」——**代码侧、事后审查、建议级**，只追 DTO 字段 → service 消费。
- 整个 parked（链头+链中）：TRD `# owner:` 注解 + **FIELD-01 稳定 id** + check-docs 跨源对账 + keystone（可靠枚举原型可编辑控件）。
- 还有 `sub-C 充分必要检验`（逐 AC 穷举"凑齐这结果要哪些输入字段"）也没落地——几乎是"给每个 AC 写字段级去向"的字面实现。
- 设计稿自己写过一条没做的设想：**设计充分必要（每 AC 要哪些字段）→ owner 声明（归属/去向）→ 代码去向追踪（实际送哪），三段用同一 FIELD-id 串起来。** 现在只做了链尾，链头链中空着。

**两头合一的判断**：parked 当初性价比不够，因为它唯一消费者是"让 linter 红一下"。若消费者变成**这张 schema 视图**（意图叙事直接吃这份声明），它就有了看得见、能养敏感性的回报。**视图和声明链是同一件事的两头**——一头声明字段去向（parked），一头贴着真库画出来（新点子）。单独看不划算，配上可能翻账。

---

## 4. 三级估账（诚实）

| 级 | 内容 | 工作量 | 复发成本 | 效果 | 风险 |
|---|---|---|---|---|---|
| **MVP** | 连真库 introspect → 出图 | 半会话 | 0 | 随时看全库（解痛点大头） | 几乎无 |
| **Phase 1·视图器** | +cytoscape/mermaid 缩放钻取 +聚合统计(null率) +高亮本期变化表 +drill-in 用 subagent grep 代码现场重建(意图层=代码现实(b)) | 2–4 会话 | 0 | 可视化整体+抓现实裂缝+半养敏感性 | **大库 40+ 表毛线球**（真正的 wildcard） |
| **Phase 2·声明链** | 复活 parked：逐 AC 字段去向声明 + TRD `# owner:` + FIELD-id + check-docs 跨源 + keystone | 3–5 会话 **+ 每期人工税** | **有** | 意图 vs 现实裂缝 + 真养敏感性 + 链闭合 | Goodhart（又一张没人填的表）+ keystone 未解 |

**建议**：MVP + Phase 1 值得做（pull-only、零流程负担、零每期税，正是"少加机制"原则不该拦的 ADD）。**Phase 2 别现在做、别当 Phase 1 前置**，门控在"Phase 1 证明人真会看、且想要意图-现实对比"之后。

---

## 5. MVP 实跑结果（2026-06-28，JHH-Nortion 真库，全部真代码/真库、零臆造）

**结论：连真库 → 硬生成一张可读 ER 图 = trivial。** 产物在 `mvp-artifacts/`。

- **introspect 路（最便宜、值得记进方法论）**：打 PostgREST 根端点要 OpenAPI JSON → 9 表/85 字段/7 外键全拿到。**零 PG 密码、绕开 deploy-log 里"直连 db.\*.supabase.co IPv6 不可达"的坑**（走 HTTPS + anon/service key）。**外键白送**（PostgREST 把 FK 编码在字段描述里，不用查 pg_constraint）。
  - 命令：`curl $SUPABASE_URL/rest/v1/ -H "apikey: $KEY" -H "Authorization: Bearer $KEY"`（key 来自项目 `.env.local`，Windows 换行要 `tr -d '\r'`）。
  - ⚠️ 这条路 **PostgREST/Supabase 特定**。非 Supabase/直连 PG 的项目，等价物是 `ssh_db_query` 打 `INFORMATION_SCHEMA`（稍多一点活）。
- **渲染**：mermaid `erDiagram` + `svg-pan-zoom`（两个 CDN 库）= 自包含 HTML，滚轮缩放/拖拽平移。**9 表量级 mermaid 完全够用，没必要上 cytoscape**（cytoscape 优势在大库动态展开/分组）。mermaid 默认是静态 SVG 不能缩放，必须接 svg-pan-zoom。
- **用途考据（意图层 (b) 代码现实版）**：派 1 个 general-purpose subagent 读 entity/service/migration/docs，**85 字段 73 个代码实锤 / 12 命名推断**（推断集中在 view_configs 整表 + 几个样板 id/created_at）。
  - **逮到两处真·schema 腐烂**（实证工具价值，人肉看库难发现）：① `pages.type` 是**五态**含 `activity`，非预想四态；② `view_configs` **整表疑似死表**，后端无 service 读写、功能与 `filter_defaults` 重叠。
- **焊进图**：字段用途 → ER 原生注释列；表用途 → 左上常驻面板（🟢实锤/🟠推断）+ 节点 hover `<title>`；12 个推断字段注释带 `※推测` 橙标。
- **JHH 领域速记**：`pages` 是核心统一实体，靠 `type`(page/note/goal/task/activity) + `parent_goal_id`/`parent_task_id` 自引用层级 + `enable_task_layer`(v7) 一表承载多态；其余 8 表为辅助（profiles/departments/page_shares/page_mentions/note_read_status/view_configs/filter_defaults/system_settings）。

**MVP 未碰/未验**：
- 数据手感层（行数 + null 率，验"detail_md 全 null"那类裂缝）——**下一步候选 B**。
- 大库毛线球风险——JHH 才 9 表太干净，没压出来，得拿 hact-app/org-krm 真大库试。
- "叠本期设计变化"那层（Phase 1 高亮 + Phase 2 声明链）。
- 形态取舍：注释塞进框 vs 点击侧栏展开（中文注释撑宽 pages 框，密度 vs 可读性待调）。
