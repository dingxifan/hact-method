# exec: wrap-up-iteration

> CC 加载本文时，当前任务是执行迭代收尾三步：偏离对账 / feedback 审阅分流 / project.md 合并，完成后签 G5。
> 可与 deploy 并行执行，无强依赖。deploy 失败不阻断收尾，但 project.md 的"已上线"标注取决于部署结果。

**上下文密度**：中。读 backlog + feedback + project.md + 本期 PRD/TRD，不加载代码。

---

## 红线

- **偏离对账创建的 revise-doc 未完成不签 G5**：文档与实现不一致时不可关闭迭代
- **feedback 分流后必须清空 feedback.md**：分流不代表处理完，清空是确认所有条目已有去处
- **方法论文件不在收尾阶段改**：feedback 中涉及角色工作流 / 规范结构的问题，只记录待议，不在本会话改 hact-method 文件

---

## 步骤追踪协议

每步完成后输出：
```
✅ [步骤名] 完成：[2–3 句结论]
→ 下一步：[步骤名] — [一句说明]
继续？
```
🚫 标记处必须等用户明确回应后才继续。

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
继续？
```

🚫 等用户确认

---

## 第一步：偏离对账

读 `backlog.md` 中所有 `[偏离]` 条目，逐条判断：

| 偏离影响范围 | 处理方式 |
|---|---|
| 影响接口或数据结构 | 创建 `revise-doc(target=trd)` 任务包，写入 `queue/{task-id}.md` |
| 影响功能边界或用户行为 | 创建 `revise-doc(target=prd)` 任务包，写入 `queue/{task-id}.md` |
| 仅影响实现细节 | 追加至 `decisions.md`（格式：`{日期} | {决策内容} | 原因：{偏离说明}`） |

**同期 `[偏离]` 超过 5 条** → 在 feedback.md 追加一条「本期 TRD 覆盖质量问题，待方法论讨论」，纳入第二步分流，不在此步展开。

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
| 开发踩的坑、禁止事项、项目编码规范 | `templates/standards/{backend\|frontend}.md`（项目模板层） | 直接追加至对应文件 |
| 项目架构决策有遗漏 | `decisions.md` | 追加条目 |
| 角色工作流 / 规范结构 / 方法论有问题 | 待议清单（见下方） | 记录，不在此处修改方法论文件 |
| 跨项目通用机制问题 | 待议清单（见下方） | 记录 |
| 无价值 | 直接删除 | — |

**待议清单写入方式**：在 `_meta/plans/` 下找现有的方法论讨论计划文件（如果没有，新建 `_meta/plans/方法论待议.md`），追加条目：
```markdown
- [ ] {日期} | {问题描述} | 来源：{项目名} {版本} feedback
```

分流完成后**清空 `feedback.md`**（保留文件头，清空内容）。

```
✅ feedback 分流完成：模板更新 {N} 条 / decisions.md {M} 条 / 待议 {K} 条 / 删除 {X} 条。feedback.md 已清空。
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

## 签 G5

三步全部完成（revise-doc 任务已全部完成）后：

```
迭代 {version} 收尾完成（偏离对账 ✅ / feedback 分流 ✅ / project.md 合并 ✅），要签 G5 吗？
```

🚫 等用户确认

用户确认后，在 `iterations/vN/gates.md` 写入 G5，执行：
```bash
git add iterations/vN/gates.md project.md decisions.md backlog.md feedback.md
git commit -m "chore: 迭代 {version} 收尾，G5 签署 [{项目名}]"
```

```
✅ wrap-up-iteration 完成：G5 已签，迭代 {version} 正式闭环。
→ 下一步：可启动下一期 draft-prd-vN（若有规划）
```

---

## 上下文管理

**断点续做**：
1. 读 `feedback.md`：非空 → 第二步未完成；已清空 → 第二步已完成
2. 读 `backlog.md`：扫描 `[偏离]` 条目是否已处理（有无对应的 decisions.md 条目或 revise-doc 任务）
3. 读 `project.md`：有「开发中」标注 → 第三步未完成；无且有「已上线」/「待部署」→ 第三步已完成
4. 读 `iterations/vN/gates.md`：G5 已签 → 任务完成
5. 从第一个未完成的步骤继续
