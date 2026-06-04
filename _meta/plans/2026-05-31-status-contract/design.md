# 设计文档 · status.yml 状态契约

> 日期：2026-05-31
> 范围：**仅改 hact-method**，本轮不动 hact-app
> 状态：项目级单文件版（迭代级因 B 类边界被推翻），实现完成待复审

---

## 一、问题与动机

### 现状（真相）

hact-app 后端 `sync/sync.service.ts` 每 60 秒 `git fetch && git reset --hard` 把项目仓拉到本地，靠**解析 markdown** 把状态灌进数据库：

| 解析对象                       | 方式                                                                       | 稳定性   |
| -------------------------- | ------------------------------------------------------------------------ | ----- |
| `iterations/vN/queue/*.md` | 读 YAML frontmatter（title/status/sprint_id/task_type/assigned_to…），缺失降级正则 | ⚠️ 最脆 |
| `iterations/vN/sprint.md`  | 解析 markdown 表格，task-id → status（queue 状态 fallback）                       | ⚠️ 脆  |
| `iterations/vN/gates.md`   | 数 `- [x]` → G1–G5                                                        | ✅ 相对稳 |

TRD 设计的 `/api/cc/tasks/:id/take|done` 等写入接口基本未实现/未用——状态完全是「解析」出来的。CC 每次生成这些 markdown 时是「自然语言 + 自由排版」，结构会漂移，导致 hact-app **持续取错数**。

### 根因

hact-app 在解析「为人写的叙述性 markdown」来取「给机器用的结构化数据」。两种用途混在同一份文件里，文件格式一漂移，取数就错。

---

## 二、核心设计原则

**状态（state）与文件（content）彻底分离：**

|        | 是什么                                                          | 怎么取                             | 是否落库 hact-app    |
| ------ | ------------------------------------------------------------ | ------------------------------- | ---------------- |
| **状态** | Gate 签没签、任务状态、归属、PR、依赖、联调项状态、CR 结论…                          | 解析 `status.yml`（机器侧唯一数据源）       | 落库，驱动看板/列表/角标/计数 |
| **文件** | PRD/TRD 正文、任务包 16 字段正文、completion_report、output、CR issue 详情… | 用到时走 API 现拉（Gitee Contents API） | **不落库、不解析**      |

**判定边界（一句话）：**

> 凡是 UI 上以「字段 / 列 / 角标 / 计数」出现的 → 进 `status.yml`；
> 凡是以「文档正文」出现、需要点开才看的 → 走 API 现拉。

由此，hact-app 解析叙述性 markdown 的代码归零，文档正文落库归零。

---

## 三、`status.yml` 契约

### 位置与生命周期（项目级单文件）

**项目根 `status.yml`，一个项目一份**，覆盖全部迭代 + 全部 B 类任务。机器侧**唯一**数据源。

**为什么项目级而非迭代级**：B 类任务（bug/optimization）跨迭代、不归任何一期 Gate 流，总账 `b-tasks.md` 本就在项目根；两个迭代之间（vN 已签 G5、vN+1 未起）没有「活跃迭代」，迭代级文件无处安放 B 类——项目级文件永远在。另外创建只一次、多迭代并行天然支持。queue 任务包仍按 `iterations/vN/queue/` 物理隔离，只是状态投影集中。

**创建于 init-project**（建一次，永远存在）。各更新步骤写入前若文件不存在则先从 `templates/status.yml` 补建，不中断。

### 结构

```yaml
project: hact-app                # 项目名
schema: 1                        # 契约 schema 版本号
generated_by: cc

iterations:                      # 按版本分块；每期一个 key
  v1:
    gates:
      G1: { signed: true,  date: 2026-05-20 }
      G2: { signed: true,  date: 2026-05-24 }
      G3: { signed: false, date: null }
      G4: { signed: false, date: null }
      G5: { signed: false, date: null }
  v2: { gates: { G1: { signed: false, date: null } } }   # … G2–G5

tasks:
  - id: hact-v2-001              # A 类 {缩写}-v{N}-{序号}；B 类 {缩写}-b-{序号}
    iteration: v2                # 属哪期；B 类为 null
    sprint: 1                    # B 类 / 修复任务为 null
    source: sprint               # sprint/integration/manual-test/bug/optimization
    title: 用户表与权限
    type: develop
    discipline: dev-backend
    layer: backend              # frontend / backend / shared / null
    status: merged              # 可取 / taken-by / done / merged
    assigned_to: zhangsan
    pr: 12
    parent_id: null
    depends_on: []
    delivery: 独立              # 独立 / 批量 / null
    urgency: null               # hotfix / null
  - id: hact-b-001              # B 类：iteration/sprint/delivery 均 null
    iteration: null
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

integration_tests:               # 带 iteration；description 短、随行显示 → 进 YAML
  - { iteration: v2, index: 1, description: 登录跳转正常, status: 通过, failure_reason: null }
  # status 枚举：待执行 / 执行中 / 通过 / 失败

code_reviews:                    # 带 iteration；结论 + 评语 + 逐条 issue 全内联
  - iteration: v2
    task_id: hact-v2-008
    conclusion: 需修订          # 通过 / 需修订
    comment: 整体思路对，但有安全隐患
    issues:
      - { severity: 严重, description: token 没校验过期, location: src/auth.ts:40 }
      # severity 枚举：严重 / 一般 / 建议
```

### 不进 YAML（一律 API 现拉）

任务包 16 字段正文、`description`、`completion_report`、`output`、PRD/TRD/sprint/联调报告正文。

### CR issue 的归属（已查证定案：内联 YAML）

**决策：CR 的 conclusion + comment + issues[] 全部内联进 `status.yml`**，不走 API。依据：

- hact-method `pr-review.md` 流程：逐条 issue 只写进 **Gitee PR comment**；仓库里唯一 CR 文件产物是 `sprint.md` 追加一句 `CR:通过/打回(原因)`（仅结论）。**仓库内不存在含结构化 issue 的文件**——「走 API」无文件可拉，否则要去解析 PR comment（正是本轮要消灭的脆弱解析）。
- hact-app 现状：后端 CR 数据全无（`cr_result` 表已被 migration 007 DROP，无 sync 解析、无 PR comment 拉取、`/tasks/:id/cr-result` 端点未实现）；前端 `CRDrawer.vue` 已写好，期望 `{ conclusion, issues[], comment }`，是无数据源的死模板。内联进 YAML 后前端一行不改即可活。
- CR issue 是结构化小记录、驱动 UI 角标（severity 分级），属「状态」非「正文」，与 `integration_tests` 同等待遇。

> **实现期小映射**：hact-method 现用两级 `[阻断]/[建议]`，前端/TRD 是三级 `严重/一般/建议`。改 pr-review spec 时定映射（`[阻断]→严重`、`[建议]→建议`），不影响契约定义。

### 字段权威性

- 枚举值与 TRD 数据模型对齐：task.status = `可取/taken-by/done/merged`；integration_test.status = `待执行/执行中/通过/失败`；cr conclusion = `通过/需修订`。
- 中英混用（如 `taken-by`）沿用既有领域模型，不改。
- `null` 显式写出，不省略键。

---

## 四、现有 markdown 的处置

`sprint.md` / `gates.md` / `queue/*.md` **一个字不动**，降级为「人看的视图」。hact-app 不再读它们。

- `status.yml` 与 `sprint.md/gates.md` 即便漂移，也不再让 hact-app 取错数——因为 hact-app 根本不看后者。
- 接受双写（人看的视图 + 机器看的 YAML）。本轮不做「从 YAML 生成 sprint.md」的自动派生（留作未来可选优化）。

---

## 五、写入协议：「做一个填一个」

**总规则**：凡是往 `iterations/vN/queue/` 写一个任务包的地方，就同步往 `tasks[]` 追加一条（带 `source`/`iteration`）；状态流转（认领/done/merged）按 `task-id` 改，对所有 `source` 一视同仁。

| 事件                 | 归属 spec                      | 写 status.yml 的什么                                            |
| ------------------ | ---------------------------- | ----------------------------------------------------------- |
| 项目初始化              | `init-project`               | **创建 status.yml**（模板 + `iterations.v1.gates` 全未签 + 空 tasks） |
| 签 G1               | `draft-prd-vN`               | 确保 `iterations.vN.gates` 块（v2+ 新建）+ `gates.G1`              |
| 签 G2               | `draft-tech-design`          | `iterations.vN.gates.G2`                                    |
| 签 G3 + 灌 sprint 任务 | `plan-sprint`                | 批量追加 sprint 任务（`source=sprint`,`iteration=vN`）+ `gates.G3`  |
| 认领任务               | `develop`                    | `status: taken-by` + `assigned_to`                          |
| 任务完成 / 提 PR        | `develop`                    | `status: done` + `pr`                                       |
| 合并                 | `pr-review`                | `status: merged`                                            |
| CR 结论              | `pr-review`                | `code_reviews[]`                                            |
| 联调修复任务派发           | `generate-integration-tests` | 追加 task（`source=integration`,`iteration=vN`）                |
| 联调项创建/跑通/失败/复测     | `generate-integration-tests` | `integration_tests[]`                                       |
| 验收修复任务派发           | `manual-test`                | 追加 task（`source=manual-test`,`iteration=vN`）                |
| 签 G4               | `manual-test`                | `iterations.vN.gates.G4`                                    |
| B 类派发              | `dispatch-new`               | 追加 task（`source=bug/optimization`,`iteration=null`）         |
| 签 G5               | `wrap-up-iteration`          | `iterations.vN.gates.G5`                                    |

> 涉及 10 份 exec spec：init-project、draft-prd-vN、draft-tech-design、plan-sprint、develop、pr-review、generate-integration-tests、manual-test、dispatch-new、wrap-up-iteration。

---

## 六、本轮 hact-method 落地清单

1. **新增契约文档** `skeleton/07-status-contract.md`：字段名/类型/枚举/取值全锁死，作为人与 hact-app 共同的单一事实。
2. **新增模板** `templates/status.yml`（项目根模板）：带注释空骨架，供 init-project 复制。
3. **改 10 份 exec spec**：init-project（建文件）+ 第五节表格其余 9 份，各插入「更新 status.yml」步骤。
4. **同步登记**：skeleton/README、STATUS.md、CLAUDE.md 项目仓结构按需补一行。

### 明确不在本轮范围

- 不改 hact-app（sync 改读 YAML + 文档走 API，留待 hact-app 自身迭代统一改）。
- 不改 CC 启动接续逻辑（项目仓 CLAUDE.md 仍读 gates.md/sprint.md 推断；跑一段时间后随 hact-app 改动统一改）。
- 不做 sprint.md 自动派生。

---

## 七、用户已拍板的决策

- **A**：`integration_tests` 与 `code_reviews` 本轮纳入 `status.yml`。
- **B**：本轮不改 CC 启动接续逻辑，跑一段时间后随 hact-app 修改统一改。
- **C**：契约文档放 `skeleton/07-status-contract.md`。
- 格式：专用 `status.yml`（YAML），hact-app 直接 `YAML.parse`，零歧义。
- 覆盖：完整状态骨架（非只装易变三字段），文档正文一律走 API。
- **CR issue**：查证两边实情后定案——conclusion + comment + issues[] **全部内联 YAML**，不走 API（仓库无 CR 文档文件可拉，前端 CRDrawer 已就绪只缺数据源）。
- **项目级单文件**（非迭代级）：B 类边界（两迭代之间无活跃迭代）暴露了迭代级的缺陷，定为项目根 `status.yml` 一份；`iterations` 按版本分块、task 带 `iteration` 字段、B 类 `iteration: null`；init-project 建一次。
