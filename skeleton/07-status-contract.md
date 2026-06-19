# 07 · status.yml 状态契约

> 本文件定义**项目根** `status.yml` 的字段、类型、枚举与取值，是**人与 hact-app 共同的单一事实**。
> hact-app 直接 `YAML.parse(status.yml)` 取数，不再解析任何叙述性 markdown。
> 设计依据：`_meta/plans/2026-05-31-status-contract/design.md`。

---

## 一、为什么有这份契约

hact-app 原先靠解析 `queue/*.md` frontmatter、`sprint.md` 表格、`gates.md` 复选框来取状态。这些是「为人写的叙述性 markdown」，CC 每次生成时排版会漂移，导致 hact-app 持续取错数。

**解法**：把「机器要的结构化状态」从「人看的叙述文档」里彻底分离，单独落到一份 schema 锁死的 `status.yml`。

**核心原则（判定一个数据进不进 YAML）：**
> 凡是 UI 上以「字段 / 列 / 角标 / 计数」出现的 → 进 `status.yml`；
> 凡是以「文档正文」出现、需点开才看的 → 不进 YAML，由 hact-app 用到时走 API 现拉。

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
- **不动现有 markdown**：`sprint.md`/`gates.md`/`queue/*.md` 保留为「人看的视图」，hact-app 不再读它们，两边漂移也不影响取数。

---

## 四、字段契约

```yaml
project: hact-app                # string，项目名
schema: 1                        # int，本契约 schema 版本号；字段演进靠它兼容
generated_by: cc                 # string，固定 cc

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
    type: develop-sprint        # enum，14 种 task type（develop 家族拆为 develop-sprint/develop-repair/develop-b，由 source 选壳）
    discipline: dev-backend     # enum，9 种 discipline
    layer: backend              # enum，frontend / backend / shared / null
    status: merged              # enum，可取 / taken-by / done / merged
    assigned_to: zhangsan       # string Gitee login，未认领为 null
    pr: 12                      # int PR 号，无为 null
    parent_id: null             # string 父任务 id，无为 null
    depends_on: []              # string[]，依赖的 task-id 列表
    delivery: 独立              # enum，独立 / 批量；B 类 / 修复任务可为 null
    urgency: null               # enum，hotfix / null
  - id: hact-b-001              # B 类示例
    iteration: null             # 不属任何迭代
    sprint: null
    source: bug
    title: 登录偶发 500
    type: develop-b
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
    comment: 整体思路对，但有安全隐患  # string，综合评语，可为 null
    issues:                      # 数组，可为空 []
      - severity: 严重           # enum，严重 / 一般 / 建议
        description: token 没校验过期
        location: src/auth.ts:40 # string 文件:行号，可为 null
```

### 枚举对齐（与 hact-app TRD 数据模型一致）

| 字段 | 枚举值 |
|---|---|
| `tasks[].source` | sprint / integration / manual-test / bug / optimization |
| `tasks[].status` | 可取 / taken-by / done / merged |
| `tasks[].layer` | frontend / backend / shared / null |
| `tasks[].delivery` | 独立 / 批量 / null |
| `tasks[].urgency` | hotfix / null |
| `integration_tests[].status` | 待执行 / 执行中 / 通过 / 失败 |
| `code_reviews[].conclusion` | 通过 / 需修订 |
| `code_reviews[].issues[].severity` | 严重 / 一般 / 建议 |

> CR severity 映射：pr-review 流程内部用两级 `[阻断]/[建议]`，写入 YAML 时映射为 `[阻断]→严重`、`[建议]→建议`。

### 不进 YAML（hact-app 走 API 现拉）
任务包 17 字段正文、`description`、`completion_report`、`output`、PRD/TRD/sprint/联调报告正文。

### CR issue 内联（已查证定案）
CR 的 conclusion + comment + issues[] 全部内联进 `status.yml`，不走 API。依据：hact-method `pr-review.md` 流程把逐条 issue 写进 Gitee PR comment，仓库内无含结构化 issue 的文件可供 API 拉取；hact-app 前端 `CRDrawer.vue` 已就绪、期望 `{ conclusion, issues[], comment }`，内联后即可用。

---

## 五、写入协议：做一个填一个

**总规则**：
> 凡是写一个任务包的地方（A 类写 `iterations/vN/queue/`，B 类写 `b-queue/`），就同步往 `tasks[]` 追加一条（带 `source` / `iteration`）；状态流转（认领 / done / merged）按 `task-id` 改，对所有 `source` 一视同仁。

| 事件 | 归属 spec | 更新内容 |
|---|---|---|
| 项目初始化 | `init-project` | **创建 status.yml**（模板 + `iterations.v1.gates` 全未签 + 空 tasks） |
| 签 G1 | `draft-prd-vN` | 确保 `iterations.vN.gates` 块存在（v2+ 新建）+ `gates.G1` |
| 签 G2 | `draft-tech-design` | `gates.G2` |
| 签 G3 + 灌 sprint 任务 | `plan-sprint` | 批量追加 sprint 任务（`source=sprint`, `iteration=vN`）+ `gates.G3` |
| 认领任务 | `develop-sprint` / `develop-repair` / `develop-b` | 对应 task `status: taken-by` + `assigned_to` |
| 任务完成 / 提 PR | `develop-sprint` / `develop-repair` / `develop-b` | 对应 task `status: done` + `pr` |
| 合并 | `pr-review` | 对应 task `status: merged` |
| CR 结论 | `pr-review` | `code_reviews[]` 追加一条 |
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
