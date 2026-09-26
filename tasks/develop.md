---
schema: hact-task/vnext
task: develop
class: cross-cutting
discipline: engineering
gate: null
preferred_runtime: execution
required_capabilities:
  - repository-read
  - code-authoring
  - command-execution
  - test-execution
  - git-snapshot
  - isolated-review
  - persistence
review: required
---

# develop

## 1. Purpose & Scope

### Purpose

把已经被授权的开发 Contract 实现为可验证代码与测试，并通过固定快照、确定性验证和独立审查，将结果安全地进入 Accepted Project Truth。

`develop` 同时承接 A 类与 B 类开发工作。Task 由 `source` 区分来源，但不因 Runtime、模型或前后端角色拆成不同方法论 Task。

### In scope

- `source=sprint` 的计划内功能实现
- `source=foundation` 的 V0 地基/标杆切片实现
- `source=integration` 的联调缺口修复
- `source=manual-test` 的验收缺口修复
- `source=bug | optimization` 的 B Intake 后开发
- 必要代码、测试、配置和受影响实现落点
- 当前 Task 的 freshness、scope、verification、independent review 与 recovery evidence
- 将通过的实现进入 Accepted Project Truth

### Out of scope

- 静默改变已批准的产品、业务或技术 Contract
- 以实现便利为理由扩大产品 Scope
- 重新做 `integration-verify` 的组合路径职责
- 代替 `manual-test` 完成真实用户体验验收
- 未获授权的部署、生产写入或外部副作用
- 用 Runtime choreography、模型等级或 agent 数量定义 Task 完成度

Task Contract 只定义 `develop` 独有规则。共同状态、Git truth、review、authority 与 recovery 纪律引用 `protocols/`；具体 Codex / ChatGPT 操作进入 `runtime/`。

## 2. Preconditions

从 `可取` 进入 `taken-by` 前必须满足：

- 当前 HACT Method fixed SHA 已知。
- `status.yml` 中存在可识别的 develop work item，且依赖关系可判断。
- 当前 Task 有一个明确 Owner；默认一个 Task 一个 Owner。
- 已存在 durable Development Intake / Task Package，能够表达本 Task 的开发承诺与边界。
- 所有做实现决策必需的 Accepted Project Truth 可读取。
- 必要依赖已进入 Accepted Project Truth，或已在同一明确授权的交付集合中被确定性排序且不存在未解决写冲突。

按 `source` 的附加前置：

- `source=sprint`：G3 已 approved。
- `source=foundation`：适用的 G2 / V0 Foundation authority 已完成。
- `source=integration`：已有具体 system finding / runtime failure evidence、授权 repair scope 与 required validation。
- `source=manual-test`：已有来自 `manual-test` 的具体验收 finding 和修复边界。
- `source=bug | optimization`：B Intake 已完成真实调查、问题界定、contract impact、scope 与实施授权；不运行 G1–G5。

已经批准且仍适用的设计/范围决定不重复询问。只有出现真实缺口、冲突或 Authority 边界时才重新请求 Human Authority。

## 3. Authoritative Inputs

### Required

- 当前 HACT Method fixed SHA
- `status.yml`
- 当前 develop work item / Development Intake / Task Package
- 当前 Accepted Project Truth 中的相关 code、tests、project constraints 与 shared contract
- 当前动作实际触发的 Shared Protocol projection；按 `templates/boot-protocol.md` 与 `protocols/review.md` 的最小加载规则读取，不预加载全部 `protocols/`

Development Intake / Task Package 无论采用何种序列化，至少要能表达下列语义：

- task id
- source
- implementation layer / affected surface
- 当前授权的行为与 scope
- acceptance contract，优先使用 `intent + oracle`
- authoritative references
- 当前预期写集 / files
- 跨文件共享资产写集（适用时）
- dependencies
- risk
- `do-not`
- `escalate-if`
- `supersedes` / retirement obligation（适用时）

### Conditional

- Foundation / TRD / design / UX flow / prototype 的相关切片
- 被前端消费的 API contract
- migration / schema / queue / state-machine 定义
- prior review report 与未关闭 finding
- source system review/finding artifact、repair scope 与 required validation（`source=integration` 时）
- Shared Candidate snapshot
- 项目当前已有 checker、hook、test entry 与 review evidence schema

### User input

只在出现 `protocols/authority.md` 定义的 Human Authority 边界时需要新的用户决定。

Owner 必须自己读取权威输入。上一会话或其他执行环境的聊天总结、实现者自评、口头“已验证”声明都不能替代 Authoritative Input 或 Evidence。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| Implementation | 项目代码仓中的实际受控路径 | 代码、测试、必要配置 |
| Review evidence | 项目当前 review evidence 位置 | 固定 snapshot、findings、结论与必要运行证据 |
| Delivery record | 项目当前 Git / PR / merge 记录 | 指向 immutable candidate 与 Accepted Truth |

### State updates

- `status.yml`：`可取 → taken-by → done → merged`
- Owner、runtime、branch / candidate pointer 等 metadata 按当前 status contract 更新
- review / evidence pointer 只存必要审计索引，不复制完整报告
- 已存在的 checker / hook / review evidence schema 继续作为当前项目的机械接口；P2 不修改它们

### Conditional outputs

- retirement record：`supersedes` 非空时必须逐项给出已下线，或保留理由 + 解除条件
- backlog / follow-up：只记录当前 Task 不应在本次修复但确有承接价值的事项
- contract revision request：发现真实 contract drift 时走 `revise-doc`

聊天文本、本地 dirty state、未固定 diff、模型私有推理都不是正式 Output。

## 5. Decision Rules & Boundaries

### 5.1 Freshness before code

当前 Task 写第一处新的实现改动前，必须把 Development Intake 与**当前 Accepted Project Truth** 对齐，而不是默认相信写包时的世界仍然成立。

若本次由人工 Execution Packet 发起，Packet 的 `BASE_SHA` 是该对账的明确起点；Codex 仍执行本节 freshness，但不另建第二套 freshness。Accepted remote 已移动并改变事实世界时，按 `protocols/git-truth.md` 停止为 snapshot mismatch，不自行重写旧 Task Package 的基线。

至少核对：

- 预期 `files` / 写集是否仍对应真实实现落点
- reference 的 symbol / section / contract anchor 是否仍存在且语义未漂移
- 上游是否已经实现、替换或改变本 Task 原计划依赖的机制
- `intent / oracle / example` 是否仍一致
- `do-not / escalate-if / supersedes` 的前提是否仍成立
- dependency / shared asset ownership 是否仍可满足

无漂移时只需要紧凑 evidence，不制造逐项空报告。

发现漂移时按根因路由：

- `example-error`：修正错误示例，不让代码迁就错误示例
- `contract-drift`：走 `revise-doc` 或已有等价 revision path
- `scope-gap`：补真实承接方或上游 Task
- `evidence-gap`：补足判断所需事实
- Human Authority gap：暂停相关修改并请求人类裁决

blocking freshness finding 未关闭前不得继续新增代码。

接管已经存在的 diff 但没有 before-code freshness evidence 时，只能如实记录为 retroactive reconciliation；不得倒填成 before-code。先完成纠偏，再继续修改。

### 5.2 Scope discipline

实现必须忠实于已授权 Contract。

允许 Owner 在**不改变业务/技术 Contract** 的前提下修正实际 implementation landing，例如真实文件位置与原预期不同；必须留下简短证据说明。

### 5.2.1 Contract 内的最小实现

在满足 Accepted Product / Technical Contract 的前提下，优先更少对象、更短状态链、更少 durable truth，并复用现有机制。不得主动新增 TRD 未要求、且没有明确 Contract / invariant / security / recovery / external compatibility 依据的 audit table、generation、receipt、lock、checkpoint、history log 或平行状态层。

“最小实现”不是自行删除 Accepted Technical Contract 的授权。若判断已批准的 A + B + C 中 A 足以守住全部 Contract / invariant，必须停止相关语义收缩并返回 `SEMANTIC`：说明疑似多余的机制、仍能满足的不变量、简化理由及需修订的 Contract 条目。只有 `revise-doc(target=trd)` 或既有等价路径形成新的 Accepted Technical Contract 后才能按简化方案继续。此规则阻止继续扩张，不要求主动重构既有复杂设计。

下列情况不属于普通 implementation adjustment：

- 改变产品承诺
- 改变公开 API / shared contract 的语义
- 改变数据不变量或权限边界
- 新增未授权外部副作用
- 把另一个 Task 的责任吸收到当前 Task
- 以“顺便更好”为理由扩大范围

这些情况走 revision / escalation，不由 develop 静默决定。

不得通过删断言、跳测试、扩大白名单、降低验证强度或隐藏错误来制造“通过”。

### 5.3 Acceptance uses Intent + Oracle

实现以 `intent` 作为外部可观察目标，以 `oracle` 作为独立判断标准。

- 普通 example 是派生说明，不高于 oracle。
- example 与 oracle 冲突时，返回上游修正。
- 只有上游明确标为 golden / literal contract 的 example 才承担字面物化义务。
- 不可视行为必须有可运行、能区分正确与错误的验证。
- 真实错误信封、权限、事务、持久化或外部副作用不能只靠不匹配真实边界的 mock 证明。

### 5.4 Reuse and compatibility

同一业务语义已有权威实现时优先复用；不同职责不能只因写法相似而强行合并。

实现必须沿受影响调用链检查兼容性，直到足以判断当前改动的真实后果。不得只看当前文件局部。

### 5.5 Evidence validity

Evidence 只有在同时匹配以下对象时才有效：

- 被审 implementation snapshot
- 相关依赖与配置版本
- 实际执行路径
- 适用环境
- 真实运行结果

以下内容不是独立 Evidence：

- 实现者说“已验证”
- 测试文件存在但没有对应运行结果
- 进程启动成功
- 与真实边界不一致的 mock 成功
- 针对旧 snapshot / 旧依赖 / 旧环境的通过结果

有效且世界未变化的 Evidence 可以复用，不为流程感重复执行。

### 5.6 Fixed diff / fixed snapshot

进入独立 review 的实现必须绑定 immutable Git snapshot。

代码 review 至少固定：

- reviewed base
- reviewed head
- changed files
- 当前 evidence format 要求的 deterministic diff identity / digest

禁止用会变化的裸工作区 diff、“最新代码”或聊天描述作为正式 review target。

整改后产生新的 implementation / test 变化，就形成新的 reviewed head；不能把旧 review 结论自动套到新世界。

### 5.7 Worktree integrity

不明来源的已有改动不能被当前 Owner 擅自删除、还原或归因。

目标是把当前 Task 的审查范围从其他改动中**分离**，不是清除别人的 Local Working Truth。

mtime 不是作者归因证据。无法归因时保留并报告，必要时使用安全的 branch / worktree / snapshot 隔离。

### 5.8 Risk is derived from actual diff

Task Package 的 `risk` 是输入，不是最终真相。

Owner 与 Reviewer 都必须根据实际 fixed diff 独立判断风险。若实际改动命中 sensitive boundary，必须升档；不得因为任务包写了 `standard` 或更强模型参与而降档。

### 5.9 Long-running work

长任务可以跨 session / context compaction 连续推进，但：

- authorization 不因压缩扩大
- attempts / review rounds 不因恢复清零
- 已通过且 snapshot 未变化的验证不重复
- ChatGPT 形成带 `BASE_SHA` 的 stable bounded Execution Packet 后，由用户人工交给 Codex 连续执行；完成后返回 immutable result identity。只在 `SEMANTIC`、`AUTHORITY` 或 `CAPABILITY` blocker 时停止。

跨会话接续基于 Git snapshot、Task Contract、status 与 evidence，不基于聊天历史。

### 5.9.1 Sprint and execution-window Goal

Sprint 是完整 Accepted Develop scope；它决定最终必须完成什么，不要求一个 Codex interaction 完成全部 Sprint。ChatGPT 每次先读取当前 `BASE_SHA`、已 merged / remaining Task Packages、dependency graph、实际 development volume、已知复杂度和 verification / review boundary，再自动设定**下一个 bounded execution-window Goal**。Goal 只覆盖本次明确列出的 eligible Task Packages；ChatGPT 决定窗口在何处停止，并可让一个已知复杂 / 大型 Task 独占窗口。它不预先登记未来窗口，也不微计划窗口内的 Wave。

标准人工交接是 ChatGPT 给出可激活的 `/goal`，用户激活后再提交 Develop Execution Packet；Human 不承担编写 Goal、逐包排序或维护窗口过程。Goal activation 成功后，Codex 只连续执行当前窗口内的 Task Packages，不能因为其他 Sprint Task 仍 eligible 就跨出当前 Goal。Goal 提供窗口范围、成功条件、自主范围、人类介入边界、依赖 / shared-write constraint 与 `RESULT_SHA`；它不是 HACT 的新 Task、state、lifecycle、ledger 或第二套 Contract，更不是 Window object、status、Gate、approval、checkpoint、receipt 或 registry。

每个 Task Package 仍是唯一正式执行单元，分别执行 freshness、implementation、verification、fixed candidate、Independent Review、repair 与 merge / Accepted Truth。Codex 可在当前 Goal、Task Contract 和 Authority 允许范围内决定顺序、机械修复、targeted re-review 与 Git delivery；满足依赖且无 shared-write conflict 的**窗口内** Task 可以并行，有真实 conflict 时串行。每个已 merged Task 形成新的 Accepted Project Truth，后续 Task 仍须重新做自身 freshness。

普通工程选择、lint/type/build/test/checker failure、review finding、bounded refactor、窗口内 Task 顺序调整和下一个 in-scope eligible Task 选择不得中断 Goal 返回 ChatGPT。需要 Human Authority 时，Codex 在当前 interaction 直接向用户说明并在决定后继续原 Goal；这不创建 pause / waiting / decision state。局部 blocker 只暂停受影响 Task 及其窗口内依赖；窗口结束、提前停止或中途被真实 blocker 打断时，Codex 返回 stable Result Packet / `RESULT_SHA` / blocker。ChatGPT 重新读取 Git Truth 后才决定下一个 execution-window Goal；不维护“前一窗口尚余几个 Wave”的额外过程状态。

### 5.9.2 Lightweight Wave execution

在 active execution-window Goal 下，Codex 在开始 substantive implementation 前，只对当前窗口内已接受的 Task Packages，根据 dependency order、development volume、coupling 与可形成的 verification boundary 划为若干轻量 Wave。一个窗口包含一个或多个完整 Wave，Wave 正常应在同一窗口完成；强依赖或共同验证的包优先同 Wave 或相邻 Wave；明显复杂或大型的单个包可以独占一个 Wave；不得为凑包数打断真实依赖或把强耦合实现拆成半成品，也不故意计划一个 Wave 跨窗口。

Wave 不是 Task、Gate、state、artifact、packet、approval、review object、registry 或 lifecycle。execution window 同样只是当前 Codex interaction 的 bounded runtime / context boundary，不产生 Window Goal 以外的 Window object、status、Gate、approval、checkpoint、receipt、ledger、registry 或 recovery system。二者均不修改现有 Task Package、`status.yml`、delivery、review 或 Git Truth 规则。一个 Wave 完成时，只按每个已完成 Task 的既有 implementation、deterministic validation、review / repair 与 Git delivery 规则形成稳定 Git Truth；窗口中断时也只依赖这些既有 durable truth 恢复下一次编排。

编排时可以把 Task 简单识别为 ordinary 或 complex。跨多个核心模块、schema / migration / API / persistence 联动、存在实质实现路径选择、影响多个既有 contract、需要理解大范围存量实现、反复实现失败或先前 review 指向设计 / 策略根因，都是 complex 的典型信号；不建立 score、level、matrix、registry 或持久化复杂度字段。

ordinary Task 按既有 Contract 直接执行。Codex 实际到达 complex Task 时，必须在 substantive implementation 前向 Human 直接说明其复杂性，并只询问：`analyze first` 还是 `continue directly`。`continue directly` 继续当前 Task；`analyze first` 只暂停当前 Task 的 substantive implementation，由 Human 在 ChatGPT 形成可选的详细实施分析后交回 Codex。该选择不是新 Gate 或签署流程，分析也不是 HACT mandatory artifact。Codex 可为真实 repository fact 调整机械实现细节；若分析的核心设计假设与事实冲突，必须停止受影响部分并指出冲突，不得静默改为实质不同的架构。模型、reasoning level 或模型路由始终由 Human 决定，不属于 Method。

### 5.10 System finding repair

`source=integration` 来自 blocking system finding 时，现有 Development Intake / Task Package 必须用已有字段明确引用：

- stable finding id 与 source review/finding artifact；
- authorized repair scope；
- required validation；
- scope expansion / Authority escalation conditions。

不为此增加第二套 repair schema。`reference/context/acceptance-criteria/do-not/escalate-if` 足以承载 repair contract。develop 形成 fixed repair candidate、运行 required tests 并完成 package review；返回 `integration-verify` 后，由新的 targeted/full Fresh System Review report 关闭 finding。即使 repair merged、package review pass、测试全绿，也不能由 develop 宣布 system finding closed。

## 6. Verification

### Deterministic

必须能够机械证明与当前项目相符的以下事实：

- freshness evidence 存在且 blocking finding 已关闭
- fixed candidate 可由 immutable Git object 重建
- changed files 与 candidate diff 一致
- 当前 Task 必需的 target tests 已运行并通过
- 项目实际存在的 build / type / lint / test 入口已按适用范围运行
- 当前 repo 已有 checker / hook 要求已满足
- independent review chain 的结构、snapshot 与 finding closure 合法
- `source=integration` system finding repair 的 source id、repair scope 与 validation evidence 可追溯
- secret / credential 不进入版本化 artifact
- `supersedes` 非空时 retirement obligation 已结账
- 最终 Accepted snapshot 与通过 review / verification 的世界一致

缺少某类命令时，不虚构“通过”；按项目当前技术 Contract 判断是 not-applicable、需要补基建，还是形成 evidence gap。

### Semantic

必须确认：

- implementation 兑现当前 acceptance intent / oracle
- 没有越出授权 scope
- 受影响已有行为未被破坏
- 错误处理与数据转换不静默丢失语义
- evidence 足以支持当前结论
- shared contract / dependency / ownership 没有明显错位
- 受影响的并发、持久化、资源、隐私或外部副作用边界已按实际 diff 检查
- frontend 改动遵守已接受的 design / interaction contract；只有出现真实设计缺口时才请求新的 Human Authority
- 没有新增缺少上游 Contract / invariant 依据、仅为“更保险”而叠加的 durable object / control

## 7. Review & Human Authority

### Independent Review

每个 develop Task 都需要独立代码审查。

默认采用 `protocols/review.md`：

`Same Runtime + Fresh Isolated Context + Same Source of Truth`

Package Review 的目的为 **Error Containment**，不是最终 System Assurance。分类与实际审查模式是两份不同的真相：

- `classification=standard` 默认要求 `mode=lightweight`
- `classification=sensitive` 要求 `mode=full-local`
- 实际 fixed diff 发现 sensitive boundary 或其他明确升级条件时，standard 必须升为 `full-local`
- 同一生命周期不依赖从 sensitive 降回 lightweight 才能完成

`lightweight` 表示责任范围更窄，不表示弱化正确性核对。无论模式，Reviewer 都至少回答三个核心问题：

1. **contract / scope**：本 Task 承诺是否兑现，是否越出授权边界
2. **compatibility**：本次改动是否破坏受影响已有行为
3. **test-evidence**：证据是否真的支持当前结论
4. **mechanism necessity**：新增 durable object / control 是否有上游 Contract / invariant 依据，而非仅为过程可观测或额外保险

按实际 diff 再触发专项：

- enforcement
- design fidelity
- concurrency / persistence
- query performance / resources
- logging / privacy / sensitive boundaries

Reviewer 必须按 `protocols/review.md` 的 same-source projection，自行读取当前审查所需的 Task sections、Development Intake、权威上游和 fixed diff；不继承 Owner 的完整生成历史，也不采信 Owner 自评替代验证。

`lightweight` 不承担完整系统架构、全部跨包一致性或最终整体 assurance；这些职责在所有计划内 develop packages 合并后由 `integration-verify` / System Verification 承接。

`full-local` 仍是包级审查：它对当前包触及的 sensitive boundary、受影响调用链、局部 shared contract 与必要证据做完整独立核对，但不因此冒充 System Full Independent Review。

`develop-review-round/v2` 是当前唯一 package report schema。`risk` 承载 classification，Reviewer 在正文明确 effective mode 与升档依据。

### Finding routing

blocking finding 出现时：

`done → taken-by`

修正根因并形成新 candidate；不得在旧 candidate 上口头宣布关闭。

常见 action：

- code / mechanism defect → targeted fix
- contract / claim defect → `revise-doc`
- global scope gap → 明确承接方
- evidence gap → 补真实 evidence
- advisory / future risk → 记录但不隐式阻断

### Bounded re-review

默认：

`policy-selected initial review → targeted fix → targeted re-review`

定向复审只核：

- 原 finding 根因是否关闭
- 修复增量是否引入直接新问题
- 受影响回归是否有效
- 是否出现具体变化导致此前更大范围结论失效

新增文件、模块或依赖本身不自动触发扩大复审。只有实际风险或先前局部结论失效时才扩大包级审查范围。

每个 Task 最多允许 **3 个包含 implementation / test 实质变化的 code review snapshot**，包括首次 policy-selected candidate review。纯 evidence 补证不消耗这 3 个实质代码 snapshot 配额，但仍属于 review history。

同一 snapshot、同一问题只做一次集中的 evidence 补证；仍不能判断时暂停并 escalation，不无限循环。

Runtime 切换、恢复、新 reviewer、finding id 变化都不能清零上述边界。

### Human Authority

除 `protocols/authority.md` 的通用边界外，develop 必须基于**实际 fixed diff**独立识别以下 sensitive boundary：

- 权限 / 认证 / 数据隔离
- 不可逆数据操作或破坏性 migration
- 金额 / 计费 / 对账计算
- 对外不可撤销副作用

命中任一项时：

1. Reviewer 必须覆盖对应 sensitive boundary，并把有效模式升为 `full-local`。
2. 如果此前误按 standard/lightweight review，先补足 full-local review。
3. 在结果进入 Accepted Project Truth 前，由用户或其明确指定的审批人对**该具体风险**做 Human Authority 裁决。

这个裁决不是 G1–G5 的新增 Gate，也不能由更强模型替代。

## 8. Completion & Handoff

### `done`

满足：

- freshness 已闭合
- 当前实现与必要测试已形成 immutable Shared Candidate Truth
- fixed base / head 与 evidence pointer 已明确
- 当前 Owner 的必要 target verification 已完成到足以进入独立 review
- 不存在已知未处理的 scope / authority blocker

`done` 表示候选实现已经稳定可审，不表示已经进入 Accepted Project Truth。

### `done → taken-by`

出现以下任一情况时回 `taken-by`：

- blocking review finding
- deterministic verification 失败
- candidate snapshot 发生 implementation / test 变化
- 发现必须先处理的 freshness / scope / authority gap

修正后形成新的 fixed candidate，再进入 `done`。

### `merged`

满足：

- 最终 deterministic verification 对**将被接受的同一 snapshot**通过
- independent review 无未关闭 blocking finding
- `source=integration` repair 只声明本 develop Task 完成，不越权声明 system finding 已关闭
- 必要 sensitive Human Authority 已完成
- 实现、测试与必要 evidence 已进入 Accepted Project Truth
- `status.yml` 已准确记录 Task `merged` 与必要 pointer
- 没有把本 Task 必须完成的动作留在未接收的后台单元或未固定 Local Working Truth 中

Task `merged` 与 G1–G5 approval 正交。develop 本身不创建新的 Gate。

### Downstream

- `source=sprint`：相关 develop Task 进入 Accepted Project Truth 后，按依赖与 iteration 状态进入 `integration-verify`
- `source=foundation`：Foundation implementation 进入 Accepted Project Truth 后，回到项目既定 V0 → V1 路径
- `source=integration`：把已接受修复交回 `integration-verify` 复测
- `source=manual-test`：把已接受修复交回 `manual-test` 复验
- `source=bug | optimization`：B 类在 `merged` 后闭合本 Task；部署只有在另有授权时进入 `deploy`

下游重新读取 Accepted Project Truth，不继承 develop conversation。

## 9. Recovery Notes

`develop` 的 recovery 必须能从 `protocols/recovery.md` 的共同来源恢复，并额外找回：

- 当前 fixed candidate 或最近稳定 checkpoint
- freshness evidence
- current review chain 与未关闭 finding
- 关键 test / build evidence 的版本、命令、环境与结果
- 已用 implementation/test review snapshot 数
- 同一问题已用 attempts
- 当前 branch / PR / merge 的真实 Git 状态

恢复时从第一个未满足 completion condition 继续。

如果代码已经被接受/合并但 `status.yml` 尚未落定，先核真实 Git 结果再补 state；不得重复实现、重复 PR 或重开 review。

如果 Local Working Truth 还没有 stable snapshot，只能由当前 Owner 谨慎恢复；需要跨会话 / 执行环境时优先先形成 safe checkpoint，而不是传递完整聊天。
