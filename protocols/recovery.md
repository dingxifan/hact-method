# Recovery Protocol

HACT 假设任何 AI conversation、Runtime context 或本地 session 都可能丢失。

目标不是保护一个永不消失的上下文，而是保证项目工作可以从权威事实恢复。

## 1. Recovery sources

恢复只读取判断最近 durable conclusion 与下一 authorized action 所需的最小集合，通常从以下来源按需选择：

1. 当前 HACT Method fixed SHA
2. Accepted Project Truth 与 authoritative `status.yml`
3. 当前 Task Contract
4. 如存在，最近 verified Shared Candidate / durable conclusion
5. 当前动作必需的 review finding / verification / external-effect evidence

完整聊天记录不是恢复前置。

## 2. Resume algorithm

1. 确认项目和 fixed Method SHA；
2. 定位最近 verified durable conclusion，而不是最近 Runtime message/poll；
3. 按需读取 authoritative status、Task Contract、candidate、open findings 与相关 evidence；
4. 做最小 reality probe，确认 branch/head、candidate 或 external effect 没有与 durable conclusion 冲突；
5. 找到下一项 bounded authorized action；
6. 从该动作执行到新的 durable conclusion 或明确 blocker。

不尝试重建原会话的完整思维过程、job/thread 连续性或 polling history。已通过且 snapshot/environment 未变化的验证不为形式重复运行。

## 3. Optionality

短小、单 session、易重跑的 Task 不要求为了形式创建 progress 文件。

Recoverability 是强要求，但不创建通用 Recovery Pointer 或 Runtime Resume Capsule。需要跨中断保留的事实直接进入其权威对象：Task/status、candidate、evidence、review/finding、external effect receipt 或 durable conclusion event。

## 4. Dirty state

未形成 stable snapshot 的 Local Working Truth 默认只能由当前 Owner 自行恢复。

若值得跨 session / Runtime继续，应尽量先形成 safe checkpoint、fixed candidate、evidence 或对应 durable conclusion。Decision Packet 只用于真实 decision escalation，不承担运行进度保存。

不能为了“可恢复”把 secrets、不完整危险状态或不适合版本化的临时数据强行提交 Git。

## 5. Context boundary

Task boundary 默认也是 context boundary。下一个 Task Owner 从 Accepted Project Truth 重新建立上下文。

## 6. External effect recovery

普通 bounded operation 不创建 recovery record；artifact、validation 与 review truth 进入各自权威对象。

non-idempotent / external action 开始前必须按 `external-effect.md` 固定 intent、request key、Authority 与 Git receipt。backend 支持 request-key lookup / idempotency 时，响应丢失后先查询同一 execution identity。

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

恢复时读取 External Effect Receipt 与 authoritative observation；冲突时真实外部状态、Task/status、Authority 和 Git Truth 优先。恢复不清零 review/finding history，也不用进度文件覆盖权威事实。
