# 验证记录

## 007 反馈后的减法修订

本轮通过：`scripts/sync-method.test.cjs`、`templates/scripts/check-sprint.review.test.js`、`check-sprint.worktree.test.js`、`check-sprint.review-archive.test.js`、`wave-split.transaction.test.js`、`check-sprint.shared-assets.test.js`、`check-b-task.test.js`、`check-codex-project.test.js`；角色配置检查、运行时路径检查和 diff 检查通过。

- 固定来源：临时方法仓 HEAD 前进后仍读已采用 SHA 的规范，项目脚本一致时无须升级；脚本漂移报版本错误。真实临时 hook 验证通过，项目在制品和自有配置保留。
- 报告草稿：首审 pending、复审自动带入原问题且保持 open、同快照自动补证、直接写新文件且不覆盖 pending；草稿不能通过审计。必要规格草稿拒绝实现/测试增量。
- 写集：A/B 当前任务包无需自登记，其它任务包/未登记代码仍被拦，共享资产冲突回归保持。
- 额度：同快照补证与本任务登记修订不消耗代码额度；两个实质快照加一份补证后可以继续第三个，第三个之后仍可集中补证但不能自动生成第四个实质整改；同快照同问题不重复补证。
- 历史报告、归档与工作树接续回归通过，不重写 007 的真实报告。

操作变化：报告由“生成锚→手搬字段→组装前序问题”缩成一次草稿生成；任务自登记不再派一次 spec-round；不新增计数字段或实际文件清单；版本在启动时核一次，不让每轮选择工具。以上证明工具行为，不等于已测得实际节时。本轮仍为主线自查及测试，未另派独审；未修改任何项目副本。

## 第一版验证（历史）

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
