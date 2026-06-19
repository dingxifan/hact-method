# sub2 design — 子计划 2 · 不可视区迁移（AC→可运行测试）

> 日期：2026-06-19
> 上游：本目录 `design.md` §4（核心抓手 A）、§5（保真路2主干+路1兜残）、§8演练一（backend-checklist 85% 可机械）、§9（删完三窟窿）、§11.2
> 性质：子计划 2 实施设计稿。把不可视区（后端/数据/逻辑）的正确性验证从"散文 checklist 肉眼审 + AI 伪测试对抗审查"迁成"AC→真测试套件"。

---

## 0. 本轮两项定调（用户拍板）

- **AC 操作化压在 `draft-tech-design`（TRD/技术端）**：PRD 写意图 AC；draft-tech-design 把**不可视区** AC 操作化成可执行例子（Given/When/Then：输入→期望输出），与接口设计并行。理由：贴合分区（不可视区=测试最重要=TRD 地盘）+ 不劳烦非技术管理者 + 复用现有「AC 覆盖映射自检」。
- **一次全做**：AC 操作化 + backend-checklist 降维测试品类清单 + develop 写测试 + Step 5.5 AI 对抗审查退场 + pr-review 路1 兜残。三块耦合，同做避免中间保真洞。

## 1. 关键现实

hact-method 是方法论仓，**真测试跑在项目仓**。本子计划改的是 **spec**（develop 怎么写/跑测试、pr-review 怎么验保真、AC 在哪操作化）+ **checklist 模板**，不建测试运行器。强制靠 **checklist（测试品类）+ pr-review（保真）**，无 CI/hook（同子计划 3，硬闸延后）。

## 2. 数据流（改造后）

```
PRD: AC 意图(散文, 鼓励具体例子)
  → draft-tech-design: 不可视区 AC 操作化成 G/W/T 例子, 挂在 §接口设计 的 `# 满足 AC` 回链旁
  → plan-sprint: 任务包 acceptance-criteria 对 backend 任务写成 G/W/T 例子(带 (源：PRD…) 回链)
  → develop: 1:1 落成测试 + 补齐测试品类(鉴权/边界/错误/契约/并发) + 跑绿  ← validate
  → pr-review: 确认测试忠实编码 AC(路1兜残) + 品类无缺 + 全绿
```

伪测试（Step 5.5 AI 对抗审查 loop）→ 真测试套件。AC 覆盖/边界/错误/安全/逻辑五类原归 Step 5.5，现归：测试（写齐品类）+ 测试品类清单（防真空通过）+ pr-review（保真）。

## 3. 三窟窿处置（design §9）

| 窟窿 | 处置 |
|------|------|
| ①谁写测试+保真 | develop 写；保真路2（TRD 操作化成 G/W/T，测试近 1:1）主干 + 路1（pr-review 技术人确认测试忠实 AC）兜残 |
| ②测试完备性（真空通过） | backend-checklist 降维成**测试品类清单**——不逐条审代码，改"是否为：鉴权/边界/错误路径/契约/并发 各写了测试"。短但非零 |
| ③测不动残项 | N+1/日志隐私/冗余复用/深层并发竞态 → 留人判（checklist 末小节）；lint 项（no any/console.log/TODO/unused/req.user.sub/硬编码密钥）→ 归 `npm run lint`，不在 checklist 逐条人审 |

---

## 4. 具体改动

### 4.1 AC 操作化 @ draft-tech-design

**`specs-execution/draft-tech-design.md` Step 3 §接口设计**：在现有 `# 满足 AC：{功能名}·{AC关键词}` 回链旁，对**不可视区** AC 补写可执行例子（`例：Given … / When … / Then 期望输出`，输入→期望输出，测试将 1:1 落地）。可视区（前端视觉/交互）AC 不在此操作化（留原型/manual-test 人走查）。
- 「AC 覆盖映射自检」→ 升为「AC 操作化 + 覆盖映射自检」：每条不可视区 AC 操作化成 ≥1 个 G/W/T 例子且有载体；可视区 AC 仅做覆盖映射（不强制例子）。
- 例子是**散文约定**，不加 linter 槽（不动 templates/trd.md / check-docs.js——属子计划1 地基范畴，本轮不扩）。

**`specs-structural/draft-tech-design.md`**：产物 TRD 注"不可视区 AC 已操作化为 G/W/T 例子"；完成判据加一条语义判据（非 linter）「不可视区 AC 已操作化为可执行例子」。

### 4.2 操作化结果流入任务包 @ plan-sprint

**`specs-execution/plan-sprint.md` Step 3「AC 回链」**：补一句——backend（不可视区）任务的 `acceptance-criteria` 各条以 TRD 已操作化的 G/W/T 例子形式写入（带 `(源：PRD…)` 回链），不退回散文；前端任务维持散文 AC。

**`specs-structural/develop.md` §字段规范 `acceptance-criteria`**：补"不可视区（backend/逻辑）任务的 AC 以可执行例子（G/W/T 输入→期望输出）书写，供 develop 1:1 落成测试；由 plan-sprint 从 TRD 操作化结果回链写入"。

### 4.3 backend-checklist → 测试品类清单（重写 `templates/checklists/backend-checklist.md`）

从 33 项逐条审代码 → 三段：
- **测试品类（核心，必为每类写测试并跑绿）**：鉴权授权(401/403·资源归属) / 入参校验·边界(400·空值零值极值·whitelist 丢字段) / 错误路径(404·409·第三方失败不吞·catch 有日志) / 契约(响应 DTO 字段与前端一致·不含敏感字段) / 数据·并发(唯一性 ER_DUP·事务部分失败回滚·upsert UNIQUE 实际存在)。
- **归 lint（机械，不在此人审）**：no any / req.user.sub / 无硬编码密钥 / 无 console.log / 无未用 import / 无 TODO·FIXME / 无废弃注释块——`npm run lint` 管。
- **留人判（测不动/品味）**：N+1 查询、日志隐私、冗余复用（与已有 Service/工具/类型重复）、深层并发竞态。
- 输出格式改【后端测试品类报告】：各品类有无测试 + 留人判结论。

### 4.4 develop Step 5 / 5.5（`specs-execution/develop.md`）

- **Step 5 自检**：
  - 【机械验证】命令集加 `npm run test`（或项目测试命令）——测试不绿先修。无测试运行器=项目配置缺陷（standards 该约定），提示补，不静默跳过不可视区测试。
  - 新增【测试品类自检】：对照 backend-checklist 测试品类清单，确认各品类有测试且全绿；不可视区 AC 的 G/W/T 例子已 1:1 落成测试。
  - 保留并迁移原 Step 5.5 的升级逻辑：同一测试反复修 3 次仍红 → 根因可能在 AC/TRD 设计层 → 创建 `revise-doc`，不硬磨。
- **Step 5.5 对抗审查**：**整步删除**（spec 207–270，~64 行）——真测试套件即 validate，AI 伪测试退场（design §8 实证它与 21 条可转测试高度重叠）。
- 连带删：Step 5 输出指向改 commit（非"对抗审查"）；Fast Mode 行去 "Step 5.5"；批量会话 Step 5.5 行删（批量 Step 5 覆盖全部任务测试）；Subagent 表 Step 5.5 行删；前后端差异表 Checklist 行 backend → 测试品类清单。
- **前端**：Step 5.5 删除是全局的；前端写可测部分（接口对接/状态/表单）的测试，视觉残量归 manual-test/pr-review 设计保真（本就不在 Step 5.5 覆盖内，无损失）。frontend-checklist 本轮**不动**（可视区降维属子计划 4）。

### 4.5 pr-review 路1 兜残（`specs-execution/pr-review.md` + structural）

- **通过条件**加：**测试保真（layer 含 backend）**——不可视区 AC 的测试存在、忠实编码其回链 AC（路1）、全绿；测试品类（鉴权/边界/错误/契约/并发）无缺类。
- **打回条件**加：不可视区 AC 无对应测试 / 测试不忠实 AC / 测试红 / 缺测试品类。
- **评估方法**加第五步「测试保真核查」。
- structural 完成判据加「backend PR 已核测试保真（忠实 AC + 品类覆盖 + 全绿）」。

### 4.6 develop 完成判据（`specs-structural/develop.md`）

「layer 对应 checklist 自检通过」→ 拆成：
- 不可视区 AC 已 1:1 落成测试且全绿；
- 测试品类（鉴权/边界/错误路径/契约/并发）覆盖（backend）/ 可测部分有测试（frontend）+ 对应 checklist 自检通过。

---

## 5. 净收缩账

- **删 1 个大 AI-肉眼步骤**：develop Step 5.5 对抗审查 loop（~64 行 + Subagent 表行 + Fast Mode 引用 + 批量行）——design §2 的货币。
- backend-checklist 87 行 → ~35 行（33 项逐条审 → 5 测试品类 + lint 归集一句 + 4 留人判）。
- **ADD**：AC 操作化（draft-tech-design，散文约定 ~10 行）+ develop 写测试/测试品类自检（~12 行）+ pr-review 兜残（~10 行）+ structural 若干行。
- 净值：行数大体持平偏负；货币（删 AI-肉眼步骤 + 短化 checklist）为正。ADD 是"写真测试/验输出"，非"往 generator 堆规则"——不背叛 §2。

## 6. 不做 / 边界

- 不建测试运行器、不加 CI/hook（项目仓事 + 硬闸延后）。
- 不动 templates/trd.md / check-docs.js（操作化例子是散文约定，不进 linter——属子计划 1 地基，不在本轮扩）。
- frontend-checklist 降维留**子计划 4**（可视区收口）。
- G3/G4/G5 冷核、PRD 语义、协调流程——不在本轮（子计划 3 已处理 G1/G2；其余 design 明确留 prose）。
