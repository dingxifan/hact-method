# Codex Adapter for hact-method

> 本目录是 hact-method 的 Codex 适配层实验区。
> 它不修改现有 Claude Code 方法主体，只定义 CC 与 Codex 混合运行时的分工、交接包和短上下文协议。

## 目标

让 hact-method 可以在两类执行端之间协同：

- Claude Code 继续承担长上下文、长对话、语义收敛和 Gate 编排。
- Codex 承担边界清晰、可文件化、可验证的执行任务。

本适配层的目标不是替换 Claude Code，而是把部分工作从「长上下文连续会话」改造成「短上下文、强文件输入、可重复验证」的执行单元。

## 不做什么

第一阶段不改动以下目录：

- `skeleton/`
- `specs-structural/`
- `specs-execution/`
- `templates/`
- `guide/`

这些仍然是当前 Claude Code 版方法论的权威来源。Codex 适配层只在本目录内试验，待试点验证后再决定是否回填正式方法论。

## 初始文件

| 文件 | 用途 |
|------|------|
| `task-routing-matrix.md` | 定义每类 task 推荐由 CC、Codex 或二者混合执行 |
| `context-strategy.md` | 定义 Codex 短上下文运行策略 |
| `handoff/develop-handoff.md` | 定义 CC 将 develop 任务交给 Codex 时必须提供的交接包 |

## 设计原则

1. **不靠聊天记忆交接**：交接必须落成文件或明确路径。
2. **不让 Codex 猜上游语义**：Codex 只执行已收敛、边界清楚的任务。
3. **权威来源优先**：任务包、PRD/TRD 行号、standards 章节、diff、测试结果优先于执行者口头总结。
4. **短上下文优先**：Codex 不默认加载整份长规范，而是按任务包精确读取必要片段。
5. **可验证优先**：能用脚本、测试、`rg` 检查的，不交给模型记忆。

## 推荐试点顺序

1. 方法论仓结构化修改：验证 Codex 对 hact-method 文件体系的局部编辑能力。
2. 独立审查：验证 Codex 是否能只凭权威原文发现问题。
3. 单个 develop 任务：验证 Codex 是否能按任务包完成代码实现、测试和状态回写。

## 当前状态

本目录处于草案阶段。所有文件均为讨论稿，尚未接入正式执行规范。
