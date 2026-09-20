<!--
Standalone system finding template. Use only when Runtime Integration Verification establishes
a new blocking finding after the applicable System Review event was already published.
Copy to iterations/vN/system-review/findings/{finding-id}.md and never rewrite after publication.
Findings discovered before review publication belong in that immutable review event instead.
-->
---
schema: system-finding/v1
iteration: vN
finding_id: SV-F001
origin: runtime-verification
severity: blocking
category: runtime
summary: <current candidate 上的具体 runtime problem>
candidate:
  head: <40-char commit SHA>
source_review: review-001
evidence: []
required_action:
  type: fix-code | fix-mechanism | revise-doc | downgrade-claim | global-gap-review | request-evidence
  description: <required outcome>
closure:
  route: local-close | system-rereview
revalidation:
  semantic:
    required: true
    scope: []
  runtime:
    required: true
    not_required_reason: null
    scope: []
full_snapshot_invalidated: false
invalidation_reason: null
state: open
created_at: <ISO-8601>
---

## Evidence and impact

记录真实 runtime path、failure、candidate identity、可观察影响与 finding route 的依据。不要在此文件追加 repair 或 closure；后续事件写入 `closures/{finding-id}/closure-NNN.md`。

## Contract

- This artifact is only for a post-publication runtime-origin blocking finding.
- `origin` remains `runtime-verification`; origin does not grant runtime-only closure authority.
- Route, revalidation, invalidation, and state follow `protocols/review.md`.
- Publication is immutable. Correction requires a new additive event, not history rewrite.
