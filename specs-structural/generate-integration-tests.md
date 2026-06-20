# task: generate-integration-tests

**discipline**: `integration-testing`
**Gate**: —
**属性**: 无

> 所有 sprint 开发完成后，设计端到端测试场景，写自动化脚本跑测试，失败转修复任务。

---

## 前置条件

- **触发**：本期所有 `source=sprint` 的 develop 任务全部 [merged]（sprint.md 全行状态为已合并）
- **文件**：
  - `iterations/vN/trd.md`（接口定义）
  - `iterations/vN/prd.md`（acceptance criteria，测试场景来源）
  - 项目根 `standards-shared.md`（测试环境约定段落）

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
| 测试脚本（前端） | `integration-tests/frontend/{场景名}.pinchtab` | pinchtab 脚本 |
| 测试结果记录 | `integration-tests/result-{日期}.md` | 见下方格式 |
| 修复任务包（[阻断] 失败时） | `iterations/vN/queue/{task-id}.md` | 见 develop.md §字段规范 |
| backlog.md 条目（[不阻断] 失败时） | `backlog.md` | `- [ ] {日期} \| [不阻断] {描述} \| 联调发现` |
| 进度断点（compact 时写入） | `_meta/sessions/generate-integration-tests-progress.md` | 场景清单 + 已跑场景结论 + 已派修复 task-id |
| feedback.md 条目（发现共性问题时） | `feedback.md` | `{日期} \| {发现} \| 建议更新到 {standards/trd 哪节}` |

**测试结果记录格式：**

```markdown
# 联调测试结果 · vN · {日期}

| # | 场景 | 结果 | 现象（失败时填写） | 级别 |
|---|------|------|-----------------|------|
| 1 | {场景描述} | ✅ | — | — |
| 2 | {场景描述} | ❌ | {具体现象} | [阻断] |
```

---

## 完成判据

满足以下三条才可进入 `manual-test`：

- [ ] 所有测试场景均有明确结论（无"未测"条目）；前端 pinchtab 场景已控制在 ≤15 条
- [ ] 主流程无 `[阻断]` 失败（或已全部通过 develop(source=integration) 修复并复测）
- [ ] `[不阻断]` 问题已记入 backlog，已分级

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
