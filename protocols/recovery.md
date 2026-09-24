# Recovery Protocol

HACT 假设任何 AI conversation、Runtime context 或本地 session 都可能丢失。

目标不是保护一个永不消失的上下文，而是保证项目工作可以从权威事实恢复。

## 1. Recovery sources

优先读取：
1. 当前 HACT Method fixed SHA
2. `status.yml`
3. Accepted Project Truth
4. 当前 Task Contract
5. 如存在，当前 Shared Candidate snapshot
6. required review / verification evidence
7. 必要 recovery pointer / progress

完整聊天记录不是恢复前置。

## 2. Resume algorithm

1. 确认项目和 method SHA
2. 读取 `status.yml`
3. 确认当前 Task、state、owner、dependencies
4. 读取 Task Contract
5. 重新读取 authoritative inputs
6. 若 Task 已 `done`，锁定 candidate snapshot
7. 读取必要 evidence / findings
8. 找到第一个未满足的 completion condition
9. 从该点继续

不尝试重建原会话的完整思维过程。

## 3. Recovery pointer

长任务、跨 session Task 或高风险执行可以维护轻量 recovery pointer：
- current task
- current phase
- stable snapshot
- next action
- open blocker
- evidence pointers

Recovery pointer 不能替代 Task Contract、`status.yml`、Git 或 review evidence。

## 4. Optionality

短小、单 session、易重跑的 Task 不要求为了形式创建 progress 文件。

Recoverability 是强要求；额外 recovery artifact 是否存在按风险和中断成本决定。

## 5. Dirty state

未形成 stable snapshot 的 Local Working Truth 默认只能由当前 Owner 自行恢复。

若值得跨 session / Runtime继续，应尽量先形成 safe checkpoint，或 Decision Packet / Recovery Pointer。

不能为了“可恢复”把 secrets、不完整危险状态或不适合版本化的临时数据强行提交 Git。

## 6. Context boundary

Task boundary 默认也是 context boundary。下一个 Task Owner 从 Accepted Project Truth 重新建立上下文。

## 7. Runtime Crossing recovery precondition

发生 Runtime Crossing 时，recoverability 是 dispatch precondition，具体持久化边界遵循 `runtime-crossing.md`。任何 Runtime start 前必须已经具备：

- durable `crossing_id`；
- durable Runtime `request_key`；
- backend 支持按 request key lookup / idempotency 并恢复实际 execution identity，或已有明确的 documented non-retry policy；
- 已核验的 versioned dispatch receipt；若已有 lifecycle event，还要使用最新且已核验的 lifecycle head receipt。

Local Working Truth、dirty worktree path、Runtime 内存或未验证的文件写入均不能代替上述 receipt，也不另建 recovery state / truth model。

## 8. 不确定 start 与 external effect

backend 支持 request-key lookup / idempotency 时，先持久化 request key，再 start；响应丢失时先按 request key 查询真实 execution identity。

若 start 结果不确定，且 backend 没有可恢复的 request identity，则进入：

```text
CAPABILITY_GAP
```

此时禁止自动 retry；必须由 human/operator reconciliation 确认真实状态后才能决定是否再次 start。

external effect 只有在 authoritative observation 证明该 effect 不存在时才允许 retry。若 effect 无法唯一观察：

- 不自动 retry；
- 进入 reconciliation；
- 有 operation-specific idempotency / compensation contract 时按其执行；
- 否则 escalation。

## 9. Runtime Crossing resume

恢复 crossing 时必须：

1. 从 versioned dispatch receipt 和最新 lifecycle head receipt 读取 immutable dispatch data 与完整 append-only history；
2. 重新读取 authoritative HACT status，并与 Runtime observation 比较；冲突时 authoritative status 永远胜出；
3. 保留既有 review count、finding ids / lineage、permission ceiling、current Authority references、ownership mode / owner、origin / return pointer 和 durable lifecycle events；
4. 在 recovery continuation 及其后每个 mutation、commit、shared transport、external action 或 Runtime/action dispatch 边界前，按 `authority.md` 重新计算 Effective Permission；
5. 发现 immutable dispatch drift、冲突 event、Authority 无法协调或 effect 不确定时先 reconciliation，不做 last-writer-wins 或 blind retry。

恢复不清零 review/finding history，不把 Runtime observed state 升格为 HACT state，也不以 recovery pointer 覆盖 authoritative Contract、status 或 Git Truth。
