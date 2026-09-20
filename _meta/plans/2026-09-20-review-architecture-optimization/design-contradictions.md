# Phase 1 — Design Contradictions

The following are repository contradictions against the frozen target. They are not silently resolved in Phase 1. None requires changing a frozen invariant or abandoning the `integration-verify` identity.

## DC-01 — Current canonical task explicitly rejects the required semantic review lane

**DESIGN CONTRADICTION**

**Current truth:** `tasks/integration-verify.md` declares `review: none` and says an additional independent review normally duplicates the task's existing verification responsibility.

**Target contract:** System Verification must contain a distinct Semantic / Holistic Independent Review lane and a distinct Runtime Integration Verification lane; neither substitutes for the other.

**Why incompatible:** The current contract treats cross-task verification as sufficient reason not to require an independent semantic reviewer, while the target makes that reviewer a mandatory assurance source.

**Available options:**

1. Extend `integration-verify` in place to own both lanes.
2. Add a new Core Task for system review.
3. Keep the current runtime-only task and weaken the target.

**Recommended minimal resolution:** Option 1. Replace `review: none` with the System Verification two-lane contract inside the existing task. Options 2 and 3 violate frozen invariants.

## DC-02 — Canonical task identity and distributed legacy identity disagree

**DESIGN CONTRADICTION**

**Current truth:** `tasks/README.md`, `templates/boot-protocol.md`, `tasks/integration-verify.md`, and `tasks/manual-test.md` use canonical `integration-verify`; `skeleton/`, `specs-structural/`, `specs-execution/`, `guide/`, `templates/status.yml`, and parts of status write documentation still present `generate-integration-tests` as an active task identity.

**Target contract:** `integration-verify` remains the single canonical Core Task; no parallel final/system task is introduced.

**Why incompatible:** Current users and generated projects can receive two different apparent task identities from the same repository. Leaving both active would make System Verification ownership ambiguous.

**Available options:**

1. Keep `integration-verify` canonical and reduce the old name to an explicit input alias/compatibility pointer.
2. Rename the canonical task back to the old name.
3. Maintain both as independent tasks.

**Recommended minimal resolution:** Option 1, using the existing boot canonicalization rule. Align current templates/guides/spec surfaces prospectively; do not rewrite historical project artifacts.

## DC-03 — Required `integration-verify = merged` truth has no coherent serialization contract

**DESIGN CONTRADICTION**

**Current truth:** `tasks/integration-verify.md` defines `done/merged`, and `tasks/manual-test.md` requires `integration-verify` to be `merged`. However, `templates/status.yml` and `skeleton/07-status-contract.md` define task write events mainly for develop work items and integration scenario rows; boot routing also uses “integration passed/present” artifact inference. No single schema states how the canonical Core Task's lifecycle and current result pointer are persisted.

**Target contract:** System Verification completion must be deterministic and recoverable, with no unresolved finding, escalation, rereview, or required revalidation; detailed truth must remain Git Truth without a new parallel state machine.

**Why incompatible:** A downstream contract requires a state that the machine-state contract does not consistently create or read.

**Available options:**

1. Represent one per-iteration `integration-verify` work item in existing `status.yml tasks[]`, extending nullable/non-develop fields as required, and point to detailed Git artifacts.
2. Add a minimal per-iteration System Verification pointer/status object in `status.yml`.
3. Infer completion only from files and prose.
4. Create a separate system-verification ledger.

**Recommended minimal resolution:** Prefer option 1 because it reuses the existing task state machine and machine entry point. If schema constraints proven by implementation tests make that unworkable, use option 2. Reject options 3 and 4. The Phase 2 contract must choose one before Phase 4 checker wiring.

## DC-04 — Current integration result lifecycle is mutable, while system judgement must be immutable

**DESIGN CONTRADICTION**

**Current truth:** `templates/integration-result.md` and `specs-execution/generate-integration-tests.md` update an existing result/retest record in place. That is currently the principal persisted integration conclusion.

**Target contract:** A published System Review Report is an immutable judgement over a fixed candidate; later repairs and closure evidence are additive events.

**Why incompatible:** Reusing the current mutable integration result as the System Review Report would erase original judgement and break lineage.

**Available options:**

1. Keep the runtime result as a distinct runtime-lane artifact and add immutable system-review events plus additive closure evidence.
2. Version every runtime result and also make it the semantic report.
3. Continue mutating the sole conclusion artifact.

**Recommended minimal resolution:** Option 1. It preserves the target's lane separation and reuses current runtime evidence without treating it as semantic assurance.

## Identity-retention conclusion

There is no repository contradiction that makes retention of `integration-verify` impossible. The contradictions are current contract and serialization gaps around that existing identity. All have bounded resolution paths within the frozen architecture.

## Phase 1 contradiction status

No contradiction requires a new architecture decision before implementation starts:

- DC-01 is resolved by the frozen requirement to expand the existing task.
- DC-02 is resolved by the already-established canonical alias direction.
- DC-03 leaves a bounded persistence placement choice, not an unresolved review semantic; both acceptable choices reuse `status.yml` and the current task state model.
- DC-04 is resolved by the frozen separation of semantic review and runtime verification artifacts.

Therefore the Phase 1 contradiction exit criterion is satisfied, provided Phase 2 freezes the exact DC-03 serialization shape before checker/runtime wiring begins.
