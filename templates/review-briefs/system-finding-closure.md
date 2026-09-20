<!--
Additive system finding closure/escalation event template.
Copy to iterations/vN/system-review/closures/{finding-id}/closure-NNN.md.
One event records one state transition and is immutable after publication.
-->
---
schema: system-finding-closure/v1
iteration: vN
closure_id: closure-001
finding_id: SV-F001
source_artifact: iterations/vN/system-review/review-001.md
prior_closure: null
evidence: []
repair_candidate:
  base: <40-char commit SHA>
  head: <40-char commit SHA>
route:
  expected: local-close | system-rereview
  effective: local-close | system-rereview
local_review:
  required: true
  report: <project-relative path or null>
  reviewer_isolation: fresh-isolated | null
  result: pass | fail | not-required
semantic_revalidation:
  required_scope: []
  verified_scope: []
  result: pass | fail | pending
runtime_revalidation:
  required: true
  not_required_reason: null
  required_scope: []
  verified_scope: []
  result: pass | fail | pending | not-required
system_reviewer_event: null
full_snapshot_invalidated: false
invalidation_reason: null
escalation:
  occurred: false
  reason: null
result: closed | escalated
created_at: <ISO-8601>
---

## Evidence

只引用 fixed repair candidate、Fresh Isolated Local Review、semantic/runtime revalidation 与必要 System Reviewer event 的原始 Git/evidence pointer。不得复制或改写 source judgement。

## Contract

### Local closure

`route.effective=local-close` 且 `result=closed` 时必须同时满足：

- fixed repair candidate exists;
- `local_review.required=true`, `reviewer_isolation=fresh-isolated`, `result=pass`;
- semantic required/verified scope 相等且 result=pass；
- runtime required 时 required/verified scope 相等且 result=pass；不 required 时有非空 reason 且 result=not-required；
- `system_reviewer_event=null`；
- `full_snapshot_invalidated=false`；
- `escalation.occurred=false`。

### Route escalation

Local assumptions 失效时：

- `route.expected=local-close`；
- `route.effective=system-rereview`；
- `escalation.occurred=true` 且 reason 指向具体越界事实；
- `result=escalated`，不能在同一 event 宣布 closed；
- 后续 closure 继续引用本 event 作为 `prior_closure`。

### System re-review closure

`route.effective=system-rereview` 且 `result=closed` 时：

- `system_reviewer_event` 必须指向新的 targeted/full System Reviewer event；
- 该 event 的 result=pass、evidence sufficient，并覆盖本 finding 与声明 revalidation scope；
- `full_snapshot_invalidated=false` 默认 targeted；`true` 必须有 reason 且 reviewer event 为 full；
- repair owner、runtime executor 或 package review 不能替代此 closure authority。

`escalated` 不是成功终态。Finding 只有在后续合法 `result=closed` event 后才是 closed。
