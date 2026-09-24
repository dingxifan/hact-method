---
schema: hact-task/vnext
task: wrap-up-iteration
class: A
discipline: management
gate: G5
preferred_runtime: reasoning
required_capabilities:
  - repository-read
  - semantic-reasoning
  - artifact-authoring
  - persistence
review: none
---

# wrap-up-iteration

## 1. Purpose & Scope

### Purpose

在 G4 之后把本期已经发生的真实结果、偏离、退役、欠账、长期项目事实和必要审计索引对账闭合，形成稳定 iteration closeout；Task 自身完成后，G5 进入 ready，由用户对明确 Accepted snapshot 做最终 Iteration Closed authority approval。

### In scope

- 核本期 Product / Technical Contract 与实际结果的偏离
- 关闭必须在本期处理的 revision / repair
- 核本期 `supersedes` 退役账
- 明确跨期欠账的真实去向和责任
- 更新 `project.md` 的长期产品 / 技术事实
- 准确记录 deployment state
- 维护当前 status contract 要求的 review audit archive / index
- 形成 G5 readiness
- 在 Task `merged` 后记录用户 G5 approval

### Out of scope

- 为了“干净”而清空 feedback / backlog
- 强制创建或整理私人 notes
- 把本期未完成承诺改名为“经验”后消失
- 把 deployment pending / failed 写成已上线
- 覆盖其他迭代仍有效的 project facts
- 把方法论改造自动纳入项目收尾授权
- 用 AI 自己的“看起来收尾了”替代 G5 Human Authority

## 2. Preconditions

从 `可取` 进入 `taken-by` 前必须满足：

- 当前 HACT Method fixed SHA 已知。
- `status.yml` 可读取。
- `manual-test` 已 `merged`。
- G4 已 approved。
- 当前 PRD / TRD / acceptance result 与本期最终 Accepted implementation 可读取。
- 本期 deploy 状态如果存在，能够判断为 deployed / pending / failed / not-applicable；deploy 本身不是进入本 Task 的硬前置。

## 3. Authoritative Inputs

### Required

- 当前 HACT Method fixed SHA
- `status.yml`
- 本期 Accepted PRD / TRD / relevant Foundation / project constraints
- acceptance report
- 当前 Accepted implementation
- 本期 backlog / feedback 中与当前 iteration 有关的条目
- 本期 develop review / integration / manual-test evidence pointer
- 本期 `supersedes` / retirement obligation
- 当前动作实际触发的 Shared Protocol projection；按 `templates/boot-protocol.md` 与对应 Protocol 的最小加载规则读取，不预加载全部 `protocols/`

### Conditional

- deploy log / deployment state
- decisions / revision record
- prior project.md
- current `status-reviews/` archive
- B-class merged review entries that current status contract要求在本次机械归档
- unresolved incident / waiver / accepted defer evidence

上一 Runtime 的总结不是 iteration closeout truth。必须重新读取 durable artifacts 和真实 deployment state。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| Long-term project facts | `project.md` | 只更新本期真实改变的稳定事实 |
| Closeout corrections | PRD / TRD / Foundation / decisions / backlog 等现有权威位置 | 仅在真实偏离需要时 |
| Review audit archive | `status-reviews/{key}.yml` 等当前 status contract 位置 | 机械归档，不改历史 finding 语义 |
| Archive index | `status.yml` 当前约定字段 | 与 archive 文件、count 一致 |

### State updates

- `status.yml`：wrap-up-iteration Task lifecycle
- Task `merged` 后，G5 readiness 可计算为 ready
- 用户 G5 approval 后按现有 `status.yml` Gate serialization 记录 authority event；Git history 与 fixed closeout snapshot 提供 snapshot binding

### Conditional outputs

- `revise-doc`
- `develop` repair
- backlog / accepted defer
- deployment truth update
- recovery pointer

不要求清空 feedback、创建私人 notes 或复制一份 gates.md。

## 5. Decision Rules & Boundaries

### 5.1 Close real gaps, not files

Closeout 判断的是本期事实是否闭合，不是某个文件是否为空。

以下事项必须有真实结论：

- 用户行为 / Product Contract 偏离
- API / data / Technical Contract 偏离
- 本期必要实现缺口
- retirement obligation
- 本期已知欠账
- deployment state
- 仍影响后续工作的长期技术 / 产品事实

清空 backlog / feedback 不能证明上述问题已解决。

### 5.2 Contract deviation

实际结果与已接受 Contract 不一致时：

- 当前仍应满足原承诺 → `develop` repair
- Contract 本身需要调整 → `revise-doc` + 必要 Human Authority
- 用户明确接受 defer / scope adjustment → 记录 durable decision、理由和后续承接

不得把本期必要承诺静默转成跨期待办。

已批准 Gate 是历史事实；revision 不回退历史 G1–G4。

### 5.3 Retirement truth

本期 `supersedes` 非空项必须逐条闭合：

- **已下线**：真实实现 / 注册 / 路由 /维护责任已退出
- **保留**：写明保留理由与解除条件

“无调用方但代码仍注册、仍测试维护”不是已下线。

### 5.4 Project facts only

`project.md` 记录稳定项目事实，不记录本期过程流水账。

只更新本期真实导致变化的产品 / 技术事实：

- 已验证存在的能力
- 稳定架构 / constraint
- 当前 deployment state
- 仍影响未来 Task 的 durable decision

没有 deployment evidence 时只能写 pending / failed / not-applicable，不能写“已上线”。

其他 iteration 的“开发中”或未变事实不因本期 wrap-up 被覆盖。

### 5.5 Deployment is orthogonal to G5

G5 表示 iteration facts closed，不等于 production deployment success。

允许在 G5 时记录：

- deployment succeeded
- deployment pending
- deployment failed
- deployment not-applicable

前提是事实准确、风险与后续承接明确。

deploy 后续状态变化作为新事实更新，不自动撤销历史 G5。

### 5.6 Debt routing

跨期欠账必须至少有：

- 问题
- 影响
- 去向
- owner / future Task 或接受 defer 的 Authority evidence

不要求所有未来改进在本期完成。

但“本期原本承诺且尚未满足”的内容不能仅凭加 backlog 就视为闭合。

### 5.7 Feedback is evidence, not a queue-zero KPI

feedback 可以：

- 已处理并引用结果
- 保留等待未来采用
- 标记不采纳理由
- 继续存在

不以反馈数量、是否为空、是否已转私人 notes 判断 G5 readiness。

### 5.8 Review audit archive

当前项目若使用 `status.yml code_reviews[]` + `status-reviews/` 归档：

- iteration 相关完整 review entry 原样搬入对应 archive
- 不改 finding / comment / issue 历史
- archive index / count 与实际文件一致
- 不归档 `tasks[]`、Gate 或无关状态
- B-class 归档按当前 status contract 的唯一 B archive 规则维护
- 不按条数或迭代数人为设置清理阈值

这是审计机械动作，不产生新的语义判断。

### 5.9 G5 single authority event

当 wrap-up Task 已 `merged` 后：

- closeout artifacts 已进入 Accepted Project Truth
- deterministic closeout checks 通过
- G5 readiness 为 ready

此时向用户呈现：

- 本期最终事实
- 重要偏离 / defer
- deployment state
- 仍未完成事项
- G5 approved snapshot

用户明确批准“本期关闭 / G5”或等价语义，即形成单一 G5 Human Authority Event。

已经对同一 snapshot 明确批准时不重复确认。

如果用户不批准，G5 保持未 approved；已 `merged` Task 不回退。需要修正 closeout truth 时创建明确 revision / correction Task，再形成新的 Accepted snapshot。

## 6. Verification

### Deterministic

必须能够机械证明：

- G4 已 approved
- 当前 iteration 没有应由本期完成却仍开放的 required develop / revision Task
- acceptance report 可读取
- retirement obligation 有结论
- project.md 存在且本期事实更新可追溯
- deployment state 有明确枚举 / 事实来源
- 当前 review archive 文件、index、count、唯一性满足 status contract
- 项目当前 `check-gate` / `check-sprint` 等 closeout checker（若存在）通过
- wrap-up Task `merged` snapshot 明确
- G5 approval record（批准后）绑定明确 Accepted snapshot

### Semantic

必须确认：

- 产品 / 技术偏离没有被静默吞掉
- 本期必要缺口没有被伪装成 future improvement
- accepted defer 有真实 Authority / durable evidence
- project.md 反映的是事实，不是计划
- deployment truth 没有夸大
- debt / retirement / decisions 足以让未来 Task 正确恢复项目世界

## 7. Review & Human Authority

### Independent Review

本 Task 默认不增加固定 AI Independent Review。

closeout 主要依赖：

- deterministic reconciliation
- durable evidence
- G5 Human Authority

如果本期偏离、revision 或事实对账复杂，可按风险增加独立语义 review，但不替代 G5。

### Human Authority

用户负责：

- 范围调整 / accepted defer
- 重要业务偏离的接受
- G5 approval

G5 必须绑定明确 Accepted Project Truth snapshot。

## 8. Completion & Handoff

### `done`

满足：

- 本期 closeout candidate 已形成
- 必要 revision / repair 已闭合
- retirement / debt / deployment truth 已对账
- project.md 与必要 archive candidate 已稳定
- deterministic closeout checks 可对 candidate 执行
- 不存在未解决 Authority blocker

### `done → taken-by`

出现以下任一情况时回 `taken-by`：

- closeout checker 失败
- candidate 与真实 deployment / project facts 不一致
- 新证据表明仍有本期 blocking gap
- candidate snapshot 在 verification 后变化

### `merged`

满足：

- deterministic / semantic closeout verification 对同一 snapshot 成立
- project.md、必要 revision / archive / state 已进入 Accepted Project Truth
- `status.yml` 准确记录 wrap-up-iteration `merged`

此时 **G5 进入 ready，但不会因为 Task `merged` 自动 approved**。

### G5

用户对明确 Accepted closeout snapshot 批准后：

- 记录 G5 authority event
- G5 = approved
- iteration 在治理意义上 closed

### Downstream

G5 approved 后，本 iteration 正常生命周期闭合。

后续发现的问题走：

- B Intake
- `revise-doc`
- 新 iteration

不回退已 `merged` wrap-up Task 或历史 G5。

## 9. Recovery Notes

恢复时除 `protocols/recovery.md` 的共同来源外，额外读取：

- G4 / G5 当前状态
- wrap-up Task state
- current closeout candidate / accepted snapshot
- backlog / feedback 中本期关联项
- revision / repair 状态
- retirement obligation
- deployment state / deploy log
- `project.md`
- review archive / index

如果 wrap-up 已 `merged`、G5 尚未 approved：

- 不重做 closeout
- 重新读取 Accepted closeout snapshot
- 只呈现当前 G5 facts 并请求 / 等待 Human Authority

如果 G5 已 approved 但机械 archive / state persistence 异常：

- 先核 approved snapshot 与当前 Git truth
- 能证明仍是同一世界时补机械记录
- 不要求用户重复批准

如果部署状态在 G5 后变化：

- 更新 deployment truth
- 不撤销历史 G5

## 10. Runtime Routing

Stay Local 为默认；实际 crossing 只允许 `Reality Probe`、`Review Dispatch`、`Derived Child Task`，并遵循 Runtime Crossing / Authority / Recovery / Review Protocol 与 Runtime Orchestration Skill。canonical Task 始终是 `wrap-up-iteration`；Runtime job 不创建 ownership/state、Gate 或 closeout truth。

Independent Semantic `Review Dispatch` **CONDITIONAL, NOT DEFAULT**：只在 deviation、revision 或 fact reconciliation 复杂时触发，且不能替代 G5 Human Authority。普通 mechanical closeout 不新增 review completion condition。

真实 gap 可通过 `Derived Child Task` 建立 canonical `revise-doc` 或 `develop` work，前提是满足既有 registration/intake/package/status/ownership 要求；historical merged Tasks/Gates 不 reopen。用户侧“完成”仍只由实际 iteration closeout 与 G5 语义建立，Runtime/review/child completion 单独均不足够。
