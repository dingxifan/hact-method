# 运行时映射：Codex（GPT-5.6）

> 本文仅说明如何实现 `interfaces.md` 的能力，不能改变共同产物、质量阈值或阻断规则。项目入口 `AGENTS.md` 先加载本文，再执行共同启动协议；`task.type` 确定后才执行共同预检。

## 模型与上下文策略

- 跨文档语义收敛、V0 as-built 对账、规范一致性审计和高风险裁决：优先 GPT-5.6 的高能力档位；可扩读相关权威资料，但先建立范围和证据账本。
- 单个任务实现：按任务包、引用行和相关规范精读；不因可用长上下文而预加载整仓。
- 独立审查、只读盘点和机械核验：按风险选择较低成本的 GPT-5.6 档位；安全敏感、foundation 或证据冲突时升至高能力档位。
- 长输出不是默认报告长度。输出应压缩为任务包、证据账本、审查报告和明确的未运行项。

## 能力映射

| 中立能力 | Codex 实现 |
|---|---|
| 隔离审查单元 | 使用 Codex 原生独立子代理/会话；普通风险选 `hact-reviewer`，安全敏感、foundation 或证据冲突选 `hact-sensitive-reviewer`。只提供 review brief、任务标识和权威文件位置，审查单元自行读取。无法提供隔离上下文时标记 `blocked`，不得同会话替代。 |
| 隔离执行单元 / 只读调查单元 | 仅在任务或适用 `AGENTS.md` 规则明确授权时使用原生子代理。只读盘点选 `hact-researcher`；边界明确的实现选 `hact-worker`。只读工作可并行；共享资产写入不得并行。 |
| 浏览器场景执行 | 读取共同场景定义 `integration-tests/frontend/vN-scenarios.md`，用项目可用的浏览器自动化或浏览器 MCP 编译并执行；脚本是运行时派生物，结果写共同报告，证据统一落 `integration-tests/evidence/vN/{场景-id}/`。没有可用能力时不声称场景通过，写明未运行原因。 |
| 远端命令通道 | 使用经项目批准的 SSH/MCP 或命令通道；缺失时部署阻断。 |
| 代码托管操作 | 自读项目 `.claude/commands/gitee-ops.md` 中的 Gitee API 契约并执行等价命令；该文件是跨运行时共享的托管操作说明，不要求 Codex 具有 slash-command 机制。禁止 `gh`。 |
| 纪律强制机制 | 以固定审查快照、检查器输出和可追溯报告为准；代理活动本身不是审查证据。 |

项目级角色模板位于 `.codex/agents/*.toml`。它们只预设角色、模型和指令，不能绕开本文的共享资产边界或独立审查要求。若当前 Codex 不支持某个模型或配置项，预检必须报告并选择已验证的同级替代；不得静默换档。

## 项目初始化映射

- 复制 `templates/AGENTS.md` 到项目根 `AGENTS.md`，替换项目占位符；它只作为薄入口引用共同启动协议。
- 创建 `.codex/agents/`，复制 `templates/.codex/agents/{researcher,worker,reviewer,sensitive_reviewer}.toml`。
- 目标路径已有文件时只报告差异，不覆盖项目存量配置。
