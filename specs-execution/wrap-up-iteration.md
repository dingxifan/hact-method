# exec: wrap-up-iteration

> CC 加载本文时，当前任务是执行迭代收尾三步：偏离对账 / feedback 审阅分流 / project.md 合并，完成后签 G5。
> 可与 deploy 并行执行，无强依赖。deploy 失败不阻断收尾，但 project.md 的"已上线"标注取决于部署结果。

**上下文密度**：中。读 backlog + feedback + project.md + 本期 PRD/TRD，不加载代码。

---

## 红线

- **偏离对账创建的 revise-doc 未完成不签 G5**：文档与实现不一致时不可关闭迭代
- **feedback 分流后必须清空 feedback.md**：分流不代表处理完，清空是确认所有条目已有去处
- **不在收尾阶段改方法论 / 公共模板**：feedback 中涉及编码规范 / checklist / 方法论的条目，誊进执行人个人 notes（打标签），由 harvest-notes 后续上提；本会话不直接改 hact-method 的 templates / skeleton / specs / 待议清单

---

> **步骤协议**：每步完成输出 `✅ [步骤] 完成：[2–3 句结论] → 下一步：[步骤] — [一句说明]` 后**直接继续**（非 🚫 步骤不问"继续？"、不等回应）；🚫 处必须停下等用户明确回应；⚖️ 处按既定规则默认判定，输出结论 + 理由后直接继续，用户可随时推翻（推翻则修正后再继续）。

---

## 会话启动

读任务包，确认 `version` 字段（如 `v1`）。

读以下文件：
- 项目根 `backlog.md`（扫描 `[偏离]` 条目数量）
- 项目根 `feedback.md`（扫描条目数量）
- 项目根 `project.md`（当前快照）
- `iterations/vN/prd.md` + `iterations/vN/trd.md`（本期最终版，用于第三步对照）

```
本次收尾：迭代 {version}
- backlog 中 [偏离] 条目：{N} 条
- feedback 条目：{M} 条
```

**选项列表**（G4 已满足，确认要做什么）：

```
{项目名} · G4 已签，验收已通过

可做的任务：
[1] wrap-up-iteration — 迭代收尾（偏离对账 / feedback 分流 / project.md 合并）← 主线
[2] deploy — 部署到目标环境（可与收尾并行，若尚未部署）

其他可做（输入「展开」/ 自由描述）：
- 先做 deploy 再做收尾
- 两者都做（先说哪个先）

请选 [1]、[2]，或输入「展开」，或直接说你要做什么。
```

🚫 等用户选择后再继续（⚖️ 例外：用户开场已明确表达主线意图——如直接说「收尾本迭代」——本列表跳过不出，播报一行后直接进入第一步）

用户选 [1] → 进入第一步（偏离对账）
用户选 [2] → 加载 deploy exec spec 执行，收尾任务保留在 queue 等待
用户说两个都要 → 询问顺序后按序执行

---

## 第一步：偏离对账

读 项目根 `backlog.md` 中所有 `[偏离]` 条目，逐条判断：

| 偏离影响范围 | 处理方式 |
|---|---|
| 影响接口或数据结构 | 创建 `revise-doc(target=trd)` 任务包，写入 `iterations/vN/queue/{task-id}.md` |
| 影响功能边界或用户行为 | 创建 `revise-doc(target=prd)` 任务包，写入 `iterations/vN/queue/{task-id}.md` |
| 仅影响实现细节 | 追加至 项目根 `decisions.md`（格式：`{日期} | {决策内容} | 原因：{偏离说明}`） |

写入 项目根 `decisions.md` 前先看活跃条目是否已超过 30 条，或最早条目所属迭代是否已过去 5 期以上；若触发阈值，先按文件头约定把纯历史/已取代条目归档到 `decisions-history.md`，再追加本次偏离决策。

**同期 `[偏离]` 超过 5 条** → 在 feedback.md 追加一条「本期 TRD 覆盖质量问题，待方法论讨论」，纳入第二步分流，不在此步展开。

> 此条 feedback 在第二步分流时按正常逻辑处理：归类为「方法论有问题」→ 誊入执行人个人 notes（标签 `[方法论]`），由 harvest-notes 后续进待议清单。不会重复创建，也不影响第一步已创建的 revise-doc 任务。

**无 `[偏离]` 条目** → 输出「无偏离，跳过第一步」，继续第二步。

```
✅ 偏离对账完成：{[偏离] N 条} → 创建 revise-doc {X} 个 / 记入 decisions.md {Y} 条 / 无偏离
→ 下一步：feedback 审阅分流
```

---

## 第二步：feedback 审阅分流

读 项目根 `feedback.md`，逐条分流：

| feedback 内容 | 目的地 | 操作 |
|---|---|---|
| 开发踩的坑、禁止事项、项目编码规范（原则级） | 执行人 hact-notes（标签 `[规范]`） | 誊入个人 notes，由 harvest-notes 后续上提公共层 |
| 某个验证动作被漏掉，独立审查 / 联调才发现（能写成 `[ ]` checkbox） | 执行人 hact-notes（标签 `[checklist]`） | 誊入个人 notes，由 harvest-notes 后续上提 |
| 角色工作流 / 规范结构 / 方法论有问题 | 执行人 hact-notes（标签 `[方法论]`） | 誊入个人 notes，由 harvest-notes 后续进待议清单 |
| 跨项目通用机制问题 | 执行人 hact-notes（标签 `[方法论]`） | 誊入个人 notes |
| 项目架构决策有遗漏 | 项目根 `decisions.md`（项目仓，不变） | 追加条目 |
| **本项目具体待办的功能/技术欠账**（非规范、非方法论：能力回归 / 无人认领的交集 / standards 声明在代码里无落地手段） | 项目根 `backlog.md`（`[欠账]`） | 追加条目；已在 backlog 则不重复。**不得因"已记过 feedback"就删** |
| 无价值 | 直接删除 | — |

> **`[规范]` vs `[checklist]` 判断标准**：feedback 是"以后写代码要遵守某规则"→ `[规范]`；feedback 是"以后自检时要专门核查这一项，否则容易漏"→ `[checklist]`。

**誊入个人 notes 的方式**：写入执行人自己的 notes 仓 `../hact-notes-{name}/notes.md`，打对应标签，条目格式示例：
```
[规范] {日期} | {内容} | 源：{项目名} {版本}
```
誊入后在 **notes 仓**（非 hact-method）commit + push——执行人对自己 notes 有写权限，全程不碰 hact-method。

> **归属**：誊入"产生该反馈的成员"的 notes。当前架构 / 开发 / 管理高度重叠场景下，即收尾执行人本人的 notes 仓（见边界场景"feedback 来自他人"）。

分流完成后**清空 项目根 `feedback.md`**（保留文件头，清空内容）。

```
✅ feedback 分流完成：誊入 notes {N} 条（[规范]{a}/[checklist]{b}/[方法论]{c}）/ decisions.md {M} 条 / backlog.md [欠账] {B} 条 / 删除 {X} 条。feedback.md 已清空。
→ 下一步：project.md 合并
```

> **compact 时机**：feedback 条目较多（>10 条）时，第二步完成后做一次 compact，再进入第三步。compact 前确认 feedback.md 已清空、decisions.md 已更新。

---

## 第三步：project.md 合并

对照本期最终 PRD + TRD，逐段核查 项目根 `project.md`：

- **产品层**（目标 / 用户 / 功能边界）与最终 PRD 一致
- **技术层**（技术选型 / 数据库结构 / 模块划分）与最终 TRD 一致
- **状态标注**：
  - 已部署 → 标记对应功能为「已上线」，去除「开发中」
  - 未部署（deploy 未完成或失败） → 标记「待部署」，不写「已上线」
  - 纯文档迭代（无部署） → 标注「本期无部署」

```
✅ project.md 合并完成：更新 {N} 处，状态标注为「{已上线/待部署/本期无部署}」。
→ 下一步：退役账核对
```

---

## 退役账核对

`grep -A3 '^supersedes:' iterations/vN/queue/*.md` 取本期非空条目（无需读任务包全文），逐条核对它在对应 PR description 的「退役账」里有结论：

| 结论 | 处置 |
|---|---|
| 已下线 | 通过 |
| 保留 + 解除条件 | 追加 项目根 `backlog.md` `[欠账]`（写明解除条件），下期可查 |
| 无结论 / 只写「已废弃」而实体仍在 | 当场补判：能删则记入 backlog `[欠账]` 待下期删；不能删则补写保留理由 |

全期 `supersedes` 均为空 → 输出「本期无退役账」，跳过。

> B 类（`b-queue/`）不过 G5，其退役账止于 develop 的 PR description，本步不覆盖；B 类积累多时由边界表的 cleanup task 一并扫 `b-queue/`。

```
✅ 退役账核对完成：{条目 N 条} → 已下线 {a} / 保留入账 {b} / 补判 {c}；或「本期无退役账」
→ 下一步：签 G5
```

---

**签 G5 前 · 完成判据核对**：`check-gate.js G5 vN` 核确定性判据（feedback.md 已清空、project.md 无"开发中"标注）——签字 commit 时门卫自动跑、红则拦 commit（偷签机制上做不到，同 PRD/plan-sprint，见 `../hact-method-lab/skeleton/06-gates.md` §7）。脚本 `🧑 留签字人确认` 段的语义残量（backlog `[偏离]` 是否处理得当、feedback 分流是否准确）由你这个 management 签字人确认。

（存量项目无 `scripts/check-gate.js` → 门卫 no-op 放行、退回 §7 G4/G5 段人工逐条核对兜底，并提示补铺，见 init-project Step 3。）

---

## 签 G5

三步全部完成（revise-doc 任务已全部完成）后：

```
迭代 {version} 收尾完成（偏离对账 ✅ / feedback 分流 ✅ / project.md 合并 ✅），要签 G5 吗？
```

🚫 等用户确认

用户确认后，在 `iterations/vN/gates.md` 写入 G5；**同步在项目根 `status.yml` 将 `iterations.vN.gates.G5` 改为 `{ signed: true, date: {YYYY-MM-DD} }`**（机器侧契约，见 `../hact-method-lab/skeleton/07-status-contract.md`）。执行：
```bash
git add iterations/vN/gates.md status.yml project.md decisions.md backlog.md feedback.md
git commit -m "chore: 迭代 {version} 收尾，G5 签署 [{项目名}]"
git push
```

```
✅ wrap-up-iteration 完成：G5 已签，迭代 {version} 正式闭环。
→ 下一步：可启动下一期 draft-prd-vN（若有规划）
```

---

## 边界与异常

| 场景 | 处理 |
|------|------|
| B 类任务长期运行，项目根积累大量 feedback | 参照 skeleton 的「清理项目积累」机制，建独立 cleanup task 跑这三步（偏离对账 / feedback 分流 / project.md 合并）但**不签 G5**（B 类无 Gate） |

---

## 上下文管理

**断点续做**：
1. 读 项目根 `feedback.md`：非空 → 第二步未完成；已清空 → 第二步已完成
2. 读 项目根 `backlog.md`：扫描 `[偏离]` 条目是否已处理（有无对应的 decisions.md 条目或 revise-doc 任务）
3. 读 项目根 `project.md`：有「开发中」标注 → 第三步未完成；无且有「已上线」/「待部署」→ 第三步已完成
4. 读 `iterations/vN/gates.md`：G5 已签 → 任务完成
5. 从第一个未完成的步骤继续
