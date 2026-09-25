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

## Conclusion

`open_finding_ids` 非空时必须 `blocked`；为空时才能 `pass`。Reviewer 不能批准 Gate、Human Authority 或 Task completion。
