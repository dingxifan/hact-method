# TRD Independent Review 入口

本文件不是第二份审查规范。权威要求只来自同一 adopted Method SHA 的：

- `tasks/draft-tech-design.md` §7 Review & Human Authority；
- `protocols/review.md`；
- `templates/review-briefs/review-scope.md`。

派发者必须提供：

- Method SHA；
- task id 与 iteration；
- fixed candidate commit/tree；
- TRD path 与 SHA-256；
- authoritative PRD/UX/Foundation/project inputs；
- 适用的 original evidence；
- targeted re-review 时的 prior report 与全部 open finding IDs。

Reviewer 使用 Fresh Isolated Context，只从 fixed candidate 读取允许内容，不继承 Owner narrative，不修改项目。审查重点直接读取 `tasks/draft-tech-design.md` §7，不在本文件复制。

输出追加到：

```text
iterations/vN/document-reviews/{task-id}/round-NN.md
```

报告使用 `hact-document-review/v1`，至少包含：

```yaml
---
schema: hact-document-review/v1
task_id: {task-id}
task_type: draft-tech-design
round: 1
review_type: initial                 # initial | targeted
reviewer_isolation: fresh-isolated
prior_report: null                   # targeted 指向紧邻上一轮项目相对路径
candidate_commit: {40-char SHA}
candidate_tree: {40-char tree SHA}
artifact_path: iterations/vN/trd.md
artifact_sha256: {64-char SHA-256}
target_finding_ids: []               # targeted 覆盖上一轮全部 open blocker
blocking_finding_ids: []             # 本轮新建 blocker
closed_finding_ids: []               # 本轮经新 candidate 验证关闭
open_blocking_finding_ids: []        # 本轮结束后的完整 open 集合
conclusion: pass                     # pass | revise
---
```

正文写 finding 的具体位置、依据、严重程度与 required action。无发现写 `findings: []`。`pass` 必须对应空的 `open_blocking_finding_ids`；Gate/G2 仍由用户独立批准。
