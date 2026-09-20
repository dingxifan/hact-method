# Discussion Persistence V1

A small reusable Skill for reliable discussion-to-Git persistence.

V1 intentionally does **not** add a new MCP server and does **not** replace the current local Watcher.

It standardizes:

- project/repository resolution
- new-candidate vs incremental-candidate branch handling
- one-shot publish submission
- uncertain acknowledgement handling
- Watcher result interpretation
- GitHub SHA verification
- recovery after interrupted conversations

## Files

- `SKILL.md` — executable workflow instructions
- `agents/openai.yaml` — UI metadata; implicit invocation disabled
- `references/protocol.md` — V1 contract
- `references/recovery.md` — abnormal-path recovery rules
- `references/conformance.md` — regression cases from real incidents
- `assets/project-config.example.yaml` — optional per-project configuration example

## Explicit invocation

The Skill is intentionally explicit because it can cause repository writes.

Examples:

- "Use Discussion Persistence to land the finalized design."
- "Persist this discussion to the current project."
- In Codex: explicitly select/invoke the installed skill.

## Current adapter

The existing Watcher already supports multiple registered repositories through `config.repos`, and can append to explicitly allowed candidate branches through `allowed_incremental_base_prefixes`.

Historical Watcher experiments used `hact.publish.v1`; it is dormant and is not
an active persistence wire format or fallback.

## Out of scope for V1

- new MCP server
- Watcher rewrite
- generic queue platform
- automatic repo registration
- semantic content generation beyond the user's finalized artifact
