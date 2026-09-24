---
name: runtime-orchestration
description: Orchestrate authorized HACT work across runtimes while preserving canonical Task, Git Truth, Authority, review, recovery, and completion boundaries. Use when an actual Runtime crossing, capability slice, external execution, derived child Task, or Independent Review dispatch is needed; stay local when no crossing is needed.
---

# Runtime Orchestration

HACT remains Task-first. Follow this authority order:

```text
Task Contract
→ Shared Protocol
→ Runtime Adapter
→ Runtime Orchestration Skill
→ MCP / Tool primitives
```

Runtime abstractions never replace canonical Task identity, HACT state, Gate, Human Authority, Git Truth, Review semantics, ownership, or Task completion semantics.

## Decide whether to cross

Stay Local by default. Cross only when the current Task Contract permits it and a capability, reasoning, isolation, execution, or external-action need justifies it. Read `protocols/runtime-crossing.md` and the applicable Task routing/matrix; use only its existing crossing kinds and return modes. Do not create an ad hoc Runtime task, state, or crossing kind.

Legacy and current flows with no actual crossing require no Runtime Crossing Record.

## Persist before dispatch

For an actual crossing:

1. Confirm the canonical Task, authoritative status/Contract identities, ownership mode, repository, candidate, origin/return references, current Authority references, and permission ceiling.
2. Create `_meta/runtime-crossings/{crossing_id}.yml` from `templates/runtime-crossing-record.yml`; reference semantic Contracts rather than restating or replacing them in prompts.
3. Assign a durable `crossing_id` and `request_key`. Before non-idempotent dispatch, satisfy the versioned dispatch boundary: commit the immutable dispatch data and verify the exact record path, commit SHA, record blob SHA, and required reachable ref.
4. Recompute Effective Permission under `protocols/authority.md` immediately before every repository mutation, commit, push/shared transport, external action, retry, recovery continuation, deployment/promotion, Runtime/action dispatch, and corresponding lifecycle boundary. A permission ceiling is only an upper bound; tool capability is not Human Authority.
5. Transport exact immutable artifact and snapshot identities. Do not substitute chat summaries or newly paraphrased Contracts.

Run `node scripts/check-runtime-crossing.js` when available. Its PASS proves mechanical structure only; it never proves Authority sufficiency, semantic validity, review PASS, Gate approval, completion, user-language authorization, or an external effect.

## Observe, append, and recover

Track `job_id`, revision, polling results, artifacts, evidence, approvals, recovery pointer, and terminal facts through append-only lifecycle events and verified lifecycle-head receipts. Use compare-before-append; conflicts enter reconciliation rather than last-writer-wins.

If a Runtime start is indeterminate, recover by durable request key when the backend supports lookup/idempotency. Without a recoverable execution identity, record `CAPABILITY_GAP`, forbid blind retry, and require reconciliation. Retry an uncertain external effect only when authoritative observation proves the effect absent; otherwise reconcile, use an operation-specific idempotency/compensation contract if available, or escalate.

Recovery re-reads authoritative HACT status; Runtime observation never wins. Do not clear review counts/findings, Authority references, ownership/return pointers, or durable lifecycle history.

## Child Tasks, return, and review

Route a Derived Child Task only after existing canonical registration, intake/package, readiness, status, and ownership requirements are satisfied. A Runtime job does not create or claim a Task. Restore the explicit `return_mode`, origin, affected scope, and return condition; never reopen merged work.

Independent Review dispatch follows `protocols/review.md`: send a reviewer-specific projection with Method SHA, Task Contract, relevant Shared Protocol, fixed candidate identity, authoritative inputs, and original evidence. Targeted re-review may also receive its prior report and open finding IDs. Exclude Owner full chat, private reasoning, defensive summary, irrelevant attempts, and mutable-worktree narrative. Fresh isolation must be demonstrable.

## Interaction continuity

Keep the normal user in the main ChatGPT surface as the Single Front Door. Translate internal routing into one narrative about the user's goal; show internal crossing/job/event ids only in explicitly requested audit mode.

Do not interrupt for routine implementation, test/build repair, review dispatch, polling, crossing persistence, routine recovery, or already-authorized child registration. Interrupt for a genuine product/business decision, Human Experience, sensitive risk, Authority expansion, external/production action, Gate/final acceptance, or irreducible ambiguity.

Report user-facing `完成` only when the requested outcome's applicable HACT completion conditions are satisfied. Runtime completion, review PASS, a commit, or child completion alone is insufficient.

## Prohibited claims and mutations

Do not redefine a Task Contract, create HACT state or ownership, approve a Gate, certify Authority sufficiency, widen scope/permission, declare completion from Runtime state, rewrite historical findings, or reopen a merged Task.
