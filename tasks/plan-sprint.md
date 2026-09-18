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

把 G2 approved 的 Product / Technical / UX / Foundation Contract 转成一组可被 `develop` 直接拾取的 durable Task Packages，明确 AC 覆盖、依赖、共享写集、风险、API contract 与交付边界，并形成 Sprint 规划。

`plan-sprint merged` 只表示规划结果已经进入 Accepted Project Truth。**Develop Task 在 G3 approved 前不得进入 `可取`。**

### In scope

- 从用户任务闭环、TRD 模块、共享资产和技术依赖拆 develop package
- 保留现有 task package schema
- 为每个 package 写 `intent / oracle / example / golden`
- 做 PRD AC 正向 / 反向覆盖
- 明确 `depends_on`
- 明确 `asset-writes`
- 选择共享资产 source-of-truth package
- 标注 `risk`
- 为 backend→frontend 边界形成 `api-contract`
- 维护 visual / Foundation 地基跟进 package
- 进行独立 task-package semantic review
- 生成 `sprint.md`
- 为 G3 readiness 提供稳定 Accepted Project Truth

### Out of scope

- 实现代码
- 修改 PRD / TRD / Foundation 以迎合拆包
- 在 package 中发明新的产品承诺
- 绕过 Shared Asset 冲突继续宣称可并行
- G3 approved 前把 develop Task 注册成 `可取`
- 修改 `check-sprint.js` 或其他 checker 来适配本迁移

## 2. Preconditions

进入 `可取` 前必须满足：

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
- `foundation.md` 本期新增“待建”关注点
- 现有 shared contract / API schema / state-machine
- 上游 revision record

### User input

只在以下情况需要新的 Human Authority：

- Task 粒度 /交付边界存在多个明显不同且会改变团队协作方式的合理方案
- 多个 source-of-truth 选择会产生实质所有权差异
- 拆包暴露 Product / Technical Contract 缺口
- G3 approval
- 其他 `protocols/authority.md` 定义的边界

普通 package 写作、机械字段填充和已确定依赖不逐项询问。

上一 Runtime 的聊天总结不是权威输入。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| Develop Task Packages | `iterations/vN/queue/{task-id}.md` | 每个 develop task 一个 package；保持现有 package schema |
| Sprint plan | `iterations/vN/sprint.md` | 人类可读的任务、依赖与交付视图 |

### State updates

当前 `plan-sprint` Task：

`可取 → taken-by → done → merged`

**G3 approved 前：**

- 可以存在已经 Accepted 的 task package 与 `sprint.md`
- 不把这些 develop Task 登记成 `status.yml tasks[].status: 可取`
- 不新增第五种“planned / waiting / pending”状态
- package 的存在不等于 develop Task 已经可拾取

**G3 approved authority event：**

在用户批准明确 Accepted planning snapshot 后：

1. 记录 G3 approval；
2. 把本期 develop Task 正式登记到 `status.yml tasks[]`；
3. 初始状态统一为 `可取`；
4. `depends_on`、delivery、source 等与 Accepted package / sprint 保持一致；
5. 对这个“G3 + tasks 可取”的拟提交状态运行现有 `check-sprint.js`，全绿后持久化 Accepted snapshot。

这样既不修改 checker，也不让 G3 前的 Task 误入四态状态机。

### Conditional outputs

- Foundation / visual baseline follow-up package
- `feedback.md` 中的规划问题记录
- `revise-doc` Task（当发现上游 contract 缺口时）

## 5. Decision Rules & Boundaries

### 5.1 先按用户任务闭环，再按技术写集切包

拆包顺序：

1. 先看用户任务 / PRD AC 的可验证闭环；
2. 再看 TRD 模块边界；
3. 再看共享资产写集；
4. 最后确定 package 边界与依赖。

不能只按页面、文件夹或代码角色机械切包。

一个 package 可以只完成用户任务的一部分，但必须能指出其余部分由哪些 package 承接。

### 5.2 保留既有 Task Package schema

新 package 继续使用当前序列化和 checker 兼容字段。

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
- `acceptance-criteria`
- reference
- context
- known-risks
- do-not
- escalate-if
- `risk`
- 条件性的 `api-contract`
- frontend 条件字段与 visual baseline 标记

本迁移不重写 `check-sprint.js`，因此不改变既有机器解析格式。

### 5.3 AC 双向覆盖

对每条 Task Package AC：

- 必须回链 PRD AC 或明确纯技术约束来源
- `intent` 保留上游可观察承诺
- `oracle` 给独立验证条件
- `example` 默认只是帮助理解
- 只有封闭输入、可独立复算且独立审查通过的 example 才允许 `golden: true`

必须同时完成：

- Package → PRD 的正向忠实性
- PRD → Packages 的反向完整覆盖

只贴 AC id 不等于承接 AC。

### 5.4 Oracle 不得被普通 example 绑架

冲突优先级：

`intent / oracle > 普通 example`

若 example 与 oracle 不一致：

- 修 example；
- 或取消 `golden`;
- 不让 develop 代码去迁就错误例子。

### 5.5 `depends_on` 表达真实硬依赖

必须写依赖的典型情况：

- 下游必须调用上游新增 API 才能开发 / 自检
- 下游编译依赖上游新增共享类型 / schema
- 两包写同一文件
- 两包写同一共享 asset key
- source-of-truth package 必须先落地

逻辑相关但写集独立，不自动制造依赖。

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

- 必须选择一个 source-of-truth package；
- 其余 package 对它建立依赖；
- 对应交付标成串行。

不能把冲突写集包装成“逻辑相关”后继续并行。

### 5.7 Shared-asset source-of-truth 必须明确

Shared asset 的 owner package 负责：

- 创建 / 修改 canonical definition
- 给出上游 contract reference
- 提供其自身 acceptance oracle

消费者只引用，不复制第二份真相。

Independent Review 要核 source-of-truth 方向是否合理，而 checker 只负责发现明显冲突与断边。

### 5.8 `risk` 保留既有分级

默认：

`risk: standard`

触及以下任一类时使用：

`risk: sensitive`

- 权限 / 认证 / 数据隔离
- 不可逆数据操作
- 金额 / 计费计算
- 对外不可撤销副作用

存疑时可以从严升为 sensitive；不要因为 reviewer “没看出风险”强迫降档。

### 5.9 `api-contract` 在 backend→frontend 边界提前锁定

当 backend package 的接口被 frontend package 消费时，Task Package 必须给出可直接开发的 `api-contract`，至少包括：

- endpoint
- request query / body（适用时）
- response fields / types

字段来源必须来自：

- TRD
- UX / design 的真实消费需求
- 已经 Accepted 的 shared contract

不能凭 package writer 想象字段。

### 5.10 Frontend / visual Foundation 跟进

本期含 frontend Task 时保留既有 visual baseline 纪律：

- v1 需要 visual baseline package
- 走过 V0 的项目只补 `design.md` 真值到已建 framework，不重建框架
- 存量项目按现有规则补完整 visual baseline
- vN+1 只在 design / Foundation 相关变更时创建 follow-up

Foundation 新增“待建”的 ≥机械级关注点必须拆对应地基跟进 package。

其 AC 必须包含：

> 写一条范围内违规反例 → 跑对应检查 / mechanism → 证明真被挡

不能只写“接 lint / 加约束”。

### 5.11 归属真空必须闭合

当某 package 的 `do-not` / context 表达“这件事不在本包”时：

- 必须存在明确的另一个 package 承接
- 不能两个 package 互相推
- 未指定承接方的范围排除不能静默进入开发

继续使用现有 `check-sprint.js` 的归属真空检查。

### 5.12 Task `merged` 与 G3 正交

`plan-sprint merged` 的含义：

- package 与 sprint 规划已经完成
- verification / review 已通过
- planning artifact 已进入 Accepted Project Truth
- G3 进入 ready

它**不**意味着 develop Task 已经 `可取`。

### 5.13 G3 approved 才发布 develop 可用性

用户批准 planning snapshot 后，G3 authority event 同时使 develop Task 满足其 `source=sprint` 硬前置。

此时才把它们登记为：

`status: 可取`

不允许：

- G3 前先写 `可取`
- 用 `taken-by` 假装 planned
- 增加第五状态

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

**G3 approved 后的最终 publish snapshot** 还必须证明：

- `status.yml tasks[]` 与 queue / sprint 三方一致
- 所有本期 develop Task 初始为 `可取`
- G3 approval 已记录
- 现有 `check-sprint.js` 对该 post-approval snapshot 退出码 0

本迁移不修改 `check-sprint.js`。

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

默认：

`Same Runtime + Fresh Isolated Context + Same Task Contract`

特殊 review focus 继承旧 `task-package-review` 的实质要求：

1. AC 忠实性
2. AC 完备性
3. oracle / example 独立复算
4. api-contract 推导正确性
5. visual / Foundation baseline 完备性
6. risk 标注
7. shared asset source-of-truth 与依赖断边

当全部 normative core 超出单次有效审查范围时：

- 按业务模块切 module review
- 最后做 global-summary
- global-summary 只核跨批 AC、shared assets 与依赖
- 不重新全文审每个 package

Finding action 继续区分：

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

- 全部 Task Package candidate 与 `sprint.md` 已形成
- deterministic verification（不依赖 G3 status registration 的部分）完成
- 独立 review 可针对固定 Shared Candidate snapshot 执行
- 正式 Output 已持久化

### `done → taken-by`

Independent Review 或 checker 发现 blocking finding 时回 `taken-by`。

- package 问题 → targeted fix
- 上游 contract 问题 → `revise-doc`
- example error → 修 package / 取消 golden
- 不把 contract bug 留给 develop “边做边修”

### `merged`

满足：

- package / sprint deterministic checks 通过
- Independent Review 无未关闭 blocking finding
- 必要 planning 取舍已经获得所需 Human Authority
- Task Packages 与 `sprint.md` 已进入 Accepted Project Truth

此时 **G3 尚未自动批准，develop Task 也尚未进入 `可取`。**

### G3

Task `merged` 后 G3 进入 ready。

用户批准明确 Accepted planning snapshot 后：

1. 更新 G3 approval record；
2. 把本期 develop Task 写入 `status.yml tasks[]`；
3. 全部初始 `status: 可取`；
4. 运行现有 `check-sprint.js` 验证 queue ↔ sprint ↔ status；
5. 全绿后把 authority event 与 Task availability 一起持久化到 Accepted Project Truth。

若检查失败，只修机械不一致并重新验证；不能把未验证的 status candidate 宣称为 G3 完成。

### Downstream

G3 approved 后：

- `develop(source=sprint)` 才满足硬前置
- 每个 develop Owner 从 Git 读取自己的 Task Package、Accepted upstream truth 与 status
- 依赖未满足的 Task 即使已登记，也不得绕过 `depends_on` 开始实现；可取性要同时服从 `develop` 自身 Preconditions
- 正常 handoff 基于 Git snapshot，不传完整 planning conversation

