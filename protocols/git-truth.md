# Git Truth Protocol

HACT 使用版本化 Git Repository 作为跨会话、跨执行环境的共享事实面。GitHub 是当前实现，不是方法论绑定。

## 1. 三层事实

### Local Working Truth
当前 Owner 工作中的真实但不稳定状态，例如 dirty worktree、未提交代码、本地进程、测试失败、未确认草稿和当前聊天讨论。

其他 Runtime 默认不得依赖它。

### Shared Candidate Truth
已固定为可明确引用的 versioned snapshot，但尚未成为正式项目结论。

主要用于：
- independent review；
- escalation；
- 专项现实性检查；
- 中断恢复。

Task 进入 `done` 时通常应存在 Shared Candidate Truth。

### Accepted Project Truth
已被 Task completion 接受并进入项目正式事实面的内容。默认分支上的当前有效 artifact、code、state 与 durable decision 属于这一层。

Task `merged` 对应结果进入 Accepted Project Truth。

## 2. Handoff

正常跨 Task handoff 只基于 Accepted Project Truth，以及需要时的 Gate approval。

下一个 Task Owner 重新读取 Git 权威输入，不依赖上一个 Task 的聊天历史。

Shared Candidate Truth 可以交 reviewer / escalation / specialist check，但不能默认成为下游正式依赖。

## 3. Snapshot

需要独立 review、authority approval 或跨执行环境检查的重要候选，都应绑定 immutable snapshot，优先使用 Git commit SHA。

禁止使用“当前最新版”“刚才那份”等模糊指代作为正式审查基线。

### Manual collaboration snapshot handshake

当 ChatGPT 基于 repository facts 形成判断、用户人工搬运、再由 Codex 在本地执行 repository operation 时，交接必须绑定明确的 `BASE_SHA`。ChatGPT 在该 immutable snapshot 上读取和判断；Codex 修改前验证实际 execution base 与 `BASE_SHA` 对应。不得以“当前 main”“最新代码”或本地应已同步代替 SHA。

若 Accepted remote 已移动并改变本次事实世界，Codex 不得把旧 Packet 自行套用或 rebase 到新世界；停止并以 `snapshot mismatch` 报告。此为 preflight stop reason，不是新的 blocker 类型、Task state 或 Git Truth 层级。无关 dirty work 仍按现有 Working Tree Discipline 隔离，但不改变本次 base。

需要返回 ChatGPT 验收的 operation 完成后，Codex 形成 immutable `RESULT_SHA`，并仅在既有 Authority / Git policy 允许时使其成为 ChatGPT 可读取的 remote Git truth；Result Packet 说明 `BASE_SHA`、`RESULT_SHA` 与实际 remote ref/state。ChatGPT 必须重新读取 `RESULT_SHA` 及本次涉及的 artifact / code / state，不能只根据 Result narrative 宣布完成。下一轮默认从已确认的 Accepted / Result snapshot 重新建立基线。

`init-project` 没有既存项目 `BASE_SHA`：它以 fixed Method SHA、用户确认的 repository identity 与新仓初始事实 bootstrap；首个可验证 remote snapshot 建立后，其 commit SHA 成为后续正式共同基线。Packet 只是人工临时格式，不是 Git Truth。

## 4. Git 保存什么

Git 保存 durable project truth：
- Contract
- State
- durable Decision
- 必要 Evidence
- 必要 external-effect / review / validation evidence

Git 不保存：
- 完整 AI conversation
- 模型内部推理
- 临时 debug 日志
- 可廉价重跑的大量 stdout
- secrets / token / cookie / private key
- 不必要的生产隐私数据

## 5. Decision persistence

只有会影响后续、多方案取舍、依赖关键假设、遗忘会显著返工、或改变长期约束的 Decision 才需要持久化。

记录结论、必要理由、关键假设和失效条件，不记录完整讨论过程。

## 6. Persistence Adapter

Task Contract 只要求正式 artifact 能形成 Shared Candidate / Accepted Project Truth。

具体写入机制由 Runtime / Persistence Adapter 实现。Adapter 不拥有 Task 的语义决策权，不得在机械落盘时重新设计 artifact。

## 7. External Effect Receipt

non-idempotent / external action 前，exact action、target、snapshot、request key 与 Authority reference 必须进入 versioned Git intent receipt。Local Working Truth、dirty worktree path、可变 branch 或未验证写入不足以建立该边界。

dispatch 后只更新 outcome 与 evidence。`indeterminate` 禁止 blind retry，先做 authoritative observation / reconciliation。Receipt 不是 semantic Contract、Task state、Gate 或第四层 Git Truth；Persistence Adapter 不获得额外 Authority。
