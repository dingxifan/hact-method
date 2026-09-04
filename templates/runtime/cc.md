# 运行时映射：Claude Code

> 本文仅说明如何实现 `interfaces.md` 的能力，不能改变共同产物、质量阈值或阻断规则。

| 中立能力 | Claude Code 实现 |
|---|---|
| 隔离审查单元 | 建立全新审查上下文，只给 review brief、任务标识和权威文件路径；不得转述执行方自评。纯审查可使用团队约定的低成本档位，安全敏感或地基任务使用默认高能力档位。 |
| 隔离执行单元 / 只读调查单元 | 仅在任务或适用规则明确授权时，派独立工作单元；写操作必须遵守共享资产边界。 |
| 浏览器场景执行 | 读取共同场景定义 `integration-tests/frontend/vN-scenarios.md`，使用项目已有的浏览器自动化能力编译并执行；团队默认入口为 `pinchtab`。脚本是运行时派生物，结果写共同报告，证据统一落 `integration-tests/evidence/vN/{场景-id}/`。无可用工具时按中立预检标记阻断并写未运行原因。 |
| 远端命令通道 | 使用团队配置的 SSH/MCP 通道；无通道时部署阻断。 |
| 代码托管操作 | 使用 `/gitee-ops`；禁止 `gh`。 |
| 验证循环 | 使用已有的 `verification-loop` 约定，并保留检查器与证据。 |

## 项目初始化映射

- 复制 `templates/CLAUDE.md` 到项目根 `CLAUDE.md`，替换项目占位符；它只作为薄入口引用共同启动协议。
- 复制 `templates/.claude/commands/gitee-ops.md` 到 `.claude/commands/gitee-ops.md`。
- 目标路径已有文件时只报告差异，不覆盖项目存量配置。

入口通过 `@` 先加载本文，再执行共同启动协议；`task.type` 确定后才执行共同预检。运行时实现变化只修改本文，不修改任务包、状态或 Gate。
