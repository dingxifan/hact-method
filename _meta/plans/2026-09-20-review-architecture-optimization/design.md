# HACT vNext — Review Architecture Optimization Design

> Status: Design Freeze Candidate  
> Scope: Review Architecture Optimization  
> Baseline: Stable HACT vNext mainline  
> Proposed branch: `hact/review-architecture-optimization`

---

## 1. Purpose

This document defines the target review architecture for HACT vNext after completion of the main vNext convergence work.

The optimization is intentionally separated from the preceding Task / Protocol / Runtime convergence effort.

Its governing principle is:

> **One Expensive Full Review, Local Closure by Default**

The objective is not to reduce review rigor indiscriminately.

The objective is to redistribute assurance responsibility so that:

- Package Review prevents local defects and contract violations from propagating;
- System Full Independent Review challenges the final integrated system once at system scope;
- Runtime Integration Verification proves real execution behavior;
- findings normally close at the narrowest valid authority boundary;
- repeated Full System Review occurs only when previous system-level conclusions have been materially invalidated.

---

# 2. Design Goals

The architecture MUST:

1. preserve reliable local defect containment;
2. reduce unnecessary repeated full-package independent review;
3. establish one explicit system-level semantic assurance point;
4. preserve real runtime verification as a distinct assurance source;
5. route every blocking system finding to an explicit closure authority;
6. make review findings and closure evidence Git Truth;
7. support deterministic targeted revalidation;
8. prevent routine fixes from causing repeated Full System Review;
9. preserve broad re-review when prior system-level assurance is genuinely invalidated;
10. avoid adding unnecessary Core Tasks or parallel review workflows.

---

# 3. Non-Goals

This optimization does NOT attempt to:

1. redesign PRD / UX / TRD / Plan Sprint;
2. redesign Gate topology;
3. introduce a new parallel `Final Review` Core Task;
4. broadly restructure Task / Protocol / Runtime architecture;
5. optimize Package Review to minimum token consumption in the first implementation;
6. redesign the complete severity taxonomy unless required by existing repository contracts;
7. run another Method A/B architecture experiment before basic implementation validation;
8. replace Human Authority, Manual Test, or Gate approval with AI review.

---

# 4. Core Architecture

The target assurance architecture has three distinct responsibilities.

```text
Package Review
    ↓
Local Error Containment

All Develop Packages Merged
    ↓

SYSTEM VERIFICATION
├─ Semantic / Holistic Independent Review
└─ Runtime Integration Verification
```

These responsibilities are complementary.

They MUST NOT be collapsed into one generic review mechanism.

---

# 5. Package Review Contract

## 5.1 Purpose

Package Review exists for:

> **Error Containment**

It does NOT provide final System Assurance.

A Package Review determines whether the package is safe to enter Accepted Project Truth and proceed into later integration.

At minimum it checks:

- package intent / oracle fulfillment;
- authorized scope compliance;
- obvious compatibility regressions;
- validity of required evidence;
- required target tests;
- sensitive-risk escalation;
- obvious defects that must not enter Accepted Project Truth.

---

# 6. Package Review Policy

Package review policy has two initial classes:

```text
standard
sensitive
```

The corresponding effective review modes are:

```text
standard
→ lightweight

sensitive
→ full-local
```

Only these two effective review modes are introduced in this design.

No `medium`, `enhanced`, or similar intermediate mode is defined.

---

## 6.1 Standard Package

A Standard Package receives a Lightweight Package Review.

`lightweight` means:

> narrower assurance responsibility

It does NOT mean:

> weak correctness checking.

The Lightweight Review remains responsible for local contract correctness and escalation detection.

---

## 6.2 Sensitive Package

A Sensitive Package retains a fuller local independent review.

Typical sensitive boundaries include:

- authentication;
- authorization;
- data isolation;
- irreversible migration;
- destructive data operations;
- billing / money / reconciliation;
- externally irreversible side effects;
- equivalent high-impact boundaries.

The final vocabulary and repository representation of sensitivity reasons MAY reuse existing HACT contracts where available.

---

# 7. Classification and Effective Review Mode

Package classification and actual review mode are separate truths.

Conceptual schema:

```yaml
review_policy:
  classification: standard

  sensitive_reasons: []

  escalation:
    occurred: false
    reasons: []

  required_review:
    mode: lightweight
```

Sensitive example:

```yaml
review_policy:
  classification: sensitive

  sensitive_reasons:
    - authorization

  escalation:
    occurred: false
    reasons: []

  required_review:
    mode: full-local
```

Development-time escalation example:

```yaml
review_policy:
  classification: standard

  sensitive_reasons: []

  escalation:
    occurred: true
    reasons:
      - authorization-boundary-discovered

  required_review:
    mode: full-local
```

A Standard Package MAY escalate to full local review.

The architecture does not depend on downgrading a package from sensitive to lightweight during the same lifecycle.

---

# 8. Core Task Identity

The existing Core Task identity:

```text
integration-verify
```

is retained.

Its semantic contract is expanded to:

> **System Verification**

No new parallel `final-review`, `system-review`, or `system-verification` Core Task is introduced solely for this architecture.

Therefore:

```text
integration-verify
Canonical Core Task ID

Semantic responsibility:
System Verification
```

This is semantic expansion without Core Task identity churn.

---

# 9. System Verification

System Verification contains two assurance lanes:

```text
SYSTEM VERIFICATION

A. Semantic / Holistic Independent Review

B. Runtime Integration Verification
```

They belong to the same system-level verification stage but use different evidence and cannot substitute for one another.

---

## 9.1 Semantic / Holistic Independent Review

This lane reviews the final Git candidate using:

- Product / Technical Contract;
- final implementation;
- architecture;
- cross-package consistency;
- ownership;
- shared contracts;
- compatibility;
- evidence sufficiency;
- call chains;
- state, permission, and lifecycle consistency.

Its purpose is to determine whether the integrated implementation is semantically and architecturally valid.

This lane may also request additional runtime evidence.

---

## 9.2 Runtime Integration Verification

This lane proves actual system behavior using real execution.

It covers, as applicable:

- API;
- queue;
- database;
- state machines;
- frontend/backend seams;
- external boundaries;
- real entry-to-terminal-state paths;
- failure;
- retry;
- recovery;
- affected runtime regression after repair.

Runtime Verification can discover new findings.

Runtime Verification does NOT independently certify broad semantic validity after system-level contract or architecture changes.

---

# 10. System Verification Is Not a Rigid Two-Step Pipeline

The two lanes are complementary and may exchange evidence.

Conceptually:

```text
Final System Candidate
        │
        ▼
┌──────────────────────────────┐
│      SYSTEM VERIFICATION     │
│                              │
│ Semantic / Holistic Review   │
│       │                      │
│       ├─ finding             │
│       │                      │
│       └─ runtime evidence ───────┐
│          request             │   │
│                               ▼  │
│                  Runtime Verification
│                               │
│                  runtime evidence/finding
└───────────────────────────────┘
        │
        ▼
Required Assurance Satisfied
```

Implementation MUST NOT assume that one lane can only start after the other has fully completed unless an existing repository contract requires that ordering.

---

# 11. System Finding Contract

All blocking findings created inside System Verification use one common finding model.

Conceptual schema:

```yaml
finding:
  id: F001

  origin: semantic-review
  severity: blocking
  category: compatibility

  summary: >
    ...

  evidence:
    - ...

  required_action:
    type: fix-code
    description: >
      ...

  closure:
    route: local-close

  revalidation:
    semantic:
      required: true
      scope:
        - affected-call-chain

    runtime:
      required: true
      scope:
        - target-runtime-path

  full_snapshot_invalidated: false
  invalidation_reason: null
```

---

# 12. Finding Origin

Supported conceptual origins include:

```text
semantic-review
runtime-verification
```

Origin identifies where the finding was first established.

Origin MUST NOT determine closure route.

A runtime finding is not automatically local.

A semantic finding is not automatically system-level.

---

# 13. Finding Category

Category is descriptive.

Examples MAY include:

- compatibility;
- shared-contract;
- architecture;
- authorization;
- state-machine;
- data-model;
- runtime;
- evidence.

Category MUST NOT directly determine review depth.

Review depth is determined by the scope of invalidated assurance conclusions.

---

# 14. Closure Routes

Every blocking System Verification finding MUST have exactly one effective closure route at a time.

The only routing classes introduced by this design are:

```text
local-close
system-rereview
```

No separate routing enums are created for:

```text
targeted-rereview
full-rereview
```

Those describe review depth, not closure authority.

---

# 15. Closure Route Means Closure Authority

This is a central architectural rule.

```text
local-close
→ closure authority belongs to valid local independent assurance

system-rereview
→ closure authority belongs to a System Reviewer event
```

Therefore Finding Routing is fundamentally:

> **Closure Authority Routing**

---

# 16. Local-Close

`local-close` is appropriate when:

- root cause is local;
- Product / Technical Contract does not materially change;
- shared contract does not materially change;
- major architecture does not change;
- affected scope is bounded;
- required revalidation scope can be stated;
- previous system-level assurance remains valid outside the affected scope.

Conceptual flow:

```text
System Finding
    ↓
local-close
    ↓
Codex repair
    ↓
Fresh Isolated Local Review
    ↓
Declared Semantic Revalidation
    ↓
Declared Runtime Revalidation, when required
    ↓
Closure Evidence
    ↓
closed
```

---

# 17. Minimum Local Closure Contract

A `local-close` finding cannot close unless all required closure evidence exists.

Minimum requirements:

1. a concrete repair candidate exists;
2. Fresh Isolated Review has completed;
3. declared semantic revalidation scope has been satisfied;
4. declared runtime revalidation scope has been satisfied when required;
5. required target/regression tests have actually run;
6. closure evidence is persisted as Git Truth.

Runtime revalidation is conditional.

It is required when:

```text
runtime scope is declared
OR
the repair changes runtime-observable behavior requiring proof
```

A local finding does not automatically require complete system-wide runtime verification.

---

# 18. Local Route Escalation

A `local-close` route remains valid only while the repair remains inside the assumptions that justified local closure.

If repair scope expands materially, local closure authority is revoked.

Examples include:

- shared contract changes;
- core state machine changes;
- authorization model changes;
- broad data model changes;
- unexpected multi-package redesign;
- substantial expansion of declared revalidation scope.

Flow:

```text
local-close
    ↓
repair exceeds locality assumptions
    ↓
route escalation
    ↓
system-rereview
```

A local route MUST NOT be used to close a repair that has escaped its authorized locality boundary.

---

# 19. System-Rereview

`system-rereview` is appropriate when repair may invalidate system-level semantic conclusions.

Typical examples:

- shared contract changes;
- core architecture changes;
- multiple packages change together;
- permission model changes;
- state-machine changes;
- broad data-model changes;
- material Contract revision.

Codex MAY:

- implement the repair;
- run local verification;
- satisfy local prerequisites;
- produce a fixed candidate.

Codex MUST NOT independently declare a `system-rereview` finding closed.

Closure requires a new System Reviewer event.

---

# 20. System-Rereview Does Not Mean Full Review

`system-rereview` defines closure authority.

It does NOT automatically define review depth.

A System Reviewer event can be:

```text
targeted
full
```

Default:

```text
system-rereview
+
full_snapshot_invalidated = false
→ targeted system re-review
```

Exception:

```text
system-rereview
+
full_snapshot_invalidated = true
→ full system re-review
```

---

# 21. Full Snapshot Invalidation

`full_snapshot_invalidated` means:

> the previous Full System Review can no longer serve as a valid system-level assurance baseline for the new candidate.

It does NOT mean:

- many files changed;
- a repair is large;
- multiple commits were created.

Broad invalidation typically includes:

- shared API/schema/event redesign;
- authorization model redesign;
- core state-machine redesign;
- broad data-model redesign;
- major architecture-path replacement;
- multi-package redesign;
- material Contract revision.

Review depth MUST be evidence-driven, not diff-size-driven.

---

# 22. Review Report Lifecycle

A System Review Report is:

> an immutable historical judgement over a specific candidate snapshot.

Recommended path remains conceptually:

```text
iterations/vN/system-review/
  review-001.md
```

Exact repository path remains subject to inventory confirmation.

Once published as Git Truth, a review report MUST NOT be rewritten to change the original judgement because later repairs occurred.

---

# 23. System Review Events

Every System Reviewer invocation produces a new review event.

Example:

```text
review-001
type: full

review-002
type: targeted

review-003
type: targeted

review-004
type: full
```

Sequence number does not encode review depth.

---

# 24. Local Closure Does Not Produce a System Review Event

Example:

```text
review-001
  F001 → local-close
```

After valid local repair and closure:

```text
F001 → closed
```

No `review-002` is created merely because local closure occurred.

This preserves the principle:

> One Expensive Full Review, Local Closure by Default.

---

# 25. Review Lineage

A targeted System Re-review MUST identify its predecessor and revalidation scope.

Conceptually:

```yaml
system_review:
  review_id: review-002
  review_type: targeted

  predecessor: review-001

  revalidation_of:
    - F003
```

A targeted review establishes assurance only for its declared scope and lineage obligations.

It MUST NOT implicitly claim that the entire system received another Full Review.

---

# 26. System Review Report Schema

Conceptual report-level structure:

```yaml
system_review:
  review_id: review-001

  review_type: full

  method_sha: ...

  candidate:
    base: ...
    head: ...

  predecessor: null

  revalidation_of: []

  scope:
    - final-contract
    - architecture
    - cross-package-consistency
    - evidence-sufficiency

  result:
    status: blocked

  evidence_state:
    status: sufficient

  findings:
    - F001
    - F002

  created_at: ...
```

Targeted example:

```yaml
system_review:
  review_id: review-002

  review_type: targeted

  method_sha: ...

  candidate:
    base: ...
    head: ...

  predecessor: review-001

  revalidation_of:
    - F002

  scope:
    - affected-shared-api
    - affected-consumers

  result:
    status: pass

  evidence_state:
    status: sufficient

  findings: []
```

---

# 27. Review Result and Evidence State

These are separate axes.

Conceptual values:

```text
result.status
→ pass | blocked

evidence_state.status
→ sufficient | insufficient
```

The following is invalid:

```yaml
result:
  status: pass

evidence_state:
  status: insufficient
```

Invariant:

> insufficient evidence cannot establish Review pass.

Evidence insufficiency is not equivalent to proof of implementation defect.

It means assurance has not yet been established.

---

# 28. Review Type

Only two review-depth concepts are introduced:

```text
full
targeted
```

No separate:

- initial;
- closure;
- focused;
- partial;

review types are introduced unless an existing repository contract requires vocabulary reuse.

---

# 29. Closure Evidence Is Additive

Original review judgement and later closure evidence are different truths.

Conceptually:

```text
Review Judgement
    ↓
Finding
    ↓
Repair Candidate
    ↓
Closure Evidence
```

The original Review Report remains unchanged.

The exact physical representation of closure evidence is deliberately NOT frozen here.

Repository inventory must first determine whether HACT already has an appropriate:

- history artifact;
- status record;
- review artifact;
- evidence record;
- append-only persistence pattern.

The design requirement is:

> original judgement is immutable; closure evidence is additive.

---

# 30. Local Closure Evidence Contract

Conceptual model:

```yaml
finding_closure:
  finding_id: F001

  source_review: review-001

  repair_candidate:
    base: ...
    head: ...

  route:
    expected: local-close
    effective: local-close

  local_review:
    completed: true
    reviewer_isolation: fresh-isolated
    result: pass

  semantic_revalidation:
    required_scope:
      - affected-call-chain

    verified_scope:
      - affected-call-chain

    result: pass

  runtime_revalidation:
    required: true

    required_scope:
      - target-runtime-path

    verified_scope:
      - target-runtime-path

    result: pass

  closure:
    result: closed
```

Escalation example:

```yaml
finding_closure:
  finding_id: F001

  source_review: review-001

  route:
    expected: local-close
    effective: system-rereview

  escalation:
    reason:
      - shared-contract-change

  closure:
    result: escalated
```

---

# 31. Finding Durable State

The architecture persists durable truth, not every transient execution step.

Minimum authoritative finding states:

```text
open
closed
escalated
```

The design intentionally does NOT require durable states such as:

```text
repairing
testing
reviewing
```

unless existing runtime architecture already requires them.

Those are normally execution moments, not long-lived project truth.

---

# 32. Finding State Semantics

## open

Required closure contract has not yet been satisfied.

## closed

All repair, review, semantic revalidation, runtime revalidation, and closure-authority requirements have been satisfied.

## escalated

The previous closure authority is no longer sufficient.

`escalated` is not a successful terminal state.

The finding ultimately still requires valid closure.

---

# 33. Runtime-Origin Findings

Runtime Integration Verification may discover new blocking findings.

All such findings use the same Finding Contract and Routing Contract.

Example:

```yaml
finding:
  id: F004
  origin: runtime-verification
  severity: blocking
```

A clearly local runtime defect MAY use:

```text
local-close
```

when locality and assurance assumptions are satisfied.

A runtime defect that affects system-level semantic assumptions MUST use:

```text
system-rereview
```

Runtime Verification cannot independently declare broad semantic validity after a shared-contract or architecture redesign.

---

# 34. Findings Discovered Before Review Publication

If runtime evidence is collected as part of the same initial System Verification cycle before the System Review Report is formally published, runtime findings MAY be included in that review judgement.

The finding origin remains:

```text
runtime-verification
```

---

# 35. Findings Discovered After Review Publication

If a new runtime finding appears after a System Review Report has become Git Truth:

- the existing report MUST NOT be rewritten;
- the new finding MUST be recorded additively;
- the normal Routing Contract applies.

Exact repository artifact naming remains an implementation decision after inventory.

---

# 36. System Verification Completion Contract

`integration-verify` / System Verification cannot complete merely because runtime tests are green.

Conceptually:

```yaml
system_verification_completion:

  final_candidate_identified: true

  semantic_review:
    required: true
    satisfied: true

  runtime_verification:
    required: true
    satisfied: true

  blocking_findings:
    open: 0
    escalated_unresolved: 0

  system_rereview_obligations:
    pending: 0

  required_revalidation:
    semantic:
      satisfied: true

    runtime:
      satisfied: true

  completion:
    allowed: true
```

System Verification is complete iff:

1. the final candidate is identified;
2. required system semantic review exists;
3. required runtime verification exists;
4. every blocking finding is validly closed;
5. no unresolved escalation exists;
6. no pending System Re-review obligation exists;
7. all required semantic revalidation scopes are satisfied;
8. all required runtime revalidation scopes are satisfied.

---

# 37. Full Review Does Not Need to Be Repeated Merely to End in PASS

The following is a valid successful lifecycle:

```text
review-001
type: full
result: blocked

F001
→ local-close
→ closed locally

F002
→ system-rereview
→ review-002
   type: targeted
   result: pass

Runtime Verification
→ satisfied

System Verification
→ complete
```

The architecture MUST NOT require:

```text
latest full review result = pass
```

Instead it requires:

> all findings from the Full Review have valid closure lineage and all current System Verification obligations are satisfied.

---

# 38. Full Re-review After Broad Invalidation

If a repair broadly invalidates the previous Full Review baseline:

```text
review-001
type: full
        ↓
repair causes broad invalidation
        ↓
review-002
type: full
```

`review-002` establishes a new full assurance baseline for the new candidate.

It is not merely an enlarged targeted review of the original finding.

---

# 39. Manual Test and Gate Authority

System Verification completion does not replace:

- Manual Test;
- product acceptance;
- Human Authority;
- Gate approval;
- user experience validation where required.

The target A-class flow remains conceptually:

```text
Develop Packages
→ Package Reviews
→ All Develop Merged
→ System Verification
→ All System Findings Closed
→ Manual Test
→ G4
```

---

# 40. Architecture Invariants

The following invariants are frozen by this design.

```text
INV-01
Package Review provides Error Containment, not final System Assurance.

INV-02
Standard packages default to Lightweight Review.

INV-03
Sensitive packages require Full Local Review.

INV-04
Standard packages may escalate to Full Local Review.

INV-05
Package classification and effective review mode are distinct truths.

INV-06
integration-verify remains the canonical Core Task identity.

INV-07
System Verification is the expanded semantic responsibility of integration-verify.

INV-08
System Full Independent Review is not introduced as a parallel Core Task.

INV-09
Semantic / Holistic Review and Runtime Integration Verification are distinct,
complementary assurance lanes.

INV-10
All blocking System Verification findings use one Finding Contract.

INV-11
Finding origin does not determine closure route.

INV-12
Each blocking finding has exactly one effective closure route at a time.

INV-13
Closure route identifies closure authority.

INV-14
local-close requires Fresh Isolated Local Review.

INV-15
Declared semantic revalidation scope must be satisfied.

INV-16
Declared runtime revalidation scope must be satisfied when required.

INV-17
If repair exceeds local-close assumptions, local closure authority is revoked.

INV-18
Revoked local-close authority escalates to system-rereview.

INV-19
system-rereview findings can only be closed by a System Reviewer event.

INV-20
system-rereview does not imply Full System Re-review.

INV-21
Full System Re-review occurs only after broad invalidation of previous
system-level assurance.

INV-22
Review depth is evidence-driven, not diff-size-driven.

INV-23
Published System Review Reports are immutable historical judgements.

INV-24
Closure evidence is additive.

INV-25
Every System Reviewer invocation creates a new review event.

INV-26
Local closure does not create a System Review event.

INV-27
Review sequence number does not encode review depth.

INV-28
Targeted Re-review declares predecessor and revalidation scope.

INV-29
Evidence insufficiency cannot establish Review pass.

INV-30
Durable workflow truth is persisted; transient execution moments need not be.

INV-31
Runtime-origin findings use the same Finding Routing and Closure contracts.

INV-32
Runtime Verification cannot independently certify broad semantic validity
after system-level redesign.

INV-33
integration-verify/System Verification cannot complete while any blocking
finding, escalation, rereview obligation, or required revalidation remains unresolved.

INV-34
System Verification completion depends on valid closure lineage, not on
repeating Full Review until a Full Review ends in PASS.
```

---

# 41. Implementation Phases

## Phase 1 — Review Contract Freeze

Deliver:

- Review Architecture Design;
- repository inventory;
- Current → Target mapping;
- proposed file change map;
- implementation sequencing.

No broad checker/runtime modification.

---

## Phase 2 — System Verification Contract Alignment

Align existing `integration-verify` semantics with System Verification.

Avoid Core Task topology inflation.

---

## Phase 3 — Finding Routing and Invalidation Model

Implement:

- `local-close`;
- `system-rereview`;
- revalidation scope;
- route escalation;
- full snapshot invalidation;
- closure authority.

---

## Phase 4 — Review Report and Runtime/Checker Wiring

Implement:

- System Review Report schema;
- Git Truth persistence;
- closure lineage;
- completion checking;
- runtime/checker enforcement.

---

## Phase 5 — Real A-Class Pilot

Run one real A-class iteration through:

```text
Develop Packages
→ Standard/Sensitive Package Reviews
→ All Develop Merged
→ System Verification
→ Finding Routing
→ Local/System Revalidation
→ Runtime Verification
→ Manual Test
→ G4
```

The pilot is used to tune actual Package Review weight.

It is NOT used to reopen the frozen architecture unless evidence shows a real contract defect.

---

# 42. Explicitly Deferred Implementation Decisions

The following must be resolved from repository inventory rather than invented in this design:

1. exact current location of Package Review policy;
2. exact representation of sensitive classification;
3. existing severity vocabulary;
4. existing `required_action` vocabulary;
5. exact `integration-verify` Task/Protocol/Runtime ownership;
6. existing review report schema and paths;
7. existing review round/history persistence;
8. whether a suitable append-only closure artifact already exists;
9. how current status serialization represents unresolved review obligations;
10. exact checker ownership for System Verification completion;
11. exact implementation of Fresh Isolated local review;
12. compatibility impact on historical iterations;
13. template/skeleton changes required;
14. migration or normalization needs for existing accepted truth.

No new mechanism should be created where an existing HACT mechanism can satisfy the same contract cleanly.

---

# 43. Design Freeze Condition

Phase 1 Design is considered frozen when:

- this architecture is accepted;
- repository inventory is complete;
- Current → Target mapping contains no unresolved architectural contradiction;
- implementation can proceed without inventing new review semantics.

Repository inventory MAY change file placement and implementation technique.

It MUST NOT silently change the frozen architectural invariants.

---

# 44. Final Principle

The target architecture is:

> **One Expensive Full Review, Local Closure by Default**

In operational terms:

```text
Package Review
→ contain local errors

System Full Independent Review
→ challenge the complete integrated system

Runtime Integration Verification
→ prove real execution behavior

Finding Routing
→ choose the narrowest valid closure authority

Broad invalidation
→ re-enter Full System Review only when previous system assurance no longer holds
```

The optimization succeeds only if it reduces duplicated assurance work without weakening closure correctness.
