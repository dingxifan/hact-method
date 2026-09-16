# exec: develop

> 运行时加载本文时，当前任务是从 queue 拾取一个**任务集**，逐任务实现 + 独立审查，推一个 PR **并合并到 master**。
> **执行模型**：主线负责整个已授权任务集，可直接理解、实现、自测与整改；仅将独立且有收益的工作委派。每个开发任务保留独立审查，主线按固定快照与原始契约处理 finding、集成、提交和收尾。
> **无独立 pr-review 环节**（决策#24）：代码质量由 per-task 独立证据审查 + 全量绿把关，develop 自审自合并。仅安全敏感改动保留一道人工裁决。

**长程执行**：授权范围可跨多次上下文压缩；当前只展开一个可验证单元的必要细节。任务、Git、progress 和审查报告持久保存工作状态，聊天摘要只帮助定位。批次/PR 粒度按依赖和交付需求选择，不以压缩次数决定停止。

---

> **质量模型（三层防线）**：deterministic 绿先过 → 独立证据审查按当前风险面做语义 top-up → 前端设计与安全敏感合并按人工门裁决。规格漂移、示例错误和 scope gap 走各自旁路，不伪装成代码缺陷。

> **人工边界**：开跑前的范围/执行层选择、wave 选择与前端设计确认按下文处理；合并前保留安全敏感裁决。运行中的 `blocked` 先按 escape-hatch 分类，不能仅凭子单元状态直接要求用户接手。已确认范围内的正常实现、审查、整改和末端动作不逐步等人。

## 主线接续协议

本轮以用户已授权的任务集为执行范围。明确要求完成已确认 sprint 时，可覆盖该 sprint 在授权时的任务集合并按依赖持续推进；仅指定 layer 不等于授权清空队列。新增任务、改契约或部署仍须对应授权。授权范围与当前批次分别记录；只认领当前可执行批次，未就绪任务保留原状态。范围和必需确认已有明确结论且适用条件未变时沿用，不重复询问；范围、设计或风险变化时重新核对应边界。

| 收到的结果 | 主线下一动作 |
|---|---|
| 主线实现完成或单元返回 `done` | 核实际改动、测试结果与未满足 AC，按阶段 B 固定快照并立即派审；`done` 不是 develop 完成 |
| 审查返回 finding | 按 finding action 分流；授权内代码整改立即重派，随后 targeted 复审；不能用进度汇报替代动作 |
| 当前任务审查通过 | 记录证据，按 individual / batch / wave 既有顺序进入末端或下一任务 |
| 测试或隔离单元仍在运行 | 接收结果前保持等待；可做不冲突的已授权编排工作，不重复派发同一写入单元 |
| 工具中断或子单元 `blocked` | 核实际工作区、单元状态和证据，按 escape-hatch 恢复或升级 |

中途收到「现在呢」「在复审吗」等进度询问时，简短回答实际阶段后继续原任务；只有用户明确要求暂停、取消或仅报告时才停止推进。阶段汇报使用「实现已返回 / 独审通过 / 正在验证」等局部结论，最终完成声明只在结束判据满足后输出。

---

## 实现边界

- 不擅自改变已确认的业务行为、项目技术选择与数据不变量；等价实现可自行选择，改变约束须先修对应权威对象。
- 不把未经运行时校验的外部输入或持久化 JSON 当作可信契约；不让错误在转换层静默丢失，不以成功响应掩盖失败。
- 不泄露凭据或隐私，不把验证环境连到生产数据，不以删断言、跳测试或扩大白名单换取通过；必要验证未运行须明确说明。
- 同一业务口径已有权威实现时复用；合理的新实现不为遵守旧文件名或 helper 写法而强行改造。实现方法由执行者决定，注释解释约束与必要取舍，不写过程流水账。

## 会话启动（主线）

**第零步：确定进料与执行层（⚖️ 默认判定）**

用户点名 `b-queue/{task-id}.md` 或 task-id 形如 `*-b-*` 时，先读该任务包，确定 `source=bug/optimization` 与 layer；B 类不要求存在活跃 iteration。其余进料读 `status.yml tasks[]` 的 layer 与 status：
- 用户开场已指明层 → 按用户指定，播报即可
- 仅一个 layer 有 `[可取]` 任务 → 直接定层，播报「当前执行层：{layer}（唯一有可取任务的层）」后继续，不等待
- 两层都有 `[可取]` 任务且用户已授权完整 sprint → 按依赖自动选就绪任务；只有范围尚未确定时 → 🚫 问「当前执行层：frontend / backend？」等确认

**`source=foundation` 的执行层由 foundation-design 的真实切片决定，跳过本步。**

**Gate 前置检查（按 source）**

确认 `source` 字段：
- `source=sprint` → 读 `status.yml iterations.vN.gates`，确认 G3 已签。未签则阻断：「⚠️ G3 未通过，Sprint 尚未规划，请先完成 plan-sprint。」
- `source=foundation` → 读 `status.yml iterations.v0.gates`，确认 G2 已签。未签则阻断：「⚠️ G2(v0) 未通过，地基设计未确认，请先完成 draft-foundation。」**并改走下方「source=foundation 进料」块**。
- `source=integration` / `manual-test` / `bug` / `optimization` → 无 Gate 前置，直接继续

**source=foundation 进料（V0 走骨架特例）**

`source=foundation` 时会话启动改走本块——**不走** sprint 拾取/认领/批次分支/前端设计门；**主循环 + 末端照常**，仅三处替换：
- **判定 foundation 模式**（无任务包、无 source 字段可读）：由项目状态判——`status.yml iterations.v0.gates` G2 已签 **且** `status.yml` 无 `[merged]` 的 `foundation` task（即项目仓共同启动协议 Step 1「先判 V0」推断出的本模式），或用户明示走骨架。
- **不问执行层**：按 foundation-design 的真实切片覆盖必要层；不为凑“全栈”创建不存在的 frontend/backend，跳过「第零步」。
- **建造单元 = `iterations/v0/foundation-design.md`**：对象 = 其中获准的最小「地基件清单」+ 一根「标杆穿透切片」；标为 V1+ 的关注点和任何“V0 额外交付”均不实现。获准件互锁时串行建在单条 `foundation-v0` 分支、共一个 PR：
  ```bash
  git checkout -b foundation-v0   # 从 master 切
  ```
  status.yml：`iterations.v0` 块已由 draft-foundation 建（仅 G2）；此处只往 `tasks` **追加** `id: foundation`、`iteration: v0`、`type: develop`、`source: foundation`、`status: taken-by`、`branch: foundation-v0`（按 status 模板块式写入）（不重建 v0 块）。
- **跳过前端设计门**：视觉地基获准进入 V0 时只建占位框架；未获准时标杆页面保持最小无装修形态，不预装完整主题。两者都不实现具体画面 → 无 design.md 覆盖可对、无前端设计人工门。
- **三处替换**（其余主循环 / 末端不变）：
  ① 阶段 A 执行者 **自读 `foundation-design.md` 对应件 + `foundation.md` 对应 V0 行 + 相关项目约束与测试入口**（替代任务包）；自绿照常（build/type/lint/test + 标杆切片端到端跑通）。
  ② 阶段 B 独审读 **`../hact-method-lab/templates/review-briefs/foundation-review.md`**（替代 develop-review：验强制边实际档≥应有档 + 命门 + 标杆质量）。
  ③ 末端状态更新走下方「`source=foundation`」分支（无 sprint.md；登记标杆切片）。
> 安全敏感预检（末端·合并前）：按实际 diff 判断。若 V0 含数据隔离、鉴权、迁移等安全敏感改动，触发 architecture 裁决门；不因 `source=foundation` 名称本身自动触发。

**source=bug/optimization 进料（B 类）**

- B 类由 `dispatch-new` 写入 `b-queue/` 后，统一从本 `develop` 入口拾取；一次只取用户点名的一个 task-id，不与 sprint 批次混跑。
- 认领前运行 `node ../hact-method-lab/templates/scripts/check-b-task.js b-queue/{task-id}.md --root .`，直接使用已同步的方法论当前版。另人工核 `contract-impact=none`，且 `files` 不含已确认 PRD/TRD/Foundation/project 技术约束/design、迁移/schema/公共契约路径；命中即阻断并转 `revise-doc` 或新 A 类迭代，不得边写代码边改契约。
- 无 Gate、无 sprint.md、无 iteration；任务包路径为 `b-queue/{task-id}.md`，审查/预检记录目录为 `b-reviews/{task-id}/`，分支名与 PR 粒度均为 `{task-id}`。
- 状态 `[可取]` 时认领并同步 `status.yml`；`[taken-by]` 时按断点续做对账。状态已 `[done]/[merged]` 则先说明现状，不重复实现。
- 主循环、freshness preflight、独立审查、末端全量和状态更新照常；所有文中的 vN 参数对 B 类替换为“无 iteration”。

**拾取任务（source=sprint）：形成任务集与当轮执行形态**

读 `status.yml tasks[]`，找当前迭代/layer 且状态为 `可取` 的任务，按 `delivery` 字段分两路。候选任务只有在以下条件满足时才算可拾取：其 `depends_on` 要么已 `[merged]`，要么同时进入当前交付批次且排在它之前；跨 layer 或未纳入本轮的依赖必须先合并。**两路共用估量标准**：按依赖闭合、独立验证与交付时机取当前单元/批次。余下已授权任务继续留在 progress 的任务集内，当前批次收尾后自动拾取；压缩本身不截断授权范围。跨 layer 依赖先完成并合并，现有 wave 仍只含同层标准风险任务。

- **交付=串行**：取本 layer 全部 `[可取]` 串行任务，按 task-id 升序，估量后取头部前缀。每个串行任务各自一个 PR，会话内串行完成（每任务跑完「主循环+末端」后切回 master，再启下一个）。
- **交付=可并行**：本 layer 无 `[可取]` 串行任务时，取本 layer 全部就绪的 `[可取]` 可并行任务，按依赖拓扑序，估量后取依赖闭合的前缀子集。全部可并行任务共一个 PR。
- **阻断**：本 layer 有 `交付=串行` 任务处于 `[done]`（PR 已推未合并到 master）且有 `可并行` 任务依赖它 → 停止：「⚠️ {task-id}（串行）PR 尚未合并到 master，依赖它的可并行任务暂不可拾取，请先完成该串行任务的 develop 会话（含合并）。」

形成候选集合后、认领前运行：

```bash
node ../hact-method-lab/templates/scripts/check-sprint.js --ready {task-id-1},{task-id-2},... .
```

非 0 表示存在未合并外部依赖、集合未依赖闭合或顺序错误；重新选集，不得先认领再等依赖。

**单人 wave 判定（只改变本轮执行形态）**：候选集中有至少 2 个 `交付=串行` 任务时，先按下文“有效 risk”同一语义扫逐包计算并回写漏标，再运行 `node ../hact-method-lab/templates/scripts/check-sprint.js --wave-ready {task-id-list} .`。只有以下条件全满足才给 wave 选项：① 全部是 `source=sprint`、同一 layer、有效 risk=standard；② 依赖都在本集合拓扑内或已 merged；③ 无集合外 active consumer；④ 估量线允许整组在一次会话完成；⑤ 用户确认没有其他人/会话等待中间任务进入 master。

```
本轮可选单人 wave：{task-id 按拓扑序}。
逐包实现、freshness、固定 diff 和独审不变；只把末端全量检测、PR、合并和状态提交合为一次。
当前无已登记的外部消费者；请确认「无其他会话等待中间合并」，并选择 [wave / 独立 PR]。
```

用户选 `wave` → `execution_mode=single-operator-wave`；其余情况 → `individual`。这不是把 `交付=串行` 改成可并行。`source=foundation`、B 类和任一 sensitive 任务不适用 wave；每个任务写第一行代码前及固定 diff 形成后都重算有效 risk，防漏标晚发现。

估量完成后直接通知用户并进入认领（无需等确认）：
```
已授权任务集：[task-id...]；当前交付批次：[task-id...]（{individual：串行任务各自 PR / 可并行共一 PR；single-operator-wave：一条分支、一个 PR}，估约 {N} 处改动）{若分批：，剩余 [id...] 在本次授权内自动接续}
```

**认领**：只在项目根 `status.yml` 把每个 task 的 `status` 改 `taken-by`、`assigned_to` 填 `{user}`（机器侧契约，见 `../hact-method-lab/skeleton/07-status-contract.md`）。

**分支锁定**：

- **可并行任务集或 `single-operator-wave`**（认领时立即建一条分支）：`{layer}-{batch|wave}-v{N}-{id1}/{id2}/...`（依赖序，末元素后无尾斜杠）
  ```bash
  git checkout -b {上方实际分支名}   # batch 用 batch，wave 用 wave；从 master 切
  ```
- **串行任务**（每个任务开始时建各自分支，不提前建全部）：`{task-id}`
  ```bash
  # 开始当前串行任务时：
  git checkout -b {task-id}   # 从 master 切
  # 当前任务合并后，切回 master 再为下一个建分支：
  git checkout master && git pull
  ```

> 禁止从其他任务分支切（禁止 stacked PR）。前置任务未合并且不在同一批次时，本任务不可拾取；不得从前置任务分支绕过就绪检查。
> 多会话并行时同名分支已存在 → git 立即报错：停止，告知用户另一会话已认领同批任务，澄清后再继续。

`branch` 字段写入 status.yml：可并行任务或 wave 认领时统一写入；individual 串行任务随各自分支建立时逐步写入。wave 的每个任务保留原 `delivery=串行`，仅共同指向本轮分支。认领 commit：

```bash
git add iterations/vN/sprint.md status.yml
git commit -m "chore(sprint): 认领 {task-id-list} [taken-by: {user}]"
```
（push 随首次代码 commit 一起推送，无需单独 push）

**freshness preflight（当前任务写第一行代码前）**

任务进入主循环时逐个执行，不在批次开头一次性为全部任务预写。这样同分支批次中，前一任务已通过审查的 tree 会成为下一任务的 `base_tree`，两棵 tree 的 diff 只含当前任务。只查依赖合并后可能变化的面：

- 本批首任务先运行 `node ../hact-method-lab/templates/scripts/check-sprint.js --worktree-from-reports none . --progress {本轮task-id-list}`；
- 后续任务用此前每个已通过任务的最终 round report（逗号分隔）替换 `none`，保留 `--progress` 当前交付批次。检查器只允许这些报告声明的 accepted changed files、各自 review 目录中的审计产物，以及显式任务的未暂存 `_meta/sessions/develop-{task-id}-progress.md`；其他 dirty path 或任一 stash 均阻断。progress 不得暂存进实现 tree，最终作为收尾记录单独提交；已忽略的本地 progress 按项目现有策略保留，不强制入库。

- `files` 是否仍是当前落点，`reference` 的符号/章节/行号锚是否仍存在；
- 上游是否已完成本包原计划新建的机制，或改变了接口、状态、阈值；
- 每条 AC 的 intent/oracle 是否仍一致，example 能否按当前 oracle 复算；
- `do-not/escalate-if` 的冲突是否已被上游裁决，承接方是否真实存在且未 merged；
- `supersedes` 对象是否已删除、重新出现调用方或已由别包退役。

**先建审计锚**：固定 Git 基线必需，事件计时可选且不事后估算。A 类记录写 `iterations/vN/code-reviews/{task-id}/preflight.md`，B 类写 `b-reviews/{task-id}/preflight.md`，格式用 `templates/review-briefs/develop-preflight-record.md`。确认工作树不含本任务外改动后，记录固定 `base_ref=$(git rev-parse HEAD)` 与当前 `base_tree=$(git write-tree)`。

未命中则记 `freshness: pass`、`timing: before-code` 和一行正常摘要后继续，不逐面填表。命中时才展开漂移面、证据与路由，并在改代码前按根因处理：`example-error / contract-drift` 修任务包或发 `revise-doc`，`scope-gap` 补承接任务；只复核变化的契约，不跑代码审查。修订闭合后重新 preflight；需用户裁决时返回 blocked。结束时写 `result`；时间戳可选，不补估或强制对齐。此处产生的轮次计入 `spec_rounds`，不计 `code_rounds`。

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

> **可并行任务集或 `single-operator-wave`**：对每个任务按依赖拓扑序串行走「工作树白名单核对 → 该任务 freshness preflight → 实现与自测 → 独立审查」一轮（被依赖的先做，**不并行**——串行单工作树无写冲突）。当前任务通过后保留其 accepted implementation tree；其审计目录保持未暂存，下一任务由白名单检查识别，不把报告混入 `base_tree`。下一任务再取新的 preflight `base_tree`，不得复用批次起点。全部通过后进末端（一次）。**individual 串行任务多个**：每个任务各自串行完成「preflight + 主循环 + 末端」，末端后切回 master 再启下一个。主线只加载当前单元的必要原文；已完成单元只保留契约与证据指针。共享工作树上的单元仍串行，委派不改变此边界。

> **wave 的任务级 commit**：每个任务独审通过、按其 fixed diff 再算有效 risk 仍为 standard 后，提交该任务 accepted implementation、preflight 与完整 round 报告链，形成稳定的 `{task-id} → commit/report` 边界；一个 PR 可含多个任务 commit。审计物进 commit 后，下一任务 fixed diff 仍从新 base tree 起，不会混入本任务实现 diff。该边界用于断点恢复和必要时拆 prefix，不取消 per-task review。

**wave 中途升档/拆分 transaction**：某任务 fixed diff 令有效 risk 升 sensitive 时立即停止，不把它并入 wave PR，并按 sensitive 补充 sensitive 独审。此前通过任务的 implementation + 审计物均已在 per-task commits：① 以最后通过 commit 建 prefix 分支，在独立 worktree 对每个 prefix task 运行 `--review-chain`（合并前审查链，不依赖终态 `code_reviews[]`）与末端全量；② 在原 dirty 工作树执行 `git switch -c {当前 task-id}`（保留在制品、建立真实 individual branch），并验证当前 branch 正是该 task-id；③ 在 prefix worktree 与原工作树写同一 split 状态：prefix `[done]`，当前 `[taken-by]` + branch={task-id}，未开始任务全部 `[可取]` 且清空 assigned_to/branch；④ prefix PR 合并后把 prefix 任务落 `[merged]` 并写终态 `code_reviews[]`。无 prefix 时跳过①④，仍执行②③。不得 stash、还原或删除在制品；任一步失败则整组保持原 wave 状态，不做半套状态写入。

### 阶段 A · 实现（读懂 → 计划 → 写 → 自绿）

preflight 通过后，主线直接实现。独立且足够大的子任务可委派，提供任务、写集、契约位置和完成条件；按任务依赖分解，不按文件数触发。委派需要的上下文继承方式见项目 AGENTS；无可用代理时主线实现照常。

1. **自读上下文**（精确加载，不全量）：
   - 任务包 normative core（A 类 `iterations/vN/queue/{task-id}.md` / B 类 `b-queue/{task-id}.md`）；non-normative appendix 仅在疑点需要历史解释时查
   - 按 `reference` 读取 project.md 技术约束、Foundation、TRD/共享契约与检查配置的必要章节；契约锚有缺口则沿真实调用链核实
   - **frontend 额外**：读 `design.md`「全局视觉基线」+ 任务包 `reference` 点名的页面规格；存量 design 或任务包未给稳定页面锚时才全文读取（视觉规格唯一参照）。再读 `ux-flows.md` 对应用户任务 U-id / 场景 S-id（若存在，按 reference 的 U/S 锚读取）与 `prototype.html` 对应交互路径（若存在，作交互基准，happy path 之外的分支照原型走通）
2. **读懂**：以每条 AC 的 `intent` 为目标、`oracle` 为判据；普通 example 仅帮助理解，冲突时返回 `example-error`，不得用代码迁就。只有 `golden: true` 的 example 是字面契约。
3. **计划 + 复用**：按业务闭环和依赖确认当前单元。直接查相关 reusables 和真实调用点；独立且较大的调查才委派。已有同语义权威实现优先复用；不同职责不得仅因写法相似强行合并。hotfix 保持必要修复范围。
4. **写**：主线或获准单元将代码直接落入对应工作树。独立写入可分 worktree 并行，但共享索引/状态文件/数据库/端口须隔离或串行。子单元返回变更路径、验证与未完成项，不在消息中搬运整份代码。
5. **自绿（首次实现，共享工作树）**：跑本任务目标测试与必要的 `build` / `type-check` / `lint`；不可视区 AC 的 intent/oracle 落成有辨别力的 runnable test，`golden: true` 的 example 再字面 1:1 物化。普通 example 不制造额外字面测试义务。最终交付前保留一次必要全量/集成验证；同版本同环境的有效结果直接复用，不重复运行；整改轮默认只跑 finding 反例与受影响回归，不在每轮重复整链。无对应命令则跳过。同一测试修 3 次仍红时返回 blocked，先查 oracle/contract，不硬磨代码。
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


> **测试基建缺失**（项目无测试运行器）：执行者记录 `blocked: 测试基建缺失`。**不静默跳过、不假装通过**——主线上报：不可视区任务**阻塞待补**（先核 project.md 技术层和脚本入口，并补装对应测试运行器）；若用户判定必须先推进（基建一时补不上），明确标记该不可视区 AC **未经测试验证（降级）**、PR「遗留问题」写明、由阶段 B 隔离审查单元按 AC 审代码兜底 + 下游 manual-test 验收兜底——**临时降级、非常态**。

### 阶段 B · 隔离证据审查单元（自读权威原文）

阶段 A 完成后进入独立审查。A 类 round report 写 `iterations/vN/code-reviews/{task-id}/round-{NN}.md`，B 类写 `b-reviews/{task-id}/round-{NN}.md`，格式用 `templates/review-briefs/develop-review-round.md`。

> **撞到本任务外的改动时怎么办**（实测 2026-08-30，三个仓同时中招）：另一个会话在同一工作树里提交了与本任务无关的改动，diff 因此不干净。两条合法出路——
> - **让它成为合法基线**：若那条误落 commit 恰好以本任务的认领 commit 为父，直接把 `master` 快进到它并推送，本任务分支据此重锚基线，被审 diff 就只剩本任务文件。**无历史改写、无重复 commit、原 SHA 与作者信息保留**，是最省事的一种。
> - **父不在 master 时**：只能由改动方 `cherry-pick` 到 master，本任务分支保留副本（合并时是空 diff，不冲突）。
>
> 两种都要在 preflight 留痕里如实记一笔「基线重锚 + 原因」，不得把它混进本任务的交付叙述。
>
> **判据：保留，不得删除或还原。** 本规范说的「分离工作树」意思是**别把别人的改动混进你的 diff**，不是「清掉它」。改动若尚未 commit（躺在工作树里、无 commit 可归因），**原样留在原地不提交**即可满足这个目的——`git add -- {本任务 changed-files}` 本就只暂存本任务文件，别人的改动自然不会进你的 diff。
> 不得用 `git checkout --` / 删文件 / `git stash` 处置它：**留着不提交是可逆的，还原和删除是不可逆的**，两者代价差一个量级，而对「不混进 diff」这个目标的贡献完全相同。实测 2026-08-30：一个会话据本条字面依据把来源不明的 `scripts/pre-commit-hook.sh` 改动 `git checkout --` 还原、并删掉了新脚本（虽留了底到 scratchpad），另一个会话遇到同样情况选择「既不提交也不回退、原样留着并上报」——后者是本条要求的处置。
> 另：**文件 mtime 不是归因证据**。它只能证明「那时被写过」，证明不了「谁写的」；据 mtime 落在自己执行单元运行窗口内就断定是自己人所为，实测已致误判。归因不明时按上一段留着并上报，不猜。

> **「工作树无污染」必须连 `git stash list` 一起看。** 除上方 `--progress` 明确列出的未暂存进度文件，首任务要求 index/worktree/stash 全空；同分支后续任务再允许两类已归因状态：① 前序已通过任务 final report 的 `changed_files`（accepted implementation，已暂存）② 这些任务各自 review 目录里的未暂存审计产物。除此之外任何 dirty path 都是污染；任一 stash 都阻断。不要凭肉眼读 `git status`，统一用上方 `--worktree-from-reports` 当前版检查器。

**固定审查对象**：确认只有本任务 changed-files 后，精确 `git add -- {changed-files}`，以 `git write-tree` 取得 `reviewed_tree`，并按 `git diff --binary {reviewed_base} {reviewed_head}` 的原始字节计算 SHA-256。首次 `reviewed_base` 取**当前任务** preflight 的 `base_tree`；整改轮取上份 report 的 `reviewed_head`，当前树为新的 `reviewed_head`。审查员只读 `git diff {reviewed_base} {reviewed_head}`，不得用会变化的裸 `git diff` 代替报告基线。发现本任务外改动则 blocked，先分离工作树。B 类在派审前另运行 `node ../hact-method-lab/templates/scripts/check-b-task.js {task-package} --diff {reviewed_base} {reviewed_head} --root .`，用方法论当前版检查器对实际固定 diff 复核共享契约边界；非 0 先查字段/范围缺口；实际越出 B 类边界则退出并处理上游决策，不得带失败派审。

**首次 full review**：主线以 `fork_turns="none"` 派不继承实现历史的 Codex 审查子代理（实际接口不支持空历史时报告缺口），读 `develop-review.md`（`source=foundation` 时改读 `foundation-review.md`），只告知 task-id、layer、迭代、有效 risk、固定 base/head 和权威输入位置。审查员自读权威输入，按 brief 与实际改动确定检查范围；模式、报告和升级条件按轮次模板。

**整改 targeted review**：默认接续未参与实现的原独立审查员，传 prior report、未关闭 finding ids、上一/当前 reviewed tree、必须重跑的 counterexample/regression；不可用时用空历史新审查员按前次独立报告接续，不为等待原单元阻塞。可核执行者提供的原始日志，不采信自评替代验证，不传实现辩解。核目标 finding、修复增量与受影响调用链；局部新发现可处理，扩审须指出哪些结论因何变化失效。升级条件与轮次上限统一按 round 模板，新增文件/模块本身不触发 full。

**送审与补证**：首次送审前完成本包已有 AC 的必要目标验证；共享契约检查实际消费者，事务等真实边界不能以 mock 替代。无需新增检查表。环境未启动须先按既有恢复规则补齐必要验证，不把开发欠账交独审。审查发现必要证据缺口后，代码未变时按 round 模板的 evidence_only 入口补原始运行证据并由独立审查员核验；仍计 code_rounds，仍受三轮上限。实现或测试改变则审实际增量。新报告启用 bounded-v1，旧报告不重写；字段和指纹用 build-review-anchor.js 生成。

逐轮计时可选，不要求补齐或对齐；round report 本身不计入被审实现 tree，最终随状态提交。

**风险与模型**：按任务与固定 diff 核安全敏感四类；任一命中则有效 risk 为 sensitive，修正任务包/status，不因模型更强而降风险。模型与推理默认继承当前会话；已批准的角色覆盖配置才生效，不按旧型号表猜能力。风险升高时独审须覆盖新增安全边界，未覆盖前不得合并。

**finding 路由与有界复审**：

先按 `templates/review-briefs/review-scope.md` 核 finding 是否属于规范、错误或外部风险。仅依赖开发人员恶意/有意绕过的 finding 交隔离审查单元纠正范围并留痕关闭，不进入代码整改或自动 backlog；已有范围内缺陷仍按下表处理。范围纠正不清零已用轮次。

| action | 动作 | 复审范围 |
|---|---|---|
| `fix-code` / `fix-mechanism` | 主线修对应稳定 finding ids；需要时接续已有执行单元 | 下一轮 `targeted` 只复审该行为、反例、受影响回归与增量 diff；报告触发 `escalate_to_full` 才追加 full |
| `revise-doc` / `downgrade-claim` | 修任务包或发 `revise-doc`；代码文件数必须为 0 | 只复核 contract/claim 一致性，不重跑完整代码审查；计 `spec_rounds` |
| `global-gap-review` | 核承接方并创建补缝任务；A 类把组合证据移交联调，B 类/V0 按自身契约与授权边界处理 | 原包可独立合规时不打回；不可用待联调替代本包必要验证 |
| `backlog` | 记入遗留/waiver | 不重审 |
| `request-evidence` | 缺运行证据由主线补齐、审查员独立核验；缺判断依据由审查员补反例或发规格澄清 | 无代码变化用 evidence_only targeted；有实现/测试增量用普通 targeted；不清零轮次 |

`findings: []` 或仅 advisory 即通过。只有 action 为 `fix-code/fix-mechanism` 的 blocking finding 进入代码整改 loop。每实际运行一次 full/targeted 独审计一个 `code_round`；按轮次模板的每任务累计上限收敛，同一证据未变化不重复上报。

最终通过后保存报告与证据索引；计时不构成交付门。

### escape-hatch（执行 / 审查返回 blocked 时）

主线先核 `blocked.detail`、实际工作区、单元运行状态、权威输入及已用轮次，再决定下一动作：

- **可恢复的执行问题**：仓内可查的信息未读、工具中断或执行单元上下文不足 → 主线补齐证据，按「实现失败与恢复协议」恢复/重派，无需用户重复批准实现。单元仍活跃则接收其结果；确认已中断才对账并恢复同一单元工作，不盲目重做。测试静默或超时不算绿；重跑前核原进程状态，不并发启动重复写入或有副作用的测试。
- **必须由人处理的边界**：补证后仍存在无法自行裁决的 `do-not/escalate-if`、未授权契约/设计变更、视觉缺口、必要权限/凭据或不可替代能力缺失 → 保留在制品，列明具体缺口、证据、命中的规范条款与需要的人类动作，暂停相关执行。前端设计、B 类契约升级与安全敏感合并裁决仍按各自规则处理，不用技术重试绕过。
- **达到现有上限**：同一测试修 3 次仍红时先查 oracle/contract，再按下方失败协议允许的主线补证重派一次；仍失败走上下文重置。审查按每任务累计 3 个 code rounds 判定；仍需复审或全审时按根因发 `revise-doc` 或请求用户裁决，不借新根因或执行失败协议续轮。

只有未触及该边界、写集与依赖不冲突且当前执行形态允许的已授权工作可以继续；不得跳过 batch/wave 原子恢复规则或自行拆组。重派、更换单元和上下文恢复不清零测试修复次数、code rounds 或同一 finding 记录。用户给出裁决后核其覆盖范围，恢复记录中的下一动作；用户判定无解、失败协议耗尽或命中下方其他上下文重置条件时按该规则交接，不能仅因一次 `blocked` 就退回任务。

> 每任务通过审查后主线报一行：`✅ {task-id} 独审通过（{changed-files 数} 文件，{tests} 测试）；接着执行 {下一阶段}`，并立即接续。集合全部通过后进末端，尚不能宣告 develop 完成。

---

## 末端（主线，集合全部任务通过审查后跑一次）

> **individual 串行任务多个时**：每个任务分别完整跑一遍本「末端」流程（全量检测 → commit → PR → 合并 → 状态更新），完成后 `git checkout master && git pull`，再启下一个主循环。**可并行任务与 `single-operator-wave`**：全部主循环完成后统一跑一次末端；wave 的代码已有 per-task commits，末端不制造重复整合 commit。wave 内任一任务 blocked 或审查未通过时，不创建整组 PR、不合并，按下方原子恢复协议保留整组。

### 全量检测

整合后跑**一次**全量验证（覆盖集合全部改动文件 + 所有任务 AC 测试）：
```bash
npm run build && npm run type-check && npm run lint && npm run test
```
- 任一红 → 多为 **cross-task 集成问题**（单任务自测在阶段 A 已绿）；定位是哪个任务的改动引入，回该任务阶段 A 修。`build/type/lint` 无命令 → 跳过该条不阻断。`test` 无运行器 → 见阶段 A「测试基建缺失」处置。
- **偏离核查**：`git diff --stat` 对比所有任务包 `files` 合集；汇总各任务返回的 `deviations` / `unmet-ac`，分别记入 PR description「偏离说明」/「遗留问题」。

> 全量绿只证明可执行一致性。A 类跨包归属、共享定义、退役及组合终态由 `generate-integration-tests` 的准备核对与实际执行承接；已发现的组合缺口及证据留在 PR 遗留问题或补缝任务，供联调复用，不回灌为逐包完整重审。

```
✅ 全量检测完成：build/type/lint/test 全绿（[X] passed），[无偏离 / 偏离已记录]。集合 {task-id-list} 全部通过独立审查。
→ 下一步：commit + PR
```

### commit

**分支**：已在认领时锁定（`status.yml tasks[*].branch`），当前工作树即在该分支上。

**commit message 格式**：
- 串行任务（每个单独提交） → `{type}({task-id}): {改动描述}`
- 可并行 batch → `feat({分支名}): {layer}层批量实现 [{task-id-1}, {task-id-2}, ...]`
- single-operator-wave → 主循环已按 `{type}({task-id}): {改动描述}` 逐任务提交；此处只确认工作树实现文件无未提交变化，不再生成重复整合 commit

```bash
git add {改动的文件列表}
git commit -m "{见上}"
```

### 推 PR + 合并到 master

```bash
git push origin {分支名}   # 从 status.yml tasks[*].branch 读取，认领时已锁定
```

执行代码托管操作创建 PR；平台入口与禁用工具以Codex 项目入口为准。PR description 是本次交付的唯一记录，需完整填写。**每任务一节**（单元素集即一节）：

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

**安全敏感预检（合并前唯一人工门）**：本批次任一任务改动触及下列**高风险类别**之一 → **不自动合并**，将实际风险和证据交用户或其明确指定的审批人裁决；已有针对该具体风险的明确裁决可引用，不因学科标签跳过。判据 = 这类改动若 AI 独审与测试同时漏判，将零人工审入 master，且后果不可逆 / 无权威原文可机械验：
> - **权限 / 认证 / 数据隔离**（越权、鉴权绕过、租户串数据）
> - **不可逆数据操作**（数据迁移 / 批量删除 / schema 破坏性变更——错了无法回滚）
> - **金额 / 计费计算**（价格、扣费、对账——算错直接亏钱）
> - **对外不可撤销副作用**（扣款 / 发信 / 短信 / 第三方写入——发出去收不回）
>
> 预检**基于实际 diff 独立判定，不读任务包 `risk` 自报**（决策#29）——逐类对照 `git diff` 的路径与改动内容（鉴权/守卫/中间件文件、迁移/schema 文件、金额/计费字段计算、外发调用），存疑按触及处理。
> **漏标闭环**：预检判定触及，但该任务阶段 B 曾按 standard 范围执行 → 说明 risk 漏标——先按 sensitive **补做 sensitive 边界独审**（重审通过才进人工裁决），并改正任务包与 status.yml 的 `risk`。
> 这是合并前唯一保留的人工治理门（其余代码质量已由 per-task 独审兜，决策#24）。改动不触及上述任一类别 → 直接合并。

**合并**：执行代码托管操作，把 PR 在服务端合并到 master（develop 自审自合并，无独立 pr-review）。合并失败（冲突等）→ 报告用户，不强合。

### 更新状态（合并后写在 master）

merge API 把 PR 在服务端并入 master。切回 master 拉取后，把状态一步落定为 `[merged]`（无独立 pr-review，develop 自审自合并即终态）：
- 项目根 `status.yml`：集合内每个 task 的 `status` 改 `merged`、`pr` 填 `{N}`；`code_reviews[]` 每任务追加结论与报告索引。填写 `rounds/code_rounds/spec_rounds/freshness`、`review_report_dir`、`review_evidence_version: develop-review-round/v2`。计时可选，不补估、不因缺失或不连续阻断。问题及处置只在逐轮报告维护，不再复制 issues/comment；未处理建议与已接受风险在 PR 遗留问题中引用对应 finding。
  在提交终态前，对集合内每个任务运行方法论当前版 `node ../hact-method-lab/templates/scripts/check-sprint.js --review {task-id} .`；缺 preflight/report、首轮非 full、targeted 无 finding id/固定 diff均先修正，不得靠人工说明放行。该入口不依赖 iteration，B 类同样执行。
  ```bash
  git checkout master && git pull
  node ../hact-method-lab/templates/scripts/check-sprint.js --review {task-id} .   # 集合内逐个执行，全部通过后继续
  git add {code-review/preflight reports} status.yml   # 任务包仅在契约实际变化时一并提交
  git commit -m "chore(sprint): {task-id-list} 标记 [merged]，PR #{N}"
  git push origin master
  ```
> ⚠️ 此处 push master 是 develop 自合并模型的一部分（治理代价已接受）——指**项目仓** master，与 hact-method 仓的 master 推送纪律无关。

### 移交

按 `source` 更新对应追踪文件：
- `source=sprint` → 无需额外操作（PR 号与 merged 已写入 status.yml）；同层全部 `[merged]` 后，下游 `generate-integration-tests` 前置即满足
- `source=foundation` → status.yml 把 `foundation` task 改 `merged`、`pr` 填 `{N}`；**把标杆穿透切片登记进 项目根 `reusables.md`**（标"参考实现 / 活文档，新功能照此骨架样式做"）；走骨架完成，下游进 V1 `draft-prd-vN`
- `source=bug / optimization` → 无需第二份总账；status.yml 已记录 PR 和合并状态
- `source=integration / manual-test` → 在 `_meta/sessions/{对应进度文件}` 记录"PR#{N} 已合并，可复测"

### feedback 检查 / 就地分流

回顾本次实现，识别值得沉淀的发现：
- 遇到 项目约束未覆盖的决策（视觉 / 接口边界等）且反复出现
- 上下文重置协议被触发（记录触发原因，供后续调整任务拆分粒度 / context 估量策略参考——估量降低触发概率但不消除，单任务做爆仍走重置）
- 独立审查反复揪出同类问题（可能 契约 / checklist 有空缺）
- 独审「建议」级 finding 中需**跨期处理**的（非本 PR 必修）：评估规模，≤3 文件且改动独立 → 建议走 B 类快速通道；否则入 项目根 `backlog.md`（格式：`- [ ] {日期} | [CR-建议] {描述} | {文件路径}`）。合并前决定纳入当前任务的修复仍须走整改、复审与末端验证；合并后只分流记录，不以行数少为由直接在 master 追加未审代码。
- 无发现 → 跳过

**反馈去向按 `source` 分**：

| source | 去向 |
|---|---|
| `sprint` / `integration` / `manual-test`（A 类）·**跨任务改进** | 写入 feedback.md；项目不变量回 Foundation，技术取舍回 project.md/decisions.md，可执行检查回 check/test/config，不累积通用规则库 |
| `sprint` / `integration` / `manual-test`（A 类）·**本期代码的具体缺口** | 写入 项目根 `backlog.md`（格式：`- [ ] {日期} \| [欠账] {描述} \| 源：develop {vN} {task-id}`）。指本期该有而无人做的东西：**上期有的能力本期没了**（入口/选项/路径回归）、**跨包交集无人认领**（本包不做、也没见别的包做）、**Foundation 声明的约束在代码里没有落地手段**。**不写进 feedback.md**——feedback 的出口在 `wrap-up-iteration`（G5 之后），本期验收前拦不住任何东西；`[欠账]` 由 `manual-test` 会话启动读入，G4 前必过一遍 |
| `bug` / `optimization`（B 类） | 具体遗留缺口进项目 backlog；必要架构决定引用 decisions；可复用发现可留 feedback 或 PR，不要求誊写/提交个人 notes |

> 仅登记仍影响后续实现的重要取舍；归档按实际阅读需要，不设条数/期数门。

### 结束判据与最终移交

准备结束回合前，主线核对实际证据，不以阶段汇报或单元 `done` 代替完成判据：

1. 已授权任务集是否全部走完所需独审/整改、末端验证、PR 合并、状态提交及必要缺口移交？本轮产生的必要项目证据须提交并核结果；可选个人积累不属于完成义务；项目已忽略的本地 progress 只需落盘。仅文件已写入不等于入库收尾完成。
2. 是否还有本轮正在运行或结果未接收的执行/审查单元、测试？有则接收结果并推进；不可只报告「等待审查」后结束回合。
3. 若仍未完成，是否存在已授权且可执行的下一动作？有则继续。仅在用户明确要求停止、真实人类边界、失败协议耗尽或运行环境无法继续时暂停，写明证据、剩余工作与恢复动作。暂停前核本轮活跃单元，能安全中断的先中断，不能中断的记录其状态与影响，避免隐含后台写入。

```
✅ develop 完成：已授权 {task-id-list}（{layers}）已实现、独立审查与末端验证通过，PR {#N[, #N2, ...]} 已合并到 master，状态与必要收尾记录已落定。
当前交付批次完成后，若已授权任务集尚有可执行项，自动按依赖继续；整集完成才结束。后续联调/验收/部署是否继续取决于已有授权。
```

**会话硬边界**：仅在已授权任务集满足上述结束判据后输出完成声明并停止；individual 中单个任务末端完成而本轮仍有任务时，回主循环继续。不自动拾取范围外任务或进入未授权的联调/验收；develop 内目标测试、回归和末端验证不属于禁止接续的下游任务。

---

## 隔离单元使用

| 角色 | 触发 | 任务 | 失败处理 |
|------|------|------|---------|
| **执行者** | 主循环阶段 A | 主线直接实现；独立且有收益时委派 | 见下方失败协议 |
| **隔离审查单元** | 主循环每任务阶段 B | 读对应 brief、自读权威原文、按证据分类 finding | 失败则主线重派；连续失败按审查 loop 超界处置 |
| 只读调查单元 | 阶段 A 的跨目录复用盘点 / reference 不足 | 读 reusables.md / 扫周边文件（≤20 行摘要） | 小而明确的登记表由执行者直读；调查失败也由其直接读 |

**实现失败与恢复协议**：
1. 同一问题三次失败 → 执行者记录 `status: blocked` + `blocked.detail`（含已完成文件 / 卡点 / 关键决策 / 已尝试动作与次数）；发现真实人类边界时立即返回，不为凑次数继续尝试。
2. 主线按 escape-hatch 分类；可恢复时补充权威上下文重派一次。原有尝试记录随派发传入，不重新获得三次试错额度；这一次用于验证补证后的处置。没有新的证据或可行恢复动作时直接升级，不空转重派。
3. 该次补证重派仍失败 → 触发**上下文重置协议**。中断恢复也保留已用额度；本协议不增加独立审查 code rounds 上限。

**上下文重置协议**（出现以下任一情况触发）：
- 按失败协议补证恢复一次后仍失败 / 审查 loop 超界且 escape-hatch 无解
- 实际改动文件超出 `files` 清单 3 个以上
- 调试轮次 > 20 轮
- 用户临时追加新需求

重置流程：
1. 按下方「上下文管理」更新 `_meta/sessions/develop-{task-id}-progress.md`，记录证据、已用重试额度和准确阻塞原因。
2. **individual**：将该任务包回 `[可取]`，写阻塞原因；告知用户后续开新会话重拾。
3. **single-operator-wave**：不得只退当前任务。默认把同 branch 的整组任务保持 `[taken-by]`，写 `_meta/sessions/develop-wave-{id1}--{idN}.json`，schema=`wave-progress/v1`，列 branch 与每个 task 的 `state=accepted|current|pending`；accepted 另列 commit、preflight、final_report。新会话先运行 `node ../hact-method-lab/templates/scripts/check-sprint.js --wave-state {progress.json} .`，机械确认该 branch 完整任务集、整组 status、真实 branch、commit 祖先关系及 commit 内审计物后恢复。若用户明确拆组，执行上方 split transaction。任何路径都不得形成“A taken-by 未 merged、B 单独可取”的状态。

---

## 前后端差异

| 维度 | dev-frontend | dev-backend |
|------|-------------|-------------|
| 开跑前人工门 | **前端设计到位确认**（design.md / prototype 覆盖本批次画面） | 无（backend-only 跳过） |
| 执行者额外加载 | `design.md` 全局视觉基线 + 任务包点名页面规格（存量无稳定锚才全文）；`prototype.html` 对应交互路径（若存在）；`ux-flows.md` 对应用户任务 U-id / 场景 S-id（若存在）| 无 |
| 自绿 checklist | `templates/checklists/frontend-checklist.md`（**三段式**：机械归 lint / type-check / style lint（命令按项目栈）｜可测逻辑写测试｜视觉/交互留走查） | `templates/checklists/backend-checklist.md`（**测试品类清单**：鉴权/边界/错误/契约/并发/安全注入·穿越各写测试） |
| 独立审查侧重 | AC 忠实 + 机械保真（变量非硬编码）；视觉到位归人工门 | AC 忠实 + 测试品类齐全 + 标准合规 |

---

## 长程执行与上下文恢复

主线只保留授权范围、当前单元、关键决定与证据索引；日志/大文件按问题定向读取，不重复灌入全仓。单元完成时及时落任务与审查状态，重大决定发生时就记录原文与前提，不能等到压缩前才补写。

压缩由 Codex 管理，不按固定步骤主动清空上下文。检测到压缩、恢复或上下文不足时，先按下方断点续做核原始契约、当前 diff、验证版本与未关闭问题，再自动继续。单元转换无需重跑已通过检查或重新授权；同一问题重复探索而无新证据时，先恢复原始依据，不换代理清零尝试次数。

**进度记录**：复用 `_meta/sessions/develop-{task-id}-progress.md`。确定任务集后，在当前任务记录范围；派发/接收单元、阶段切换、暂停或恢复时更新，不逐工具调用记流水账。旧 context-state 字段保留，追加：

```yaml
context-state:
  task-id: {task-id}
  task-set: [...]             # 用户授权时的全部任务 id；当前批次之外仍在范围内的任务自动接续
  phase: review              # 当前实际阶段，如 implementation / review / validation / merge / closeout
  next-action: "接收当前独审结果并按 finding action 分流"
  units: []                  # 本轮待接收单元/进程的标识、职责、状态；无则 []
  evidence: []               # 原始契约、固定 tree、report、测试命令/环境/版本和 PR 指针；旧版本结果不可当当前通过
  attempts: []               # 同一问题/根因已尝试动作与次数；code rounds 以审查报告对账
  completed-files: [...]
  blocked-at: null           # 暂停时写具体原因、规范条款与所需人类动作
  key-decisions: [...]       # 原文出处、适用前提、重要否决理由；未知项保持未知
```

此记录只描述执行意图与恢复线索，不替代任务包、`status.yml`、审查或测试证据。只保存无凭据的运行标识；运行时专属状态查询/等待方式按Codex实现，不写入任务或 Gate。wave 仍使用原 `wave-progress/v1` JSON 与校验器作为整组恢复依据，上述补充信息写当前任务 progress，不改变 wave JSON schema。

**断点续做**（含主循环、末端及合并后收尾）：
1. 读当前交付批次、任务包与进度记录，核已授权范围、当前阶段及下一动作。旧记录缺新字段时从任务/审查/PR 证据重建，不要求重做实现或重新授权。
2. 先核实际工作区、分支和本轮单元/进程状态；仍活跃则接收结果，不重派并发写入。核 `status.yml` 的 branch 与 Git/PR 实际进度；安全切换前保护在制品，不因进度文件写了分支名就盲目 checkout。wave 先走原整组恢复校验，不仅凭当前任务记录恢复。
3. 摘要只作索引；重新读取当前任务原始契约与关键决定前提。沿 progress 的旧分支/worktree 找到同 task-id 的完整审查链，原样携带 preflight、reports 和可解析的 Git 对象，接着下一个 round 编号；按全部实际代码轮次累计，不能换目录从 01 重开或重写起始时间。用固定 diff 与有效证据恢复阶段；基线变化只复验受影响部分。旧链缺失时记录已知轮次与证据缺口并找回，不当新任务重做；恢复、rebase、补前置依赖不重置 attempts/rounds。
4. 从首个未完成阶段接续：代码已在 PR 合并但状态未落定 → 核远端合并结果后补状态/收尾，不重复实现或创建 PR；已证实通过且快照未变 → 继续下一动作，不重复独审。新发现真正边界按 escape-hatch 处理。

**阻塞于 revise-doc 结论**：本任务依赖的 `revise-doc` 结论尚未下达时，任务保持 `[taken-by]` 不变，在 progress.md 写明阻塞理由，等 `revise-doc` 完成后再继续——不强行推进，也不退回 `[可取]`。
