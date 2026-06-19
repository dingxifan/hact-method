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

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

读任务包，确认 `version` 字段（如 `v1`）。

读以下文件：
- `backlog.md`（扫描 `[偏离]` 条目数量）
- `feedback.md`（扫描条目数量）
- `project.md`（当前快照）
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

🚫 等用户选择后再继续

用户选 [1] → 进入第一步（偏离对账）
用户选 [2] → 加载 deploy exec spec 执行，收尾任务保留在 queue 等待
用户说两个都要 → 询问顺序后按序执行

---

## 第一步：偏离对账

读 `backlog.md` 中所有 `[偏离]` 条目，逐条判断：

| 偏离影响范围 | 处理方式 |
|---|---|
| 影响接口或数据结构 | 创建 `revise-doc(target=trd)` 任务包，写入 `iterations/vN/queue/{task-id}.md` |
| 影响功能边界或用户行为 | 创建 `revise-doc(target=prd)` 任务包，写入 `iterations/vN/queue/{task-id}.md` |
| 仅影响实现细节 | 追加至 `decisions.md`（格式：`{日期} | {决策内容} | 原因：{偏离说明}`） |

**同期 `[偏离]` 超过 5 条** → 在 feedback.md 追加一条「本期 TRD 覆盖质量问题，待方法论讨论」，纳入第二步分流，不在此步展开。

> 此条 feedback 在第二步分流时按正常逻辑处理：归类为「方法论有问题」→ 誊入执行人个人 notes（标签 `[方法论]`），由 harvest-notes 后续进待议清单。不会重复创建，也不影响第一步已创建的 revise-doc 任务。

**无 `[偏离]` 条目** → 输出「无偏离，跳过第一步」，继续第二步。

```
✅ 偏离对账完成：{[偏离] N 条} → 创建 revise-doc {X} 个 / 记入 decisions.md {Y} 条 / 无偏离
→ 下一步：feedback 审阅分流
继续？
```

> **注意**：若创建了 revise-doc 任务，需等 revise-doc 全部完成后才能签 G5。

---

## 第二步：feedback 审阅分流

读 `feedback.md`，逐条分流：

| feedback 内容 | 目的地 | 操作 |
|---|---|---|
| 开发踩的坑、禁止事项、项目编码规范（原则级） | 执行人 hact-notes（标签 `[规范]`） | 誊入个人 notes，由 harvest-notes 后续上提公共层 |
| 某个验证动作被漏掉，code review 才发现（能写成 `[ ]` checkbox） | 执行人 hact-notes（标签 `[checklist]`） | 誊入个人 notes，由 harvest-notes 后续上提 |
| 角色工作流 / 规范结构 / 方法论有问题 | 执行人 hact-notes（标签 `[方法论]`） | 誊入个人 notes，由 harvest-notes 后续进待议清单 |
| 跨项目通用机制问题 | 执行人 hact-notes（标签 `[方法论]`） | 誊入个人 notes |
| 项目架构决策有遗漏 | `decisions.md`（项目仓，不变） | 追加条目 |
| 无价值 | 直接删除 | — |

> **`[规范]` vs `[checklist]` 判断标准**：feedback 是"以后写代码要遵守某规则"→ `[规范]`；feedback 是"以后自检时要专门核查这一项，否则容易漏"→ `[checklist]`。

**誊入个人 notes 的方式**：写入执行人自己的 notes 仓 `../hact-notes-{name}/notes.md`，打对应标签，条目格式示例：
```
[规范] {日期} | {内容} | 源：{项目名} {版本}
```
誊入后在 **notes 仓**（非 hact-method）commit + push——执行人对自己 notes 有写权限，全程不碰 hact-method。

> **归属**：誊入"产生该反馈的成员"的 notes。当前架构 / 开发 / 管理高度重叠场景下，即收尾执行人本人的 notes 仓（见边界场景"feedback 来自他人"）。

分流完成后**清空 `feedback.md`**（保留文件头，清空内容）。

```
✅ feedback 分流完成：誊入 notes {N} 条（[规范]{a}/[checklist]{b}/[方法论]{c}）/ decisions.md {M} 条 / 删除 {X} 条。feedback.md 已清空。
→ 下一步：project.md 合并
继续？
```

> **compact 时机**：feedback 条目较多（>10 条）时，第二步完成后做一次 compact，再进入第三步。compact 前确认 feedback.md 已清空、decisions.md 已更新。

---

## 第三步：project.md 合并

对照本期最终 PRD + TRD，逐段核查 `project.md`：

- **产品层**（目标 / 用户 / 功能边界）与最终 PRD 一致
- **技术层**（技术选型 / 数据库结构 / 模块划分）与最终 TRD 一致
- **状态标注**：
  - 已部署 → 标记对应功能为「已上线」，去除「开发中」
  - 未部署（deploy 未完成或失败） → 标记「待部署」，不写「已上线」
  - 纯文档迭代（无部署） → 标注「本期无部署」

```
✅ project.md 合并完成：更新 {N} 处，状态标注为「{已上线/待部署/本期无部署}」。
→ 下一步：签 G5
继续？
```

---

## 签 G5 前 · 完成判据核对

执行 `../hact-method/skeleton/06-gates.md` §7「完成判据核对」**G4/G5 段**，`Gate=G5`。在项目仓根目录跑 `node scripts/check-gate.js G5 vN`：退出码 0 = 确定性判据（feedback.md 已清空、project.md 无"开发中"标注）全过；退出码 1 → 按报告逐条修后重跑到 0，不得手改报告。脚本 `🧑 留签字人确认` 段列出的语义残量（backlog `[偏离]` 是否处理得当、feedback 分流是否准确）由你这个 management 签字人确认。

（存量项目无 `scripts/check-gate.js` → 退回 §7「G3」段的 subagent 冷核协议兜底，并提示补铺。）

---

## 签 G5

三步全部完成（revise-doc 任务已全部完成）后：

```
迭代 {version} 收尾完成（偏离对账 ✅ / feedback 分流 ✅ / project.md 合并 ✅），要签 G5 吗？
```

🚫 等用户确认

用户确认后，在 `iterations/vN/gates.md` 写入 G5；**同步在项目根 `status.yml` 将 `iterations.vN.gates.G5` 改为 `{ signed: true, date: {YYYY-MM-DD} }`**（机器侧契约，见 `../hact-method/skeleton/07-status-contract.md`）。执行：
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
1. 读 `feedback.md`：非空 → 第二步未完成；已清空 → 第二步已完成
2. 读 `backlog.md`：扫描 `[偏离]` 条目是否已处理（有无对应的 decisions.md 条目或 revise-doc 任务）
3. 读 `project.md`：有「开发中」标注 → 第三步未完成；无且有「已上线」/「待部署」→ 第三步已完成
4. 读 `iterations/vN/gates.md`：G5 已签 → 任务完成
5. 从第一个未完成的步骤继续
