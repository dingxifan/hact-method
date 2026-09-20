# HACT Watcher v0.1.2-experimental

> **Status: dormant experimental asset (R2.4).**
>
> This Watcher is **not part of the active HACT execution path**. Do not configure,
> start, or select Dropbox/Watcher as a normal fallback. It is retained as a
> historical/tested prototype from the period when the active ChatGPT runtime had
> no native repository-write capability. R2.4 prefers an authorized native
> repository connector for remote writes, and a real local Git environment for
> repository execution. Reactivation requires a new explicit methodology decision.

HACT Watcher is a small, deterministic local publisher:

```text
ChatGPT Pro -> Dropbox /HACT/inbox -> Windows HACT Watcher -> dedicated Git clone -> commit + push
```

It is not an AI agent. A publish package contains only metadata and literal file
content; it cannot carry a shell command, checker command, hook, or script path.

## Requirements

- Node.js 20 or newer (the PoC was tested with Node.js 24)
- Git available on `PATH`
- Dropbox desktop sync for the local `HACT` directory
- GitHub credentials that normal `git clone` and `git push` can use (Git
  Credential Manager, `gh auth login`, or SSH)

Never put a token in config or a publish package.

## Configure and start

Copy `config.example.json` to `config.json` in this directory and replace the
two paths. `dropbox_root` is the local path for `HACT` itself, for example
`C:/Users/Alice/Dropbox/HACT`.

`repos_root` must be an empty, dedicated directory on its first Watcher run,
such as `C:/Users/Alice/.hact/repos`. The Watcher creates a marker there and
clones repositories below it. Do not point it to any Codex development checkout.

The example uses `"allowed_paths": ["**"]`, permitting any ordinary repository
path. Absolute paths, parent traversal, `.git/**`, and `.github/**` remain
hard-rejected. Narrow the list again when a repository needs a smaller write
surface.

Run in a foreground terminal while testing:

```powershell
node watcher.mjs --config config.json
```

It creates `inbox`, `processing`, `results`, `done`, and `failed` below the
configured Dropbox root, then scans `inbox/*.publish.json` every five seconds.
Do not configure it as a Windows Service yet.

Only one Watcher may run for a given local `dropbox_root`. A second startup
fails clearly while the first process is alive. Its local runtime lock records
the host and PID; a lock left by a dead process is recovered automatically.

## Publish package

Save this as `HACT/inbox/20260917-001.publish.json`:

```json
{
  "schema": "hact.publish.v1",
  "job_id": "20260917-001",
  "repo": "hact-method",
  "base_branch": "main",
  "base_sha": "aebdb22e7d0b979cf488879d8c53d1946269bf62",
  "target_branch": "hact/chat/20260917-001",
  "task": "poc",
  "commit_message": "hact: Dropbox watcher PoC",
  "files": [{
    "path": "reports/_poc/dropbox-watcher.md",
    "content": "# HACT Watcher PoC\\n\\nPublished from ChatGPT through Dropbox.\\n"
  }]
}
```

Validation happens before an atomic move from `inbox` to `processing`, which is
the simple claim mechanism. Successful packages move to `done`; failures move
to `failed`.

`base_sha` is required and must be the exact 40-character SHA that ChatGPT saw
for `origin/<base_branch>`. After `git fetch origin`, the Watcher compares it
before checkout, writing files, committing, or pushing. A mismatch fails at
`precondition` without publishing an artifact.

### Current base-branch limitation

Watcher v0.1.2 validates `job.base_branch` against the repository's configured
`base_branch`. In the current HACT setup that configured branch is `main`, so a
publish package cannot use a prior candidate branch as its base.

When a cumulative candidate has not been merged to `main`, publish the next
candidate from the current `main` SHA and include the complete desired candidate
file set again, plus the new changes. The resulting target branch represents
the new cumulative snapshot even though its Git parent is `main`.

This is a Watcher / persistence-adapter limitation, not a HACT Git Truth rule.
Do not change `watcher.mjs` merely to make an incremental candidate chain unless
that infrastructure change is separately authorized and reviewed.

## Result package

The successful result at `HACT/results/<job_id>.result.json` is:

```json
{
  "schema": "hact.result.v1",
  "job_id": "20260917-001",
  "status": "success",
  "repo": "hact-method",
  "branch": "hact/chat/20260917-001",
  "request_sha256": "9a3a...",
  "commit_sha": "abc123...",
  "changed_files": ["reports/_poc/dropbox-watcher.md"]
}
```

Every result records `request_sha256`, calculated from the original publish
file bytes. The same `job_id` plus the same hash is skipped safely. The same
`job_id` plus a different hash is a `job_id collision`: it is archived in
`failed` and a separate collision result is written without replacing the
original result. No changed content yields `status: "no_changes"` without an
empty commit.

### ChatGPT Dropbox connector status caveat

Observed with the current ChatGPT Dropbox connector: the publish file can
already be present in Dropbox and can even have been processed by Watcher while
`check_upload_file_status` returns:

```text
FAILED_PRECONDITION
Failed to download source file (reason: FETCH_FAILED)
```

Treat that connector result as **indeterminate**, not as authoritative publish
failure.

For a HACT publish attempt:

1. Check `HACT/results/<job_id>.result.json`.
2. Check whether the request was archived in `done/` or `failed/`.
3. If Watcher reports success, verify `commit_sha` in GitHub and verify the
   expected changed files / candidate content.
4. Only conclude end-to-end failure when Watcher result and/or Git verification
   establish failure.

In this persistence chain, Watcher result plus verified Git SHA is the
end-to-end completion evidence. Dropbox upload polling status alone is not.

The connector's internal reason for the false-negative polling result is not
established here; this README records only the behavior that has been observed
and the safe operational response.

## Crash recovery

Each publish commit includes two fixed Git trailers:

```text
HACT-Job-ID: <job_id>
HACT-Request-SHA256: <request_sha256>
```

On restart, after fetching, the Watcher first checks whether the target branch
already exists on `origin`. It recreates a success result only when that branch
tip has exactly packet `base_sha` as its parent and both trailers match this
request. This recovers the narrow case where Git push succeeded but the process
died before the local result was written—even if `main` advanced meanwhile. If
there is no recoverable branch, the normal current-`base_sha` precondition is
enforced before any checkout or write. Any pre-existing target branch that does
not meet all three recovery conditions fails safely at `recovery`.

A failed result remains terminal in v0.1.2: to retry a failed publication, send
a new request with a new `job_id`.

## v0.1 safety limits

- Repository URL, base branch, branch prefix, allowed paths, and checks are all
  local configuration. v0.1 allows only `"checks": []`.
- Target branches must use the configured prefix and can never be `main` or
  `master`.
- Paths must be normalized forward-slash relative paths. Absolute paths, `..`,
  `.git`, and `.github` are rejected.
- The only push is `git push -u origin <target-branch>`: no force push, branch
  deletion, or direct push to `main`/`master`.
- Before a job, only the dedicated clone is reset to `origin/<base_branch>`.
  The current Codex workspace is never read or changed.
- A processing-job lock has a unique owner token; an invocation that did not
  acquire the lock never removes another Watcher's lock. A dead local process
  lock is recovered on restart; a lock from another host is left untouched.
- The Watcher has no MCP, database, PR creation, Windows Service integration,
  or HACT Gate automation. Its optional adapter is local-only and is not a
  public Web service or webhook.

## Local-only adapter

`adapter.mjs` is a deliberately thin, **local-only adapter** for a program on
the same Windows computer. It listens only on `127.0.0.1` and offers only
`POST /publish`. It authenticates a local bearer token, checks the basic
`hact.publish.v1` shape, and atomically places the original request bytes in
the Watcher inbox. It does not call Git, calculate `request_sha256`, replace
Watcher validation, or participate in crash recovery.

It does **not** make cloud ChatGPT Automations able to reach this PC: cloud
services cannot directly access Windows `127.0.0.1`.

Copy `adapter.config.example.json` to ignored `adapter.config.json`, set a
random token (at least 16 characters), then run:

```powershell
node adapter.mjs --config adapter.config.json
```

Example with curl:

```powershell
curl.exe -X POST http://127.0.0.1:8787/publish `
  -H "Authorization: Bearer YOUR_LOCAL_TOKEN" `
  -H "Content-Type: application/json" `
  --data-binary "@publish.json"
```

PowerShell example:

```powershell
$headers = @{ Authorization = 'Bearer YOUR_LOCAL_TOKEN' }
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8787/publish `
  -Headers $headers -ContentType 'application/json' -InFile .\publish.json
```

The adapter writes a uniquely named temporary file in `inbox/`, then creates
the final `<job_id>.publish.json` with an atomic same-volume hard-link and
removes the temporary file. It never overwrites a queued package. The exact
same bytes and job ID return `202 already_queued`; different bytes for that job
ID return `409 job_id collision`. If the Watcher has already produced the
canonical result, it returns `409` and requires a new `job_id`.
