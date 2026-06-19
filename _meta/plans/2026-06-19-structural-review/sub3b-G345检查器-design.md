# sub3b · G3/G4/G5 完成判据检查器 — 兑现散文大头删除

> 日期：2026-06-19（会话 3）
> 上游：`design.md`（方向）+ `sub3-gate重定义-design.md`（G1/G2 已做）+ task_plan「下一步 #3」
> 性质：子计划 3 的**续做** —— 把 G1/G2 的「linter 绿 + 人签语义」模型推广到 G3/G4/G5，连同 `skeleton/06-gates.md` §7 冷核协议主体一起删。这是 design §2.5 点名的「最大的散文删除……埋点未拔」的兑现。

---

## 0. 一句话

G1/G2 已从「subagent 冷核」迁成「linter 绿 + 人签」。G3/G4/G5 还压着 §7 那段 ~32 行的冷核协议主体（design §2.5 称之为散文大头之一）。本子计划给这三关补上确定性检查、**删掉整段 §7 冷核协议**，让 §7 塌缩成单一模型：「所有 Gate = 检查器绿 + 枚举化语义残量由对应职能人签」。

---

## 1. 三关非对称（按完成判据逐条分类）

分类键：**S**=status.yml 可派生 · **L**=linter 结构/一致性可验 · **H**=真·人判（语义/品味/用户确认）。

### G3 · plan-sprint（重度结构化 —— 唯一需真建 linter 的关）

| # | 完成判据 | 类 |
|---|---------|---|
| 3 | 所有任务包 17 字段完整无空；backend 有前端消费的 `api-contract` 已填 | **L** |
| 4 | 字段保真：`reference` 每条含行号；前端含 ux-flows 行号；后端含 TRD 行号 | **L**（正则可验） |
| 5 | AC 双向对账：每条任务包 AC 可回链 PRD AC（或标 `(技术)`）；PRD 每条 AC 被覆盖 | **L**（PRD↔queue 交叉，check-docs 同款手法） |
| 7 | 依赖关系已标注 | **L** |
| 8 | 每个任务 `交付` 列已填（独立/批量） | **L**（枚举） |
| 9 | sprint.md 已写，任务列表与 queue/ 一致 | **L**（sprint↔queue↔status 三方一致） |
| 1 | 疑点清单用户逐条确认 | **H**（过程，人确认） |
| 2 | TRD 每个模块都有对应任务包 | **H**（TRD 模块非机器可枚举，覆盖判断留人） |
| 6 | 任务包独立对抗审查通过（= Step 3.5 独审） | **H**（语义深审，本就是独立步骤） |
| 11 | G3 已签 | **S** |

**结论**：6 条 L + 1 条 S，是 G1/G2 的同款形状。值得建 `check-sprint.js`。人残量仅 3 条，且全是已存在的独立人/subagent 步骤（疑点确认、TRD 覆盖、Step 3.5 独审），签字时人复核即可。

### G4 · manual-test（可视区 —— 核心人判，几乎不需新检查器）

| # | 完成判据 | 类 |
|---|---------|---|
| 1 | 用户明确说「验收通过」（不得 AI 自判）| **H · 核心** |
| 2 | 所有反馈问题已处理（记 backlog 须分级）| **H** |
| 3 | 所有 develop(source=manual-test) 已 [merged] | **S** |
| 4 | 验收报告已写，结论"通过" | **L**（文件存在 + 结论串匹配） |
| 6 | G4 已签 | **S** |

**结论**：核心判据（用户验收通过）是 design §3 钉死的「可视区留人走查」，冷核里本就标 `N/A·人工`。可机械的只有 3（status）和 4（文件+结论串）。**G4 删冷核不靠新建覆盖，靠"它的判据本就是 status 派生 + 人判，重型 subagent 冷核没增加真覆盖"——与 G1/G2 删冷核同理由。**

### G5 · wrap-up-iteration（薄文件检查 + 人判分流）

| # | 完成判据 | 类 |
|---|---------|---|
| 1 | backlog `[偏离]` 条目全部处理（建 revise-doc 或记 decisions）| **L**（每条有处理标记）/ 处理是否对=**H** |
| 2 | feedback.md 每条已分流，文件已清空 | **L**（文件空/仅占位，平凡可验） |
| 3 | project.md 反映最终状态，无"开发中"标注 | **L**（grep "开发中"）/ 是否真反映=**H** |
| 5 | G5 已签 | **S** |

**结论**：可机械部分薄但非零（feedback 清空、grep 开发中、backlog 偏离已标）。语义核心（分流对不对、偏离处理对不对）留人。

---

## 2. 删除清单（散文大头，本子计划兑现）

| # | 文件 | 删什么 | 行量级 |
|---|------|--------|:---:|
| D1 | `skeleton/06-gates.md` §7 | 整段「G3/G4/G5（暂无 linter，沿用 subagent 冷核）」+ 协议步骤(5 步) + 凭证模板 + 软版边界 | **~32 行（主删）** |
| D2 | `skeleton/06-gates.md` §7 | G1/G2 存量兜底条（line 124）改写：兜底改「人逐条手工核对，无 subagent」 | 改写 |
| D3 | `skeleton/06-gates.md` §7「与既有审查的关系」 | 保留但改口径（plan-sprint Step3.5 / draft-ux Step3.5 仍在，但不再服务于"冷核协议"，改为"是某条完成判据的输入"）| 改写 |
| D4 | `specs-execution/plan-sprint.md` | 删 Step 4.7 整步 + Subagent 表冷核行；Step 5 签字前置改 linter；commit 去 `gate-checks/G3.md` | ~12 行 |
| D5 | `specs-execution/manual-test.md` | 删「签 G4 前·完成判据冷核」块；签字前置改；commit 去 `gate-checks/G4.md` | ~5 行 |
| D6 | `specs-execution/wrap-up-iteration.md` | 删「签 G5 前·完成判据冷核」块；commit 去 `gate-checks/G5.md` | ~5 行 |
| D7 | 3 份 structural（plan-sprint/manual-test/wrap-up） | 「完成判据已冷核」行 → 「检查器全绿 + 语义人签（存量退回人工兜底）」 | 3 行改写 |

**§7 塌缩后形态**：保留「两类判据」引子 + 单一段「所有 Gate：跑对应检查器，退出码 0 = 结构判据通过；语义残量由签字人确认（各关枚举列出）；存量无脚本退回人工逐条核对」。约从 60 行降到 ~25 行。

---

## 3. 新建/扩展检查器（ADD —— 是写真检查器，非堆 generator 规则，不背叛 §2）

### 3.1 `check-sprint.js`（G3，真 linter，主要工作量）

读 `iterations/vN/queue/*.md` + `sprint.md` + `prd.md`（AC 源）+ `status.yml`，校验：
- **字段完备**：每个任务包 17 字段在册、无空槽（占位串视为空）；`layer=backend` 且有前端消费 → `api-contract` 非空。
- **reference 行号**：每条 `reference` 含行号区间（正则），拒"全文"/无范围；前端任务 reference 含 ux-flows 行号条目；后端任务含 TRD 行号条目。
- **AC 回链**：每条任务包 AC 标了 PRD AC-id 或 `(技术)`；反向——PRD 每条 AC 至少被一个任务包引用（覆盖检查，check-docs 实体↔表同款）。
- **依赖/交付**：`依赖` 列非空（无依赖须显式 `—`）；`交付` ∈ {独立,批量}。
- **三方一致**：sprint.md 表行 ⊇ queue/ 文件名 ⊇ status.yml `tasks[]`（source=sprint, iteration=vN）。
- 退出码 0/1 + 逐条报告，沿用 check-docs.js 风格（纯 Node 无依赖；status.yml 用极简 YAML 子集解析或要求 js-yaml——见开放点 b）。

**不验**（留人，签字时复核）：疑点确认、TRD 模块覆盖完整性、Step 3.5 独审结论。

### 3.2 G4 / G5：薄检查（见开放点 a 决定深度）

- **G4**：assert `tasks[]` 中 source=manual-test & iteration=vN 全 merged + `acceptance-report.md` 存在且「验收结论」段含「通过」。核心人判（验收）不进脚本。
- **G5**：assert `feedback.md` 已清空（仅 header/占位）+ `project.md` 无"开发中" + `backlog.md` 每条 `[偏离]` 有处理标记。分流对错留人。

形态选项（开放点 a）：折进 check-sprint 同族一个 `check-gate.js <Gn>` 多模式；或就不建脚本、由 §7 直接写"签字人 assert status + 文件"的人工薄清单。

---

## 4. 接线（与 G1/G2 对称）

- `init-project`：Step 3 铺脚本时连同 `check-docs.js` 一起铺 `check-sprint.js`（+ G4/G5 检查器若建）。
- `plan-sprint`：Step 4.7 改为「跑 `node scripts/check-sprint.js`，退出码 0 = L 判据全过；逐条修到 0」；语义残量（疑点/TRD覆盖/独审）签字人复核。Step 5 签字前置改 linter 退出码。
- `manual-test` / `wrap-up`：签字前置改「跑检查器（若建）+ 人确认语义核心」。
- 三份 structural 完成判据：L 判据标【linter】（埋点，对齐 sub3 G1/G2 写法），冷核行改写。
- §7 存量兜底：无脚本 → 人逐条手工核对（不再派 subagent）。

---

## 5. 净收缩诚实账

- **删**：§7 ~32 行冷核主体（D1）+ 3 exec 冷核步 ~22 行（D4-6）+ 3 structural 改写 + Subagent 表行 + gate-checks/G{3,4,5}.md 凭证产物。**这是 design §2.5 点名"埋点未拔"的兑现** —— 散文大头真正拔掉。
- **加**：`check-sprint.js`（真检查器代码，§2 明确 ADD 检查器不算背叛——code≠prose）+ G4/G5 薄检查（若建）。
- **结果**：§7 从两层模型（G1/G2 linter + G3/G4/G5 冷核）塌缩成单层。全 5 关统一「检查器绿 + 枚举语义人签」。**这一步把净收缩从"及格"推向"漂亮"**（design §2.5 的目标）。

---

## 6. 开放点（待用户定，否则取推荐默认）

- **a · G4/G5 检查器深度**：(A·推荐) G3 建真 `check-sprint.js`，G4/G5 建薄 `check-gate.js` 模式做 status+文件 assert；(B) 只建 G3 linter，G4/G5 不建脚本、§7 写人工薄清单（更轻，散文删除等量，因 G4/G5 本就人判为主）。
- **b · check-sprint.js 读 status.yml 的 YAML 解析**：纯手写极简子集解析（无依赖，跟 check-docs 一致，但 status.yml 结构比 prd/trd 复杂）vs 引 js-yaml（init-project 装依赖）。倾向先手写够用子集；与 parked 的 check-status.js 共用解析时再统一。
- **c · hook（B3）**：sub3 定调"不做 hook"（软版，人工抽看兜底）。本子计划**沿用不做**，仅删冷核 + 建检查器。hook 守签字 + 凭证改 CI 报告留 design §10 开放问题 #4，后续单独议。

---

## 7. 边界

本稿只固化分析与删除/新建清单。check-sprint.js 的具体实现、§7 改写文本是实施阶段产出。批准 = 方向认可 + 开放点 a/b/c 定档，即可进实施。

---

## 8. 实施期阻断发现（2026-06-19 会话 3，建 check-sprint.js 前）

**实测 hact-app 真实任务包，发现 G3 linter 有设计期未见的硬前置：任务包格式既未规范化、又与 17 字段 spec 背离、还跨迭代漂移。**

| 来源 | 格式 |
|------|------|
| **spec**（`develop.md §字段规范`） | 17 字段，含 `layers`(数组) / `depends_on` / `api-contract` / AC 回链 `(源：PRD…)` / 不可视区 AC 的 Given/When/Then 操作化 |
| **hact-app v1**（`iterations/v1/queue/`） | 5 字段 frontmatter（task-id/layer/source/urgency/status）+ 9 个 `## markdown` 段；`layer` 单数；AC 是 `- [ ]` 纯散文无回链 |
| **hact-app v3**（项目根 `queue/`） | 全 YAML frontmatter 14 键；`layer` 单数；**仍无** `depends_on`/`api-contract`/AC 回链 |

**含义**：
- 按 spec 17 字段建 linter → 真实产物全 FAIL（没有一个产物长那样）。
- 按 v3 实况建 linter → 与 spec 背离，且会把 sub2 本会话刚加的 AC 操作化/回链当"不存在"放过。
- 部分缺失字段是**真漂移**（depends_on/api-contract 从未落地），部分是**有意前置**（AC 回链 2026-06-03、Given/When/Then 本会话 sub2 刚加）——逐字段判断才能分清，不能一刀切。

**结论**：`check-sprint.js`（G3）的真前置是**任务包格式规范化**——一桩"任务包版的 sub1"（建 `templates/queue/task-package.md` 固定结构 + 反向校正 `develop.md §字段规范` 到与实况一致的单一真相 + 决定 v1/v2/v3 存量怎么处理）。这是 design §6（产物结构化地基）里 sub1 没覆盖到的那块，也撞上 design §10 开放问题 #5（存量兼容）。**它本身独立有价值**（强化 plan-sprint 字段自检 + 让任务包可机械 parse），但不是"顺手写个 linter"，量级接近一个独立子计划。

**G4/G5 不受此阻断**：`check-gate.js` 读 status.yml（schema 已锁，skeleton/07）+ 简单文件检查（验收报告结论 / feedback 清空 / project.md grep / backlog 偏离标记），与任务包格式无关，**现在即可建**。

**对"拔 §7"的影响**：§7 冷核协议是 G3/G4/G5 共用，三关全覆盖才能整段删。G3 阻断 → 本会话**最多partial 塌缩**（G4/G5 迁 check-gate，G3 暂留冷核），§7 完整拔除要等任务包规范化子计划做完。

### 再定档选项（待用户定，§9）

- **选项 1 · 全量**：本轮连任务包规范化前置一起做（模板 + 校正 develop spec + 存量决定）→ check-sprint + check-gate → §7 整段塌缩 + 接线。量级最大，单会话难做完做好。
- **选项 2 · 拆分（倾向推荐）**：本轮建 check-gate（G4/G5）+ §7 部分塌缩（G4/G5→检查器，G3 暂留冷核并标注"待任务包规范化"）；G3 check-sprint 连同任务包规范化另起子计划 sub3c。**净收缩部分兑现、诚实记账**，不假装 §7 已整段拔。
- **选项 3 · 暂停 G3 评估**：先不碰 G3，重新评估"为拔 §7 而做任务包规范化"的投资是否当下值得（可能 G3 冷核保留成本 < 规范化收益，则不急）。

---

## 9. 定档与实施结果（2026-06-19 会话 3）

**用户拍板：选项 2（拆分）。** 本轮做 G4/G5 + §7 部分塌缩；G3 + 任务包规范化另起 sub3c。已落地（分支 `feat/sub1-foundation`）：

- 新建 `templates/scripts/check-gate.js`（纯 Node 无依赖；G4：status.yml 核 source=manual-test 任务全 merged + 验收报告结论=通过；G5：feedback 已清空 + project.md 无"开发中"；语义残量 `🧑` 段提示留人，不判）。**自测 6 场景全过**（G4/G5 各 PASS/FAIL + 边界空过 + 无 status.yml 兜底）；**真 hact-app 烟测**：G5 PASS、G4 正确走存量兜底（hact-app 无 status.yml）。
- `skeleton/06-gates.md` §7 **部分塌缩**：intro 改两套检查器（check-docs G1/G2 + check-gate G4/G5）；新增「G4/G5（薄检查器 check-gate.js）」段（linter+人签模型）；原「G3/G4/G5 冷核」段**收窄为「G3」段**（标注待 sub3c 迁出）；协议 `N∈{3,4,5}`→`N∈{3}`，人驱动示例改 G3 的疑点确认；顺手修「与既有审查的关系」对已删除的 draft-ux Step3.5 冷审的悬挂引用。
- `specs-execution`：manual-test「签 G4 前·完成判据冷核」→「完成判据核对」走 check-gate + 删 commit 的 `gate-checks/G4.md`；wrap-up 同款 G5；plan-sprint Step4.7 §7 引用改「G3 段」+ 标注 sub3c；init-project Step3 铺 `check-gate.js`。
- `specs-structural`：manual-test / wrap-up 完成判据「已冷核」→「已核对（check-gate 退出码 0 + 语义人签；存量退回 §7 G3 段 subagent 兜底）」，机械判据标【linter】。

**净收缩诚实账（本轮）**：G4/G5 各删 1 个 subagent 冷核步骤（实时路径 -2）+ 删 G4/G5 凭证产物（`gate-checks/G4.md`/`G5.md`）+ structural 冷核行改写。**§7 未整段拔**（G3 协议主体仍在，因 G3 被任务包格式阻断）——design §2.5 点名的"散文大头"本轮**部分兑现**，整段拔除待 sub3c。ADD 是 check-gate.js（真检查器，code≠prose，不背叛 §2）。

## 10. sub3c 待办（G3 + 任务包规范化，另起子计划）

1. **任务包格式规范化**（前置地基，sub1 同款）：建 `templates/queue/task-package.md` 固定结构；反向校正 `specs-structural/develop.md §字段规范`（17 字段）到与实况一致的单一真相——逐字段分清"真漂移"（depends_on/api-contract 从未落地）vs"有意前置"（AC 回链、sub2 的 Given/When/Then 操作化）；决定 v1/v2/v3 存量怎么处理（冻结旧迭代 / 不回溯）。
2. **建 `check-sprint.js`**：parse queue 任务包，覆盖 G3 的 L 判据（字段完备 / reference 行号 / AC 双向对账回链 PRD / 依赖 / 交付 / sprint↔queue↔status 三方一致）。
3. **§7 整段拔**：G3 迁出冷核 → 删「G3」段 + 协议步骤 + 凭证模板 + 软版边界 + 「与既有审查的关系」；plan-sprint Step4.7 改 linter；structural plan-sprint 冷核行改写。**这才兑现 design §2.5 的"散文大头整段拔"。**
