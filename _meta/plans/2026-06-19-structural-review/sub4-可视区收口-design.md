# sub4 设计稿 — 可视区收口（frontend-checklist 迁 lint/test，视觉归人走查）

> 日期：2026-06-19（会话 6）
> 上游：`design.md §11.4`（可视区收口子计划，最低优先）+ `§8 演练二`（frontend ~50% 可机械）+ `§3`（可视区人是 validator）。
> 性质：本方向**最后一块**子计划。把唯一仍停在旧「逐条挑刺审代码」长清单形态的产物 `frontend-checklist.md` 收口成与 backend 同构的三段式；视觉/交互残量不新增机制（已被既有链路兜）。

---

## 1. 起点：frontend 链路其实已基本建好

排查发现可视区的正确性/保真验证**早已分散落地**，本子计划不是从零搭：

| 维度 | 已有承载（hard-gate 谁） | 来源 |
|------|---------|------|
| 视觉保真·**字号/颜色/间距/控件** | pr-review 第四步「设计保真核查·视觉」**hard-gate**（全部 frontend PR 对照 design.md） | 2026-06-18 design-fidelity |
| 交互保真（路径/分支/入口） | pr-review 第四步「交互」**hard-gate**（source=sprint 对照 prototype.html）+ manual-test 真应用走查 | 2026-06-18 + draft-ux 重构 |
| 类型对接 | pr-review 机械段 `vue-tsc --noEmit`；develop Step5 `npm run type-check` | 既有 |
| 渲染行为（loading/刷新/白屏） | integration-tests（pinchtab 前端场景）+ manual-test | 既有 |
| **响应式移动端 / 空态视觉·长文截断** | **pr-review 不 hard-gate**——只由 frontend-checklist §三 develop 侧走查 + manual-test 真应用兜（§8 名点的"真机视觉/品味"，本就该留人） | §8 实证 |
| develop 侧路由 | develop.md L199「前端可测部分写测试；视觉残量归 manual-test / pr-review，不在此卡」 | 子计划 2 |

**唯一残留旧形态**：`frontend-checklist.md` 本体——11 段 ~40 项「逐条肉眼审代码挑刺」，正是 design §9 窟窿2 点名要降维的 inspect-code 长清单。**本子计划 = 只收口这一件**。

---

## 2. 三个定档决策

### D1 · frontend 不设硬性「测试品类」强制（区别于 backend）
backend（不可视区）人没法兜，故 sub2 给它**强制测试品类**（每类必写或标 N/A）。frontend（可视区）不同：§3 明确人**能**当 validator，且渲染行为已有 integration（pinchtab）+ manual-test + pr-review 三重兜底。故 frontend 取**「可测则测」**——纯逻辑（store action / composable / 守卫 / 分页）能单测的不该留给肉眼，但**不强制每类、不卡死会话**；渲染行为不在 checklist 硬卡。依据：design §3（可视区人是 validator）+ §8 演练二（~50%，非 85%）。

### D2 · 最干净的机械赢面 = lint / type-check，尤其 stylelint 禁硬编码字面值
frontend 可确定性机械化的核心是 lint/tsc，而非测试。其中**硬编码设计字面值检测**（颜色/间距/字号写字面值而非 design.md SCSS 变量）直击 2026-06-18 design-fidelity 记录的 **org-krm-v2 跨 v3→v5 复发 bug**（变量已定义却硬编码 ≥6 处）——这是把"视觉保真"里**可机械的那一半**从人眼移到 stylelint。
**诚实前提（同 backend）**：上述靠**项目真配了 eslint/stylelint/vue-tsc 规则**才查得出（通用 lint 默认查不出"硬编码颜色 vs 变量"、事件监听配对）。项目未配对应规则的项，落到「留人走查」，**不得当作已被 lint 兜住**。

### D3 · 视觉/交互保真不新增 wiring
分两档承载（见 §1 表，不可笼统说"都被 pr-review 覆盖"）：**字号/颜色/间距/控件 + 交互路径**由 pr-review 第四步 hard-gate；**响应式移动端 + 空态视觉/长文截断**无下游 hard-gate，只由 frontend-checklist §三 develop 侧走查 + manual-test 真应用兜（§8 名点的真机视觉/品味，本就留人）。两档均非新增——本子计划**只重写 checklist 一件产物**，不动 pr-review/manual-test/integration 链路；develop 侧仅微调 checklist 引用措辞与报告名（frontend 非纯"测试品类报告"）。

---

## 3. 旧 11 段 → 新三段映射（无静默丢项，防 5cfdedb 类回退）

| 旧项 | 去向 |
|------|------|
| 一接口对接：无 any / union / 字段类型对齐 | **一·lint/type**（vue-tsc + no-any） |
| 一接口对接：分页起始页 | **二·可测逻辑** |
| 二状态管理（reset/持久化/多账户刷新） | **二·可测逻辑** |
| 三加载错误：loading 防重/finally/catch 透传 | 防重·finally→**二·可测**；catch 文案/白屏→**三·走查（渲染）** |
| 四空态边界：空态提示/长文截断 | **三·走查（视觉）** |
| 四空态边界：加载中不闪空态守卫 / 数字 0 不被误过滤 | **二·可测逻辑** |
| 五表单：validate() / submitting 防重 | **二·可测逻辑** |
| 五表单：删除确认弹窗 / 操作后刷新 | **三·走查（交互）**（integration/manual 兜） |
| 六事件监听：addEventListener 配对 / 具名函数 | **一·lint**（eslint-plugin-vue，未配则落三·走查） |
| 七响应式移动端（95vw/font≥16px/44px/单列降级） | **三·走查（视觉·真机）**（固定阈值如 font≥16px 配 stylelint 可上移一段） |
| 八 Element Plus 禁忌（inline-style/title/value 空） | **一·lint**（模板 lint，未配则落三·走查） |
| 九代码整洁（console.log/未用 import/废弃注释） | **一·lint**（同 backend） |
| 九代码整洁：类型提取复用 | **三·走查（冗余）** |
| 十冗余检查 | **三·走查（冗余·品味）** |
| 十一设计保真：硬编码字面值 | **一·lint**（stylelint 禁字面值——D2 核心赢面） |
| 十一设计保真：字号观感/控件尺寸/原型一致/新增视觉确认🚫 | **三·走查（视觉/交互）**（pr-review 第四步 + manual 兜） |

新三段：**一·归 lint/type-check（机械）｜二·可测逻辑（可测则测，不强制）｜三·留人走查（视觉/交互/冗余——测·lint 测不动）**。

---

## 4. 净收缩诚实账

- **删**：11 段 ~40 项「逐条挑刺审代码」清单 → 3 段；"逐条肉眼审代码"工作模式退场，换成"确认 lint/tsc 跑了 + 看真东西走查"。
- **frontend 净收缩 < backend**：视觉残量是**合法大头**（§3 可视区人是 validator），不像 backend 能把人压到 ~15%。这不是没做干净，是分区原则的必然——§9 窟窿2 的**降维不是清零**在 frontend 体现得最明显。
- **ADD**：无新检查器代码（lint/tsc/stylelint 是项目侧标准工具，非方法论新建）；wiring 仅措辞微调。本子计划是纯 prose 收缩 + 重组，最贴合 §2 判据的一块。
- **本方向至此收口**：sub1 地基 / sub2 不可视区 test / sub3+3b+3c Gate 重定义&§7 整段拔 / sub4 可视区收口——四子计划全落。loop 第二层（per-module 小循环）仍 parked。

---

## 5. 落地清单

1. 重写 `templates/checklists/frontend-checklist.md`（三段式 + 输出格式 + 诚实前提）。
2. 微调 `specs-execution/develop.md`：L195/L201 报告名 layer 化（frontend 出【前端自检报告】非"测试品类报告"）；L403 Checklist 列描述符更新。
3. 微调 `specs-structural/develop.md` L77 完成判据 frontend 描述符（lint/type + 可测逻辑 + 视觉留人）。
4. pr-review 不动（D3）。
5. 更新 task_plan / progress / STATUS。
