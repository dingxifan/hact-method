# Final System Review Fix Record

## Review input

- Reviewed candidate: `4a0a7d46663db10482996842f4821e8883e37ec3`
- Review result: `BLOCKED`
- Findings: `HRA-F001`–`HRA-F004`
- Scope: deterministic enforcement and Git Truth binding only

## Assessment

All four blocking findings are valid and remain inside the frozen architecture.

| Finding | Assessment | Reason |
|---|---|---|
| HRA-F001 | valid blocker | Ancestor-only final-candidate validation allowed runtime-only/unreviewed commits to advance beyond semantic assurance. |
| HRA-F002 | valid blocker | System-rereview closure did not require reviewer scope and runtime result to cover the declared required scopes. |
| HRA-F003 | valid blocker | A local closure could point to an unrelated file containing only `conclusion: pass`. |
| HRA-F004 | valid blocker | Staged/complete validation read working-tree files and only partially required tracked/index evidence. |

The proposed direction is reasonable. The repair does not require a new Core Task, Gate, finding state, closure route, review depth, state machine, ledger, or historical backfill.

## Fix mapping

### HRA-F001 — Semantic assurance frontier

- System Reviewer candidates and valid closed repair candidates form the only assurance-advancing set.
- All assured candidates must be one comparable Git ancestry chain.
- The maximal assured candidate is the semantic frontier.
- Completion requires `final_candidate == semantic_frontier`.
- Runtime result alone cannot advance the frontier.

Regression coverage:

- review PASS T1 + runtime/final T2 without semantic closure → FAIL;
- blocked T1 + valid local-close repair T2 → PASS;
- forked assured candidates → FAIL.

### HRA-F002 — Required revalidation binding

- Any closed event requires semantic revalidation PASS covering required semantic scope.
- Required runtime revalidation must PASS and cover required runtime scope.
- System Reviewer event scope must cover required semantic scope.
- Runtime completion obligations derive from `required_scope`, not `verified_scope`.
- `integration-result/v2` must list the finding and cover required runtime scope.

Regression coverage includes missing reviewer scope, pending semantic revalidation, dropped verified runtime scope, and missing runtime-result scope.

### HRA-F003 — Local review/repair identity

- `local_review.task_id` added to the additive closure contract.
- Checker requires a unique same-iteration merged `develop(source=integration)` task.
- Report must be the task's current final `round-NN.md`.
- Report must be `develop-review-round/v2`, match task id, and conclude PASS.
- `reviewed_head` tree must equal `repair_candidate.head^{tree}`.
- Report body must reference the source system finding and every required semantic/runtime scope.

Regression coverage includes unrelated task/report, mismatched candidate tree, and non-integration repair source.

### HRA-F004 — Authoritative Git reader

- Added shared `git-truth-reader.js` for worktree/index/HEAD modes.
- Staged mode reads formal artifacts and evidence from the Git index.
- Complete mode reads committed HEAD and rejects dirty/untracked authoritative paths.
- In-progress non-staged mode may inspect working truth but cannot establish completion.
- Reader enforces lexical containment, realpath containment, regular Git blob mode, and symlink/junction rejection.
- Integration evidence checker now supports staged index truth.
- Merged status events invoke `check-system-review.js ... --staged` in complete semantics.

Regression coverage includes untracked System Review, untracked runtime evidence, worktree PASS versus index non-PASS, dirty committed truth, and symlink/junction escape.

## Frozen invariants

Unchanged:

- canonical Core Task `integration-verify`;
- Gate topology;
- task state machine;
- finding states `open / closed / escalated`;
- routes `local-close / system-rereview`;
- depths `full / targeted`;
- minimal-pointer status model;
- historical compatibility and no-backfill policy;
- method-sync and legacy-normalization semantics;
- frozen A/B experiment artifacts/results.

## Validation

- Node syntax checks for Git Truth reader, System Review checker, integration evidence checker, and Gate checker: PASS;
- `git diff --check`: PASS;
- `node scripts/check-paths.js`: PASS, 118 runtime files / 0 absolute-path findings;
- all 17 `templates/scripts/*.test.js` files: PASS;
- `node scripts/sync-method.test.cjs`: PASS;
- `node legacy-migration/normalize-legacy-project.test.cjs`: PASS;
- real staged pre-commit routing: PASS;
- committed G4 aggregation: PASS;
- no frozen A/B artifact diff;
- `main` unchanged during repair.

## Re-review boundary

The repair is confined to HRA-F001–HRA-F004 and supporting tests/documentation. A Fresh Isolated Targeted Independent Re-review may review the fixed candidate against these four findings while consuming the full regression result.
