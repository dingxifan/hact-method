# {项目名}

## 项目说明

{一句话描述项目用途}

## 运行时

本会话运行于 **Codex**。开始任何项目工作前，按顺序完整读取并执行：

1. `../hact-method-lab/templates/runtime/codex.md`：加载能力实现映射。
2. `../hact-method-lab/templates/boot-protocol.md`：同步并推断 `task.type`、加载单份任务规范。
3. `../hact-method-lab/templates/runtime/preflight.md`：只协商该任务实际需要的能力，通过后才执行任务。

执行规范中的中立能力词汇按 `runtime/codex.md` 落地。不得把运行时、模型或工具细节写进任务包、`status.yml` 或 Gate。

项目已播种的 Codex 角色位于 `.codex/agents/`：只读调查用 `hact-researcher`，边界明确的实现用 `hact-worker`，普通独审用 `hact-reviewer`，安全敏感或 foundation 独审用 `hact-sensitive-reviewer`。只有任务或适用规则明确授权时才委派；共享资产写入不得并行。
