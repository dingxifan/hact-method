# Review Protocol

Independent Review 用于对 Candidate Truth 提供独立挑战，而不是重复生成过程。

## 1. 核心原则

默认优先：

`Same Runtime + Fresh Isolated Context + Same Task Contract`

独立性的首要来源是 cognitive isolation，而不是模型品牌不同。只有当前 Runtime 无法提供可信隔离或缺少必要能力时才切换 Runtime。

## 2. Reviewer 输入

默认允许：
- fixed candidate snapshot
- Task Contract
- authoritative upstream artifacts
- relevant code / project facts
- 必要 evidence
- 适用 Shared Protocol

默认不提供：
- Owner 的完整生成聊天
- Owner 的私有推理
- Owner 的辩护性总结
- 与当前 review 无关的大量历史上下文

Reviewer 自己读取权威事实。

## 3. Review target

Review 必须绑定明确 snapshot。代码审查使用 fixed base/head 或等价 immutable 范围；文档审查使用明确 candidate commit。

## 4. Evidence

Owner 的 risk、files、test 清单和“已验证”声明只是待核输入，不是证据真相。

有效 Evidence 必须匹配被审实现、依赖/配置、实际执行路径和适用环境。

## 5. Task-specific focus

Shared Review Protocol 只定义共性纪律。每个 Task 的特殊审查重点写入其 Task Contract。

## 6. Findings

Reviewer 输出至少包含：
- finding
- evidence / basis
- severity / blocking nature
- required action 或 conclusion

Finding 应指向具体承诺、路径或证据缺口，不以“还能更完善”阻断。

## 7. Bounded convergence

Review 不无限循环：

`candidate → review → targeted fix → targeted re-review`

根因闭合、必要回归通过、无新的范围内 blocking evidence 时结束。超过约定边界进入 escalation，不继续无界复审。

## 8. Proportionality

低风险 reasoning artifact 可采用 Lightweight Review；高风险 execution artifact 可保留完整 evidence chain。复杂度与风险、可逆性成比例。

## 9. Human Authority

Reviewer 可以给出 pass、blocking finding、evidence insufficient，但不能替用户完成 Gate、真实体验验收或业务取舍。
