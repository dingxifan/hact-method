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

Fresh Isolated Context 不等于第二个用户可见窗口。默认由当前主 Runtime 内部启动不继承 Owner narrative 的 isolated reviewer，report 回到同一主 interaction；用户不负责在 reviewer/implementation 窗口之间搬运上下文。

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

System Reviewer 首次 report 必须针对最终 system candidate 做 `full` review。后续 report 可以是 `targeted` 或 `full`；targeted 必须读取 predecessor、open findings、repair candidate、必要 evidence 与完整受影响调用链。Review depth 由影响能否可靠限定决定，不由 diff 文件数决定。

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

所有 blocking finding 至少持久化：stable finding ID、severity、summary、evidence、required action。Finding 在 source report 中保持 open；只有后续 Fresh Independent Review 针对新 fixed candidate 明确关闭它，才算 closed。

`advisory` 不进入 blocking lineage。

## 9. Finding closure and review depth

闭环只有一条：

```text
fixed candidate
→ fresh review with stable findings
→ fix creates new fixed candidate
→ targeted fresh re-review closes findings
```

Targeted re-review 必须读取 prior report、open finding IDs、fixed repair candidate、受影响完整调用链和必要 validation evidence。

如果 fresh reviewer 判断影响无法可靠限定，或修复改变 shared contract、authorization、core state machine、broad data model、major architecture 或 material Product/Technical Contract，则直接要求 full review。无需 route、escalated state、invalidation flag 或 separate closure artifact。

实现者、runtime executor、checker 或主线总结都不能关闭 blocking finding。

## 10. Durable lineage

每次 reviewer invocation 形成新的 immutable report。旧 report 不改写；当前 open/closed finding 由报告链按 stable finding ID 推导。runtime verification 在 review 后发现 blocker 时，创建新的 review report/finding，而不是平行 finding schema。

文档 Task 使用 `hact-document-review/v1`：首轮 `initial`，后续 `targeted`；每轮绑定 candidate commit/tree 与 artifact SHA-256。Targeted round 必须指向紧邻 prior report、覆盖上一轮全部 open blocking finding，并分别声明新建、关闭与仍开放的 stable finding IDs。末轮 report 先进入一个固定 `document_review_commit`，status 只保存该 commit 与 `latest_document_review` 路径；task-specific completion checker 从这个 Git snapshot 读取整条报告链。后续路径变化不改写已经接受的 review truth；新的 judgement 使用新 report/new pointer。不得套用 develop package 的 preflight/package-schema/review-chain。

## 11. Bounded convergence

Review 不无限循环：`candidate → review → targeted fix → targeted re-review`。必要回归通过且无新 blocking evidence 时结束；影响无法限定时升级为 full review，而不是增加管理状态。

## 12. Proportionality

低风险 reasoning artifact 可采用 Lightweight Review；高风险 execution artifact 可保留完整 evidence chain。复杂度与风险、可逆性和实际影响成比例。

Projection 只能减少无关加载，不能删掉当前 finding 所需的规范或证据。

Standard Package 的 Lightweight Review 仍必须核 package intent/oracle、授权 scope、受影响兼容性、必要证据/测试和 escalation signal。Sensitive Package 的 Full Local Review 在此基础上深入实际触及的高影响边界。最终 cross-package consistency、整体 architecture 与 system-level evidence sufficiency 属于 System Review。

### Reviewer 不为“更保险”自动加机制

Reviewer 不得仅因更可观测、更可审计、更容易 debug / 恢复，或多一道 lock、generation、receipt、evidence 会更保险，而建立 blocking finding。若要求新增 durable state、evidence 或 control，必须指出当前 Contract 的具体未满足项、最终 invariant 的具体 failure path、明确 security / Authority risk、不可逆 / crash recovery 缺口、external compatibility obligation，或已有 evidence 证明当前机制不足。找不到依据时只能作为 advisory，不能成为 blocking requirement；本节不增加 finding type、severity 或 report schema。

## 13. Human Authority

Reviewer 可以给出 pass、blocking finding、evidence insufficient，但不能替用户完成 Gate、真实体验验收或业务取舍。

## 14. Independent Review isolation

每次 Independent Review 必须使用 fixed candidate + review brief，并使 Fresh Isolated Context 可证明。Owner narrative 不是 review evidence。

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

Review brief 明确：candidate tree、allowed paths/scope、review focus、authoritative inputs 与 evidence。Targeted review 再加入 prior report 与 open finding IDs。Git tree 已绑定所有文件内容，不逐文件重复运输 blob receipt。

Reviewer 只从 immutable candidate 读取 brief 允许的内容。Owner 改变 implementation、test 或被审 artifact 后必须形成新 candidate；旧 report 保持历史 judgement。
