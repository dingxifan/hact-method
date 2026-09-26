# ChatGPT Runtime Adapter

本文只描述 ChatGPT 如何实现 HACT capability。Task 语义属于 `tasks/`，共性纪律属于 `protocols/`；本文不创建第二套 Task、Gate、Review、Authority 或 state 规则。

## 1. Role and truth boundary

ChatGPT 是 reasoning、需求讨论、产品/技术设计、PRD / UX / TRD 内容形成、计划与 acceptance judgement 的工作区。它可以形成 review judgement，但不因推理能力获得更高 Authority。

ChatGPT Project / Chat 不是 Shared Project Truth。草稿、未决方案和临时解释只有在形成 durable artifact 并进入 Git snapshot 后才成为 Shared Candidate / Accepted Truth；删除聊天不应令项目无法恢复。

Git 是 Shared Project Truth。需要真实 repository write、command、test/checker、Git 或其他 repository execution 时，ChatGPT 形成一个给 Codex 的 bounded Execution Packet，由用户人工复制。用户是稳定 Packet 的 transport，不是 orchestration engine：不负责判断 Codex 下一步、监督其 reasoning、维护 session 或搬运中间过程。

## 2. Bootstrap and repository reading

开始正式 HACT Task 时，确认目标 repository、adopted Method SHA、当前 Task / state，加载 `tasks/{task}.md`、实际触发的 Shared Protocol 与 authoritative inputs，再开始工作。`init-project` 按其 bootstrap exception 执行；B 类请求按 `protocols/b-intake.md` 进入 `develop(source=bug|optimization)`。不要预加载全部 Task，也不因用户已明确 Task 而重新路由。

读取 repository 时优先读取权威 Git 内容；完整 artifact 必须完整读取。即将形成 Execution Packet 时，必须读取明确 SHA，而不是 floating default branch；具体人工协作 snapshot handshake 只遵循 `protocols/git-truth.md`。优先绑定 default branch Accepted Truth、明确 candidate SHA 或 Gate approved snapshot。

## 3. Minimal manual handoff

ChatGPT 在边界、允许/禁止范围、验证和停止条件明确后，给 Codex 以下最小 Execution Packet：

```text
Repository:
Base SHA:

Task:
Goal:

Allowed:
Forbidden:

Input file(s):
Target path(s):

Execute:
...

Validate:
...

Stop:
...

Return:
...
```

无 Input file(s) / Target path(s) 时省略该字段。长文档、多文件 bundle、PRD / UX / TRD / prototype 或 planning 正文走独立文件；Packet 只携带控制信息和文件引用，不为搬运方便重复正文。`Stop` 通常是 validation PASS，或出现 `SEMANTIC | AUTHORITY | CAPABILITY` blocker。Packet 只是临时复制格式：不编号、不注册进 status、不创建 lifecycle、receipt、registry、schema、checker 或持久化 packet object。

### Sprint-level Develop handoff

当 ChatGPT 为已 Accepted Sprint 生成 `source=sprint` 的 Develop handoff 时，先从当前 Git Truth 决定**下一个 bounded execution-window scope**，而非默认把整个 Sprint 交给一个 Codex interaction。它读取 `BASE_SHA`、已完成与剩余 package、dependency graph、development volume、已知复杂度和 verification / review boundary；只列出本窗口应完成的 Task Packages，不要求预先计划后续窗口。输出顺序固定为两段，且不可合并：

1. **CODEX GOAL**：一条可直接粘贴到 Codex 对话框的 `/goal ...` 命令，用于在当前 Codex interaction 真正建立 execution-window Goal；
2. **DEVELOP EXECUTION PACKET**：只在 Goal 已建立后交付，包含 `Repository`、`BASE_SHA`、`Accepted Sprint`、明确的窗口 `Scope`、`Autonomy`、`Human Boundary`、`Success` 与 `Final Return`。

只在 Packet 内填写 `Goal:` 字段不视为 Goal 已激活。Goal 命令应指向明确 `BASE_SHA`、本窗口已接受的 `source=sprint` Task Packages、既有 Task Contract / dependency graph、验证与最终 immutable Result Packet；不得借此扩大 Product / Technical / Sprint semantics、Authority 或 external-effect 范围，也不得自动进入窗口外仍 eligible 的 Task。

ChatGPT 必须从冻结 Sprint 自动设定这条 CODEX GOAL：Human 只负责把它激活到 Codex，不负责自行写 Goal、逐包排序或维护 Wave / window 过程。Goal 和 Packet 必须明确指示 Codex 在当前窗口内按 dependency、development volume、coupling 与 verification boundary 即时编排轻量 Wave；Wave 是窗口内执行顺序，window 是当前 interaction 的范围，二者都不是交接对象、Task、Gate、状态或持久化记录。对于实际到达的 complex Task，交接文本必须明确：在 substantive implementation 前只向 Human 询问 `analyze first` 或 `continue directly`；前者产生可选的 ChatGPT 实施分析，后者直接执行，二者均不创建 Gate。模型选择由 Human 决定，不写入 Goal 或 Packet 的 Method 规则。

最小示例：

```text
/goal Complete the next bounded Develop execution window for <Sprint> from BASE_SHA <sha>, covering only <explicit in-scope Task Packages>. Treat the accepted Sprint and dependency graph as the enclosing contract, but do not continue into out-of-scope Tasks in this interaction unless Human explicitly re-scopes it. Within this window, derive lightweight Waves from dependency, development volume, coupling, and verification boundaries; do not persist or govern Waves or the window as Tasks, Gates, states, packets, checkpoints, or results. Execute every in-scope package through its existing contract, deterministic validation, immutable candidate, independent review, finding repair, targeted re-review, and authorized Git delivery. When a complex Task is reached, before substantive implementation ask Human only whether to analyze first in ChatGPT or continue directly; analysis is optional supporting input, never a Gate or mandatory artifact, and model selection remains Human-owned. Continue autonomously through ordinary implementation choices, mechanical failures, tests, checker failures, review findings and repairs. Stop when the execution-window Goal is complete, Human explicitly stops, or a genuine unresolved SEMANTIC, AUTHORITY, or CAPABILITY blocker prevents safe continuation. Finish with the stable Result Packet and RESULT_SHA.
```

Codex 返回后，用户人工复制最小 Result Packet：

```yaml
Task:
Result: PASS | BLOCKED

Base SHA:
Result SHA:
Remote ref/state:

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

ChatGPT 收到 Result Packet 后重新读取 `RESULT_SHA` 的本次 artifact / code / state，再根据 evidence 与 Git Truth 判断 PASS、是否需要 semantic / Human Authority decision，并在仍有 Sprint scope 时重新计算下一个 execution-window Goal；不要求用户搬运完整对话或 reasoning，也不保留先前 window plan。一次 Packet 只传达一个 stable bounded operation，不改变既有 Task identity、state、ownership、Gate 或 Authority。

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
