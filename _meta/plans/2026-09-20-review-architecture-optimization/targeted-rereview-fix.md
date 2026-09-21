# Fresh Targeted Re-review Fix Record

## Review identity

- Reviewed fixed candidate: `02697b51c0abb6be606127e5e387382aecc670a7`
- Review type: Fresh Isolated Targeted Independent Re-review
- Result: `BLOCKED`
- Closed in review: `HRA-F002`, `HRA-F003`
- Remaining findings: `HRA-F001-R1`, `HRA-F004-R1`

## Finding assessment

Both remaining findings are valid deterministic false-pass paths.

### HRA-F001-R1 — Backward repair lineage

Previous closure validation proved only:

```text
repair_candidate.base <= repair_candidate.head
```

It did not prove:

```text
source finding candidate <= first repair candidate
prior closure repair candidate <= next repair candidate
```

This allowed an ancestor tree to be presented as a repair and allowed a later closure to omit an earlier escalation candidate.

Fix:

- embedded and standalone findings now retain their source candidate in checker state;
- first closure repair head must descend from the source finding candidate;
- every later closure repair head must descend from the immediately prior closure repair head;
- equality is allowed for evidence-only/no-code transitions, but ancestry cannot move backward or switch forks.

New regressions:

- blocked T1 + local “repair” T0 + final T1 → FAIL;
- escalation repair T2 + later closure repair T1 → FAIL;
- valid monotonic local/targeted/full closure chains remain PASS.

### HRA-F004-R1 — Loose Git object evidence

Raw `git:<sha>` evidence was accepted when the object database contained the SHA, even if the object was unreachable and absent from index/HEAD.

Fix:

- raw `git:<sha>` evidence is no longer accepted;
- evidence must be a project-relative regular file read through the authoritative Git Truth reader;
- staged validation requires the file in the index;
- complete validation requires the file in committed HEAD and rejects dirty/untracked authoritative truth;
- lexical containment, realpath containment, regular Git mode, and symlink/junction rejection remain enforced.

New regressions:

- unreachable loose blob referenced by staged System Review → FAIL;
- the same loose blob reference committed in a report → FAIL;
- existing untracked/index/HEAD/symlink/junction evidence cases remain covered.

## Architecture boundary

No frozen architecture invariant changed. In particular:

- `integration-verify` remains canonical;
- routes remain `local-close / system-rereview`;
- states remain `open / closed / escalated`;
- depths remain `full / targeted`;
- status remains pointers-only;
- Gate topology, migration policy, method-sync, and frozen A/B evidence remain unchanged.

## Validation

- `git diff --check`: PASS;
- `node scripts/check-paths.js`: PASS, 118 runtime files / 0 absolute-path findings;
- all 17 `templates/scripts/*.test.js` files: PASS;
- `node scripts/sync-method.test.cjs`: PASS;
- `node legacy-migration/normalize-legacy-project.test.cjs`: PASS;
- no frozen A/B artifact diff;
- stable `main` unchanged.

## Re-review boundary

The next Fresh Isolated Targeted Independent Re-review may focus on `HRA-F001-R1` and `HRA-F004-R1`, while consuming the complete regression result.
