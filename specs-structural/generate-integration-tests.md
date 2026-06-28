# task: generate-integration-tests

**discipline**: `integration-testing`
**Gate**: —
**属性**: 无

> 所有 sprint 开发完成后，默认跑后端 curl smoke test（轻量档）；smoke test 有结论后，用户按需加跑前端 pinchtab（完整档）。

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

本 task 无特有属性字段。测试场景数量限制如下，聚焦本期新功能端到端路径和跨模块集成点，不测已有功能的回归（回归属于 B 类范畴）：

- 前端交互场景（pinchtab）：上限 **15 条**；超出时优先保留主流程 + 关键用户操作路径，边界场景降级为 `[不阻断]` 记入 backlog
- 后端 API 场景（`.http` / `curl`）：不设硬性上限，覆盖所有接口主流程 + 鉴权边界 + 错误码 + 跨模块集成点

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 测试脚本（后端） | `integration-tests/backend/{场景名}.http` 或 `.sh` | HTTP 请求文件 / curl 脚本 |
| 测试脚本（前端）**（完整档，可选）** | `integration-tests/frontend/{场景名}.pinchtab` | pinchtab 脚本 |
| 测试结果记录 | `integration-tests/result-{日期}.md` | 见 `../hact-method-lab/templates/integration-result.md` |
| 修复任务包（[阻断] 失败时） | `iterations/vN/queue/{task-id}.md` | 见 develop.md §字段规范 |
| backlog.md 条目（[不阻断] 失败时） | `backlog.md` | `- [ ] {日期} \| [不阻断] {描述} \| 联调发现` |
| 进度断点（compact 时写入） | `_meta/sessions/generate-integration-tests-progress.md` | 场景清单 + 已跑场景结论 + 已派修复 task-id |
| feedback.md 条目（发现共性问题时） | `feedback.md` | `{日期} \| {发现} \| 建议更新到 {standards/trd 哪节}` |

---

## 完成判据

满足以下三条才可进入 `manual-test`：

- [ ] 所有已生成测试场景均有明确结论（无"未测"条目）
- [ ] 主流程无 `[阻断]` 失败（或已全部通过 develop(source=integration) 修复并复测）
- [ ] `[不阻断]` 问题已记入 backlog，已分级
- [ ] **（完整档）** 前端 pinchtab 场景已控制在 ≤15 条
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
