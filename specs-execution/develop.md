# exec: develop

> CC 加载本文时，当前任务是从 queue 拾取一个**任务集**，逐任务实现 + 独立审查，推一个 PR **并合并到 master**。
> **执行模型**：主线只编排（定标 / 新鲜度核对 / 设计门 / finding 路由 / 末端全量 / 提交 + 合并）；每个任务的「读懂→计划→写→自绿」由执行 subagent 跑。独立审查 subagent 自读权威原文、按证据分类 finding；只有当前可达的行为/机制缺陷进入代码回炉。人工只守一个门：**前端设计是否到位**。
> **无独立 pr-review 环节**（决策#24）：代码质量由 per-task 独立证据审查 + 全量绿把关，develop 自审自合并。仅安全敏感改动保留一道人工裁决。

**上下文密度**：中。主线只持编排状态 + 末端全量；per-task 上下文载入下沉到执行 subagent，故**批次可放大**。本 spec 处理**一次会话**，任务集 size ≥ 1：`交付=可并行` 任务共一个 PR；`交付=串行` 任务各自一个 PR，会话内可串行多个（每任务完整跑「主循环+末端」后切回 master，再启下一个）。

---

> **质量模型（三层防线）**：deterministic 绿先过 → 独立证据审查按当前风险面做语义 top-up → 人工只守前端设计到位。规格漂移、示例错误和 scope gap 走各自旁路，不伪装成代码缺陷。

> **🚫 人工门（全自动模型下只剩两处，其余全自动 loop、不逐步等人）**：
> ① **前端设计到位**——frontend 批次开跑前一次性确认（backend-only 跳过）。
> ② **escape-hatch**——执行 subagent 撞 do-not 拿不准 / 信息不足以决策 / 视觉缺口 / 测试反复红时返回 blocked，主线浮给用户。

---

## 会话启动（主线）

**第零步：确定进料与执行层（⚖️ 默认判定）**

用户点名 `b-queue/{task-id}.md` 或 task-id 形如 `*-b-*` 时，先读该任务包，确定 `source=bug/optimization` 与 layer；B 类不要求存在活跃 iteration。其余进料读 `iterations/vN/sprint.md` 的 layers 列与状态列：
- 用户开场已指明层 → 按用户指定，播报即可
- 仅一个 layer 有 `[可取]` 任务 → 直接定层，播报「当前执行层：{layer}（唯一有可取任务的层）」后继续，不等待
- 两层都有 `[可取]` 任务且用户未指明 → 🚫 问「当前执行层：frontend / backend？」等确认

**`source=foundation` 全栈，跳过本步。**

**Gate 前置检查（按 source）**

确认 `source` 字段：
- `source=sprint` → 读 `iterations/vN/gates.md`，确认 G3 已签。未签则阻断：「⚠️ G3 未通过，Sprint 尚未规划，请先完成 plan-sprint。」
- `source=foundation` → 读 `iterations/v0/gates.md`，确认 G2 已签。未签则阻断：「⚠️ G2(v0) 未通过，地基设计未确认，请先完成 draft-foundation。」**并改走下方「source=foundation 进料」块**。
- `source=integration` / `manual-test` / `bug` / `optimization` → 无 Gate 前置，直接继续

**source=foundation 进料（V0 走骨架特例）**

`source=foundation` 时会话启动改走本块——**不走** sprint 拾取/认领/批次分支/前端设计门；**主循环 + 末端照常**，仅三处替换：
- **判定 foundation 模式**（无任务包、无 source 字段可读）：由项目状态判——`iterations/v0/gates.md` G2 已签 **且** `status.yml` 无 `[merged]` 的 `foundation` task（即项目仓 `CLAUDE.md` Step 1「先判 V0」推断出的本模式），或用户明示走骨架。
- **全栈、不问执行层**：走骨架横跨前后端，跳过「第零步」。
- **建造单元 = `iterations/v0/foundation-design.md`**：对象 = 其「地基件清单」逐件 + 「标杆穿透切片」。地基件互锁（管道/作用域 repo/外壳/主题/信封彼此依赖）→ **串行建在单条 `foundation-v0` 分支、共一个 PR**：
  ```bash
  git checkout -b foundation-v0   # 从 master 切
  ```
  status.yml：`iterations.v0` 块已由 draft-foundation 建（仅 G2）；此处只往 `tasks` **追加** `{ id: foundation, source: foundation, status: taken-by, branch: foundation-v0 }`（不重建 v0 块）。
- **跳过前端设计门**：走骨架建主题**框架**用占位 token（design.md 真值由 V1 `draft-ux` 填），不实现具体画面 → 无 design.md 覆盖可对、无前端设计人工门。
- **三处替换**（其余主循环 / 末端不变）：
  ① 阶段 A 执行 subagent **自读 `foundation-design.md` 对应件 + `foundation.md` 该关注点行 + relevant standards**（替代任务包）；自绿照常（build/type/lint/test + 标杆切片端到端跑通）。
  ② 阶段 B 独审读 **`../hact-method-lab/templates/review-briefs/foundation-review.md`**（替代 develop-review：验强制边实际档≥应有档 + 命门 + 标杆质量）。
  ③ 末端状态更新走下方「`source=foundation`」分支（无 sprint.md；登记标杆切片）。
> 安全敏感预检（末端·合并前）：走骨架本就含数据隔离/鉴权的构造级落地 → **必然触发** architecture 裁决门，按既有规则等 architecture discipline 签后合并。

**source=bug/optimization 进料（B 类）**

- B 类由 `dispatch-new` 写入 `b-queue/` 后，统一从本 `develop` 入口拾取；一次只取用户点名的一个 task-id，不与 sprint 批次混跑。
- 无 Gate、无 sprint.md、无 iteration；任务包路径为 `b-queue/{task-id}.md`，审查/预检记录目录为 `b-reviews/{task-id}/`，分支名与 PR 粒度均为 `{task-id}`。
- 状态 `[可取]` 时认领并同步 `status.yml`；`[taken-by]` 时按断点续做对账。状态已 `[done]/[merged]` 则先说明现状，不重复实现。
- 主循环、freshness preflight、独立审查、末端全量和状态更新照常；所有文中的 vN 参数对 B 类替换为“无 iteration”。
- `adversarial-review` 只保留为用户明确要求接管已有手动 diff 的兼容入口，不是新 B 包默认执行路径。

**拾取任务（source=sprint）：形成任务集**

读 `iterations/vN/sprint.md`，找当前 layer 且状态为 `[可取]` 的任务，按 `交付` 字段分两路。**两路共用估量标准**：以「主线编排 + 末端全量检测不触发 compact」为截止线，按各任务 `files` 估改动面取前缀子集；超出估量线的任务留 `[可取]` 下轮拾取。

- **交付=串行**：取本 layer 全部 `[可取]` 串行任务，按 task-id 升序，估量后取头部前缀。每个串行任务各自一个 PR，会话内串行完成（每任务跑完「主循环+末端」后切回 master，再启下一个）。
- **交付=可并行**：本 layer 无 `[可取]` 串行任务时，取本 layer 全部 `[可取]` 可并行任务，按依赖序，估量后取依赖序前缀子集（前缀天然依赖闭合）。全部可并行任务共一个 PR。
- **阻断**：本 layer 有 `交付=串行` 任务处于 `[done]`（PR 已推未合并到 master）且有 `可并行` 任务依赖它 → 停止：「⚠️ {task-id}（串行）PR 尚未合并到 master，依赖它的可并行任务暂不可拾取，请先完成该串行任务的 develop 会话（含合并）。」

估量完成后直接通知用户并进入认领（无需等确认）：
```
本轮任务集：[task-id...]（{串行：各自 PR / 可并行：共一 PR}，估约 {N} 处改动）{若截断：，剩余 [id...] 留下轮}
```

**认领**：集合内所有任务包状态改为 `[taken-by: {user}]`，同步在项目根 `status.yml` 把每个 task 的 `status` 改 `taken-by`、`assigned_to` 填 `{user}`（机器侧契约，见 `../hact-method-lab/skeleton/07-status-contract.md`）。

**分支锁定**：

- **可并行任务集**（认领时立即建一条分支）：`{layer}-batch-v{N}-{id1}/{id2}/...`（依赖序，末元素后无尾斜杠）
  ```bash
  git checkout -b {layer}-batch-v{N}-{id1}/{id2}/...   # 从 master 切
  ```
- **串行任务**（每个任务开始时建各自分支，不提前建全部）：`{task-id}`
  ```bash
  # 开始当前串行任务时：
  git checkout -b {task-id}   # 从 master 切
  # 当前任务合并后，切回 master 再为下一个建分支：
  git checkout master && git pull
  ```

> 禁止从其他任务分支切（禁止 stacked PR）。唯一例外：depends_on 指向尚未合并到 master 的前置任务时，从该前置分支切。
> 多会话并行时同名分支已存在 → git 立即报错：停止，告知用户另一会话已认领同批任务，澄清后再继续。

`branch` 字段写入 status.yml：可并行任务认领时统一写入；串行任务随各自分支建立时逐步写入。认领 commit：

```bash
git add iterations/vN/sprint.md status.yml
git commit -m "chore(sprint): 认领 {task-id-list} [taken-by: {user}]"
```
（push 随首次代码 commit 一起推送，无需单独 push）

**freshness preflight（写第一行代码前）**

对集合内每个任务做一次轻量核对，只查依赖合并后可能变化的面：

- `files` 是否仍是当前落点，`reference` 的符号/章节/行号锚是否仍存在；
- 上游是否已完成本包原计划新建的机制，或改变了接口、状态、阈值；
- 每条 AC 的 intent/oracle 是否仍一致，example 能否按当前 oracle 复算；
- `do-not/escalate-if` 的冲突是否已被上游裁决，承接方是否真实存在且未 merged；
- `supersedes` 对象是否已删除、重新出现调用方或已由别包退役。

**先建审计锚**：编排器在事件发生时取 ISO-8601 时间，不让执行者事后估算。A 类记录写 `iterations/vN/code-reviews/{task-id}/preflight.md`，B 类写 `b-reviews/{task-id}/preflight.md`，格式用 `templates/review-briefs/develop-preflight-record.md`。开始核对时记录 `started_at`；确认工作树不含本任务外改动后，记录固定 `base_ref=$(git rev-parse HEAD)` 与当前 `base_tree=$(git write-tree)`。

未命中则记 `freshness: pass`、`timing: before-code` 后继续。命中时在改代码前按根因处理：`example-error / contract-drift` 修任务包或发 `revise-doc`，`scope-gap` 补承接任务；只复核变化的契约，不跑代码审查。修订闭合后重新 preflight；需用户裁决时返回 blocked。结束时写 `completed_at/result/spec_minutes`，其中分钟数按事件时间差向上取整；此处产生的轮次计入 `spec_rounds`，不计 `code_rounds`。

preflight `result` 非 `pass/revised`、存在未关闭 finding 或记录缺失时，**禁止写代码**。断点接管已有 diff 却无记录时只能补 `timing: retroactive` 并先纠偏，不得倒填成 before-code。

**前端设计到位确认（frontend 批次的唯一人工门）**

- **backend-only 任务集** → 跳过，直接进主循环。
- **含 frontend 任务** → 主线读项目根 `design.md` +（若存在）`iterations/vN/prototype.html`，对照本批次各 frontend 任务的画面 / 交互，确认设计规格已覆盖齐全：
  ```
  前端设计到位检查：本批次 frontend 任务涉及画面 [...]，design.md [已覆盖全部 / 缺 {X} 的视觉规格]，prototype.html [有对应交互路径 / 缺 {Y}]。
  ```
  🚫 等用户确认「设计到位、可全自动跑」。design.md 有缺口 → 用户补 design / 或起 `revise-doc`，**缺口补齐前不开跑**。

---

## 主循环：逐任务「执行 → 独立审查」（per task，依赖序串行）

> **可并行任务集**：对每个任务按依赖序串行走「执行 subagent → 独立审查 subagent」一轮（被依赖的先做，**不并行**——串行单工作树无写冲突），全部通过后进末端（一次）。**串行任务多个**：每个任务各自串行完成「主循环 + 末端」，末端后切回 master 再启下一个。主线只编排、收结果、浮决策，**不把 per-task 上下文拉进主线**。

### 阶段 A · 执行 subagent（读懂 → 计划 → 写 → 自绿）

preflight 通过后，编排器立即记录 `implementation_started_at`。主线派一个 general-purpose subagent，告知 `{task-id}` + layer + `{迭代 vN | B 类无 iteration}`，令其自治完成（隔离上下文）：

1. **自读上下文**（精确加载，不全量）：
   - 任务包 normative core（A 类 `iterations/vN/queue/{task-id}.md` / B 类 `b-queue/{task-id}.md`）；non-normative appendix 仅在疑点需要历史解释时查
   - 只读 `relevant-standards` 命中的规则 id；不加载同文件其它条目
   - 只读 `reference` 列出的符号/章节/行号锚，不读全文
   - **frontend 额外**：必读项目根 `design.md` 全文（视觉规格唯一参照）；`ux-flows.md` 对应功能段（若存在，按 title 匹配）；`prototype.html` 对应交互路径（若存在，作交互基准，happy path 之外的分支照原型走通）
2. **读懂**：以每条 AC 的 `intent` 为目标、`oracle` 为判据；普通 example 仅帮助理解，冲突时返回 `example-error`，不得用代码迁就。只有 `golden: true` 的 example 是字面契约。
3. **计划 + 复用**：按 `files` 估规模，>3 文件 / 跨模块则内部按依赖序拆模块；用 Explore 读 项目根 `reusables.md`，已有资产**必须复用、不重造**。`urgency=hotfix` → 走最小化修复路径，不拆模块。
4. **写**：逐模块实现并**落盘**。>5 文件 / 跨模块可再派子 subagent 分模块（frontend 按组件、backend 按 controller/service 拆；属 subagent 内部的事，主线不介入）。
5. **自绿（首次实现，共享工作树）**：跑本任务目标测试与必要的 `build` / `type-check` / `lint`；不可视区 AC 的 intent/oracle 落成有辨别力的 runnable test，`golden: true` 的 example 再字面 1:1 物化。普通 example 不制造额外字面测试义务。完整仓 `build/type/lint/test` 只在末端跑一次；整改轮默认只跑 finding 反例与受影响回归，不在每轮重复整链。无对应命令则跳过。同一测试修 3 次仍红时返回 blocked，先查 oracle/contract，不硬磨代码。
6. **返回结构**给主线：
   ```yaml
   status: done | blocked
   task-id: {id}
   changed-files: [...]
   tests: { added: [...], result: "X passed" }
   deviations: [...]    # 超出 files 的多改 + 原因
   unmet-ac: [...]      # 未实现的 AC + 原因
   blocked: { reason: "do-not 边界拿不准 / 信息不足以决策 / 视觉缺口 / 测试反复红 / 测试基建缺失", detail: "..." }  # status=blocked 时填
   ```

执行 subagent 返回 `done` 时，编排器立即记录 `implementation_completed_at`，并以两时间戳向上取整得到 `implementation_minutes`。这段只计算首次实现；从第一轮独审开始到最终通过的整改与等待统一计入 review wall-clock，避免重叠。

> **测试基建缺失**（项目无测试运行器）：执行 subagent 返回 `blocked: 测试基建缺失`。**不静默跳过、不假装通过**——主线上报：不可视区任务**阻塞待补**（先补 项目根 `standards-backend.md`「测试框架约定」+ 项目装运行器，约定由 `draft-tech-design` 维护 Standards 时确立、存量项目迁移时补建）；若用户判定必须先推进（基建一时补不上），明确标记该不可视区 AC **未经测试验证（降级）**、PR「遗留问题」写明、由阶段 B 独立审查 subagent 按 AC 审代码兜底 + 下游 manual-test 验收兜底——**临时降级、非常态**。

### 阶段 B · 独立证据审查 subagent（自读权威原文）

执行 subagent 返回 `done` 后，编排器立即记录 `review_started_at`。A 类 round report 写 `iterations/vN/code-reviews/{task-id}/round-{NN}.md`，B 类写 `b-reviews/{task-id}/round-{NN}.md`，格式用 `templates/review-briefs/develop-review-round.md`。

**固定审查对象**：确认只有本任务 changed-files 后，精确 `git add -- {changed-files}`，以 `git write-tree` 取得 `reviewed_tree`，并计算固定 diff 的 SHA-256。首次 `reviewed_base` 取 preflight 的 `base_tree`；整改轮取上份 report 的 `reviewed_head`，当前树为新的 `reviewed_head`。审查员只读 `git diff {reviewed_base} {reviewed_head}`，不得用会变化的裸 `git diff` 代替报告基线。发现本任务外改动则 blocked，先分离工作树。

**首次 full review**：主线派全新隔离 subagent 读 `develop-review.md`（`source=foundation` 时改读 `foundation-review.md`），告知 `{task-id}` + layer + `{vN | B 类无 iteration}` + `review-mode: full` + base/head tree + 下方生成的 project-relative `review_profile`。审查员自读任务包、命中 Standards、固定 diff 与测试，只执行 profile selected dimensions，不接收执行者自评；每条 finding 必须给稳定 id、dimension、type/reachability/evidence/impact/action。同一根因的语法/输入变体合并进同一 id，不按变体数制造 blocker。Foundation 的 profile 固定为 `foundation-review/v1` 并按专用 brief 全审。

**整改 targeted review**：传 prior report、未关闭 finding ids、上一/当前 reviewed tree、必须重跑的 counterexample/regression；全新审查员可读前次**独立报告**，但仍不得接收开发者自评。只核这些 finding、反例、受影响回归与两棵 tree 之间的增量 diff，不重做无关逐类审查。若 changed surface 超出允许范围、引入新机制/模块/依赖或发现新根因，本轮报告置 `escalate_to_full: true`，紧接下一轮才升 full。

每轮 dispatch/completion 当场写 `started_at/completed_at/elapsed_minutes`；不得事后估算。round report 本身不计入被审实现 tree，最终随状态提交。

**模型分级（按有效 risk，不唯任务包自报——决策#29）**：阶段 A 执行 subagent 是写代码/生成任务，保持默认模型；本阶段 B 是纯审查。**有效 risk 判定（⚖️，只升不降）**：任务包 `risk: sensitive`，**或**主线按安全敏感四类（见末端预检类别）语义扫任务包 title/description/AC/files 命中任一 → 按 sensitive 处理；两者皆无 → standard。standard → 派发审查 subagent 时指定 `model: "sonnet"`；sensitive 或 `source=foundation` → 不指定 model，继承当前会话默认模型。**升档时同步改正**该任务包与 status.yml 的 `risk` 为 `sensitive`（漏标修正，供末端预检与审计），并播报一行升档理由。

**review profile（非 Foundation 的每次 full 必做）**：有效 risk 与 fixed changed-files 确定后、派审查员前，用项目 `scripts/review-profile.js` 从权威任务包生成不可覆盖的 JSON；A 类写 `iterations/vN/code-reviews/{task-id}/profile-round-{NN}.json`，B 类写 `b-reviews/{task-id}/profile-round-{NN}.json`。命令只传任务包路径、有效 risk 与 `git diff --name-only {preflight base_tree} {reviewed_head}` 的完整文件集合：

```bash
node scripts/review-profile.js {task-package-path} \
  --risk {standard|sensitive} \
  --output {review-report-dir}/profile-round-{NN}.json \
  --changed-files {fixed changed-files...}
```

生成失败、profile task-id 不匹配或 selected/omitted 不闭合 → 禁止派审。full round 的 `review_profile` 指向本轮新 profile；targeted 继承最近 full 的路径，不重新选择维度。targeted 扩大 changed surface 时先置 `escalate_to_full`，下一轮基于 preflight base→当前 head 的完整 diff 生成新 profile 再 full。`source=foundation` 继续用专用 `foundation-review.md` 逐关注点全审，不经过普通裁剪器。

**finding 路由与有界复审**：

| action | 动作 | 复审范围 |
|---|---|---|
| `fix-code` / `fix-mechanism` | 重派执行 subagent 修对应稳定 finding ids | 下一轮 `targeted` 只复审该行为、反例、受影响回归与增量 diff；报告触发 `escalate_to_full` 才追加 full |
| `revise-doc` / `downgrade-claim` | 修任务包或发 `revise-doc`；代码文件数必须为 0 | 只复核 contract/claim 一致性，不重跑完整代码审查；计 `spec_rounds` |
| `global-gap-review` | 交 global seam review 或创建补缝任务 | 原包可独立合规时不打回、不重审 |
| `backlog` | 记入遗留/waiver | 不重审 |
| `request-evidence` | 让审查员补反例或发规格澄清 | 证据面未变化前不改代码；补齐后重新分类 |

`findings: []` 或仅 advisory 即通过。只有 action 为 `fix-code/fix-mechanism` 的 blocking finding 进入代码整改 loop。每实际运行一次 full/targeted 独审计一个 `code_round`；同一代码根因最多 3 个 code rounds，同一 finding 的 evidence 面未变化时禁止换措辞重复上报。超界后按根因发 revise-doc 或 escape-hatch。

最终通过时编排器立即写 `review_completed_at`，`review_minutes = ceil((review_completed_at-review_started_at)/60s)`；它有意包含独审等待和审查期间整改，正是用户真实感知的 review wall-clock。

### escape-hatch（执行 / 审查返回 blocked 时）

执行 subagent 返回 `status: blocked`，或审查 loop 超界 → 主线**浮给用户**该 blocked 结构，等用户指示后带答案**重派**该任务；用户判定无解 → 走「上下文重置协议」（任务回 `[可取]`）。视觉缺口理论上已被前端设计门预堵，仍冒出则说明 design.md 有漏 → 回补 design / `revise-doc`。

> 每任务通过审查后主线报一行：`✅ {task-id} 完成（{changed-files 数} 文件，{tests} 测试，审查通过）`。集合全部通过后进末端。

---

## 末端（主线，集合全部任务通过审查后跑一次）

> **串行任务多个时**：每个串行任务分别完整跑一遍本「末端」流程（全量检测 → commit → PR → 合并 → 状态更新），完成后 `git checkout master && git pull`，再启下一个串行任务的主循环。**可并行任务**：全部主循环完成后统一跑一次末端。

### 全量检测

整合后跑**一次**全量验证（覆盖集合全部改动文件 + 所有任务 AC 测试）：
```bash
npm run build && npm run type-check && npm run lint && npm run test
```
- 任一红 → 多为 **cross-task 集成问题**（单任务自测在阶段 A 已绿）；定位是哪个任务的改动引入，回该任务阶段 A 修。`build/type/lint` 无命令 → 跳过该条不阻断。`test` 无运行器 → 见阶段 A「测试基建缺失」处置。
- **偏离核查**：`git diff --stat` 对比所有任务包 `files` 合集；汇总各任务返回的 `deviations` / `unmet-ac`，分别记入 PR description「偏离说明」/「遗留问题」。

> 全量绿只证明可执行一致性；跨包归属与退役语义由下方 global seam review 负责，不回灌为逐包完整重审。

### global seam review（本期最后一个 sprint 集合）

当当前集合通过后将使本期全部 `source=sprint` 任务完成时，派独立 subagent 读 `../hact-method-lab/templates/review-briefs/global-seam-review.md`，审合并候选树的包间接缝；输出写入 `iterations/vN/global-seam-review.md`。只查互推/无人认领入口、调用方不可达、旧实现未退役、共享定义分叉与组合终态不可达，不重审单包 AC/代码风格。

- `scope-gap`：创建独立补缝任务并同步 queue/sprint/status；当前已合规包不打回、不完整重审。
- 能明确归属当前 diff 的 `behavior-bug`：按 `fix-code` 修对应行为并做增量复审。
- `future-risk/evidence-gap`：按 backlog/request-evidence 路由，不为凑结论改代码。
- 补缝任务完成后，作为新的最后集合再跑一次 seam review，直到报告 `findings: []` 或所有 gap 已有明确 owner。

```
✅ 全量检测完成：build/type/lint/test 全绿（[X] passed），[无偏离 / 偏离已记录]。集合 {task-id-list} 全部通过独立审查。
→ 下一步：commit + PR
```

### commit

**分支**：已在认领时锁定（`status.yml tasks[*].branch`），当前工作树即在该分支上。

**commit message 格式**：
- 串行任务（每个单独提交） → `{type}({task-id}): {改动描述}`
- 批量多任务 → `feat({分支名}): {layer}层批量实现 [{task-id-1}, {task-id-2}, ...]`

```bash
git add {改动的文件列表}
git commit -m "{见上}"
```

### 推 PR + 合并到 master

```bash
git push origin {分支名}   # 从 status.yml tasks[*].branch 读取，认领时已锁定
```

用 `/gitee-ops` 创建 PR（远端为 Gitee，禁止 gh CLI）。PR description 是本次交付的唯一记录，需完整填写。**每任务一节**（单元素集即一节）：

```markdown
## {单元素集：task-id：任务标题 ／ 多元素集：v{N} {layer}层批量实现，含 task-id-1 / task-id-2 …}

### {task-id}：{任务标题}      ← 每任务一节，多元素集逐任务重复本节
**改动摘要**：{2–3 句}
**AC 验证**：
- [x] {AC 1}：{验证方式（测试名 / 手段）}

### 偏离说明
{无 / 多任务分别列出：哪些改动超出 files 清单，或哪条 AC 未实现及原因}

### 遗留问题
{无 / 多任务分别列出：未验证降级项 / 审查建议级项 / 已记 backlog 项}

### 退役账
{无 / 逐条：{被取代实体} → 已下线（本次 diff 中的删除位置）｜保留（理由 + 解除条件）}
```

**退役账**：任务包 `supersedes` 非空时逐条给结论，二选一——**已下线**须能在本次 diff 里指出删除位置；**保留**须写一句理由与解除条件。判据：**路由为零 / 无调用方，但代码仍注册、仍被测试维护的，是「保留」不是「已下线」**——写「已废弃」而实体还在，等于没人负责删它，下一期它会变成新人要读懂的历史包袱。`supersedes` 为空写「无」。

禁止在 PR description 中包含凭据。若推 PR 前发现凭据（PAT / token / 密码 / 私钥 / API key）已被写入代码或 commit：立即从 commit 中移除、通知相关人撤销该凭据，清理干净前不推 PR。

**安全敏感预检（合并前唯一人工门）**：本批次任一任务改动触及下列**高风险类别**之一，且当前 develop 执行人无 `architecture` discipline 授权 → **不自动合并**，escape-hatch 浮给用户：等有 `architecture` discipline 的人裁决后再合并。判据 = 这类改动若 AI 独审与测试同时漏判，将零人工审入 master，且后果不可逆 / 无权威原文可机械验：
> - **权限 / 认证 / 数据隔离**（越权、鉴权绕过、租户串数据）
> - **不可逆数据操作**（数据迁移 / 批量删除 / schema 破坏性变更——错了无法回滚）
> - **金额 / 计费计算**（价格、扣费、对账——算错直接亏钱）
> - **对外不可撤销副作用**（扣款 / 发信 / 短信 / 第三方写入——发出去收不回）
>
> 预检**基于实际 diff 独立判定，不读任务包 `risk` 自报**（决策#29）——逐类对照 `git diff` 的路径与改动内容（鉴权/守卫/中间件文件、迁移/schema 文件、金额/计费字段计算、外发调用），存疑按触及处理。
> **漏标闭环**：预检判定触及，但该任务阶段 B 曾按 standard 降档（sonnet）审查 → 说明 risk 漏标——先按 sensitive **重派默认模型独审**（重审通过才进人工裁决），并改正任务包与 status.yml 的 `risk`。
> 这是合并前唯一保留的人工治理门（其余代码质量已由 per-task 独审兜，决策#24）。改动不触及上述任一类别 → 直接合并。

**合并**：用 `/gitee-ops` 调 merge API 把 PR 合并到 master（develop 自审自合并，无独立 pr-review）。合并失败（冲突等）→ 报告用户，不强合。

### 更新状态（合并后写在 master）

merge API 把 PR 在服务端并入 master。切回 master 拉取后，把状态一步落定为 `[merged]`（无独立 pr-review，develop 自审自合并即终态）：
- 集合内**每个**任务包状态改为 `[merged]`（A 类 `iterations/vN/queue/{task-id}.md` / B 类 `b-queue/{task-id}.md`）
- **仅 source=sprint**：`iterations/vN/sprint.md` 集合内每任务行，状态列改 `[merged]`、**PR 列填同一个 `#N`**（N 为 PR 编号）；其余 source 任务不在 sprint.md，跳过
- 项目根 `status.yml`：集合内每个 task 的 `status` 改 `merged`、`pr` 填 `{N}`；`code_reviews[]` 每任务追加一条。保留兼容字段 `rounds`，填写 `code_rounds/spec_rounds/freshness`；另写 `review_report_dir`、`review_profile_version`（普通任务 `develop-review-profile/v1`；Foundation `foundation-review/v1`）、`implementation_started_at/completed_at`、`review_started_at/completed_at`、`implementation_minutes/review_minutes/spec_minutes`。时间由编排器事件戳自动计算，禁止事后估算；issues 保留稳定 finding id、dimension 与 type/reachability/impact/action。两类轮次与三类墙钟不得互相冒充。
  在提交终态前，对集合内每个任务运行 `node scripts/check-sprint.js --review {task-id}`；缺 preflight/report、首轮非 full、targeted 无 finding id/固定 diff、时间账不闭合均先修正，不得靠人工说明放行。该入口不依赖 iteration，B 类同样执行。
  ```bash
  git checkout master && git pull
  node scripts/check-sprint.js --review {task-id}   # 集合内逐个执行，全部通过后继续
  git add {集合内任务包文件} {code-review/preflight reports} iterations/vN/sprint.md status.yml   # sprint.md 仅 source=sprint 时含
  git commit -m "chore(sprint): {task-id-list} 标记 [merged]，PR #{N}"
  git push origin master
  ```
> ⚠️ 此处 push master 是 develop 自合并模型的一部分（治理代价已接受）——指**项目仓** master，与 hact-method 仓的 master 推送纪律无关。

### 移交

按 `source` 更新对应追踪文件：
- `source=sprint` → 无需额外操作（PR 号 + `[merged]` 已写入 sprint.md）；同层全部 `[merged]` 后，下游 `generate-integration-tests` 前置即满足
- `source=foundation` → status.yml 把 `foundation` task 改 `merged`、`pr` 填 `{N}`；**把标杆穿透切片登记进 项目根 `reusables.md`**（标"参考实现 / 活文档，新功能照此骨架样式做"）；走骨架完成，下游进 V1 `draft-prd-vN`
- `source=bug / optimization` → 在 项目根 `b-tasks.md` 对应行追加 `PR#{N} 已合并`
- `source=integration / manual-test` → 在 `_meta/sessions/{对应进度文件}` 记录"PR#{N} 已合并，可复测"

```
✅ develop 完成：{task-id-list}（{layer}）已实现、独立审查通过，PR {#N[, #N2, ...]} 已合并到 master。
本会话到此结束。后续动作（联调 / 复测 / 验收）由对应上游会话触发，不在此处继续。
```

🚫 **会话硬边界**：输出上述声明后立即停止。禁止建议"现在可以继续 pinchtab / 复测 / 联调"等后续动作——develop 只负责到代码合并到 master；测试 / 联调 / 验收是独立 task，由对应会话触发，不由 develop 会话延续。

### feedback 检查 / 就地分流

回顾本次实现，识别值得沉淀的发现：
- 遇到 standards 未覆盖的决策（视觉 / 接口边界等）且反复出现
- 上下文重置协议被触发（记录触发原因，供后续调整任务拆分粒度 / context 估量策略参考——估量降低触发概率但不消除，单任务做爆仍走重置）
- 独立审查反复揪出同类问题（可能 standards / checklist 有空缺）
- 独审「建议」级 finding 中需**跨期处理**的（非本 PR 必修）：
  - ≤5 行且原因显而易见 → 直接修复（在 master 追加 commit），标记 `[x]`
  - 较复杂 → 评估规模：≤3 文件且改动独立 → 建议走 B 类快速通道；否则入 项目根 `backlog.md`（格式：`- [ ] {日期} | [CR-建议] {描述} | {文件路径}`）
- 无发现 → 跳过

**反馈去向按 `source` 分**：

| source | 去向 |
|---|---|
| `sprint` / `integration` / `manual-test`（A 类）·**规范该怎么改** | 写入 项目根 `feedback.md`，标明候选规则的 applies-if 与重复适用证据；下期先过 Standards 准入。跨切面不变式缺口明确投 Foundation，不把事故叙事直接塞进 Standards |
| `sprint` / `integration` / `manual-test`（A 类）·**本期代码的具体缺口** | 写入 项目根 `backlog.md`（格式：`- [ ] {日期} \| [欠账] {描述} \| 源：develop {vN} {task-id}`）。指本期该有而无人做的东西：**上期有的能力本期没了**（入口/选项/路径回归）、**跨包交集无人认领**（本包不做、也没见别的包做）、**standards 或 foundation 声明的约束在代码里没有落地手段**。**不写进 feedback.md**——feedback 的出口在 `wrap-up-iteration`（G5 之后），本期验收前拦不住任何东西；`[欠账]` 由 `manual-test` 会话启动读入，G4 前必过一遍 |
| `bug` / `optimization`（B 类） | **就地分流**：当场誊入本人个人 notes（`../hact-notes-{name}/notes.md`）：编码规范 → `[规范]`、自检漏项 → `[checklist]`、流程 / 方法论问题 → `[方法论]`；项目架构决策 → 项目 `decisions.md`；无价值 → 不记。誊入后在 notes 仓 commit + push（不碰 hact-method） |

> 写入项目 `decisions.md` 前先看活跃条目是否已超过 30 条，或最早条目所属迭代是否已过去 5 期以上；若触发阈值，先按文件头约定把纯历史/已取代条目归档到 `decisions-history.md`，再追加本次决策。

---

## Subagent 使用

| 角色 | 触发 | 任务 | 失败处理 |
|------|------|------|---------|
| **执行 subagent** | 主循环每任务阶段 A | 自读上下文 → 读懂 → 计划+复用 → 写+自绿，返回结构化结果 | 见下方失败协议 |
| **独立审查 subagent** | 主循环每任务阶段 B | 读对应 brief、自读权威原文、按证据分类 finding | 失败则主线重派；连续失败按审查 loop 超界处置 |
| **global seam review subagent** | 本期最后一个 sprint 集合全量绿后 | 只审包间归属、调用方可达、退役、共享定义与组合终态 | scope gap 新开任务，不回灌无关 per-task 重审 |
| 子模块 subagent | 阶段 A 内（>5 文件 / 跨模块） | 实现单个模块，返回代码 | 由执行 subagent 内部处理 |
| Explore | 阶段 A 复用检查 / reference 不足 | 读 reusables.md / 扫周边文件（≤20 行摘要；纯读取+摘要，指定 `model: "haiku"`） | 失败则执行 subagent 直接读 |

**执行 subagent 失败协议**：
1. 同一问题三次失败 → 执行 subagent 返回 `status: blocked` + `blocked.detail`（含已完成文件 / 卡点 / 关键决策）
2. 主线带上更多上下文重派一次
3. 再次失败 → 触发**上下文重置协议**

**上下文重置协议**（出现以下任一情况触发）：
- 执行 subagent 二次重派后仍失败 / 审查 loop 超界且 escape-hatch 无解
- 实际改动文件超出 `files` 清单 3 个以上
- 调试轮次 > 20 轮
- 用户临时追加新需求

重置流程：
1. 在 `_meta/sessions/develop-{task-id}-progress.md` 写 context-state：
```yaml
context-state:
  task-id: {task-id}
  completed-files: [...]
  blocked-at: "{卡在哪里}"
  key-decisions: [...]
```
2. 将该任务包回 `[可取]`，写阻塞原因（其余已通过审查的任务保留进度）
3. 告知用户：「{task-id} 遇到阻塞，已回到 [可取]，建议后续开新会话重新拾取」

---

## 前后端差异

| 维度 | dev-frontend | dev-backend |
|------|-------------|-------------|
| 开跑前人工门 | **前端设计到位确认**（design.md / prototype 覆盖本批次画面） | 无（backend-only 跳过） |
| 执行 subagent 额外加载 | 项目根 `design.md`（**必读全文**）；`prototype.html` 对应交互路径（若存在）；`ux-flows.md` 对应功能段（若存在）| 无 |
| 自绿 checklist | `templates/checklists/frontend-checklist.md`（**三段式**：机械归 lint / type-check / style lint（命令按项目栈）｜可测逻辑写测试｜视觉/交互留走查） | `templates/checklists/backend-checklist.md`（**测试品类清单**：鉴权/边界/错误/契约/并发/安全注入·穿越各写测试） |
| 子模块 subagent 拆分粒度 | 按组件拆 | 按模块拆（controller / service 分开）|
| 独立审查侧重 | AC 忠实 + 机械保真（变量非硬编码）；视觉到位归人工门 | AC 忠实 + 测试品类齐全 + 标准合规 |

---

## 上下文管理

**断点续做**（主循环中途恢复）：
1. 读任务集各任务包，确认 AC
1a. 读 `status.yml` 中本批任务的 `branch` 字段，执行 `git checkout {分支名}` 恢复到正确分支
2. 读 `git diff --stat` + 各任务 `[done]/[taken-by]` 状态，确认哪些任务已通过审查、哪些未完成（以**工作区实际文件为准**）
3. 读 `_meta/sessions/develop-{task-id}-progress.md` 的 context-state（如有）了解卡点
4. 从未完成任务继续，不重做已通过审查的任务

**阻塞于 revise-doc 结论**：本任务依赖的 `revise-doc` 结论尚未下达时，任务保持 `[taken-by]` 不变，在 progress.md 写明阻塞理由，等 `revise-doc` 完成后再继续——不强行推进，也不退回 `[可取]`。
