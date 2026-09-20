# HACT vNext Review Architecture Optimization — Design Contract

## 0. Status

- Phase: Design + Contract Alignment
- Stable baseline: `main@a8cadefe2a2775e1ab5ccec3b15baad9d036b07b`
- Scope: A-class review architecture only
- Runtime/checker implementation: not started in this phase
- Frozen A/B Run 2 / Run 3: out of scope; do not modify or rerun

Primary principle:

> **One Expensive Full Review, Local Closure by Default**

This design turns the prior discussion into a formal contract. It does not create a second review methodology beside HACT; it narrows package review responsibility and moves system assurance to the system level.

---

## 1. Problem

Current `develop` semantics require every package to pass independent review before Accepted Project Truth. That is useful for local containment, but when every ordinary package performs a heavy full review, the process pays system-level review cost repeatedly while still needing a later integration/system judgment.

The optimization goal is not "remove review" and not "move every package review to another runtime".

The goal is to separate:

1. **Package Review = Error Containment**
2. **System Full Independent Review = System Assurance**
3. **Runtime Integration Verification = Runtime Proof**

The three layers use different evidence and cannot replace one another.

---

## 2. Non-goals

This change must not:

- redesign Task / Protocol / Runtime architecture;
- add a parallel `Final Review` Core Task;
- weaken immutable Git snapshot / fixed diff / accepted implementation binding;
- replace runtime integration evidence with static review;
- replace independent semantic review with tests;
- change Human Authority or G1-G5 responsibilities;
- reintroduce per-package human window switching;
- rerun or reinterpret the frozen A/B experiments;
- make "lighter review" mean "self-review" or "no evidence".

---

## 3. Review hierarchy

### 3.1 Package Review

Purpose:

> Prevent obvious defects, local contract violations, and high-risk mistakes from propagating into later packages.

Package Review is local to one `develop` task and remains independent from the implementer context.

It must always answer:

- Did the package satisfy its `intent / oracle`?
- Did implementation leave the authorized scope?
- Is there an obvious compatibility regression on the affected call chain?
- Did required target verification actually run and support the claim?
- Does the actual fixed diff cross a sensitive boundary?
- Is there an obvious defect that must not enter Accepted Project Truth?

It does **not** own:

- cross-package architecture consistency;
- whole-iteration ownership gaps;
- duplicate truth-source detection across packages;
- complete shared-contract coherence across all consumers;
- final system state-machine / data-lifecycle coherence;
- final system evidence sufficiency.

Those belong to System Full Independent Review.

### 3.2 Standard package

Default:

> **Lightweight Independent Package Review**

The review remains:

- fresh;
- isolated from the owner generation context;
- fixed-snapshot based;
- evidence based;
- capable of producing blocking findings.

Its semantic scope is intentionally bounded to:

- package contract;
- affected behavior;
- obvious compatibility;
- evidence validity;
- risk escalation.

It does not perform a full-system architecture review.

### 3.3 Sensitive package

A package receives a **Full Local Package Review** when the actual fixed diff reaches a sensitive boundary, including at minimum:

- authentication / authorization;
- data isolation;
- irreversible migration;
- destructive data operations;
- billing / money / reconciliation;
- externally irreversible side effects;
- another explicitly governed high-impact boundary.

Risk is derived from the actual diff, not only the task package declaration.

A package initially marked standard must escalate if review observes a sensitive boundary.

---

## 4. System Verification

### 4.1 No new Final Review Core Task

HACT does not add a new peer Task named `final-review`.

The existing `integration-verify` stage becomes the canonical system-level verification stage in meaning.

The canonical Task name remains `integration-verify` during the first implementation phase to avoid Task-catalog inflation and unnecessary routing churn.

The user-facing / architectural phase name is:

> **System Verification**

### 4.2 Two required lanes

System Verification contains two complementary lanes.

#### Lane A — Semantic / Holistic Independent Review

Input:

- final fixed Git snapshot for the iteration;
- PRD / UX / TRD / Foundation / Project Truth;
- develop task packages;
- package review evidence;
- implementation and architecture;
- runtime evidence already available.

It answers:

- Did the final system satisfy Product / Technical Contract as a whole?
- Did packages leave ownership gaps?
- Did merging create duplicate truth sources?
- Are shared contracts consistent across producers and consumers?
- Are retirement / supersedes obligations closed?
- Are state, permission, error handling, data lifecycle, and major architecture paths coherent?
- Is package-level evidence sufficient for the system-level conclusion?
- Is runtime evidence missing for any material claim?

#### Lane B — Runtime Integration Verification

Input:

- the same accepted/fixed system candidate;
- explicit runtime paths requested by contract or by Lane A;
- real application/system boundaries.

It proves:

- real API / queue / DB / state-machine behavior;
- frontend/backend seams;
- real entry → terminal state;
- external boundaries;
- failure / retry / recovery;
- affected runtime paths after fixes.

Lane B cannot prove architectural or contract coherence by itself.

Lane A cannot substitute for real runtime execution.

### 4.3 Default ordering

Default ordering:

```text
All sprint develop tasks merged
→ Lane A: System Full Independent Review
→ Review report persisted to Git
→ Findings routed and remediated
→ Lane B: Runtime Integration Verification
→ targeted semantic/runtime closure as required
→ System Verification complete
→ Manual Test
→ G4
```

Lane A may produce `evidence-needed` findings that explicitly request runtime evidence from Lane B before semantic closure.

Runtime findings route back to `develop(source=integration)`, `revise-doc`, or another explicit owner.

System Verification completes only when both lanes are closed for the fixed candidate.

---

## 5. Full-review frequency and revalidation

### 5.1 Default policy

Each A-class iteration should normally perform:

> **one expensive System Full Independent Review**

After that, fixes do not automatically trigger another full review.

The amount of re-review is determined by:

> **which previous conclusions were invalidated**

not by:

- number of changed lines;
- number of commits;
- reviewer/runtime change;
- presence of any code modification.

### 5.2 Revalidation levels

#### Level 1 — Finding Closure

Answers only whether the original finding root cause has been closed.

Used inside `local-close`.

#### Level 2 — Targeted System Re-review

Default system-level revalidation after a system finding fix.

Scope includes:

- original finding;
- repair delta;
- affected semantic call chain;
- necessary regression;
- affected runtime path;
- directly induced new risks.

#### Level 3 — Full System Re-review

Required only when prior system conclusions are broadly invalidated.

Typical triggers:

- shared API / schema / event semantics changed materially;
- permission model changed;
- core state machine changed;
- broad data model redesign;
- primary architecture path changed;
- multiple packages were redesigned together;
- Product / Technical Contract materially revised;
- fix invalidates a wide portion of the previous full-review reasoning.

---

## 6. Finding routing

Every blocking system finding must include a closure route.

### 6.1 `local-close`

Use when all are true:

- root cause is local;
- Product / Technical Contract is unchanged;
- shared contract is unchanged;
- primary architecture is unchanged;
- affected scope is bounded and explicit;
- Fresh Isolated local review + targeted tests can prove closure.

Flow:

```text
System Full Review
→ finding: local-close
→ Codex fix
→ Fresh Isolated targeted review
→ targeted tests / affected integration regression
→ finding closed
```

No return to the system reviewer is required unless the repair itself crosses an escalation boundary.

### 6.2 `system-rereview`

Use when one or more are true:

- shared contract changed;
- core architecture changed;
- multiple packages changed together;
- permission/state/data-model semantics changed;
- Product / Technical Contract revised;
- repair may invalidate a system-level conclusion.

Flow:

```text
System Full Review
→ finding: system-rereview
→ Codex fix
→ local verification
→ new fixed candidate
→ system targeted re-review by default
→ full system re-review only if full_snapshot_invalidated=true
```

`system-rereview` does **not** mean automatic full review.

---

## 7. Invalidation contract

Each `system-rereview` finding must declare:

- semantic revalidation scope;
- runtime revalidation scope;
- `full_snapshot_invalidated`;
- `invalidation_reason` when full snapshot is invalidated.

### 7.1 Default

`full_snapshot_invalidated: false`

unless broad invalidation is demonstrated.

### 7.2 Full invalidation

Set `full_snapshot_invalidated: true` only when the prior final snapshot review can no longer support a wide portion of its original conclusions.

The report must state why.

A large diff alone is not sufficient.

---

## 8. System Review Report as Git Truth

### 8.1 Location

Default path:

```text
iterations/vN/system-review/
  review-001.md
  review-002.md
  ...
```

This is an authoritative handoff artifact between System Reviewer and Codex.

Chat summaries are not the official finding source.

### 8.2 Report schema

Proposed top-level schema:

```yaml
---
schema: hact-system-review/v1
iteration: vN
method_sha: <40-sha>
review_mode: full | targeted
prior_report: null | iterations/vN/system-review/review-NNN.md

reviewed_base: <40-sha/tree as defined by implementation contract>
reviewed_head: <40-sha>
final_candidate: <40-sha>
reviewed_tree: <40-tree>

overall_conclusion: pass | blocked | evidence-needed

semantic_revalidation_scope: []
runtime_revalidation_scope: []

full_snapshot_invalidated: false
invalidation_reason: null
---
```

Findings are recorded in a mechanically parseable section:

```yaml
findings:
  - id: SR-F001
    severity: blocking | advisory
    category: compatibility | contract | architecture | evidence | runtime | security | other
    status: open | closed | accepted

    evidence:
      - <stable reference>

    required_action:
      type: fix-code | revise-contract | add-evidence | assign-owner | other
      summary: <required outcome>

    closure:
      route: local-close | system-rereview

    revalidation:
      semantic:
        scope: []
      runtime:
        scope: []

    full_snapshot_invalidated: false
    invalidation_reason: null

    closure_evidence: []
```

### 8.3 Report rules

- Every blocking finding must have a closure route.
- Every `system-rereview` finding must have explicit revalidation scopes.
- `full_snapshot_invalidated=true` requires a non-empty reason.
- Targeted system review must reference the prior report.
- Findings do not disappear between reports; closure must be explicit.
- Report candidate/tree must be immutable and reproducible.
- The report is not Human Authority and cannot sign G1-G5.

---

## 9. Package review evidence compatibility

The first implementation should avoid unnecessary package-review schema churn.

Preferred approach:

- keep current immutable snapshot / diff / finding-chain evidence mechanics;
- change reviewer semantic scope for standard vs sensitive packages;
- retain accepted implementation binding;
- retain full→targeted re-review mechanics;
- reuse current risk field but derive escalation from actual diff;
- avoid introducing another package-review ledger unless a real mechanical gap appears.

The optimization is primarily a **responsibility boundary change**, not an excuse to weaken Git/evidence mechanics.

---

## 10. State and Gate contract

### 10.1 No new core state

Do not add a new Task state for System Review.

Existing states remain:

`可取 → taken-by → done → merged`

### 10.2 No new Human Gate

System Full Independent Review is an AI/system verification mechanism, not a Human Authority Gate.

G1-G5 remain Human Authority boundaries.

### 10.3 G4 relationship

The implementation phase must ensure G4 cannot be treated as ready until the iteration's System Verification obligations are complete:

- semantic system review has no open blocking findings;
- required runtime integration verification is complete;
- required local/system revalidation is closed;
- manual-test then proceeds under its existing authority semantics.

Exact checker wiring is deferred to implementation design.

---

## 11. Loading and runtime principles

### 11.1 Package work stays local

Standard package review should remain inside the local development/runtime loop and should not require repeated human window switching.

### 11.2 System review is stage-bound

The expensive system reviewer loads the whole iteration only after all planned sprint develop work has merged.

It does not run between ordinary packages.

### 11.3 Git truth handoff

System Reviewer → Codex handoff uses the committed system review report and fixed Git candidate.

It does not depend on chat continuity.

### 11.4 Runtime choice

The Method defines capability requirements and evidence boundaries, not subscription/model economics.

A system review may run in a stronger independent context when available, but the method contract is expressed in terms of:

- independence;
- fixed source;
- semantic coverage;
- evidence sufficiency.

---

## 12. Human Authority

System Review may conclude:

- pass;
- blocking finding;
- evidence insufficient;
- local-close;
- system-rereview;
- targeted/full revalidation scope.

It does not decide:

- product trade-offs;
- Gate approvals;
- user-experience acceptance;
- high-impact Human Authority decisions.

Those remain governed by `protocols/authority.md`.

---

## 13. Acceptance criteria for this architecture

The implementation is complete only when all are true:

1. Standard package review can execute a bounded lightweight independent scope without losing fixed-snapshot/evidence guarantees.
2. Sensitive package review escalates from actual diff and preserves full local review.
3. No new Final Review Core Task exists.
4. `integration-verify` owns the System Verification stage semantics.
5. A system full review report is a committed Git artifact with mechanically validated routing/invalidation fields.
6. `local-close` findings can close in Codex with Fresh Isolated targeted review and scoped regression.
7. `system-rereview` defaults to targeted system re-review.
8. Full system re-review occurs only when `full_snapshot_invalidated=true`.
9. Runtime integration evidence remains distinct from semantic system review.
10. G4 cannot advance while required system verification blocking work remains open.
11. Accepted implementation binding and current review-chain integrity are not weakened.
12. No frozen A/B experiment is modified or rerun to implement this architecture.

---

## 14. Design decision summary

```text
Standard Package
→ Lightweight Independent Package Review

Sensitive Package
→ Full Local Independent Package Review

All Sprint Develop Merged
→ SYSTEM VERIFICATION

  A. System Full Independent Review
     → Git System Review Report
     → local-close / system-rereview

  B. Runtime Integration Verification
     → real runtime evidence
     → affected path re-test

→ all system findings closed
→ Manual Test
→ G4
```

The final policy is:

> **Package Review contains errors locally. System Review assures the whole system. Runtime Verification proves the running world. Revalidation follows invalidated conclusions, not change volume.**
