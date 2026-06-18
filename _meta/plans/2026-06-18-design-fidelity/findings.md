# 前端设计保真专题 · 研究发现与调整记录（2026-06-18）

## 缘起
用户反映：前端开发产出物经常偏离前置设计——交互设计、字体字号、组件复用。要求研究这是个别还是系统性问题。

## 一、实证（跨 hact-app / org-krm-v2 两项目，29 条偏离记录）

判定：**系统性、跨迭代复发，非个别**。按用户点名的三维度：

### 视觉规格 / 字体字号（复发最清晰）
org-krm-v2 backlog 至少 6 处硬编码颜色/间距违反设计系统，横跨 v3→v4→v5：
- AiDrawer.vue `#fff` / `rgba(0,0,0,.06)`（v5）
- ReaderView.vue 三处 `background-color:#fff`（v4）
- v3 新增组件 `#2563eb/#16a34a/#fefce8`（v3，未处理）
- `gap:2px` 而 `$space-xxs:2px` 变量已存在（未处理）
- OrgReviewView.vue 把 `$color-text-hint` 旧值硬抄成 `#8f959e`
- 反讽点：**变量都已定义好**，开发者仍绕过去硬编码 → 规范没被强制加载到眼前

### 交互设计偏离（发现最晚、最危险）
- DeptContentView.vue Tab 结构与 AC3 指定四 Tab 不一致（v5）
- ContentPanel 缺「通用」标签，联调才发现（v2）
- PDF 导出 core_work 未调 splitBehaviors，交互分支遗漏
- 共同点：都拖到联调/验收才暴露

### 组件复用（中等频率 + 接口漂移伴生）
- emit 签名/字段名与消费方不一致（hact-app v1 多任务）
- v3 新增组件未复用既有色彩变量

## 二、病因（方法论链路三处断点，与 2026-06-16 develop-loading-audit 独立发现吻合）
1. **design.md 不是 develop 必读**：规范写"涉及视觉时"加载，靠开发者自判 → 字号字体尤其无人负责落地
2. **prototype.html 全程失联**：draft-ux 产物在 TRD 之后全是"可选参考"，无阶段拿它当实现基准
3. **缺设计保真对账闸口**：develop / pr-review 只对照 standards，唯一对账落在 manual-test（最后一道，发现即已交付）

半好消息：硬编码靠 standards-frontend「禁止硬编码」被 CR 兜住一部分（多标「已直修」），但字号/交互/原型路径漏网。

## 三、本轮调整（用户选定 fix 1 + fix 2）

### Fix 1：design.md 升级为前端 develop 无条件必读
- `specs-execution/develop.md` 精确加载上下文：新增「frontend 必读项目根 design.md 全文」「prototype.html 对应交互路径作基准」两条
- `specs-execution/develop.md` Step 4：前端视觉实现先对照 design.md 用 SCSS 变量、禁硬编码；仅 design.md+standards 均未覆盖时才暂停问用户
- `specs-execution/develop.md` 前后端差异表：额外加载列 `design.md（涉及视觉时）` → `design.md（必读全文）；prototype.html 对应交互路径（若存在）`
- `specs-structural/develop.md` relevant-standards 字段说明：注明 design.md 已是无条件必读，不再依赖该字段触发
- `templates/checklists/frontend-checklist.md`：新增「十一、设计保真」5 项（字号/变量/控件尺寸/原型交互分支/未覆盖时暂停）

### Fix 2：pr-review 增设计保真维度
- `specs-execution/pr-review.md` standards 加载：frontend 额外加载 design.md 全文 + prototype.html 对应交互路径
- 通过条件新增第 4 条「设计保真」；打回条件新增 frontend 视觉冲突/遗漏交互分支；评估方法新增「第四步：设计保真核查」（视觉抽查 + 交互比对原型）
- 快速通道（直修）允许范围纳入「硬编码字面值替换为 design.md 既有变量」，明确不允许交互路径改动
- `specs-structural/pr-review.md` 完成判据新增 frontend 设计保真核查一条

## 四、Fix 3 讨论与落地（prototype 接入链路，第二轮）

### 关键转折：两个阶段，原型新鲜度不同（用户点出）
- 原以为有"漂移"难题（prototype 冻结于 G1.5，下游会变旧），纠结活规格/冻结/弃用三策略。
- 用户指出：sprint/develop 是"照规格造"，AI 按**新鲜**原型实现、不会故意违反；频繁调整发生在**联调/人工**段（人驱动、原型变旧）。
- 结论：按阶段收口即可，**漂移问题自然消解**，不引入任何活规格维护制度。

### 口径定案
| 对照项 | 适用范围 | 理由 |
|--------|---------|------|
| design.md 视觉 | 全部 frontend PR | 视觉规格跨迭代稳定，硬编码在任何阶段都是问题 |
| prototype.html 交互 | 仅 `source=sprint` 的 PR | 原型只在"照规格造"那遍新鲜；联调/人工/B 类派生修复 PR 原型已旧，再卡=误打回 |

### 已落地（第二轮）
- **调整 1（fix2 收口）** `specs-execution/pr-review.md` 4 处 + `specs-structural/pr-review.md` 1 处：prototype 交互对照限定 `source=sprint`；design.md 视觉对照保持全部 frontend PR
- **调整 2** `specs-execution/draft-tech-design.md` 2 处：必读清单加 prototype.html；§接口设计加"逐画面对照确认接口字段满足画面数据需求"
- **调整 3（轻版）** `specs-execution/generate-integration-tests.md` 3 处：脚本生成读取集合加 prototype.html；前端场景用原型**软核对覆盖齐全**（不设硬闸口，超 15 条照旧降级）

### 明确不做
- manual-test 不动（人工阶段，测试人自知怎么测）
- plan-sprint 不加原型锚点指针（与 ux-flows 行号重复）
- 不引入活规格/漂移维护制度
- fix 1（develop 读 prototype）维持原样——软参照非闸口，读到旧原型风险低
