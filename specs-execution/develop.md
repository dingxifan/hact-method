# exec: develop

> CC 加载本文时，当前任务是从 queue 拾取一个**任务集**，逐任务实现 + 独立审查，推一个 PR **并合并到 master**。
> **执行模型**：主线只**编排**（定标 / 设计门 / 浮决策 / 末端全量 / 提交 + 合并）；每个任务的「读懂→计划→写→自绿」由**执行 subagent** 跑、隔离上下文；每个任务的质量由**独立审查 subagent**（对抗式、自读权威原文）把关，不通过即回炉。人工只守一个门：**前端设计是否到位**。
> **无独立 pr-review 环节**（2026-06-20 砍除）：代码质量由 per-task 独立对抗审查 + 全量绿把关，develop 自审自合并。仅**安全敏感改动**（权限 / 认证 / 数据隔离）保留一道人工裁决（见末端·合并）。

**上下文密度**：中。主线只持编排状态 + 末端全量；per-task 上下文载入下沉到执行 subagent，故**批次可放大**。本 spec 处理**一次会话**，任务集 size ≥ 1：`交付=可并行` 任务共一个 PR；`交付=串行` 任务各自一个 PR，会话内可串行多个（每任务完整跑「主循环+末端」后切回 master，再启下一个）。

---

> **质量模型（三层防线，独审站在绿之上、不是唯一质量线）**：deterministic 绿（build / type / lint / test）先过 → 独立审查做**语义 top-up**（AC 忠实 / do-not 越界 / 标准合规 / 测试忠实）→ 人工只守前端设计到位。

> **🚫 人工门（全自动模型下只剩两处，其余全自动 loop、不逐步等人）**：
> ① **前端设计到位**——frontend 批次开跑前一次性确认（backend-only 跳过）。
> ② **escape-hatch**——执行 subagent 撞 do-not 拿不准 / 信息不足以决策 / 视觉缺口 / 测试反复红时返回 blocked，主线浮给用户。

---

## 会话启动（主线）

**第零步：确认执行层**

```
当前执行层：frontend / backend？
```

🚫 等用户确认（或从任务包 `layer` 字段自动判断后向用户确认）。**`source=foundation` 全栈，跳过本步。**

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

主线派一个 general-purpose subagent，告知 `{task-id}` + layer + 迭代 vN，令其自治完成（隔离上下文）：

1. **自读上下文**（精确加载，不全量）：
   - 任务包全文（A 类 `iterations/vN/queue/{task-id}.md` / B 类 `b-queue/{task-id}.md`）
   - 只读 `relevant-standards` 指向章节（`standards-{layer}.md` / `standards-shared.md` 在**项目根**——跨迭代活文档，非 `iterations/vN/`）
   - 只读 `reference` 列出的文件行号范围，不读全文
   - **frontend 额外**：必读项目根 `design.md` 全文（视觉规格唯一参照）；`ux-flows.md` 对应功能段（若存在，按 title 匹配）；`prototype.html` 对应交互路径（若存在，作交互基准，happy path 之外的分支照原型走通）
2. **读懂**：对照 `acceptance-criteria` 明确本任务要做什么（不再向用户复述确认——理解忠实性由阶段 B 独审兜）。
3. **计划 + 复用**：按 `files` 估规模，>3 文件 / 跨模块则内部按依赖序拆模块；用 Explore 读 项目根 `reusables.md`，已有资产**必须复用、不重造**。`urgency=hotfix` → 走最小化修复路径，不拆模块。
4. **写**：逐模块实现并**落盘**。>5 文件 / 跨模块可再派子 subagent 分模块（frontend 按组件、backend 按 controller/service 拆；属 subagent 内部的事，主线不介入）。
5. **自绿（增量，共享工作树）**：跑 `build` / `type-check` / `lint` / `test`；不可视区 AC 的 Given/When/Then 例子规格（测试脊柱：行为源自 PRD 幕 1、技术精度源自 TRD 幕 2）**1:1 物化成可运行测试**且全绿——这是脊柱例子第一次落成 runnable 形态（守 2026-06-16：runnable 物化在代码存在后；测试随分支携带、不蒸馏）。`build/type/lint` 项目无对应命令 → 跳过该条不阻断。同一测试修 3 次仍红 → 不硬磨，返回 `blocked`（根因疑在 AC / TRD）。
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

> **测试基建缺失**（项目无测试运行器）：执行 subagent 返回 `blocked: 测试基建缺失`。**不静默跳过、不假装通过**——主线上报：不可视区任务**阻塞待补**（先补 项目根 `standards-backend.md`「测试框架约定」+ 项目装运行器，约定由 `draft-tech-design` 维护 Standards 时确立、存量项目迁移时补建）；若用户判定必须先推进（基建一时补不上），明确标记该不可视区 AC **未经测试验证（降级）**、PR「遗留问题」写明、由阶段 B 独立审查 subagent 按 AC 审代码兜底 + 下游 manual-test 验收兜底——**临时降级、非常态**。

### 阶段 B · 独立审查 subagent（对抗式，自读权威原文）

执行 subagent 返回 `done` 后，主线派**全新隔离** subagent 读 `../hact-method-lab/templates/review-briefs/develop-review.md`（`source=foundation` 时改读 `foundation-review.md`），只告知 `{task-id}` + layer + vN。该审查员**自读权威原文**（任务包 / `git diff` / standards 章节 / 测试代码+结果），**绝不接收执行 subagent 的自评 / 总结**（喂自评即丧失独立性，等于自己批自己的作业），对抗式找问题、存疑即判阻断。

**审查 loop（有界）**：
- 审查输出 `findings: []` 或全为「建议」级 → 本任务**通过**，进下一任务（建议项记入 PR「遗留问题」或当场顺手改）。
- 有「阻断」级 finding → 主线把问题清单回传、**重派执行 subagent** 整改 → 整改后**重派审查**。
- 同一任务「审查—整改」loop 3 轮仍有阻断 finding → 不再硬磨，**升级**：根因疑在 AC / TRD 设计层 → 起 `revise-doc`；否则走 escape-hatch 浮给用户。

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

> cross-task 一致性（接口对接、跨任务数据流）只在此跑全量绿验是否冲突，**不重复重审**——端到端正确性留下游 `generate-integration-tests`。

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
```

禁止在 PR description 中包含凭据。若推 PR 前发现凭据（PAT / token / 密码 / 私钥 / API key）已被写入代码或 commit：立即从 commit 中移除、通知相关人撤销该凭据，清理干净前不推 PR。

**安全敏感预检（合并前唯一人工门）**：本批次任一任务改动触及下列**高风险类别**之一，且当前 develop 执行人无 `architecture` discipline 授权 → **不自动合并**，escape-hatch 浮给用户：等有 `architecture` discipline 的人裁决后再合并。判据 = 这类改动若 AI 独审与测试同时漏判，将零人工审入 master，且后果不可逆 / 无权威原文可机械验：
> - **权限 / 认证 / 数据隔离**（越权、鉴权绕过、租户串数据）
> - **不可逆数据操作**（数据迁移 / 批量删除 / schema 破坏性变更——错了无法回滚）
> - **金额 / 计费计算**（价格、扣费、对账——算错直接亏钱）
> - **对外不可撤销副作用**（扣款 / 发信 / 短信 / 第三方写入——发出去收不回）
>
> 这是砍除 pr-review 后保留的唯一治理门（其余代码质量已由 per-task 独审兜）。改动不触及上述任一类别 → 直接合并。

**合并**：用 `/gitee-ops` 调 merge API 把 PR 合并到 master（develop 自审自合并，无独立 pr-review）。合并失败（冲突等）→ 报告用户，不强合。

### 更新状态（合并后写在 master）

merge API 把 PR 在服务端并入 master。切回 master 拉取后，把状态一步落定为 `[merged]`（无独立 pr-review，develop 自审自合并即终态）：
- 集合内**每个**任务包状态改为 `[merged]`（A 类 `iterations/vN/queue/{task-id}.md` / B 类 `b-queue/{task-id}.md`）
- **仅 source=sprint**：`iterations/vN/sprint.md` 集合内每任务行，状态列改 `[merged]`、**PR 列填同一个 `#N`**（N 为 PR 编号）；其余 source 任务不在 sprint.md，跳过
- 项目根 `status.yml`（机器侧契约，见 `../hact-method-lab/skeleton/07-status-contract.md`）：集合内每个 task 的 `status` 改 `merged`、`pr` 全填同一个 `{N}`；并向 `code_reviews[]` **每任务追加一条审计留痕**（替代旧 pr-review 写入）——`conclusion: 通过`（独审已通过才合并），`issues` 填独审剩下的「建议」级 finding（映射 `severity: 建议`），无则 `[]`
  ```bash
  git checkout master && git pull
  git add {集合内任务包文件} iterations/vN/sprint.md status.yml   # sprint.md 仅 source=sprint 时含
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
| `sprint` / `integration` / `manual-test`（A 类） | 写入 项目根 `feedback.md`（格式：`{日期} \| {发现} \| 建议在 {standards-frontend/backend/shared} 哪节补充`），由本迭代 `wrap-up-iteration` 第二步统一分流 |
| `bug` / `optimization`（B 类） | **就地分流**：当场誊入本人个人 notes（`../hact-notes-{name}/notes.md`）：编码规范 → `[规范]`、自检漏项 → `[checklist]`、流程 / 方法论问题 → `[方法论]`；项目架构决策 → 项目 `decisions.md`；无价值 → 不记。誊入后在 notes 仓 commit + push（不碰 hact-method） |

---

## Subagent 使用

| 角色 | 触发 | 任务 | 失败处理 |
|------|------|------|---------|
| **执行 subagent** | 主循环每任务阶段 A | 自读上下文 → 读懂 → 计划+复用 → 写+自绿，返回结构化结果 | 见下方失败协议 |
| **独立审查 subagent** | 主循环每任务阶段 B | 读 `develop-review.md`（`source=foundation` 时 `foundation-review.md`）、自读权威原文、对抗式审，返回问题清单 | 失败则主线重派；连续失败按审查 loop 超界处置 |
| 子模块 subagent | 阶段 A 内（>5 文件 / 跨模块） | 实现单个模块，返回代码 | 由执行 subagent 内部处理 |
| Explore | 阶段 A 复用检查 / reference 不足 | 读 reusables.md / 扫周边文件（≤20 行摘要） | 失败则执行 subagent 直接读 |

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
| 自绿 checklist | `templates/checklists/frontend-checklist.md`（**三段式**：机械归 lint/vue-tsc/stylelint｜可测逻辑写测试｜视觉/交互留走查） | `templates/checklists/backend-checklist.md`（**测试品类清单**：鉴权/边界/错误/契约/并发/安全注入·穿越各写测试） |
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
