# STATUS.md — hact-method

## 当前状态

当前候选状态更新于 2026-10-26；下述存量接入结果保持其原时间与证据边界。

- 当前阶段：**统一方法论入口与历史兼容收敛·本地候选验证及定向独审通过，未分发**。
- 当前计划：`_meta/plans/2026-10-26-unified-method-startup/task_plan.md`，与 `_meta/.current_plan` 保持一致。
- 本次基线：`e04aa858a8a43105f1a50c4388a3a5d29d0e3099`。默认目标统一为官方 Accepted main，SHA 保留实际安装与审查追溯；自动试升级由 Codex 主线在隔离候选中执行，冲突/失败停止。
- 本轮按用户裁决改为“新规则面向未来、历史原貌兼容接续”；不要求全项目历史进入当前 schema。解析与累计范围检查修复已通过合成回归；定向独审在修复 tree `970f43c068a6b5d097dc4a0a73a6f913e00854f2` 关闭本候选 UPGRADE-COMPAT-F001。真实项目固定对象尚未取得，原 METHOD-UPGRADE-F001 未关闭。未分发项目、push 或 merge。

## 已有结果与限制

方法基础、当前版收敛、存量接入与文档 Task 收口在原状态中记为完成；真实项目试行仍待开始。

2026-09-25 阶段采用过 current-only Core 与一次性 normalization 边界；本轮以未来规则及必要安装接入取代全面归一化要求，不改写当时证据。文档 Task 的 task-specific completion checker、immutable review chain 与 TRD 非表技术载体继续保留；当前动作身份歧义仍须核查，无关历史重复 ID 不阻断安装。原阶段候选 `4ec849f` 的记录为 23 fixtures、45 JS/CJS syntax checks、路径/入口/diff 检查通过，Fresh Targeted Re-review 关闭 B001–B004、无新阻断；这些是当时的验证结论，不代表后续任意候选或项目采用通过。

原阶段记录“尚未 push、分发或运行真实项目试点”只描述当时状态；后续 repository delivery 以实际 Git 为准，不据此改写历史。当前入口只使用 `tasks/`、`protocols/`、模板及项目检查器，不从旧 specs、旧模型档位或迁移故事推导执行要求。

## 未完成工作与下一步

- 真实旧项目试点：由用户明确选择项目并授权；按 `guide/08-旧项目全面接入新版.md` 先只读 inventory/plan，再分别处理应用、集成和远端交付授权。其他项目不自动升级。
- 试点需核文件所有权冲突、历史重复 Task ID、跨窗口交接、重复比对、人工介入、机械修正、审查检出与返工；只有真实端到端样本才能支持“旧项目全面适用”及流畅度改善结论。
- Codex 长程、压缩恢复、UX 与跨环境协作的真实项目效果仍需实际样本；结构、Git 恢复和虚构原型不能替代。
- 原状态中的 check-conn/门卫存量仓分发仍为用户押后的事项，未在本次整理中执行；实际采用前逐仓核现状，不依赖旧机器的 hook 或副本清单。

以下保留各批历史记录的追溯入口，不作为当前工作必读内容。

完整历史见 `_meta/status-history.md`；本次移出的批次、拓扑、风险旧快照及里程碑可按需查[固定基线 STATUS](https://github.com/dingxifan/hact-method/blob/9d6bc0ae8dbfdd34fa5cd4e7d759e3ee90f83c5c/STATUS.md)。不重写旧记录，不要求每轮续写历史索引。
