---
name: discussion-persistence
description: Persist finalized discussion, design, specification, or document artifacts into a registered Git repository through the configured Dropbox-to-Git persistence adapter. Use only when the user explicitly asks to save, persist, land, commit, or write back finalized work. Do not use for brainstorming, unfinished drafts, or normal code implementation.
---

# Discussion Persistence

Use this skill to turn finalized discussion outputs into verified Git truth without changing their meaning during persistence.

## Scope

V1 is a workflow skill. It does not add a new MCP server and does not redesign the local Watcher.

The current adapter is:

`ChatGPT/Codex -> Dropbox -> local Watcher -> Git -> GitHub verification`

The Watcher may serve multiple repositories through its configured `repos` map.

## Non-negotiable principles

1. GitHub commit SHA is the final persistence truth.
2. An uncertain transport acknowledgement is not a persistence failure.
3. Never resubmit while submission outcome is indeterminate.
4. Watcher success is not completion until GitHub is verified.
5. Every submission has one unique `job_id`.
6. Never guess project, repository, base branch, base SHA, target branch, or allowed path.
7. Once the artifact set is finalized, persistence is mechanical. Do not redesign artifact content during transport or recovery.

Read `references/protocol.md` before executing persistence.
Read `references/recovery.md` whenever a tool call, upload acknowledgement, Watcher result, or verification step is abnormal.
Read `references/conformance.md` when changing this skill.

## Required inputs

Resolve these from explicit user instruction, repository truth, or project persistence configuration:

- project / repository identity
- Watcher repository key
- publish mode: `NEW_CANDIDATE` or `INCREMENTAL_CANDIDATE`
- base branch
- exact base commit SHA
- target branch
- commit message
- finalized file set: repository-relative path + complete content
- Dropbox adapter root

If any value cannot be proven, do not infer it. Stop at `PREPARING` with `CONFIG_REQUIRED` or `TRUTH_REQUIRED`.

## State model

Only these states are used:

- `PREPARING` — Git truth and artifacts are being resolved or built.
- `SUBMITTED` — exactly one publish package has been submitted.
- `INDETERMINATE` — submission was attempted but acknowledgement is not reliable.
- `EXECUTED` — Watcher produced a terminal result.
- `VERIFIED` — terminal result is confirmed against GitHub.
- `FAILED` — a terminal failure is proven.

Normal path:

`PREPARING -> SUBMITTED -> EXECUTED -> VERIFIED`

Uncertain acknowledgement:

`SUBMITTED -> INDETERMINATE -> EXECUTED -> VERIFIED|FAILED`

Proven terminal failure:

`SUBMITTED|INDETERMINATE -> EXECUTED -> FAILED`

Do not invent additional workflow states.

## Publish modes

V1 supports exactly two branch modes.

### `NEW_CANDIDATE`

Use when creating a new candidate from the configured primary base branch.

Requirements:

- `base_branch` equals the repository's configured primary base branch.
- `base_sha` equals the exact verified remote HEAD of that base branch.
- `target_branch` is a new or intended candidate branch allowed by `allowed_branch_prefix`.

### `INCREMENTAL_CANDIDATE`

Use when appending a new commit to an already verified candidate branch.

Requirements:

- `base_branch == target_branch`.
- The branch matches one of the repository's `allowed_incremental_base_prefixes`.
- `base_sha` equals the exact verified remote HEAD of that candidate branch immediately before submission.
- The publish must be an ordinary fast-forward append. Never force-push or rebuild prior candidate history.

Prefer `INCREMENTAL_CANDIDATE` when the current work is explicitly continuing an already established Shared Candidate Truth.

## Execution workflow

1. Lock Git truth.
   - Determine `NEW_CANDIDATE` or `INCREMENTAL_CANDIDATE`.
   - Read the repository and confirm the requested base branch.
   - Resolve the exact 40-character base commit SHA from the remote branch that will be extended.
   - For incremental mode, prove `base_branch == target_branch`, the branch matches `allowed_incremental_base_prefixes`, and `base_sha` equals the remote candidate HEAD.
   - Confirm the target branch naming rule and intended file paths.

2. Finalize artifacts.
   - Build the complete file set.
   - Validate paths, content completeness, and that no unintended files are included.
   - After this point, content is frozen unless a semantic error is discovered before submission.

3. Build one publish package.
   - Use one unique `job_id`.
   - For the current V1 Watcher, use wire schema `hact.publish.v1`.
   - Treat the `hact.*` schema name as a legacy adapter wire format, not as a restriction to HACT repositories.
   - Include: `repo`, `base_branch`, `base_sha`, `target_branch`, `task`, `commit_message`, and `files`.

4. Submit once.
   - Destination: `<dropbox_root>/inbox/<job_id>.publish.json`.
   - Never create a second job merely because an upload acknowledgement is missing.

5. Resolve transport outcome.
   - If the upload returns confirmed completion, remain `SUBMITTED`.
   - If the upload call was attempted but returns `FETCH_FAILED`, timeout, missing acknowledgement, or equivalent uncertainty, move to `INDETERMINATE`.
   - In `INDETERMINATE`, do not upload again. Inspect external state first.

6. Observe Watcher truth.
   - Inspect, in order as needed: `inbox`, `processing`, `results`, `done`, `failed`.
   - A terminal `results/<job_id>.result.json` establishes `EXECUTED`.
   - `status: success` requires GitHub verification.
   - `status: no_changes` requires checking that no new commit is expected.
   - `status: failed` is a proven terminal failure and must report its `stage` and `error`.

7. Verify GitHub.
   - For success, fetch the exact `commit_sha`.
   - Confirm repository, branch, and changed files.
   - For `NEW_CANDIDATE`, confirm the new commit descends directly from the submitted `base_sha` unless the adapter reports a verified recovery of the same request.
   - For `INCREMENTAL_CANDIDATE`, confirm `new_commit.parent == submitted base_sha`.
   - Only after these checks set state to `VERIFIED`.

8. Report.
   Always return:
   - project/repo
   - job_id
   - final state
   - target branch
   - commit SHA when present
   - changed files when present
   - failure stage/error when failed
   - whether any acknowledgement was indeterminate

## Forbidden recovery behavior

While state is `INDETERMINATE`, do not:

- resubmit the same package
- generate a new `job_id`
- change the target branch
- change publish mode
- rebuild artifacts
- switch transport mechanisms
- reinterpret an upload error as a Watcher or Git failure

First recover external truth using `references/recovery.md`.

## User authority

Persistence authorization does not create semantic authority.

If persistence reveals that the artifact itself is wrong, stop and return to semantic editing rather than silently changing it during the mechanical phase.
