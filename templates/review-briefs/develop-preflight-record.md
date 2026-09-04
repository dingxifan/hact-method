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
---

## 正常结果（`result: pass` 时使用）

`files/reference`、上游机制/契约、`intent/oracle/example`、scope/owner 与退役对象均与当前基线一致；无 freshness finding。

## 异常展开（仅 `result: revised|blocked` 时使用）

| 漂移面 | 证据锚 | 结论 |
|---|---|---|
| <只列命中的面> | <稳定符号/章节/路径/AC id> | drift / closed |

### 路由

```yaml
findings: []
# 或：
# - type: example-error | contract-drift | scope-gap | evidence-gap
#   action: revise-doc | global-gap-review | request-evidence
#   evidence: <当前证据>
#   closed_by: <修订锚；未关闭写 null>
```

`timing: retroactive` 只表示接管已有 diff 后补核，不得改写为 `before-code`。本记录只保留事件时间戳，分钟数不重复持久化；`status.yml.code_reviews[].spec_minutes` 在终态汇总 preflight / revise-doc 等多段规格墙钟。`result` 非 `pass/revised` 或任一 finding 未关闭时，不进入实现/独审。
