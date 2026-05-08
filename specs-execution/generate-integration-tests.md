# exec: generate-integration-tests

> CC 加载本文时，当前任务是在所有 sprint develop 任务合并后，设计端到端测试场景，写自动化脚本，跑测试，失败转修复任务，直到三条件满足后进入 manual-test。

**上下文密度**：高。需读 PRD + TRD + standards，并执行测试脚本。

---

## 步骤追踪协议

每步完成后输出：
```
✅ [步骤名] 完成：[2–3 句结论]
→ 下一步：[步骤名] — [一句说明]
继续？
```
🚫 标记处必须等用户明确回应后才继续。

---

## 会话启动

确认前置：读 `iterations/vN/sprint.md`，检查所有 `source=sprint` 的 develop 任务状态全部为 [merged]。

有未合并任务 → 阻断：
```
以下 develop 任务尚未 [merged]，无法开始联调测试：
- {task-id}：{标题}
请完成后重新开始。
```

前置满足 → 精确读取：
- `iterations/vN/prd.md`（acceptance criteria 段落）
- `iterations/vN/trd.md`（接口定义段落）
- `iterations/vN/standards-shared.md`（测试环境约定段落）

---

## Step 1：核对测试环境

确认三项：
- 后端服务可达（curl 健康检查端点）
- 数据库指向测试库（非生产库）
- 前端页面可打开

环境不就绪 → 阻断，等就绪后继续。

```
✅ 测试环境确认：后端 {地址} 可达，数据库为测试库，前端可访问。
→ 下一步：设计测试场景
继续？
```

---

## Step 2：设计测试场景

从 PRD acceptance criteria 提取端到端场景，补充跨模块集成点，整理为 **≤15 条**测试清单：

```markdown
## 测试场景清单 · vN · {日期}

| # | 场景 | 类型 | 覆盖 AC |
|---|------|------|---------|
| 1 | {场景描述} | 后端接口 / 前端交互 | AC-{N} |
...
```

**超过 15 条时**：优先保留主流程 + 跨模块集成点；边界场景降级为 `[不阻断]` 记入 backlog。

🚫 输出清单后等用户确认再继续

---

## Step 3：写测试脚本

**后端接口**：写 `.http` 文件或 `curl` 脚本，覆盖正常路径 + 关键边界（鉴权失败 / 非法参数 / 空值）。
- 路径：`integration-tests/backend/{场景名}.http`

**前端交互**：用 pinchtab 脚本模拟用户操作流程。
- 路径：`integration-tests/frontend/{场景名}.pinchtab`

**无前端（纯后端 API）**：跳过 pinchtab，仅写 `.http` / curl 脚本。

---

## Step 4：跑测试

逐条执行测试脚本，记录结果：

```markdown
# 联调测试结果 · vN · {日期}

| # | 场景 | 结果 | 现象（失败时填写） | 级别 |
|---|------|------|-----------------|------|
| 1 | {场景描述} | ✅ | — | — |
| 2 | {场景描述} | ❌ | {具体现象} | [阻断] |
```

写入 `integration-tests/result-{日期}.md`。

---

## Step 5：处理失败

逐条处理 ❌ 条目：

**`[阻断]`**（影响主流程）：
1. 立即创建 develop 任务包（`source=integration`，urgency 按影响程度），写入 `queue/{task-id}.md`
2. 等 develop [merged] 后，重跑受影响的测试脚本

**`[不阻断]`**（边界或视觉问题）：
- 写入 `backlog.md`，标注级别和描述，不派修复任务

```
✅ 测试结果处理完成：{N} 个 [阻断] 已派修复任务，{M} 个 [不阻断] 已记入 backlog。
→ 下一步：等待修复后复测 / 确认三条件进入 manual-test
继续？
```

---

## Step 6：复测 + 三条件确认

develop(source=integration) 全部 [merged] 后，重跑**所有**测试脚本（不只跑修复相关场景）。

**三条件检查**：
- [ ] 所有 ≤15 条测试场景均有明确结论（无"未测"条目）
- [ ] 主流程无 `[阻断]` 失败（或已全部修复复测通过）
- [ ] `[不阻断]` 问题已记入 backlog 且已分级

三条件全满足：
```
✅ generate-integration-tests 完成：三条件全部满足，可进入 manual-test。
→ 下一步：manual-test（人工验收）
```

---

## Subagent 使用

| 触发点 | Subagent 任务 | 失败处理 |
|--------|-------------|---------|
| Step 3 写 pinchtab 脚本 | 用 pinchtab skill 生成前端测试脚本 | 失败则改为 manual-test 中人工验收该场景 |
| Step 4 跑后端接口测试 | general-purpose 执行 curl 脚本并汇总结果 | 失败则主线直接执行 |

---

## 上下文管理

**中断续做**：
1. 读 `integration-tests/result-{最新日期}.md` 确认已跑哪些场景
2. 读 `queue/` 找 source=integration 任务包，确认修复状态
3. 从第一个未有结论的场景继续，或等修复 [merged] 后复测
