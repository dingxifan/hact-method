# Phase 3 — Finding Routing and Invalidation

## Status

Finding lifecycle, closure authority, route escalation, review depth, and full snapshot invalidation contracts are aligned. Deterministic checker/hook/G4 wiring remains Phase 4.

## Frozen routing model

### One common blocking finding contract

Semantic Review and Runtime Verification findings use the same system contract. Origin is retained but does not choose closure authority.

Minimum durable truth:

- stable finding id;
- origin and category;
- evidence and required action;
- exactly one effective route;
- semantic/runtime revalidation scope;
- full snapshot invalidation decision and reason;
- state derived from immutable source plus additive events.

### Closure routes

- `local-close`: bounded local repair, Fresh Isolated Local Review, declared semantic revalidation, required runtime revalidation, and additive closure event.
- `system-rereview`: repair may invalidate system-level conclusions; only a new System Reviewer event can authorize closure.

Route is closure authority. It is separate from review depth.

### Route escalation

When a local repair exceeds its locality assumptions:

```text
local-close
→ escalated
→ system-rereview
```

The escalation event records the actual boundary escape. The repair cannot retain local closure authority by expanding its own scope.

### Review depth and invalidation

- `system-rereview + full_snapshot_invalidated=false` → targeted by default.
- `system-rereview + full_snapshot_invalidated=true` → Full System Re-review.

Invalidation requires named prior system conclusions that no longer hold. Diff/file/commit size is not sufficient evidence.

### Durable states

- `open`
- `closed`
- `escalated`

`escalated` is not successful completion. Current state is derived from immutable source finding plus ordered additive closure/escalation events; no parallel state ledger is introduced.

## Artifact placement

| Artifact | Path | Schema | Mutability |
|---|---|---|---|
| System Reviewer event | `iterations/vN/system-review/review-NNN.md` | `system-review/v1` | immutable after publication |
| Post-publication runtime finding | `iterations/vN/system-review/findings/{finding-id}.md` | `system-finding/v1` | immutable after publication |
| Closure/escalation event | `iterations/vN/system-review/closures/{finding-id}/closure-NNN.md` | `system-finding-closure/v1` | immutable after publication |

Runtime findings discovered before review publication are embedded in that review event with `origin=runtime-verification`; only later findings need the standalone artifact.

## Reuse decisions

- Existing `develop(source=integration)` remains the repair owner.
- Existing task package fields carry source finding, route, locality, revalidation, and escalation references; no second repair schema is added.
- Existing Fresh Isolated Package Review can satisfy Fresh Isolated Local Review when it explicitly covers the source system finding and required scope.
- Existing fixed Git candidate and package evidence remain inputs; they do not independently close a system finding.
- `integration-verify` remains the lifecycle owner that completes remaining revalidation and appends closure/escalation events.
- Existing `develop-review-round/v2` is not changed; system closure artifacts reference it.

## Historical compatibility

- No historical system route, review depth, invalidation, or closure is backfilled.
- Historical package `verified-closed/advisory` remains package truth and is not normalized into system states.
- The new schemas apply prospectively to Review Architecture System Verification cycles.
- A missing historical field means unknown/not-applicable under the old method, never inferred evidence.

## Explicit non-actions

- no system-review checker/parser;
- no hook routing;
- no Gate checker change;
- no runtime completion automation;
- no status pointer fields beyond the Phase 2 contract direction;
- no Package Review checker enum migration;
- no new Core Task, Gate, state machine, database, or review ledger;
- no frozen A/B experiment edit or rerun.

## Validation

- `git diff --check`: PASS;
- `node scripts/check-paths.js`: PASS, 115 runtime files / 0 absolute-path findings;
- cross-contract assertion: exactly two routes, three blocking durable states, full/targeted depth separate, required artifact schemas present, develop/system closure authority aligned;
- Phase 4 boundary assertion: no `check-system-review`, `check-gate.js`, pre-commit hook, status wiring, or boot fixture change;
- `check-codex-project.test.js`: PASS;
- `check-sprint.review.test.js`: PASS;
- `check-integration-evidence.test.js`: PASS;
- `check-gate.test.js`: PASS;
- `sync-method.test.cjs`: PASS;
- `normalize-legacy-project.test.cjs`: PASS.

## Exit condition

Phase 3 is complete when route choice, local closure, escalation, system-rereview authority, targeted/full depth, invalidation, durable state, artifact placement, and historical compatibility are mutually consistent across Task, Protocol, Runtime, repair flow, and templates. Phase 4 may then implement deterministic report/checker/runtime wiring without inventing new review semantics.
