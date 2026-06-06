# exec: develop

> CC 加载本文时，当前任务是从 queue 拾取任务包，实现代码，推 PR。
> 三层顺序：**骨架**（理解任务 + 拆分计划）→ **结构层**（逐模块实现）→ **执行层**（自检 + PR）

**上下文密度**：高。本 spec 支持两种会话模式，由 sprint.md 的 `交付` 列决定：

| 会话模式 | 触发条件 | 会话边界 | PR 粒度 |
|---------|---------|---------|---------|
| **单任务会话** | 拾取 `交付=独立` 的任务 | 一次会话 = 一个任务包 | 一个任务一个 PR |
| **批量会话** | 拾取同 layer 所有 `交付=批量` 的任务 | 一次会话 = 同 layer 全部批量任务 | 同 layer 所有批量任务共用一个 PR |

Steps 1–10 适用于单任务会话；批量会话的 Steps 5–9 见文末「批量会话步骤」章节，Steps 1–4 在批量会话中对每个任务依次执行。

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

**第零步：确认执行层**

```
当前执行层：frontend / backend？
```

🚫 等用户确认（或从任务包 layer 字段自动判断后向用户确认）

**G3 前置检查（source=sprint 时必做）**

拾取任务包后，确认 `source` 字段：
- `source=sprint` → 读 `iterations/vN/gates.md`，确认 G3 已签。未签则阻断：「⚠️ G3 未通过，Sprint 尚未规划，请先完成 plan-sprint。」
- `source=integration` / `source=manual-test` / `source=bug` / `source=optimization` → 无 Gate 前置，直接继续

**拾取任务（source=sprint）**：

读 `iterations/vN/sprint.md`，找当前 layer 且状态为 `[可取]` 的任务，按以下顺序决定会话模式：

**第一优先：处理 `交付=独立` 的任务**

若存在 `[可取]` 且 `交付=独立` 的任务 → 拾取 task-id 最小的那个，进入**单任务会话**。
- 将该任务包状态改为 `[taken-by: {user}]`；同步在项目根 `status.yml` 将该 task 的 `status` 改为 `taken-by`、`assigned_to` 填 `{user}`（机器侧契约，见 `../hact-method/skeleton/07-status-contract.md`）。立即执行认领 commit：
  ```bash
  git add iterations/vN/sprint.md status.yml
  git commit -m "chore(sprint): 认领 {task-id} [taken-by: {user}]"
  ```
  （push 随首次代码 commit 一起推送，无需单独 push）
- Steps 1–10 正常执行，最终推独立 PR
- ⚠️ 该 PR 合并到 master 之前，sprint.md 中 `依赖` 列引用该任务的所有 `批量` 任务均不可拾取

**第二优先：批量会话（所有 `独立` 任务已 `[merged]` 或本 layer 无 `独立` 任务）**

若本 layer 无 `[可取]` 的 `独立` 任务 → 拾取本 layer 全部 `[可取]` 且 `交付=批量` 的任务，进入**批量会话**。
- 将所有拾取任务的状态改为 `[taken-by: {user}]`；同步在项目根 `status.yml` 把每个拾取 task 的 `status` 改为 `taken-by`、`assigned_to` 填 `{user}`。立即执行认领 commit：
  ```bash
  git add iterations/vN/sprint.md status.yml
  git commit -m "chore(sprint): 认领 {task-id-list} [taken-by: {user}]"
  ```
  （push 随首次代码 commit 一起推送，无需单独 push）
- Steps 1–4 对每个任务依次执行（按依赖顺序：被依赖的任务先实现）
- Steps 5–9 执行「批量会话步骤」（见文末），一次自检、一个 PR 覆盖所有任务

**阻断情形**：本 layer 有 `交付=独立` 任务且状态为 `[done]`（PR 已推但未合并），同时有 `批量` 任务依赖该 `独立` 任务 → 停止，输出：「⚠️ {task-id}（独立）PR 尚未合并，依赖它的批量任务暂不可拾取，请先完成 pr-review 合并。」

---

**精确加载上下文**（不全量加载）：
- 读拾取的所有任务包全文（`source=sprint/integration/manual-test` → `iterations/vN/queue/{task-id}.md`；`source=bug/optimization` → `b-queue/{task-id}.md`）
- 只读 `relevant-standards` 字段指向的具体章节，不读整份 standards 文件
- 只读 `reference` 字段列出的文件行号范围，不读全文
- frontend 任务：若 `reference` 字段已含 `ux-flows.md` 相关段落则直接读；若未含但 `ux-flows.md` 存在，则按任务包 title 匹配功能名补读对应段落

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
跳过规模评估和拆分计划，直接输出：
```
hotfix 模式：最小化修复路径，直接开始实现，不等用户确认拆分计划。
```
然后直接进入 Step 3（不经过 🚫 阻断）。

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
- 发现 sprint 范围外的功能缺口（非禁止，只是本次未规划）→ 评估规模，≤3 文件且依赖层已就绪则建议走 B 类 dispatch，不直接记 backlog

🚫 遇到以上两种情况时阻断，不自行绕过

**Subagent 实现策略**（>5 个文件或跨模块）：
- 主线协调，每个模块派独立 subagent 实现
- subagent 返回代码内容，主线负责写文件
- subagent 失败处理见"Subagent 使用"

---

## 第三层：执行层（自检 + 交付）

### Step 5：自检

**【机械验证】**（先跑命令，有报错先修，再进入偏离核查）

```bash
npm run build          # 构建通过
npm run type-check     # 类型检查（或 npx tsc --noEmit）
npm run lint           # lint 通过
```

三条命令任意一条报错 → 先修复，不进入偏离核查。
项目无对应命令（如无 type-check script）→ 跳过该条，不阻断。

**【偏离核查】**：

```bash
git diff --stat
```

对比任务包 `files` 字段：
- 有多改的文件 → 记入 PR description「偏离说明」
- 有 AC 未能实现 → 记入 PR description「遗留问题」

```
✅ 自检完成：机械验证通过，[无偏离 / 偏离已记录]。
→ 下一步：对抗审查
继续？
```

---

### Step 5.5：对抗审查

推 PR 前，派独立 sub-agent 对代码进行对抗性审查。

**【构建 prompt — 严格限制传入内容】**

只传递：
- 任务包的 `acceptance-criteria` 字段（逐条列出）
- `git diff` 全文
- **（条件）** diff 涉及 `api/*.ts`（前端接口调用层）或后端 controller / DTO 文件时 → 额外传入 TRD 中与改动接口直接相关的接口定义段落（仅相关段，不全量加载）

禁止传递：Step 2 拆分计划、模块完成报告、自检结论、任何关于实现意图的描述。

**【sub-agent mandate】**

```
你是一名独立审查员，从未见过这段代码的开发过程和实现思路。

【输入】
需求（Acceptance Criteria）：
{task 的 acceptance-criteria 字段，逐条列出}

代码改动：
{git diff 全文}

【默认假设】
代码存在问题。你的任务是找出所有失败方式，不是确认代码是否正确。

【逐类检查】（每类必须有明确结论，不允许跳过，不允许合并）

1. AC 覆盖：每条 AC 是否有对应实现？逐条核对，找出遗漏或实现偏差。
2. 边界情况：输入为 null / 空值 / 极值 / 并发时代码会怎样？找出未处理的情况。
3. 错误处理：失败路径是否正确处理？有没有吞异常、错误状态码、静默失败？
4. 安全性：是否存在权限绕过、注入风险、数据隔离漏洞、未校验的用户输入？
5. 逻辑正确性：业务逻辑是否与 AC 描述的行为一致？条件判断、状态转换有没有错误？
6. 接口契约对齐（仅当输入包含 TRD 接口定义时执行）：前端 api/*.ts 的字段名 / 类型 / Auth header / 枚举值是否与 TRD 完全一致？后端 controller 路由 / DTO 字段 / 响应结构是否与 TRD 完全一致？不一致逐项列出。

【输出格式】（严格遵守，不得偏离）

每条 finding 格式：
- 类别：{AC覆盖 / 边界情况 / 错误处理 / 安全性 / 逻辑正确性 / 接口契约对齐}
- 位置：{文件名:行号}
- 问题：{具体描述，一句话}
- 严重程度：{阻断 / 建议}

某类无发现时，必须明确写：「{类别}：无发现」
全部无发现时，输出：findings: []
禁止输出「整体看起来不错」「代码质量良好」等任何总结性语言。
```

**【loop 逻辑】**

| sub-agent 输出 | 动作 |
|---|---|
| `findings: []` | 退出 loop，进入 Step 6 |
| 只有 `[建议]`，无 `[阻断]` | 写入 `backlog.md`（格式：`- [ ] {日期} \| [CR-建议] {描述} \| {文件:行号}`）；PR description「遗留问题」填引用；退出 loop，进入 Step 6 |
| 有 `[阻断]` | 修复所有 `[阻断]` 问题，重跑 sub-agent |
| 同一 `[阻断]` 修了 3 次仍出现 | 停止 loop，上报用户；判断根因是否在 AC / TRD 设计层——若是则创建 `revise-doc` 任务，不再继续实现 |

```
✅ 对抗审查完成：[findings: [] / [建议] {N} 条已记入 backlog]，无阻断。
→ 下一步：commit + PR
继续？
```

---

### Step 6：commit

**分支规则**：分支必须从 `master` 切，禁止从其他任务分支切（禁止 stacked PR）。
唯一例外：任务包 `depends-on` 字段明确标注了前置任务且该任务尚未合并到 master。

```bash
git add {改动的文件列表}
git commit -m "{type}({task-id}): {改动描述}"
```

---

### Step 7：推 PR

```bash
git push origin {task-id}
```

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

禁止在 PR description 中包含凭据。若推 PR 前发现凭据（PAT / token / 密码 / 私钥 / API key）已被写入代码或 commit：立即从 commit 中移除、通知相关人撤销该凭据，在凭据清理干净前不推 PR。

---

### Step 8：更新状态

- 将任务包状态改为 `[done]`（A 类：`iterations/vN/queue/{task-id}.md`；B 类：`b-queue/{task-id}.md`）
- 在 `iterations/vN/sprint.md` 对应行：状态列改为 `[done]`，**PR 列填入 `#N`**（N 为 Step 7 创建的 PR 编号）
- 在项目根 `status.yml` 将该 task 的 `status` 改为 `done`、`pr` 填入 `{N}`（机器侧契约，见 `../hact-method/skeleton/07-status-contract.md`）
- 执行 commit + push，将状态更新随 feature 分支推送（合并到已开的 PR）：
  ```bash
  git add iterations/vN/queue/{task-id}.md iterations/vN/sprint.md status.yml
  git commit -m "chore(sprint): {task-id} 标记 [done]，PR #{N}"
  git push origin {task-id}
  ```

---

### Step 9：移交

按 `source` 更新对应追踪文件：
- `source=sprint` → 无需额外操作（PR 号已在 Step 8 写入 sprint.md）；同层全部推完后 devmgr 可开启批量 pr-review
- `source=bug / optimization` → 在 `b-tasks.md` 对应行追加 `PR#{N} 待审`
- `source=integration / manual-test` → 在 `_meta/sessions/{对应进度文件}` 记录"已推 PR#{N}，等待合并后复测"

```
✅ develop 完成：task-{id}（{layer}）已 commit，PR 已推，等待 pr-review。
本会话到此结束。后续动作（复测 / 联调继续）在 PR 合并后由上游会话触发，不在此处建议。
```

🚫 **会话硬边界**：输出上述声明后立即停止。禁止建议"现在可以继续 pinchtab / 复测 / 联调"等后续动作——develop 只负责到 PR 推出，PR 合并权在 pr-review 手里，测试阶段的恢复取决于合并结果，不由 develop 会话判断。

---

### Step 10：feedback 检查 / 就地分流

回顾本次实现，识别值得沉淀的发现：
- 遇到 standards 未覆盖的决策（视觉/接口边界等）且反复出现
- 上下文重置协议被触发（记录触发原因，供后续调整任务拆分粒度参考）
- 无发现 → 跳过

**反馈去向按 `source` 分**：

| source | 去向 |
|---|---|
| `sprint` / `integration` / `manual-test`（A 类） | 写入 `feedback.md`（格式：`{日期} \| {发现} \| 建议在 {standards-frontend/backend/shared} 哪节补充`），由本迭代 `wrap-up-iteration` 第二步统一分流 |
| `bug` / `optimization`（B 类） | **就地分流**——B 类无 wrap-up，不能堆 `feedback.md` 干等。当场誊入本人个人 notes（`../hact-notes-{name}/notes.md`）：编码规范 → `[规范]`、自检漏项 → `[checklist]`、流程 / 方法论问题 → `[方法论]`；项目架构决策 → 项目 `decisions.md`；无价值 → 不记。誊入后在 notes 仓 commit + push（不碰 hact-method） |

> B 类就地分流后，个人 notes 的可上提条目同样由管理者的 `harvest-notes` 收割上提，与 A 类殊途同归。

---

## 批量会话步骤（交付=批量 时使用，替代单任务会话的 Steps 5–9）

> 前提：所有 `交付=独立` 的任务已 `[merged]`，当前 layer 的全部 `[可取]` 批量任务已拾取。

批量会话的 Steps 5–9 与单任务**逻辑一致，只是一次覆盖本 layer 全部批量任务、共用一个 PR**。差异如下，其余照单任务执行：

| 步骤 | 与单任务的差异 |
|------|---------------|
| 批量 Step 5 自检 | 机械验证 / 偏离核查各跑**一次**，覆盖本次所有改动文件；偏离对比所有任务包 `files` 字段的合集 |
| 批量 Step 5.5 对抗审查 | sub-agent 传入**所有任务包的 AC 合集** + diff 全文；loop 逻辑同单任务会话 Step 5.5 |
| 批量 Step 6 commit | 分支名 `{layer}-batch-v{N}`（如 `backend-batch-v3`）；message：`feat({layer}-batch-v{N}): {layer}层批量实现 [{task-id-1}, {task-id-2}, ...]` |
| 批量 Step 7 推 PR | `git push origin {layer}-batch-v{N}`；PR description **按任务分节**（模板见下），偏离 / 遗留问题各任务分别列出或统一写"无"；同样禁止凭据 |
| 批量 Step 8 更新状态 | 所有批量任务包 + sprint.md 对应行 → `[done]`，PR 列**全部填同一个 PR 号**；同步在项目根 `status.yml` 把这批 task 的 `status` 全改 `done`、`pr` 全填同一个 `{N}`；git add 含 `status.yml`；`chore(sprint): 批量标记 [done]，PR #{N}` 推 `{layer}-batch-v{N}` |
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

---

## Subagent 使用

| 触发点 | Subagent 任务 | 失败处理 |
|--------|-------------|---------|
| Step 3 复用检查 | Explore 读 reusables.md | 失败则主线直接读 |
| Step 4 代码探索（reference 不足时）| Explore 扫描周边文件（返回 ≤20 行摘要）| 失败则主线读文件 |
| Step 4（> 5 文件跨模块）| general-purpose subagent 实现单个模块 | 见下方失败协议 |
| Step 5.5 对抗审查 | 独立 sub-agent，只传 AC + diff，不传实现思路；5 类逐项审查 | 同一 `[阻断]` 三次失败 → 停止 loop，上报用户 |

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
| 额外加载 | `design.md`（涉及视觉时）；`ux-flows.md` 对应功能段（若存在）| 无 |
| Checklist | `templates/checklists/frontend-checklist.md` | `templates/checklists/backend-checklist.md` |
| 视觉决策暂停 | 有（🚫） | 无 |
| Subagent 拆分粒度 | 按组件拆（每个组件一个 subagent） | 按模块拆（controller / service 分开）|

---

## 上下文管理

**断点续做**：
1. 读任务包，确认任务内容和 AC
2. 读 `git diff --stat` 确认已改动文件
3. 读 `progress.md` 的 context-state 记录（如有）了解上次停在哪里
4. 从断点继续，不重做已完成改动

**阻塞于 revise-doc 结论**：本任务依赖的 `revise-doc` 结论尚未下达时，任务保持 `[taken-by]` 不变，在 `progress.md` 写明阻塞理由，等 `revise-doc` 完成后再继续——不强行推进，也不退回 `[可取]`。
