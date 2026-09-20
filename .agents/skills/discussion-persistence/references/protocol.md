# Native Repository Persistence Protocol

Persist finalized discussion artifacts through the active repository's native
write capability, or through local repository execution when verification needs
tests, hooks, worktrees, or the already-built local diff.

## Required truth

- repository and remote/provider identity
- base branch and exact remote base SHA
- target branch and commit message
- complete frozen repository-relative file set
- active write mechanism: native repository-write or local execution

Never infer these values. If native write is unavailable, local Git execution is
the only fallback. Do not select Dropbox, Watcher, a second connector, or a
reconstructed remote diff.

## Delivery

1. Lock the remote base SHA and validate branch policy.
2. Freeze and validate the exact artifact set.
3. If execution evidence is required, use the same local worktree to run it,
   commit the tested diff, and ordinary-fast-forward push that commit.
4. Otherwise use the authorized native repository writer and verify its returned
   commit against repository truth.
5. Verify remote branch, commit parent, and changed files.

No force push, history rewriting, automatic transport switching, or second
reconstructed copy of an already-tested worktree diff is permitted.

## Dormant experiment

`scripts/hact-watcher/` is not an execution route for this protocol. Its
Dropbox wire format, inbox, result files, and recovery model are experimental
historical assets. They may be reactivated only by a new explicit Method
decision; until then they must not be configured, submitted to, or used as a
fallback.
