---
name: discussion-persistence
description: Persist finalized discussion, design, specification, or document artifacts through the active repository's native Git write path. Use only when the user explicitly asks to save, persist, land, commit, or write back finalized work.
---

# Discussion Persistence

Use this skill only for finalized repository artifacts. It does not replace
normal implementation or expand user authority.

## Active contract

Use authorized native repository-write when it can perform the requested action.
When proof depends on a test, hook, worktree, build, or existing local diff, use
local repository-execution and commit/push from that same worktree. Never rebuild
that tested diff through a connector.

Read `references/protocol.md` before execution and `references/recovery.md` on
an uncertain result. Required inputs are repository identity, base/target branch,
exact base SHA, commit message, and frozen file set. Verify the resulting remote
commit, parent, branch, and changed files. Ordinary fast-forward only; never
force-push or rewrite history.

## Dormant Watcher

`scripts/hact-watcher/` and all Dropbox/Watcher wire formats are dormant
experimental assets. They are not a save/persist fallback and are not used by
normal recovery. Only a new explicit Method decision can reactivate them.
