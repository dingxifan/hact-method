# Phase 2 — System Verification Contract Alignment

## Status

Contract alignment complete. No Phase 3 finding schema/routing implementation or Phase 4 checker/runtime wiring is included.

## Frozen decisions

1. `integration-verify` remains Core Task 9 and is the only canonical System Verification task.
2. `generate-integration-tests` remains an input alias and legacy serialization/runtime reference only.
3. System Verification has two complementary lanes:
   - Semantic / Holistic Independent Review;
   - Runtime Integration Verification.
4. The lanes may exchange evidence and need not form a rigid sequence, but neither can substitute for the other.
5. Package Review provides Error Containment:
   - standard classification → lightweight effective mode;
   - sensitive classification or actual-diff escalation → full-local effective mode.
6. Package classification, package effective mode, and System Reviewer event depth are separate truths.
7. Package Review does not provide final System Assurance; System Review does not replace package containment; runtime tests do not replace semantic review.
8. `integration-verify` reuses the existing task state machine and `status.yml tasks[]`: one `type=integration-verify`, `source=null` work item per iteration. Detailed findings and evidence remain referenced Git artifacts, not duplicated state.
9. `manual-test` is reachable only after both lanes and all current system obligations are satisfied for the same final candidate.
10. Existing `develop-review-round/v2` is not silently reinterpreted or rewritten. Until Phase 3 schema alignment, package effective mode is explicit in report prose; historical `mode=full` is not proof of target full-local review.

## Contract ownership after alignment

| Responsibility | Normative owner | Supporting realization / compatibility surface |
|---|---|---|
| Package classification and effective review mode | `tasks/develop.md` | package briefs, `runtime/codex.md`, legacy develop specs |
| Cross-review hierarchy and isolation | `protocols/review.md` | `templates/review-briefs/review-scope.md` |
| System Verification and completion authority | `tasks/integration-verify.md` | boot routing, runtime adapter, status contract |
| Canonical Task selection / triggered loading | `templates/boot-protocol.md` | boot fixture/test |
| Manual acceptance boundary | `tasks/manual-test.md` | structural/execution compatibility docs |
| Runtime realization | `runtime/codex.md` | existing integration result/evidence mechanisms |

## Design contradictions disposition

- DC-01 closed at contract level: the canonical task now requires the semantic review lane.
- DC-02 closed at contract level: active guides/skeleton routes use `integration-verify`; old spec filenames are explicitly non-normative compatibility references.
- DC-03 closed at contract level: the existing `tasks[]` state machine is selected; Phase 4 will wire checker/hook enforcement.
- DC-04 closed at contract level: runtime result remains distinct from immutable System Review events.

## Explicit non-actions

- no new Core Task;
- no new Gate;
- no new dynamic state machine or review ledger;
- no system finding/closure schema implementation;
- no `local-close | system-rereview` checker;
- no snapshot-invalidation checker;
- no system-review report parser;
- no G4 checker wiring;
- no historical backfill;
- no frozen A/B experiment edit or rerun.

## Validation

- canonical boot route fixture updated for System Verification signals;
- Task / Protocol / Runtime ownership reviewed for duplication;
- legacy integration name retained only where it is explicitly an alias, compatibility filename, history, or checker test for alias handling;
- `git diff --check`: PASS;
- `node scripts/check-paths.js`: PASS, 112 runtime files / 0 absolute-path findings;
- all 16 `templates/scripts/*.test.js` files: PASS;
- `node scripts/sync-method.test.cjs`: PASS;
- `node legacy-migration/normalize-legacy-project.test.cjs`: PASS;
- cross-document assertion: 12 canonical Tasks, package/system ownership aligned, triggered loading aligned, legacy refs bounded;
- the first boot-route regression run correctly failed on the old fixture signals; the fixture was updated to the new System Verification completion predicate and then passed;
- no Phase 3–4 implementation file added.

## Exit condition

Phase 2 is complete when the listed validation is green and the diff remains contract/document alignment plus its routing fixture. The next authorized phase is Phase 3 — Finding Routing and Invalidation; do not enter it automatically.
