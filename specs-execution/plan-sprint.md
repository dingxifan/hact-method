# exec: plan-sprint

> 任务：读 TRD 拆 develop 任务，写任务包入 queue，输出 sprint.md，签 G3。三层：**骨架**（任务清单对齐）→ **结构层**（完整任务包）→ **收尾**（sprint.md + G3）。
> 任务包套结构化模板 `../hact-method-lab/templates/queue/task-package.md`——模板已带字段格式、AC 的 intent/oracle/example/golden 写法与 reference 稳定锚规则；本文只讲过程与判断。`check-sprint.js` 据模板 parse。

**上下文密度**：高。读多份文件、写多份任务包；骨架确认前不写任务包。

---

> **步骤协议**：机械读取、写文件和检查正常时静默执行，不逐步播报完成总结。只在 🚫 人类确认、会改变范围/取舍的 ⚖️ 默认判定、异常/`blocked` 和最终移交时输出；🚫 必须停下等明确回应，⚖️ 用一行结论 + 理由后继续，用户可随时推翻。

---

## 会话启动

**前置：G2 是否已签** — 读 `iterations/vN/gates.md`：未签 → 阻断「⚠️ G2 未通过，TRD 未确认，先完成 draft-tech-design 再规划 Sprint」；已签 → 继续。

**必读文件**（可用只读调查单元并行读并返回带路径摘要；不可用则主线顺序读）：
- `iterations/vN/prd.md`（AC 来源——任务包 AC 须回链至此，G2 后开发链中段唯一回看 PRD 的窗口）
- `iterations/vN/trd.md`
- 项目根 project.md 技术层、Foundation 与本期实际涉及的契约/检查配置
- 项目根 `reusables.md`（避免任务包重复指派已有实现）
- 项目根 `decisions.md`
- `iterations/vN/ux-flows.md`（若存在，供前端任务包 `reference`）

**选项列表**（G2 已满足，确认要做什么）：

```
{项目名} · G2 已签，TRD + 验证入口 已确认

可做的任务：
[1] plan-sprint — 拆任务包，规划 Sprint ← 主线

其他可做（输入「展开」/ 自由描述）：
- revise-doc(target=trd) — 若发现 TRD 或项目约束 有需修订之处，先修再规划
- revise-doc(target=prd) — 若发现 PRD 有需修订之处

请选 [1]，或输入「展开」，或直接说你要做什么。
```

🚫 等用户选择后再继续（⚖️ 例外：用户开场已明确表达主线意图——如直接说「规划 sprint」——本列表跳过不出，播报一行后直接进入主线）。选 [1] → 继续（疑点 → 任务骨架）；选其他 → 按描述加载对应 exec spec。

开场：「分三层完成 sprint 规划：先出疑点清单 + 任务骨架等你确认，确认后再写完整任务包。骨架确认前不写任务包。」

---

## 第一层：骨架

### Step 1：疑点清单

读完 TRD 列出实现边界不清晰的点（格式同 draft-tech-design Step 1）。无疑点明确说"已通读，无疑点"。

🚫 等用户逐条确认疑点

---

### Step 2：输出任务骨架

疑点确认后输出骨架——**每任务只一行**，不写详细字段：

```markdown
## Sprint 骨架 · v{N} · {项目名}

| task-id | 标题 | layers | 依赖 | 交付 |
|---------|------|--------|------|------|
| {name}-v{N}-001 | {一句话描述} | backend | — | 串行 |
| {name}-v{N}-002 | {一句话描述} | backend | — | 可并行 |
| {name}-v{N}-003 | {一句话描述} | frontend | {name}-v{N}-001 | 可并行 |
```

任务 ID：`{项目缩写}-v{N}-{三位序号}`，如 `auth-v1-001`。
某 TRD 模块耦合过深、拆不成独立 develop 任务 → 先写一个大任务包，在其 `known-risks` 标耦合点，不强拆。

**交付方式判定（⚖️ 默认判定，骨架表「交付」列即判定结果）**：先列每包预计写入的文件与共享资产键，再对 `依赖` 列非 `—` 的任务逐一判断。两个任务命中同一文件或同一表/枚举/共享类型/API/事件/配置键时默认串行，并补任一方向的依赖；只有写集不重叠且依赖闭合时才标 `可并行`。骨架表下**逐条附一句判定理由**（如 `{task-001}：串行 — 前端 {task-003} 调用其新增接口，必须先合并`），随下方 🚫 一并确认，不单独阻断。

**判断标准（针对被依赖的上游任务）**：

| 判断问题 | 结论 |
|---------|------|
| 下游需直接调用上游新增的 API 端点，且开发/自检时该端点必须实际存在于 master 才跑得通 | 上游 → `串行` |
| 下游引用上游新增的共享类型/接口定义，编译时必须依赖该定义 | 上游 → `串行` |
| 两任务写同一文件，或同一共享表/枚举/类型/API/事件/配置项 | 选定 source-of-truth 包，其余包依赖它；全部 `串行` |
| 两任务逻辑相关但无代码级调用，或同属一 layer 可在同分支内按序实现 | 上游 → `可并行` |

**含义**：`串行` = 默认独立分支/PR、其下游在另一会话需要从 master 取用时必须等它合并；`可并行` = 与同 layer 其余可并行任务合一个分支/PR 统一交付。`串行` 记录共享写集和团队协作边界，不是单人本轮必然拆 PR 的永久属性：G4 拾取时若所有单人 wave 条件都满足，可选择派生执行形态 `single-operator-wave`；不改本列、不改依赖方向。

**视觉地基包规则**（本迭代含 frontend 任务时）：UI 库主题覆盖 / 全局 reset / body margin / token 全局接线这类**跨切面公共件不属于任何业务页**，按页/组件切包会天然漏掉——必须显式拆一个「视觉地基包」兜底：
- **v1（硬性必有，含前端时）**：地基包为前端**首包**（建议 001），其余 frontend 任务 `depends_on` 它（要用其 token），加 `baseline: visual` 标记（check-sprint 据此核 v1 必有）。内容按是否走过 V0 走骨架分（**框架/值二分**）：
  - **走过 V0 的新项目**：视觉地基**框架**已由 V0 建成（全局 reset + UI 库主题覆盖结构 + `variables.scss`/`main.ts` 单一全局入口，占位 token）→ v1 地基包**只缩成「把 `design.md` 真值填进 V0 的 `variables.scss`」**+ 补 design.md 新增而 V0 框架未覆盖的 token。**不重建框架。**
  - **存量项目（未走 V0）**：地基包建全套（兜底）——全局 reset + UI 库主题覆盖（设计主色映射进项目 UI 库的主题变量、禁库默认主色；变量名见栈子模板）+ design.md token 全局接线（全局变量文件 + 应用入口单一全局接线，路径按项目栈）。
- **vN+1（design.md 或 foundation.md 变更触发）**：
  - ① `design.md` 较上期有变更（新增/改色阶/改布局 token）→ 追加**视觉**「地基跟进包」覆盖变更点（标 `baseline: visual`）。
  - ② `foundation.md` 较上期**新增关注点**（draft-tech-design Step7 增补的非视觉地基，如新错误类目 / 作用域维度 / 全局拦截）→ 追加对应「地基跟进包」建其底料（前端项标 `baseline: visual`；后端/shared 项为普通包，标题注「地基跟进」、其余同层 `depends_on` 它）。
  - `git log --oneline -- design.md foundation.md` 比对上期 G3 后是否动过。
  - **关注点标了 ≥机械级 → 跟进包 AC 必须含反例验证**：「写一条违规、跑对应检查、验证真被挡」，不能只写"接了 lint 规则 / 加了约束"。档位是"拦得住"的声明，AC 不验反例就等于没建（同 V0 探针纪律）。
- 地基已建成且 design.md / foundation.md 均无变更 → 无需地基包。

🚫 等用户确认拆分合理性（粒度 / 依赖 / 遗漏 / 交付方式判定 / **地基包是否齐备**——交付方式为 ⚖️ 默认判定结果，随本次确认一并过目，用户可逐条推翻）

---

## 第二层：结构层

### Step 3：逐个写任务包

骨架确认后套 `../hact-method-lab/templates/queue/task-package.md`（YAML frontmatter，`check-sprint.js` 据此 parse）为每任务写完整字段包（字段权威见 `specs-structural/develop.md §字段规范`）；字段格式、AC 权威层级与 reference 锚规则由模板承接。每包只写相对 as-built 的 delta，normative core 超过 8–12KB 时拆包或迁 non-normative appendix。**数量**：≤4 主线逐个写、>4 可启并行隔离执行单元（各 2–3 包，见「隔离单元使用」）；隔离单元只返回内容，由主线写文件。每包入 `iterations/vN/queue/{task-id}.md`，状态 `[可取]`。

下表只列**模板讲不了的判断 / 跨文件来源**（中）+ **该字段验证归属**（右，显式标谁机械、谁留人）：

| 字段 | 怎么填（判断 / 来源，模板之外） | 验证归属 |
|------|------|------|
| `package-schema` / `module` | 新包固定 schema 2；module 取 TRD「模块拆分」稳定名称，同模块包必须同值 | check-sprint·schema/module 非空；Step 3.5 对 TRD 归属 |
| `depends_on` | Step 2 已确认依赖（与 sprint.md 依赖列、status.yml 三处一致）；共享资产消费（共用表/枚举/类型）消费方→source-of-truth 任务（反查得出，不另存消费方列表） | check-sprint·在册 ¹ |
| `asset-writes` | 从本包 delta 提取跨文件共享写集，稳定键格式见任务包模板；无则 `[]`。不得把“都改同一资产”伪装成逻辑相关后继续并行 | check-sprint·与各包 files/asset-writes 两两交叉 ¹ |
| `contract-impact` | 实现已确认 PRD/TRD/Foundation/project 技术约束的任务填 `governed`；完全不触及共享契约填 `none`。本字段不授权改契约，发现权威文档需变更先停下走 revise-doc | check-sprint·枚举；Step 3.5 核契约是否已先修订 |
| `risk` | 默认 `standard`；若任务触及 develop 合并前安全敏感预检四类之一（权限/认证/数据隔离、不可逆数据操作、金额/计费计算、对外不可撤销副作用）则填 `sensitive`；**存疑即 sensitive**（只升不降，决策#29）。缺省即 standard，存量任务包不回填 | Step 3.5 独审第⑥类 + check-sprint 启发 🧑；develop 侧按有效 risk 兜底 |
| `acceptance-criteria` | 不发明无来源 AC。每条拆 `intent`（PRD 行为）+ `oracle`（PRD/TRD 判据）；`example` 可省且默认非权威。仅封闭输入、可独立复算并在 Step 3.5 通过的例子标 `golden: true` | check-sprint·回链/格式；Step 3.5 独立复算与忠实性 |
| `design-reference-format` / `reference` | frontend：design 有页面规格结构填 `sliced-v1`，reference 链全局视觉基线 + 本任务页面标题；视觉地基包只需全局基线。存量 design 无页面结构填 `legacy-full` + `design.md 全文（存量）`。另链 ux-flows 对应场景（若存在）；backend 链 TRD 错误/服务流程 | check-sprint·design/稳定锚 ² |
| `supersedes` | 来源 = TRD 里「本期废除 / 改判 / 替换既有实现」的表述 + `decisions.md` 被本期取代的条目。判据是**取代关系**而非改动关系：改一个函数不算，让某实现从此无调用方才算。无则 `[]`——宁可空着，不为凑数写。 | 交付时逐条结账（develop §退役账）；G5 核对 |
| `api-contract`（`layers=[backend]` 且被前端依赖） | 来源 = TRD 数据模型 + design.md 画面字段需求 + 已写前端任务包草稿（表格列/表单字段）；request 取 TRD query/body，response 取前端实际消费字段（平铺规则在模板）；**全部后端包写完统一向用户确认字段结构** | Step 3.5·推导正确性；用户确认 |

¹ `check-sprint.js` 对同一 `files` 路径与同一 `asset-writes` 键做两两交叉；任一方向都没有依赖路径即 FAIL。显式依赖只证明已串行化，不证明 source-of-truth 选择正确，后者仍由 Step 3.5 审查。
² golden 例子复算留 Step 3.5；check-sprint 只核 reference 存在稳定锚。

> 写包自检（提前跑、门卫兜底）：模板字段无空（`api-contract` 仅 backend 且有前端消费时填；`risk` 缺省按 `standard` 处理，不接 linter）+ AC 双向对账（纵向每条回链某 PRD AC / 横向 PRD 每条 AC 被某包覆盖）由 `check-sprint` 逐条机械核（Step 4.7）——此处早发现失配即补、不静默放过；逐条**忠实性**（内容真覆盖、非仅 id 在场）留 Step 3.5 + 签字人。

---

### Step 3.5：任务包独立证据审查

**派发**：默认只派一个普通档隔离审查单元，令其读 `../hact-method-lab/templates/review-briefs/task-package-review.md` 按 brief 执行，告知本期迭代版本 vN + `review-scope: full`。审查员一次自读 PRD、TRD、全部任务包 normative core，以及本期涉及的 project.md 技术约束、Foundation 与共享契约，统一核 AC→task 覆盖、依赖和共享资产全局关系。任务包数量本身不触发分批；具体模型见运行时映射。

只有“PRD + TRD + 全部 normative core + 本期涉及的项目约束”预计会超过当前模型的**无 compact 审查预算**时，才按业务模块切分，而不是按任意 2–3 包切：每批依赖闭合，派发 `review-scope: module:{任务包列表}`，只读这些包回链的 PRD 功能段/TRD 模块段。模块审查结束后派 `review-scope: global-summary`；该审查员自行运行 `node ../hact-method-lab/templates/scripts/build-task-review-index.js vN .`，只读其最小索引 + PRD AC 清单 + TRD 模块标题 + 各批 findings，不再读全部 frontmatter，专核跨批 AC 遗漏、共享资产 source-of-truth 与依赖断边。
> brief 查 AC 忠实/完备、oracle/example 可复算、api-contract、视觉地基与 risk。审查维度原文固化在 brief 文件，此处不重述。

**【loop 逻辑】**（主线拿到隔离审查 findings 后的处置）

| 隔离审查输出 | 动作 |
|---|---|
| `findings: []` | 退出，进入 Step 4 |
| 只有 `[建议]` | 记入 项目根 `feedback.md`（供 wrap-up 分流）；退出，进入 Step 4 |
| `example-error` | 修 example 或取消错误的 `golden`；只复核该 AC，不进入 develop 代码整改 |
| 有其它 `[阻断]` | 按 finding action 修任务包或发 `revise-doc`；只重审变化面 |
| 同一 `[阻断]` 修 3 次仍出现 | 停止 loop，上报用户；判断根因——若在 TRD（漂移点①：TRD 丢了 AC）则创建 `revise-doc(target=trd)`，不在本会话硬改 |

---

## 第三层：收尾

### Step 4：写 sprint.md

套模板 `../hact-method-lab/templates/sprint.md` 汇总生成 `iterations/vN/sprint.md`——每行对应 queue/ 一个任务包（task-id / title / layers / 依赖 / 状态 `[可取]` / PR `—` / 交付），附「## 依赖说明」段（可并行任务 blocked-by 串行任务 + 一句话原因）。

> 多迭代并行（vN 与 vN+1 同时有任务）时各迭代各写自己的 `iterations/vN/sprint.md`，queue 天然隔离于各自迭代目录，互不干扰。

---

### Step 4.5：填充 status.yml 的 tasks[]

把本期全部任务追加进项目根 `status.yml` 的 `tasks[]`（机器侧状态契约，项目级单文件，字段见 `../hact-method-lab/skeleton/07-status-contract.md`；不存在则先从 `../hact-method-lab/templates/status.yml` 补建）。

每任务一条：`source: sprint`、`type: develop`、`iteration: vN`、`sprint: {编号}`，初始 `status: 可取`、`assigned_to: null`、`pr: null`，其余字段（id / title / discipline / layer / parent_id / depends_on / delivery / urgency）取自刚写的任务包与 sprint.md。

> 「状态 vs 文件」分离的落点：sprint.md 是人看的视图，status.yml 是机器侧取数唯一来源（`check-sprint.js` / `check-gate.js`）；任务包正文（全部字段）不进 YAML，留在任务包文件里供人读。

---

### Step 4.7：签 G3 前 · 完成判据自检（提前跑，门卫兜底）

签 G3 前主动在项目仓根跑 `node ../hact-method-lab/templates/scripts/check-sprint.js vN .`，直接使用已同步的方法论当前版，把 G3 全部【linter】判据机械核到绿：必填字段 / reference 稳定锚 / AC 回链与 intent-oracle 格式 / 逐条反向覆盖 / depends_on / 三方一致。敏感启发词仍列 `🧑`。红则逐条修并重跑；项目本地 pre-commit 门卫在签字 commit 再兜一次。

脚本 `🧑` 段语义残量由签字人确认：疑点已逐条确认、TRD 每模块都有任务包、Step 3.5 独审无遗留阻断、任务包 AC 逐条**忠实**于回链的 PRD AC（内容真覆盖，非仅 id 在场）。

> 存量项目（无 `scripts/check-sprint.js` 且门卫未装，或任务包仍是旧序列化格式）→ 退回 `../hact-method-lab/skeleton/06-gates.md` §7 G3 段人工逐条核对兜底，并提示新 sprint 套 `templates/queue/task-package.md`。

---

### Step 5：G3

```
✅ Sprint 规划完成：[N] 个任务包入 queue，sprint.md 已生成，依赖已标注。
要签 G3 吗？
```

🚫 等用户确认

用户确认 → 写 `iterations/vN/gates.md`：`- [x] G3：开发包就绪 — {YYYY-MM-DD}`。

**更新 status.yml**：`iterations.vN.gates.G3` 改为 `{ signed: true, date: {YYYY-MM-DD} }`（tasks[] 已在 Step 4.5 填好）。

`git add iterations/vN/queue/ iterations/vN/sprint.md iterations/vN/gates.md status.yml && git commit -m "feat(sprint): v{N} sprint 规划完成，G3 签署 [{项目名}]" && git push`

**feedback 检查（签 G3 后）**：疑点超 3 条且根因集中（如 TRD 某类接口描述普遍不完整）/ 拆分中发现 TRD 多处遗漏需反复修订 → 写 项目根 `feedback.md`（`{日期} | {发现} | {建议}`）；无则跳过。

移交：「Sprint 已规划，开发者可从 queue 拾取任务，下一步 `develop`。」

---

## 隔离单元使用

| 触发点 | 隔离单元任务 | 输入要点 | 失败处理 |
|--------|-------------|------------|---------|
| 会话启动 | 只读调查单元并行读 6 份输入文件（纯读取+带路径摘要） | — | 读取失败则主线单独读 |
| Step 3（任务 >4 个） | 隔离执行单元各起草 2–3 个任务包 | 传入：task 标题 / layers / task_type / sprint_id / TRD 对应模块 / 项目技术约束 / reusables 相关条目；输出完整字段 YAML | 失败则主线接管该包 |
| Step 3.5 独立审查 | 默认一个隔离审查单元联合审全部任务包，维度见 brief `../hact-method-lab/templates/review-briefs/task-package-review.md` | 只告知 vN；超过无 compact 预算才按业务模块切，随后加一次 frontmatter/AC/共享资产全局总核 | 同一阻断 3 次→上报；根因在 TRD 则创 `revise-doc(target=trd)` |

**重要**：隔离执行单元只返回任务包内容，**由主线写入文件**，不让它直接操作文件系统。

---

## 上下文管理

- Step 2（骨架确认后）做一次 compact 再写任务包——骨架确认是探索讨论的天然终点，任务包写作需跨任务保持依赖与字段一致。
- compact 前在 `_meta/sessions/plan-sprint-progress.md` 记：任务骨架表（task-id / 标题 / layer / 依赖）+ 疑点清单各条答案摘要。
- Step 3.5 独审 + 修包在 compact 后高密度区；修包若需回看 PRD 细节而上下文已瘦 → 重读 `prd.md` 对应功能段再改，不凭记忆。

**断点续做**：读 `queue/` 统计已写任务包数 → 读 `_meta/sessions/plan-sprint-progress.md` 取骨架表，对照找未写任务 → 从未完成的任务包继续。
