# V1 Conformance Cases

These cases come from failures observed in the real discussion-to-Git workflow.

A change to the skill is acceptable only if it preserves the expected behavior below.

## C01 — FETCH_FAILED after actual successful submission

Given:
- upload was attempted
- transport status reports `FETCH_FAILED`

Expected:
- state becomes `INDETERMINATE`
- no resubmit
- inspect result/done/failed
- if result is success, verify `commit_sha` in GitHub
- final state may become `VERIFIED`

Must not:
- call it an upload failure without external evidence
- create a replacement job automatically

## C02 — Transport succeeded, Watcher rejected payload

Example:
- publish reached Watcher
- result is failed
- error: base branch does not match registered repo configuration

Expected:
- classify as terminal Watcher validation/configuration failure
- do not blame transport
- fix payload semantically/configurationally
- use a new job ID for the corrected request

## C03 — Ambiguous value in chat

Example:
- an isolated number such as `485` appears in surrounding discussion

Expected:
- never invent a meaning
- resolve from structured context or source
- if it is a line count, treat it as a line count; if unknown, say unknown

## C04 — Conversation resumes after interruption

Expected:
- reconstruct from GitHub + Dropbox + result JSON
- do not depend on remembered prose state

## C05 — Duplicate-submit risk after uncertain acknowledgement

Expected:
- stay `INDETERMINATE`
- inspect external state first
- preserve original job ID
- no automatic retry

## C06 — Watcher success but GitHub not checked

Expected:
- state is `EXECUTED`, not `VERIFIED`
- verify exact commit SHA before completion

## C07 — Watcher is running but no job is present

Expected:
- report adapter idle / no submitted job
- do not describe the requested publish as "currently running"

## C08 — Multi-repository use

Given:
- repository is present in Watcher `repos` config
- its base branch, branch prefix, and allowed paths are valid

Expected:
- same skill works without HACT-specific semantic assumptions

If repository is not registered:
- return `CONFIG_REQUIRED`
- do not alter Watcher configuration implicitly

## C09 — Incremental append to verified candidate

Given:
- candidate branch is allowed by `allowed_incremental_base_prefixes`
- `base_branch == target_branch`
- `base_sha` equals the remote candidate HEAD

Expected:
- append only the submitted files
- ordinary fast-forward push
- previous candidate artifacts remain unchanged
- result commit's direct parent equals `base_sha`

## C10 — Candidate moved after packet creation

Given:
- incremental packet was built at candidate SHA A
- candidate remote HEAD is now SHA B

Expected:
- precondition failure
- no force-push
- no silent rebase
- no automatic resubmit
- a new job may be created only after re-reading candidate truth

## C11 — Incremental success requires parent proof

Given:
- Watcher result says success

Expected:
- GitHub commit exists
- target branch contains the returned commit
- direct parent of returned commit equals submitted `base_sha`

If parent does not match:
- final state must not be `VERIFIED`
