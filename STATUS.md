# STATUS.md — hact-method

## 当前状态

以下状态记录截至 2026-09-25，不由本次文档整理推导新的项目验收结论。

- 当前阶段：**存量接入与文档 Task 收口·已实现待真实项目试点**。
- 原状态更新：2026-09-25。
- 当前计划：`_meta/plans/2026-09-25-legacy-adoption-and-document-closeout/task_plan.md`，与 `_meta/.current_plan` 保持一致。
- 该阶段固定基线：commit `a9bcde43a5ce8b2ee95c63b0fabc1fe0ff563c58` / tree `620f36f83132c661f5a74cf6ca4c788af67257f8`，不是当前仓库 HEAD 的声明。

## 已有结果与限制

方法基础、当前版收敛、存量接入与文档 Task 收口在原状态中记为完成；真实项目试行仍待开始。

存量接入保持 current-only Core：一次性 normalization、文件所有权策略及独立迁移审查置于 Core 前；文档 Task 使用 task-specific completion checker 与 immutable document review chain；重复 Task ID fail closed，TRD 支持非表技术载体。原阶段候选 `4ec849f` 的记录为 23 fixtures、45 JS/CJS syntax checks、路径/入口/diff 检查通过，Fresh Targeted Re-review 关闭 B001–B004、无新阻断；这些是当时的验证结论，不代表后续任意候选或项目采用通过。

原阶段记录“尚未 push、分发或运行真实项目试点”只描述当时状态；后续 repository delivery 以实际 Git 为准，不据此改写历史。当前入口只使用 `tasks/`、`protocols/`、模板及项目检查器，不从旧 specs、旧模型档位或迁移故事推导执行要求。

## 未完成工作与下一步

- 真实旧项目试点：由用户明确选择项目并授权；按 `guide/08-旧项目全面接入新版.md` 先只读 inventory/plan，再分别处理应用、集成和远端交付授权。其他项目不自动升级。
- 试点需核文件所有权冲突、历史重复 Task ID、跨窗口交接、重复比对、人工介入、机械修正、审查检出与返工；只有真实端到端样本才能支持“旧项目全面适用”及流畅度改善结论。
- Codex 长程、压缩恢复、UX 与跨环境协作的真实项目效果仍需实际样本；结构、Git 恢复和虚构原型不能替代。
- 原状态中的 check-conn/门卫存量仓分发仍为用户押后的事项，未在本次整理中执行；实际采用前逐仓核现状，不依赖旧机器的 hook 或副本清单。

以下保留各批历史记录的追溯入口，不作为当前工作必读内容。

完整历史见 `_meta/status-history.md`；本次移出的批次、拓扑、风险旧快照及里程碑可按需查[固定基线 STATUS](https://github.com/dingxifan/hact-method/blob/9d6bc0ae8dbfdd34fa5cd4e7d759e3ee90f83c5c/STATUS.md)。不重写旧记录，不要求每轮续写历史索引。
