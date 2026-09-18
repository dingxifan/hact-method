# HACT Tasks

HACT 以 **Task** 为工作的基本单位。

- Task Contract 定义某项工作的独有规则。
- Shared Protocol 定义跨 Task 的共同纪律。
- Runtime Adapter 定义当前工具如何实现这些规则。
- Task 不绑定具体模型、产品或厂商。
- 当前 Runtime 能可靠完成工作时优先 **Stay Local**，只有 capability / reasoning / isolation gap 才切换 Runtime。
- 正常跨 Task 交接基于 Git 中的 Accepted Project Truth，而不是上一 Runtime 的聊天历史。

## Core Task Catalog

### Project initialization
1. `init-project`

### Foundation / design / planning
2. `draft-foundation`
3. `draft-prd`
4. `draft-ux`
5. `draft-tech-design`
6. `plan-sprint`

### Change governance
7. `revise-doc`

### Implementation / verification
8. `develop`
9. `integration-verify`
10. `manual-test`

### Delivery / closeout
11. `deploy`
12. `wrap-up-iteration`

Core Task Catalog 固定为以上 12 个 Task。legacy task 名称若已被降级为 protocol / utility，不再重新加入 Catalog。

## B-class work

`dispatch-new` 不再作为独立 Core Task。

B 类工作采用：

`B Intake → develop(source=bug|optimization)`

B Intake 的规范性承载点：

`protocols/b-intake.md`

它负责真实调查、最小复现 / 问题界定、bug / optimization 分类、contract impact、scope、短 Development Intake 与实施授权。

只有 Intake 满足 `develop` 硬前置时，才创建 / 登记 develop work item 并进入 `可取`。

诊断授权不自动等于修改授权。

## Utilities

`harvest-notes` 不再属于 Core Task Catalog，作为 HACT utility 使用，不进入正常 Task state、Gate 或迭代生命周期。

规范性承载点：

`utilities/harvest-notes.md`

Utility 只在用户明确要求时处理获授权来源，不自动批准方法论变化。

## Runtime-only paths

不应再为 Runtime choreography 创建新的 Core Task。

例如用户明确要求外部 UX 设计会话时，使用：

`runtime/external-ux.md`

最终仍回到同一个 `draft-ux` Task Contract 做 browser evidence、Independent Review 与用户体验接受。

## Task Contract

每个 Core Task 的规范性真相只存在于：

`tasks/{task}.md`

Task Contract 只定义：
- Identity & Routing
- Purpose & Scope
- Authoritative Inputs
- Outputs
- Decision Rules & Boundaries
- Verification
- Review & Human Authority
- Completion & Handoff

跨 Task 共性规则引用 `protocols/`；Runtime-specific 操作进入 `runtime/`；非 Task 的可选能力进入 `utilities/`。
