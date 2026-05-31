# findings — 个人积累与 pull 上提

## 现状机制（读 spec 得出）

### 积累链路（wrap-up 第二步 feedback 分流）
6 类目的地，4 类落 hact-method 仓：
- 编码规范（原则级）→ `templates/standards/{backend|frontend}.md`（hact-method）
- 自检漏项 checklist → `templates/checklists/...`（hact-method）
- 方法论/工作流问题 → `_meta/plans/方法论待议.md`（hact-method）
- 跨项目通用机制 → 待议清单（hact-method）
- 项目架构决策 → `decisions.md`（项目仓 ✅）
- 无价值 → 删除

### 规范文件生成链路
- **`draft-tech-design`（G2，architecture）** 生成 `iterations/vN/standards-{shared,frontend,backend}.md`。
  - 来源：v1 源于 hact-method `templates/standards/`；vN+1 源于上期同文件增量更新。
  - 见 `specs-execution/draft-tech-design.md:156,190`、`templates/standards/{frontend,backend}.md` 头部注释。
- 下游 `develop`/`code-review`/`manual-test`/`generate-integration-tests` 对照这套迭代级共享 standards。
- `develop.md:288`：开发遇 standards 未覆盖且反复出现 → 写 `feedback.md`（这是 feedback 的来源之一）。

### 空落点
- `templates/retrospectives.md` 是空模板，未被任何 spec 引用 → 方法论本就缺"个人/项目级积累"永久落点。

## 关键设计推理

### 为何否决"单一共享 notes 仓"
git `clone` 是整仓拉取，无法只拉自己目录（除 sparse-checkout，且 pull 仍可拉全员）。个人积累带私人性，人人本地揣全员草稿 → 与"私有"冲突。故选每人独立仓。

### 为何"生成时写入"只惠及架构师却仍可接受（设计甲）
`draft-tech-design` 由架构师一人跑、在 develop 之前定稿，故只有执行人本人 notes 进得来。**当前架构与开发高度重叠**（solo/小团队），执行人≈真实开发者，所以够用。团队分化后才需要设计乙（develop 会话内叠加本人 notes 即时生效）。

### 权限边界（不变）
- 开发者：可 push 自己的 `hact-notes-{name}` + 项目仓；**不可** push hact-method。
- 管理者：可 push hact-method；对成员 notes 仓**只读**（收割用）。

## 全仓通读分析（2026-05-31，4 路并行 Explore agent + 甄别）

### A. 连带影响（不改则新模型有洞，必须纳入本次）

| # | 问题 | 证据 | 处理 |
|---|------|------|------|
| C1 | **B 类积累盲点（最重要）**：B 类（BUG处理/功能优化）无 Gate、无 wrap-up，故无 feedback 分流时机。B 类开发者踩的坑只能堆在项目 `feedback.md`，积压到下个 A 类迭代收尾才被处理；新模型下 B 类的积累进不了个人 notes。直接落空用户"大家都能积累"的初衷。 | B 类无 wrap-up（BRIEF #4/#6）；`develop.md` Step10 只写 feedback.md；`dispatch-new` 无收尾分流 | B 类 `develop` 移交时就地做"轻量分流"：编码/checklist/方法论类 → 本人 notes 打标签；项目架构 → decisions.md；无价值删。不依赖 wrap-up。 |
| C2 | **init-project 生命周期缺口**：谁、何时创建 `hact-notes-{name}` 仓并登记到成员清单——目前无归属。harvest-notes 要读的成员仓清单无来源。 | `init-project` 全程未提 notes 仓；`_meta/hact-config.md` 无成员登记表 | init-project（或独立"成员上线"小环节）补：确认参与者→检查/建 notes 仓→登记进 hact-config.md 成员表。 |
| C3 | **跨会话同步缺 notes 仓**：开发者会话（`templates/CLAUDE.md` Step0）只同步项目仓+hact-method。但开发者要读本人 notes（双源 D6）、写 feedback 进 notes（D5），需同步个人 notes 仓。 | `templates/CLAUDE.md` Step0 只两个仓 | Step0 加第三个同步点（个人 notes 仓，路径 `E:\group-code\hact-notes-{name}`，不存在则提示跳过）；同步声明扩展。 |
| C4 | **draft-tech-design vN+1 双源重复**：双源在 vN+1 会重复注入上期已采纳的 [规范]（上期 standards 已含、本期 notes 又取一次），无去重 → standards 冗余累积。 | `draft-tech-design` vN+1"源于上期 standards 增量更新" | 改造 draft-tech-design 时加去重规则：读本人 notes [规范] 时对照上期 standards-{layer}.md，只追加未收录条目。 |
| C5 | **skeleton/01-identity 权限例外未声明**：个人 notes 写入**不走 discipline 准入**（权限绑身份，本人写/管理者只读），与既有"拉取准入 = task.discipline ∈ user.disciplines"模型是例外，需明示否则冲突/困惑。 | `skeleton/01-identity` §权限；BRIEF #16/#18/#19 | 01-identity 补"个人积累特殊权限模型"段；BRIEF 补决策条目。 |

### B. 对称优化点（双源/个人积累可推广处，多数建议记待议而非本次做）

| # | 点 | 判断 |
|---|----|------|
| O1 | **checklist 对称缺口**：设计甲只让 standards 双源（生成端注入）。checklist 不由 draft-tech-design 生成，故本人 [checklist] 当期不生效，只能上提后下期全队用。 | 与 D7 同根（执行人当期生效问题）。建议：**记待议**，与设计乙一起待团队分化评估；或短期在 develop 自检加一句"过一遍本人 notes 的 [checklist]"（轻量，可选纳入）。 |
| O2 | **reusables 个人化**：可复用资产是否也"个人攒→上提"。 | **不纳入**。reusables 是代码级资产、共享意图强，一开始就该写项目 reusables.md，无需私人草稿阶段。已评估排除。 |
| O3 | **decisions 个人化**：架构决策是否个人化。 | **不纳入**。decisions 是项目上下文强关联，留项目仓。已评估排除。 |
| O4 | **retrospectives.md 去留**：空模板、未接流程，与 notes [心得] 重叠。 | 自检阶段定：改造为"项目级迭代回顾"（wrap-up 第三步填）或直接删。 |

### C. 已甄别排除（agent 提了但与本次无关 / 误判）

- dispatch-new / manual-test "修复快速通道"的代码改权假设：既有独立问题，非本次变更引入，不在本次范围。
- agent 报 `hact-config.md` "不存在会卡住"：实际文件存在（`_meta/hact-config.md`），系误判；但确需扩充成员表+游标。
- agent 给的工期/天数估算：臆测，忽略。
- agent 把"spec 尚未体现双源/分流改造"当发现：那是本计划阶段3/4 待做项，非新发现。

### D. 待 harvest-notes spec 明确的细节（阶段2）

- 成员仓登记表 + 收割游标的落点：建议放 `_meta/hact-config.md`（已是全局配置位）；游标频繁更新可考虑单独 progress 文件。
- 触发频率：管理者按需/周期手动跑（非每次 wrap-up 自动），spec 写清。
- 收割去重/择优策略：同类多人提及→合并；单人且不通用→留待议或删。
