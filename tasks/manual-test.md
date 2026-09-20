---
schema: hact-task/vnext
task: manual-test
class: A
discipline: product
gate: G4
preferred_runtime: human-led
required_capabilities:
  - repository-read
  - artifact-authoring
  - user-interaction
  - persistence
review: none
---

# manual-test

## 1. Purpose & Scope

### Purpose

让用户基于**真实系统**完成本期 Product Contract 的最终体验与业务验收；AI 负责准备验收上下文、记录事实、路由问题、跟踪修复、维护验收报告，并把用户的明确接受作为 G4 Human Authority Event 持久化。

### In scope

- 向用户呈现本期真实验收范围与测试环境
- 以用户任务和可观察业务结果为主组织验收
- 复用 develop / integration-verify 对不可视行为的有效 Evidence
- 收集用户反馈并判断是否属于本期 Contract
- 把本期实现问题路由到 `develop(source=manual-test)`
- 把 PRD 歧义路由到 `revise-doc`
- 把范围外需求路由到 backlog / 后续 B Intake
- 逐条处理本期已知欠账
- 形成 acceptance report
- 记录用户明确验收通过与 G4 approval

### Out of scope

- AI 自己宣布“验收通过”
- 在 manual-test Task 内直接修改代码
- 因为问题“小”就绕过 `develop`
- 重新人工验证已经由有效 mechanical evidence 证明的全部不可视内部细节
- 把范围外新功能强行塞入当前 A 类迭代
- 在生产数据上进行普通验收
- G4 后回退历史 Gate 或历史 manual-test Task

## 2. Preconditions

从 `可取` 进入 `taken-by` 前必须满足：

- 当前 HACT Method fixed SHA 已知。
- `integration-verify` / System Verification 已 `merged`。
- 当前 final system candidate 明确，Semantic / Holistic Independent Review 与 Runtime Integration Verification 均 satisfied。
- 当前 Accepted system-review lineage 与 integration result 无未关闭 blocking finding、unresolved escalation、pending system-rereview 或缺失的 required revalidation。
- 当前用于验收的 implementation snapshot 明确。
- 测试环境可用或有明确建立方式。
- 测试数据环境不是未获授权的生产数据环境。
- 当前 PRD Product Contract 已进入 Accepted Project Truth。

如果 integration-verify 只有“System Review 已出报告”“runtime tests 已绿”或“修复任务已派发”中的一部分，而另一 assurance lane、修复、closure 或 revalidation 尚未闭合，manual-test 不可进入 `可取`。

## 3. Authoritative Inputs

### Required

- 当前 HACT Method fixed SHA
- `status.yml`
- `iterations/vN/prd.md`
- 当前 Accepted System Verification result，包括 system-review lineage 与 integration result
- 当前被验收的 Accepted implementation snapshot
- 本期 backlog 中明确标记的 `[欠账]` / 已知未闭合事项
- 当前动作实际触发的 Shared Protocol projection；按 `templates/boot-protocol.md` 与对应 Protocol 的最小加载规则读取，不预加载全部 `protocols/`

### Conditional

- `ux-flows.md`
- `design.md`
- system-review / closure / revalidation evidence
- integration evidence
- develop test / review evidence
- `iterations/vN/trd.md` 的测试环境约定
- 既有 acceptance report / prior round progress

上一 Runtime 的总结不能替代 PRD、System Verification artifacts 或真实用户反馈。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| Acceptance report | `iterations/vN/acceptance-report.md` | 全量 AC 对账、用户反馈、处理结论、验证来源 |
| G4 authority record | `status.yml` | 按 Gate Protocol 记录批准人、时间与 approved snapshot |

### State updates

- `status.yml`：manual-test Task lifecycle
- G4 approval event 与 manual-test state 分开记录；同一用户明确接受可以同时满足两者，但两者语义不合并

### Conditional outputs

- `develop(source=manual-test)` Development Intake / Task Package
- `revise-doc(target=prd)`
- backlog 条目
- recovery pointer / progress

任何代码修改都必须通过 `develop(source=manual-test)`；manual-test 不保留旧版“简单问题直接改代码”的旁路。

## 5. Decision Rules & Boundaries

### 5.1 User owns acceptance

“验收通过”必须由用户明确表达。

AI 可以：

- 说明当前 evidence
- 指出尚未完成项
- 记录用户观察
- 判断某项反馈是否命中当前 Product Contract
- 跟踪修复与复测

AI 不能：

- 替用户评价真实体验是否可接受
- 因为 automated tests 全绿就宣布 G4
- 用更强模型替代用户 acceptance

### 5.2 Real task before checklist

存在 `ux-flows` 时，优先让用户从真实入口完成核心用户任务，而不是先逐条念 AC。

至少关注受影响任务的：

- 正常完成
- 失败
- 取消
- 恢复 / 重试
- 回到可继续工作的状态

原型通过、截图正确或 integration 浏览器场景通过都不能替代真实用户验收。

### 5.3 Evidence reuse

不可视内部行为如果已经由与当前 implementation snapshot 匹配的 develop / System Verification Evidence 有效证明，不要求用户重复做无法观察的“手工验证”。

Acceptance report 仍必须列全 PRD AC，并如实标注验证来源：

- mechanical / develop
- integration-verify / System Verification
- human manual-test
- mixed

Evidence 失效或当前环境与被测版本不一致时不得复用。

### 5.4 Known debt must be decided

本期进入 manual-test 前已经登记的 `[欠账]` 必须逐条得到用户决定：

- **本期补** → 创建 `develop(source=manual-test)`，修复 `merged` 后复测
- **留下期** → 保留 backlog，并在 acceptance report 中记录用户接受的 defer 结论

没有用户决定的本期必要欠账不能静默穿过 G4。

### 5.5 Feedback routing

用户反馈先判断与当前 PRD Product Contract 的关系。

#### In-scope behavior defect

创建 `develop(source=manual-test)`。

无论修复大小，都不在 manual-test 内直接 patch。

#### PRD ambiguity / contradiction

创建 `revise-doc(target=prd)`；revision 闭合后重新确认受影响验收项。

#### Out-of-scope new request

不改变当前 A 类 Contract。

- 记录 backlog
- 如果用户希望立即单独处理，可另行启动 B Intake
- 不因为“小于几文件”自动取得修改授权

#### Cannot reproduce

在 acceptance report 记录真实现象、复现条件与当前结论，可标待观察；是否阻断取决于它是否仍妨碍用户明确接受当前 Product Contract。

### 5.6 Repair and re-test loop

一轮用户反馈可以产生一个或多个 `develop(source=manual-test)` Task。

相关修复全部 `merged` 后：

- 重新读取新的 Accepted implementation snapshot
- 只复测受影响用户任务 / AC 及必要回归
- 未受影响且仍有效的 evidence 可以复用
- 用户发现新问题则继续 feedback loop

同一根因反复修复仍不能达到接受状态时，优先判断是否存在 Contract / design 问题，而不是无限修代码。

### 5.7 Environment boundary

普通 manual-test 必须使用测试 / staging 或用户明确授权的等价安全环境。

生产数据、真实付费、不可撤销第三方写入等不因“这是验收”自动获得授权，仍服从 `protocols/authority.md`。

### 5.8 G4 is one Human Authority Event

当以下事实已成立：

- 所有本期 feedback 已处理或有用户明确接受的结论
- 本期 `[欠账]` 已逐条定夺
- 所有 `develop(source=manual-test)` 已 `merged`
- acceptance report 可以完整对账当前 Product Contract
- 用户正在验收的 implementation snapshot 明确

用户明确表达“验收通过”或等价接受，即构成本期 **G4 Human Authority Event**。

不要在用户已经明确验收通过后，再机械询问一次“要不要签 G4”。

G4 record 必须绑定用户实际验收的 Accepted implementation snapshot。随后持久化 acceptance report、Task state 与 Gate record，只是在记录同一个 authority event，不是第二次审批。

### 5.9 After G4

G4 是历史 authority event。

G4 后新发现的问题：

- 不回退已 `merged` manual-test
- 不撤销历史 G4
- 进入新的 B Intake / revision / 后续迭代，按问题性质处理

## 6. Verification

### Deterministic

必须能够机械证明：

- `integration-verify` 已 `merged`，且两条 assurance lane 对同一 final system candidate satisfied
- 无 open blocking system finding、unresolved escalation、pending system-rereview 或缺失 revalidation
- acceptance report 存在且覆盖当前 PRD 全部 AC
- 每条 AC 有明确验证来源
- 所有本期 `develop(source=manual-test)` Task 已 `merged`
- 所有已知 `[欠账]` 都有用户决定
- acceptance report 中所有 in-scope blocking issue 均有关闭结论
- G4 record 绑定明确 approved snapshot
- 项目当前 G4 checker / hook（若存在）通过
- Review Architecture 项目中，G4 checker 已消费 `check-system-review.js` completion 结果；不能只凭 `status: merged` 放行
- 最终 report、state 与用户实际验收的 implementation world 一致

### Semantic

必须确认：

- 用户真实完成了足以判断本期 Product Contract 的体验 / 业务验收
- 核心用户任务和必要失败 / 恢复路径没有明显未验缺口
- 范围外新需求没有被偷渡进当前 Contract
- mechanical evidence 与 human evidence 的边界标注真实
- 用户 acceptance 没有建立在已失效 System Verification / develop evidence 上
- 所有用户明确不能接受的问题已经修复或改变了 Contract / scope 并获得相应 Authority

## 7. Review & Human Authority

### Independent Review

本 Task 默认不增加 AI Independent Review。

manual-test 的关键独立判断来自真实用户体验与 Human Authority；AI review 不能替代它。

如果 acceptance report 本身存在复杂一致性风险，可以做文档一致性检查，但不能因此获得 G4 authority。

### Human Authority

用户负责：

- 真实体验是否可接受
- 本期已知欠账是本期补还是接受 defer
- 产品范围变化
- G4 approval

用户明确验收通过就是 G4 authority event；不重复机械确认。

## 8. Completion & Handoff

### `done`

满足：

- 用户已经对明确 implementation snapshot 明确表达验收通过
- 所有本期 feedback 已处理
- 所有本期欠账已有用户结论
- 所有 `develop(source=manual-test)` 已 `merged`
- acceptance report 已形成稳定 Shared Candidate Truth
- G4 authority event 的 approved snapshot 已明确

此时 G4 authority 已由用户事件产生，但 Task 输出可能尚待持久化进入 Accepted Project Truth。

### `done → taken-by`

如果在持久化前发现：

- acceptance report 与用户实际结论不一致
- approved snapshot 指错
- 有遗漏的 blocking feedback
- 当前 implementation 在用户接受后又发生相关变化

则回 `taken-by`，重新对齐实际世界；不能把旧 acceptance 自动套到新 snapshot。

### `merged`

满足：

- acceptance report 已进入 Accepted Project Truth
- `status.yml` 已准确记录 manual-test `merged`
- 同一个用户 acceptance event 已作为 G4 approval 持久化
- approved snapshot 与用户实际验收 snapshot 一致
- deterministic completion checks 通过

Task `merged` 与 G4 approval 语义正交；本 Task 的正常路径中，它们由同一次用户 acceptance 事件和随后持久化分别闭合，不要求两次用户确认。

### Downstream

当 manual-test 已 `merged` 且 G4 approval 已记录：

- `deploy` 可进入 `可取`（仍受部署自身 Authority / environment 约束）
- `wrap-up-iteration` 可进入 `可取`

两者是否并行由各自 Task Contract 与实际依赖决定。

## 9. Recovery Notes

恢复时除 `protocols/recovery.md` 的共同来源外，额外读取：

- 当前被验收 implementation snapshot
- Accepted System Verification result（system-review lineage + integration result）
- acceptance report
- 未关闭用户 feedback
- 当前轮 `develop(source=manual-test)` Task 状态
- 本期 `[欠账]` 的用户决定
- 是否已经发生明确 acceptance / G4 authority event

如果用户已明确验收通过但持久化中断：

- 不要求用户重复验收
- 先核 approved snapshot 与当前 Git world 是否仍一致
- 一致则补持久化 report / state / G4 record
- 不一致则重新验受影响部分，不能把旧 authority event强行绑定到新实现
