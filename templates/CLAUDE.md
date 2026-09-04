# {项目名}

## 项目说明

{一句话描述项目用途}

## 运行时

本会话运行于 **Claude Code**。开始任何项目工作前，按下列执行顺序加载：

@../hact-method-lab/templates/runtime/cc.md
@../hact-method-lab/templates/boot-protocol.md
@../hact-method-lab/templates/runtime/preflight.md

先按共同启动协议同步、推断 `task.type` 并加载单份任务规范；再只预检该任务实际需要的能力，通过后才执行任务。

执行规范中的中立能力词汇按 `runtime/cc.md` 落地。不得把运行时、模型或工具细节写进任务包、`status.yml` 或 Gate。
