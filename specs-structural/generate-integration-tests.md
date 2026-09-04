# task: generate-integration-tests

**discipline**: `integration-testing`
**Gate**: —
**属性**: 无

> 所有 sprint 开发完成后，默认跑后端穿透流 + 边界闸（轻量档）；有结论后，用户按需加跑前端浏览器场景（完整档）。

---

## 前置条件

- **触发**：本期所有 `source=sprint` 的 develop 任务全部 [merged]（sprint.md 全行状态为已合并）
- **文件**：
  - `iterations/vN/trd.md`（接口定义）
  - `iterations/vN/prd.md`（acceptance criteria，测试场景来源）
  - 项目根 `standards-shared.md`（测试环境约定段落）
  - 项目根 `design.md`（完整档「〇、视觉冒烟锚点」段——视觉冒烟断言取数源）

---

## 字段规范

本 task 无特有属性字段。只测本期新功能的接缝、不测已有功能回归（回归属 B 类）。GIT-API 只测两条缝（不按接口枚举场景——那是 per-task e2e 已覆盖的 safe middle）：

- **后端穿透流**：数量 = **原则**（每个"不同终态 / 分支决策"一条、对这些穷举、之外零条；随真实终态数伸缩、不随输入种类；单管线通常 ~5-6 条）。每条驱动真实体从入口走到终态、禁 fixture 抄近路。
- **边界闸（真调冒烟，opt-in）**：桩点即边界，⚖️ 探测 + 🚫 真调；只在本期有外部边界时跑，无则跳过。
- 前端交互场景（浏览器场景执行，**完整档**）：上限 **15 条**；超出时优先保留主流程 + 关键用户操作路径，边界场景降级为 `[不阻断]` 记入 backlog

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 测试脚本（后端） | `integration-tests/backend/{场景名}.http` 或 `.sh` | HTTP 请求文件 / curl 脚本 |
| 场景定义（前端）**（完整档，可选）** | `integration-tests/frontend/vN-scenarios.md` | 运行时中立的操作、预期与证据要求；具体执行器见运行时映射 |
| 测试结果记录 | `integration-tests/result-{日期}.md` | 见 `../hact-method-lab/templates/integration-result.md`；已执行场景须引用 `integration-tests/evidence/vN/{场景-id}/` 下真实文件，未运行须写原因 |
| 修复任务包（[阻断] 失败时） | `iterations/vN/queue/{task-id}.md` | 见 develop.md §字段规范 |
| backlog.md 条目（[不阻断] 失败时） | `backlog.md` | `- [ ] {日期} \| [不阻断] {描述} \| 联调发现` |
| 进度断点（compact 时写入） | `_meta/sessions/generate-integration-tests-progress.md` | 场景清单 + 已跑场景结论 + 已派修复 task-id |
| feedback.md 条目（发现共性问题时） | `feedback.md` | `{日期} \| {发现} \| 建议更新到 {standards/trd 哪节}` |

---

## 完成判据

满足以下三条才可进入 `manual-test`：

- [ ] 所有穿透流均有明确结论（无"未测"条目）
- [ ] 主流程无 `[阻断]` 失败（或已经 develop(source=integration) 修复 / revise-doc(target=trd) 对齐 并复测通过）
- [ ] 边界清单每条有结论（真调通过 / 降级移交并记录），无"未定"边界
- [ ] `[不阻断]` 问题已记入 backlog，已分级
- [ ] **契约对账已做**（全绿轮同样要）：流经过的接口形状 / 退出码 / 错误码 / 响应体字段已逐处对照 TRD，结论为"逐处一致"或"N 处不一致已记 backlog 待 `revise-doc(target=trd)`"
- [ ] **（完整档）** 前端浏览器场景已控制在 ≤15 条
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
| `manual-test` | 三条件全部满足，可进入人工验收 | 测试结果记录 |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/generate-integration-tests.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
