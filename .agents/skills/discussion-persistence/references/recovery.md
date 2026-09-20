# Native Repository Persistence Recovery

Recover from Git and provider facts, never from chat memory or a transport
substitution.

1. Read the target remote branch and exact HEAD commit.
2. Inspect the current local worktree/index when local execution was used.
3. If a native repository write was attempted, inspect that provider's returned
   commit/branch state.
4. Compare the intended frozen file set and expected parent SHA to actual Git
   objects.

If completion is uncertain, report it as indeterminate and preserve the frozen
artifact set. Do not automatically retry through another connector, Dropbox, or
Watcher; do not create a second reconstructed diff; do not force push, rebase,
or change target branch. A later explicit retry begins only after remote Git
truth establishes a safe base.

`scripts/hact-watcher/` is dormant experimental material, not a recovery path.
