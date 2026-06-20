# exec: develop

> CC 加载本文时，当前任务是从 queue 拾取任务包，实现代码，推 PR。
> 三层顺序：**骨架**（理解任务 + 拆分计划）→ **结构层**（逐模块实现）→ **执行层**（自检 + PR）

**上下文密度**：高。本 spec 处理**一个任务集**（size ≥ 1）：`交付=独立` 任务形成单元素集（自己一个 PR），同层 `交付=批量` 任务形成多元素集（共一个 PR）。单任务即 N=1 特例，全流程统一——**Steps 1–4 对集合每个任务依次执行（按依赖序），Steps 5–8 一次覆盖整个集合**。

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

> **Fast Mode**：用户在会话开头声明 "fast mode" 时，以下**确认型**阻断自动通过（CC 展示结论后直接继续，不等回应）：第零步（layer 从任务包自动判断）、Step 1（AC 理解）、Step 2 路径 B（拆分计划）、Step 5（继续？）。以下**决策型**阻断不受影响：Step 4 遇到 `do-not` 约束边界、Step 4 前端视觉未覆盖决策（CC 缺信息，必须等用户）。

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

**拾取任务（source=sprint）：形成任务集**

读 `iterations/vN/sprint.md`，找当前 layer 且状态为 `[可取]` 的任务，按以下规则形成本次会话的**任务集**（后续全流程统一处理，单元素集即单任务）：

- **优先独立**：若存在 `[可取]` 且 `交付=独立` 的任务 → 任务集 = {task-id 最小的那个独立任务}（单元素，自己一个 PR）。
- **否则批量**：本 layer 无 `[可取]` 独立任务 → 任务集 = 本 layer 全部 `[可取]` 且 `交付=批量` 的任务（多元素，共一个 PR）。
- **阻断**：本 layer 有 `交付=独立` 任务处于 `[done]`（PR 已推未合并）且有 `批量` 任务依赖它 → 停止：「⚠️ {task-id}（独立）PR 尚未合并，依赖它的批量任务暂不可拾取，请先完成 pr-review 合并。」（独立 PR 合并到 master 前，依赖它的批量任务不可拾取。）

**认领**：集合内所有任务包状态改为 `[taken-by: {user}]`，同步在项目根 `status.yml` 把每个 task 的 `status` 改 `taken-by`、`assigned_to` 填 `{user}`（机器侧契约，见 `../hact-method/skeleton/07-status-contract.md`），立即认领 commit（单任务时 `{task-id-list}` 即一个 id）：
```bash
git add iterations/vN/sprint.md status.yml
git commit -m "chore(sprint): 认领 {task-id-list} [taken-by: {user}]"
```
（push 随首次代码 commit 一起推送，无需单独 push）

---

**精确加载上下文**（不全量加载）：
- 读拾取的所有任务包全文（`source=sprint/integration/manual-test` → `iterations/vN/queue/{task-id}.md`；`source=bug/optimization` → `b-queue/{task-id}.md`）
- 只读 `relevant-standards` 字段指向的具体章节，不读整份 standards 文件（`standards-{layer}.md` 在**项目根**——跨迭代活文档，非 `iterations/vN/`）
- 只读 `reference` 字段列出的文件行号范围，不读全文
- **frontend 任务：必读项目根 `design.md` 全文**——视觉规格唯一参照，文件短、无条件加载，不再凭"是否涉及视觉"自行判断（堵住"改个样式类名觉得不涉及视觉→硬编码字号/间距"的泄漏）
- frontend 任务：若 `reference` 字段已含 `ux-flows.md` 相关段落则直接读；若未含但 `ux-flows.md` 存在，则按任务包 title 匹配功能名补读对应段落
- frontend 任务：若 `iterations/vN/prototype.html` 存在，按任务包 title 匹配对应交互路径读取，作为交互实现基准（happy path 之外的分支照原型走通）

---

## 第一层：骨架（理解 + 计划）

> 任务集多元素时，Step 1–4 对每个任务**依次执行**（按依赖序：被依赖的先实现）；单元素集即执行一次。

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
- 前端视觉实现先对照 `design.md`：字号/行高/字重、颜色/间距/圆角/阴影、控件尺寸一律用对应 SCSS 变量，禁止硬编码字面值；遇到 `design.md` 与 standards **均未覆盖**的视觉决策 → 暂停，输出 2–3 个选项，等用户确认
- 发现 sprint 范围外的功能缺口（非禁止，只是本次未规划）→ 评估规模，≤3 文件且依赖层已就绪则建议走 B 类 dispatch，不直接记 backlog

🚫 遇到以上两种情况时阻断，不自行绕过

**Subagent 实现策略**（>5 个文件或跨模块）：
- 主线协调，每个模块派独立 subagent 实现
- subagent 返回代码内容，主线负责写文件
- subagent 失败处理见"Subagent 使用"

---

## 第三层：执行层（自检 + 交付）

### Step 5：自检（写测试 + 跑绿 + 偏离核查）

> 任务集多元素时，以下各项跑**一次**、覆盖集合全部改动文件与所有任务包的 AC 测试；偏离核查对比所有任务包 `files` 的合集。

**【机械验证】**（先跑命令，有报错先修，再进入测试与偏离核查）

```bash
npm run build          # 构建通过
npm run type-check     # 类型检查（或 npx tsc --noEmit）
npm run lint           # lint 通过（含 no-any / console.log / 未用 import / TODO 等机械项）
npm run test           # 测试全绿（或项目测试命令）
```

任意一条报错/红 → 先修复，不进入下一步。
`build`/`type-check`/`lint` 项目无对应命令 → 跳过该条，不阻断。
`test` 项目无测试运行器 → 测试基建缺失（`standards-backend.md`「测试框架约定」由 `draft-tech-design` 确立；存量项目迁移时补建——见该 spec Step 7 维护项目 Standards）。**不静默跳过、不假装通过**：
- 上报「测试基建缺失」，不可视区任务**阻塞待补**——先补 standards 测试约定 + 项目装运行器，再回来落测试；
- 若用户判定本任务必须先推进（基建一时补不上）：明确标记本不可视区 AC **未经测试验证（降级）**，PR description「遗留问题」写明，转由 `pr-review` 路1 人工审代码对 AC 兜底——这是**临时降级、非常态**，不得当作正常完成。

**【自检】**（取代旧"逐条 checklist 审代码 + AI 对抗审查"——确定性的交给工具、看不见的写测试、看得见的留人）

对照 `templates/checklists/{layer}-checklist.md`（backend = 测试品类清单；frontend = 三段式自检）确认：
- 不可视区 AC 的 Given/When/Then 例子规格（任务包 `acceptance-criteria`，测试脊柱：行为源自 PRD 幕 1、技术精度源自 TRD 幕 2）已在此 **1:1 物化成可运行测试**且全绿——这是脊柱例子规格第一次落成 runnable 形态（守 2026-06-16：runnable 物化在代码存在后）；落成后测试代码随分支携带，不蒸馏；
- 测试品类无空缺（backend：鉴权/边界/错误路径/契约/数据并发/安全注入·穿越各有测试或合理标 N/A）；
- 留人判项（N+1 / 日志隐私 / 冗余复用 / 并发竞态）逐项给结论。
- 前端：机械项交 `npm run lint`/`vue-tsc`/`stylelint`（含硬编码字面值）；可测逻辑（状态 / 边界 / 表单）写测试；视觉/交互/响应式残量留走查，归 manual-test / pr-review 设计保真，不在此硬卡。

输出 backend【后端测试品类报告】/ frontend【前端自检报告】（格式见 checklist 文末）。

> **升级（同测试反复修不好）**：同一测试修 3 次仍红 → 根因可能在 AC / TRD 设计层（AC 本身矛盾或 TRD 契约错），停止硬磨、上报用户；判断是否创建 `revise-doc` 任务，不在本会话强行刷绿。

**【偏离核查】**：

```bash
git diff --stat
```

对比任务包 `files` 字段：
- 有多改的文件 → 记入 PR description「偏离说明」
- 有 AC 未能实现 → 记入 PR description「遗留问题」

```
✅ 自检完成：机械验证 + 测试全绿（[X] passed），测试品类无空缺，[无偏离 / 偏离已记录]。
→ 下一步：commit + PR
继续？
```

---

### Step 6：commit

**分支规则**：分支必须从 `master` 切，禁止从其他任务分支切（禁止 stacked PR）。唯一例外：任务包 `depends_on` 明确标注前置任务且其尚未合并到 master。

**分支命名 / message（按集合大小）**：
- 单元素集 → 分支 `{task-id}`，message `{type}({task-id}): {改动描述}`
- 多元素集 → 分支 `{layer}-batch-v{N}`，message `feat({layer}-batch-v{N}): {layer}层批量实现 [{task-id-1}, {task-id-2}, ...]`

```bash
git add {改动的文件列表}
git commit -m "{见上分支命名}"
```

---

### Step 7：推 PR

```bash
git push origin {task-id}
```

PR description 是本次交付的唯一记录，需完整填写。**每任务一节**（单元素集即一节）：

```markdown
## {单元素集：task-id：任务标题 ／ 多元素集：v{N} {layer}层批量实现，含 task-id-1 / task-id-2 …}

### {task-id}：{任务标题}      ← 每任务一节，多元素集逐任务重复本节
**改动摘要**：{2–3 句}
**AC 验证**：
- [x] {AC 1}：{验证方式}

### 偏离说明
{无 / 多任务分别列出：哪些改动超出 files 清单，或哪条 AC 未实现及原因}

### 遗留问题
{无 / 多任务分别列出，有则确认已记入 backlog}
```

禁止在 PR description 中包含凭据。若推 PR 前发现凭据（PAT / token / 密码 / 私钥 / API key）已被写入代码或 commit：立即从 commit 中移除、通知相关人撤销该凭据，在凭据清理干净前不推 PR。

---

### Step 8：更新状态

- 集合内**每个**任务包状态改为 `[done]`（A 类：`iterations/vN/queue/{task-id}.md`；B 类：`b-queue/{task-id}.md`）
- **仅 source=sprint**：在 `iterations/vN/sprint.md` 集合内每任务对应行，状态列改 `[done]`、**PR 列填同一个 `#N`**（N 为 Step 7 的 PR 编号）；其余 source 任务不在 sprint.md，跳过此条
- 在项目根 `status.yml` 把集合内每个 task 的 `status` 改为 `done`、`pr` 全填同一个 `{N}`（机器侧契约，见 `../hact-method/skeleton/07-status-contract.md`）
- 执行 commit + push，状态更新随 feature 分支推送（合并到已开的 PR）：
  ```bash
  git add {集合内任务包文件} iterations/vN/sprint.md status.yml   # sprint.md 仅 source=sprint 时含
  git commit -m "chore(sprint): {task-id-list} 标记 [done]，PR #{N}"
  git push origin {分支名}
  ```

---

### Step 9：移交

按 `source` 更新对应追踪文件：
- `source=sprint` → 无需额外操作（PR 号已在 Step 8 写入 sprint.md）；同层全部推完后 devmgr 可开启批量 pr-review
- `source=bug / optimization` → 在 `b-tasks.md` 对应行追加 `PR#{N} 待审`
- `source=integration / manual-test` → 在 `_meta/sessions/{对应进度文件}` 记录"已推 PR#{N}，等待合并后复测"

```
✅ develop 完成：{task-id-list}（{layer}）已 commit，PR #{N} 已推，等待 pr-review。
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
| 额外加载 | `design.md`（**必读全文**）；`prototype.html` 对应交互路径（若存在）；`ux-flows.md` 对应功能段（若存在）| 无 |
| Checklist | `templates/checklists/frontend-checklist.md`（**三段式**：机械归 lint/vue-tsc/stylelint｜可测逻辑写测试｜视觉/交互留走查） | `templates/checklists/backend-checklist.md`（**测试品类清单**：为鉴权/边界/错误/契约/并发/安全注入·穿越各写测试） |
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
