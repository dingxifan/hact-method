<!--
System Reviewer event template. Copy to iterations/vN/system-review/review-NNN.md.
Published events are immutable historical judgements. Do not edit an earlier event after repair;
append closure evidence or a new targeted/full review event instead.
-->
---
schema: system-review/v1
iteration: vN
review_id: review-001
review_type: full | targeted
reviewer_isolation: fresh-isolated
method_sha: <40-char commit SHA>
candidate:
  base: <40-char commit SHA>
  head: <40-char commit SHA>
predecessor: null
revalidation_of: []
scope:
  - final-contract
  - architecture
  - cross-package-consistency
  - evidence-sufficiency
evidence: []
result:
  status: pass | blocked
evidence_state:
  status: sufficient | insufficient
findings: []
advisories: []
created_at: <ISO-8601>
---

## Judgement

只写本次 fixed candidate、declared scope、关键证据与结论。不得把 Package Review 汇总冒充 System Review，也不得用 runtime tests 全绿替代 semantic judgement。

## Blocking finding schema example

实际 blocking finding objects 写入 frontmatter 的 `findings`，本段只展示 shape，不是第二份 truth。Non-blocking suggestion 写入 `advisories`，不创建 closure route/state。

```yaml
findings: []
# - id: SV-F001
#   origin: semantic-review | runtime-verification
#   severity: blocking
#   category: compatibility | shared-contract | architecture | authorization | state-machine | data-model | runtime | evidence
#   summary: <current candidate 上的具体问题>
#   evidence:
#     - <Git/evidence pointer>
#   required_action:
#     type: fix-code | fix-mechanism | revise-doc | downgrade-claim | global-gap-review | request-evidence
#     description: <required outcome>
#   closure:
#     route: local-close | system-rereview
#   revalidation:
#     semantic:
#       required: true
#       scope: []
#     runtime:
#       required: false
#       not_required_reason: <非空理由；required=true 时删除本行>
#       scope: []
#   full_snapshot_invalidated: false
#   invalidation_reason: null
#   state: open
```

## Contract

- First event for a lineage is `review_type=full`, `predecessor=null`, `revalidation_of=[]`.
- Targeted event names one existing predecessor, non-empty `revalidation_of`, and the complete affected scope. It does not claim another Full System Review.
- Every invocation creates a new `review-NNN.md`; sequence does not encode depth.
- `result.status=pass` requires `evidence_state.status=sufficient` and `findings=[]`; advisories do not block.
- A blocked full review can remain the assurance baseline after every finding gains valid additive closure lineage; a later full PASS is not mechanically required.
- Finding origin/category does not determine closure route. Each blocking finding has exactly one route.
- `local-close` requires bounded locality and declared revalidation. `system-rereview` requires a later System Reviewer event for closure.
- `full_snapshot_invalidated=true` is valid only with non-empty `invalidation_reason` identifying invalidated system conclusions; diff size is insufficient.
- Do not change a finding to closed in this file. Use additive closure events.
