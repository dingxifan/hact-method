# 07 · status.yml 状态契约

> 本文件定义**项目根** `status.yml` 的字段、类型、枚举与取值，是**人与检查器共同的单一事实**。
> 机器侧消费者（`check-sprint.js` / `check-gate.js`，以及任何后续取数工具）直接 `YAML.parse(status.yml)`，不解析任何叙述性 markdown。
> 设计依据：`_meta/plans/2026-05-31-status-contract/design.md`。

---

## 一、为什么有这份契约

机器侧取数如果靠解析 `queue/*.md` frontmatter、`sprint.md` 表格、`gates.md` 复选框，就是在读「为人写的叙述性 markdown」——运行时每次生成时排版会漂移，取数持续出错。

**解法**：把「机器要的结构化状态」从「人看的叙述文档」里彻底分离，单独落到一份 schema 锁死的 `status.yml`。

**核心原则（判定一个数据进不进 YAML）：**
> 凡是**要被机械核对或计数**的（状态、Gate 签署、任务归属、轮次、耗时）→ 进 `status.yml`；
> 凡是以「文档正文」出现、只供人阅读的 → 不进 YAML，留在 markdown 里。

---

## 二、为什么是项目级单文件（不是每迭代一份）

`status.yml` 放在**项目根**，一个项目一份，覆盖全部迭代 + 全部 B 类任务。原因：

- **B 类是项目级的**：B 类任务（bug / optimization）跨迭代、不归任何一期 Gate 流，其总账 `b-tasks.md` 本就在项目根。两个迭代之间（vN 已签 G5、vN+1 未起）没有「活跃迭代」，迭代级文件无处安放 B 类——项目级文件永远在。
- **创建只一次**：随 `init-project` 建一次，此后永远存在，不必每期重建。
- **多迭代并行天然支持**：`iterations` 按版本分块，`tasks[]` 带 `iteration` 字段区分归属。
- A 类任务包按 `iterations/vN/queue/` 物理隔离，B 类任务包在项目根 `b-queue/`——只是**状态投影集中到一个文件**，投影 ≠ 源文件。
- **任务包路径派生规则**：`iteration: null`（B 类）→ `b-queue/{task-id}.md`；`iteration: vN`（A 类）→ `iterations/vN/queue/{task-id}.md`。

---

## 三、文件位置与生命周期

- **位置**：项目根 `status.yml`，一个项目一份。机器侧**唯一**数据源。
- **创建**：`init-project` 从模板创建一次，含 `iterations.v1.gates`（全未签）+ 空 `tasks[]`。
- **更新**：此后每个状态转移由所属 exec spec「做一个填一个」（见第五节）。
- **健壮性**：任何更新步骤写入前若文件不存在（历史项目、断点等），先从 `templates/status.yml` 补建再写，不报错中断。
- **不动现有 markdown**：`sprint.md`/`gates.md`/`queue/*.md` 保留为「人看的视图」，机器侧不读它们取状态；两边漂移由 `check-sprint.js` 的三方一致检查兜住。

---

## 四、字段契约

```yaml
project: {项目名}                # string，项目名
schema: 1                        # int，本契约 schema 版本号；字段演进靠它兼容
generated_by: hact-method        # string，固定 hact-method（运行时中立）

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
    discipline: dev-backend     # enum，8 种 discipline
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
    discipline: dev-backend
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

code_reviews:                    # CR 结论 + 评语 + 逐条 issue，全内联（不走 API）
  - iteration: v2
    task_id: hact-v2-008         # string，被审 develop 任务 id
    conclusion: 需修订           # enum，通过 / 需修订
    rounds: 2                    # int ≥1，兼容总轮次 = code_rounds + spec_rounds
    code_rounds: 1               # int ≥1，代码证据审查实际运行数
    spec_rounds: 1               # int ≥0，freshness/contract/claim 独立复核数
    freshness: revised           # enum，pass / revised
    review_report_dir: iterations/v2/code-reviews/hact-v2-008  # B 类为 b-reviews/{task-id}
    review_profile_version: develop-review-profile/v1  # Foundation 为 foundation-review/v1
    implementation_started_at: 2026-08-09T01:00:00Z  # ISO-8601，preflight 通过后当场记录
    implementation_completed_at: 2026-08-09T01:42:00Z # 首轮独审 dispatch 前当场记录
    review_started_at: 2026-08-09T01:42:00Z          # 首轮 full dispatch
    review_completed_at: 2026-08-09T02:18:00Z        # 最终独审通过
    spec_minutes: 4              # int ≥0，preflight/revise-doc 多段规格澄清墙钟总和；implementation/review 分钟由时间戳按需计算
    comment: 整体思路对，但有安全隐患  # string，综合评语，可为 null
    issues:                      # 数组，可为空 []
      - id: hact-v2-008-F001     # 稳定 finding id；同根变体不另起 id
        severity: 严重           # enum，严重 / 一般 / 建议
        dimension: contract      # review profile 稳定维度 id，见下
        type: behavior-bug       # enum，见下
        reachability: current    # current / conditional / unreachable / unknown
        action: fix-code         # finding 实际进入的控制流
        impact: 登录态可绕过       # 当前可观察后果；未知写 unknown
        description: token 没校验过期
        location: src/auth.ts:40 # string 文件:行号，可为 null
```

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
| `code_reviews[].review_report_dir` | 项目根相对路径；A 类 `iterations/vN/code-reviews/{task-id}`，B 类 `b-reviews/{task-id}` |
| `code_reviews[].review_profile_version` | 普通任务 `develop-review-profile/v1`；Foundation `foundation-review/v1`。存量缺失兼容提示，新任务终态审计必填 |
| `code_reviews[].implementation_started_at/completed_at` | ISO-8601，开始不得晚于结束 |
| `code_reviews[].review_started_at/completed_at` | ISO-8601，开始不得晚于结束 |
| `code_reviews[].spec_minutes` | int ≥0（非枚举）；多段规格澄清累计值 |
| `code_reviews[].issues[].severity` | 严重 / 一般 / 建议 |
| `code_reviews[].issues[].dimension` | 普通 profile：contract / scope-and-secrets / test-evidence / comment-hygiene / standards / enforcement / design-fidelity / input-provenance / query-performance / concurrency / logging-privacy / maintainability / sensitive-boundaries；Foundation：foundation-enforcement / foundation-chokepoint / foundation-completeness / foundation-slice / foundation-self-green |
| `code_reviews[].issues[].type` | behavior-bug / contract-drift / example-error / enforcement-claim / scope-gap / future-risk / evidence-gap / invariant-failure / claim-failure |
| `code_reviews[].issues[].reachability` | current / conditional / unreachable / unknown |
| `code_reviews[].issues[].action` | fix-code / revise-doc / fix-mechanism / downgrade-claim / global-gap-review / backlog / request-evidence |

> 三个 rounds 字段是次数。`rounds` 为兼容总数；implementation 从 preflight 通过到首次 full dispatch，review 从首次 full dispatch 到最终通过（含等待与整改），两者由各自时间戳按需计算，不另存派生分钟。`spec_minutes` 累加可能分散在 preflight/revise-doc 的规格澄清时间，无法由一对边界时间戳表达，故继续持久化。时间戳由编排器在事件发生时写，禁止事后估算；下游消费者可忽略未知键。
>
> 每个新完成任务在终态提交前运行 `node scripts/check-sprint.js --review {task-id}`。该校验按 task-id 工作，不依赖 iteration，因此 A/B 共用；显式校验会重算每次 full 的 review profile、核 targeted 继承链，并对缺字段硬失败。只有迭代级兼容扫描才允许对旧条目留人签。

> CR severity 映射：develop 内置独立审查用两级 `[阻断]/[建议]`，写入 YAML 时映射为 `[阻断]→严重`、`[建议]→建议`（阻断在审查 loop 内已修，落 YAML 的多为 `[建议]→建议`）。

### 不进 YAML（留在 markdown 里，供人阅读）
任务包字段正文、`description`、`completion_report`、`output`、PRD/TRD/sprint/联调报告正文。

### CR issue 内联（已查证定案）
CR 的 conclusion + comment + issues[] 全部内联进 `status.yml`，不走 API。依据：`develop` 内置独立审查把逐条 issue 写进 Gitee PR comment，仓库内无含结构化 issue 的文件可供外部拉取，内联进 `status.yml` 后即可用。（2026-06-20 起 CR 由 develop 自审写入，非独立 pr-review。）

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

**写入纪律**：
- 每次只改对应字段，保留其余内容不动。
- 显式写 `null`，不省略键。
- 写入后随当步既有的 `git commit` 一并提交（status.yml 与既有产物同 commit）。
