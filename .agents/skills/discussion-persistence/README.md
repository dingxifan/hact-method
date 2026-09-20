# Discussion Persistence V1

A small reusable Skill for reliable discussion-to-Git persistence.

V1 uses the current repository's native writer or local repository execution.

It standardizes:

- project/repository resolution
- new-candidate vs incremental-candidate branch handling
- native/local Git truth resolution
- ordinary fast-forward delivery
- remote commit verification
- recovery after interrupted conversations

## Files

- `SKILL.md` — executable workflow instructions
- `agents/openai.yaml` — UI metadata; implicit invocation disabled
- `references/protocol.md` — V1 contract
- `references/recovery.md` — abnormal-path recovery rules
- `references/conformance.md` — native/local persistence regression cases
- `assets/project-config.example.yaml` — optional native repository configuration example

## Explicit invocation

The Skill is intentionally explicit because it can cause repository writes.

Examples:

- "Use Discussion Persistence to land the finalized design."
- "Persist this discussion to the current project."
- In Codex: explicitly select/invoke the installed skill.

## Active adapter

Native repository-write is used when authorized and sufficient. Local
repository-execution is required whenever the delivery depends on tests, hooks,
worktrees, builds, or an existing local diff; that same worktree commits and
pushes the verified diff.

Watcher/Dropbox material is archived experimental reference only. It is not an
adapter, a fallback, or a recovery path.

## Out of scope for V1

- new MCP server
- Watcher activation or rewrite
- generic queue platform
- automatic repo registration
- semantic content generation beyond the user's finalized artifact
