---
schema: system-review/v2
review_id: review-001
review_type: full
candidate: <git-commit-or-tree>
prior_report: null
target_finding_ids: []
new_finding_ids: []
closed_finding_ids: []
open_finding_ids: []
conclusion: pass
evidence_refs: []
created_at: <ISO-8601>
---

# System Review

按 `protocols/review.md` 选择 Fresh reviewer；semantic / holistic review 在适合且 immutable sources 完整时优先使用 Fresh ChatGPT context。Planner / designer / owner chat 不能直接充当 reviewer，targeted re-review 同样要求 Fresh Isolation。Brief 提供 Method SHA、fixed candidate、PRD/TRD、相关 packages/review/evidence pointers 与允许读取的 immutable source scope，不携带 implementation narrative 或 developer self-summary。

## Scope

- authoritative contracts:
- architecture / shared boundaries:
- runtime evidence:
- allowed paths / call chains:

## Findings

每个新 blocking finding 使用稳定标题：

```text
### SYS-F001
Severity: blocking
Summary: <concise defect>
Evidence: <specific immutable evidence>
Required action: <exact correction>
```

Targeted re-review 引用 prior report 与 open finding IDs，在新 fixed candidate 上写入 `closed_finding_ids`。影响无法限定时使用新的 `review_type: full` report；不创建 route、escalation、invalidation 或 closure artifact。

修复后的 semantic conclusion 与必要 runtime verification 必须最终对同一个 fixed final candidate 有效；按 `tasks/integration-verify.md` §5.1 核对受影响复验与未受影响结论的复用依据，不以旧 candidate 的 PASS 直接关闭新 candidate。

## Conclusion

`open_finding_ids` 非空时必须 `blocked`；为空时才能 `pass`。Reviewer 不能批准 Gate、Human Authority 或 Task completion。
