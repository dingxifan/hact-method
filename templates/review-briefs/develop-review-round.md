<!-- develop 独立证据审查逐轮报告模板；首次 full，整改后默认 targeted。 -->
---
schema: develop-review-round/v2
review_policy: bounded-v1
task_id: <待填>
round: 1
mode: full | targeted
risk: standard | sensitive
prior_report: null
target_finding_ids: []
base_ref: <固定 commit SHA>
reviewed_base: <commit/tree SHA>
reviewed_head: <commit/tree SHA>
diff_sha256: <`git diff --binary reviewed_base reviewed_head` 原始字节的 SHA-256，64 位小写 hex>
changed_files: []
evidence_only: false
evidence_files: []
escalate_to_full: false
conclusion: pass | revise | evidence-needed
---

## 本轮证据与判断

先按本目录 `review-scope.md` 确认反例属于审查范围；证据说明当前违规、正常误用或外部入口。旧 finding 因范围纠正关闭时沿用 id/status，在 evidence 写明“范围纠正，非代码修复”及理由，不改 schema、不删除历史报告。

首审写必要范围和证据；复审引用 prior_report，只补新证据、问题判断和结论，不重复任务背景、完整范围或已通过项。

- `full`：按对应 brief 核改动。只报发现、必要证据和未完成验证，不逐维度填“无发现”。
- `targeted`：读前次独立报告，核目标 finding、修复增量及受影响调用链/回归；局部新发现沿用此模式并分配新 id，不重审未受影响部分。新增文件、模块、依赖本身不触发全审。
- 同快照补证使用 `targeted` + `evidence_only: true`：reviewed_base/head 均等于上一轮 reviewed_head，changed_files 为空，diff_sha256 仍由空 diff 机械生成；evidence_files 列本次新增原始运行证据的项目内相对文件路径，不得引用本轮/旧 round 报告冒充运行证据。正文说明目标证据缺口、命令/配置/环境、结果与待审版本的对应。测试、实现、依赖或受版本控制配置有变化时必须普通增量复审。仍编号新 round 并如实计入历史 code_rounds，但不消耗实质代码审查额度；不改写旧报告、不新增补证阶段。
- 局部契约/owner 修订只核修订 diff 和受影响实现，记录修订依据；不改写历史报告。纯规格修订计 spec_rounds，无代码增量不制造代码复审；最新契约仍须由审查员核对。
- 仅当改动使先前结论广泛失效（如改变公共信任边界或跨模块契约，无法局部验证）时置 `escalate_to_full: true`，写明失效结论和原因，下一轮才 full。超出授权范围仍先处理授权/契约，不靠局部复审默认授权。
- 每任务最多三个有实现/测试变化的代码审查快照（含首审）；由相邻 Git tree 推导，不新增计数字段。当前任务包登记、status 和审计落盘不消耗该额度；纯规格变化仍按原规格职责处理。达到额度后仍需代码整改则按根因升级，换 finding id、恢复或升 full 不清零。同快照同问题集中补证一次，仍不能判断就暂停并说明缺口，不反复派审、不自动认定要修设计。历史 round/code_rounds 仍统计全部实际代码审查报告，不能用总报告数直接判整改额度。

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

同一根因的调用语法/输入变体合并到同一 id 的 evidence，不按变体数增加 finding。事件计时可选；如记录则由编排器当场写入，不事后补估、不强制对齐，不构成复审完成门。

新报告使用 review_policy=bounded-v1；历史未声明报告不回填，从首次声明的轮次起不得退回旧策略。结论须与仍开放的问题一致：pass 无阻断；revise 有待整改的阻断；evidence-needed 有 action=request-evidence 的开放阻断。没有开放阻断且未提出有依据的扩审时必须 pass，建议不阻断。扩审须在正文写明失效结论与原因，不能以扩审绕过无阻断时的收敛。补证目标必须是上一轮仍开放的 request-evidence 问题，不能把未完成代码整改包装成纯补证。

使用项目 `node scripts/build-review-anchor.js --task {task-id} --head {tree} --write` 直接生成下一轮草稿：自动读取 preflight/末轮、带入开放问题和机械锚，同快照自动识别 evidence_only。conclusion=pending 必须由独立审查员判定；不自动关闭问题或批准扩展。必要的规格复核用同一命令追加 `--spec --base {tree}`，普通 files 登记不生成 spec-round。旧 `{base} {head} .` 用法保留，只输出机械字段。

报告中的 `reviewed_base/reviewed_head` 必须是当前仓真实存在的 commit/tree；`changed_files` 与 `diff_sha256` 必须从这两个对象机械重算。`conclusion: pass` 时不得残留 `severity: blocking + status: open`；targeted 报告须逐条回写每个 `target_finding_ids` 的关闭或仍开放状态。

存量 `review_profile`、`review_profile_version` 与 profile JSON 仅作历史附件保留，不生成、更新或校验；续做直接沿原报告链核固定 diff 和未关闭问题，不改写旧报告。
