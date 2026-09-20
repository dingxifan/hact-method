# Phase 1 — Repository Review Architecture Inventory

## 1. Scope and baseline

- Repository: `hact-method`
- Working branch: `hact/review-architecture-optimization`
- Branch head before this inventory: `4c3a7a3c4448422e1057bd3138d2fcacff35589f`
- Required stable mainline: `a8cadefe2a2775e1ab5ccec3b15baad9d036b07b`
- Verified merge-base: `a8cadefe2a2775e1ab5ccec3b15baad9d036b07b`
- Inventory contract: `codex-phase-1-inventory-brief.md`
- Frozen target contract: `design.md`
- Frozen A/B experiment artifacts: not read as implementation inputs, not changed, and not rerun.

The current vNext authority order matters to this inventory:

1. `tasks/{task}.md` is the normative Core Task contract.
2. `protocols/*.md` owns cross-task discipline.
3. `runtime/*.md` owns runtime realization only.
4. `templates/boot-protocol.md` owns canonical routing.
5. `specs-structural/`, `specs-execution/`, `skeleton/`, and `guide/` remain distributed/readable compatibility surfaces, but are not allowed to override the vNext Core Task catalog.

## 2. Current architecture summary

The repository already has a strong package-review substrate:

- fixed Git base/head or tree identities;
- reproducible binary-diff hashes and changed-file sets;
- Fresh Isolated Context review;
- first `full`, then `targeted` review rounds;
- stable finding ids and additive round files;
- explicit `pass | revise | evidence-needed` conclusions;
- package risk vocabulary `standard | sensitive`;
- accepted-implementation blob binding before merge;
- an indexed review archive reached through `status.yml`.

The repository does not yet have the target system-review substrate:

- no mandatory Semantic / Holistic System Review lane;
- no immutable `system-review/review-NNN.md` event contract;
- no common system finding schema with closure authority routing;
- no `local-close | system-rereview` route;
- no `full_snapshot_invalidated` decision;
- no additive system-finding closure artifact;
- no deterministic System Verification completion checker.

## 3. File-by-file inventory

| Path | Current responsibility and current contract | Target responsibility | Required change | Phase |
|---|---|---|---|---|
| `tasks/README.md` | Defines the 12-task vNext catalog and names `integration-verify` as Core Task 9. Rejects runtime-only task inflation. | Keep the catalog and Core Task identity unchanged. | Retain; add only concise System Verification wording if catalog descriptions need it. | 2 |
| `templates/boot-protocol.md` | Canonicalizes `generate-integration-tests` to `integration-verify`; routes all sprint tasks merged + integration missing to it. | Route the same ID into System Verification and load system-review artifacts only at that stage. | Extend routing signals and recovery inputs; do not add a task. | 2, 4 |
| `tasks/develop.md` | Every develop task receives first full independent review; `risk` controls sensitive coverage/Human Authority, not an explicit effective review mode. Package findings route to targeted fix/review. | Package Review becomes local error containment; standard defaults lightweight, sensitive/full escalation stays stronger. | Narrow assurance responsibility; separate classification from effective mode while retaining fixed candidate, evidence, and accepted-binding rules. | 2, 3 |
| `specs-structural/develop.md` | Defines `risk: standard | sensitive`, review artifacts, `code_reviews[]`, and full/targeted package completion. | Compatibility surface for standard/lightweight and sensitive/full-local policy. | Align terminology and fields after the normative Task/Protocol contract is stable; do not invent a second package ledger. | 2, 3 |
| `specs-execution/develop.md` | Realizes package review loops, targeted fixes, evidence-only rounds, package merge, and `source=integration` repair handoff. | Realize effective package review mode and local system-finding repair without absorbing System Reviewer authority. | Reuse current review/repair mechanics; add system-finding inputs and route escalation behavior later. | 3 |
| `protocols/review.md` | Owns Fresh Isolated Context, same-source projection, fixed review target, evidence validity, findings, targeted re-review, and bounded convergence. | Shared hierarchy for Package Review and System Review, closure authority, review lineage, and evidence-driven invalidation. | Extend rather than replace; keep isolation and evidence rules. | 2, 3 |
| `templates/review-briefs/review-scope.md` | Defines trust boundary, independent evidence, stage responsibility, blocking basis, and review convergence. | Continue as common scope discipline for package and system reviewers. | Retain; add system-scope projection only if needed, without duplicating the full target contract. | 2 |
| `templates/review-briefs/develop-review.md` | Package reviewer brief; checks contract/scope, compatibility, evidence, and diff-triggered specialties. | Lightweight package error-containment brief with sensitive escalation. | Narrow standard review responsibility; retain actual-diff risk discovery. | 2, 3 |
| `templates/review-briefs/develop-review-round.md` | Package round schema `develop-review-round/v2`: `full|targeted`, risk, prior report, target finding ids, immutable Git anchors, evidence-only rounds, `escalate_to_full`, and additive findings. | Remain package-review evidence; supply reusable patterns for system-review lineage without becoming the system report itself. | Retain schema for historical/package compatibility; do not repurpose it as system-review truth. | 2, 3 |
| `templates/review-briefs/develop-preflight-record.md` | Records package freshness against fixed Git base/tree. | Remain package preflight evidence. | No structural change expected. | 2 |
| `templates/scripts/build-review-anchor.js` | Generates package review rounds, carries open finding ids, anchors diffs, and chooses targeted/full after `escalate_to_full`. | Reusable implementation pattern for system event generation, but not automatically the same schema. | Retain package behavior; only factor common helpers if Phase 4 proves it reduces duplication. | 4 |
| `templates/scripts/check-sprint.js` | Validates package task schema, sensitive hints, review chain, real Git objects, diff hash/files, finding closure, archive integrity, and accepted implementation binding. | Continue package enforcement; do not become the sole System Review checker. | Adjust package-mode checks in Phase 3; keep current protections. | 3 |
| `templates/scripts/check-sprint.review.test.js` and related review/worktree/archive tests | Negative and positive coverage for fixed snapshots, full/targeted chains, evidence gaps, finding closure, archives, and recovery. | Regression shield for package review while system review is added. | Extend only for changed package policy; keep all current cases. | 3, 4 |
| `tasks/integration-verify.md` | Canonical integration task. Performs composition reconciliation and real runtime paths. Frontmatter is `review: none`; §7 says a second independent review is normally duplicate. Completion depends on current runtime/result evidence and closed integration findings. | Same Core Task becomes System Verification with two complementary lanes: semantic/holistic independent review and runtime integration verification. | Extend in place; replace the explicit no-review rule; add common system finding and completion semantics. | 2, 3 |
| `templates/integration-result.md` | Mutable runtime result table; a retest updates the original row's `复测` column. Human-readable; `status.yml integration_tests[]` is machine state. | Remain Runtime Integration Verification evidence, distinct from immutable semantic review events. | Clarify candidate identity and linkage; do not use this mutable artifact as the immutable System Review Report. | 2, 4 |
| `templates/scripts/check-integration-evidence.js` | Checks table shape, result enum, evidence path existence, and nonempty not-run reason. It does not validate candidate identity, findings, closure, or semantic review. | Continue runtime-evidence validation as one lane. | Extend only for runtime linkage required by System Verification; do not overload with semantic report validation. | 4 |
| `templates/scripts/check-integration-evidence.test.js` | Covers evidence presence and not-run explanation. | Runtime-lane regression coverage. | Add candidate/linkage and targeted runtime revalidation cases when contract lands. | 4 |
| `templates/status.yml` | Schema 1 contains Gates, develop work items, `integration_tests[]`, `code_review_archives[]`, and `code_reviews[]`. No explicit System Verification pointer/obligation structure is defined. | Existing state entry point should expose only the minimum pointer/status needed for deterministic resume/completion. | Reuse existing `tasks[]`/iteration state if possible; do not create a parallel review ledger. New fields apply prospectively. | 2, 4 |
| `skeleton/07-status-contract.md` | Normative schema explanation for status, integration items, package-review indexes, archives, and write events. Still names legacy integration task in write protocol. | Define the one authoritative serialization route for `integration-verify` and unresolved System Verification obligations. | Align schema and legacy names prospectively; explicitly preserve legacy accepted truth. | 2, 4 |
| `protocols/git-truth.md` | Requires important candidates for independent review/authority/cross-runtime use to bind immutable Git snapshots; persistence adapters cannot redesign artifacts. | Governs system candidate identity and immutable event persistence. | Retain; add only a system-review-specific reference if needed. | 2 |
| `runtime/codex.md` | Implements Fresh Isolated Context, fixed snapshot transfer, targeted re-review inputs, persistence, and recovery. | Realize both package review modes and the two System Verification lanes. | Extend adapter choreography without copying Task/Protocol semantics. | 2, 3, 4 |
| `tasks/manual-test.md` | Requires `integration-verify` `merged`, current integration result with no open blocker, and a known implementation snapshot. | Consume completed System Verification, including both lanes and closure lineage. | Change precondition/evidence wording; keep Manual Test and G4 authority separate. | 2, 4 |
| `templates/scripts/check-gate.js` | G4 checks manual-test repairs and acceptance report. G5 checks task closure. It does not inspect System Verification semantic review or pending system findings. | G4 readiness must not bypass incomplete System Verification. | Add a narrow call/check only after the system report checker exists. | 4 |
| `templates/scripts/pre-commit-hook.sh` | Routes package review records to `check-sprint`, status/Gate events to `check-gate`, and integration results to `check-integration-evidence`. | Route system-review and additive closure artifacts to a narrow checker. | Add path routing in Phase 4; retain staged/index truth discipline. | 4 |
| `skeleton/05-state-machine.md` | Four generic task states; `merged` is terminal; transient work stays `taken-by`. | Keep task state machine. System finding states remain artifact truth, not new task states. | No new task state; clarify separation if needed. | 2, 3 |
| `skeleton/04-task-catalog.md`, `skeleton/06-gates.md`, `skeleton/02-workspaces.md` | Legacy/distributed catalog still treats `generate-integration-tests` as a task and G4 input. | Reflect canonical `integration-verify` identity and System Verification responsibility. | Compatibility alignment only; do not create a new task or rewrite historical iteration artifacts. | 2 |
| `specs-structural/generate-integration-tests.md`, `specs-execution/generate-integration-tests.md` | Legacy runtime integration contract, mutable result/retest flow, and old task name. | Become an alias/compatibility surface pointing to canonical System Verification contract, or be retired through the repository's established migration rule. | Align references without maintaining a second normative system-verification contract. | 2, 4 |
| `guide/00-核心概念.md`, `guide/02-一期完整流程.md`, `guide/04-开启下一版本.md`, `guide/99-任务速查表.md` | User-facing flow still names the legacy integration task. | Present `integration-verify` as System Verification. | Documentation alignment after the normative contract is stable. | 2 |
| `legacy-migration/normalize-legacy-project.cjs` and tests | One-time normalization boundary; vNext daily runtime does not special-case historical Gate/task/schema shapes after normalization. | Preserve legacy accepted truth; new System Verification fields are prospective unless derivable from real evidence. | Add migration only if a live accepted project must opt in; never fabricate review/routing/invalidation evidence. | 4 |

## 4. Existing mechanisms selected for reuse

1. **Reviewer isolation:** `protocols/review.md` plus `runtime/codex.md` already define Fresh Isolated Context and fixed snapshot handoff. This is the strongest existing mechanism for Fresh Isolated Local Review and System Reviewer events.
2. **Immutable candidate binding:** `protocols/git-truth.md`, review round Git trees, diff hashes, and accepted blob binding are sufficient foundations.
3. **Targeted lineage:** `prior_report`, `target_finding_ids`, additive round files, and deterministic checks provide a proven pattern.
4. **Persistence entry point:** `status.yml` already acts as the sole machine entry point, while detailed review truth lives in Git artifacts reached by pointer.
5. **Runtime evidence:** `integration-tests/result-*.md`, evidence directories, and `check-integration-evidence.js` already carry the runtime lane.
6. **Task repair routing:** `develop(source=integration)` and `revise-doc` already separate code repair from contract revision.

## 5. Missing repository homes

The following target responsibilities have no current authoritative owner and therefore require explicit placement:

- System Review event template/schema: proposed `templates/review-briefs/system-review.md` or an equivalently narrow template.
- System finding closure evidence: proposed additive artifact under `iterations/vN/system-review/`, not a second status ledger.
- System Review deterministic validation: proposed `templates/scripts/check-system-review.js` plus focused tests.
- System Verification completion aggregation: owned normatively by `tasks/integration-verify.md`, mechanically by the system-review checker, and consumed by `check-gate.js`/boot routing.

## 6. Historical compatibility result

- The repository contains method templates and migration code, not authoritative completed project iterations.
- Current package-review history may use legacy reports, missing newer fields, or `verified-closed`; existing contracts explicitly preserve those files without backfill.
- The target system-review schema must be required only for newly declared System Verification cycles or projects explicitly migrated to the new method SHA.
- Absence of `review_type`, route, invalidation, or closure fields in historical iterations cannot be interpreted as evidence for any value.
- No historical routing, review, invalidation, or closure evidence may be synthesized.

## 7. Inventory completeness

Every current review responsibility has an owner, and every target responsibility now has either a reuse path or a documented new narrow home. The unresolved items are implementation placement/details, not missing review semantics.

| Phase 1 exit condition | Result | Evidence |
|---|---|---|
| Every current review responsibility has an owner | PASS | File inventory maps package review, system/integration task, runtime evidence, status, Gate, hook, migration, and compatibility surfaces. |
| Every target responsibility has a home or documented gap | PASS | Reuse list plus missing-home list maps all frozen responsibilities. |
| Current → Target matrix complete | PASS | `current-target-gap-matrix.md` covers all required areas. |
| Proposed implementation files identified | PASS | `proposed-file-change-map.md` is split by Phases 2–4. |
| Compatibility risks understood | PASS | `implementation-risks.md` records historical, persistence, checker, isolation, escalation, and completion risks. |
| No contradiction hidden | PASS | `design-contradictions.md` records four concrete conflicts and their bounded minimal resolutions. |
| Implementation can start without inventing review semantics | PASS | Frozen routes, review types, lanes, invalidation, and completion semantics all have owners; only bounded serialization/schema technique remains. |

**Phase 1 exit condition: satisfied.** Phase 2 must choose the exact existing-`status.yml` serialization shape before Phase 4 checker wiring, but this is an implementation contract choice rather than an unresolved architecture semantic.
