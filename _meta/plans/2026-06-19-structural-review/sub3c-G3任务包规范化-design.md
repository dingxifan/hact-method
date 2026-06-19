# sub3c · G3 完成判据检查器 + 任务包规范化 — 兑现 §7 散文大头整段拔

> 日期：2026-06-19（会话 5）
> 上游：`sub3b-G345检查器-design.md` §10（sub3c 待办）+ `design.md` §2.5（散文大头整段拔的兑现目标）
> 性质：sub3b 拆出的续做。G4/G5 已迁 check-gate；本轮补 G3 的 `check-sprint.js`，连同 `skeleton/06-gates.md` §7「G3」段冷核协议主体一起删——这是 design §2.5 点名「最大的散文删除……埋点未拔」的最终兑现。

---

## 0. 一句话

G3 的完成判据要 parse 任务包，而任务包格式既未规范化、又跨迭代漂移（v1 markdown 段 / v4 全 YAML、缺 `depends_on`/`api-contract`/AC 回链）。本轮先**规范化任务包**（sub1 同款：固定模板 + 校正 spec 单一真相 + 存量冻结），再建 `check-sprint.js` 覆盖 G3 的确定性判据，最后**删掉 §7 整段 G3 冷核协议**，让 §7 塌缩成单一模型：所有 Gate = 检查器绿 + 枚举语义人签。

---

## 1. 三个定档决策（对齐既有 sub1/sub3/sub3b 模式，非新发明）

### D1 · 序列化锁定 = YAML frontmatter（v4 实况）

实测两套格式：v1（5 字段 frontmatter + 9 个 `## markdown` 段，`layer` 单数）vs v4（全 YAML frontmatter 16 键，`layers` 数组）。**取 v4 的 YAML frontmatter 为唯一规范序列化**——它是最新格式、可机械 parse、与 `develop.md §字段规范` 的 `string[]`/`object` 类型天然吻合。v1 的 markdown 段布局退役。理由同 sub1 给 PRD/TRD 锁固定 header：linter 要可靠 parse 必须先锁序列化。

### D2 · 存量冻结，不回溯

hact-app v1–v4 任务包不回填 `depends_on`/`api-contract`/AC 回链。`check-sprint.js` 只对**新 sprint**生效；存量项目（项目仓无 `scripts/check-sprint.js`）退回 §7 兜底——与 check-docs（PRD/TRD）、check-gate（G4/G5）的「存量退回人工兜底」完全一致。逐字段分清的两类缺失：
- **真漂移**（spec 有、实况从未落地）：`depends_on`、`api-contract` —— 规范化时确认它们是 spec 正式字段，新 sprint 必填（无依赖填 `[]`；api-contract 条件必填）。
- **有意前置**（spec 后加、旧产物自然没有）：AC `(源：PRD…)` 回链（2026-06-03）、不可视区 AC 的 Given/When/Then（sub2 本轮）—— 保留，新 sprint 必带。

### D3 · AC 反向覆盖 = 功能级机械 + 逐条留人

- **正向**（每条任务包 AC 带 `(源：PRD…)` 或 `(技术)` tag）：完全机械，check-sprint 验。
- **反向·功能级**（每个 PRD `### 功能：X` 被某任务包 AC 的 `(源：PRD X·…)` 覆盖）：机械（功能名精确匹配，与 check-docs 实体↔表同款），check-sprint 验——挡住「整个功能无任务」。
- **反向·逐条 AC**（PRD 每条 AC 都被覆盖）：**留人**。PRD AC 无稳定 id，无法机械匹配到任务包 tag 的关键词；这条仍由 plan-sprint Step 3 AC 双向对账自检 + Step 3.5 独审 + 签字人复核兜。给 PRD AC 加 id 是未来的一桩规范化，不在本轮。

> 诚实记账：design §3.1 原设想反向「逐条」也机械化，实测受限于 PRD AC 无 id，本轮做到功能级。check-sprint 的 `🧑 留签字人确认` 段显式列出逐条反向覆盖留人。

---

## 2. 交付物

### 2.1 `templates/queue/task-package.md`（新建·规范化地基）

YAML frontmatter，全 17 字段 + 条件 `api-contract`，`<待填>` 空槽 + 行内注释提示取值。结构照 v4 实况补齐 `depends_on`/`api-contract`/AC 回链格式提示/Given-When-Then 提示。

### 2.2 `templates/scripts/check-sprint.js`（新建·G3 真 linter）

纯 Node 无依赖，风格沿用 check-docs/check-gate。读 `iterations/vN/queue/*.md` + `sprint.md` + `prd.md` + 项目根 `status.yml`。覆盖 G3 确定性判据：

| 检查 | 机制 |
|------|------|
| 字段完备 | 17 字段在册非空（占位=空）；backend 且被前端 `depends_on` 消费 → `api-contract` 非空 |
| reference 行号 | 每条 reference 含 `L\d+`/`\d+-\d+`，拒"全文"/无范围；前端任务 ≥1 条提 `ux-flows`；后端任务 ≥1 条提 `trd` |
| AC 正向 tag | 每条 AC 含 `(源：PRD…)` 或 `(技术)` |
| AC 反向·功能级 | PRD 每个 `### 功能：X` 被 ≥1 任务包 AC `(源：PRD X·…)` 覆盖 |
| depends_on | 字段存在（无依赖 `[]`，空槽=FAIL） |
| 三方一致 | sprint.md 表行 / queue 文件名 / status.yml `tasks[]`(source=sprint,iteration=vN) 三集合一致 |

`🧑` 段留人：疑点确认、TRD 模块覆盖、Step 3.5 独审结论、逐条 AC 反向覆盖。无 status.yml → 三方一致退兜底（pass + 提示），与 check-gate 同。

### 2.3 spec 校正 + §7 整段拔（净收缩兑现）

- `specs-structural/develop.md §字段规范`：补一句锁序列化（YAML frontmatter，引 `templates/queue/task-package.md`）。17 字段表已是单一真相，无需改字段本身。
- `skeleton/06-gates.md` §7：**删整段「G3（暂无 linter…）」**（引子 + 为什么需要 + 软版边界 + 5 步协议 + 凭证模板 + 「与既有审查的关系」）；intro 改为「三套检查器 check-docs/check-gate/**check-sprint** 全覆盖 G1–G5」；新增极简「G3（check-sprint.js）」段同 G4/G5 形态。§7 从「两层模型」彻底塌缩成「所有 Gate = 检查器绿 + 枚举人签」。
- `specs-execution/plan-sprint.md`：Step 4.7 冷核步 → 跑 `check-sprint.js` + 删 `gate-checks/G3.md` commit + Subagent 表删冷核行；Step 5 签字前置改 linter。
- `specs-structural/plan-sprint.md`：完成判据「已冷核」行 → 「check-sprint 退出码 0 + 语义人签（存量退回兜底）」，机械判据标【linter】。
- `specs-execution/init-project.md`：Step 3 铺脚本连同 check-docs/check-gate 一起铺 check-sprint.js。

---

## 3. 净收缩诚实账

- **删**：§7「G3」段冷核协议主体（~35 行，含 5 步 + 凭证模板 + 软版边界 + 与既有审查关系）+ plan-sprint Step 4.7 冷核步 + Subagent 表行 + structural 冷核行 + `gate-checks/G3.md` 凭证产物。**§7 至此整段拔净**——design §2.5 的「散文大头」三关全清（G1/G2 sub3、G4/G5 sub3b、G3 本轮），§7 从 ~60 行两层模型塌缩成 ~25 行单层。
- **加**：`check-sprint.js`（真检查器，code≠prose，§2 明确不背叛）+ `task-package.md` 模板（结构化地基，同 sub1 的 prd/trd 模板，不算散文）。
- **结果**：把净收缩从 sub3b 的「部分兑现」推到「整段拔净」——design §2.5 目标达成。

---

## 4. 边界

本稿固化决策与清单。check-sprint.js 实现、§7 改写文本是实施产出。PRD AC 加 id（让逐条反向覆盖机械化）、任务包 hook 闸门均不在本轮，记 parked。
