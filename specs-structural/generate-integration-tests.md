# task: generate-integration-tests

**discipline**: `integration-testing`
**Gate**: —
**属性**: 无

> 所有 sprint 开发完成后，准备时核跨包组合，执行时跑后端穿透流 + 边界闸（轻量档）；前端完整档按执行规范的触发条件运行。

---

## 前置条件

- **触发**：本期所有 `source=sprint` 的 develop 任务全部 [merged]（sprint.md 全行状态为已合并）
- **文件**：
  - `iterations/vN/trd.md`（接口定义）
  - `iterations/vN/prd.md`（acceptance criteria，测试场景来源）
  - 本期 sprint/任务包的边界、依赖和退役声明，以及相关实现与既有验证证据
  - `iterations/vN/trd.md`（测试环境约定段落）
  - 项目根 `design.md`（完整档「〇、视觉冒烟锚点」段——视觉冒烟断言取数源）

---

## 字段规范

本 task 无特有属性字段。核本期改动及其触及的旧能力接缝，不重复未受影响的单包验证。组合准备核归属、共享定义与退役，执行验证真实路径；不把跑通视为静态问题都已解决。

- **后端穿透流**：数量 = **原则**（每个"不同终态 / 分支决策"一条、对这些穷举、之外零条；随真实终态数伸缩、不随输入种类；单管线通常 ~5-6 条）。每条驱动真实体从入口走到终态、禁 fixture 抄近路。
- **边界闸（真调冒烟，opt-in）**：桩点即边界，⚖️ 探测 + 🚫 真调；只在本期有外部边界时跑，无则跳过。
- 前端场景按 U/S 覆盖本期必要用户任务与失败/恢复路径，允许分批，不按数量自动降级

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 测试脚本（后端） | `integration-tests/backend/{场景名}.http` 或 `.sh` | HTTP 请求文件 / curl 脚本 |
| 场景定义（前端）**（用户任务或视觉基线变化时必跑）** | `integration-tests/frontend/vN-scenarios.md` | Codex的操作、预期与证据要求；具体执行器见Codex 项目入口 |
| 组合核对与测试结果 | `integration-tests/result-{日期}.md` | 见 `../hact-method-lab/templates/integration-result.md`；组合核对记录基线、证据与问题处置；已执行场景引用真实证据，未运行写原因 |
| 修复任务包（[阻断] 失败时） | `iterations/vN/queue/{task-id}.md` | 见 develop.md §字段规范 |
| backlog.md 条目（[不阻断] 失败时） | `backlog.md` | `- [ ] {日期} \| [不阻断] {描述} \| 联调发现` |
| 进度断点（compact 时写入） | `_meta/sessions/generate-integration-tests-progress.md` | 场景结论与修复/补缝 task-id；恢复核结果记录中的基线与问题，不重复有效验证 |
| feedback.md 条目（发现共性问题时） | `feedback.md` | `{日期} \| {发现} \| 建议更新到 {Foundation/TRD/检查入口}` |

---

## 完成判据

满足以下判据才可进入 `manual-test`：

- [ ] 所有穿透流均有明确结论（无"未测"条目）
- [ ] 组合核对已完成，必需能力及主流程无未解决阻断；修复/补缝任务已合并并通过相关复核，不能只凭已指定 owner 放行
- [ ] 边界清单每条有结论（真调通过 / 降级移交并记录），无"未定"边界
- [ ] `[不阻断]` 问题已记入 backlog，已分级
- [ ] **契约对账有有效证据**（全绿轮同样要）：复用准备核对，按实际运行补差异；必要契约缺口已解决或有明确用户裁决
- [ ] **（完整档）** 本期用户任务与必要分支已在真实系统验证，无未关闭阻断
- [ ] **（涉视觉基线迭代·完整档必跑）** 视觉冒烟断言（主色覆盖 / 视口无外溢 / 关键容器尺寸）全部通过，或失败已走 develop 修复并复测通过

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（source=sprint，全部 [merged]） | 代码已合并，测试环境可用 | sprint.md 全行 [merged] |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（source=integration） | 修复任务包 | `iterations/vN/queue/{task-id}.md` |
| `manual-test` | 组合核对与测试完成，无未解决阻断，可进入人工验收 | 现有联调结果记录 |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/generate-integration-tests.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
