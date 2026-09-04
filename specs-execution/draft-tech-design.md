# exec: draft-tech-design

> 运行时加载本文时，当前任务是读 PRD 输出 TRD，按候选增量维护三份 Standards（可 0 变更），签 G2。
> 三层顺序：**骨架**（架构轮廓）→ **结构层**（完整契约）→ **执行层**（standards）

**上下文密度**：中高。需读多份输入文件，输出 4 份文档。疑点清单阻断前不开始写 TRD。

---

> **步骤协议**：机械读取、写文件和检查正常时静默执行，不逐步播报完成总结。只在 🚫 人类确认、会改变范围/取舍的 ⚖️ 默认判定、异常/`blocked` 和最终移交时输出；🚫 必须停下等明确回应，⚖️ 用一行结论 + 理由后继续，用户可随时推翻。

---

## 会话启动

**前置检查：G1 是否已签**

读 `iterations/vN/gates.md`（路径不存在时读 `iterations/` 目录找最新版本）：
- G1 未签 → 阻断：「⚠️ G1 未通过，PRD 尚未确认，请先完成 draft-prd-vN 再启动技术设计。」
- G1 已签 → 继续

**前置检查：draft-ux 是否就绪**

读 `iterations/vN/prd.md`，扫描所有功能的 `draft-ux` 字段：
- 有任何功能标记 `draft-ux: 需要`，且 `prototype.html` / `prototype-map.md` / `ux-flows.md` 任一不存在 → 阻断：「⚠️ PRD 中有功能需要交互原型，但 UX 三件套未齐，请先续做 draft-ux 再启动技术设计。」
- 全部标记 `draft-ux: 不需要`，或 UX 三件套均已存在 → 继续

**必读文件**（可用只读调查单元并行读取并返回带路径摘要；不可用则主线顺序读）：
- `iterations/vN/prd.md`
- `iterations/vN/ux-flows.md`（如存在；作为接口设计的业务流参照）
- `iterations/vN/prototype.html`（如存在；作为接口设计时确认各画面数据需求的参照）
- 项目根 `project.md`（技术层已有决策）
- 项目根 `decisions.md`
- 项目根 `reusables.md`
- 项目根三份 Standards 仅扫规则 id + `applies-if`（如已存在；用于发现与本期 TRD delta 的候选或冲突，不读规则全文）
- 执行人 notes 仅检索 `[规范]` 标签行（不读全文）；公共/栈 Standards 模板与规则正文留 Step 7 候选命中后按 layer 加载

**技术偏好确认**：
- 从 项目根 `project.md` 技术层读取已有选型，不重新询问——**新项目的栈由 V0 `draft-foundation` 先于本任务确立**。
- project.md 技术层为空（**存量项目未走 V0 地基阶段**）→ 询问用户技术栈偏好、写入 project.md（兜底）

**选项列表**（G1 已满足，确认要做什么）：

```
{项目名} · G1 已签，PRD 已确认

可做的任务：
[1] draft-tech-design — 技术设计（TRD + Standards 候选维护）← 主线
[2] revise-doc(target=prd) — 若发现 PRD 有歧义或遗漏，先修再做技术设计

其他可做（输入「展开」/ 自由描述）：
- 查看 PRD 内容摘要
- 其他

请选 [1]、[2]，或输入「展开」，或直接说你要做什么。
```

🚫 等用户选择后再继续（⚖️ 例外：用户开场已明确表达主线意图——如直接说「做技术设计」——本列表跳过不出，播报一行后直接进入 Step 1）

用户选 [1] → 进入 Step 1 疑点清单（技术偏好已在上方会话启动确认，不重复问）
用户选 [2] → 加载 revise-doc exec spec，按 revise-doc 流程执行

开场说：「我将分三层完成技术设计：先确认架构骨架方向，再写完整 TRD 契约，最后只处理本期命中的 Standards 候选（可能为 0）。首先输出疑点清单等你确认，确认后才开始写。」

---

## 第一层：骨架（架构轮廓）

### Step 1：输出疑点清单

读完 PRD 后，列出所有技术边界不清晰的点：

```markdown
## 疑点清单 · v{N}

1. [功能/数据实体] {疑点描述} → 需确认：{具体问题}
2. [接口/模块] {疑点描述} → 需确认：{具体问题}
...
```

分类涵盖：字段约束 / 接口语义 / 并发场景 / 第三方依赖 / 鉴权边界 / 数据迁移。

无疑点时明确说"已通读 PRD，无疑点"，不省略此步。

> **边界**：PRD 某功能技术可行性存疑（三角 F 风险）→ 写入疑点清单明确风险，等用户决策是否调整 PRD 范围，不自行删减。

🚫 等用户逐条回答疑点，**不得带假设开始写 TRD**

---

### Step 2：输出 TRD 骨架

疑点清单确认完毕后，输出架构骨架——**每项只写一行**，不展开细节：

```markdown
## TRD 骨架 · v{N}

### 技术选型变更
- {新增依赖}：{一句话用途}

### 数据库变更
- 新建表：{表名}（{核心字段列举}）
- 修改表：{表名}（{变更说明}）

### 接口清单
- POST /api/{路径}：{一句话功能}
- GET /api/{路径}：{一句话功能}

### 模块划分
- 前端：{模块名} / {模块名}
- 后端：{模块名} / {模块名}

### 共享组件建议
- {组件名}（{前端/后端/全栈}）：{一句话说明}
```

🚫 等用户确认骨架方向（模块划分、接口粒度、共享组件方向）

---

## 第二层：结构层（完整契约）

### Step 3：写完整 TRD

骨架确认后静默逐段写完整 TRD；仅出现疑点、异常或 `blocked` 时中断报告。最终 `iterations/vN/trd.md` 套用结构化模板 `../hact-method-lab/templates/trd.md`（固定 7 段 header + `### 表：` + `### 接口：` + 槽位），**不得偏离 header/槽位写法**——Step 4 linter 按此解析；模板的 `<待填>` 占位与注释须全部替换/删除。

**§ 技术选型变更**：仅写本期新增；格式：依赖 / 版本 / 用途 / 选型理由。迭代项目不重复已有。

**§ 数据库设计**：每表用固定 header `### 表：{表名}` 独立块，含：字段名 / 类型 / 约束 / 索引 / 外键。**PRD 每个数据实体必须有对应表，且表名与 PRD `涉及实体` 同名同形**（大小写不敏感）——Step 4 linter 据此交叉对账。

**§ 接口设计**：每接口一个 `### 接口：` 块（header / 槽位 / `# 服务流程` / `# 满足 AC` 回链格式全见模板注释，不重抄）。本文只讲模板讲不了的判断：

- **回链承接**：每个接口/模块/场景旁标 `# 满足 AC：AC-nn`——TRD 是 PRD AC → 下游任务包回链的**中转站**，这里漏一条 AC，plan-sprint 就断链。齐全性 Step 4 机械核。
- **幕 2 精化（测试脊柱）**：不可视区 AC 的 PRD 行为例子（幕 1 已写）就地精化为技术精确规格——补确切状态码/错误码/断言、对齐本接口请求/响应契约（PRD「应被拒绝」→ TRD「Then 403 + PERM_DENIED」）。**只精化不创造**；PRD 缺该例子 → 回链对不上，回 `revise-doc(target=prd)` 或列疑点，不在 TRD 凭空补。runnable 测试守 develop（物化在代码存在后才稳），TRD 只出规格。可视区 AC 不精化为后端规格，留原型 / manual-test 走查。
- **字段对画面**：`prototype.html` 在时，逐画面核接口请求/响应字段够该画面所需数据，避免前端拿不到要显示的字段。

**§ 测试环境约定**（不可省略）：后端地址 / 前端访问方式 / 数据库指向 / 有副作用操作的禁止清单。

**§ 交互技术方案**：仅写有技术含义的交互（轮询 vs WebSocket / 复杂状态流转 / 跨模块数据共享）。

**§ 模块拆分**：前后端各自模块职责边界，标明模块间调用方向。

**§ 共享组件建议**：表格格式，引用 reusables.md 已有资产（标"已有，建议复用"），新建议标明路径。

> 若共享组件建议被拒绝并需追加到 项目根 `reusables.md`「建议已拒绝」，写入前先看该表是否已超过 20 条；若触发阈值，先按文件头约定把纯历史拒绝建议归档到 `reusables-history.md`，再追加本期拒绝项。

**AC 覆盖自检**（写完七段后）：回看每条 PRD `AC-nn` 都有载体回链（接口/模块/场景，载体无关）。齐全性 Step 4 check-docs 机械核（逐条正反向），此处只肉眼扫补漏；linter 报"AC 未被承接"且确认本期不做 → 列疑点向用户确认范围调整 vs 设计遗漏，不静默丢。

**留人语义残量**（linter 兜不住）：① 载体**真承接**该 AC（内容真覆盖、非仅 id 在场）② 精化例子忠实 PRD 行为意图（没夹带/缩水）——Step 5 末端审查 + 签字时复核（Step 9）。

> TRD 落盘后**先验证、再请用户确认**：Step 4 机械核 → Step 5 陌生视角审内容 → Step 6 用户确认。把最便宜的检查（机器 / 陌生视角）放在用户注意力之前，用户看到的是已过两关的稿。

---

### Step 4：结构 linter 自检（【linter】判据的最终判定，含交叉对账）

TRD 落盘后**立即**跑确定性检查（不等到签字）。此刻 PRD 与 TRD 都在，**两条交叉对账在此兑现**：① PRD `涉及实体` ↔ TRD `### 表`；② PRD `AC-nn` ↔ TRD `# 满足 AC` 回链（逐条正向挡悬空 + 逐条反向验覆盖，机械化 AC 覆盖映射自检）。这些是【linter】判据，机械核定，**不额外派隔离单元冷核**：

```bash
node scripts/check-docs.js iterations/vN/prd.md iterations/vN/trd.md
```

- 退出码 0（全 pass）→【linter】判据全部通过，进 Step 5 内容审查。
- 退出码 1（有 FAIL）→ 按报告逐条修：
  - TRD 段落缺/槽位空/表块或接口块缺 → 修 `trd.md`。
  - 交叉对账 FAIL（PRD 实体无对应表）→ 多数是 TRD 漏建表，补 `### 表：{名}`；若确认该"实体"非持久化数据（纯前端态/外部系统），则回 `prd.md` 把该功能 `涉及实体` 改正（去掉或写"无"）。
  - 交叉对账 FAIL（AC 回链悬空 / PRD AC 未被承接）→ 悬空：改正 TRD 回链号或删退休号；未被承接：在对应载体补 `# 满足 AC：AC-nn`，或列疑点向用户确认本期不做。
  - 重跑到绿（签字 commit 的 pre-commit 门卫会再跑、红则拦 commit）。

> linter 覆盖结构/一致性判据（含 AC 覆盖映射的**齐全性**机械核）；**语义判据**（接口字段是否真满足画面、载体是否**真承接**所回链的 AC 而非仅 id 在场）落 linter 🧑 段，由 Step 5 末端审查 + 签字时复核 + 后续 `develop` 内置独立审查的技术保真把关。
> 项目仓无 `scripts/check-docs.js`（存量项目未铺）→ 退回 `../hact-method-lab/skeleton/06-gates.md` §7 G1/G2 段的人工逐条核对兜底（不额外派隔离单元），并提示"建议补铺 linter（见 init-project Step 3）"，不阻断。

---

### Step 5：独立内容审查（格式之外的内容有效性）

check-docs（+ 门卫）守**结构与覆盖齐全性**；**内容有效性派隔离审查单元做陌生视角复核**（防同上下文自评盖章）——TRD 的语义残量比 PRD 更厚（接口契约对不对、精化缩没缩水、字段满不满足画面）。

**派发**：派普通档隔离审查单元，令其读 `../hact-method-lab/templates/review-briefs/trd-review.md` 按 brief 执行，只告知本期迭代版本 vN——审查单元据 brief **自读**定稿 trd.md + prd.md（+ ux-flows / prototype 如有），陌生视角逐查四维度（内部一致性 / AC 真承接 / 字段满足画面 / 覆盖完整），输出问题清单（禁 pass 盖章）。具体模型见运行时映射；审查维度改动去改该 brief（单一来源），不在此重述。

AI 据清单与用户过一遍：真问题 → 改 TRD；属技术取舍 → 用户拍板。

> 隔离审查失败 / 超时 → 重派一次；仍失败则标记 `blocked` 并等待恢复，不得用主线自审冒充独立审查。

---

### Step 6：TRD 用户确认

机器（Step 4）+ 陌生视角（Step 5）都过了，把验证后的 TRD 交用户做最终确认。

```
✅ TRD 完成（已过 linter + 内容审查）：[接口数量] 个接口，[表数量] 张表，[模块数量] 个模块，共享组件建议 [数量] 条。
→ 下一步：维护项目 standards — 执行层约束文档
继续？
```

🚫 等用户确认 TRD 内容，有修改则改完再继续（改动由 Step 9 门卫复跑 linter 兜结构漂移）

---

## 第三层：执行层（Standards + 收尾）

### Step 7：维护项目活文档（地基蓝图增补 + Standards）

**地基蓝图增补（`foundation.md`，post-V0 维护——与 standards 增补同理）**：foundation.md 是项目根跨迭代活文档（V0 `draft-foundation` 播种）。本期设计若识别出**新的跨切面关注点**——新核心实体贯穿全局 / 新跨切面技术地基（新错误类目、新作用域维度、新全局拦截）/ 上期 develop 经 feedback 上来的地基缺口——则**原地增补** foundation.md：「一、领域地图」补核心实体；「二、关注点登记」补新行 + 立**应有档**（安全敏感项=构造级，同 V0 纪律）。**准入门槛照旧**：只收已证明跨切面 + 稳定的，本期一次性 / 含糊的不进、留 escape 再提拔。

> **≥机械级的档位不能空口立**（同 V0 探针纪律，见 `../hact-method-lab/templates/review-briefs/foundation-review.md`）——声明构造级 / 机械级时，「实际形式·档」列必须落到**落地手段的具体位置**（文件:行 / 规则名），二选一：
> - **手段已在**：亲手写一条违规、跑对应检查（type-check / lint / 裸 SQL / 越权路由，按项目栈），**真被挡**才算数；没被挡就是实际档低于声明，当场降档。探针临时文件跑完即删、不进 commit。
> - **手段本期才建**：登记为「待建·应有档 {档}」，并在本步产出里注明该关注点须由 `plan-sprint` 拆的**地基跟进包**实建，其 AC 必须写「写违规反例、跑检查、验证真被挡」。
>
> 给不出位置、也不派人建 → 只能立**人审级**。声明了机械级却没有拦得住的东西，比不声明更坏：后续所有人都以为这条有人守。

增补后该关注点的底料由 `plan-sprint` 拆「地基跟进包」、`develop` 建（见 plan-sprint 视觉地基包规则的 foundation.md 变更触发支）。**无新跨切面关注点 → 本步跳过，foundation.md 不动。**

> **存量守卫（未走 V0、无 foundation.md 的项目）**：本步整体跳过；只有通过 Standards 准入的稳定默认才更新下方当前规则表，不为此顺手新建 foundation.md。

三份 `standards-{shared,frontend,backend}.md` 是项目根跨迭代的**当前稳定默认规则表**，只承接 PRD/TRD/design/Foundation/check/test 之后剩下的、暂不能由更强权威对象承接的默认规则。新项目已由 V0 首播；存量空桩需要首播时视为三个 layer 都有候选。禁止按 vN 追加历史段。

**先做候选扫描，不先加载模板**。主线从本期已写 TRD、Foundation/design 变化、项目 feedback 的 `[规范]`/Standards 相关行、notes 的 `[规范]` 标签行和现有规则 id + `applies-if` 生成 `0..N` 条 `standards-candidate`，每条只含：目标 layer、触发事实、为什么是跨任务长期默认、可能新增/替换/删除的 rule id。以下任一也触发候选：测试机制或视觉地基 enforcement 发生变化；项目 Standards 为空；用户明确要求做 Standards cleanup。

- **0 条**：三份 Standards 原样不动；不读公共/栈模板与规则全文，不派 frontend/backend 生成单元，直接进入 Step 8。
- **有候选**：只读目标 layer 的现有命中规则、公共候选、项目栈子模板相关段和 notes 命中条目；仅为存在候选的 frontend/backend layer 各派一个隔离执行单元，shared 候选由主线处理。无候选 layer 不读、不派、不改。
- **仅 cleanup**：读项目现有三份规则和近两期引用/`standards_checked`，不加载公共/栈候选模板；无新增内容生成时由主线完成删除/迁移，不派生成单元。

进入“有候选/cleanup”分支后才读取 `../hact-method-lab/templates/standards/schema.md`；0 candidate 分支不为重复确认既有职责而加载 schema。

**Standards 来源规则**（三源：通用候选 + 栈候选 + 执行人个人 notes）：
- 所有候选先按 `templates/standards/schema.md` 分类与准入；只有跨任务、长期稳定的默认约束进入 Standards，并改写成完整规则条目。
- 首期播种只选择本项目适用项，不整节复制。项目栈无对应子模板时，仅从通用候选与已确认的长期栈约束生成。
- 迭代维护只更新、替换或新增当前规则；不新增 vN 标题。版本契约回 TRD，Foundation 不变式回 Foundation，机制位置回 check/test/config，历史回 decisions，临时缺口回 waiver/backlog。
- **候选命中或 cleanup 时才做收缩**：按 `schema.md` 扫最近两个已完成迭代的 `queue/*.md` 的 `relevant-standards` 与各 `code-reviews/*/round-*.md` 的 `standards_checked`；旧报告缺字段记 `unknown`。连续两期零引用只进入复核，不能删除。拟删除时在 `_meta/sessions/standards-retention-vN.json` 写 rule id、`zero_use/safety_or_data/superseded_when_met`（严格 boolean）、`applies_if_possible`（boolean/null）、迁移目标/可解析更强锚与 `requested`，然后运行 `node ../hact-method-lab/templates/scripts/standards-retention-policy.js {该文件}`；类型错误、占位/坏锚或非 0 一律禁止删除。安全/数据规则无更强承接锚则保留；有 enforcement 的条目只留 id、默认约束和指针。
- notes 候选同样先过准入并去重；与现有规则冲突时保留当前规则，把候选送 `feedback.md`；与公共候选冲突但项目有明确决定时，以项目决定为准并记 `decisions.md`。

**隔离执行单元输入要点**（仅有候选的 frontend / backend layer）：
- 传入：对应 standards-candidate + TRD 命中章节（不默认全文）+ `../hact-method-lab/templates/standards/{layer}.md` 命中候选段（+ 项目栈对应子模板命中段，如有）+ 项目根现有目标规则 + notes 中命中 `[规范]` 条目
- 输出：本期适用的当前规则条目；每条含稳定 id、`applies-if / rule / grade / enforcement / override / superseded-when`。不得输出 AC、版本史、任务号、事故叙事、当前代码行号或临时补偿纪律
- 主线负责写项目根 `standards-{layer}.md`（首播或当前态更新），不让隔离执行单元直接写文件

> 本步 frontend / backend 隔离执行单元属 standards 内容生成任务，使用当前运行时的执行档，不套 Step 5 审查档规则。

主线处理项目根 `standards-shared.md`。错误码表、接口字段与接口权限属于本期契约时留在 TRD；只有跨任务稳定默认按同一 schema 进入 shared Standards。

**测试基建约定（不可视区测试的地基，不可省）**：项目根 `standards-backend.md` 必含测试机制规则（框架 + 命令 + 测试位置 + enforcement id）。这是 develop 把不可视区 intent/oracle 落成 runnable test 的前提；现有规则与机制均未变化时不构成 candidate。
- 新项目：测试框架已由 V0 确立 → 本期沿用；机制变化时更新同一规则，不另加版本段。
- 存量项目（未走 V0）：在此确立框架，写入 standards-backend 与 项目根 `project.md` 技术层；若项目尚无测试运行器，标记为迁移待办——补 standards 测试约定 + 在项目装运行器后，backend develop 的测试步方可正常跑（见 `develop.md` 阶段 A 测试基建缺失处理）。

**视觉地基约定（可视区地基，含前端时不可省）**：新项目由 V0 首播，本期沿用；只有 enforcement 或默认约束变化才形成 candidate。存量项目在此首播。项目 Standards 以规则 id 引用视觉地基的 enforcement，Foundation 承接全局入口/主题强制档，design.md 承接具体 token 真值，不在 Standards 重复三份全文。

有候选/cleanup 时汇总检查：字段完整、无重复/矛盾、无版本追加史；TRD 关键契约留在 TRD，不以“覆盖所有 TRD 细节”为目标。最终 G2 确认时附一行：`Standards：跳过（0 candidate）` 或 `保留 {N} / 新增 {N} / 删除或迁移 {N}`；机械过程中不另播报。

**隔离执行单元失败判定**：以下任一情况视为失败，主线接管该份 standards：
- 返回内容为空或格式完全不符合模板结构
- 返回内容包含大量与 TRD 无关的通用规则（未基于 TRD 提炼）
- 运行超时或报错

主线接管时：直接基于 TRD 对应层（frontend/backend）的相关章节手动生成该份 standards，记录原因。

---

### Step 8：知识沉淀

更新 项目根 `decisions.md`，追加本期关键架构决策（格式：决策 / 原因 / 日期）。

> 追加前先看活跃条目是否已超过 30 条，或最早条目所属迭代是否已过去 5 期以上；若触发阈值，先按文件头约定把纯历史/已取代条目归档到 `decisions-history.md`，再追加本期决策。

> **边界**：技术选型有重大变更（替换已有依赖）→ 写入 项目根 `decisions.md` 并说明原因，不静默替换。

更新 项目根 `project.md` 技术层（技术选型 / 数据库结构 / 模块划分）。

---

### Step 9：G2 签字

> **签字前置**：Step 5 内容审查问题已处理 + Step 6 用户已确认 TRD + 语义判据已确认（载体真承接 AC、接口字段真满足画面）。（结构 linter 由下方签字 commit 的 pre-commit 门卫强制兜底，无需在此重述"退出码 0 才签"。）

```
✅ TRD 完成：[N] 段；Standards：{跳过（0 candidate）/ 更新 [layer...]，新增 N、替换 N、删除或迁移 N}；decisions.md 已更新。
要签 G2 吗？
```

🚫 等用户确认

用户确认 → 写 `iterations/vN/gates.md`：
```markdown
- [x] G2：TRD 已确认 — {YYYY-MM-DD}
```

**更新项目根 `status.yml`**（字段见 `../hact-method-lab/skeleton/07-status-contract.md`）：将 `iterations.vN.gates.G2` 改为 `{ signed: true, date: {YYYY-MM-DD} }`（文件不存在则先从 `../hact-method-lab/templates/status.yml` 补建）。

执行 `git add iterations/vN/trd.md standards-shared.md standards-frontend.md standards-backend.md iterations/vN/gates.md status.yml && git commit -m "feat(trd): v{N} TRD + standards 完成，G2 签署 [{项目名}]" && git push`（standards 在项目根，非 iterations/vN/）

**feedback 检查**（签 G2 后）：
- 疑点清单超过 5 条且多条根因相同（如 PRD 对某类场景描述方式有共性问题）→ 写入 项目根 `feedback.md`（格式：`{日期} | {发现} | 建议在 draft-prd-vN 的开放问题清零步骤中加强 {具体环节}`）
- standards 生成后发现与 TRD 有明显脱节（需要大量人工修正）→ 写入 项目根 `feedback.md`
- 无发现 → 跳过

移交：「TRD 完成，下一步 `plan-sprint`。」

---

## 红线

- **禁止省略测试环境约定段**：TRD 中「测试环境约定」是必填段，无论项目大小
- **禁止跳过疑点清单确认**：疑点清单未经用户逐条确认前不开始写 TRD
- **禁止自行补全 PRD 遗漏**：PRD 有歧义或缺失时，列入疑点清单等用户确认，不自行假设填写

---

## 隔离单元使用

| 触发点 | 隔离单元任务 | 失败处理 |
|--------|-------------|---------|
| 会话启动 | 只读调查单元并行读 6 份输入文件（纯读取+带路径摘要） | 读取失败则主线单独读，不阻断 |
| Step 5 内容审查 | 全新陌生视角审 TRD 内容有效性（一致性 / AC 真承接 / 字段满足画面 / 覆盖），输出问题清单 | 重派一次仍失败则 `blocked`，不得主线自审替代 |
| Step 7 Standards 维护 | 0 candidate 时不派；有候选时仅为命中的 frontend/backend layer 各派一个隔离执行单元；仅 cleanup 由主线处理 | 失败则主线接管该份，记录原因 |

> **Step 5 与 Step 4 分工**：Step 4 linter 机械核结构 / 覆盖类【linter】判据；Step 5 验 linter 兜不住的**内容有效性**（载体真承接 / 精化忠实 / 字段满足画面），两者不重叠。存量项目未铺 `check-docs.js` 时格式核对退回 `../hact-method-lab/skeleton/06-gates.md` §7 G1/G2 段人工兜底（Step 5 内容审查照常派）。

---

## 上下文管理

- Step 2（TRD 骨架确认后）做一次 compact，再开始写完整 TRD——骨架确认是探索讨论阶段的天然终点，写作阶段需要保持各段内部一致性
- compact 前在 `_meta/sessions/draft-tech-design-progress.md` 记录：疑点清单各条答案摘要 + TRD 骨架（接口列表 / 模块划分 / 共享组件）

**断点续做**：
- 读 `iterations/vN/trd.md` 判断写到哪一段（按 7 段结构对照）
- 读项目根 `standards-*.md` 判断本期命中的稳定默认是否已更新；本期契约仍留 TRD，不以 Standards 含本期全部约定为完成信号
- 读 `iterations/vN/gates.md` 判断 G2 是否已签
- 从未完成的段落或文件继续
