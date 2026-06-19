# exec: develop-repair（A 类派生修复壳：联调 / 人工验收）

> 任务 = `source=integration`（generate-integration-tests 联调失败派出）或 `source=manual-test`（manual-test 验收失败派出）的派生修复任务包。本壳定义 **intake + handoff**；实现主体（Step 1–8）在 `develop-core.md`。恒为**单任务会话**（一包一 PR），无 sprint.md / 交付列 / 批量会话。

---

## 会话启动

**无 Gate 前置**——派生修复不受 Gate 约束，直接拾取。

**拾取任务**：

任务包在 `iterations/vN/queue/{task-id}.md`（与 sprint 任务同目录，靠 `source` 字段区分）。读任务包全文，确认 `source ∈ {integration, manual-test}`。
- 将任务包状态改为 `[taken-by: {user}]`；同步在项目根 `status.yml` 将该 task 的 `status` 改为 `taken-by`、`assigned_to` 填 `{user}`（机器侧契约，见 `../hact-method/skeleton/07-status-contract.md`）。立即执行认领 commit：
  ```bash
  git add iterations/vN/queue/{task-id}.md status.yml
  git commit -m "chore(fix): 认领 {task-id} [taken-by: {user}]"
  ```
  （push 随首次代码 commit 一起推送，无需单独 push）

→ 拾取完成后，加载 `develop-core.md`，从第零步（确认执行层）起执行至 Step 8。

**Step 8 落盘**：本壳任务**不在 sprint.md**，按 core Step 8 的通用部分落盘即可（任务包 → `[done]` + status.yml + commit/push），无 sprint.md 增补。

---

### Step 9：移交

在 `_meta/sessions/{对应进度文件}` 记录"已推 PR#{N}，等待合并后复测"（`source=integration` → 联调进度文件；`source=manual-test` → 验收进度文件）。
→ 输出 `develop-core.md`「会话收尾声明」（✅ 完成 + 🚫 会话硬边界）结束会话。

---

### Step 10：feedback 检查

回顾本次实现，识别值得沉淀的发现：
- 遇到 standards 未覆盖的决策（视觉/接口边界等）且反复出现
- 上下文重置协议被触发（记录触发原因，供后续调整任务拆分粒度参考）
- 无发现 → 跳过

派生修复属 **A 类**，有发现 → 写入 `feedback.md`（格式：`{日期} | {发现} | 建议在 {standards-frontend/backend/shared} 哪节补充`），由本迭代 `wrap-up-iteration` 第二步统一分流。
