---
schema: hact-task/vnext
task: draft-prd
legacy_aliases:
  - draft-prd-vN
class: A
discipline: product
gate: G1
preferred_runtime: reasoning
required_capabilities:
  - repository-read
  - semantic-reasoning
  - artifact-authoring
  - persistence
review: required
---

# draft-prd

## 1. Purpose & Scope

### Purpose

把本期用户问题、产品范围、核心功能和可验证行为沉淀为稳定 Product Contract，为 UX、技术设计和后续实现提供权威输入。

### In scope

- 还原真实用户场景
- 明确本期产品目标和目标用户
- 比较合理产品方向并完成必要产品取舍
- 定义核心功能和 MVP 边界
- 为每个功能形成可验证 Acceptance Criteria
- 明确 `draft-ux` 是否需要
- 清零 PRD 内开放问题
- 走过 V0 时核对本期触及的 as-built 事实
- 更新 `project.md` 的产品层长期事实

### Out of scope

- 具体技术实现方案
- API、数据库、内部错误码等技术精度
- 视觉设计和完整交互设计
- 实现代码
- 代表用户判断技术方案

## 2. Preconditions

- 项目已经初始化。
- 项目根存在 `project.md` 或等价 Accepted Project Truth。
- 本 Task 无上游 Gate 前置。
- 当前需求属于 A 类迭代工作。
- 明确 bug / 局部 optimization 不创建本 Task，走 B Intake → `develop`。
- version 已确定为 `vN`；存在真实歧义时必须由用户裁决。

## 3. Authoritative Inputs

### Required
- `project.md`
- 当前 `status.yml`
- 用户对本期需求的原始描述
- 当前采用的 HACT Method fixed SHA 下的本 Task Contract 与适用 Protocol

### Conditional
- `foundation.md`
- 上一期 PRD
- `backlog.md`
- `_meta/input/background.md`
- V0 已存在时的实际代码、migration、实体/状态/队列定义与 reusable / as-built evidence

Owner 必须自己读取 Git 中的 Accepted Project Truth。不得用上一期聊天总结或其他 Runtime 转述替代权威 artifact。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| PRD | `iterations/vN/prd.md` | 使用当前 PRD artifact schema |
| 产品长期事实 | `project.md` | 仅更新长期产品事实 |
| V0 as-built ledger | `iterations/vN/as-built-ledger.md` | 仅在适用时 |

### State
- `status.yml` 中对应 `draft-prd` Task lifecycle
- G1 approval 后按现有 `status.yml` Gate serialization 记录 authority event；Git history 与 fixed candidate 提供 snapshot binding

PRD 必含语义结构：
- 产品目标
- 目标用户
- 核心功能
- 用户故事
- MVP 边界
- 开放问题

每个核心功能至少表达：
- 入口
- `draft-ux: 需要 | 不需要`
- 涉及实体
- 场景 / 行为说明
- Acceptance Criteria
- 明确排除项

## 5. Decision Rules & Boundaries

### 5.1 场景先于方案
定义功能范围前必须能回答：谁、情境、问题、现有解法、不足。关键要素缺失时必须澄清，不得因“大概懂了”直接生成正式功能范围。

### 5.2 先做方向取舍
存在多个合理产品方向时，比较少量真正不同的方案，重点看：
- D — User Value
- F — Feasibility / technical risk
- V — Business viability

涉及产品方向、范围或重要取舍时必须由用户最终决定。已明确部分不反复确认。

### 5.3 控制 Scope
功能明显过多时主动建议拆期。不得把未来愿望、技术优化、无本期价值承诺的便利项自动纳入 Scope。MVP 边界必须明确“不做什么”。

### 5.4 Acceptance Criteria 使用 Intent + Oracle
有行为的 AC 至少包含：
- `intent`：用户或外部可观察结果
- `oracle`：如何独立判断满足

`example` 可选。

写不出独立 oracle → 需求仍模糊，必须澄清。example 不得高于 oracle；冲突时修 example。技术精度默认留 TRD，除非它本身就是产品承诺。

### 5.5 AC 可达性
AC 提到容器、列表、状态、队列或目标位置时，必须能回答“当前在哪里，以及通过什么行为/状态转换到达目标”。不存在可达路径时，AC 不能视为有效。

### 5.6 隐含维度
数据列表至少考虑默认排序和空态；搜索明确字段范围；不可逆操作明确恢复语义；跨会话状态明确持久化范围。

确实只能在 UX 阶段决定的内容可路由到 `draft-ux`，但不能留下无人承接的模糊开放问题。

### 5.7 UX routing
PRD 只决定 `draft-ux: 需要 | 不需要`。视觉规格和详细 interaction flow 不属于本 Task。新页面、多分支交互或复杂状态恢复时应认真判断是否需要 UX。

### 5.8 V0 / As-built consistency
走过 V0 且本期触及核心实体、状态、队列、转换关系或 Foundation 关键约束时，不能只相信设计文档，必须核真实承载并形成必要 evidence。

`未知` 不能作为最终状态；`漂移` 必须在 PRD 定稿前有处置；evidence 需要真实 path / symbol anchor。

### 5.9 开放问题必须清零
正式 candidate 中开放问题必须为空。

无法在本 Task 裁决的问题只有两种去向：
1. 路由到明确下游 Task
2. 进入 backlog 并退出本期 Product Contract

### 5.10 Contract drift
PRD 进入 Accepted Project Truth 后发现关键遗漏或产品承诺变化，不静默改历史 Task，走 `revise-doc(target=prd)`；已批准 G1 不回退。

## 6. Verification

### Deterministic

必须能够机械证明：
- 六个核心段落存在且必填部分非空
- 开放问题为空
- 每个功能有 `入口`
- `draft-ux` 枚举合法
- 每个功能有 `涉及实体`
- 每个功能至少一个 AC
- AC id 满足当前 artifact schema
- V0 适用时 as-built ledger 结构完整

当前可继续使用 `check-docs.js` 与适用 as-built checker 作为实现。

### Semantic

必须确认：
- 场景还原真实完整
- 产品方向和 Scope 已完成必要取舍
- Intent 可观察
- Oracle 可独立判断
- AC 可达
- 用户故事覆盖核心场景
- 关键异常/空态没有明显缺口
- UX routing 合理
- V0 适用时 PRD 与真实 as-built 一致
- MVP 排除项与功能范围不冲突

## 7. Review & Human Authority

### Independent Review

必须进行独立内容审查，至少覆盖：
1. 内部一致性
2. AC 可验性与可达性
3. 覆盖完整
4. V0 一致性（适用时）

Reviewer 不替用户判断产品方向，也不负责 TRD 级技术设计。

### Human Authority

用户负责：
- 产品方向
- 功能范围
- 重要产品取舍
- 最终 G1 approval

同一产品决定不重复机械确认。

## 8. Completion & Handoff

### `done`

满足：
- 完整 PRD candidate 已形成
- 所有正式 Output 已持久化到明确 Shared Candidate snapshot
- 开放问题已清零
- deterministic verification 可对该 snapshot 执行

### `done → taken-by`
Independent Review 或 verification 出现 blocking finding 时回 `taken-by`，修正并形成新 candidate。

### `merged`

满足：
- deterministic verification 通过
- independent review 无未关闭 blocking finding
- 必要产品语义问题已由用户裁决
- 最终 artifact 已进入 Accepted Project Truth

此时 Task 为 `merged`，**G1 尚未因此自动批准**。

### G1

Task `merged` 后 G1 进入 ready。用户对明确 Accepted snapshot 最终批准时，形成单一 G1 Authority Event；按现有 `status.yml` Gate serialization 记录批准，Git history 与 fixed candidate 提供 snapshot binding。

### Downstream

G1 approved 后：
- 需要 UX → `draft-ux`
- 无 UX 前置或 UX 已完成 → `draft-tech-design`

下游从 Git 重新读取 approved Product Contract，不继承完整 conversation。
