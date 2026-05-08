# exec: dispatch-new

> CC 加载本文时，当前任务是处理一条 B 类入口：收到 bug 报告或优化需求，判断类型，写任务包入 queue，记入 b-tasks.md。
> 本 task 是轻量派发任务，通常在 10 分钟内完成。

**上下文密度**：低。不加载代码，只读 trd.md（判断是否涉及接口 schema 变更）和 b-tasks.md。

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

读任务包，确认 `target-source` 字段：`bug` 或 `optimization`。

---

## Step 1：B 类判定

确认需求**不**涉及以下任一情况：
- [ ] 新用户场景（PRD 中没有覆盖的功能）
- [ ] 接口 schema 变更（新增 / 删除 / 修改 API 字段）
- [ ] 跨多模块重构
- [ ] 需要产品决策

**全部不涉及** → 继续 Step 2。

**涉及任意一条** → 升级 A 类，终止本 task：
```
本需求涉及 {原因}，属于 A 类，需走 draft-prd-vN 流程。
本 dispatch-new task 终止。
```

---

## Step 2：收集信息

**`target-source=bug`**：
```
请提供：
1. 现象描述（看到了什么）
2. 复现步骤
3. 已尝试的解决方案（如有）
4. 最可能的修复方向（如有判断）
```

**`target-source=optimization`**：
```
请提供：
1. 改进目标（想达到什么效果）
2. 基线指标（当前是什么状态，如有）
3. 验收标准（怎么算做成了）
```

🚫 等用户提供信息

**复现步骤不明确时**：追问，不写复现不明的任务包。

---

## Step 3：判断 urgency

| 条件 | urgency |
|------|---------|
| 影响核心功能且无法绕过 | `hotfix` |
| 其余 | `normal` |

---

## Step 4：写任务包

按 `specs-structural/develop.md §字段规范` 写完整任务包，写入 `queue/{task-id}.md`，状态 `[可取]`。

关键字段确认：
- `source`：与 `target-source` 一致（`bug` 或 `optimization`）
- `urgency`：Step 3 判断结果
- `acceptance-criteria`：`bug` → 现象消失 + 复现步骤无法复现；`optimization` → 用户提供的验收标准

---

## Step 5：记入 b-tasks.md

在 `b-tasks.md` 追加一行：

```markdown
| {task-id} | {target-source} | {urgency} | {任务标题} | [可取] | {YYYY-MM-DD} |
```

---

## Step 6：通知

```
✅ dispatch-new 完成：{task-id}（{target-source}/{urgency}）已写入 queue，等待 develop 拾取。
```

**`urgency=hotfix` 时**：立即通知相关 develop 执行人优先拾取，不等积累。

---

## 上下文管理

本 task 无需断点续做——任务包写入 queue 后即完成，状态持久化在文件中。
如需检查已派发状态，读 `b-tasks.md` 和 `queue/` 目录即可。
