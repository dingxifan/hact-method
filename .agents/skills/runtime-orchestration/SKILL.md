---
name: runtime-orchestration
description: Keep authorized HACT work in one capable Runtime through a durable conclusion, and manage the rare cross-Runtime, independent-review, or external-execution boundary without changing Task, Git Truth, Authority, or completion semantics.
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

Stay Local by default. Cross only for an irreducible capability or isolation gap. Normal handoff is not a Method state and has no kind matrix. Load `protocols/external-effect.md` only for a non-idempotent, production, paid, irreversible, or effect-indeterminate action.

Runtime location and durable governance are separate. Normal bounded execution, child Task routing and independent review use existing Task/evidence/review artifacts. Only a high-impact external effect creates a receipt.

Keep **Runtime affinity** for the whole bounded operation: if the current Runtime can author, execute, validate, and return evidence, it remains the owner through PASS or a classified blocker. Do not switch merely because another Runtime has a more natural specialty. Increase model/effort inside the current Runtime before considering a reasoning-only handoff.

Default to at most one outward Runtime handoff per bounded operation. After handoff, the receiver completes implementation, mechanical repair, validation, and review closure without ping-pong. Return only for a new semantic/Human Authority decision or an irreducible capability/isolation gap. This is an execution preference, not a new state, counter, or persisted object.

## Dispatch a bounded executable operation

When the outcome is already defined, dispatch execution rather than another open-ended analysis. Before dispatch, make these fields explicit:

```text
Goal
Allowed scope
Forbidden scope
Execute
Validate
Stop
Return
```

The operation is bounded by its goal, write set, validation, and stop condition; it is not limited to one mechanical step or one state transition. Modification, deterministic validation, same-class correction, and revalidation may stay in one operation.

Before execution, run only the **Minimum Execution Preflight**:

```text
Target     correct repository/worktree/baseline
Collision unknown local changes do not overlap the write set
Boundary   allowed/forbidden scope and current Authority are clear
Validation the real proof command and stop condition are known
```

Do not pre-check remote/upstream, every Gate/Task state, crossing state, deployment capability, or unrelated project history when the operation does not use them. Reuse the preflight result while its inputs remain unchanged.

Classify a blocker early:

- `MECHANICAL`: formatting, lint, deterministic checker, known schema/link/heading, or another correction whose meaning and scope are fixed;
- `SEMANTIC`: Product, Technical, Contract, risk, or behavior meaning requires a choice;
- `AUTHORITY`: the next action exceeds the authorized scope or needs a new external/commit/push/deploy/Gate decision;
- `CAPABILITY`: a required tool, environment, permission, or recoverable execution identity is unavailable.

For `MECHANICAL`, continue applying and validating same-class corrections until PASS or until the error changes class. Do not redispatch a known mechanical failure as “study the checker/regex.” Stop before changing semantics, widening scope, or crossing an Authority boundary.

## Persist before dispatch

Only for an External Effect Trigger:

1. Confirm the canonical Task, exact action/target/snapshot and current Authority references.
2. Create `_meta/external-effects/{operation_id}.json` from `templates/external-effect-receipt.json`.
3. Assign a durable `operation_id` and `request_key`; commit and verify the exact intent receipt before dispatch.
4. Compute Effective Permission at the bounded-operation boundary. Recompute only when scope/target/snapshot/Authority/environment/tool capability/risk changes, or before commit, push/shared transport, merge, external/deployment action, or retry/recovery involving an uncertain effect. Tool capability is not Human Authority.
5. Transport exact immutable artifact and snapshot identities. Do not substitute chat summaries or newly paraphrased Contracts.

Run `node scripts/check-external-effect.js --dispatch-ready ...`. PASS proves receipt structure only; it never proves Authority sufficiency or that the effect occurred.

## Observe, conclude, and recover

Treat `job_id`, thread/session, runtime revision, polling results, reasoning/composing state, and command progress as transient Runtime telemetry. Observe them in memory when useful; do not append them merely because they changed.

Normal artifacts, validation and review findings stay in their existing evidence/report objects. For an external effect, update only its outcome/evidence; do not create job/progress/lifecycle events.

If a Runtime start is indeterminate, recover by durable request key when the backend supports lookup/idempotency. Without a recoverable execution identity, record `CAPABILITY_GAP`, forbid blind retry, and require reconciliation. Retry an uncertain external effect only when authoritative observation proves the effect absent; otherwise reconcile, use an operation-specific idempotency/compensation contract if available, or escalate.

Recovery starts from the latest verified durable conclusion and reads only the minimum authoritative facts required for the next bounded action. It does not reconstruct thread continuity or polling history. Runtime observation never wins over authoritative HACT status. Do not clear relevant review counts/findings, Authority references, ownership/return pointers, or durable conclusion history.

## Consume evidence before narrative

Execution completion and narrative completion are separate. As soon as fixed artifact identity, changed paths, deterministic validation result, and any blocker are available, return that evidence; do not keep polling solely for a polished narrative.

Before treating execution as concluded, confirm there is no command still running, approval pending, validation in progress, or unresolved external effect. Polling is bounded observation, never HACT Truth. Stop polling when evidence establishes PASS or a classified blocker.

## Child Tasks and review

Create a child Task only after existing canonical registration, intake/package, readiness, status, and ownership requirements are satisfied. A Runtime job does not create or claim a Task; return semantics stay in the Task/status contract, and historical merged work never reopens.

Independent Review follows `protocols/review.md`: provide a review brief with fixed candidate, allowed scope, authoritative inputs and evidence. Targeted re-review also receives prior report and open finding IDs. Exclude Owner full chat/private reasoning and mutable-worktree narrative. Prefer an internal fresh reviewer that returns its report to the same main interaction.

## Interaction continuity

Keep the normal user in the main ChatGPT surface as the Single Front Door. Translate internal routing into one narrative about the user's goal; show internal crossing/job/event ids only in explicitly requested audit mode.

Do not interrupt for routine implementation, test/build repair, review, polling, routine recovery, or already-authorized child registration. Interrupt for a genuine product/business decision, Human Experience, sensitive risk, Authority expansion, external/production action, Gate/final acceptance, or irreducible ambiguity.

Report user-facing `完成` only when the requested outcome's applicable HACT completion conditions are satisfied. Runtime completion, review PASS, a commit, or child completion alone is insufficient.

## Prohibited claims and mutations

Do not redefine a Task Contract, create HACT state or ownership, approve a Gate, certify Authority sufficiency, widen scope/permission, declare completion from Runtime state, rewrite historical findings, or reopen a merged Task.
