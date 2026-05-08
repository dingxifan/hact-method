# exec: develop

> CC 加载本文时，当前任务是从 queue 拾取一个任务包，实现代码，推 PR。
> 三层顺序：**骨架**（理解任务 + 拆分计划）→ **结构层**（逐模块实现）→ **执行层**（自检 + PR）

**上下文密度**：高。会话边界 = 任务边界，一次会话只做一个任务包。

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

**第零步：确认执行层**

```
当前执行层：frontend / backend？
```

🚫 等用户确认（或从任务包 layer 字段自动判断后向用户确认）

**拾取任务**：
1. 读 `queue/` 目录，找 [可取] 状态且 `layer` 匹配当前执行层的任务包
2. 确认 `user.disciplines` 包含对应 discipline（dev-frontend 或 dev-backend）
3. 将任务包状态改为 `[taken-by: {user}]`

**精确加载上下文**（不全量加载）：
- 读任务包全文（`queue/{task-id}.md`）
- 只读 `relevant-standards` 字段指向的具体章节，不读整份 standards 文件
- 只读 `reference` 字段列出的文件行号范围，不读全文

---

## 第一层：骨架（理解 + 计划）

### Step 1：理解任务

复述 `acceptance-criteria`：
```
我理解本次任务需要：
1. {AC 1}
2. {AC 2}
...
理解有误请纠正。
```

🚫 等用户确认理解正确

---

### Step 2：规模评估 + 拆分计划

按 `files` 字段改动范围评估：

**路径 A：≤ 3 个文件且逻辑简单**
```
✅ 规模评估：改动范围小（[N] 个文件），直接开始实现。
→ 下一步：复用检查
继续？
```

**路径 B：> 3 个文件或跨模块**
输出拆分计划：
```markdown
## 拆分计划

### 模块 1：{模块名}
- 涉及文件：{文件路径}
- 实现要点：{一句话}
- 预计改动行数：~{N} 行

### 模块 2：{模块名}
...

执行顺序：模块 1 → 模块 2 → 模块 3（理由：{依赖关系}）
```

🚫 等用户确认拆分计划

**路径 C：urgency=hotfix**
跳过评估，直接说「hotfix 模式：最小化修复路径，直接开始」，进入 Step 3。

---

### Step 3：复用检查

用 Explore subagent 读 `reusables.md`，标记与本任务相关的已有资产：

```
可复用资产：
- {资产名}（路径：{path}）→ 用于：{本任务哪个部分}
无可复用资产：{说明}
```

已有资产必须复用，不重新实现。

---

## 第二层：结构层（逐模块实现）

### Step 4：实现

按拆分计划逐模块实现，**每个模块完成后报告**：

```
✅ 模块 [{模块名}] 完成：改动了 {文件名} 的 {行范围}，实现了 {一句话}。
```

实现过程中：
- 遇到 `do-not` 约束边界 → 立即停止，报告，等用户指示
- 前端遇到 standards 未覆盖的视觉决策 → 暂停，输出 2–3 个选项，等用户确认

🚫 遇到以上两种情况时阻断，不自行绕过

**Subagent 实现策略**（>5 个文件或跨模块）：
- 主线协调，每个模块派独立 subagent 实现
- subagent 返回代码内容，主线负责写文件
- subagent 失败处理见"Subagent 使用"

---

## 第三层：执行层（自检 + 交付）

### Step 5：自检

**对照 checklist 逐项检查**（layer 决定用哪份）：

- `layer=backend` → backend-checklist：DB Schema 核对 / API 错误码覆盖 / 权限校验 / 并发安全 / 静默失败防御
- `layer=frontend` → responsive-checklist：断点适配 / 触控最小 44×44px / 事件兼容 / XSS 防护

每项标 ✅ 或 ❌（❌ 的必须修复后重新标）。

**冗余检查**：有重复实现或可以精简的部分 → 精简后再继续。

```
✅ 自检完成：checklist 全部通过，[无冗余 / 已精简 N 处]。
→ 下一步：commit + PR
继续？
```

---

### Step 6：commit

```bash
git add {改动的文件列表}
git commit -m "{type}({task-id}): {改动描述}"
```

---

### Step 7：推 PR

PR description 是本任务的唯一交付记录，需完整填写：

```markdown
## {task-id}：{任务标题}

### 改动摘要
{2–3 句话}

### Acceptance Criteria 验证
- [x] {AC 1}：{验证方式}
- [x] {AC 2}：{验证方式}

### 偏离说明
{无 / 有哪些改动超出了 files 清单，或哪条 AC 未能实现及原因}

### 遗留问题
{无 / 已记入 backlog 的问题列表}
```

禁止在 PR description 中包含凭据。

---

### Step 8：更新状态

- 将 `queue/{task-id}.md` 状态改为 [done]
- 更新 `sprint.md` 对应行

---

### Step 9：移交

```
✅ develop 完成：task-{id}（{layer}）已 commit，PR 已推。
→ 下一步：等待 code-review
```

---

## Subagent 使用

| 触发点 | Subagent 任务 | 失败处理 |
|--------|-------------|---------|
| Step 3 复用检查 | Explore 读 reusables.md | 失败则主线直接读 |
| Step 4 代码探索（reference 不足时）| Explore 扫描周边文件（返回 ≤20 行摘要）| 失败则主线读文件 |
| Step 4（> 5 文件跨模块）| general-purpose subagent 实现单个模块 | 见下方失败协议 |

**Subagent 失败协议**：
1. 同一问题同一 subagent 三次失败 → subagent 返回失败结构：
```yaml
status: failed
attempts: 3
last-error: "{错误描述}"
context-state:
  completed-files: [...]
  blocked-at: "{卡在哪里}"
  key-decisions: [...]
```
2. 主线带上 `context-state` 重新 spawn subagent（给更多上下文）
3. 再次失败 → 触发**上下文重置协议**

**上下文重置协议**（出现以下任一情况触发）：
- subagent 二次重 spawn 后仍失败
- 实际改动文件超出 `files` 清单 3 个以上
- 调试轮次 > 20 轮
- 用户临时追加新需求

重置流程：
1. 在 `_meta/sessions/develop-{task-id}-progress.md` 写 context-state 记录：
```yaml
context-state:
  task-id: {task-id}
  completed-files: [...]
  blocked-at: "{卡在哪里}"
  key-decisions: [...]
```
2. 将任务包回 [可取]，写阻塞原因
3. 告知用户：「遇到阻塞，任务已回到 [可取]，建议开新会话重新拾取」

---

## 前后端差异

| 维度 | dev-frontend | dev-backend |
|------|-------------|-------------|
| 额外加载 | `design.md`（涉及视觉时）| 无 |
| Checklist | responsive-checklist | backend-checklist |
| 视觉决策暂停 | 有（🚫） | 无 |
| Subagent 拆分粒度 | 按组件拆（每个组件一个 subagent） | 按模块拆（controller / service 分开）|

---

## 上下文管理

**断点续做**：
1. 读任务包，确认任务内容和 AC
2. 读 `git diff --stat` 确认已改动文件
3. 读 `progress.md` 的 context-state 记录（如有）了解上次停在哪里
4. 从断点继续，不重做已完成改动
