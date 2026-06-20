# exec: draft-tech-design

> CC 加载本文时，当前任务是读 PRD 输出 TRD + 三份 standards，签 G2。
> 三层顺序：**骨架**（架构轮廓）→ **结构层**（完整契约）→ **执行层**（standards）

**上下文密度**：中高。需读多份输入文件，输出 4 份文档。疑点清单阻断前不开始写 TRD。

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

**前置检查：G1 是否已签**

读 `iterations/vN/gates.md`（路径不存在时读 `iterations/` 目录找最新版本）：
- G1 未签 → 阻断：「⚠️ G1 未通过，PRD 尚未确认，请先完成 draft-prd-vN 再启动技术设计。」
- G1 已签 → 继续

**前置检查：draft-ux 是否就绪**

读 `iterations/vN/prd.md`，扫描所有功能的 `draft-ux` 字段：
- 有任何功能标记 `draft-ux: 需要`，且 `iterations/vN/prototype.html` 不存在 → 阻断：「⚠️ PRD 中有功能需要交互原型，请先完成 draft-ux 再启动技术设计。」
- 全部标记 `draft-ux: 不需要`，或 `prototype.html` 已存在 → 继续

**必读文件**（用 Explore subagent 并行读取，不占主线上下文）：
- `iterations/vN/prd.md`
- `iterations/vN/ux-flows.md`（如存在；作为接口设计的业务流参照）
- `iterations/vN/prototype.html`（如存在；作为接口设计时确认各画面数据需求的参照）
- `project.md`（技术层已有决策）
- `decisions.md`
- `reusables.md`
- `../hact-method/templates/standards/backend.md`
- `../hact-method/templates/standards/frontend.md`

**技术偏好确认**：
- 首期项目：询问用户技术栈偏好，确认后写入 `project.md` 技术层，后续迭代直接复用
- 迭代项目：从 `project.md` 技术层读取已有选型，不重新询问

**选项列表**（G1 已满足，确认要做什么）：

```
{项目名} · G1 已签，PRD 已确认

可做的任务：
[1] draft-tech-design — 技术设计（TRD + 三份 standards）← 主线
[2] revise-doc(target=prd) — 若发现 PRD 有歧义或遗漏，先修再做技术设计

其他可做（输入「展开」/ 自由描述）：
- 查看 PRD 内容摘要
- 其他

请选 [1]、[2]，或输入「展开」，或直接说你要做什么。
```

🚫 等用户选择后再继续

用户选 [1] → 继续下方步骤（技术偏好确认 → 疑点清单 → TRD）
用户选 [2] → 加载 revise-doc exec spec，按 revise-doc 流程执行

开场说：「我将分三层完成技术设计：先确认架构骨架方向，再写完整 TRD 契约，最后生成三份 standards。首先输出疑点清单等你确认，确认后才开始写。」

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

骨架确认后，逐段写完整 TRD，**每段写完后报告进度**。最终 `iterations/vN/trd.md` 套用结构化模板 `../hact-method/templates/trd.md`（固定 7 段 header + `### 表：` + `### 接口：` + 槽位），**不得偏离 header/槽位写法**——Step 5.4 linter 按此解析；模板的 `<待填>` 占位与注释须全部替换/删除。

**§ 技术选型变更**：仅写本期新增；格式：依赖 / 版本 / 用途 / 选型理由。迭代项目不重复已有。

**§ 数据库设计**：每表用固定 header `### 表：{表名}` 独立块，含：字段名 / 类型 / 约束 / 索引 / 外键。**PRD 每个数据实体必须有对应表，且表名与 PRD `涉及实体` 同名同形**（大小写不敏感）——Step 5.4 linter 据此交叉对账。

**§ 接口设计**：每接口一个 `### 接口：` 块（header / 槽位 / `# 服务流程` / `# 满足 AC` 回链格式全见模板注释，不重抄）。本文只讲模板讲不了的判断：

- **回链承接**：每个接口/模块/场景旁标 `# 满足 AC：AC-nn`——TRD 是 PRD AC → 下游任务包回链的**中转站**，这里漏一条 AC，plan-sprint 就断链。齐全性 Step 5.4 机械核。
- **幕 2 精化（测试脊柱）**：不可视区 AC 的 PRD 行为例子（幕 1 已写）就地精化为技术精确规格——补确切状态码/错误码/断言、对齐本接口请求/响应契约（PRD「应被拒绝」→ TRD「Then 403 + PERM_DENIED」）。**只精化不创造**；PRD 缺该例子 → 回链对不上，回 `revise-doc(target=prd)` 或列疑点，不在 TRD 凭空补。runnable 测试守 develop（2026-06-16：测试在代码存在后才稳），TRD 只出规格。可视区 AC 不精化为后端规格，留原型 / manual-test 走查。
- **字段对画面**：`prototype.html` 在时，逐画面核接口请求/响应字段够该画面所需数据，避免前端拿不到要显示的字段。

**§ 测试环境约定**（不可省略）：后端地址 / 前端访问方式 / 数据库指向 / 有副作用操作的禁止清单。

**§ 交互技术方案**：仅写有技术含义的交互（轮询 vs WebSocket / 复杂状态流转 / 跨模块数据共享）。

**§ 模块拆分**：前后端各自模块职责边界，标明模块间调用方向。

**§ 共享组件建议**：表格格式，引用 reusables.md 已有资产（标"已有，建议复用"），新建议标明路径。

**AC 覆盖自检**（写完七段后、报 TRD 完成前）：回看每条 PRD `AC-nn` 都有载体回链（接口/模块/场景，载体无关）。齐全性 Step 5.4 check-docs 机械核（逐条正反向），此处只肉眼扫补漏；linter 报"AC 未被承接"且确认本期不做 → 列疑点向用户确认范围调整 vs 设计遗漏，不静默丢。

**留人语义残量**（linter 兜不住）：① 载体**真承接**该 AC（内容真覆盖、非仅 id 在场）② 精化例子忠实 PRD 行为意图（没夹带/缩水）——下方 Step 5.5 末端审查 + 签字时复核（Step 6）。

```
✅ TRD 完成：[接口数量] 个接口，[表数量] 张表，[模块数量] 个模块，共享组件建议 [数量] 条。
→ 下一步：生成三份 standards — 执行层约束文档
继续？
```

🚫 等用户确认 TRD 内容，有修改则改完再继续

---

## 第三层：执行层（Standards）

### Step 4：维护项目 Standards（首期播种 / 迭代增补）

三份 `standards-{shared,frontend,backend}.md` 是**项目根的跨迭代活文档**（非迭代内产物，与 `decisions.md` / `reusables.md` / `design.md` 同级），单一真相源——首期播种、之后每期原地增补，并行迭代共享同一份保全库约定一致。TRD 确认后，启动 **2 个并行 subagent** 处理 frontend / backend；主线同时处理 shared。

**Standards 来源规则**（双源：公共模板 + 执行人个人 notes）：
- **首期播种**（项目根 `standards-*.md` 仍是 init 空桩）：从 `../hact-method/templates/standards/{layer}.md` 挑选本期 TRD 相关项写入，不全量复制
- **迭代增补**：直接在项目根现有 `standards-*.md` 上**原地**追加 / 修订本期 TRD 新增的约定，不复制整份、不另起迭代副本
- **双源补充**：再取执行人个人 notes（`../hact-notes-{name}/notes.md`）中 `[规范]` 标签、与本 layer 相关的条目并入项目 standards——让本人已积累、尚未经 harvest-notes 上提的规范当期即生效
  - **去重**：并入前对照公共模板 + 项目根现有 standards，**已收录的同条目不重复并入**（避免 vN+1 重复注入），只补未收录的
  - notes 不存在 / 无 `[规范]` 条目 → 仅用公共模板 + 现有 standards
  - 与现有 standards 同项但建议不同 → 保留现有版本，把不同建议记入 `feedback.md` 走分流，不当场覆盖
  - 与公共模板 `templates/standards/` 某条冲突（区别于现有项目 standards 冲突）→ 以本期 TRD 决策为准，在 `decisions.md` 说明冲突和理由

> **适用前提（设计甲）**：当前架构 / 开发高度重叠，draft-tech-design 执行人 ≈ 本期真实开发者，故在生成端注入本人 notes 即覆盖实际写代码的人。团队分化后是否扩展到 develop / pr-review 加载端（设计乙），见 `../hact-method/_meta/plans/方法论待议.md`。

**Subagent prompt 要点**（frontend / backend 各一份）：
- 传入：TRD 完整内容 + 对应 `../hact-method/templates/standards/{layer}.md` + 项目根现有 standards（如有）+ 执行人个人 notes 中本 layer 相关的 `[规范]` 条目
- 输出：本期适用的规范条目，格式与模板一致，不生成模板中没有的条目类型；并入 notes 条目前先对照公共模板 / 现有 standards 去重
- 主线负责写文件（项目根 `standards-{layer}.md` 原地播种 / 增补），不让 subagent 直接写文件

主线处理项目根 `standards-shared.md`（命名规范 / 错误码 / API 响应格式 / 权限模型），首期播种 / 迭代增补同上规则。

**测试基建约定（不可视区测试的地基，不可省）**：`standards-backend.md` 必含「测试框架约定」一节——测试框架选型 + `npm run test`（或等价）命令 + 测试文件位置约定。这是 develop 把不可视区 AC（Given/When/Then 例子）落成可运行测试的前提（核心抓手 A）；没有它，develop 的 `npm run test` 步无处落地。
- 首期项目：在此确立框架，写入 standards-backend 与 `project.md` 技术层。
- 存量项目首次迁移到本规范：若项目尚无测试运行器，标记为迁移待办——补 standards 测试约定 + 在项目装运行器后，backend develop 的测试步方可正常跑（见 `develop-core.md` Step 5 无运行器处理）。

三份汇总后检查：无重复条目 / 无相互矛盾 / 覆盖 TRD 提到的所有关键约束。

**Subagent 失败判定**：以下任一情况视为失败，主线接管该份 standards：
- subagent 返回内容为空或格式完全不符合模板结构
- subagent 返回内容包含大量与 TRD 无关的通用规则（未基于 TRD 提炼）
- subagent 运行超时或报错

主线接管时：直接基于 TRD 对应层（frontend/backend）的相关章节手动生成该份 standards，记录原因。

---

### Step 5：知识沉淀

更新 `decisions.md`，追加本期关键架构决策（格式：决策 / 原因 / 日期）。

> **边界**：技术选型有重大变更（替换已有依赖）→ 写入 `decisions.md` 并说明原因，不静默替换。

更新 `project.md` 技术层（技术选型 / 数据库结构 / 模块划分）。

---

### Step 5.4：结构 linter 自检（【linter】判据的最终判定，含交叉对账）

签 G2 前跑确定性检查。此刻 PRD 与 TRD 都在，**两条交叉对账在此兑现**——这是 draft-prd-vN 阶段无法跑、留到此处的：① PRD `涉及实体` ↔ TRD `### 表`；② PRD `AC-nn` ↔ TRD `# 满足 AC` 回链（逐条正向挡悬空 + 逐条反向验覆盖，机械化 AC 覆盖映射自检）。这些是【linter】判据，机械核定，**不派判据冷核 subagent**（子计划 3 已删；内容有效性另由下方 Step 5.5 末端审查，是两回事）：

```bash
node scripts/check-docs.js iterations/vN/prd.md iterations/vN/trd.md
```

- 退出码 0（全 pass）→【linter】判据全部通过；语义判据确认后进 Step 6 签字。
- 退出码 1（有 FAIL）→ 按报告逐条修：
  - TRD 段落缺/槽位空/表块或接口块缺 → 修 `trd.md`。
  - 交叉对账 FAIL（PRD 实体无对应表）→ 多数是 TRD 漏建表，补 `### 表：{名}`；若确认该"实体"非持久化数据（纯前端态/外部系统），则回 `prd.md` 把该功能 `涉及实体` 改正（去掉或写"无"）。
  - 交叉对账 FAIL（AC 回链悬空 / PRD AC 未被承接）→ 悬空：改正 TRD 回链号或删退休号；未被承接：在对应载体补 `# 满足 AC：AC-nn`，或列疑点向用户确认本期不做。
  - 重跑到绿（签字 commit 的 pre-commit 门卫会再跑一遍、红则拦 commit——"跳过 linter 偷签"机制上做不到，故不写强制散文）。

> linter 覆盖结构/一致性判据（含 AC 覆盖映射的**齐全性**机械核）；**语义判据**（接口字段是否真满足画面、载体是否**真承接**所回链的 AC 而非仅 id 在场）落 linter 🧑 段，由 Step 5.5 末端审查 + 签字时复核 + 后续 `pr-review` 技术保真把关。
> 项目仓无 `scripts/check-docs.js`（存量项目未铺）→ 退回 `../hact-method/skeleton/06-gates.md` §7 G1/G2 段的人工逐条核对兜底（无 subagent），并提示"建议补铺 linter（见 init-project Step 3）"，不阻断。

---

### Step 5.5：独立内容审查（格式之外的内容有效性）

check-docs（+ 门卫）守**结构与覆盖齐全性**；**内容有效性派全新 subagent 陌生视角复核**（防同上下文自评盖章）——TRD 的语义残量比 PRD 更厚（接口契约对不对、精化缩没缩水、字段满不满足画面）。

**派发 brief（下列即 subagent 的指令，逐条原样喂它，不是只你自己读）**：

- **上下文**：只喂**定稿 trd.md + prd.md**（+ `ux-flows.md` / `prototype.html` 如有），**不喂生成对话与疑点答疑**。
- **任务**：陌生视角逐条查——
  - **内部一致性**：接口引用的字段在数据库设计段有对应表/列；模块调用方向无悬空 / 无环；接口 / 表 / 模块命名互不矛盾。
  - **AC 真承接**：每条 `# 满足 AC` 的载体**内容真覆盖**该 AC（非仅 id 在场）；幕 2 精化例子忠实 PRD 行为例子意图（状态码/错误码/断言没夹带、没缩水）。
  - **字段满足画面**：`prototype.html` 在时，接口请求/响应字段够该画面所需数据。
  - **覆盖完整**：测试环境约定四项（后端地址 / 前端访问 / 数据库指向 / 副作用禁止清单）齐；有无明显遗漏的错误码 / 边界 / 空态。
- **输出**：**问题清单**（每条注位置 + 为何是问题），**禁止 pass 盖章**；无问题就明说"未发现"，不凑数。
- **边界**：只查"看得出的"客观不一致 / 遗漏；**不替用户判技术选型方向**（选型取舍归用户 + `decisions.md`）。

CC 据清单与用户过一遍：真问题 → 改 TRD；属技术取舍 → 用户拍板。

> subagent 失败 / 超时 → 主线自审兜底（陌生视角降级），不阻断。

---

### Step 6：G2

> **签字前置**：Step 5.5 内容审查问题已处理 + 语义判据已确认（载体真承接 AC、接口字段真满足画面）。（结构 linter 由下方签字 commit 的 pre-commit 门卫强制兜底，无需在此重述"退出码 0 才签"。）

```
✅ TRD + standards 完成：TRD [N] 段，standards 三份（shared / frontend / backend），decisions.md 已更新。
要签 G2 吗？
```

🚫 等用户确认

用户确认 → 写 `iterations/vN/gates.md`：
```markdown
- [x] G2：TRD 已确认 — {YYYY-MM-DD}
```

**更新项目根 `status.yml`**（字段见 `../hact-method/skeleton/07-status-contract.md`）：将 `iterations.vN.gates.G2` 改为 `{ signed: true, date: {YYYY-MM-DD} }`（文件不存在则先从 `../hact-method/templates/status.yml` 补建）。

执行 `git add iterations/vN/trd.md standards-shared.md standards-frontend.md standards-backend.md iterations/vN/gates.md status.yml && git commit -m "feat(trd): v{N} TRD + standards 完成，G2 签署 [{项目名}]" && git push`（standards 在项目根，非 iterations/vN/）

**feedback 检查**（签 G2 后）：
- 疑点清单超过 5 条且多条根因相同（如 PRD 对某类场景描述方式有共性问题）→ 写入 `feedback.md`（格式：`{日期} | {发现} | 建议在 draft-prd-vN 的开放问题清零步骤中加强 {具体环节}`）
- standards 生成后发现与 TRD 有明显脱节（需要大量人工修正）→ 写入 `feedback.md`
- 无发现 → 跳过

移交：「TRD 完成，下一步 `plan-sprint`。」

---

## 红线

- **禁止省略测试环境约定段**：TRD 中「测试环境约定」是必填段，无论项目大小
- **禁止跳过疑点清单确认**：疑点清单未经用户逐条确认前不开始写 TRD
- **禁止自行补全 PRD 遗漏**：PRD 有歧义或缺失时，列入疑点清单等用户确认，不自行假设填写

---

## Subagent 使用

| 触发点 | Subagent 任务 | 失败处理 |
|--------|-------------|---------|
| 会话启动 | Explore 并行读 6 份输入文件 | 读取失败则主线单独读，不阻断 |
| Step 4 standards 生成 | 2 个并行 subagent 各生成一份 | 失败则主线接管该份，记录原因 |
| Step 5.5 内容审查 | 全新陌生视角审 TRD 内容有效性（一致性 / AC 真承接 / 字段满足画面 / 覆盖），输出问题清单 | 失败则主线自审降级，不阻断 |

> **Step 5.5 内容审查 ≠ 子计划 3 退场的"完成判据冷核"**：后者核【linter】判据完整性、已归 `check-docs.js` 机械核（Step 5.4）；前者验 linter 兜不住的**内容有效性**（载体真承接 / 精化忠实 / 字段满足画面），是另一角色。存量项目未铺 `check-docs.js` 时格式核对退回 `../hact-method/skeleton/06-gates.md` §7 G1/G2 段人工兜底（Step 5.5 内容审查照常派）。

---

## 上下文管理

- Step 2（TRD 骨架确认后）做一次 compact，再开始写完整 TRD——骨架确认是探索讨论阶段的天然终点，写作阶段需要保持各段内部一致性
- compact 前在 `_meta/sessions/draft-tech-design-progress.md` 记录：疑点清单各条答案摘要 + TRD 骨架（接口列表 / 模块划分 / 共享组件）

**断点续做**：
- 读 `iterations/vN/trd.md` 判断写到哪一段（按 7 段结构对照）
- 读项目根 `standards-*.md` 判断本期增补是否已落（活文档，看是否含本期 TRD 新约定）
- 读 `iterations/vN/gates.md` 判断 G2 是否已签
- 从未完成的段落或文件继续
