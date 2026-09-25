<!-- develop 独立证据审查逐轮报告模板；现有 v2 首轮序列化仍写 full，整改后 targeted。target package effective mode 写正文；此处 full 不表示 System Full Review。 -->
---
schema: develop-review-round/v2
review_policy: bounded-v1
task_id: <待填>
round: 1
mode: full | targeted
risk: standard | sensitive
prior_report: null
target_finding_ids: []
base_ref: <固定 commit SHA>
reviewed_base: <commit/tree SHA>
reviewed_head: <commit/tree SHA>
diff_sha256: <`git diff --binary reviewed_base reviewed_head` 原始字节的 SHA-256，64 位小写 hex>
changed_files: []
evidence_only: false
evidence_files: []
escalate_to_full: false
conclusion: pass | revise | evidence-needed
---

## 本轮证据与判断

先按本目录 `review-scope.md` 确认反例属于审查范围；证据说明当前违规、正常误用或外部入口。旧 finding 因范围纠正关闭时沿用 id/status，在 evidence 写明“范围纠正，非代码修复”及理由，不改 schema、不删除历史报告。

首审写必要范围和证据；复审引用 prior_report，只补新证据、问题判断和结论，不重复任务背景、完整范围或已通过项。

每轮由审查员完成后，立即运行 `node scripts/check-sprint.js --review-chain {task-id} . --in-progress`，核字段、固定快照和问题接续；revise/evidence-needed 是合法中间结论，pending 草稿仍不合法。该命令不证明可合并；交付前用不带 --in-progress 的同一命令核全部阻断闭合。

末轮 round 报告就是最终独审结论，PR 直接引用它。不另交 final-review.md 或再次抄写验证摘要；历史文件保留。对新快照的实际复审接入原 round 链，不另开平行结论。

- `full`：按对应 brief 核改动。只报发现、必要证据和未完成验证，不逐维度填“无发现”。
- `targeted`：读前次独立报告，核目标 finding、修复增量及受影响调用链/回归；局部新发现沿用此模式并分配新 id，不重审未受影响部分。新增文件、模块、依赖本身不触发全审。
- 同快照补证使用 `targeted` + `evidence_only: true`，列出新增原始证据；实现、测试、依赖或受控配置变化时审新 fixed candidate。
- 局部 Contract 修订只核修订 diff 和受影响实现；最新 Contract 仍须由 reviewer 核对。
- 仅当改动使先前结论广泛失效（如改变公共信任边界或跨模块契约，无法局部验证）时置 `escalate_to_full: true`，写明失效结论和原因，下一轮才 full。超出授权范围仍先处理授权/契约，不靠局部复审默认授权。

## Findings

```yaml
findings: []
# - id: <task-id>-F001
#   dimension: contract
#   severity: blocking | advisory
#   type: behavior-bug | contract-drift | example-error | enforcement-claim | scope-gap | future-risk | evidence-gap
#   reachability: current | conditional | unreachable | unknown
#   evidence: <反例/文档冲突/尚缺证据>
#   impact: <当前可观察后果；未知写 unknown>
#   action: fix-code | revise-doc | fix-mechanism | downgrade-claim | global-gap-review | backlog | request-evidence
#   status: open | verified-closed | advisory
```

同一根因的调用语法/输入变体合并到同一 id 的 evidence，不按变体数增加 finding。事件计时可选；如记录则由编排器当场写入，不事后补估、不强制对齐，不构成复审完成门。

所有 report 必须 `review_policy=bounded-v1`。结论须与 open findings 一致：pass 无阻断；revise 有待整改阻断；evidence-needed 有 request-evidence 阻断。

使用 `node scripts/build-review-anchor.js --task {task-id} --head {tree} --write` 生成下一轮草稿；conclusion 必须由独立 reviewer 判定。

报告中的 `reviewed_base/reviewed_head` 必须是当前仓真实存在的 commit/tree；`changed_files` 与 `diff_sha256` 必须从这两个对象机械重算。`conclusion: pass` 时不得残留 `severity: blocking + status: open`；targeted 报告须逐条回写每个 `target_finding_ids` 的关闭或仍开放状态。

`source=integration` 修复 system finding 时引用 source finding/report；package report 不关闭 system finding，后续 Fresh System Review report 才能关闭。

`review_profile`、`review_profile_version`、`standards_checked` 等退役字段禁止出现在当前 report。
