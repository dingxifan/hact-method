# 进度日志：方法论过度设计纯减法

## 2026-09-04

- 用户确认 V0 保持现状：当前已允许跳过，并由人类明确拍板。
- 用户授权实施三项纯减法：能力预检后移、删除派生分钟字段、压缩 freshness 正常路径。
- 从双运行时适配完成分支建立 `codex/methodology-overdesign-reduction`，不修改项目仓。
- 双入口改为「运行时映射 → 共同启动/任务路由 → 按任务能力预检」，交接检查器新增顺序断言。
- freshness `pass` 改为固定锚 + 一行摘要；只有 `revised/blocked` 展开漂移证据和路由。
- 删除 preflight/round/status 中可由事件时间戳计算的派生分钟；累计 `spec_minutes` 保留，存量旧字段继续兼容读取。
- 同步更新 adversarial-review 兼容入口。skill-creator 官方校验器因环境缺 PyYAML 未能启动，已按同一规则完成等价结构校验。
- 验证通过：review-profile 5/5 + 7/7、四组模板正反夹具、runtime-neutral、Codex agent config、A/B/C/D handoff。
