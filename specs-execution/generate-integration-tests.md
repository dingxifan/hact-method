# exec: generate-integration-tests

> CC 加载本文时，当前任务是在所有 sprint develop 任务合并后，设计端到端测试场景，写自动化脚本，跑测试，失败转修复任务，三条件满足后移交 manual-test。
> 三层顺序：**骨架**（场景设计）→ **结构层**（写脚本 + 跑测试 + 处理失败）→ **收尾**（复测 + 三条件确认）

**上下文密度**：高。需读 PRD + TRD + standards，并执行测试脚本。场景确认后做一次 compact 再进入脚本编写。

---

## 红线

- **跑测试前必须环境可达**：Step 4 执行脚本前确认后端 / 前端 / 数据库全部就绪；场景设计（Step 2）和写脚本（Step 3）不依赖环境，可提前进行
- **不测已有功能的回归**：只测本期新功能端到端路径和跨模块集成点，回归属于 B 类范畴
- **前端 pinchtab 场景上限 15 条**：超出时优先保留主流程 + 跨模块集成点，边界场景降级为 `[不阻断]` 记入 backlog；后端 `.http` / `curl` 场景不设硬性上限
- **[阻断] 失败必须走 develop 修复**：不在联调会话中直接改代码，不口头转达，走 dispatch

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

**前置检查**：读 `iterations/vN/sprint.md`，确认所有 `source=sprint` 的 develop 任务状态全部为 [merged]。

> `/pic` 在联调前建议执行，但**禁止 CC 自动触发**——流程上建议时只能提示人类，等人类明确发出 `/pic` 指令后方可调用 `Skill(pic)`。

有未合并任务 → 阻断：
```
以下 develop 任务尚未 [merged]，无法开始联调：
- {task-id}：{标题}（当前状态：{状态}）
请完成后重新开始。
```

**选项列表**（前置已满足，确认要做什么）：

```
{项目名} · 所有 sprint 任务已 [merged]

可做的任务：
[1] generate-integration-tests — 设计测试场景，跑联调脚本 ← 主线

其他可做（输入「展开」/ 自由描述）：
- revise-doc(target=trd) — 若发现 TRD 接口定义有歧义，先修再联调

请选 [1]，或输入「展开」，或直接说你要做什么。
```

🚫 等用户选择后再继续

用户选 [1] → 继续下方（Explore subagent 并行读取文件）
用户选其他 → 按用户描述判断，加载对应 exec spec 执行

前置满足 → 用 Explore subagent 并行读取（不占主线上下文）：
- `iterations/vN/prd.md`（acceptance criteria 段落）
- `iterations/vN/trd.md`（接口定义段落 + 测试环境约定段落）
- `iterations/vN/standards-shared.md`（测试环境约定段落）

---

## 第一层：骨架（场景设计）

### Step 1：核对测试环境

G3 签署时已确认环境可达，此处快速复核：
- [ ] 后端服务可达（curl 健康检查端点返回正常）
- [ ] 数据库指向测试库（非生产库）
- [ ] 前端页面可打开

**任一未就绪** → 提示用户重启对应服务，就绪后继续；不影响场景设计（Step 2）同步进行。

```
✅ 测试环境核对完成：后端 {地址}，数据库为测试库，前端 {地址} 可访问。
→ 下一步：设计测试场景
继续？
```

---

### Step 1.5：处理 CR [建议] 清单

读 `backlog.md`，找出所有标记 `[CR-建议]` 的条目：

- **无条目** → 跳过此步
- **有条目** → 逐条判断：
  - 改动 ≤5 行且原因显而易见 → 直接修复，commit，标记 `[x]`
  - 较复杂或影响范围不确定 → 保留在 backlog，移除 `[CR-建议]` 标记，改为普通 backlog 条目（留待下期处理）

```
✅ CR [建议] 处理完成：直接修复 {N} 条，降级为普通 backlog {M} 条。
→ 下一步：设计测试场景
继续？
```

---

### Step 2：设计测试场景

从 PRD acceptance criteria 提取端到端场景，补充跨模块集成点，分两类整理：

**后端 API 场景**（`.http` / `curl`，不设上限）：
- 覆盖所有接口主流程 + 鉴权边界 + 错误码 + 跨模块集成点
- 边界场景也纳入，不因数量多而删减

**前端交互场景**（`pinchtab`，上限 15 条）：
- 超出时优先保留主流程 + 关键用户操作路径，边界场景降级为 `[不阻断]` 记入 backlog

```markdown
## 测试场景清单 · vN · {日期}

### 后端 API 场景（共 {N} 条）
| # | 场景描述 | 覆盖 AC | 脚本形式 |
|---|---------|---------|---------|
| 1 | {接口路径 + 预期结果} | AC-{N} | .http / curl |
...

### 前端交互场景（共 {M} 条，≤15）
| # | 场景描述 | 覆盖 AC | 脚本形式 |
|---|---------|---------|---------|
| 1 | {用户操作流程描述} | AC-{N} | pinchtab |
...
```

- 无前端（纯后端 API）→ 跳过前端场景表，只写后端 API 场景

🚫 等用户确认场景清单（数量 / 优先级 / 遗漏 / 覆盖范围）

> **compact 时机**：场景清单确认后，Step 3 开始前，做一次 compact。compact 前将确认后的场景清单写入 `_meta/sessions/generate-integration-tests-progress.md`，以备续做。

---

## 第二层：结构层（写脚本 + 跑测试 + 处理失败）

### Step 3：写测试脚本

按清单逐条写脚本：

**后端脚本**（`.http` 文件或 `curl` 脚本）：
- 路径：`integration-tests/backend/{场景名}.http`
- 覆盖：正常路径 + 关键边界（鉴权失败 / 非法参数 / 空值 / 权限越界）

**前端脚本**（pinchtab）：
- 路径：`integration-tests/frontend/{场景名}.pinchtab`
- 用 pinchtab skill 生成，Subagent prompt 见"Subagent 使用"

**pinchtab 无法覆盖的前端场景**：改为人工验收场景，在场景清单备注「移至 manual-test」，不强行用脚本覆盖。

---

### Step 4：跑测试

逐条执行脚本，实时记录结果：

```markdown
# 联调测试结果 · vN · {日期}

| # | 场景描述 | 结果 | 现象（失败时填写） | 级别 |
|---|---------|------|-----------------|------|
| 1 | {场景描述} | ✅ | — | — |
| 2 | {场景描述} | ❌ | {具体现象 + 复现步骤} | [阻断] |
| 3 | {场景描述} | ❌ | {现象} | [不阻断] |
```

结果写入 `integration-tests/result-{日期}.md`。

---

### Step 5：处理失败

逐条处理 ❌ 条目：

**`[阻断]`**（影响主流程，必须修复）：

先判断是否满足**快速通道**条件（同时满足）：
- 无业务逻辑改动（允许：null 防护、缺失字段补全、类型修复、配置笔误、错误拦截格式、接口字段对齐；不允许：条件判断逻辑、数据处理算法、权限规则、接口行为）
- 原因显而易见，无需上下文讨论

满足 → 快速通道：

**1. 修改代码**

**2. 提交前自检**（有报错必须修复，不得跳过）
```bash
# 后端有改动时
cd backend && npm run build 2>&1 | tail -5
npx tsc --noEmit 2>&1 | head -10

# 前端有改动时
cd frontend && npm run build 2>&1 | tail -5
npx vue-tsc --noEmit 2>&1 | head -10
```
有编译 / 类型错误 → 修复后重新自检，通过后才进入下一步。

**3. 提交并合并**
```bash
git checkout -b fix/it-{desc}
git add {改动文件}
git commit -m "fix(it): {描述}"
git push origin fix/it-{desc}
git checkout master && git merge fix/it-{desc} && git push origin master
git branch -d fix/it-{desc}
```
在结果表对应条目备注「已直修」，继续复测。

不满足 → 写 develop 任务包（`source=integration`，urgency 按影响程度），写入 `queue/{task-id}.md`
  - task-id 命名：`{项目缩写}-it-{三位序号}`，如 `hact-it-001`
- 更新 `_meta/sessions/generate-integration-tests-progress.md`，记录已派修复的 task-id

**`[不阻断]`**（边界或视觉问题）：
- 写入 `backlog.md`，格式：`- [ ] {日期} | [不阻断] {描述} | 联调发现`
- 不派修复任务

**同一 `[阻断]` 修复后仍失败超过 2 轮** → 上报；判断根因是否在 TRD 设计，若是则创建 `revise-doc(target=trd)` 任务。

```
✅ 失败处理完成：[阻断] {N} 条已派修复，[不阻断] {M} 条已记入 backlog。
→ 下一步：等待修复合并后复测
继续？
```

**[阻断] 修复超 2 轮仍失败且已创建 revise-doc 任务时**：
- 暂停该场景的复测，在 `_meta/sessions/generate-integration-tests-progress.md` 标注「等待 revise-doc 完成」
- 继续其他可测场景的复测
- revise-doc 完成后，从暂停的场景重新开始 Step 4（跑测试）

---

## 第三层：收尾（复测 + 三条件确认）

### Step 6：复测

develop(source=integration) 全部 [merged] 后，重跑**所有**测试脚本（不只跑修复相关场景）。

更新 `integration-tests/result-{日期}.md`，在原条目后追加复测结论。

---

### Step 7：三条件确认

逐条核查：

- [ ] 所有 ≤15 条测试场景均有明确结论（无"未测"条目）
- [ ] 主流程无 `[阻断]` 失败（已修复且复测通过）
- [ ] `[不阻断]` 问题已记入 backlog 且已分级

三条件全满足：
```
✅ generate-integration-tests 完成：{N} 条场景全有结论，主流程无阻断，backlog 已分级。
→ 下一步：manual-test（人工验收）
```

未全满足 → 回到 Step 5 继续处理。

---

### Step 8：feedback 检查

回顾本次联调：
- 多个 `[阻断]` 根因相同（如同一接口错误码未覆盖）→ 写入 `feedback.md`（格式：`{日期} | {发现} | 建议更新到 {standards/trd 哪节}`）
- pinchtab 无法覆盖的场景比预期多 → 记录，供下次调整场景设计策略
- 无发现 → 跳过

---

## Subagent 使用

| 触发点 | Subagent 任务 | Prompt 要点 | 失败处理 |
|--------|-------------|------------|---------|
| 会话启动 | Explore 并行读取 3 份输入文件 | 读 prd/trd/standards-shared 各自的目标段落；返回各文件的目标段落摘要，每段不超过 150 字 | 失败则主线单独读 |
| Step 3（前端场景） | pinchtab skill 生成测试脚本 | 传入：测试环境前端地址 / 场景描述（谁 → 做什么 → 期望结果）/ 关键操作步骤；返回：完整可执行的 pinchtab 脚本文本，以及该脚本依赖的环境前提（需要登录态 / 需要特定初始数据等）。**CC 调用时必须使用 `Skill(pinchtab)`，禁止猜测命名空间（如 `superpowers:pinchtab`）。** | 失败则将该场景移至 manual-test，不重试 |
| Step 4（后端批量执行） | general-purpose subagent 执行 curl 脚本并汇总 | 传入：脚本列表和后端地址；返回：每条场景的结果（✅/❌）+ HTTP 状态码 + response body 关键字段摘要；部分场景失败时仍返回其他场景的结果，不中断 | 失败则主线逐条执行 |

---

## 上下文管理

**断点续做**：
1. 读 `_meta/sessions/generate-integration-tests-progress.md`：确认场景清单 + 已跑场景 + 已派修复 task-id
2. 读 `integration-tests/result-{最新日期}.md`：确认已有测试结论
3. 读 `queue/`：找 source=integration 任务包，确认修复状态
4. 从第一个无结论的场景继续，或等修复 [merged] 后复测

`_meta/sessions/generate-integration-tests-progress.md` 内容结构：
```markdown
## generate-integration-tests 进度 · vN

### 场景清单（{N} 条，用户已确认）
| # | 场景描述 | 脚本形式 |
|---|---------|---------|
| 1 | {场景} | .http |
...

### 修复任务
- {task-id}：{场景#N} {问题描述}（当前状态：[可取]/[merged]）
```
