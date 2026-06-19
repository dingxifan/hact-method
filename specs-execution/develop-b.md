# exec: develop-b（B 类壳：BUG / 优化）

> 任务 = `source=bug` 或 `source=optimization` 的 **B 类**任务包（由 `dispatch-new` 派出）。本壳定义 **intake + handoff（含就地分流）**；实现主体（Step 1–8）在 `develop-core.md`。B 类**无 Gate**（决策 #4），恒为**单任务会话**，无 sprint.md / 交付列 / 批量会话；反馈**就地分流**（B 类无 wrap-up，决策 #6–7）。

---

## 会话启动

**无 Gate 前置**——B 类不受 Gate 约束，直接拾取。

**拾取任务**：

任务包在 **`b-queue/{task-id}.md`**（B 类专属拉取池，区别于 A 类 `iterations/vN/queue/`）。读任务包全文，确认 `source ∈ {bug, optimization}`。
- `urgency=hotfix` 的紧急修复也走本壳（决策 #7：hotfix 不独立，是任务包 urgency 属性，归 BUG 会期）——core Step 2 路径 C 自动处理 hotfix 的最小化路径。
- 将任务包状态改为 `[taken-by: {user}]`；同步在项目根 `status.yml` 将该 task 的 `status` 改为 `taken-by`、`assigned_to` 填 `{user}`（机器侧契约，见 `../hact-method/skeleton/07-status-contract.md`）。立即执行认领 commit：
  ```bash
  git add b-queue/{task-id}.md status.yml
  git commit -m "chore(b-task): 认领 {task-id} [taken-by: {user}]"
  ```
  （push 随首次代码 commit 一起推送，无需单独 push）

→ 拾取完成后，加载 `develop-core.md`，从第零步（确认执行层）起执行至 Step 8。

**Step 8 落盘**：B 类任务**不在 sprint.md**，按 core Step 8 的通用部分落盘即可（任务包路径为 `b-queue/{task-id}.md` → `[done]` + status.yml + commit/push），无 sprint.md 增补。

---

### Step 9：移交

在 `b-tasks.md` 对应行追加 `PR#{N} 待审`。
→ 输出 `develop-core.md`「会话收尾声明」（✅ 完成 + 🚫 会话硬边界）结束会话。

---

### Step 10：就地分流（B 类专属，取代 A 类的 feedback.md 暂存）

B 类**无 wrap-up**，不能堆 `feedback.md` 干等。回顾本次实现，把值得沉淀的发现**当场誊入本人个人 notes**（`../hact-notes-{name}/notes.md`）：
- 编码规范 → `[规范]`
- 自检漏项 → `[checklist]`
- 流程 / 方法论问题 → `[方法论]`
- 项目架构决策 → 项目 `decisions.md`
- 无价值 → 不记

誊入后在 notes 仓 commit + push（**不碰 hact-method**）。

> B 类就地分流后，个人 notes 的可上提条目同样由管理者的 `harvest-notes` 收割上提，与 A 类殊途同归。
