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
diff_sha256: <64 位小写 hex>
changed_files: []
started_at: <ISO-8601>
completed_at: <ISO-8601>
elapsed_minutes: 0
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

同一根因的调用语法/输入变体合并到同一 id 的 evidence，不按变体数增加 finding。`started_at/completed_at` 由编排器在事件发生时写入，`elapsed_minutes = ceil((completed-started)/60s)`，不得事后估算。
