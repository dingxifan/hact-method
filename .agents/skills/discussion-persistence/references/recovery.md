# Recovery Rules

Use this document whenever the normal submit -> result -> verify path is interrupted.

## Evidence order

Recover from observable state, not from chat memory.

Check the minimum necessary sources in this order:

1. `results/<job_id>.result.json`
2. `done/<job_id>.publish.json`
3. `failed/<job_id>.publish.json`
4. `processing/<job_id>.publish.json`
5. `inbox/<job_id>.publish.json`
6. GitHub target branch / commit

The exact order may be shortened when a terminal result already exists.

## Case A — upload acknowledgement says FETCH_FAILED

Interpretation:

`ACK_INDETERMINATE`, not `FAILED`.

Allowed actions:
- inspect Dropbox state
- inspect result JSON
- inspect GitHub

Forbidden:
- immediate resubmit
- new job ID
- branch change
- content change

## Case B — publish file is in processing

Interpretation:

Watcher has claimed the job.

Do not resubmit.

Observe until a terminal result is present, or until there is evidence of a stalled/abandoned local process requiring operator intervention.

## Case C — result says success

Read:
- `commit_sha`
- `branch`
- `changed_files`
- `request_sha256`

Then fetch the commit from GitHub.

Only a matching GitHub commit yields `VERIFIED`.

## Case D — result says failed

Failure is terminal for that exact request.

Classify by `stage`, for example:
- `validation`
- `configuration`
- `precondition`
- `git`
- `idempotency`
- `recovery`

A corrected request must be a new job with a new job ID.

## Case E — same job ID already has same request result

The Watcher is idempotent for the same request hash.

Do not create another semantic publish attempt.

Use the existing result and continue verification.

## Case F — job ID collision with different request hash

Treat as `FAILED` at `idempotency`.

Do not overwrite history.

Create a new job ID only after confirming the corrected/new request is intentional.

## Case G — result absent, publish absent everywhere

Do not infer that submission succeeded or failed.

Return `INDETERMINATE` unless the transport tool proves no upload occurred.

If the user wants to retry, first establish that reuse of the original job ID cannot conflict with a hidden/in-flight copy. When that cannot be proven, operator inspection is required.

## Case H — Chat/session interruption

Reconstruct from:
- repository truth
- job ID
- Dropbox state
- result JSON
- GitHub

Do not depend on the previous conversation narrative.

## Case I — incremental candidate moved after truth lock

Given:

- publish mode is `INCREMENTAL_CANDIDATE`
- submitted `base_sha` was the verified candidate HEAD
- before execution the remote candidate HEAD changed

Expected:

- Watcher precondition fails
- state becomes terminal `FAILED` for that exact request
- do not force-push
- do not silently rebase or rebuild
- re-read the candidate HEAD and decide whether the finalized artifacts still apply before creating a new job

## Case J — incremental result success but parent mismatch

Expected:

- do not set `VERIFIED`
- classify GitHub verification as failed/inconsistent
- report submitted `base_sha`, returned `commit_sha`, and actual parent
- require investigation before any new persistence attempt
