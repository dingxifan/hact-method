# HACT Watcher v0.1

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

Run in a foreground terminal while testing:

```powershell
node watcher.mjs --config config.json
```

It creates `inbox`, `processing`, `results`, `done`, and `failed` below the
configured Dropbox root, then scans `inbox/*.publish.json` every five seconds.
Do not configure it as a Windows Service yet.

## Publish package

Save this as `HACT/inbox/20260917-001.publish.json`:

```json
{
  "schema": "hact.publish.v1",
  "job_id": "20260917-001",
  "repo": "hact-method",
  "base_branch": "main",
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

## Result package

The successful result at `HACT/results/<job_id>.result.json` is:

```json
{
  "schema": "hact.result.v1",
  "job_id": "20260917-001",
  "status": "success",
  "repo": "hact-method",
  "branch": "hact/chat/20260917-001",
  "commit_sha": "abc123...",
  "changed_files": ["reports/_poc/dropbox-watcher.md"]
}
```

Failures include `status: "failed"`, a stage, and a concise error. An existing
result for the same `job_id` is never executed again. No changed content yields
`status: "no_changes"` without an empty commit.

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
- v0.1 has no webhook, MCP, database, Web service, PR creation, Windows
  Service integration, or HACT Gate automation.
