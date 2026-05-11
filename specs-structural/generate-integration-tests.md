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
  - `iterations/vN/standards-shared.md`（测试环境约定段落）

---

## 字段规范

本 task 无特有属性字段。测试场景数量限制如下，聚焦本期新功能端到端路径和跨模块集成点，不测已有功能的回归（回归属于 B 类范畴）：

- 前端交互场景（pinchtab）：上限 **15 条**；超出时优先保留主流程 + 关键用户操作路径，边界场景降级为 `[不阻断]` 记入 backlog
- 后端 API 场景（`.http` / `curl`）：不设硬性上限，覆盖所有接口主流程 + 鉴权边界 + 错误码 + 跨模块集成点

---

## 工作内容

1. **核对测试环境**：读 `standards-shared.md` 的测试环境约定段落，确认后端可访问 / 前端可访问 / 数据库指向测试库；环境不就绪则阻断，等环境就绪后继续
1.5. **处理 CR [建议] 清单**：读 `backlog.md`，找出所有标记 `[CR-建议]` 的条目；改动 ≤5 行且原因显而易见的直接修复；较复杂的评估是否走 B 类快速通道，否则降级为普通 backlog 条目
2. **设计测试场景**：从 PRD acceptance criteria 提取端到端场景，补充跨模块集成点，按上方场景数量规则整理
3. **写测试脚本**：
   - 后端接口：写 `.http` 文件或 `curl` 脚本，覆盖正常路径 + 关键边界（鉴权失败 / 非法参数 / 空值等）
   - 前端交互：用 pinchtab 脚本模拟用户操作流程
4. **跑测试**：执行所有脚本；每条测试记录结果：✅ 通过 / ❌ 失败（含现象描述）
5. **处理失败**：
   - 失败条目分级：`[阻断]`（影响主流程）/ `[不阻断]`（边界或视觉问题）
   - `[阻断]` 失败 → 立即创建 develop 任务包（source=integration，urgency 按影响程度），写入 queue
   - `[不阻断]` 失败 → 记入 `backlog.md`
6. **复测**：develop(source=integration) 任务全部 [merged] 后，重跑受影响的测试脚本，确认通过
7. **三条件满足后进入 manual-test**：见"完成判据"

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

## 边界场景

| 场景 | 处理方式 |
|------|---------|
| 测试场景超过 15 条 | 优先保留主流程 + 跨模块集成点；边界场景降级为 `[不阻断]` 记入 backlog |
| 前端脚本无法覆盖某场景（pinchtab 限制） | 改为人工验收场景，标注在 manual-test 的任务包里，不强行用脚本覆盖 |
| 测试环境与生产环境有差异（数据/配置） | 在测试结果记录中注明环境差异，差异可能影响的场景标 `[环境差异，需 manual-test 核实]` |
| develop(source=integration) 修复后引入新失败 | 重跑全套脚本，不只跑修复相关场景 |
| 项目无前端（纯后端 API）| 跳过 pinchtab 脚本，仅写 `.http` / curl 脚本 |

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| 测试环境无法就绪（服务挂起 / 配置缺失） | 阻断，上报；记录阻断原因，等环境就绪后从步骤 1 重新开始 |
| `[阻断]` 失败反复出现（修复后仍失败） | 超过 2 轮仍失败，上报；判断是否根因在 TRD 设计，若是则创建 `revise-doc(target=trd)` |
| 测试脚本本身有 bug（误报失败） | 修正脚本，重跑；在测试结果记录中注明"脚本修正" |
| 所有场景通过但 PRD acceptance criteria 未被测试覆盖 | 补充测试场景（不超过 15 条上限），若超限则将未覆盖的 AC 移入 manual-test |
