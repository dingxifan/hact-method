# Review Architecture Optimization — Impact Matrix

Baseline: `main@a8cadefe2a2775e1ab5ccec3b15baad9d036b07b`

This document identifies where the design must eventually land. It is not an implementation diff.

| Area | Current role | Required change | Keep unchanged |
|---|---|---|---|
| `tasks/develop.md` | Every develop task requires independent review; current text reads as a heavy full package review | Split standard lightweight vs sensitive full local package review; explicitly move whole-system assurance out of package review | fixed candidate, evidence validity, accepted implementation binding, risk from actual diff, bounded re-review |
| `protocols/review.md` | Shared review mechanics and package review chain | Add review hierarchy, system-review semantics, finding routing, revalidation levels, invalidation contract | fresh isolation, same source of truth, immutable Git evidence, open finding closure |
| `tasks/integration-verify.md` | Runtime/system combination verification | Upgrade semantic responsibility to System Verification with two lanes: system semantic review + runtime integration verification; consume/persist system-review report | canonical task remains `integration-verify`; no new Final Review Task; real-runtime evidence remains required |
| `templates/boot-protocol.md` | Routes iteration state to canonical tasks | Route all-develop-merged state into System Verification semantics; load system-review artifacts only at that stage | one canonical task first, triggered loading, aliases separate |
| `runtime/codex.md` | Codex realization of develop/review/integration flows | Express standard lightweight package review, sensitive escalation, system-review Git handoff, local-close execution | repository execution boundaries, persistence routing, recovery from Git truth |
| `templates/status.yml` / `skeleton/07-status-contract.md` | Dynamic task/Gate/review state | Prefer no new root status ledger; if a pointer is needed, store only minimal system-review pointer/status derived from the integration-verify work item | existing task states and G1-G5 model |
| `templates/scripts/check-sprint.js` | Package review, staged audit, accepted implementation binding | Later ensure package review semantics and system report do not weaken accepted binding; avoid absorbing all new report validation here | current fixed diff/hash/blob binding and staged governance audit |
| New narrow checker candidate: `templates/scripts/check-system-review.js` | none | Recommended dedicated deterministic schema/chain checker for `iterations/vN/system-review/*.md` | do not create a new Task or dynamic state machine |
| `templates/scripts/pre-commit-hook.sh` | Routes staged files to relevant checkers | Later route system-review artifacts to the narrow checker | existing staged/index truth discipline |
| `templates/scripts/check-gate.js` | Gate mechanical boundary | Later ensure G4 readiness cannot ignore open System Verification blockers | Human Authority remains separate; no AI-created Gate |
| `tasks/manual-test.md` | User/acceptance verification after integration | Clarify input is completed System Verification, not merely package merge state | manual test remains user-facing acceptance, not system semantic review |
| `tasks/plan-sprint.md` | Creates package plan and risk declarations | Minimal/no structural change; risk declaration continues as input | task decomposition and G3 semantics |
| `specs-execution/*`, `specs-structural/*` | Older/parallel method material still distributed/readable | Inspect for conflicting active review semantics; align references or mark non-authoritative where needed | do not duplicate new normative contract across every legacy spec |
| Review report storage | no dedicated system-review Git artifact | Add `iterations/vN/system-review/review-NNN.md` schema/template | report is Git truth, not chat transcript |
| Frozen A/B reports/results | empirical baseline | no change | do not rerun/rewrite |

## Important implementation constraint

The implementation phase should prefer **responsibility movement over schema multiplication**.

In particular:

- do not create a second package-review ledger unless mechanically necessary;
- do not create a new Core Task merely to host system review;
- do not add a new Human Gate;
- do not make the system-review report a duplicate of `status.yml`;
- do not remove existing immutable candidate / review-chain protections in the name of lighter package review.
