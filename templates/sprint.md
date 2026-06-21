<!--
  sprint.md 模板 · plan-sprint 产物 · 存 iterations/vN/sprint.md · live 引用（不入项目仓）
  人看的汇总视图（机器侧状态以项目根 status.yml 为准）。每行对应 queue/ 里一个任务包。
  填写：替换 {占位}；状态初始全 [可取]，PR 列初始全 —；交付列 串行/可并行 取自 plan-sprint Step 2.5 判断。
  多迭代并行时各迭代各写自己的 iterations/vN/sprint.md，queue 天然隔离。
-->
# Sprint v{N} · {项目名}

| task-id | title | layers | 依赖 | 状态 | PR | 交付 |
|---------|-------|--------|------|------|----|------|
| {id} | {标题} | backend | — | [可取] | — | 串行 |
| {id} | {标题} | backend | — | [可取] | — | 可并行 |
| {id} | {标题} | frontend | {依赖 id} | [可取] | — | 可并行 |

## 依赖说明
- {task-id}（可并行）blocked-by {task-id}（串行）：{原因一句话，为何必须先合并}
