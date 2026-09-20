# Review Protocol

Independent Review 用于对 Candidate Truth 提供独立挑战，而不是重复生成过程。

## 1. 核心原则

默认优先：

`Same Runtime + Fresh Isolated Context + Same Source of Truth`

独立性的首要来源是 cognitive isolation，而不是模型品牌不同。只有当前 Runtime 无法提供可信隔离或缺少必要 capability 时才切换 Runtime。

“Same Source of Truth” 不等于 Reviewer 每次都必须预加载整份长 Task Contract。Reviewer 应从同一 Task 文件按审查需要做 projection，避免为了独立性制造重复规范或无条件上下文膨胀。

## 2. Reviewer projection

首次 full review 默认从同一 `tasks/{task}.md` 读取：

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

Targeted re-review 默认只加载：

- prior report 与未关闭 finding ids；
- 新的 fixed snapshot / changed surface；
- 与这些 finding 直接相关的 Task sections、Shared Protocol 与 evidence。

除非变化使原结论失效，不重新全文审一遍。

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

## 9. Bounded convergence

Review 不无限循环：

`candidate → review → targeted fix → targeted re-review`

根因闭合、必要回归通过、无新的范围内 blocking evidence 时结束。超过 Task 约定边界进入 escalation，不继续无界复审。

换 Runtime、session 或 reviewer 不自动清零 finding、snapshot count、attempts 或有效 evidence。

## 10. Proportionality

低风险 reasoning artifact 可采用 Lightweight Review；高风险 execution artifact 可保留完整 evidence chain。复杂度与风险、可逆性和实际影响成比例。

Projection 只能减少无关加载，不能删掉当前 finding 所需的规范或证据。

## 11. Human Authority

Reviewer 可以给出 pass、blocking finding、evidence insufficient，但不能替用户完成 Gate、真实体验验收或业务取舍。
