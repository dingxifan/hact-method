# Phase 1 — Proposed File Change Map

This map identifies implementation homes only. It does not authorize Phase 2–4 implementation.

## Phase 2 — System Verification Contract Alignment

| File | Why it changes | Contract change | Must remain compatible |
|---|---|---|---|
| `tasks/integration-verify.md` | It is the canonical task but currently rejects a required independent semantic lane. | Define System Verification, its two lanes, their evidence exchange, and completion authority. | Keep Task ID, repair routing, real runtime evidence, external authority boundaries, and manual-test handoff. |
| `protocols/review.md` | Current protocol is package-oriented but already owns common review discipline. | Add Package vs System responsibility, system reviewer events, and closure-authority concepts. | Fresh isolation, fixed targets, same-source projection, evidence validity, bounded convergence. |
| `tasks/develop.md` | Current first review is always full and can imply system assurance. | Make standard review lightweight error containment and sensitive/escalated review full-local. | Fixed candidates, affected compatibility, required tests, blocking closure, sensitive Human Authority. |
| `templates/review-briefs/develop-review.md` | It implements the package scope. | Narrow standard scope and make escalation triggers explicit. | Actual-diff inspection and independent evidence. |
| `templates/review-briefs/review-scope.md` | It defines stage responsibility. | Place final semantic assurance at System Verification. | Existing trust and blocking-evidence rules. |
| `templates/boot-protocol.md` | It owns canonical routing and artifact loading. | Route all-develop-merged into System Verification and load system artifacts only then. | Alias handling and single canonical task loading. |
| `runtime/codex.md` | It realizes isolated review and runtime execution. | Describe system reviewer invocation and two-lane handoff without duplicating semantics. | Stay Local, capability gaps, fixed Git snapshot, recovery. |
| `tasks/manual-test.md` | Its precondition currently consumes runtime integration only in practice. | Require completed System Verification with both lanes satisfied. | Manual Test remains human/product acceptance and does not become system review. |
| `tasks/README.md` | Catalog description may need semantic clarity. | Describe `integration-verify` as System Verification. | Exactly 12 Core Tasks. |
| `skeleton/02-workspaces.md`, `skeleton/04-task-catalog.md`, `skeleton/06-gates.md`, `guide/00-核心概念.md`, `guide/02-一期完整流程.md`, `guide/04-开启下一版本.md`, `guide/99-任务速查表.md` | Distributed/readable surfaces still present the legacy alias as a task. | Canonicalize current guidance to `integration-verify`; keep old name only as documented alias. | Do not rewrite historical project artifacts or add a task/Gate. |
| `specs-structural/generate-integration-tests.md`, `specs-execution/generate-integration-tests.md` | They are a parallel legacy contract surface. | Convert to compatibility reference/retire through existing migration policy after current consumers are checked. | Preserve runtime verification knowledge until canonical task fully owns it. |

Phase 2 must stop if aligning these files appears to require a new Core Task, new Gate, or second dynamic state machine.

## Phase 3 — Finding Routing / Invalidation

| File | Why it changes | Contract change | Must remain compatible |
|---|---|---|---|
| `protocols/review.md` | No closure-authority route exists. | Add `local-close|system-rereview`, route escalation, review depth independence, and invalidation meaning. | Package finding actions remain valid in package scope. |
| `tasks/integration-verify.md` | System findings need common handling and authority. | Define origins, route choice, revalidation obligations, and unresolved conditions. | Existing `develop(source=integration)` and `revise-doc` repair owners. |
| `tasks/develop.md` / `specs-execution/develop.md` | Local-close repairs need an existing execution path. | Accept a system finding intake, produce fixed candidate and local review evidence, and escalate when locality fails. | Develop cannot close `system-rereview` findings or make product decisions. |
| `runtime/codex.md` | Runtime must realize fresh local review and system reviewer events. | Add isolated local closure and targeted/full system invocation inputs. | No same-context self-approval. |
| `templates/review-briefs/develop-review-round.md` | Package rounds may carry local closure evidence. | Add only the minimum prospective linkage if necessary; otherwise reference package rounds from closure artifacts. | Do not break `develop-review-round/v2` historical parsing. Prefer a new version only when unavoidable. |
| Proposed `templates/review-briefs/system-review.md` | No system event schema exists. | Define full/targeted event, fixed candidate, predecessor, scopes, result/evidence axes, and findings. | Event is immutable and distinct from runtime result. |
| Proposed `templates/review-briefs/system-finding-closure.md` or an equivalent sectioned artifact | No additive closure home exists. | Record repair candidate, expected/effective route, fresh local review, revalidation, escalation, and closure. | Do not duplicate task/Gate state or rewrite source review. |

## Phase 4 — Report Schema / Runtime / Checker Wiring

| File | Why it changes | Contract change | Must remain compatible |
|---|---|---|---|
| Proposed `templates/scripts/check-system-review.js` | No deterministic owner validates system events or closure lineage. | Validate schema, fixed Git objects, event numbering, predecessor, route, scope, invalidation reason, no finding disappearance, and completion obligations. | Must not absorb runtime scenario validation already owned elsewhere. |
| Proposed `templates/scripts/check-system-review.test.js` | New checker needs negative-first proof. | Cover stale candidate, missing route/scope, invalidation without reason, broken predecessor, silent finding removal, false pass, unresolved escalation, and valid local/targeted/full lifecycles. | Run alongside existing package/runtime regressions. |
| `templates/integration-result.md` | Runtime lane needs explicit linkage to system candidate and findings. | Add candidate/report/finding pointers and targeted runtime revalidation scope as needed. | Existing scenario evidence remains usable; report does not become semantic review. |
| `templates/scripts/check-integration-evidence.js` and tests | Current checker only checks row/evidence existence. | Validate new runtime linkage fields and declared revalidation scope. | Preserve existing evidence-path and not-run rules. |
| `templates/status.yml`, `skeleton/07-status-contract.md` | No deterministic resume/completion pointer exists. | Add the minimum System Verification work item/report pointer/obligation index, preferably reusing `tasks[]`. | One status entry point; no detailed duplicate finding ledger; prospective schema rule. |
| `templates/scripts/pre-commit-hook.sh` | System artifacts are not routed. | Route system event/closure changes to the dedicated checker. | Existing staged/index behavior and all current checker routes. |
| `templates/scripts/check-gate.js` and tests | G4 can currently pass without a semantic system-review artifact. | Require System Verification completion before G4 readiness. | Human Authority and manual acceptance remain separate. |
| `templates/boot-protocol.md` | Resume and routing need deterministic artifact signals. | Read the current system event/closure pointer and pending obligations. | Do not scan or infer historical evidence from absence. |
| `legacy-migration/normalize-legacy-project.cjs` and tests, only if live migration requires it | New fields may otherwise invalidate adopted projects. | Explicit opt-in/schema normalization without fabricated evidence. | Legacy accepted truth and historical files remain unchanged. |

## Regression set required before any pilot

- all existing `check-sprint` review, archive, worktree, ready, and governance tests;
- `check-integration-evidence` tests;
- `check-gate` tests;
- pre-commit routing tests;
- B-task admission tests;
- normalization tests;
- new system-review negative/positive lifecycle tests;
- verification that frozen A/B artifacts have no diff.
