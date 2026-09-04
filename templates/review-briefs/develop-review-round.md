<!-- develop 独立证据审查逐轮报告模板；首次 full，整改后默认 targeted。 -->
---
task_id: <待填>
round: 1
mode: full | targeted
risk: standard | sensitive
review_profile: <项目根相对路径；full 新生成 profile-round-NN.json，targeted 继承最近 full；Foundation 固定 foundation-review/v1>
prior_report: null
target_finding_ids: []
base_ref: <固定 commit SHA>
reviewed_base: <commit/tree SHA>
reviewed_head: <commit/tree SHA>
diff_sha256: <`git diff --binary reviewed_base reviewed_head` 原始字节的 SHA-256，64 位小写 hex>
changed_files: []
standards_checked: [] # 本轮实际核过的 relevant-standards rule ids；targeted 仅列重核项
started_at: <ISO-8601>
completed_at: <ISO-8601>
escalate_to_full: false
conclusion: pass | revise | evidence-needed
---

## 本轮范围

```yaml
counterexamples: []
affected_regressions: []
changed_surface_allowed: []
```

- `full`：按 `review_profile.selected_dimensions` 执行 `develop-review.md` 对应 id；omitted 不输出 N/A。profile 缺失/不闭合即停止。
- `targeted`：继承最近 full 的 `review_profile`，只核 `target_finding_ids`、对应反例、受影响回归和本轮增量 diff；不重做其他维度。
- targeted 若发现 changed surface 越界、新机制/模块/依赖或新根因，只记录证据并置 `escalate_to_full: true`，下一轮升 full。

## Findings

```yaml
findings: []
# - id: <task-id>-F001
#   dimension: contract
#   severity: blocking | advisory
#   type: behavior-bug | contract-drift | example-error | enforcement-claim | scope-gap | future-risk | evidence-gap
#   reachability: current | conditional | unreachable | unknown
#   evidence: <反例/文档冲突/尚缺证据>
#   impact: <当前可观察后果；未知写 unknown>
#   action: fix-code | revise-doc | fix-mechanism | downgrade-claim | global-gap-review | backlog | request-evidence
#   status: open | verified-closed | advisory
```

同一根因的调用语法/输入变体合并到同一 id 的 evidence，不按变体数增加 finding。`started_at/completed_at` 由编排器在事件发生时写入；逐轮耗时按需由两者计算，不重复持久化分钟字段。

报告中的 `reviewed_base/reviewed_head` 必须是当前仓真实存在的 commit/tree；`changed_files` 与 `diff_sha256` 必须从这两个对象机械重算。`conclusion: pass` 时不得残留 `severity: blocking + status: open`；targeted 报告须逐条回写每个 `target_finding_ids` 的关闭或仍开放状态。
