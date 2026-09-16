# 验证记录

2026-09-16，方法论仓本地变更；均为实际命令执行，不是模型运行效率测量。

| 命令 | 结果 |
|---|---|
| `node templates/scripts/check-sprint.review.test.js` | PASS；最新检查器变更后重跑通过 |
| `node templates/scripts/check-sprint.worktree.test.js` | PASS；含空增量末轮恢复与未审修改反例 |
| `node templates/scripts/check-sprint.review-archive.test.js` | PASS |
| `node templates/scripts/wave-split.transaction.test.js` | PASS；真实 Git/worktree 夹具 |
| `node templates/scripts/check-codex-project.test.js` | PASS |
| `node _meta/scripts/check-codex-agent-config.js` | PASS |
| `node scripts/check-paths.js` | PASS；运行时绝对路径零命中 |
| `git diff --check` | PASS |

## 新增行为覆盖

- 同 Git tree、真实非空证据文件、原 request-evidence 问题的 targeted 闭合通过；合并前链检查也通过。
- 缺证据、空日志、越界路径、以 round 报告充当证据、虚假 head、漏掉目标问题、未关闭阻断均拒绝。
- 未标 evidence_only 的空增量、代码整改伪装纯补证、启用后退回旧策略、未知策略均拒绝。
- 建议导致 evidence-needed/revise、行为缺陷冒充待证据、阻断挂 backlog 均拒绝；关闭阻断且保留建议允许通过。
- 新规则可从旧链下一轮启用，不改写历史报告；旧链校验继续通过。
- 机械锚生成核真实 diff 哈希及文件集、空 diff 哈希、无效 ref 失败。
- 末轮纯补证仍恢复首轮已审实现；同路径未审变化仍拒绝，错误补证前提在恢复入口也拒绝。

## 限制

本次为主线实现、测试与一致性自查，未另派独立审查员；不将本记录声称为独审通过。检查器只核证据定位、报告结构和链一致性，日志内容能否证明业务行为仍由独立审查员判断。无项目运行试点，尚不能证明节时比例或漏检率。没有修改项目副本、Gate、hook 或历史审查记录，没有推送或部署。
