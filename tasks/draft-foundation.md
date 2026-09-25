---
schema: hact-task/vnext
task: draft-foundation
class: A
discipline: architecture
gate: G2
preferred_runtime: reasoning
required_capabilities:
  - repository-read
  - semantic-reasoning
  - artifact-authoring
  - persistence
review: none
---

# draft-foundation

## 1. Purpose & Scope

### Purpose

在新项目进入 V1 产品迭代前，把真正稳定、跨切面、晚建代价高的承重约束收敛成 V0 Foundation Contract，并给下游 `develop(source=foundation)` 一份足够薄、可建、可验证的走骨架设计。

本 Task **只产设计，不产代码**。任何瓶颈管道、作用域 repository、全局守卫、主题框架、错误信封或标杆切片代码，都由后续 `develop(source=foundation)` 物化。

### In scope

- 判断哪些 Foundation 关注点真正进入 V0
- 确认或补齐首期技术栈
- 为 V0 关注点确定具体形式、承载位置和 enforcement grade
- 对安全敏感关注点定义构造级强制边
- 形成一根最薄、真实、可穿透主要承重面的标杆切片设计
- 明确测试框架、位置和命令入口
- 更新项目长期技术事实和必要架构决策
- 为 G2(v0) readiness 提供稳定 Accepted Project Truth

### Out of scope

- 任何实现代码
- 为未来 V1 功能预建运行器、黄金样本、完整业务模块或业务脚手架
- 为了“表格完整”把未满足 V0 准入门槛的关注点提前建设
- 把 V0 做成完整应用骨架或通用框架工程
- 以 AI 判断替代 G2 Human Authority

Task Contract 只定义本 Task 独有规则。状态、Gate、Git Truth、Authority 与 Recovery 引用 `protocols/`；具体 Runtime 操作进入 `runtime/`。

## 2. Preconditions

从 `可取` 进入 `taken-by` 前必须满足：

- 项目初始化已经完成。
- 项目根 `foundation.md` 已播种，至少存在可识别的领域地图 / 核心实体与关注点登记。
- 项目已明确选择走 V0 Foundation 路径。
- 当前处于 V1 PRD 之前；V0 不要求 G1，也不读取尚不存在的 PRD 作为设计前置。
- 当前 HACT Method fixed SHA 已知。
- Owner 能读取项目 Accepted Project Truth 并持久化正式 artifact。

若没有任何关注点满足 V0 准入门槛，本 Task 可以以“无需 V0 建设”的结论完成；不得为了维持流程而虚构 V0 工作。

## 3. Authoritative Inputs

### Required

- 当前 HACT Method fixed SHA
- 项目根 `foundation.md`
- 项目根 `project.md`
- 项目根 `decisions.md`
- 项目根 `reusables.md`
- 当前 `status.yml`
- 用户已经给出的项目目标、约束和技术偏好

### Conditional

- `_meta/input/` 中与架构、外部系统、数据边界有关的背景材料
- 已存在的技术约束 / shared contract
- 用户此前明确确认的栈选择或安全边界

### User input

只在以下情况需要新的 Human Authority：

- 技术栈偏好缺失且存在多个真实可选方向
- V0 范围存在多个合理取舍且会显著改变后续承重结构
- 安全敏感关注点无法达到要求的构造级强制边
- 其他 `protocols/authority.md` 定义的 Authority 边界

上一 Runtime 的聊天总结不是权威输入。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| Foundation blueprint | `foundation.md` | 原地维护；每个关注点明确 V0 / V1+，V0 行写具体形式与实际档 |
| V0 build contract | `iterations/v0/foundation-design.md` | 只含获准 V0 地基件与一根最薄标杆穿透切片 |
| Project technical truth | `project.md` | 栈、数据库、模块轮廓、测试框架与命令入口 |
| Architecture decisions | `decisions.md` | 仅记录不能从 Foundation / code 直接读出的关键取舍 |

### State updates

- 当前 `draft-foundation` Task 按 `可取 → taken-by → done → merged` 更新。
- Task `merged` 后只表示 Foundation 设计已经进入 Accepted Project Truth。
- **不得因为 Task `merged` 自动写 G2 approved。**

### Conditional outputs

- 若没有任何关注点通过 V0 准入门槛，可不产生 `iterations/v0/foundation-design.md`；必须留下明确的“V0 不成立 / 转 V1” durable conclusion。
- G2(v0) approval 发生时，由 Gate authority event 单独更新 `status.yml` 中对应 G2 approval record。

聊天草稿、本地 dirty state 或未持久化文本不属于正式 Output。

## 5. Decision Rules & Boundaries

### 5.1 V0 只收真正的承重项

一个关注点进入 V0，必须同时满足：

1. 已证明会被多个功能或多个切面共同经过；
2. 约束足够稳定，不依赖尚未定义的 V1 业务细节；
3. 晚建会横切多层 / 多模块、迁移数据，或明显扩大安全风险；
4. 能由一根最薄真实切片或独立反例证明它被正确承载。

“V1 马上会用”“以后可能复用”“看起来像基础设施”都不是 V0 准入理由。

不满足条件的行明确标成 `V1+` 并写理由，不实现、不审查、不阻断 G2(v0)。

### 5.2 只设计，不产代码

本 Task 可以写：

- 具体形式
- 承载位置
- 契约 / 签名级要求
- enforcement mechanism
- 标杆切片路径
- 验证入口

但不能写实现代码并把它当成本 Task 的产物。

V0 实现统一进入 `develop(source=foundation)`。

### 5.3 Enforcement grade 必须真实

Foundation 中至少区分：

- 构造级：正常开发路径天然必须满足不变式，绕开正常接口才能违规
- 机械级：常见违规会触发真实 checker / type / lint / policy / test 失败
- 人审级：主要依赖人工或语义审查

对 V0 行，实际档必须不低于应有档。

**数据隔离、鉴权、越权等安全敏感 V0 项必须达到构造级。** 如果做不到：
- 先重选机制；
- 仍做不到则把风险和可选边界提交 Human Authority；
- 不得静默降级后宣称满足 Foundation。

判断实际档前必须追到真实承载层；DB RLS、框架全局守卫、基础设施 policy 都可能是实际 enforcement，不能只看应用层一处代码形态。

### 5.4 命门检查

对每个 V0 关注点都要回答：

> 一个可信开发者按正常路径图省事地接入时，是否仍然容易自然合规？

若答案是否，说明当前形式还没有把强制边顶到位。

这不是要求防开发者恶意绕过；强制边遵循 `review-scope` 的可信开发方前提。

### 5.5 一根最薄标杆切片

`foundation-design.md` 只允许一根最薄的真实业务切片作为穿透证明：

- 取自 Foundation 核心实体
- 从真实主入口进入
- 穿过本轮获准地基件
- 到达真实持久化或外部边界
- 能成为后续实现的标杆模块

不为了“全栈”制造项目本来不存在的层，不在切片之外准备 V1 业务。

### 5.6 验证入口先确定、运行器后实现

本 Task 要明确：

- 测试框架
- 测试位置
- build / type / lint / test 等命令入口

若运行器尚不存在，写成下游 `develop(source=foundation)` 的建造责任；不能在本 Task 偷偷实现。

### 5.7 Durable truth 放对位置

- `foundation.md`：跨迭代承重不变量和 enforcement
- `project.md`：长期技术事实、栈与验证入口
- `decisions.md`：仍影响后续判断、又无法从前两者直接读出的关键选择
- `foundation-design.md`：V0 本次要建的最小集合

不要重复复制同一事实形成多份真相源。

### 5.8 Gate 与 Task 正交

`draft-foundation merged` 只表示设计工作完成。

其后：
- G2(v0) 进入 ready；
- 用户对明确 Accepted snapshot 批准后，形成独立 G2 authority event；
- G2 approval 不能由模型、reviewer 或更强 Runtime 代替。

## 6. Verification

### Deterministic

必须能够机械证明：

- `foundation.md` 中所有被本 Task处理的关注点都有 V0 / V1+ 结论
- 每个 V0 行都有具体形式和实际档
- 安全敏感 V0 行没有低于构造级的声明
- 有 V0 时 `iterations/v0/foundation-design.md` 存在
- `foundation-design.md` 只声明获准地基件，并且只有一根标杆穿透切片
- `project.md` 可定位技术栈、测试框架、测试位置和命令入口
- 不存在本 Task 新增的实现代码作为正式 Output

当前仓库已有 checker 能覆盖的部分继续使用；本迁移不修改 checker。

### Semantic

必须确认：

- V0 准入理由确实是跨切面、稳定且晚建代价高
- 具体 enforcement 与应有档匹配
- 安全敏感项的构造级机制不是空口声明
- 标杆切片足够真实、足够薄、确实穿透本轮承重面
- V1+ 项没有因为“顺手”重新混入 V0
- 技术栈与验证入口和项目约束一致

## 7. Review & Human Authority

### Independent Review

本 Task **不新增独立 Foundation 设计 review**，避免把旧实现审查 brief 错迁成设计审查流程。

`templates/review-briefs/foundation-review.md` 继续服务于下游 `develop(source=foundation)` 的实现级 Independent Review，重点核真实 enforcement、正反证据、范围膨胀和标杆切片运行结果。

若项目另有高风险 architecture review 要求，可按 Shared Review Protocol 增加专项复核，但不改变本 Task 的默认完成条件。

### Human Authority

必须由用户决定：

- 缺失或有真实分歧的技术栈方向
- 会改变 V0 承重范围的重要取舍
- 安全项无法达到构造级时是否接受风险 / 改变范围
- 最终 G2(v0) approval

已明确且未变化的决定不重复询问。

## 8. Completion & Handoff

### `done`

满足：

- Foundation candidate 与必要 V0 design 已形成
- 正式 Output 已持久化到明确 Shared Candidate snapshot
- V0 / V1+ 判定、实际档和最薄切片可以被重新读取和验证

### `done → taken-by`

确定性检查或语义核对发现 blocking 问题时，回 `taken-by` 修正并形成新 candidate。

### `merged`

满足：

- deterministic verification 通过
- semantic verification 无未关闭 blocking issue
- 必要技术 / 安全取舍已经获得所需 Human Authority
- 正式 artifact 已进入 Accepted Project Truth

此时 **G2(v0) 尚未因此自动批准**。

### G2(v0)

Task `merged` 后 G2(v0) 进入 ready。

用户对明确 Accepted snapshot 批准时，单独记录 G2 authority event 与 approved snapshot。

### Downstream

G2(v0) approved 后：

- `develop(source=foundation)` 才满足其 Foundation 硬前置并进入 `可取`
- `develop(source=foundation)` 读取 `foundation.md` 与 `iterations/v0/foundation-design.md` 建地基件 + 标杆切片
- Foundation 实现进入 Accepted Project Truth 后，再进入 V1 `draft-prd`

下游从 Git 重新读取 Accepted Truth，不继承完整 conversation。
