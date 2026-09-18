# V1 Protocol

## Purpose

This protocol makes discussion-to-Git persistence deterministic enough for daily use without building a new infrastructure platform.

It deliberately reuses the existing multi-repository Watcher.

## Project registration

A repository is executable only when it is registered in the local Watcher configuration.

The Watcher currently supports a `repos` mapping. Each entry supplies:

- `git_url`
- `base_branch`
- `allowed_branch_prefix`
- `allowed_incremental_base_prefixes`
- `allowed_paths`
- `checks`

V1 does not modify that model.

The skill may be generic even when only some repositories are registered locally.

If a requested repository is not registered, return `CONFIG_REQUIRED`. Do not substitute another repo or local path.

## Wire contract

The current Watcher expects:

```json
{
  "schema": "hact.publish.v1",
  "job_id": "unique-job-id",
  "repo": "registered-repo-key",
  "base_branch": "main",
  "base_sha": "40-character-sha",
  "target_branch": "allowed/prefix/branch",
  "task": "short-work-type",
  "commit_message": "single-line commit message",
  "files": [
    {
      "path": "relative/path.md",
      "content": "complete file content"
    }
  ]
}
```

`hact.publish.v1` is the existing Watcher wire schema. V1 keeps it unchanged to avoid unnecessary Watcher work.

## Publish modes

### NEW_CANDIDATE

Use the repository's configured primary base branch:

```text
base_branch = configured primary base branch
base_sha    = verified remote HEAD of base_branch
target_branch = allowed candidate branch
```

### INCREMENTAL_CANDIDATE

Append to an existing verified candidate:

```text
base_branch   = target_branch
base_sha      = verified remote HEAD of that candidate
target_branch = same candidate branch
```

The candidate must match `allowed_incremental_base_prefixes`.

The Watcher must treat an existing candidate exactly at `base_sha` as a valid append point rather than a recovery collision.

The resulting push must be a normal fast-forward push. Force-push is outside V1.

## Six core rules

### 1. GitHub SHA is final truth

Dropbox receipt, Watcher logs, and result JSON are evidence, but successful persistence is only complete when the returned commit can be verified in GitHub.

For incremental mode, verification also proves that the new commit's direct parent equals the submitted `base_sha`.

### 2. Uncertain acknowledgement is not failure

Transport errors such as `FETCH_FAILED`, missing completion acknowledgement, or timeout after submission attempt mean the acknowledgement is uncertain.

State becomes `INDETERMINATE`.

### 3. No duplicate submit while indeterminate

Do not submit again until external state proves that no job exists and retry is safe.

The current Watcher has request hashing and job-id collision handling, but the skill must still avoid unnecessary duplicate attempts.

### 4. Watcher success still needs verification

`result.status = success` means the executor reports success.

The skill must fetch `commit_sha` from GitHub before reporting `VERIFIED`.

### 5. One unique job ID per semantic publish attempt

A corrected payload is a new semantic attempt and gets a new job ID.

A missing acknowledgement is not a corrected payload and does not get a new job ID.

### 6. Project facts are never guessed

Repo key, base branch, exact base SHA, branch prefix, and paths must come from authority: user instruction, repository truth, or configuration.

## Artifact freeze

The persistence phase starts only after file content is finalized.

After submission, content is immutable for that job.

If a semantic defect is found, finish recovery of the current job first, then create a new corrected attempt if needed.

## Terminal result meanings

### success

Watcher created or recovered a pushed commit.

Next action: verify the exact commit in GitHub.

### no_changes

The submitted file contents created no Git diff.

Next action: verify that the current repository truth already contains the intended content. No new commit is expected.

### failed

Watcher produced a terminal failure.

Report:
- `stage`
- `error`
- repository/branch fields when present

Do not collapse all failures into "upload failed".
