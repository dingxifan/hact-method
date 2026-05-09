# exec: dispatch-new

> CC 加载本文时，当前任务是处理一条 B 类入口：收到 bug 报告或优化需求，判断是否属于 B 类，写任务包入 queue，记入 b-tasks.md。
> 本 task 是轻量派发任务，通常 10 分钟内完成。

**上下文密度**：低。不加载代码，按需读 trd.md（判断是否涉及接口 schema 变更）。

---

## 红线

- **B 类判定有疑问时，倾向升级 A 类**：宁可多走流程，不遗漏产品决策
- **复现步骤不明确不写任务包**：先追问，无法复现的 bug 在任务包 `known-risks` 中标注，不写"复现步骤不明"的包
- **优化需求没有量化验收标准不写任务包**：先与用户确认可观测的成功指标，再写
- **`urgency=hotfix` 写完立即通知**：不等积累，立即告知相关 develop 执行人优先拾取

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

读任务包，确认 `target-source` 字段：`bug` 或 `optimization`。

---

## Step 1：B 类判定

满足以下**任意一条**即升级 A 类，终止本 task：

| 条件 | 说明 |
|------|------|
| 需要新增或修改接口路径 / 参数 | 涉及 TRD 接口 schema 变更 |
| 需要新增或修改数据库表结构或字段 | 涉及数据结构变更 |
| 影响两个及以上模块的核心逻辑 | 跨模块重构 |
| 需要产品决策（新用户场景 / 新功能边界） | 超出已有 PRD 范围 |

**升级 A 类时输出**：
```
此需求涉及 {接口变更 / 数据结构修改 / 跨模块核心逻辑 / 产品决策}，需走 A 类流程。
本 dispatch-new task 终止，请在项目仓开 draft-prd-vN 会话。
```

**全部不满足** → 继续 Step 2。

---

## Step 2：收集信息

**`target-source=bug`**：
```
请提供：
1. 现象描述（看到了什么 / 期望是什么）
2. 复现步骤（最小复现路径）
3. 已尝试的解决方案（如有）
4. 最可能的修复方向（如有判断）
```

**`target-source=optimization`**：
```
请提供：
1. 改进目标（想达到什么效果）
2. 当前状态（基线指标，如有）
3. 验收标准（怎么算做成了，需可观测 / 可验证）
```

🚫 等用户提供信息；信息不完整时继续追问，不提前进入下一步

---

## Step 3：判断 urgency

| 条件 | urgency |
|------|---------|
| 影响核心功能且用户无法绕过 | `hotfix` |
| 其余 | `normal` |

---

## Step 4：写任务包

按 `specs-structural/develop.md §字段规范` 写完整 12 字段任务包，写入 `iterations/vN/queue/{task-id}.md`（vN = 当前活跃迭代），状态 `[可取]`。

关键字段确认（写完对照检查）：

| 字段 | 要求 |
|------|------|
| `task-id` | `{项目缩写}-b-{三位序号}`，如 `hact-b-001` |
| `source` | 与 `target-source` 一致（`bug` 或 `optimization`） |
| `urgency` | Step 3 判断结果 |
| `acceptance-criteria` | bug → 现象消失 + 复现步骤无法复现；optimization → 用户提供的可观测验收标准 |
| `known-risks` | bug 复现步骤不明确时在此标注 |

**12 字段无空字段方可写入 queue**。

---

## Step 5：记入 b-tasks.md

在 `b-tasks.md` 追加一行：

```markdown
| {task-id} | {target-source} | {urgency} | {任务标题} | [可取] | {YYYY-MM-DD} |
```

---

## Step 6：移交

```
✅ dispatch-new 完成：{task-id}（{target-source} / {urgency}）已写入 queue，等待 develop 拾取。
```

**`urgency=hotfix` 时额外输出**：
```
⚠️ hotfix 任务，请立即通知相关 develop 执行人优先拾取 {task-id}。
```

---

## 上下文管理

本 task 无需断点续做——任务包写入 queue 后即完成，状态持久化在文件中。

**同一 bug 重复报告时**：先读 `b-tasks.md` 确认是否已有对应条目；有则在已有条目的任务包 `known-risks` 追加频次备注，不新建任务包。
