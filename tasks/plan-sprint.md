---
schema: hact-task/vnext
task: plan-sprint
class: A
discipline: dispatch
gate: G3
preferred_runtime: reasoning
required_capabilities:
  - repository-read
  - semantic-reasoning
  - artifact-authoring
  - isolated-review
  - persistence
review: required
---

# plan-sprint

## 1. Purpose & Scope

### Purpose

把 G2 approved 的 Product / Technical / UX / Foundation Contract 转成一组可被 `develop` 直接消费的 durable Task Packages，明确 AC 覆盖、依赖、共享写集、风险、API contract 与交付边界，并形成 Sprint 规划。

`plan-sprint merged` 表示规划产物、Task registration 与其机械一致性已经进入 Accepted Project Truth，并使 G3 进入 ready。**G3 approved 前，`source=sprint` 的 develop Task 即使已经登记为 `status: 可取`，也不得认领。**

### In scope

- 从用户任务闭环、TRD 模块、共享资产和技术依赖拆 develop package
- 保留现有 task package schema
- 为 package 写可独立验证的 `intent / oracle`，必要时附 example / golden
- 做 PRD AC 正向 / 反向覆盖
- 明确 `depends_on`
- 明确 `asset-writes`
- 选择共享资产 source-of-truth package
- 标注 `risk`
- 为 backend→frontend 边界形成 `api-contract`
- 维护 visual / Foundation 地基跟进 package
- 进行独立 task-package semantic review
- 生成 `sprint.md`
- 把 sprint develop Task 注册进 `status.yml`
- 为 G3 readiness 提供稳定 Accepted Project Truth

### Out of scope

- 实现代码
- 修改 PRD / TRD / Foundation 以迎合拆包
- 在 package 中发明新的产品承诺
- 绕过 Shared Asset 冲突继续宣称可并行
- 在 G3 approved 前认领 `source=sprint` develop Task
- 修改 `check-sprint.js` 或其他 checker 来适配本迁移
- 用第五个 Task state 表达 planned / waiting / dependency-blocked

## 2. Preconditions

从 `可取` 进入 `taken-by` 前必须满足：

- 当前 HACT Method fixed SHA 已知。
- 当前迭代 PRD / TRD 已进入 Accepted Project Truth。
- G2 已 approved，并绑定明确 Technical Contract snapshot。
- PRD 要求的 UX 已经完成并进入 Accepted Project Truth。
- Owner 能读取当前 project / Foundation / reusables / decisions 与适用 shared contract。
- `plan-sprint` 自身已有明确 Owner。

G2 未 approved 时，本 Task 不能进入 `可取`。

## 3. Authoritative Inputs

### Required

- 当前 HACT Method fixed SHA
- G1 approved 的 `iterations/vN/prd.md`
- G2 对应的 `iterations/vN/trd.md`
- 项目根 `project.md`
- 项目根 `foundation.md`（存在时）
- 项目根 `reusables.md`
- 项目根 `decisions.md`
- 当前 `status.yml`
- 当前 task-package artifact schema
- 当前 `check-sprint.js` 所依赖的既有序列化约束

### Conditional

- `iterations/vN/ux-flows.md`
- `iterations/vN/prototype-map.md`
- `design.md`
- Foundation 本期新增“待建”关注点
- 现有 shared contract / API schema / state-machine
- 上游 revision record

### User input

只在以下情况需要新的 Human Authority：

- Task 粒度 / 交付边界存在多个明显不同且会改变协作方式的合理方案
- 多个 source-of-truth 选择会产生实质所有权差异
- 拆包暴露 Product / Technical Contract 缺口
- G3 approval
- 其他 `protocols/authority.md` 定义的边界

普通 package 写作、机械字段填充和已确定依赖不逐项询问。

上一会话或其他执行环境的聊天总结不是权威输入。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| Develop Task Packages | `iterations/vN/queue/{task-id}.md` | 每个 sprint develop task 一个 package；保持现有 schema |
| Sprint plan | `iterations/vN/sprint.md` | 人类可读的任务、依赖与交付视图 |
| Task registration | `status.yml tasks[]` | 与 queue / sprint 同步登记；初始 `status: 可取` |

### State updates

当前 `plan-sprint` Task：

`可取 → taken-by → done → merged`

规划过程中每形成一个正式 Task Package，就同步准备其 `status.yml tasks[]` registration；最终 candidate 必须让 queue ↔ sprint ↔ status 三方一致。

Sprint develop Task 的初始 registration：

- `type: develop`
- `source: sprint`
- 对应 iteration / sprint
- `status: 可取`
- `assigned_to: null`
- `depends_on`、delivery 等与 Accepted package / sprint 一致

这里的 `可取` 只表示“已登记、未认领”。实际认领仍受 `protocols/state.md` 与 `tasks/develop.md` Preconditions 控制。

### G3 boundary

G3 approval 前：

- queue / sprint / status registration 已经固定并通过 deterministic checks；
- Independent Review 已闭合；
- `plan-sprint` 可以进入 `merged`，G3 进入 ready；
- `source=sprint` develop Task 不得从 `可取` 进入 `taken-by`。

G3 approval 时只记录 Gate authority event；不再新增、重写或重排 Task Package / sprint / status task 内容。

### Conditional outputs

- Foundation / visual baseline follow-up package
- `feedback.md` 中的规划问题记录
- `revise-doc` Task（当发现上游 contract 缺口时）

## 5. Decision Rules & Boundaries

### 5.1 先按用户任务闭环，再按技术写集切包

拆包顺序：

1. 用户任务 / PRD AC 的可验证闭环
2. TRD 模块边界
3. 共享资产写集
4. package 边界与依赖

不能只按页面、文件夹或代码角色机械切包。

一个 package 可以只完成用户任务的一部分，但必须能指出其余部分由哪些 package 承接。

### 5.2 保留既有 Task Package schema

新 package 必须使用当前唯一序列化和 checker schema。

至少保留这些语义：

- package schema / task id / module / sprint id
- layers / source / task_type
- contract-impact
- title / description
- `depends_on`
- files
- `asset-writes`
- supersedes
- `ac-format: intent-oracle-v1`
- acceptance criteria
- reference
- context
- known-risks
- do-not
- escalate-if
- `risk`
- 条件性的 `api-contract`
- frontend 条件字段与 visual baseline 标记

vNext 不重写 `check-sprint.js`，因此不改变既有机器解析格式。

### 5.3 AC 双向覆盖

对每条 Task Package AC：

- 必须回链 PRD AC 或明确纯技术约束来源；
- `intent` 保留上游可观察承诺；
- `oracle` 给独立验证条件；
- `example` 默认只是帮助理解；
- 只有封闭输入、可独立复算且独立审查通过的 example 才允许 `golden: true`。

必须同时完成：

- Package → PRD 的正向忠实性
- PRD → Packages 的反向完整覆盖

只贴 AC id 不等于承接 AC。

### 5.4 Oracle 不得被普通 example 绑架

冲突优先级：

`intent / oracle > 普通 example`

若 example 与 oracle 不一致：

- 修 example；
- 或取消 `golden`；
- 不让 develop 代码迁就错误例子。

### 5.5 `depends_on` 表达真实硬依赖

必须写依赖的典型情况：

- 下游必须调用上游新增 API 才能开发 / 自检
- 下游编译依赖上游新增共享类型 / schema
- 两包写同一文件
- 两包写同一共享 asset key
- source-of-truth package 必须先落地

逻辑相关但写集独立，不自动制造依赖。

Task 可以在规划阶段登记为 `status: 可取`；真正认领时必须由 develop readiness 再核依赖是否满足。

### 5.6 `asset-writes` 是共享写集真相

每个 package 必须显式列出跨包共享写集，无则 `[]`。

稳定键可继续使用当前 schema 约定，例如：

- `db:users`
- `enum:OrderStatus`
- `type:UserDTO`
- `api:GET /users`
- `event:...`
- `config:...`

两包命中同一 asset 或同一 files 路径时：

- 选择一个 source-of-truth package；
- 其余 package 对它建立依赖；
- 对应交付标成串行。

不能把冲突写集包装成“逻辑相关”后继续并行。

### 5.7 Shared-asset source-of-truth 必须明确

Shared asset 的 owner package 负责：

- 创建 / 修改 canonical definition
- 给出上游 contract reference
- 提供自身 acceptance oracle

消费者只引用，不复制第二份真相。

Independent Review 要核 source-of-truth 方向；checker 负责机械发现明显冲突与断边。

### 5.8 `risk` 保留既有分级

默认：`risk: standard`

触及以下任一类时使用 `risk: sensitive`：

- 权限 / 认证 / 数据隔离
- 不可逆数据操作
- 金额 / 计费计算
- 对外不可撤销副作用

存疑时可以从严升档；不要因 reviewer 没看出风险而强迫降档。

### 5.9 `api-contract` 在 backend→frontend 边界提前锁定

当 backend package 的接口被 frontend package 消费时，Task Package 必须给出可直接开发的 `api-contract`，至少包括：

- endpoint
- request query / body（适用时）
- response fields / types

字段来源必须来自 Accepted TRD、UX/design 的真实消费需求或既有 shared contract，不能由 package writer 想象。

### 5.10 Frontend / visual Foundation 跟进

本期含 frontend Task 时保留既有 visual baseline 纪律：

- v1 需要 visual baseline package；
- 走过 V0 的项目只补 `design.md` 真值到已建 framework，不重建框架；
- 当前项目必须具备完整 visual baseline；
- vN+1 只在 design / Foundation 相关变更时创建 follow-up。

Foundation 新增“待建”的 ≥机械级关注点必须拆对应地基跟进 package，其 AC 要能证明 enforcement 真正生效，而不是只写“加约束”。

### 5.11 归属真空必须闭合

当某 package 的 `do-not` / context 表达“这件事不在本包”时：

- 必须存在明确的另一个 package 承接；
- 不能两个 package 互相推；
- 未指定承接方的范围排除不能静默进入开发。

继续使用现有 `check-sprint.js` 的归属真空检查。

### 5.12 Task `merged` 与 G3 正交

`plan-sprint merged` 的含义：

- package、sprint 与 task registration 已完成；
- deterministic verification / Independent Review 已通过；
- planning world 已进入 Accepted Project Truth；
- G3 进入 ready。

它不等于 G3 已 approved。

### 5.13 G3 approved 才允许认领 sprint develop

G3 approved 前：

`status: 可取` + `source=sprint` ≠ 可进入 `taken-by`

G3 approval 后，Owner 仍需核 `depends_on` 与其他 develop Preconditions；通过后才可认领。

不允许用 `taken-by` 假装 planned，也不新增第五状态。

## 6. Verification

### Deterministic

必须能够机械证明：

- Task Package 使用现有 schema，可被现有 checker 解析
- 必填字段完整
- reference 具有稳定锚
- AC 正向回链合法
- PRD AC 反向覆盖无遗漏
- intent / oracle 格式合法
- `depends_on` 引用在册 Task
- files / `asset-writes` 冲突存在依赖路径
- visual baseline 规则满足适用条件
- 归属真空检查通过
- `sprint.md` 与 queue 一致
- `status.yml tasks[]` 与 queue / sprint 三方一致
- 所有本期 sprint develop Task 初始登记为 `可取`
- `check-sprint.js` 对固定 planning snapshot 退出码 0

上述机械检查必须在请求 G3 approval 前完成。

### Semantic

必须确认：

- package 切分共同覆盖真实用户任务闭环
- 每条 AC 内容忠实于 PRD / TRD，而不是只有 id
- oracle 可独立验证
- golden example 经过独立复算
- API contract 能满足真实 frontend consumer
- `risk` 没有明显低标
- shared asset source-of-truth 方向合理
- Foundation follow-up 没有漏掉已承诺 enforcement
- package 没有暗中修改上游 contract

## 7. Review & Human Authority

### Independent Review

Required。

Reviewer 使用 `protocols/review.md` 的 same-source projection，不要求为了审查预加载整份长 Task Contract；特殊 review focus：

1. AC 忠实性
2. AC 完备性
3. oracle / example 独立复算
4. api-contract 推导正确性
5. visual / Foundation baseline 完备性
6. risk 标注
7. shared asset source-of-truth 与依赖断边
8. queue ↔ sprint ↔ status registration 是否表达同一个规划世界

当全部 normative core 超出单次有效审查范围时，可按业务模块切 module review，最后做 global-summary；global-summary 只核跨批 AC、shared assets、依赖与 registration，不重新全文审每个 package。

Finding action 可区分：

- fix-package
- revise-doc
- global-gap-review
- request-evidence

Reviewer 不替用户决定团队交付偏好或 G3。

### Human Authority

用户负责：

- 真正存在多种合理答案的 Task 粒度 / 交付方式取舍
- 会改变权责的 shared-asset source-of-truth 选择
- 上游 Contract 需要改变时的产品 / 技术决定
- 最终 G3 approval

普通机械拆包不要求逐包批准。

## 8. Completion & Handoff

### `done`

满足：

- 全部 Task Package candidate、`sprint.md` 与对应 status registration 已形成同一固定 candidate；
- deterministic verification 已完成；
- 可以对该 fixed snapshot 执行 Independent Review；
- 正式 Output 已持久化为 Shared Candidate Truth。

### `done → taken-by`

Independent Review 或 checker 发现 blocking finding 时回 `taken-by`。

- package / registration 问题 → targeted fix
- 上游 contract 问题 → `revise-doc`
- example error → 修 package / 取消 golden
- 不把 contract bug 留给 develop “边做边修”

修复后形成新的 fixed candidate，并重新验证受影响范围。

### `merged`

满足：

- queue / sprint / status deterministic checks 通过
- Independent Review 无未关闭 blocking finding
- 必要 planning 取舍已经获得所需 Human Authority
- Task Packages、`sprint.md` 与 task registration 已进入 Accepted Project Truth

此时 G3 进入 ready，但尚未自动 approved。

### G3

用户针对明确的 Accepted planning snapshot 批准 G3 后：

1. 只更新现有 Gate approval record（例如 `signed/date`）；
2. 不新增或重写 sprint Task registration；
3. planning artifacts 与 status task 内容无语义变化时，可复用刚通过的 `check-sprint` / Independent Review evidence；
4. Gate record 进入 Accepted Project Truth 后，`source=sprint` develop 才满足 Gate 前置。

若 approval 与持久化之间 planning content 发生变化，原 G3 approval 不自动覆盖新 snapshot。

### Downstream

G3 approved 后：

- `develop(source=sprint)` 才允许尝试认领；
- Owner 从 Git 读取自己的 Task Package、Accepted upstream truth 与 status；
- 认领前运行 dependency/readiness 检查，依赖未满足则保持 `可取`，不进入 `taken-by`；
- 正常 handoff 基于 Git snapshot，不传完整 planning conversation。
