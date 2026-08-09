<!-- develop freshness preflight 留痕模板；A/B 共用。只记当前核对结果，不写开发过程叙事。 -->
---
task_id: <待填>
source: sprint | foundation | integration | manual-test | bug | optimization
timing: before-code | retroactive
started_at: <ISO-8601>
completed_at: <ISO-8601>
base_ref: <固定 commit SHA>
base_tree: <git write-tree SHA>
result: pass | revised | blocked
spec_minutes: 0
---

## 核对结果

| 面 | 证据锚 | 结论 |
|---|---|---|
| files / reference | <稳定符号/章节/路径> | current / drift |
| upstream mechanism / contract | <代码或契约锚> | current / drift |
| intent / oracle / example | <AC id + 复算结果> | current / drift |
| do-not / escalate-if / owner | <任务包字段 + owner> | current / drift |
| supersedes / retirement | <对象与调用方证据> | current / drift / N/A |

## 路由

```yaml
findings: []
# 或：
# - type: example-error | contract-drift | scope-gap | evidence-gap
#   action: revise-doc | global-gap-review | request-evidence
#   evidence: <当前证据>
#   closed_by: <修订锚；未关闭写 null>
```

`timing: retroactive` 只表示接管已有 diff 后补核，不得改写为 `before-code`。`spec_minutes = ceil((completed-started)/60s)`；`result` 非 `pass/revised` 或任一 finding 未关闭时，不进入实现/独审。
