# Review Protocol

Independent Review 用于对 Candidate Truth 提供独立挑战，而不是重复生成过程。

## 0. Review hierarchy

HACT 有两个不同 assurance boundary：

1. **Package Review**：在 `develop` 内提供 Error Containment。standard package 默认 lightweight；sensitive 或实际 diff 升档的 package 使用 full-local。
2. **System Review**：在 `integration-verify` / System Verification 内，对全部计划内 develop packages 合并后的 fixed system candidate 提供 Semantic / Holistic Independent Review。

Package Review 不能宣称最终 System Assurance；System Review 也不能替代 Package Review 的本地缺陷阻断。Runtime Integration Verification 是 System Verification 的另一条证据 lane，不属于语义 review 的别名。

`lightweight`、`full-local` 是 package effective mode；`full`、`targeted` 是 System Reviewer event 的 review depth。两组概念不得混作同一枚举。

## 1. 核心原则

默认优先：

`Same Runtime + Fresh Isolated Context + Same Source of Truth`

独立性的首要来源是 cognitive isolation，而不是模型品牌不同。只有当前 Runtime 无法提供可信隔离或缺少必要 capability 时才切换 Runtime。

“Same Source of Truth” 不等于 Reviewer 每次都必须预加载整份长 Task Contract。Reviewer 应从同一 Task 文件按审查需要做 projection，避免为了独立性制造重复规范或无条件上下文膨胀。

## 2. Reviewer projection

Package 首审按 `tasks/develop.md` 的 effective mode 做 same-source projection。无论 lightweight 或 full-local，默认从同一 `tasks/{task}.md` 读取：

- frontmatter / Task identity
- §1 Purpose & Scope
- §3 Authoritative Inputs
- §4 Outputs
- §6 Verification
- §7 Review & Human Authority
- §8 Completion & Handoff

按需扩展：

- 审查 readiness / 入口合法性时读取 §2 Preconditions；
- finding 涉及 task-specific decision rule / boundary 时读取 §5 对应小节；
- Task Contract 本身较短、章节边界不稳定或 Reviewer 无法确定遗漏风险时，直接读取全文。

这是一种 **same-source projection**，不是第二份 reviewer spec。不得为了节省加载而复制一套会漂移的 `*-review.md` Task Contract。

Package targeted re-review 默认只加载：

- prior report 与未关闭 finding ids；
- 新的 fixed snapshot / changed surface；
- 与这些 finding 直接相关的 Task sections、Shared Protocol 与 evidence。

除非变化使原结论失效，不重新全文审一遍。

System Reviewer 首次事件必须针对最终 system candidate 做 `full` review。后续 System Reviewer event 可以是 `targeted` 或 `full`；targeted 必须读取 predecessor、待复核 finding、声明的 semantic/runtime revalidation scope，以及该范围所需的完整调用链与 Contract。Review depth 由失效的 assurance 结论决定，不由 diff 文件数决定。

## 3. Reviewer 输入

默认允许：

- fixed candidate snapshot
- Task Contract 的 reviewer projection
- authoritative upstream artifacts
- relevant code / project facts
- 必要 evidence
- 当前 finding 实际需要的 Shared Protocol

默认不提供：

- Owner 的完整生成聊天
- Owner 的私有推理
- Owner 的辩护性总结
- 与当前 review 无关的大量历史上下文
- 与当前 finding 无关的全部 Shared Protocol

Reviewer 自己读取权威事实。

## 4. Protocol loading

Shared Protocol 只在其纪律实际被触发时加载：

- review isolation / finding / convergence → `protocols/review.md`
- state transition / claim readiness → `protocols/state.md`
- Gate readiness / approval → `protocols/gates.md`
- candidate / merge / Accepted Truth → `protocols/git-truth.md`
- Human Authority 边界 → `protocols/authority.md`
- 中断 / recovery → `protocols/recovery.md`

Task 明确引用其他 Protocol 时按引用加载。不要因为“这些文件都可能有用”而预加载全部 Protocol。

## 5. Review target

Review 必须绑定明确 snapshot。代码审查使用 fixed base/head 或等价 immutable 范围；文档审查使用明确 candidate commit / tree。

Owner 在 review 后改变实现、测试或被审文档语义时，必须形成新的 review target。

System Review target 必须是全部计划内 develop packages 已进入 Accepted Project Truth 后的明确 final candidate。System Review event 是对该 candidate 的历史 judgement；事件发布后不因后续修复而改写。

## 6. Evidence

Owner 的 risk、files、test 清单和“已验证”声明只是待核输入，不是 evidence truth。

有效 Evidence 必须匹配：

- 被审 snapshot；
- 依赖 / 配置；
- 实际执行路径；
- 适用环境。

相同 snapshot、依赖、配置和环境下仍然有效的 evidence 可以复用；不要为了形式重复运行。

## 7. Task-specific focus

Shared Review Protocol 只定义共性纪律。每个 Task 的特殊审查重点写在同一 Task Contract 的 §7，不创建平行真相。

## 8. Findings

Reviewer 输出至少包含：

- finding
- evidence / basis
- severity / blocking nature
- required action 或 conclusion

Finding 应指向具体承诺、路径或 evidence gap，不以“还能更完善”阻断。

System Verification 内的 blocking findings 使用同一 system Finding Contract；origin 只说明 finding 从 semantic review 或 runtime verification 首次建立，不决定 closure authority。

每个 system blocking finding 至少持久化：

- stable finding id
- origin：`semantic-review | runtime-verification`
- severity 与 category
- summary 与 evidence pointers
- required action
- effective closure route
- required semantic revalidation scope
- required runtime revalidation scope / not-required reason
- `full_snapshot_invalidated` 与必要 reason
- durable state：`open | closed | escalated`

`advisory` 不是 blocking finding state；它可以留在 review judgement，但不进入 blocking closure lineage。历史 package finding 的 `verified-closed/advisory` 枚举保持原样，不为 system schema 回写。

## 9. Closure Authority Routing

每个 blocking system finding 在任一时点必须恰有一个 effective route：

- `local-close`：closure authority 属于满足本 finding 合同的 Fresh Isolated Local Review 与声明 revalidation evidence。
- `system-rereview`：closure authority 属于新的 System Reviewer event。

Route 决定谁有权关闭 finding，不决定 review depth。Origin、category、diff size、文件数或修复提交数都不能单独决定 route。

Route 判断以失效的 assurance conclusion 为核心：

- 根因和影响可局部界定，Product/Technical/shared contract 与 major architecture 未实质改变，且 revalidation scope 可完整声明 → `local-close`。
- 修复可能使 system-level semantic conclusion 失效，或 locality 无法可靠界定 → `system-rereview`。

## 10. Local-close contract

`local-close` 至少需要：

1. fixed repair candidate；
2. 未参与修复的 Fresh Isolated Local Review pass；
3. declared semantic revalidation 全部满足；
4. declared runtime revalidation 在 required 时全部满足；
5. required target/regression tests 对 repair candidate 实际运行；
6. additive closure event 进入 Git Truth。

Runtime revalidation 在 finding 已声明 runtime scope，或修复改变需要真实证明的 runtime-observable behavior 时 required。Local finding 不因此自动重跑整个 system runtime suite。

若修复触及 shared contract、core state machine、authorization model、broad data model、unexpected multi-package redesign，或超出原 declared revalidation scope，local closure authority 立即撤销：

`local-close → escalated → system-rereview`

Escalation event 必须记录具体越界事实和新的 revalidation/invalidation 判断。不得用旧 local review 关闭已经越界的 repair。

## 11. System-rereview and review depth

`system-rereview` finding 可以由 Codex 实现修复、跑 local prerequisites 并形成 fixed candidate，但只能由新的 System Reviewer event 关闭。

Review depth 单独决定：

- `full_snapshot_invalidated=false` → 默认 targeted System Re-review；
- `full_snapshot_invalidated=true` → Full System Re-review。

Targeted event 必须声明 predecessor、revalidation findings 和完整 scope。它只对该 lineage/scope 建立新 assurance，不得声称全系统重新 full reviewed。

Local closure 不创建 System Reviewer event。每次真实 System Reviewer invocation 都必须创建新 event；不得改写 predecessor report 或把多次 invocation 合并成一个历史 judgement。

## 12. Full snapshot invalidation

`full_snapshot_invalidated=true` 只表示：旧 Full System Review 不再能作为新 candidate 的 system-level assurance baseline。

典型依据：

- shared API/schema/event redesign；
- authorization model redesign；
- core state-machine redesign；
- broad data-model redesign；
- major architecture-path replacement；
- multi-package redesign；
- material Product / Technical Contract revision。

以下事实本身不足以判 invalidated：文件多、diff 大、commit 多、修复耗时长、finding 来自 semantic review。Invalidation 必须指明哪些旧 system conclusions 因何失效；`true` 且 reason 为空是非法状态。

## 13. Durable lineage and additive evidence

Published System Review event 是 immutable historical judgement。Repair、route escalation、local closure 与 system-rereview closure 都以新 artifact 追加，不改写 source review。

System finding 的当前 state 由 source finding 加后续 closure/escalation event chain 推导：

- source finding 创建时为 `open`；
- local authority 被撤销时追加 `escalated` event；
- 满足有效 closure authority 时追加 `closed` event；
- `escalated` 不是成功终态，仍须后续合法 closure。

Runtime finding 若在初次 review 发布前建立，可进入同一 review event 并保留 `origin=runtime-verification`；若在发布后建立，使用独立 immutable finding artifact，再走同一 routing/closure contract。

## 14. Bounded convergence

Review 不无限循环：

`candidate → review → targeted fix → targeted re-review`

根因闭合、必要回归通过、无新的范围内 blocking evidence 时结束。超过 Task 约定边界进入 escalation，不继续无界复审。

换 Runtime、session 或 reviewer 不自动清零 finding、snapshot count、attempts 或有效 evidence。

## 15. Proportionality

低风险 reasoning artifact 可采用 Lightweight Review；高风险 execution artifact 可保留完整 evidence chain。复杂度与风险、可逆性和实际影响成比例。

Projection 只能减少无关加载，不能删掉当前 finding 所需的规范或证据。

Standard Package 的 Lightweight Review 仍必须核 package intent/oracle、授权 scope、受影响兼容性、必要证据/测试和 escalation signal。Sensitive Package 的 Full Local Review 在此基础上深入实际触及的高影响边界。最终 cross-package consistency、整体 architecture 与 system-level evidence sufficiency 属于 System Review。

## 16. Human Authority

Reviewer 可以给出 pass、blocking finding、evidence insufficient，但不能替用户完成 Gate、真实体验验收或业务取舍。

## 17. Runtime Review Dispatch

每次 Independent Review 的 Runtime dispatch 都必须使用 reviewer-specific projection，并使 Fresh Isolated Context 可证明。Owner narrative 不是 review evidence。

允许输入仅为当前 review 所需的固定事实：

- Method SHA；
- Task Contract；
- relevant Shared Protocol；
- fixed candidate identity；
- authoritative upstream artifacts；
- original evidence；
- targeted re-review 所需的 prior report 与 open finding IDs。

默认排除：

- Owner full chat；
- Owner private reasoning；
- Owner defensive summary；
- irrelevant prior attempts；
- mutable worktree narrative。

review dispatch 的 crossing 只记录这些固定输入的引用和 receipt，不复制 semantic Contract，也不改变 Task ownership、state、Gate 或 Human Authority。

Owner 对 implementation、test 或被审 artifact 的语义作出改变后，旧 review head / candidate identity 对新实现失效，必须形成新的 fixed review target。Targeted re-review 保留原 finding IDs、prior report 和 round/event chain；不得创建 replacement finding identity 或改写历史 report。

Runtime crossing 不改变既有 system finding lifecycle：

```text
source finding
→ effective closure route
→ child repair/revision Task
→ fixed candidate
→ required isolated review
→ semantic/runtime revalidation
→ system re-review/escalation when required
→ additive closure event
```

historical finding 永不被重写或删除。`local-close`、`system-rereview`、invalidation、escalation、Gate 与 Human Authority 继续完全由本协议既有规则治理；Runtime job 或 mechanical checker 均无权替代。
