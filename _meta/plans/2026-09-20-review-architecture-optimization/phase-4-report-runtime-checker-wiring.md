# Phase 4 — Report, Runtime, and Checker Wiring

## Status

Deterministic System Verification report/runtime/status/hook/G4 wiring is implemented. No real A-class pilot was started.

## Implemented contracts

### System Review checker

`templates/scripts/check-system-review.js` owns deterministic validation for `review_architecture=system-verification/v1`:

- exactly one `integration-verify` task per iteration;
- adopted Method SHA and real project commit candidates;
- contiguous immutable `review-NNN` events;
- full/targeted predecessor and revalidation lineage;
- result/evidence-state legality;
- stable, unique system findings with one route;
- post-publication runtime finding artifacts;
- additive closure/escalation sequence;
- Fresh Isolated Local Review evidence;
- semantic/runtime required versus verified scope;
- `system-rereview` closure by a new passing System Reviewer event only;
- broad invalidation reason and Full System Re-review;
- no silent finding disappearance;
- final candidate ancestry and runtime-result linkage;
- open/escalated/pending obligations block completion;
- staged modification/deletion/rename of published System Review artifacts is rejected.

The checker has two modes:

- default complete mode for `integration-verify=merged` and G4 readiness;
- `--in-progress` for structurally valid open review/finding chains;
- `--staged` adds index/immutability/evidence checks for the pre-commit route.

It does not perform semantic review or run runtime scenarios.

### Runtime evidence linkage

`integration-result/v2` now binds:

- iteration;
- final candidate;
- system-review directory and current event;
- revalidated finding ids;
- runtime scope;
- result status and evidence state;
- ISO event time.

`check-integration-evidence.js` preserves legacy table validation and, when v2 is present or System Verification requires it, validates linkage, scope, evidence sufficiency, and that failed/blocking-unrun scenarios cannot establish `satisfied`.

### Minimal status pointer

`status.yml` keeps one machine entry point:

- top-level adoption marker: `review_architecture: system-verification/v1`;
- one per-iteration `type=integration-verify`, `source=null` task;
- only `system_review_dir`, `current_system_review`, `integration_result`, and `final_candidate` pointers.

Finding state is derived from immutable/additive Git artifacts. It is not copied into status.

### Hook and Gate wiring

- pre-commit routes `iterations/vN/system-review/**` to the checker in staged in-progress mode;
- a newly merged `integration-verify` status event runs complete mode;
- G4 for an adopted Review Architecture project requires exactly one merged system task and a green complete checker;
- G5 task closure includes `integration-verify`;
- legacy projects without the adoption marker retain the prior path and receive no fabricated System Review evidence.

## Negative and positive fixtures

The new System Review suite covers:

- stale/forked final candidate;
- missing/invalid closure route;
- invalidation without reason;
- targeted event without valid predecessor;
- system-rereview without finding scope;
- later PASS attempting to hide an open finding;
- unresolved escalation;
- dropped semantic revalidation scope;
- valid local-close;
- valid targeted system-rereview;
- post-publication runtime finding using the common lifecycle;
- local-close escalation followed by targeted closure;
- valid Full System Re-review after broad invalidation;
- staged mutation of an immutable published event;
- actual pre-commit routing;
- positive G4 consumption of a complete System Verification chain.

## Historical compatibility

- The adoption marker is prospective.
- A missing marker remains legacy; the checker does not infer new evidence.
- Legacy normalization still copies status bytes exactly and does not add the marker.
- Existing `integration-result` files without v2 frontmatter retain their previous standalone evidence validation, but cannot satisfy new System Verification completion.
- Existing package review schema and history are unchanged.

## Validation

- Node syntax checks for system-review, integration-evidence, and Gate checkers: PASS;
- `git diff --check`: PASS;
- `node scripts/check-paths.js`: PASS, 117 runtime files / 0 absolute-path findings;
- all 17 `templates/scripts/*.test.js` files: PASS;
- `node scripts/sync-method.test.cjs`: PASS;
- `node legacy-migration/normalize-legacy-project.test.cjs`: PASS;
- pre-commit shell syntax and actual System Review routing: PASS;
- positive G4 consumption of a complete System Verification chain: PASS;
- legacy G4 path without adoption marker: preserved;
- frozen plan and A/B experiment paths: unchanged.

## Explicit non-actions

- no real project migration or distribution;
- no historical field/evidence backfill;
- no new Core Task, Gate, state machine, database, or review ledger;
- no frozen A/B experiment edit or rerun;
- no real A-class pilot;
- no push or mainline merge.

## Exit condition

Phase 4 is complete when the new checker suite and all existing repository regressions pass, frozen plan/experiment artifacts remain unchanged, and `integration-verify` completion/G4 readiness cannot be established by semantic review alone, runtime evidence alone, or a bare status flag.

The next phase is Phase 5 — one real A-class pilot, only after explicit authorization and project selection.
