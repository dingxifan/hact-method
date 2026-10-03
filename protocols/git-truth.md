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

需要返回 ChatGPT 的 operation 成功完成后，或因真实 blocker 返回时，Codex 提供最近稳定的 immutable `RESULT_SHA`，并仅在既有 Authority / Git policy 允许时使其成为 ChatGPT 可读取的 remote Git truth。返回消息只需清楚说明结果、`RESULT_SHA` 与实际有用的上下文；snapshot 的 remote ref/state 或仅本地可读等限制应如实说明。不要求正式 Result Packet 对象或固定结果 schema。ChatGPT 必须重新读取 `RESULT_SHA` 及本次涉及的 artifact / code / state，不能只根据消息宣布完成。snapshot handshake 保持 `BASE_SHA → Codex execution → RESULT_SHA → re-read Git truth`；下一轮从已确认的 Accepted / Result snapshot 重新建立基线。

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

## 8. 多远端 Git 同步

用户要求“同步仓库”“同步推送”而未限定远端时，默认覆盖当前 repository 的全部 Git remotes；以 `git remote` 枚举实际清单，并用 `git remote get-url --all <remote>` 与 `git remote get-url --push --all <remote>` 核对所有 fetch / push 目标。不得只选择 `origin`、第一个 remote、当前 upstream 或 `connections.yml` 中登记的 provider。用户明确限定目标时只处理指定范围；配置清单不扩大既有 Authority，禁止写入或仅供读取的远端必须明确列为未同步及其原因，不能静默跳过。

- 读取同步：逐个 remote fetch 并核目标分支事实；fetch 不代表已将远端变更集成本地。只从当前分支的已确认 upstream / Accepted baseline 按项目规则集成，不依次 pull 多个远端；远端分歧不得自行 merge、rebase 或覆盖。
- 推送同步：对全部范围内远端，使用同一个 fixed local commit 和明确的 source→target branch refspec 正常 push；不能因当前 upstream 只指向一个仓库就遗漏其余仓库。目标分支从用户指令、既有项目映射或已确认的分支关系确定，不能猜测不同远端的 main / master 映射；缺少映射时只暂停该目标并说明缺口。不使用 force / mirror，不顺带推其他分支或 tags。
- 一个 remote 配置多个 push URL 时，每个实际 push 目标都要核验。推送后对每个实际目标执行 `git ls-remote`，确认目标 branch SHA 等于本次 fixed commit，不能只信 push 输出或本地 tracking ref。
- 各远端独立记录完成、失败或未执行及其原因；一个远端失败不阻止其余已授权且可安全执行的目标。只有全部范围内目标都完成相应操作并通过核验，才能声明全部同步完成；否则报告部分完成，列出未完成目标。没有配置 remote 时如实说明，不能报告同步成功。
