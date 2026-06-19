# exec: develop-sprint（sprint 主开发壳）

> 任务 = 从 **sprint.md 拾取** 的 `source=sprint` 任务包。本壳定义 **intake（G3 前置 + sprint.md 拾取 + 会话模式 + 批量会话）** 与 **handoff（Step 9 移交 + Step 10 feedback）**；实现主体（Step 1–8）在 `develop-core.md`。

**会话模式**（sprint 专属，由 sprint.md 的 `交付` 列决定）：

| 会话模式 | 触发条件 | 会话边界 | PR 粒度 |
|---------|---------|---------|---------|
| **单任务会话** | 拾取 `交付=独立` 的任务 | 一次会话 = 一个任务包 | 一个任务一个 PR |
| **批量会话** | 拾取同 layer 所有 `交付=批量` 的任务 | 一次会话 = 同 layer 全部批量任务 | 同 layer 所有批量任务共用一个 PR |

单任务会话：会话启动后按 `develop-core.md` Step 1–8 执行，再回本壳 Step 9–10。
批量会话：Step 1–4 对每个任务依次执行（按依赖顺序），Step 5–9 见文末「批量会话步骤」。

---

## 会话启动

**G3 前置检查（必做）**

读 `iterations/vN/gates.md`，确认 G3 已签。未签则阻断：「⚠️ G3 未通过，Sprint 尚未规划，请先完成 plan-sprint。」

**拾取任务**：

读 `iterations/vN/sprint.md`，找当前 layer 且状态为 `[可取]` 的任务，按以下顺序决定会话模式：

**第一优先：处理 `交付=独立` 的任务**

若存在 `[可取]` 且 `交付=独立` 的任务 → 拾取 task-id 最小的那个，进入**单任务会话**。
- 将该任务包状态改为 `[taken-by: {user}]`；同步在项目根 `status.yml` 将该 task 的 `status` 改为 `taken-by`、`assigned_to` 填 `{user}`（机器侧契约，见 `../hact-method/skeleton/07-status-contract.md`）。立即执行认领 commit：
  ```bash
  git add iterations/vN/sprint.md status.yml
  git commit -m "chore(sprint): 认领 {task-id} [taken-by: {user}]"
  ```
  （push 随首次代码 commit 一起推送，无需单独 push）
- 按 `develop-core.md` Step 1–8 执行，最终推独立 PR
- ⚠️ 该 PR 合并到 master 之前，sprint.md 中 `依赖` 列引用该任务的所有 `批量` 任务均不可拾取

**第二优先：批量会话（所有 `独立` 任务已 `[merged]` 或本 layer 无 `独立` 任务）**

若本 layer 无 `[可取]` 的 `独立` 任务 → 拾取本 layer 全部 `[可取]` 且 `交付=批量` 的任务，进入**批量会话**。
- 将所有拾取任务的状态改为 `[taken-by: {user}]`；同步在项目根 `status.yml` 把每个拾取 task 的 `status` 改为 `taken-by`、`assigned_to` 填 `{user}`。立即执行认领 commit：
  ```bash
  git add iterations/vN/sprint.md status.yml
  git commit -m "chore(sprint): 认领 {task-id-list} [taken-by: {user}]"
  ```
  （push 随首次代码 commit 一起推送，无需单独 push）
- `develop-core.md` Step 1–4 对每个任务依次执行（按依赖顺序：被依赖的任务先实现）
- Step 5–9 执行「批量会话步骤」（见文末），一次自检、一个 PR 覆盖所有任务

**阻断情形**：本 layer 有 `交付=独立` 任务且状态为 `[done]`（PR 已推但未合并），同时有 `批量` 任务依赖该 `独立` 任务 → 停止，输出：「⚠️ {task-id}（独立）PR 尚未合并，依赖它的批量任务暂不可拾取，请先完成 pr-review 合并。」

→ 拾取完成后，加载 `develop-core.md`，从第零步（确认执行层）起执行至 Step 8。

**Step 8 增补（sprint 专属）**：core 的 Step 8 通用落盘外，本壳任务在 `iterations/vN/sprint.md` 有对应行——须额外：状态列改 `[done]`、**PR 列填入 `#N`**；commit 的 `git add` 须含 `iterations/vN/sprint.md`：
```bash
git add iterations/vN/queue/{task-id}.md iterations/vN/sprint.md status.yml
git commit -m "chore(sprint): {task-id} 标记 [done]，PR #{N}"
git push origin {task-id}
```

---

### Step 9：移交

`source=sprint` → 无移交动作（PR 号已在 Step 8 写入 sprint.md）；同层全部推完后 devmgr 可开启批量 pr-review。
→ 输出 `develop-core.md`「会话收尾声明」（✅ 完成 + 🚫 会话硬边界）结束会话。

---

### Step 10：feedback 检查

回顾本次实现，识别值得沉淀的发现：
- 遇到 standards 未覆盖的决策（视觉/接口边界等）且反复出现
- 上下文重置协议被触发（记录触发原因，供后续调整任务拆分粒度参考）
- 无发现 → 跳过

有发现 → 写入 `feedback.md`（格式：`{日期} | {发现} | 建议在 {standards-frontend/backend/shared} 哪节补充`），由本迭代 `wrap-up-iteration` 第二步统一分流。

---

## 批量会话步骤（交付=批量 时使用，替代单任务的 Step 5–9）

> 前提：所有 `交付=独立` 的任务已 `[merged]`，当前 layer 的全部 `[可取]` 批量任务已拾取。

批量会话的 Step 5–9 与单任务（`develop-core.md`）**逻辑一致，只是一次覆盖本 layer 全部批量任务、共用一个 PR**。差异如下，其余照 core 执行：

| 步骤 | 与单任务的差异 |
|------|---------------|
| 批量 Step 5 自检 | 机械验证 / 测试（全绿）/ 测试品类自检 / 偏离核查各跑**一次**，覆盖本次所有改动文件与所有任务包的不可视区 AC 测试；偏离对比所有任务包 `files` 字段的合集 |
| 批量 Step 6 commit | 分支名 `{layer}-batch-v{N}`（如 `backend-batch-v3`）；message：`feat({layer}-batch-v{N}): {layer}层批量实现 [{task-id-1}, {task-id-2}, ...]` |
| 批量 Step 7 推 PR | `git push origin {layer}-batch-v{N}`；PR description **按任务分节**（模板见下），偏离 / 遗留问题各任务分别列出或统一写"无"；同样禁止凭据 |
| 批量 Step 8 状态落盘 | 所有批量任务包 + sprint.md 对应行 → `[done]`，PR 列**全部填同一个 PR 号**；同步在项目根 `status.yml` 把这批 task 的 `status` 全改 `done`、`pr` 全填同一个 `{N}`；git add 含 `status.yml`；`chore(sprint): 批量标记 [done]，PR #{N}` 推 `{layer}-batch-v{N}` |
| 批量 Step 9 移交 | `✅ develop 批量完成：{layer}层 {N} 个任务已 commit，PR #{N} 已推，等待 pr-review。本会话到此结束。` 同样 🚫 会话硬边界，输出后立即停止 |

**批量 PR description 模板**（批量 Step 7）：

```markdown
## v{N} {layer}层批量实现

包含任务：{task-id-1} / {task-id-2} / {task-id-3}

---

### {task-id-1}：{任务标题}
**改动摘要**：{2–3 句}
**AC 验证**：
- [x] {AC 1}：{验证方式}

### {task-id-2}：{任务标题}
**改动摘要**：{2–3 句}
**AC 验证**：
- [x] {AC 1}：{验证方式}

---

### 偏离说明
{各任务分别列出，或统一写"无"}

### 遗留问题
{各任务分别列出，或统一写"无"；有则确认已记入 backlog}
```

批量会话的 Step 10 feedback 检查同单任务（见上）。
