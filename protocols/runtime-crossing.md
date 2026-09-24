# Runtime Crossing Protocol

本文定义 HACT 工作跨出当前 Runtime 时的持久化、恢复与权限边界。HACT 仍以 Task 为中心；Runtime Crossing 只记录编排事实，不替代 Task Contract、HACT state、Gate、Human Authority、Git Truth、Review 或 Task completion semantics。

## 1. 适用范围

当实际工作需要跨 Runtime、调用外部执行、派生 canonical child Task、发起独立 review，或执行必须可恢复的 Reality Probe / capability slice 时，使用 Runtime Crossing Record。

记录的稳定路径族为：

```text
_meta/runtime-crossings/{crossing_id}.yml
```

没有实际 crossing 的既有 Task 不需要补记录。本协议不要求迁移 `status.yml`、Gate、Task Package 或既有 review schema，也不增加 Core Task、HACT state 或 Gate。

## 2. Durable Governance Truth

Runtime Crossing Record 是 additive **Durable Governance Truth**，不是 Product / UX / Technical / Development Contract、实现真相，也不是第四层 Git Truth。

现有三层 Git Truth 保持不变：

```text
Local Working Truth
Shared Candidate Truth
Accepted Project Truth
```

Runtime Crossing Record 只保存安全编排与恢复所需的 durable facts，例如 crossing identity、canonical Task 和权威 Contract 引用、status snapshot 引用、ownership mode、permission ceiling、Authority 引用、artifact/runtime receipt、origin/return relation、recovery pointer 和 append-only lifecycle events。语义 Contract 字段不得复制进记录；记录只引用其权威位置和 immutable identity。

仅写入本地工作树的记录仍只是 Local Working Truth，不能支持跨 Runtime 恢复，也不能满足非幂等 dispatch 的持久化前置。

## 3. Runtime Crossing Record v2

schema 固定为：

```text
hact-runtime-crossing/v2
```

模板见 `../templates/runtime-crossing-record.yml`。记录分为三类数据：

1. **immutable dispatch data**：dispatch 前已经可知、足以唯一识别和安全重建意图的字段；dispatch 后不得原地修改；
2. **lifecycle-produced data**：`job_id`、Runtime result、produced artifact、terminal outcome 等执行后事实，只能通过 append-only event 引入；
3. **persistence receipts**：精确绑定 immutable dispatch snapshot 或最新 lifecycle head 的 Git 证据，不扩张 Authority。

immutable dispatch data 至少按适用性包含：

- `schema`、`crossing_id`、`kind`；
- canonical Task identity 与 Method SHA；
- authoritative status reference、immutable status snapshot identity 和 non-authoritative observation；
- ownership mode / owner reference；
- repository identity / workspace；
- authoritative Contract reference / immutable identity；
- permission ceiling / current Authority references；
- 已知的 origin / return reference；
- Runtime adapter / durable `request_key`；
- 外部 action、target 和 snapshot identity（如适用）。

`kind` 只使用：`stay-local`、`reality-probe`、`capability-slice`、`execution-task`、`child-task`、`external-execution`、`review-dispatch`。

## 4. Versioned dispatch boundary

任何非幂等 action 开始前，immutable dispatch data 必须已进入 versioned Git snapshot，dispatcher 必须持有并核验精确 persistence receipt：

```yaml
persistence:
  dispatch:
    record_path:
    commit_sha:
    record_blob_sha:
    reachable_ref:
    verified_at:
```

receipt 必须把 record path、commit SHA 与该 commit 中该 record 的 blob SHA 精确绑定。`reachable_ref` 仅在严格本地执行、且不需要其他 Runtime 恢复时可以为 null；只要 crossing 离开本地 Runtime 或需要异地恢复，exact commit 就必须在 dispatch 前通过已授权的 shared repository / transport 可达，并记录经验证的 reachable ref。

可变 branch name、dirty worktree path、未验证的文件系统写入或仅有 Local Working Truth 均不是 durability 证据。

最小顺序为：

```text
prepare authoritative refs
→ 为 crossing-record write 重新计算 Effective Permission
→ 固定并写入 immutable dispatch data
→ 为 commit 重新计算 Effective Permission
→ 创建 Git commit
→ 捕获并核验 record path + commit SHA + record blob SHA
→ 需要跨 Runtime 可达时，为 shared transport/push 重新计算 Effective Permission
→ 使 exact commit 可达并核验 reachable ref
→ 紧邻 Runtime/action dispatch 再次计算 Effective Permission
→ dispatch
```

non-idempotent action 至少包括 external write、paid API、deployment、production action、backend 无法按 request key 去重的 Runtime start，以及 recovery 无法安全重放的 repository mutation。无法建立并核验 versioned dispatch receipt 时不得开始。

receipt 可以作为 immutable dispatch snapshot 之后产生的 persistence data 写回记录；它引用的是已固定的 dispatch commit/blob，不改变 immutable dispatch data。任何写回、commit、shared transport 和后续 action 仍分别受 Effective Permission 检查。

## 5. Append-only lifecycle 与并发合并

dispatch snapshot 在 dispatch 后不可变。此后的 Runtime request/job identity、result、artifact、evidence、recovery、cancellation、reconciliation、supersession 和 terminal outcome 都以 append-only lifecycle event 记录。

每个 event 必须有稳定 `event_id`、单调 sequence/revision、event type、timestamp，以及它引入的 evidence、Authority、artifact、runtime 或 persistence receipt 引用。每次继续执行可能导致另一个非幂等 action 前，必须先提交全部前置 lifecycle events，并核验新的 lifecycle head：

```yaml
persistence:
  lifecycle_head:
    commit_sha:
    record_blob_sha:
    last_event_id:
    verified_at:
```

并发更新采用 compare-before-append：

1. 重新读取最新 committed crossing record；
2. 核验 immutable dispatch data 仍与原 dispatch receipt 一致；
3. 只按稳定 `event_id` union 无冲突的 append-only events；
4. 保持确定性事件顺序；
5. 同一 `event_id` 内容不同、immutable dispatch data 被改动、sequence history 分叉，或 Authority / permission state 无法协调时，拒绝自动合并；
6. 冲突存在时先进入 reconciliation，禁止继续任何非幂等 action。

lifecycle merge 是 immutable events 的 append/union，不是 crossing record 的 last-writer-wins 替换。纠正 immutable dispatch identity 必须创建新 crossing，或在进一步 action 前追加明确的 superseding/cancellation event。

## 6. State 与 ownership

`status.observed_state` 只是一份 diagnostic observation，且 `status.authoritative` 必须为 `false`。恢复时重新读取 authoritative status、与 observation 比较，并以 authoritative status 为准。

Runtime event 不得推断或间接写入 `taken-by`、`done`、`merged`。Runtime job 本身不产生或转移 ownership。

执行工作的 crossing 必须声明：

- `delegated`：原 Task Owner 保持 method ownership，Runtime 只执行 bounded slice；
- `transferred`：canonical Task ownership 已通过既有 status contract 显式转移。

derived child Task 只有在 canonical Task 已登记、适用的 Development Intake / Task Package 已存在、readiness/dependencies 有效，且既有 status contract 已按要求记录 claim/owner 后才能执行。crossing 只引用这些事实，不创建它们。

## 7. Effective Permission

`permission_ceiling` 只表示 crossing 在没有新 Authority event 时可行使的最大上限，不是当前授权。

在每一次 repository mutation、commit、push/shared transport、external action、retry、recovery continuation、deployment/promotion、Runtime/action dispatch，以及对应 lifecycle boundary 前，都必须紧邻动作重新计算：

```text
Effective Permission =
Task Contract authorization boundary
∩ current Human Authority
∩ current resource permissions
∩ environment protection
∩ tool capability
∩ stored permission ceiling
```

最窄限制胜出；先前计算或 persistence receipt 不能授权后续边界。Human Authority、环境策略或资源权限一旦收窄/撤销，立即优先适用。

权限扩张必须有新的、scoped、immutable Authority event，并绑定 action/scope、snapshot/world、target/environment 及适用的 validity scope。crossing 只能 append 对该 Authority event 的引用，不能自行产生授权。

## 8. Recovery 与不确定结果

recoverability 是 dispatch precondition。开始前必须有 durable `crossing_id`、durable Runtime `request_key`，以及 backend 支持按 request key 恢复实际 execution identity，或明确的 non-retry policy。

backend 支持 lookup/idempotency 时，先持久化 request key，再 start；响应丢失时按 request key 恢复 job identity。backend 不支持时，若 start 结果不确定则进入 `CAPABILITY_GAP`，禁止自动重试，必须由 human/operator reconciliation 后才能再次 start。

外部 effect 只有在 authoritative observation 证明 effect 不存在时才可 retry。effect 无法唯一观察时，不得自动 retry；进入 reconciliation，并使用 operation-specific idempotency/compensation contract（如有），否则 escalation。

## 9. 后续消费者边界

后续 Batch 可以让 Runtime adapter / orchestration skill 消费本协议，也可以增加 mechanical `check-runtime-crossing`。这些消费者不得重新定义 Task Contract、创建 HACT state、批准 Gate、认证 Authority sufficiency、用 Runtime state 宣告 Task completion，或重开 historical merged work。

checker 将来只可机械检查 schema/version、字段与 identity 格式、status/ownership/reference、event monotonicity、hash/bytes、request key、permission ceiling、origin/return/target，以及是否复制了禁止的 semantic Contract 字段。它不得认证 Authority sufficiency、semantic Contract validity、产品/UX/risk correctness、Gate approval、Task completion、review PASS 或用户语言是否构成授权。

本 Batch 不实现 checker、Runtime adapter、skill、task/review/recovery/boot 改动或测试；它们只是本语义协议的未来消费者。
