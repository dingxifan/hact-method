# Review Architecture Optimization — Implementation Plan & Regression Matrix

## 1. Phase sequence

### P0 — Design freeze (this branch phase)

Deliver:

- Design Contract
- Impact Matrix
- Implementation Plan / Regression Matrix

No checker/runtime behavior changes.

### P1 — Contract alignment

Update normative method documents only:

- `tasks/develop.md`
- `protocols/review.md`
- `tasks/integration-verify.md`
- `templates/boot-protocol.md`
- `runtime/codex.md`
- `tasks/manual-test.md` if required for boundary clarity

Goals:

- standard vs sensitive package review boundary;
- System Verification two-lane responsibility;
- finding routing and invalidation rules;
- one-full-review default;
- no new Task/Gate/state.

Required review:

- static cross-document consistency review;
- Task / Protocol / Runtime duplication check;
- triggered-loading check.

### P2 — System Review Report contract

Add:

- report template/schema;
- dedicated deterministic checker (preferred: `check-system-review.js`);
- checker tests;
- pre-commit routing.

Mechanical rules:

- immutable candidate/tree fields;
- required finding routing;
- required revalidation scopes for `system-rereview`;
- full invalidation reason;
- prior report chain for targeted review;
- no silent finding disappearance.

### P3 — Package review realization

Adjust develop/runtime/reviewer instructions so:

- standard package executes lightweight independent scope;
- sensitive diff escalates to full local review;
- current fixed snapshot and accepted implementation binding stay intact;
- full→targeted package re-review mechanics remain bounded.

Avoid a new package evidence schema unless tests show a real ambiguity.

### P4 — System Verification realization

Wire `integration-verify` as the system verification stage:

- Lane A system semantic review;
- committed system-review report;
- finding remediation routing;
- Lane B runtime integration verification;
- system-rereview targeted/full decisions;
- completion contract before manual-test/G4.

### P5 — Mechanical gate alignment

Only after P1-P4 contracts are stable:

- G4 readiness mechanical check;
- status/report pointer if truly required;
- recovery/resume behavior;
- stale candidate/report rejection;
- hook routing.

### P6 — Real A-class pilot

Use one real A-class iteration.

Do not treat this as a repeat of the frozen Method A/B experiment.

Measure:

- package review effort;
- number of escalations to sensitive;
- system review findings by category;
- local-close vs system-rereview ratio;
- how often full snapshot invalidation occurs;
- runtime evidence requests from semantic review;
- user/window switching points;
- escaped defects at manual test.

Only after pilot evidence decide whether package review can be reduced further.

---

## 2. Minimum regression matrix

### R1 — Standard package lightweight review

Given:

- schema-valid standard develop package;
- ordinary local implementation diff.

Must prove:

- immutable candidate;
- intent/oracle checked;
- scope checked;
- affected compatibility checked;
- required target tests checked;
- blocking finding can prevent merge;
- no mandatory full-system architecture review at package scope.

### R2 — Sensitive escalation

Given:

- package declared standard;
- actual diff touches auth/data isolation/money/destructive migration/external irreversible side effect.

Must prove:

- risk escalates from actual diff;
- full local package review is required;
- required Human Authority boundary remains intact.

### R3 — All packages merged → System Verification

Must prove:

- boot routing selects existing `integration-verify` canonical task;
- no new `final-review` task appears;
- system review artifacts are loaded only in the system stage.

### R4 — System Full Review PASS

Must prove:

- fixed final candidate/tree;
- report persisted under `iterations/vN/system-review/`;
- no open blocking findings;
- runtime revalidation scope recorded if required.

### R5 — local-close

Finding:

- local root cause;
- no shared/system contract invalidation.

Must prove:

- Codex fix;
- Fresh Isolated targeted review;
- scoped tests;
- finding closure evidence;
- no return to system reviewer required.

### R6 — system-rereview targeted

Finding:

- shared/cross-package scope affected;
- `full_snapshot_invalidated=false`.

Must prove:

- new fixed candidate;
- targeted semantic scope;
- targeted runtime scope;
- prior report referenced;
- previous unaffected conclusions retained.

### R7 — broad invalidation

Finding:

- core state machine/shared API/major architecture materially redesigned.

Must prove:

- `full_snapshot_invalidated=true`;
- non-empty invalidation reason;
- Full System Re-review required.

### R8 — evidence-needed

System reviewer cannot conclude without runtime proof.

Must prove:

- report conclusion/finding requests explicit runtime evidence;
- Runtime Integration Verification produces real evidence;
- semantic closure consumes that evidence;
- no test evidence is invented from static review.

### R9 — Runtime integration failure

Must prove:

- real combined-path failure routes to `develop(source=integration)` or `revise-doc`;
- repair receives targeted runtime re-test;
- semantic revalidation scope follows actual invalidation.

### R10 — Report integrity

Negative cases:

- stale reviewed head;
- candidate/tree mismatch;
- missing closure route;
- `system-rereview` without scope;
- `full_snapshot_invalidated=true` without reason;
- targeted report without prior report;
- blocking finding silently removed.

All must fail deterministically.

### R11 — Existing review safety

Must re-run:

- accepted implementation binding;
- package review-chain;
- governance/implementation plane;
- archive;
- staged hook;
- B package admission;
- worktree/recovery.

Goal:

> Review optimization must not regress the protections established during vNext convergence.

### R12 — G4 readiness

Must prove:

- open system blocking finding prevents System Verification completion / G4 readiness;
- System Review PASS alone does not bypass required runtime verification;
- Runtime verification alone does not bypass open semantic finding;
- both lanes closed → manual-test/G4 path remains reachable.

---

## 3. Implementation stop conditions

Stop and return to design if implementation requires any of:

- new Core Task;
- new Human Gate;
- another dynamic state machine parallel to `status.yml`;
- weakening accepted implementation binding;
- reintroducing full package review for every standard package merely because checker design is difficult;
- treating integration runtime tests as equivalent to semantic system review;
- treating system review as authority to make product decisions.

---

## 4. Review strategy for the method change itself

This method change should use:

1. local contract/document review during P1;
2. deterministic checker tests during P2-P5;
3. one System Full Independent Review of the finished Review Architecture Optimization candidate before mainline promotion;
4. targeted rereview by invalidation scope for subsequent fixes.

The Review Architecture Optimization must itself follow the architecture it introduces where practical, without self-referentially blocking the initial implementation.

---

## 5. Exit criteria before pilot

Before a real A-class pilot:

- design contract is merged into the optimization candidate;
- report schema/checker is deterministic;
- package review escalation is executable;
- System Verification two-lane flow is executable;
- finding routing is machine-readable;
- targeted/full invalidation rules are test-covered;
- G4 path is reachable and blocked correctly;
- full existing non-frozen repository regression is green;
- no frozen A/B result was changed or rerun.
