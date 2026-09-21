# Second Fresh Targeted Re-review Fix Record

## Review identity

- Reviewed candidate: `53c0910c9e71aed1a16aa22562654dca13917805`
- Review type: Fresh Isolated Targeted Independent Re-review
- Result: `BLOCKED`
- `HRA-F001-R1`: closed
- `HRA-F004-R1`: remained open through one parser type-coercion path

## Remaining counterexample

Unquoted YAML:

```yaml
evidence:
  - git:<sha>
```

is parsed as an object rather than a string. The checker previously applied `String(pointer)`, producing `[object Object]`. A tracked file with that name could therefore satisfy staged and committed validation even though the declared evidence was a raw Git object expression.

## Fix

Evidence validation now rejects every item whose runtime type is not a non-empty string before trimming, raw-`git:` detection, path parsing, or Git Truth lookup.

Accepted evidence remains limited to project-relative regular-file paths read by `GitTruthReader` from:

- index in staged mode;
- HEAD in complete mode;
- worktree only in non-completing in-progress mode.

## New regression

The fixture now creates:

1. an ordinary tracked `[object Object]` decoy file;
2. an unquoted `git:<reachable-commit-sha>` evidence item;
3. staged validation, which must fail on evidence type;
4. committed validation, which must fail on the same evidence type.

The quoted loose/unreachable raw Git object regressions and all previous Git Truth/path tests remain active.

## Architecture boundary

No Task, Gate, state, route, depth, status, migration, method-sync, or frozen A/B contract changed.

## Validation

- `git diff --check`: PASS;
- `node scripts/check-paths.js`: PASS, 118 runtime files / 0 findings;
- all 17 `templates/scripts/*.test.js`: PASS;
- `node scripts/sync-method.test.cjs`: PASS;
- `node legacy-migration/normalize-legacy-project.test.cjs`: PASS;
- stable `main` and frozen A/B artifacts unchanged.
