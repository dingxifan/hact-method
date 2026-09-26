# ChatGPT Runtime Adapter

本文只描述 ChatGPT 如何实现 HACT capability。Task 语义属于 `tasks/`，共性纪律属于 `protocols/`；本文不创建第二套 Task、Gate、Review、Authority 或 state 规则。

## 1. Role and truth boundary

ChatGPT 是 reasoning、需求讨论、产品/技术设计、PRD / UX / TRD 内容形成、计划与 acceptance judgement 的工作区。它可以形成 review judgement，但不因推理能力获得更高 Authority。

ChatGPT Project / Chat 不是 Shared Project Truth。草稿、未决方案和临时解释只有在形成 durable artifact 并进入 Git snapshot 后才成为 Shared Candidate / Accepted Truth；删除聊天不应令项目无法恢复。

Git 是 Shared Project Truth。需要真实 repository write、command、test/checker、Git 或其他 repository execution 时，ChatGPT 形成一个给 Codex 的 bounded Execution Packet，由用户人工复制。用户是稳定 Packet 的 transport，不是 orchestration engine：不负责判断 Codex 下一步、监督其 reasoning、维护 session 或搬运中间过程。

## 2. Bootstrap and repository reading

开始正式 HACT Task 时，确认目标 repository、adopted Method SHA、当前 Task / state，加载 `tasks/{task}.md`、实际触发的 Shared Protocol 与 authoritative inputs，再开始工作。`init-project` 按其 bootstrap exception 执行；B 类请求按 `protocols/b-intake.md` 进入 `develop(source=bug|optimization)`。不要预加载全部 Task，也不因用户已明确 Task 而重新路由。

读取 repository 时优先读取权威 Git 内容；完整 artifact 必须完整读取。优先绑定 default branch Accepted Truth、明确 candidate SHA 或 Gate approved snapshot。

## 3. Minimal manual handoff

ChatGPT 在边界、允许/禁止范围、验证和停止条件明确后，给 Codex 以下最小 Execution Packet：

```text
Task:
Goal:

Allowed:
Forbidden:

Input / Artifact:
...

Execute:
...

Validate:
...

Stop:
...

Return:
...
```

`Stop` 通常是 validation PASS，或出现 `SEMANTIC | AUTHORITY | CAPABILITY` blocker。Packet 只是临时复制格式：不编号、不注册进 status、不创建 lifecycle、receipt、registry、schema、checker 或持久化 packet object。

Codex 返回后，用户人工复制最小 Result Packet：

```yaml
Task:
Result: PASS | BLOCKED

Changed:
...

Validation:
...

Git Truth:
...

Blocker:
...

Decision needed:
...
```

ChatGPT 根据 evidence 与 Git Truth 判断 PASS、继续执行，或是否需要 semantic / Human Authority decision；不要求用户搬运完整对话或 reasoning。一次 Packet 只传达一个 stable bounded operation，不改变既有 Task identity、state、ownership、Gate 或 Authority。

## 4. Frozen artifact persistence

ChatGPT 已完成并确认 PRD、TRD 或其他 artifact 内容时，Codex 的责任是 persistence + verification，而不是重新设计。Execution Packet 应明确目标 path、冻结内容、允许的原样落盘与不改变语义的 deterministic format repair，并禁止改变产品/技术语义或扩大 scope。

Codex 的执行链是：

`persist → validate → mechanical repair if needed → validate again → PASS / classified blocker`

确定性格式失败不得派生开放式研究任务。Git candidate identity 才是 persistence truth。

## 5. Review, interaction and recovery

Independent Review 仍按 `protocols/review.md`：固定 Git candidate、Fresh Isolated Context、同一 Method SHA、Task Contract、authoritative inputs 与 review brief；不以 Owner 聊天或 mutable-worktree narrative 替代这些输入。

产品/业务范围变化、重要语义歧义、Gate approval、真实体验验收、授权扩大、破坏性或外部副作用时必须停下。已明确且已授权的 artifact authoring、确定性检查与 persistence 应连续推进。确定性失败先分类为 `MECHANICAL | SEMANTIC | AUTHORITY | CAPABILITY`；`MECHANICAL` 且语义/范围不变时，直接修正并重跑至 PASS 或类别变化。

聊天丢失后，从最近 verified durable conclusion 恢复：核对 Method SHA、authoritative status、Task Contract、Accepted Truth、candidate、open finding 与必要 evidence，做最小 reality probe 后继续。聊天摘要只作线索，不能覆盖 Git Truth。外部 effect 不确定时仍按 `protocols/external-effect.md` 处理。

## 6. Capability boundary

HACT 只依赖 capability 概念：repository read、semantic reasoning、artifact authoring、isolated context、persistence 与 optional repository execution。具体 connector、MCP、SSH 或 UI 操作是各执行环境的能力，不是 ChatGPT↔Codex transport。
