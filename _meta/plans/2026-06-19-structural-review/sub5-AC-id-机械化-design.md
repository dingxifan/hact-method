# sub5 · PRD AC 稳定 id — 把逐条 AC 反向覆盖从「留人」升成「机械」

> 日期：2026-06-19（会话 7）
> 上游：`sub3c-G3任务包规范化-design.md` §1·D3「AC 反向覆盖 = 功能级机械 + 逐条留人」+ task_plan「parked（sub3c 衍生）：给 PRD AC 加稳定 id」
> 性质：sub3c 拆出的 parked 衍生项。**不是**原四子计划之一（本方向已于 sub4 收口）。单点收口：补齐 sub3c 留下的「逐条 AC 反向覆盖留人」缺口。
> 净收缩货币（design §2）：删 1 个 `🧑` 留人 + 删 check-sprint 功能级覆盖代码；ADD 是 linter 代码（code ≠ prose，不背叛 §2）。

---

## 0. 一句话

sub3c 做到了 AC 反向覆盖的**功能级**机械（PRD 每个功能被某任务包引用），但**逐条** AC 反向覆盖（PRD 每条 AC 都被覆盖）受限于「PRD AC 无稳定 id、无法机械匹配任务包 tag 的自由文本关键词」而留人。本轮给 PRD AC 加**全局唯一 `AC-nn` id**，让 id 串起 PRD→TRD→任务包三段链路，check-sprint 据 id 精确串匹配，把逐条反向覆盖升成机械 FAIL，并删掉被其严格蕴含的功能级覆盖代码。

---

## 1. 决策

### D1 · id 方案 = 全局唯一 `AC-nn`（用户拍板）

PRD 每条 AC 标全局唯一 `AC-nn`（跨功能连续编号 AC-01/AC-02/AC-03…，**不**按功能从 AC1 重号）。任务包 tag = `(源：PRD AC-nn)`，linter 精确串匹配 `AC-\d+`，**不依赖功能名解析**。

> 对比落选方案「功能内编号 `功能名·ACn`」：复用模板已有 AC1/AC2 标号、作者零新负担，但匹配耦合功能名模糊解析。用户取全局 id 的鲁棒性（精确串匹配）。

### D2 · append-only，允许空号，永不复用（用户确认）

增删 AC 时 id **永不复用、允许留空号**。删 AC-03 → AC-03 退休成空号，其余 id 原地不动。理由：避免 PRD 编辑/修订时全局重排把已落地的任务包 tag 集体打散。check-docs 因此**只验 well-formed + 全局唯一（无重号），不强制连续**。

### D3 · 删功能级反向覆盖，换纯 id 逐条匹配（CC 建议，用户授权执行）

逐条 AC 反向覆盖**严格强于**功能级：check-docs 已保证每功能 ≥1 AC，故「每条 AC 都被覆盖」蕴含「每功能都被覆盖」。功能级冗余 → 删 check-sprint 功能级覆盖块（含 `referencedFeatures`/`reFeatRef`/`prdFeatures` 的覆盖用法），check-sprint 反而净瘦身。tag 里功能名变**可选**（人读后缀，linter 忽略）。

### D4 · 残量切分：覆盖=机械，忠实性=留人

- **逐条覆盖**（PRD AC-nn 有没有被任务包引用）→ **机械 FAIL**（check-sprint）。
- **逐条忠实性**（任务包 AC 内容是否真覆盖它回链的那条 PRD AC，有无偏离/缩水/夹带）→ **语义，留人**：plan-sprint Step 3.5 独立 subagent 审 + 签字人。check-sprint `🧑` 段从「逐条反向覆盖留人」改为只留「AC 忠实性留人」。

### D5 · 存量冻结（同 sub3c D2）

hact-app v1–v4 PRD/任务包不回填 `AC-nn`。新 PRD（走 draft-prd-vN）、新 sprint（走 plan-sprint）才生效；存量项目无脚本 → 退人工兜底，与 check-docs/check-gate/check-sprint 一致。

---

## 2. 端到端链路

```
PRD            - AC-01：拖拽卡片改状态
                 ↓ id 串链
TRD            # 满足 AC：AC-01           （散文约定，不进 linter）
                 ↓
任务包 tag      (源：PRD AC-01)            （可选人读后缀：(源：PRD AC-01·删除二次确认)）
                 ↓ check-sprint 精确串匹配 AC-\d+
机械核对         正向：AC-01 在 PRD 存在？  反向：PRD 每个 AC-nn 被 ≥1 任务包引用？
```

---

## 3. 交付物（改动清单）

### 3.1 模板

- **`templates/prd.md`**：AC 槽 `- AC1：<待填>` → `- AC-01：<待填>`；注释补「全局唯一、跨功能连续、append-only 永不复用、允许空号」。
- **`templates/queue/task-package.md`**：`acceptance-criteria` 注释 `(源：PRD {功能名}·{AC 关键词})` → `(源：PRD AC-nn)`（可选人读后缀 `·{关键词}`，linter 只读 `AC-\d+`）。

### 3.2 linter

- **`check-docs.js`**（PRD 内部，新增一条规则）：核心功能各 `### 功能` 块下 `**Acceptance Criteria**` 列表项须 `AC-\d+：` 形式；收集全 PRD 的 AC id，**全局唯一**（重号 → FAIL）；不强制连续。沿用现有块切分（`splitBlocks(core, '功能：')`）。
- **`check-sprint.js`**：
  - 新增 PRD AC id 解析 helper（`prdAcIds(prdPath)`：扫核心功能各功能块 AC 列表项的 `AC-\d+`，返回 Set）。
  - tag 抽取：现 `reAcTag`（仅判 tag 在场）→ 增 `reAcId = /AC-?\d+/`，从 `(源：PRD …)` tag 内抽 id。
  - **正向逐条**：每条任务包 AC，若带 `(源：PRD …)` tag → 抽 `AC-nn`，验在 PRD id 集合存在（不存在 = FAIL「悬空 AC 引用」）；标 `(技术)` 的跳过。tag 缺失（既无源也无技术）仍 FAIL（保留现规则）。
  - **反向逐条**：PRD 每个 `AC-nn` 被 ≥1 任务包 tag 引用，否则 FAIL「PRD AC 未被任何任务覆盖：AC-03、AC-07」。
  - **删**：功能级反向覆盖块（现 L243-254）+ `referencedFeatures` 收集 + `reFeatRef` + `prdFeatures` 的覆盖用途（`prdFeatures` 若无其他用途一并删）。
  - `🧑` 段（现 L282）：去「PRD 逐条 AC（非功能级）均被覆盖」，改留「逐条 AC 忠实性（任务包 AC 内容真覆盖其回链 PRD AC）由 Step3.5 独审 + 签字人确认」。
  - 无 prd.md（存量）：正向/反向 AC id 检查退 `human()` 兜底（同现 `feats === null` 分支处理）。

### 3.3 spec 接线（随 id 改措辞，不新增规则）

- **`specs-structural/develop.md` L37**：`acceptance-criteria` 字段说明 tag 格式 `(源：PRD {功能名}·{AC 关键词})` → `(源：PRD AC-nn)`。
- **`specs-execution/plan-sprint.md`**：
  - L139 AC 回链格式 → `(源：PRD AC-nn)`。
  - L143-146 双向对账：**纵向**（任务包 AC 指回 PRD AC）保留自审；**横向**（PRD 每条 AC 被覆盖）注明「现由 check-sprint 逐条 id 机械核（Step 4.7 linter 步），自审退为辅助」。
  - check-sprint linter 步（sub3c 定为 Step 4.7）：现覆盖逐条反向；`🧑` 残量措辞同步。
- **`specs-structural/plan-sprint.md`**：完成判据「逐条 AC 反向覆盖」标【linter】（原功能级 → 逐条）。
- **`specs-execution/draft-tech-design.md` L131**：`# 满足 AC：{功能名}·{AC 关键词}` → `# 满足 AC：AC-nn`（散文约定，id 串链一致）。
- **`specs-execution/draft-prd-vN.md`**：AC 书写处加「每条 AC 标全局唯一 `AC-nn`（append-only）」；Step 7.4 linter 自检覆盖项补「AC id 唯一」。

### 3.4 不动

- TRD↔PRD AC 覆盖的**机械化**（draft-tech-design 覆盖映射自检 L142 仍留人）：TRD AC 可挂接口/模块/交互场景、前端交互类挂 ux-flows，可视/不可视分叉复杂，本轮不机械化，记 parked（id 已铺好，未来可低成本接）。
- check-gate / skeleton §7 / pr-review / manual-test / integration：不涉及。

---

## 4. 净收缩诚实账

- **删**：check-sprint 功能级覆盖代码块（~12 行 + 3 处正则/helper）+ 升 1 个 `🧑` 留人为机械 FAIL。逐条 AC 反向覆盖从「Step3 自审 + Step3.5 独审 + 签字人」三层人兜，收成「linter 一道机械挡 + 签字人只兜忠实性」。
- **加**：check-docs AC-id 唯一性校验（~10 行）+ check-sprint 逐条正向/反向（~15 行，但净额因删功能级而接近持平）+ 模板标号改动。
- **结论**：符合 §2——删人工步（🧑 留人）、ADD 是 linter 代码非散文规则。这是 design §2.5「净收缩当前及格但不漂亮」往「漂亮」推进的一小步：又一条「人肉眼核」收成「机器核」。

---

## 5. 自测计划（实施时执行）

- check-docs：① 合成 PRD 含重号 `AC-01` ×2 → FAIL；② 全局唯一 + 空号（AC-01/AC-02/AC-04）→ PASS（不强制连续）；③ AC 无 `AC-` 前缀（旧 `AC1`）→ FAIL。
- check-sprint：① 任务包 tag `(源：PRD AC-99)` 但 PRD 无 AC-99 → 正向 FAIL；② PRD AC-03 无任何任务包引用 → 反向 FAIL；③ 全覆盖 + 全存在 → PASS；④ 带人读后缀 `(源：PRD AC-01·删除确认)` 正确抽 id；⑤ 无 prd.md → 退 human 兜底不崩。
- 真 hact-app v4（存量、用旧 `功能名·关键词` tag）：正向/反向 AC id 检查应走 human 兜底或对旧格式 FAIL（确认存量冻结边界——存量项目本就不该跑新脚本，烟测只验不崩）。

---

## 6. 边界

本稿固化决策与改动清单。linter 实现、spec 改写文本是实施产出。TRD↔PRD AC 覆盖机械化、PRD AC id 跨迭代永久化（当前 id 仅 PRD vN 生命周期内稳定）均不在本轮，记 parked。
