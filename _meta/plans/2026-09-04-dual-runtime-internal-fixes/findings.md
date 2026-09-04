# Findings：双运行时内部漏洞修复

## 独立审查输入

总体结论：`block`。

- S0：中立 develop 残留 CC 专属代码托管命令与模型词。
- S1：启动状态机断路、TRD 独审冲突、批次累积 diff、共享资产执行就绪缺口、B 类契约绕过、V0 ledger 未闭合可过、固定 diff 假证据可过。
- S2：handoff 同源 canonical、hook 假 available、初始化/迁移断层、浏览器证据无共同落盘契约。

修复以权威正文、机械反例和真实临时 Git 仓为准，不以实施者或原审查摘要代替证据。

## 修复映射

| 原 finding | 修复 |
|---|---|
| develop 专属命令/模型词 | 中立正文改用代码托管操作与能力档；中立扫描加入任务包、`/gitee-ops`、sonnet、默认模型、SSH MCP 反向词 |
| G1→G3 断路 | 共同启动补 13 条状态信号矩阵；UX 三件套完整性入路由；独立 JSON 矩阵 + 变异检查 |
| TRD 独审冲突 | Step 5 与隔离单元汇总统一为重派一次后 blocked；中立检查加冲突语义哨兵 |
| 批次累积 diff | freshness 改为每任务临执行取 base tree；审计重算实际 changed files 并拒绝超出任务包 files |
| asset-writes 抢跑 | 新增 `check-sprint --ready`，外部依赖必须 merged、同批依赖必须拓扑在前；规范禁止 stacked 绕过 |
| B 类契约绕过 | 删除纯加法 schema 遗留口径；`check-b-task --diff` 对真实 Git diff 核文件集、契约路径与导出 type/enum/API/DDL 信号；独审必读 contract-impact/asset-writes |
| V0 ledger 假关闭 | 账本 6→8 列，新增 `open/closed/blocked` 与闭合证据；非 closed、未来动作或无锚均 FAIL |
| 固定 diff 假 SHA | `check-sprint --review` 要求真实 commit/tree，重算 `git diff --binary` SHA-256 与 changed files，并跟踪 open blocking finding 闭合链；夹具改用真实临时 Git 仓 |
| handoff 恒等 canonical | A/B/C/D 改为四份独立产物夹具，绑定当前模板契约锚并加入 Gate 变异测试；明确它仍不是外部运行时实测 |
| hook 假 available | 仅认可真实命令行委托；注释不算；POSIX 核执行位；模板缺失降级；补负向夹具 |
| 初始化/迁移断层 | 新项目默认执行两份运行时初始化映射；新增 `check-runtime-project` 只读诊断；指南改为双运行时，存量仍逐仓授权且不覆盖 |
| 浏览器证据无共同契约 | 固定 `integration-tests/evidence/vN/{场景-id}/`；结果模板增证据/未运行原因；新 checker + hook 路由机械核文件存在 |
