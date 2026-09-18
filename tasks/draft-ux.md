---
schema: hact-task/vnext
task: draft-ux
class: A
discipline: product
gate: null
preferred_runtime: any
required_capabilities:
  - repository-read
  - semantic-reasoning
  - artifact-authoring
  - browser-execution
  - isolated-review
  - persistence
review: required
---

# draft-ux

## 1. Purpose & Scope

### Purpose

从已批准的 Product Contract 出发，以“用户真正要完成什么任务”为第一组织单位，形成跨页面 / 跨功能的完整用户动线、可操作原型与可复核证据，并由独立审查和用户真实体验接受共同完成 UX 收敛。

`draft-ux` 不新增独立 UX Gate。它在 PRD 标记需要 UX 时，是 `draft-tech-design` 的硬前置。

### In scope

- 识别核心用户任务并分配稳定 U-id / S-id
- 设计主路径、失败、取消、返回、未保存离开与恢复行为
- 在原型前完成“动线—界面地图”
- 生成连贯的可交互原型
- 建立 PRD AC → 用户任务 / 场景 / 原型锚点 / 页面规格映射
- 通过浏览器真实执行关键用户任务并持久化 evidence
- 进行 Fresh Isolated Context 的 Independent Review
- 让用户按真实任务体验当前原型并给出接受 / 修改反馈
- 把已接受的页面 / 交互规格更新到 `design.md`

### Out of scope

- 按 PRD 功能机械地“一功能一页面”
- 把开发任务包当作用户任务
- 在 UX 文件中偷偷新增 PRD 没有的业务承诺
- 用静态 DOM / onclick 存在替代真实浏览器走通
- 代表用户判断“体验已经可以”
- 新增独立 UX Gate
- 实现真实后端或产生真实外部副作用

## 2. Preconditions

进入 `可取` 前必须满足：

- 当前迭代 PRD 已进入 Accepted Project Truth。
- G1 已 approved，并绑定明确 Product Contract snapshot。
- PRD 中至少一个功能标记 `draft-ux: 需要`，或已有 Accepted Truth 明确要求进行 UX 设计。
- 当前 HACT Method fixed SHA 已知。
- Owner 具备生成正式 artifact 的能力。

要进入 `merged`，还必须具备可真实执行原型的 browser capability；若当前 Runtime 缺少该能力，Task 保持非终态并按 Runtime Adapter 做能力交接，不能伪造浏览器 evidence。

纯后端、无用户可见交互且 PRD 全部标记 `draft-ux: 不需要` 时，不创建本 Task。

## 3. Authoritative Inputs

### Required

- 当前 HACT Method fixed SHA
- G1 approved 的 `iterations/vN/prd.md`
- 当前 `status.yml`
- 项目根 `design.md`（若已存在则作为全局视觉基线）
- 项目根 `decisions.md`
- 适用的 Shared Protocol

### Conditional

- 现有 `iterations/vN/ux-flows.md`
- 现有 `iterations/vN/prototype.html`
- 现有 `iterations/vN/prototype-map.md`
- 现有 `iterations/vN/ux-evidence/`
- 已有页面 / design 规格
- 用户明确选择外部设计会话时的 `design-brief.md`

### User input

用户输入只用于：

- 真正影响业务规则、主入口、完成落点或关键上下文的 UX 取舍
- 审美 / 体验方向需要用户选择的部分
- 最终真实体验接受

已有 Accepted 决定不重复访谈。

上一 Runtime 的聊天总结不是权威输入；“用户已经接受”只能由可定位的真实用户回应与对应版本证明。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| UX flows | `iterations/vN/ux-flows.md` | 按用户任务组织 U-id / S-id + 动线—界面地图 + 必要流程图 |
| Interactive prototype | `iterations/vN/prototype.html` | 自包含、连贯状态、无真实生产副作用 |
| Prototype map | `iterations/vN/prototype-map.md` | AC coverage / exclusions、U/S 映射、evidence 索引、review 与用户接受记录 |
| UX evidence | `iterations/vN/ux-evidence/` | 浏览器动作、前置数据、结果、版本 / hash 与失败原因 |
| Confirmed design | `design.md` | 更新本期实际页面和已接受的视觉 / 状态规格 |

### State updates

- 当前 `draft-ux` Task：`可取 → taken-by → done → merged`
- 不创建新的 UX Gate，不写 G1/G2 approval

### Conditional outputs

| Artifact | Path | Condition |
|---|---|---|
| External design brief | `iterations/vN/design-brief.md` 或项目当前约定位置 | 仅用户明确选择外部设计会话时 |

聊天中的线框、未落盘 HTML、未执行截图或“看起来能走”的静态判断都不是正式 Output。

## 5. Decision Rules & Boundaries

### 5.1 User-task-first

先回答：

- 谁在什么情境下使用系统
- 他真正想得到什么业务结果
- 从哪里开始
- 已知道什么 / 还需要什么信息
- 要做什么判断
- 怎样知道任务完成

用用户语言定义 `U1 / U2 ...`，例如“确认这批材料能否提交”，而不是“管理列表”“编辑详情”。

用户任务可以跨多个 PRD 功能和多个界面；页面也可以承接多个任务。

### 5.2 稳定 U-id / S-id

- U-id 表示用户任务
- S-id 表示该任务下有业务意义的场景 / 分支
- 已发布的 U/S id 不因为改标题而重排
- 不穷举所有点击排列；覆盖不同业务决策、终态与恢复行为

这些 ID 是下游 TRD、Task Package、integration / manual-test 的稳定锚点。

### 5.3 动线先于页面

在生成原型前必须先形成 `ux-flows.md` 的动线—界面地图，至少表达：

- 位置 ID
- 形态 / 名称
- 承接 U/S
- 打开来源
- 完成 / 返回位置

页面、弹层、抽屉、内联区域的归属按任务动线决定，不从 PRD 功能表反推页面清单。

关键检查包括：

- 主入口是否表达用户动作与对象
- 主任务完成后落到哪里
- 新建 / 补充、首次 / 再次等模式是否保持正确对象上下文
- 取消 / 返回 / 恢复是否回到合理位置
- 必需信息是否出现在用户做判断之前

### 5.4 UX 不得偷偷扩 Product Contract

如果 UX 设计必须决定以下用户可观察规则，而 PRD 没有依据：

- 对象何时创建
- 全失败是否保留空对象
- 部分成功如何保留 / 重试
- 是否自动选择子对象
- 取消后哪些数据保留
- 其他新的业务结果 / 权限 / 状态承诺

必须先走 `revise-doc(target=prd)`。

原型、ux-flows 或 design 不能成为绕过 PRD 的需求真相源。

### 5.5 Prototype 是行为模拟

原型必须：

- 多画面保持同一份模拟数据和状态
- 从真实入口走到任务结果
- 模拟必要失败、重试、返回和恢复
- 使用真实感但虚构的数据
- 不调用生产服务或制造真实外部副作用
- 不允许所有按钮只弹“成功”

页面与 PRD 功能不要求一一对应。

### 5.6 AC coverage 必须闭合

`prototype-map.md` 必须让每条 PRD AC **恰好**进入以下一侧：

1. 前端 / 用户可见覆盖：映射到 U-id、S-id、HTML anchor 与页面规格
2. 合理排除：明确为何该 AC 没有用户可见交互

不能用“后端负责”掩盖本应存在的用户任务或结果反馈。

### 5.7 Browser evidence 是硬证据

对核心 U/S 必须从真实入口在浏览器中执行。

Evidence 至少包含：

- 原型版本 / Git snapshot / 内容 hash
- 前置数据
- 实际动作
- 可观察结果
- pass / fail / 未运行
- 未运行原因

修改状态逻辑后，旧 evidence 不能自动继续有效。

静态 checker 只能证明结构和引用，不证明体验正确。

### 5.8 Independent Review 先于用户体验接受

Owner 自绿和浏览器 evidence 完成后，使用：

`Same Runtime + Fresh Isolated Context + Same Task Contract`

Reviewer 自己读取 PRD、ux-flows、prototype、prototype-map、design 和 evidence，不能继承设计叙事。

Review 先解决技术死路、任务遗漏和契约回写问题，再把已过 AI 质量关的版本交用户体验。

### 5.9 用户真实体验接受不可替代

用户验收按任务进行：

- 给情境
- 给真实入口
- 给预期业务结果

不要逐按钮教学掩盖可发现性问题。

用户评价：

- 是否符合真实工作
- 信息是否足够
- 路径是否顺手
- 完成反馈是否可信
- 恢复 / 失败是否符合预期

只有用户明确接受且对应版本未失效，才能满足本 Task 的 Human Authority 条件。

### 5.10 无独立 UX Gate

用户接受是本 Task 的 Human Authority，不创建 Gx。

后续 UX 改动若使接受版本失效，只重验受影响任务，不“撤销 G1”；若改变 Product Contract，则走新的 revision。

## 6. Verification

### Deterministic

必须能够机械证明：

- `ux-flows.md` 存在稳定 U-id / S-id
- 每个 S-id 至少落到一个界面位置
- 动线—界面地图中的 ID / 来源 / 返回位置可解析
- `prototype.html`、`prototype-map.md` 存在
- 每条 PRD AC 恰好在 coverage 或 exclusion 中出现
- prototype-map 引用的 U/S/id / 页面存在
- evidence 路径存在并可对应当前 prototype version
- 适用的 `check-ux.js` 结构检查通过

本迁移不修改 `check-ux.js`。

### Semantic

必须确认：

- 用户任务是真实业务结果，而不是功能名 / 页面名
- 主路径和高影响失败 / 取消 / 恢复分支可实际完成
- 信息顺序支持用户做决定
- 没有重复输入、无谓跳转或上下文丢失
- UX 没有越权新增业务承诺
- 浏览器 evidence 与当前原型一致
- design / flows / prototype / map 对同一版本事实一致

## 7. Review & Human Authority

### Independent Review

Required。

特殊 review focus 继承旧 `prototype-review` 的实质要求：

1. 用户任务是否成立、目标 / 起点 / 判断 / 完成反馈是否连贯
2. 主入口、主任务落点、返回位置和辅助分支归属是否正确
3. PRD AC 是否存在遗漏或错误排除
4. UX 是否越过 PRD 自行定义新业务规则
5. 浏览器中是否真实可达，而非只看静态节点
6. evidence 是否属于当前原型版本
7. review 不替用户决定审美或业务方向

Blocking finding 必须给出 U/S、复现动作、实际 / 预期和影响。

### Human Authority

用户负责：

- 会改变业务规则、主入口、完成落点或关键上下文的重要取舍
- 体验 / 审美方向中确实存在的用户选择
- **当前原型版本的真实体验接受**

更强模型、独立 reviewer、浏览器通过都不能替代最后一项。

## 8. Completion & Handoff

### `done`

满足：

- flows / prototype / map / design candidate 已形成
- 核心用户任务有当前版本浏览器 evidence
- 正式 Output 已持久化到明确 Shared Candidate snapshot

### `done → taken-by`

Independent Review、browser verification 或 AC 对账发现 blocking finding 时回 `taken-by`，修复后形成新 candidate。

### `merged`

满足：

- deterministic verification 通过
- Independent Review 无未关闭 blocking finding
- 用户已经明确接受当前 prototype / UX snapshot
- 任何会改变 Product Contract 的问题已通过 `revise-doc(target=prd)` 先行闭合
- 最终 artifact 已进入 Accepted Project Truth

本 Task `merged` 不产生新的 Gate approval。

### Downstream

`draft-ux merged` 后：

- `draft-tech-design` 可把 U-id / S-id、失败 / 恢复行为、界面地图和当前 accepted design 当作 Authoritative Input
- 下游接口 / 状态 / 数据设计必须承接完整用户任务，而不是重新拆回孤立功能
- integration / manual-test 可复用 U/S 作为真实系统验证锚点

下游从 Git 重新读取 Accepted Truth，不继承完整 conversation。
