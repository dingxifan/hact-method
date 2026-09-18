---
schema: hact-task/vnext
task: revise-doc
class: cross-cutting
discipline: derived-from-target
gate: null
preferred_runtime: reasoning
required_capabilities:
  - repository-read
  - semantic-reasoning
  - artifact-authoring
  - persistence
review: conditional
---

# revise-doc

## 1. Purpose & Scope

### Purpose

对已经进入 Accepted Project Truth 的 PRD、TRD、Foundation 或 `project.md` 技术约束做**最小化、可追溯的修订**，保留历史 Gate 事实，明确判断下游影响，并把需要级联的变化拆成新的 Task，而不是静默改写既有历史。

`revise-doc` 修的是当前权威文档，不回滚已经 `merged` 的历史 Task，也不因为文档变化自动撤销已经 approved 的 Gate。

### In scope

- 根据明确 `target` 与 `reason` 定位权威文档中的具体问题
- 只修改解决该问题所需的最小范围
- 记录 revision 原因与 durable change history
- 判断对 TRD、Task Package、Foundation follow-up、已 merged 实现的真实影响
- 对受影响的 AC 重新做 intent / oracle / example 对账
- 必要时创建独立的级联 `revise-doc` 或新的 `develop` Task
- 在 revision 自身跨 Human Authority 边界时取得必要用户决定

### Out of scope

- 借 revision 重写整份文档
- 顺手扩大产品 / 技术 Scope
- 因 revision 自动撤销 G1–G5 历史 approval
- 在同一个 `revise-doc` 中同时修改 PRD 和 TRD 等多层 Contract
- 回滚已经 `merged` 的历史 Task 来伪装“历史从未发生”
- 文档修订时直接实施代码变化
- 每次 revision 都机械要求用户确认

Task Contract 只定义 `revise-doc` 独有规则。共同状态、Authority、Git Truth、review 与 recovery 纪律引用 `protocols/`。

## 2. Preconditions

进入 `可取` 前必须满足：

- 当前 HACT Method fixed SHA 已知。
- 有明确 `target`：`prd | trd | foundation | project`。
- 有明确 `reason`：触发来源 + 可定位的问题说明。
- 目标文档已经存在于 Accepted Project Truth。
- Owner 能读取目标文档、相关 Accepted upstream/downstream truth 与当前 `status.yml`。
- 修订授权范围明确；仅获授权诊断时不得自动实施修改。

典型触发包括：

- `develop` 发现 contract / claim drift
- Independent Review 的 blocking finding 根因在上游文档
- `manual-test` 发现 PRD 定义歧义
- `integration-verify` 暴露跨模块 contract 缺口
- `wrap-up-iteration` 的 deviation reconciliation
- 用户主动要求修订权威文档

**已 approved Gate 不构成阻断，也不因本 Task 创建而回退。**

## 3. Authoritative Inputs

### Required

- 当前 HACT Method fixed SHA
- 当前 `status.yml`
- `target` 对应的 Accepted Project Truth：
  - `prd` → `iterations/vN/prd.md`
  - `trd` → `iterations/vN/trd.md`
  - `foundation` → `foundation.md`
  - `project` → `project.md` 技术层
- `reason` 对应的具体 evidence / finding / user request
- 适用 Shared Protocol

### Conditional

- 与目标文档直接相关的上游 / 下游 artifact
- 受影响的 Task Package
- PRD AC、TRD 技术载体、UX U/S
- 当前实现、test evidence 或 merged Git snapshot（仅用于判断下游影响；本 Task 不修改代码）
- `backlog.md`
- prior revision record / review finding

### User input

只有 revision **本身跨越 Human Authority 边界**时才需要新的用户决定，例如：

- 改变产品范围、用户可观察承诺或业务规则
- 多个合理技术方向存在实质长期 / 安全 / 成本差异
- 大幅接口 schema、数据库结构、权限模型等变化需要确认授权边界
- 不可逆或高影响决定

纯粹修正文档遗漏、claim 错误、明显矛盾、引用漂移或已被权威事实唯一确定的内容，不机械要求用户确认。

上一 Runtime 的聊天总结不是权威输入。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| Revised contract | 目标原路径 | 原地最小修改；Git history 保留 revision 事实 |
| Revision ledger | `backlog.md` | 追加 `[修订]` 条目，说明 target / change / reason |

### Conditional outputs

| Artifact | Path | Condition |
|---|---|---|
| Cascaded revise-doc Task | 当前 Task / queue contract 位置 | PRD revision 影响 TRD 等下游 Contract 时创建独立 Task |
| Updated Task Package | `iterations/vN/queue/{task-id}.md` | TRD / Foundation / project revision 使尚未完成 package contract 失效时 |
| Foundation follow-up Task | 当前 develop Task contract 位置 | Foundation invariant 变化需要新实现时 |
| New develop Task | 当前 develop queue / intake | 新权威 intent / invariant 使已 merged 实现不再满足时 |
| Feedback record | `feedback.md` | 同类 revision 反复发生并暴露上游方法问题时 |

### State updates

- 当前 `revise-doc` Task：`可取 → taken-by → done → merged`
- 已批准 Gate 保持原历史记录，不撤销、不改写为未批准
- 已 `merged` 的历史 Task 不回退；新的变化由新的 Task 表达

聊天中的修订建议、未持久化 patch 或“已通知下游”不属于完成 Output。

## 5. Decision Rules & Boundaries

### 5.1 Revision 必须最小化

只修改 `reason` 指向的问题面。

每个改动都应该能回答：

> 如果删除这一处变化，原问题是否仍存在？

若答案是否，说明这处可能超出必要范围。

不得因为“顺手统一一下”“结构可以更漂亮”扩大 revision。

### 5.2 Gate history 不回退

已 approved 的 G1–G5 是已经发生的 Human Authority Event。

后续文档 revision：

- 不撤销历史 approval
- 不修改历史 Task 为非 merged
- 通过 revision record + 新 Accepted snapshot 表达现在的真相

若新变化需要新的阶段性 Human Authority，由当前适用 Task / Gate 产生新的 authority event，而不是篡改旧记录。

### 5.3 PRD → TRD 级联必须拆 Task

`target=prd` 修订后，如果接口、数据结构、状态、权限或其他 Technical Contract 会受影响：

- 创建独立 `revise-doc(target=trd)`
- 明确 reason 与受影响 PRD anchor
- 当前 Task 不顺手修改 TRD

这保留每一层 Contract 的责任边界和可恢复性。

### 5.4 TRD / Foundation / project 对 Task Package 的影响

若下游 develop Task 尚未完成：

- 只更新真正受影响的 package slice
- 更新 intent / oracle / reference / api-contract / risk / dependency 等失效字段
- 不重写无关 package
- 必要时重新运行 package 的既有 review / checker 范围

如果 package 已在 `taken-by`，Owner 必须重新读取新 Accepted Truth；不能靠聊天通知替代 Git snapshot。

### 5.5 Foundation revision 区分 claim 与 invariant

`target=foundation` 时先分类：

- **claim-only**：实际机制没变，只是档位 / 锚点 / 描述错误 → 修文档，不制造代码 Task
- **invariant change**：权威约束本身变化 → 创建新的 Foundation follow-up / `develop` Task，不能静默扩大当前 implementation scope

claim-only revision 的代码改动数应为 0。

### 5.6 已 merged 实现不回滚历史

Revision 影响已经 `merged` 的实现时：

1. 先比较**新权威 intent / invariant**与当前运行行为；
2. 当前行为已经满足，只是文档落后 → 代码不改；
3. 新权威 Contract 明确改变且当前行为不满足 → 创建新的 `develop` Task；
4. 记录 deviation / revision linkage；
5. 不把历史 develop Task 从 `merged` 改回 `taken-by`。

### 5.7 AC 漂移只复核受影响面

对受影响 AC：

- intent 变了 → 下游 acceptance contract 必须更新
- oracle 变了 → 相应 test / package contract 更新
- 只有 example 算错 → 修 example 或取消 `golden`，不制造代码整改

只复核受影响 AC，不无条件重跑全量 planning / review。

### 5.8 Human Authority 按语义边界触发

不是“revise-doc = 每次都问用户”。

只有当 revision 需要新的业务 / 产品 / 高影响技术决定时才停下请求 Human Authority。

若正确修改可以从现有 Accepted Truth 与 evidence 唯一推导，应连续完成、验证并持久化。

### 5.9 不用通知代替 durable handoff

“我告诉了下游”“聊天里说明了变化”不是 handoff。

下游必须基于：

- 新 Accepted Git snapshot
- 新 / 更新后的 Task Contract 或 Task Package
- 明确 dependency / revision linkage

恢复也从这些事实开始。

## 6. Verification

### Deterministic

必须能够机械证明：

- `target` 与 `reason` 存在且合法
- 目标文档存在
- revision 只修改声明的目标 artifact 与必要 ledger / downstream contract
- `backlog.md` 有对应 `[修订]` 记录
- 若生成级联 Task，其 target / reason / dependency 可定位
- status transition 符合四态
- 已 approved Gate 没有被 revision 撤销
- 已 merged 历史 Task 没有被回滚状态
- 适用的既有 checker 对受影响 artifact 通过

本迁移不修改 checker。

### Semantic

必须确认：

- revision 真正解决 `reason` 指向的问题
- 改动没有扩大到无关范围
- 新内容与上游 Accepted Truth 一致
- 下游影响分类正确，没有漏掉真实受影响 contract
- PRD → TRD 等级联没有被偷偷合并在一个 Task
- claim-only 没有制造无意义代码整改
- 新 invariant / intent 若改变实现，已经生成新的 durable work item

## 7. Review & Human Authority

### Independent Review

默认 **conditional**，不为每个小 revision 新增完整独立审查流程。

以下情况应进行 Fresh Isolated Context 的 targeted review：

- revision 改变 PRD / TRD 的关键 Contract 语义
- Foundation invariant 或 enforcement claim 发生高风险变化
- 变化跨多个下游 Task / shared asset
- 原触发 finding 本身来自独立 review，且闭合需要独立 re-review

Review 只核受影响 slice 与 finding closure，不重审整份文档。

纯 typo、稳定锚修正、claim-only 且权威事实唯一的修订，可由 deterministic + semantic verification 完成，不机械增加 reviewer。

### Human Authority

用户只负责 `protocols/authority.md` 定义的真实决定，包括：

- 产品 / 业务范围变化
- 多个合理方向的关键取舍
- 高影响 / 不可逆边界
- 授权范围扩大

修订事实本身、明显错漏修复、已确认决定的忠实回写不需要重复确认。

## 8. Completion & Handoff

### `done`

满足：

- 最小 revision candidate 已形成
- revision ledger 与必要 downstream impact artifact 已形成
- 正式 Output 已持久化到明确 Shared Candidate snapshot
- targeted verification / review（如适用）可针对该 snapshot 执行

### `done → taken-by`

验证或 targeted review 发现 blocking finding 时回 `taken-by`，只修相关变化面。

### `merged`

满足：

- revision deterministic / semantic verification 通过
- 条件性 Independent Review 无未关闭 blocking finding
- revision 自身需要的 Human Authority 已取得
- revised artifact 与必要级联 work item 已进入 Accepted Project Truth

`merged` 不撤销旧 Gate，也不回滚旧 Task。

### Downstream

- `target=prd` 且影响 TRD → 新 `revise-doc(target=trd)` 从新 Accepted PRD snapshot 开始
- `target=trd | foundation | project` 且影响未完成 develop → 对应 package / Owner 从 Git 重读新 Contract
- 影响已 merged 实现 → 新 `develop` Task 承接实际行为变化
- `wrap-up-iteration` 触发的 revision 完成后，收尾 Task 从 revision Git snapshot 恢复 deviation reconciliation

所有下游 handoff 基于 Git snapshot，不继承完整 revision conversation。
