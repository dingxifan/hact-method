# HACT vNext Review Architecture Optimization
## Codex Phase 1 — Repository Inventory & Contract Alignment Brief

### Objective

Start the `HACT vNext — Review Architecture Optimization` workstream from the stable vNext mainline.

Proposed branch:

```text
hact/review-architecture-optimization
```

Before creating the branch, confirm the exact stable mainline commit corresponding to the agreed `main@a8cadefe…` baseline.

Do not infer or substitute a different baseline silently.

---

# 1. Phase Boundary

This phase is:

> **Design + Contract Alignment / Repository Inventory**

It is NOT yet broad implementation.

Do NOT begin large checker/runtime rewrites.

Do NOT introduce a new `Final Review` Core Task.

Do NOT rename `integration-verify` unless repository evidence proves retention is impossible and the contradiction is documented for review.

The frozen target design is defined by:

```text
HACT-vNext-review-architecture-design.md
```

Treat that document as the target architecture contract.

---

# 2. Governing Principle

```text
One Expensive Full Review, Local Closure by Default
```

Key target semantics:

```text
Package Review
= Error Containment

System Verification
= Semantic / Holistic Independent Review
+ Runtime Integration Verification
```

Standard Package:

```text
Lightweight Package Review
```

Sensitive Package:

```text
Full Local Package Review
```

System finding closure routes:

```text
local-close
system-rereview
```

`system-rereview` does NOT automatically mean Full System Re-review.

---

# 3. Primary Task

Inspect the current repository and determine how the existing HACT vNext implementation represents and enforces:

1. Package Review;
2. package review depth;
3. sensitive/high-risk package handling;
4. Independent Review;
5. `integration-verify`;
6. runtime integration verification;
7. review rounds;
8. targeted re-review;
9. review report artifacts;
10. finding representation;
11. finding closure;
12. evidence persistence;
13. status/history serialization;
14. checker enforcement;
15. runtime completion logic;
16. template/skeleton generation;
17. historical compatibility.

Do not assume the architecture document's conceptual schemas already exist.

Map current truth first.

---

# 4. Required Inventory Areas

Inspect all relevant repository areas, including where applicable:

```text
tasks/
protocols/
runtime/
utilities/
templates/
specs-execution/
specs-structural/
skeleton/
guide/
checkers/
tests/
fixtures/
```

Use the actual repository structure if different.

Identify every file materially responsible for the current review lifecycle.

---

# 5. Package Review Inventory

Determine:

- where Package Review is defined;
- whether standard/sensitive classification already exists;
- whether high-risk package semantics already exist under another name;
- what fields control current review depth;
- what checker validates package review;
- what evidence Package Review must currently produce;
- how review completion is serialized;
- whether Package Review currently carries System Assurance responsibilities that must be removed or narrowed.

Output explicit Current → Target mapping.

Example form:

```text
Current:
<current behavior>

Owner:
<file / protocol / checker>

Target:
<target semantic>

Change:
retain | narrow | extend | replace | migrate

Phase:
2 | 3 | 4
```

---

# 6. integration-verify Inventory

Determine:

- canonical Task definition;
- related Protocol;
- Runtime implementation;
- checker ownership;
- inputs;
- outputs;
- completion conditions;
- evidence requirements;
- status serialization;
- references from templates/skeleton/guide;
- references from historical iteration artifacts.

Specifically test the design assumption:

```text
retain Core Task ID:
integration-verify

expand semantic contract:
System Verification
```

Report any concrete incompatibility with that approach.

Do not rename it merely for terminology consistency.

---

# 7. Independent Review Inventory

Determine how current HACT represents:

- full independent review;
- targeted re-review;
- review round numbering;
- blocking findings;
- advisory findings;
- evidence insufficiency;
- candidate SHA;
- reviewed base/head;
- method SHA;
- final review conclusions.

Identify which current mechanisms can be reused for:

```text
review_type:
  full | targeted
```

and which require new fields.

---

# 8. Finding Lifecycle Inventory

Determine whether current HACT already has durable concepts equivalent to:

```text
open
closed
escalated
```

Determine how findings are linked to:

- source review;
- repair candidate;
- re-review;
- evidence;
- final closure.

Identify whether closure currently rewrites original review truth.

If so, document the exact behavior.

Do not change it yet.

---

# 9. Git Truth / Persistence Inventory

Identify all current append-only or historical mechanisms that could support:

```text
immutable review judgement
+
additive closure evidence
```

Prefer reuse of existing history/evidence/status architecture.

Do not introduce a new parallel persistence subsystem during inventory.

Determine whether current repository truth already has an appropriate home for:

- closure evidence;
- routing escalation;
- revalidation evidence;
- unresolved rereview obligations.

---

# 10. Fresh Isolated Review Inventory

Determine how HACT currently achieves reviewer isolation.

Inspect whether there is an existing mechanism for:

- fresh reviewer invocation;
- isolated reviewer context;
- independent review subprocess;
- review runner;
- separate runtime context.

Report the strongest existing mechanism that could satisfy:

```text
Fresh Isolated Local Review
```

Do not invent a new isolation architecture until existing mechanisms are exhausted.

---

# 11. Runtime Verification Inventory

Determine:

- current runtime integration verification contract;
- required real-system evidence;
- target path representation;
- failure/retry/recovery evidence;
- how runtime findings are represented;
- whether runtime failures currently enter review findings or a separate mechanism;
- how targeted runtime revalidation is represented.

Map how runtime-origin blocking findings can enter the common target Finding Contract.

---

# 12. Completion Contract Inventory

Determine exactly how current `integration-verify` completion is established.

Identify whether completion currently depends on:

```text
tests pass
report exists
review result
status flag
checker result
```

or other evidence.

Map the changes required to support the target rule:

```text
System Verification cannot complete while:

blocking finding is open
OR
escalation is unresolved
OR
system-rereview is pending
OR
required semantic revalidation is missing
OR
required runtime revalidation is missing.
```

---

# 13. Historical Compatibility

Inspect existing completed iterations.

Determine whether the target schema would make historical accepted truth invalid merely because historical artifacts lack new fields.

Do NOT fabricate historical routing, review type, closure, or invalidation evidence.

If normalization is needed, distinguish:

```text
legacy accepted truth
new schema required for new iterations
```

from:

```text
new fields that can be safely derived from existing evidence
```

No fake backfill is permitted.

---

# 14. Required Deliverables

Produce the following before implementation begins.

## A. Repository Review Architecture Inventory

For each relevant file:

```text
path
current responsibility
relevant current fields/contracts
target responsibility
change required
implementation phase
```

---

## B. Current → Target Gap Matrix

At minimum include:

```text
Package Review responsibility
Standard/Sensitive policy
integration-verify semantics
System Review
Runtime Verification
Finding schema
Finding routing
Review report lifecycle
Closure evidence
Targeted/full re-review
Snapshot invalidation
System Verification completion
Historical compatibility
```

---

## C. Proposed File Change Map

Separate:

```text
Phase 2
System Verification Contract Alignment

Phase 3
Finding Routing / Invalidation

Phase 4
Report Schema / Runtime / Checker Wiring
```

For every proposed file change state:

```text
why this file changes
what contract changes
what must remain compatible
```

---

## D. Implementation Risks

Document at least:

- historical schema compatibility;
- duplicate truth risk;
- Core Task identity churn risk;
- review state duplication;
- checker/runtime semantic drift;
- reviewer isolation assumptions;
- report parsing brittleness;
- completion deadlocks;
- accidental Full Review escalation;
- accidental under-review of sensitive packages.

---

## E. Design Contradictions

If current repository reality conflicts with the frozen architecture, report it explicitly.

Use:

```text
DESIGN CONTRADICTION
Current truth:
Target contract:
Why incompatible:
Available options:
Recommended minimal resolution:
```

Do not silently resolve architectural contradictions during implementation.

---

# 15. Explicit Non-Actions

During this inventory phase, do NOT:

- perform broad checker rewrites;
- change review behavior across the repository;
- create a parallel Final Review task;
- replace current persistence architecture;
- backfill invented historical fields;
- optimize token use;
- weaken existing review gates merely because target Lightweight Review is planned;
- implement speculative schema fields before current repository vocabulary is known.

Small documentation-only or inventory-supporting changes are acceptable if required to record the findings.

---

# 16. Exit Condition

Phase 1 repository inventory is complete when:

1. every current review responsibility has an identified owner;
2. every target architecture responsibility has a mapped repository home or documented gap;
3. Current → Target matrix is complete;
4. proposed implementation files are identified;
5. compatibility risks are understood;
6. no unresolved architectural contradiction is being hidden;
7. implementation can start without inventing new review semantics.

Stop after producing the Phase 1 deliverables.

Do not proceed automatically into broad implementation unless explicitly instructed.

---

# 17. Expected Next Step

After inventory review and approval:

```text
Phase 2
System Verification Contract Alignment

→ Phase 3
Finding Routing + Invalidation

→ Phase 4
Report Schema + Runtime/Checker Wiring

→ Phase 5
Real A-class Pilot
```
