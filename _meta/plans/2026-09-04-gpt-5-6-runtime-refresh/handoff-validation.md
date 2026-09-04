# 双运行时交接验收

## 自动协议演练

矩阵由 `_meta/fixtures/runtime-handoff/matrix.json` 固定：

| 场景 | 规划 | 实施 | 审查 |
|---|---|---|---|
| A | CC | CC | CC |
| B | Codex | Codex | Codex |
| C | CC | CC | Codex |
| D | Codex | CC | CC |

运行 `node _meta/scripts/check-runtime-handoff.js`，机械确认：

1. 四种分工均存在且角色组合正确。
2. `status.yml`、任务包和 Gate 模板没有运行时字段，`generated_by` 保持 `hact-method`。
3. 两个薄入口引用同一共同启动协议，且共同协议仍有 13 种任务路由。
4. 场景变化只进入 progress / review report 的可选出处；任务包、状态、Gate、审查结论的规范化哈希一致。

2026-09-04 运行结果：✅ 通过。四场景对应哈希均为 task-package `373a1bfcdf25`、status `82e248b558fb`、gates `924a85bf098f`、review-conclusion `587dd3f7a7f8`。

## 真实试点边界

本仓自动演练证明的是**协议与模板不分叉**，不证明两个外部运行时在团队账号、插件、浏览器和远端权限下都已实机跑通。真实验收需要选一个非生产试点项目，让 CC 与 Codex 至少各启动一次，并完成 C 或 D 的一次跨运行时交接；只复用仓库文件，不转述聊天记忆。试点结果回填本文件，未跑前不得写“实机双运行时已验证”。
