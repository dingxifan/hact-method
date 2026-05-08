# exec: plan-sprint

> CC 加载本文时，当前任务是读 TRD 拆任务、写任务包入 queue、输出 sprint.md，签 G3。
> 三层顺序：**骨架**（任务清单对齐）→ **结构层**（完整任务包）→ **收尾**（sprint.md + G3）

**上下文密度**：高。需读多份文件，写多份任务包。骨架确认前不开始写任务包。

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

**前置检查：G2 是否已签**

读 `iterations/vN/gates.md`：
- G2 未签 → 阻断：「⚠️ G2 未通过，TRD 尚未确认，请先完成 draft-tech-design 再启动 Sprint 规划。」
- G2 已签 → 继续

**必读文件**（Explore subagent 并行读取）：
- `iterations/vN/trd.md`
- `iterations/vN/standards-shared.md`
- `iterations/vN/standards-frontend.md`
- `iterations/vN/standards-backend.md`
- `reusables.md`
- `decisions.md`

开场说：「我将分三层完成 sprint 规划：先输出疑点清单和任务骨架等你确认，确认后再写完整任务包。骨架确认前不开始写任务包。」

---

## 第一层：骨架（任务清单对齐）

### Step 1：疑点清单

读完 TRD 后列出实现边界不清晰的点（格式同 draft-tech-design Step 1）。

无疑点时明确说"已通读，无疑点"。

🚫 等用户逐条确认疑点

---

### Step 2：输出任务骨架

疑点确认后，输出任务骨架——**每个任务只写一行**，不写详细字段：

```markdown
## Sprint 骨架 · v{N} · {项目名}

| task-id | 标题 | layer | 依赖 |
|---------|------|-------|------|
| {name}-v{N}-001 | {一句话描述} | frontend | — |
| {name}-v{N}-002 | {一句话描述} | backend | — |
| {name}-v{N}-003 | {一句话描述} | frontend | {name}-v{N}-001 |
```

任务 ID 命名规则：`{项目缩写}-v{N}-{三位序号}`，如 `auth-v1-001`。

🚫 等用户确认任务拆分合理性（粒度 / 依赖关系 / 有无遗漏）

---

## 第二层：结构层（完整任务包）

### Step 3：逐个写任务包

骨架确认后，按 `specs-structural/develop.md §字段规范` 为每个任务写完整 14 字段任务包。

**字段完整性自检**（每包写完前对照 `specs-structural/develop.md §字段规范` 检查 14 字段，无空字段方可写入 queue）。

**任务包数量策略**：
- ≤ 4 个任务 → 主线逐个写
- > 4 个任务 → 启动并行 subagent（每个 subagent 负责 2–3 个任务包，见 Subagent 使用）

每个任务包写入 `queue/{task-id}.md`，状态 [可取]。

```
✅ 任务包写完：共 [N] 个，全部入 queue，字段自检通过。
→ 下一步：生成 sprint.md 汇总视图
继续？
```

---

## 第三层：收尾

### Step 4：写 sprint.md

汇总生成 sprint.md：

```markdown
# Sprint v{N} · {项目名}

| task-id | title | layer | 依赖 | 状态 |
|---------|-------|-------|------|------|
| {id} | {标题} | frontend | — | [可取] |
| {id} | {标题} | backend | — | [可取] |
| {id} | {标题} | frontend | {依赖 id} | [可取] |

## 依赖说明
- {task-id} blocked-by {task-id}：{原因一句话}
```

---

### Step 5：G3

```
✅ Sprint 规划完成：[N] 个任务包已入 queue，sprint.md 已生成，依赖关系已标注。
要签 G3 吗？
```

🚫 等用户确认

用户确认 → 写 `iterations/vN/gates.md`：
```markdown
- [x] G3：开发包就绪 — {YYYY-MM-DD}
```
执行 `git add . && git commit -m "feat(sprint): v{N} sprint 规划完成，G3 签署 [{项目名}]"`

**feedback 检查**（签 G3 后）：
- 疑点清单超过 3 条且根因集中（如 TRD 某类接口描述普遍不完整）→ 写入 `feedback.md`（格式：`{日期} | {发现} | 建议在 draft-tech-design 的疑点确认步骤中加强 {哪类场景}`）
- 任务拆分过程中发现 TRD 有多处遗漏，需要反复修订 → 写入 `feedback.md`
- 无发现 → 跳过

移交：「Sprint 已规划，开发者可开始从 queue 拾取任务，下一步 `develop`。」

---

## Subagent 使用

| 触发点 | Subagent 任务 | Subagent Prompt 要点 | 失败处理 |
|--------|-------------|---------------------|---------|
| 会话启动 | Explore 并行读 6 份输入文件 | — | 读取失败则主线单独读 |
| Step 3（任务 > 4 个） | 并行 subagent 各写 2–3 个任务包 | 传入：task 标题 / layer / TRD 对应模块 / standards 相关章节 / reusables 相关条目；输出完整 14 字段 YAML | 失败则主线接管该包 |

**重要**：subagent 只返回任务包内容，**由主线负责写入文件**，不让 subagent 直接操作文件系统。

---

## 上下文管理

- Step 2（任务骨架确认后）做一次 compact，再开始写任务包——骨架确认是探索讨论阶段的天然终点，任务包写作需要跨任务保持依赖关系和字段一致性
- compact 前在 `_meta/sessions/plan-sprint-progress.md` 记录：任务骨架表（task-id / 标题 / layer / 依赖）+ 疑点清单各条答案摘要

**断点续做**：
- 读 `queue/` 目录，统计已写任务包数量
- 读 `_meta/sessions/plan-sprint-progress.md` 获取任务骨架表，对照找出未写的任务
- 从未完成的任务包继续
