---
schema: hact-task/vnext
task: integration-verify
legacy_aliases:
  - generate-integration-tests
class: A
discipline: integration-testing
gate: null
preferred_runtime: execution
required_capabilities:
  - repository-read
  - test-authoring
  - command-execution
  - test-execution
  - persistence
review: required
---

# integration-verify

## 1. Purpose & Scope

### Purpose

在本期计划内开发已经进入 Accepted Project Truth 后，对明确的 final system candidate 完成 **System Verification**：由 Semantic / Holistic Independent Review 挑战整体 Contract 与 architecture，由 Runtime Integration Verification 证明真实组合路径，并把失败准确路由回 `develop(source=integration)`、`revise-doc` 或其他明确承接方。

本 Task 继承旧 `generate-integration-tests` 的 runtime verification 职责，并扩展为 System Verification。`generate-integration-tests` 只保留为输入 alias；不得重新成为平行 Core Task。

### In scope

- 核对本期多个 develop Task 合并后的组合关系
- 对 final system candidate 执行一次 System Full Independent Review
- 审查最终 Product / Technical Contract、architecture、cross-package consistency、ownership、shared contract、compatibility、call chain、state/permission/lifecycle consistency 与 evidence sufficiency
- 验证必需能力有真实承接方
- 核共享类型、枚举、错误、状态、接口和退役关系在消费者侧一致
- 设计并执行真实入口到终态的后端穿透流
- 识别并按需验证真实外部边界接线
- 在用户任务或视觉基线受影响时验证真实前端任务路径
- 对修复后的受影响组合路径进行复测
- 按已有 system review lineage 执行必要的 targeted/full System Reviewer event
- 形成可供 `manual-test` 读取的稳定整合验证结果

### Out of scope

- 重复未失效的 Package Review，或把 System Review 降格为包级 review 汇总
- 逐接口、逐字段重做没有组合价值的场景矩阵
- 在本 Task 内直接修改业务实现
- 用 fixture / mock 绕过本来要验证的真实接缝
- 代替用户完成真实体验验收
- 以 runtime tests 全绿替代 System Review，或以 System Review pass 替代 runtime verification
- 创建新的 `final-review` / `system-review` Core Task、Human Gate 或平行动态状态机
- 未获授权的生产写入、付费调用或不可撤销外部副作用

Task Contract 只定义整合验证的任务语义；具体脚本、浏览器工具、并发方式和命令由 Runtime Adapter / 项目当前验证入口实现。

## 2. Preconditions

从 `可取` 进入 `taken-by` 前必须满足：

- 当前 HACT Method fixed SHA 已知。
- `status.yml` 可读取。
- G3 已 approved。
- 本期所有 `source=sprint` 的 develop Task 已 `merged`。
- 被验证代码与相关 Contract 已进入 Accepted Project Truth。
- final system candidate 的 immutable Git identity 已明确，且包含本期全部计划内 Accepted develop results。
- 本期测试环境约定可查；真正执行场景前，必要服务与数据环境必须可用。
- 若上一次整合验证已派出 `develop(source=integration)` 修复，本轮相关修复必须已 `merged` 后才能对受影响路径形成新的通过结论。

“修复任务已创建 / 已指定 Owner”不等于问题已解决。

## 3. Authoritative Inputs

### Required

- 当前 HACT Method fixed SHA
- `status.yml`
- `iterations/vN/prd.md`
- `iterations/vN/trd.md`
- 本期 sprint / develop Task Package 中与组合、依赖、共享资产、`supersedes` 相关的 Contract
- 当前 Accepted Project Truth 中的实现
- 当前有效的 develop review / test evidence 指针
- 当前 final Product / Technical Contract 与 architecture/foundation 约束
- 当前动作实际触发的 Shared Protocol projection；按 `templates/boot-protocol.md` 与对应 Protocol 的最小加载规则读取，不预加载全部 `protocols/`

### Conditional

- `ux-flows.md`
- `prototype.html`
- `design.md` 中相关页面规格与视觉基线
- 已有 integration scripts / scenario definitions
- 已有 integration result / evidence
- 已有 system-review event、未关闭 system finding、closure/revalidation evidence（存在时）
- 外部边界配置、测试凭据入口和去敏样本说明
- backlog / feedback 中与本期组合缺口有关的条目

Owner 必须重新读取权威输入。单个 develop Owner 的总结、任务包中的“已验证”声明或旧结果报告不能自动代表当前整合世界。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| Backend verification flows | `integration-tests/backend/` 或项目等价位置 | 真实入口到终态的穿透流 |
| Frontend verification scenarios | `integration-tests/frontend/` 或项目等价位置 | 仅在完整档适用 |
| Integration result | `integration-tests/result-{date}.md` | `integration-result/v2`；绑定 final candidate、current System Review、runtime/revalidation scope 与场景证据 |
| Integration evidence | `integration-tests/evidence/` 或项目等价位置 | 真实运行证据，按项目当前 schema |
| System Review events | `iterations/vN/system-review/review-NNN.md` | `system-review/v1`；对 fixed candidate 的 immutable full/targeted historical judgement |
| Post-publication runtime finding | `iterations/vN/system-review/findings/{finding-id}.md` | `system-finding/v1`；仅用于 review 发布后新建立的 runtime-origin finding |
| System finding closure events | `iterations/vN/system-review/closures/{finding-id}/closure-NNN.md` | `system-finding-closure/v1` additive event；不改写 source judgement |

### State updates

- `status.yml`：每个 iteration 恰有一个 `type: integration-verify` 的 Core Task work item，沿用 `可取 → taken-by → done → merged`；`source` 为 `null`，详细 findings/evidence 不复制进 status
- 必要 integration evidence / result pointer
- 当前 `system_review_dir`、`current_system_review`、`integration_result`、`final_candidate` 最小 pointer；未解决 obligation 由 checker 沿 Git artifacts 推导，不复制进 status
- 派生修复 Task 的状态由各自 `develop` Task 管理，不在本 Task 复制第二套状态

### Conditional outputs

- `develop(source=integration)` Development Intake / Task Package
- `revise-doc` 请求
- backlog 条目：不阻断本期承诺但值得后续处理的问题
- recovery pointer：长程、多轮修复或跨 session 时

不保存完整运行日志、完整 conversation 或可廉价重跑的大量 stdout；保存足以证明结论的 evidence。

## 5. Decision Rules & Boundaries

### 5.1 Final system candidate

System Verification 必须先固定 final system candidate。它不是“当前工作区”或“最新 master”的口头指代，而是可由 immutable Git object 重建、包含全部计划内 Accepted develop results 的明确 snapshot。

Semantic Review 与 Runtime Verification 的结论都必须能对应到该 candidate。任一 lane 之后发生会影响其结论的实现、测试、Contract 或受版本控制配置变化，必须形成新 candidate 并按失效范围重新验证。

### 5.2 Two complementary lanes

System Verification 包含：

1. **Semantic / Holistic Independent Review**：审整体 Contract、architecture、cross-package consistency、ownership、shared contract、compatibility、call chain、state/permission/lifecycle consistency 与 evidence sufficiency。
2. **Runtime Integration Verification**：以真实执行证明 API、queue、database、state machine、frontend/backend seam、external boundary、terminal state、failure/retry/recovery 等适用路径。

两条 lane 可以交换 evidence，不要求僵硬串行。Semantic Reviewer 可以请求 runtime evidence；Runtime Verification 可以建立新的 system finding。但两者不能互相替代，且必须对同一可追溯 candidate 成立。

### 5.3 System Reviewer events and evidence state

首次 System Reviewer event 对 final candidate 做 `full` review。后续事件按前序 judgement 的失效范围为 `targeted` 或 `full`；每次 invocation 形成新的 immutable event，targeted event 声明 predecessor 与 revalidation scope。

Review result 与 evidence state 是两条轴：evidence insufficient 不能建立 pass。事件与 closure contract 分别按 `templates/review-briefs/system-review.md`、`templates/review-briefs/system-finding-closure.md`；Phase 4 才实现 deterministic checker、hook 与 runtime wiring，不得先用临时枚举改写语义。

### 5.4 System finding routing and closure

System Review 与 Runtime Verification 建立的 blocking finding 共用 `protocols/review.md` 的 Finding Contract。

Owner 必须为每个 finding 选择恰一个 effective route：

- `local-close`：局部根因、局部影响、Contract/major architecture 不实质变化，且 semantic/runtime revalidation scope 可完整声明；
- `system-rereview`：修复可能使 system-level semantic conclusion 失效，或 locality 不能可靠界定。

`local-close` repair 通过 `develop(source=integration)` 形成 fixed candidate 和 Fresh Isolated Local Review evidence；返回本 Task 后完成仍 required 的 semantic/runtime revalidation，再追加 closure event。Local repair 超出授权 locality 时，追加 escalation event，把 effective route 改为 `system-rereview`，旧 local authority 失效。

`system-rereview` repair 可以先完成 local prerequisites，但只有新的 System Reviewer event 有 closure authority。`full_snapshot_invalidated=false` 默认 targeted；`true` 必须有具体 invalidation reason 并进入 Full System Re-review。

Finding origin/category 不决定 route，diff size 不决定 review depth。Local closure 不创建 system review event；System Reviewer 每次 invocation 都创建新 immutable event。

### 5.5 Only current impact, but include seams

验证范围以本期影响面为边界，同时必须覆盖本期改动触及的旧能力接缝。

不重复未受影响单包的完整验证，也不能因为每个单包都绿就跳过组合核对。

“全绿”只证明已执行测试的结果，不能替代 Contract reconciliation。

### 5.6 Composition reconciliation

执行场景前先核至少三类组合事实：

1. **ownership**：本期必需能力都有真实承接方，不存在互推或无人负责
2. **shared definition**：共享类型、枚举、错误、状态、接口和调用方语义一致
3. **retirement**：`supersedes` 指向的旧实现已退出实际注册 / 暴露 / 维护，或有明确继续保留理由

沿真实调用方确认所需数据和状态能从入口到达目标终态。

准备核对不能代替实际运行；实际运行也不能代替上述静态组合核对。

### 5.7 Backend penetration flows

后端穿透流按**不同业务终态 / 分支决策**设计，而不是按输入种类或接口数量凑场景。

每个必要终态至少有一条路径：

- 从真实入口开始
- 经过真实 API、队列、转换或状态机制
- 不用 fixture 直接制造本应由上游产生的中间态
- 每个关键转换有可辨别断言
- 最终确认目标终态及其必要产物

场景数量由真实终态数量决定，没有固定上限或下限。

### 5.8 External boundary gate

Owner 必须识别本期新增或变化的真实外部边界，例如：

- 外部 SDK / HTTP 服务
- 付费 API
- 真实凭据鉴权
- 第三方写入
- 无法由本地模拟证明的响应形状或行为

边界存在不等于自动真调。

真实外部调用如果会使用凭据、产生费用、写外部系统或形成不可撤销副作用，必须遵守 `protocols/authority.md`，取得对应 Human Authority 后再执行。

如果因为无凭据、无环境或用户明确不授权而未运行：

- 必须在 result 中写 `未运行`
- 写明具体边界与原因
- 指定后续验证承接点
- 不得把该边界写成“已通过”

未运行边界是否阻断本 Task，取决于它是否是当前 Product / Technical Contract 的必要承诺，而不是取决于“有没有测试脚本”。

### 5.9 Runtime verification depth

默认采用**轻量档**：

- composition reconciliation
- backend penetration flows
- applicable external boundary gate

出现以下任一情况时必须进入**完整档**：

- 本期改变用户任务 / `ux-flows` 或其核心实现路径
- 本期改变前端视觉基线或依赖全局视觉地基
- 当前 evidence gap 只有真实前端任务路径才能关闭

完整档追加：

- 从真实入口执行受影响用户任务
- 覆盖必要成功、失败、取消和恢复路径
- 记录真实系统可观察结果
- 视觉基线变化时执行项目当前定义的 deterministic visual smoke checks

原型、截图或静态代码存在不能替代真实系统路径通过。

没有用户任务、视觉基线变化或相关 evidence gap 时，不为了形式强制完整档；用户仍可明确要求扩大验证范围。

### 5.10 Failure routing

发现问题后按根因分流：

- **真实行为缺陷 / 必需能力无人承接** → `develop(source=integration)`
- **Contract 矛盾、声明失真、设计需要改变** → `revise-doc` 或 Human Authority
- **必要 Evidence 不足** → 补真实 Evidence
- **与本期承诺无关的未来改进** → backlog

integration-verify 自身不直接修改业务逻辑。System finding 的 closure authority 不由 origin 决定；未有合法 route、required revalidation 与 additive closure event 前，不得仅因修复代码已 merged 就宣布 system finding 关闭。

不得通过修改文档来取消已确认承诺，也不得让代码迁就错误 Contract。

### 5.11 Re-test and evidence reuse

修复进入 Accepted Project Truth 后，必须重验证受影响的组合路径。

未受影响且满足 `protocols/review.md` 同等级 evidence validity 要求的旧结果可以继续复用；不因“又跑了一轮”机械重跑整个历史集合。

Task 完成时，每个 required scenario 都必须有**对当前 Accepted implementation 仍有效**的明确结论。

### 5.12 Blocking vs non-blocking

只有不影响本期必要承诺、主流程和真实可接受性的事项才能标 non-blocking。

不得把以下内容自动降为 backlog：

- 本期 PRD 必需行为缺失
- 必需组合路径不可达
- shared contract 实际不一致
- 当前 Gate / downstream 所依赖的必要 evidence 缺失

## 6. Verification

### Deterministic

必须能够机械证明：

- 所有本期 `source=sprint` develop Task 已 `merged`
- final system candidate identity 明确且与两条 lane 的 evidence 一致
- 至少一个对当前 lineage 有效的 System Full Independent Review baseline 存在
- 当前所需 System Reviewer event 已完成，result/evidence state 合法
- required backend flows 均有当前有效结果
- result 中每个已执行场景都有 evidence pointer
- 每个未运行场景 / boundary 都有明确原因和承接点
- blocking finding 均已关闭
- 每个 blocking finding 在每个 lineage point 恰有一个 effective route
- 每个 closed finding 都有满足其 closure authority 的 additive event；source judgement 未被改写
- 无 unresolved escalation、pending system-rereview obligation 或缺失的 semantic/runtime revalidation scope
- 所有派生 `develop(source=integration)` 修复已 `merged`
- 完整档适用时，required frontend scenario 与 visual smoke evidence 完整
- 项目当前 integration checker / evidence checker（若存在）通过
- `node scripts/check-system-review.js vN` 对当前 Git Truth 通过
- 最终 result 与被验证的 Accepted implementation snapshot 对应

### Semantic

必须确认：

- 跨 Task ownership 无真空或互推
- shared definition 与消费者一致
- retirement obligation 已真实闭合
- 穿透流确实经过要验证的真实接缝
- required user task / terminal state 覆盖合理
- 外部边界结论没有把未验证冒充通过
- 当前所有 blocking 缺口已由真实修复 / revision / authority closure 解决
- local-close finding 未越出其 locality assumptions；越界者已 escalated
- system-rereview finding 仅由新的 System Reviewer event 关闭
- `full_snapshot_invalidated` 判断有具体失效结论依据，不以 diff size 替代
- 当前 system-level assurance 依赖有效 closure lineage，而不是机械要求“最后一次 full review 必须 pass”

## 7. Review & Human Authority

### Independent Review

本 Task 必须包含 Semantic / Holistic Independent Review lane。System Reviewer 使用 `protocols/review.md` 的 Fresh Isolated Context、same-source projection 与 fixed candidate 纪律，不继承 package implementer 的完整生成叙事，也不能只汇总 package review 自评。

Runtime Integration Verification 是同一 Task 的另一条 assurance lane，不是对 System Reviewer 的“第二层重复审查”。System Reviewer 可以消费原始 runtime evidence；runtime executor 不能独立认证 shared-contract/architecture redesign 后的广泛 semantic validity。

### Human Authority

必须请求 Human Authority 的情况至少包括：

- 真实外部调用需要费用、凭据或外部写入
- 需要改变 Product / Technical Contract
- 需要扩大授权范围
- AI 无法合法判断某个未验证边界是否可接受

integration-verify 不产生 Gate approval。

## 8. Completion & Handoff

### `done`

满足：

- required composition reconciliation 已完成
- 当前所需 System Reviewer event 已形成 immutable Shared Candidate Truth
- required scenarios 已执行或有合法、明确的未运行结论
- blocking finding 已关闭；`open=0` 且 `escalated_unresolved=0`
- 无 unresolved escalation、pending system-rereview obligation 或缺失的 required semantic/runtime revalidation
- 派生 integration repair 已 `merged`
- 当前 result / scripts / evidence 已形成稳定 Shared Candidate Truth
- 没有未解决 Authority blocker

### `done → taken-by`

出现以下任一情况时回 `taken-by`：

- 修复后当前 result / evidence 失效
- 新 Accepted implementation 改变受影响路径
- deterministic checker 失败
- 发现新的 blocking integration finding

### `merged`

满足：

- deterministic 与 semantic verification 对同一最终世界成立
- Semantic / Holistic Independent Review 与 Runtime Integration Verification 均对最终 candidate satisfied
- integration result、必要 scripts / evidence 与 state 已进入 Accepted Project Truth
- system review events 与 additive closure/revalidation evidence 已进入 Accepted Project Truth
- `status.yml` 准确记录 Task `merged`
- 当前无未关闭 blocking finding

本 Task `merged` 不产生 G4。

### Downstream

`integration-verify` `merged` 后，且两条 lane 与全部 system finding obligations 对同一 final candidate satisfied，`manual-test` 可进入 `可取`。

`manual-test` 必须重新读取 Accepted System Verification result（system-review lineage + integration result），不继承本 Task 的 conversation。

## 9. Recovery Notes

恢复时在 `protocols/recovery.md` 共同来源之外，额外读取：

- 当前 integration result
- 当前 system-review event lineage 与 final system candidate
- 当前验证的 Accepted implementation snapshot
- required scenario 列表
- 每个 scenario 的 result / evidence pointer
- 未关闭 finding
- 未解决 escalation / system-rereview / semantic or runtime revalidation obligation
- 派生 `develop(source=integration)` Task 状态
- 未运行 boundary 的原因与后续承接点

从第一个“对当前世界尚无有效结论”的 required scenario / finding 继续。

不要因为 session 中断而重跑仍然有效的场景，也不要因为旧报告写着“pass”而跳过已经失效的 evidence。

## 10. Runtime Routing

canonical `integration-verify` 在全部 verification / repair-return 期间保持 active；实际 crossing 只允许 `Execution Task Runtime`、`Review Dispatch`、`Derived Child Task`，并遵循 Runtime Crossing / Authority / Recovery / Review Protocol 与 Runtime Orchestration Skill。Runtime job 不创建 ownership/state，也不替代本 Task 的 final candidate 或 completion truth。

System Semantic / Holistic Independent Review 的 `Review Dispatch` **REQUIRED**，必须针对 fixed final system candidate 使用 reviewer-specific projection。Runtime Integration Verification 是独立 assurance lane；runtime PASS、checker PASS 或 execution completion 均不能替代 System Review。

system finding 按既有 route 派生 canonical `develop(source=integration)` 或 `revise-doc` child；适用的 repair return 使用 `resume-active-origin`。完整链仍为 source finding → effective closure route → canonical child repair/revision → fixed candidate → required isolated review → semantic/runtime revalidation → required system re-review/escalation → additive closure event。`repair merged + test PASS` 单独不能关闭 finding，historical finding 不改写。
