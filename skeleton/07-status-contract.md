# 07 · status.yml 状态契约

> 本文件定义**项目根** `status.yml` 的字段、类型、枚举与取值，是**人与检查器共同的单一事实**。
> 机器侧消费者（`check-sprint.js` / `check-gate.js`，以及任何后续取数工具）都从 `status.yml` 进入，不解析任何叙述性 markdown；具体消费者只按本契约读取自己需要的字段。
> 设计依据：`_meta/plans/2026-05-31-status-contract/design.md`。

---

## 一、为什么有这份契约

机器侧取数如果靠解析 `queue/*.md` frontmatter、`sprint.md` 表格、`status.yml` 复选框，就是在读「为人写的叙述性 markdown」——运行时每次生成时排版会漂移，取数持续出错。

**解法**：把「机器要的结构化状态」从「人看的叙述文档」里彻底分离，单独落到一份 schema 锁死的 `status.yml`。

**核心原则（判定一个数据进不进 YAML）：**
> 凡是**要被机械核对或计数**的（状态、Gate 签署、任务归属、轮次、耗时）→ 进 `status.yml`；
> 凡是以「文档正文」出现、只供人阅读的 → 不进 YAML，留在 markdown 里。

---

## 二、为什么是项目级单文件（不是每迭代一份）

`status.yml` 放在**项目根**，一个项目一份并永久保留，覆盖或索引全部迭代 + 全部 B 类任务。原因：

- **B 类是项目级的**：B 类任务（bug / optimization）跨迭代、不归任何一期 Gate 流，其状态在项目根 status.yml。两个迭代之间（vN 已签 G5、vN+1 未起）没有「活跃迭代」，迭代级文件无处安放 B 类——项目级文件永远在。
- **创建只一次**：随 `init-project` 建一次，此后永远存在，不必每期重建。
- **多迭代并行天然支持**：`iterations` 按版本分块，`tasks[]` 带 `iteration` 字段区分归属。
- A 类任务包按 `iterations/vN/queue/` 物理隔离，B 类任务包在项目根 `b-queue/`——契约按目录隔离，动态状态独立集中在 status.yml，不是从 Markdown 派生。
- **任务包路径派生规则**：`iteration: null`（B 类）→ `b-queue/{task-id}.md`；`iteration: vN`（A 类）→ `iterations/vN/queue/{task-id}.md`。

---

## 三、文件位置与生命周期

- **位置**：项目根 `status.yml`，一个项目一份。它仍是机器侧**唯一数据源与入口**；归档文件只是由其中 `code_review_archives[]` 定位的数据分片，消费者不得绕过 status 自行枚举。
- **创建**：`init-project` 从模板创建一次，含 `iterations.v1.gates`（全未签）+ 空 `tasks[]`。
- **更新**：此后每个状态转移由所属 exec spec「做一个填一个」（见第五节）。
- **健壮性**：任何更新步骤写入前若文件不存在（历史项目、断点等），先从 `templates/status.yml` 补建再写，不报错中断。
- **动态状态只写 status**：任务状态/负责人/分支/PR 与 Gate 签署只在此维护。任务包是契约、sprint 是规划，不维护实时状态副本；旧 gates/b-tasks 仅历史参考，不生成新文件。queue↔sprint↔status 检查保留任务登记与规划覆盖，不要求重复可变状态。

---

## 四、字段契约

```yaml
project: {项目名}                # string，项目名
schema: 1                        # int，本契约 schema 版本号；字段演进靠它兼容
generated_by: hact-method        # string，固定 hact-method（Codex）

iterations:                      # 按版本分块；每期一个 key
  v1:
    gates:                       # 固定五关，缺关不省略
      G1: { signed: true,  date: 2026-05-20 }   # signed: bool；date: YYYY-MM-DD 或 null
      G2: { signed: true,  date: 2026-05-24 }
      G3: { signed: false, date: null }
      G4: { signed: false, date: null }
      G5: { signed: false, date: null }
  v2:
    gates:
      G1: { signed: false, date: null }
      # … G2–G5

tasks:
  - id: hact-v2-001              # string，A 类 {缩写}-v{N}-{序号}；B 类 {缩写}-b-{序号}
    iteration: v2                # string 版本号；B 类（source=bug/optimization）为 null
    sprint: 1                    # int sprint 编号；B 类 / 修复任务为 null
    source: sprint               # enum，见下
    title: 用户表与权限          # string，列表显示用
    type: develop               # enum，14 种 task type
    layer: backend              # enum，frontend / backend / shared / null
    status: merged              # enum，可取 / taken-by / done / merged
    assigned_to: zhangsan       # string Gitee login，未认领为 null
    pr: 12                      # int PR 号，无为 null
    parent_id: null             # string 父任务 id，无为 null
    depends_on: []              # string[]，依赖的 task-id 列表
    delivery: 串行              # enum，串行 / 可并行；B 类 / 修复任务可为 null
    urgency: null               # enum，hotfix / null
  - id: hact-b-001              # B 类示例
    iteration: null             # 不属任何迭代
    sprint: null
    source: bug
    title: 登录偶发 500
    type: develop
    layer: backend
    status: 可取
    assigned_to: null
    pr: null
    parent_id: null
    depends_on: []
    delivery: null
    urgency: hotfix

integration_tests:               # 联调测试项；description 短，随行显示，进 YAML
  - iteration: v2                # 属哪期
    index: 1                     # int，1–15
    description: 登录跳转正常
    status: 通过                 # enum，待执行 / 执行中 / 通过 / 失败
    failure_reason: null         # string，status=失败 时填，否则 null

code_review_archives:            # 已搬出的 code_reviews[] 索引；为空时写 code_review_archives: []
  - iteration: v1                # vN；B 类写 null
    file: status-reviews/v1.yml  # 固定形状 status-reviews/{key}.yml
    count: 18                    # 该文件内 code_reviews 条目数

code_reviews:                    # 结论、报告索引与成本汇总；问题正文在逐轮报告
  - iteration: v2
    task_id: hact-v2-008         # string，被审 develop 任务 id
    conclusion: 需修订           # enum，通过 / 需修订
    rounds: 2                    # int ≥1，兼容总轮次 = code_rounds + spec_rounds
    code_rounds: 1               # int ≥1，代码证据审查实际运行数
    spec_rounds: 1               # int ≥0，freshness/contract/claim 独立复核数
    freshness: revised           # enum，pass / revised
    review_report_dir: iterations/v2/code-reviews/hact-v2-008  # B 类为 b-reviews/{task-id}
    review_evidence_version: develop-review-round/v2   # post-adoption 完成任务必填；缺失只表示 unknown，legacy 身份只看 adoption boundary
```

### 审查归档索引与文件约束

- `code_review_archives[]` 每个 key 只对应一个文件，`file` 不重复且必须与 `iteration` 一一对应：A 类 key 取迭代号（如 `v1`）；点号迭代把 `.` 机械替换为 `-`（`v1.1` → `v1-1`）；B 类 `iteration: null` 固定用 `b`。对应路径分别为 `status-reviews/v1.yml`、`status-reviews/v1-1.yml`、`status-reviews/b.yml`。
- `file` 是项目根相对路径，只允许 `status-reviews/[A-Za-z0-9][A-Za-z0-9-]*.yml`；消费者拒绝绝对路径、`..` 与符号链接。
- 每个归档文件的顶层键必须且只能是 `code_reviews:`，其中条目 schema 与 `status.yml` 内 `code_reviews[]` 完全一致。归档文件不放 `tasks`、`gates` 或 `integration_tests`。
- 归档是搬家：条目字段与内容原样保留，只把完整条目块移出主文件。`status.yml` 本身仍永久存在且保持机器侧唯一数据源地位——索引在其中，消费者仍从它进入。未归档不阻断任何 Gate 或交付。

### 枚举对齐

| 字段 | 枚举值 |
|---|---|
| `tasks[].source` | sprint / foundation / integration / manual-test / bug / optimization |
| `tasks[].status` | 可取 / taken-by / done / merged |
| `tasks[].layer` | frontend / backend / shared / null |
| `tasks[].delivery` | 串行 / 可并行 / null |
| `tasks[].urgency` | hotfix / null |
| `integration_tests[].status` | 待执行 / 执行中 / 通过 / 失败 |
| `code_reviews[].conclusion` | 通过 / 需修订 |
| `code_reviews[].rounds` | int ≥1（非枚举） |
| `code_reviews[].code_rounds` | int ≥1（非枚举） |
| `code_reviews[].spec_rounds` | int ≥0（非枚举） |
| `code_reviews[].freshness` | pass / revised |

> rounds/code_rounds/spec_rounds 为审查次数与恢复依据；时间戳/分钟成本字段可选且不阻断，不补估、不强制对齐。固定 Git 基线、审查范围、报告链与 finding 闭合仍必需。
>
> **R2.3 adoption compatibility**：上述字段约束适用于 post-adoption work。既有项目迁移时，`_meta/method-sync.json.adoption` 显式记录不可变的 `source_base`、对账后的 `accepted_truth_base`、该 commit 的 `status.yml` SHA-256 与其中已经 `merged` 的 `legacy_accepted_tasks`；`source_base` 可不同于 `accepted_truth_base`，不得把迁移前漏记事实排除在对账快照外。这些任务可作为 Legacy Accepted Truth 保留其真实历史形态，不追补当时不存在的 vNext review evidence。legacy 身份只来自这个显式 boundary；缺字段、旧 package schema 或文件年代都不能自动获得豁免。legacy task 一旦在 adoption 后被修改或 reopen 后再次 merged，其新 delta 按当前 lifecycle 严格校验。
>
> 每个新完成任务在终态提交前运行 `node scripts/check-sprint.js --review {task-id}`。该校验按 task-id 工作，不依赖 iteration，因此 A/B 共用；显式校验核固定 diff、targeted 继承链与问题闭合，并对缺必要字段硬失败。完整迭代扫描也不再按“旧 schema / 缺字段”推断 legacy；只有显式 adoption boundary 中已证明的 Legacy Accepted Truth 才跳过不存在的历史 vNext 证据。

> 问题、证据、严重程度与处置状态按 `templates/review-briefs/develop-review-round.md` 写入逐轮报告。`status.yml` 通过 `review_report_dir` 引用，读取问题时沿报告链按稳定 finding id 取最新处置，不另维护 issues/comment 副本。历史内联内容原样保留。

### 不进 YAML（留在 markdown 里，供人阅读）
任务包字段正文、`description`、`completion_report`、`output`、PRD/TRD/sprint/联调报告正文。

---

## 五、写入协议：做一个填一个

**总规则**：
> 凡是写一个任务包的地方（A 类写 `iterations/vN/queue/`，B 类写 `b-queue/`），就同步往 `tasks[]` 追加一条（带 `source` / `iteration`）；状态流转（认领 / done / merged）按 `task-id` 改，对所有 `source` 一视同仁。

| 事件 | 归属 spec | 更新内容 |
|---|---|---|
| 项目初始化 | `init-project` | **创建 status.yml**（模板 + `iterations.v1.gates` 全未签 + 空 tasks） |
| V0 地基设计 + 签 G2(v0) | `draft-foundation` | 建 `iterations.v0` 块（仅 G2）+ `gates.G2` |
| V0 走骨架 认领→建→合并 | `develop`(source=foundation) | 追加 task（`source=foundation`, `iteration=v0`）+ `taken-by`→`merged` + `code_reviews[]` |
| 签 G1 | `draft-prd-vN` | 确保 `iterations.vN.gates` 块存在（v2+ 新建）+ `gates.G1` |
| 签 G2 | `draft-tech-design` | `gates.G2` |
| 签 G3 + 灌 sprint 任务 | `plan-sprint` | 批量追加 sprint 任务（`source=sprint`, `iteration=vN`）+ `gates.G3` |
| 认领任务 | `develop` | 对应 task `status: taken-by` + `assigned_to` |
| 提 PR（瞬态 done）| `develop` | 对应 task `status: done` + `pr`（同会话内即审即合并，done 不停留）|
| 独立审查通过 + 自合并 | `develop` | 对应 task `status: merged` |
| CR 结论（审计留痕）| `develop` | `code_reviews[]` 追加一条 |
| 联调修复任务派发 | `generate-integration-tests` | 追加 task（`source=integration`, `iteration=vN`） |
| 联调项创建 / 跑通 / 失败 / 复测 | `generate-integration-tests` | `integration_tests[]` |
| 验收修复任务派发 | `manual-test` | 追加 task（`source=manual-test`, `iteration=vN`） |
| 签 G4 | `manual-test` | `gates.G4` |
| B 类派发 | `dispatch-new` | 追加 task（`source=bug/optimization`, `iteration=null`） |
| 签 G5 | `wrap-up-iteration` | `gates.G5` |
| 签 G5 后归档本期 code_reviews | `wrap-up-iteration` | 移出本期 `code_reviews[]` 条目到 `status-reviews/{vN}.yml`（点号迭代使用连字符 key）+ 追加 `code_review_archives[]` 索引 |

**写入纪律**：
- 每次只改对应字段，保留其余内容不动。
- 显式写 `null`，不省略键。
- 写入后随当步既有的 `git commit` 一并提交（status.yml 与既有产物同 commit）。
