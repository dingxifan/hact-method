# External Effect Protocol

本文只治理 non-idempotent、production、paid、irreversible 或结果可能不确定的外部副作用。普通 repository execution、Runtime handoff 和 Independent Review 不创建 effect receipt。

## 1. Trigger

满足任一条件时使用 External Effect Receipt：

- action 无法安全重复；
- start/effect 响应可能丢失，必须恢复同一 execution identity；
- action 作用于 production、付费资源或不可逆目标；
- 失败后必须 authoritative observation / compensation 才能决定 retry。

## 2. Stable path

```text
_meta/external-effects/{operation_id}.json
```

Receipt 固定：canonical Task、Method SHA、exact action、target、snapshot、request key、Authority references、intent Git receipt、outcome 与 evidence。它不保存临时执行过程、Task state、Gate、ownership 或完整日志。

## 3. Before dispatch

顺序固定：

```text
confirm Effective Permission
→ write exact intent
→ commit intent
→ verify path + commit + blob (+ reachable ref when remote recovery is required)
→ dispatch once with request_key
```

缺 exact target/snapshot、Authority reference、request key 或 verified intent receipt时不得 dispatch。

## 4. Outcome

`outcome` 只使用：

```text
pending | succeeded | failed | indeterminate | reconciled
```

- `pending`：intent 已固定，尚无终局 observation；
- `succeeded` / `failed`：有 authoritative evidence；
- `indeterminate`：无法证明 effect 是否发生，禁止 retry；
- `reconciled`：后续 authoritative observation 已消解不确定性，evidence 必须说明真实结果和下一动作。

除 `pending` 外必须填写 `observed_at` 与至少一个 `evidence_ref`。

## 5. Retry

只有 authoritative observation 证明 effect 未发生时才允许 retry。优先沿用同一 request key 的 idempotency/lookup；backend 无 recoverable identity 时保持 `indeterminate` 并请求 reconciliation。不得因为 timeout、tool error 或 narrative 缺失自动换 request key 重做。

## 6. Authority and completion

Receipt 证明 intent/outcome identity，不产生 Human Authority、Gate、Task state、review PASS 或 completion。权限、环境或 snapshot 改变时必须创建新的 authorized operation，而不是改写旧 intent。

## 7. Mechanical check

`check-external-effect.js` 只验证 current schema、字段、Git identity、path、receipt 完整性和 outcome/evidence 结构；不证明外部 effect 真实发生，也不判断 Authority 是否充分。
