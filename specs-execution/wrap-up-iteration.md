# exec: wrap-up-iteration

> CC 加载本文时，当前任务是执行迭代收尾三步：偏离对账 / feedback 审阅分流 / project.md 合并，完成后签 G5。
> 可与 deploy 并行执行，无强依赖。

**上下文密度**：中。读 backlog + feedback + project.md + 本期 PRD/TRD，不加载代码。

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
- `backlog.md`（找 `[偏离]` 条目）
- `feedback.md`（全量读）
- `project.md`（快照）
- `iterations/vN/prd.md` + `trd.md`（本期最终版）

---

## 第一步：偏离对账

读 `backlog.md` 中所有 `[偏离]` 条目，逐条判断：

| 偏离影响范围 | 处理方式 |
|---|---|
| 影响接口或数据结构 | 创建 `revise-doc(target=trd)` 任务包，写入 queue |
| 影响功能边界或用户行为 | 创建 `revise-doc(target=prd)` 任务包，写入 queue |
| 仅影响实现细节 | 写入 `decisions.md`，追加条目 |

**无 `[偏离]` 条目** → 直接输出「无偏离，跳过第一步」，继续第二步。

> **注意**：偏离对账创建的 revise-doc 任务必须完成后才能签 G5。不跳过。

```
✅ 偏离对账完成：[偏离 N 条，创建 revise-doc X 个 / 记入 decisions.md Y 条 / 无偏离]
→ 下一步：feedback 审阅分流
继续？
```

---

## 第二步：feedback 审阅分流

读 `feedback.md`，逐条按规则分流：

| feedback 内容 | 目的地 |
|---|---|
| 开发踩的坑、禁止事项 | 追加至 `templates/standards/{backend\|frontend}.md` |
| 角色工作流 / 规范有问题 | 记入 `_meta/plans/` 待议清单（`_meta/plans/方法论待议.md`），不在收尾阶段改方法论 |
| 项目架构决策有遗漏 | 追加至 `decisions.md` |
| 跨项目通用机制问题 | 记入 `_meta/plans/方法论待议.md` |
| 无价值 | 删除，不记录 |

分流完成后**清空 `feedback.md`**（保留文件，清空内容）。

```
✅ feedback 分流完成：[模板更新 N 条 / 决策记录 M 条 / 待议 K 条 / 删除 X 条]。feedback.md 已清空。
→ 下一步：project.md 合并
继续？
```

---

## 第三步：project.md 合并

对照本期最终 PRD + TRD，逐段核查 `project.md`：

- 产品层（目标 / 用户 / 功能边界）与最终 PRD 一致
- 技术层（技术选型 / 数据库结构 / 模块划分）与最终 TRD 一致
- 移除所有"开发中"标注
- 若已部署：标记对应功能为"已上线"；若未部署：标注"待部署"

```
✅ project.md 合并完成：更新了 {N} 处，[已标注已上线 / 标注待部署]。
→ 下一步：签 G5
继续？
```

---

## 签 G5

三步全部完成后：
```
迭代 {version} 已收尾（偏离对账 ✅ / feedback 分流 ✅ / project.md 合并 ✅），要签 G5 吗？
```

🚫 等用户确认

用户确认后：在 `iterations/vN/gates.md` 写入 G5，commit。

```
✅ wrap-up-iteration 完成：G5 已签，迭代 {version} 正式闭环。
→ 下一步：可启动下一期 draft-prd-vN（若有）
```

---

## 上下文管理

**中断续做**：
1. 读 `backlog.md` 确认 `[偏离]` 是否已全部处理（创建了 revise-doc 或记入 decisions.md）
2. 读 `feedback.md` 确认是否已清空（若非空则第二步未完成）
3. 读 `project.md` 确认是否已移除"开发中"标注
4. 读 `gates.md` 确认 G5 是否已签
5. 从第一个未完成的步骤继续
