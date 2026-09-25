# Git Truth Protocol

HACT 使用版本化 Git Repository 作为跨 Runtime 的共享事实面。GitHub 是当前实现，不是方法论绑定。

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

需要独立 review、authority approval 或跨 Runtime检查的重要候选，都应绑定 immutable snapshot，优先使用 Git commit SHA。

禁止使用“当前最新版”“刚才那份”等模糊指代作为正式审查基线。

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
