# 双运行时交接验收

## 自动交接契约夹具

矩阵由 `_meta/fixtures/runtime-handoff/matrix.json` 固定：

| 场景 | 规划 | 实施 | 审查 |
|---|---|---|---|
| A | CC | CC | CC |
| B | Codex | Codex | Codex |
| C | CC | CC | Codex |
| D | Codex | CC | CC |

运行 `node _meta/scripts/check-runtime-handoff.js`，读取 A/B/C/D 四份独立场景产物夹具并机械确认：

1. 四种分工均存在且角色组合正确。
2. `status.yml`、任务包和 Gate 模板没有运行时字段，`generated_by` 保持 `hact-method`。
3. 两个薄入口引用同一共同启动协议，且共同协议仍有 13 种任务路由。
4. 场景变化只进入 `runtime_context`；任务包、状态、Gate、审查结论的规范化哈希一致。
5. 夹具字段仍由当前任务包/status/Gate/review 模板提供契约锚；把任一场景的 G3 变异后哈希必须不同，防止比较器自证恒等。

2026-09-04 最终加固后运行结果：✅ 通过。四场景分别使用 schema-complete 独立夹具，对应哈希均为 task-package `64a6fd714621`、status `f6a3755e67b0`、gates `0606408d1df1`、review-conclusion `c9c9aaee4f08`；单场景 Gate 漂移、任务包缺 `files`、status 缺 `review_report_dir` 变异均被主校验拒绝。

## 真实试点边界

本仓契约夹具证明的是**四份独立产物在共同 schema 下不分叉，且比较器能发现变异**，不证明两个外部运行时在团队账号、插件、浏览器和远端权限下都已实机跑通。真实验收需要选一个非生产试点项目，让 CC 与 Codex 至少各启动一次，并完成 C 或 D 的一次跨运行时交接；只复用仓库文件，不转述聊天记忆。试点结果回填本文件，未跑前不得写“实机双运行时已验证”。
