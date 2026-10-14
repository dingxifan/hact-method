# 07 · status.yml 状态契约

本文件定义项目根 `status.yml` 的字段、类型、枚举和指针；生命周期、readiness、Gate 与接受边界分别按 `protocols/state.md`、`protocols/gates.md`、`protocols/git-truth.md` 及当前 Task Contract。

## 一、状态与证据

Task/Gate 动态状态只维护在 `status.yml`，sprint 是规划、任务包是契约，不另存可变状态副本。详细 findings、轮次与验证进入既有 immutable report/evidence，status 只保留所需指针，不因可计数就新增字段或成本记录。检查器按当前结构读取各自所需事实，不以 Markdown 总结代替正式状态；任务包字段和规划覆盖仍由对应检查器核验。

## 二、项目级位置与任务载体

一个项目共用根 `status.yml`，按 iterations/task-id 区分迭代与项目级工作，不每期重建。任务包路径按来源判断，不能只看 iteration 是否为 null：

- 迭代内工作：`iterations/vN/queue/{task-id}.md`。
- B 类 bug/optimization：`iteration:null`，`b-queue/{task-id}.md`，按 `protocols/b-intake.md`。
- 跨迭代 Foundation 后续实现：`source:foundation`、`iteration:null`，`docs/tasks/{task-id}.md`，按 `tasks/develop.md` 的既有载体规则。

## 三、创建与更新边界

初始化由 `tasks/init-project.md` 创建模板状态；存量接入先走 Core 外 normalization。工作中缺失状态不能用空模板静默重建来证明就绪或已完成，应先按当前 Contract/Recovery 核权威事实；不取消合法 bootstrap。

每个正式任务包同步准备其 status registration；具体认领/完成由对应 Task 核前置及证据。G3 approval 前可以登记已接受 planning 中的“可取”任务，但不得认领 source=sprint；Gate 批准独立记录，不在签 G3 时重写已批准任务内容。旧 gates/b-tasks 只作历史参考，不生成新动态副本。

## 四、字段契约

```yaml
project: {项目名}                # string，项目名
schema: 1                        # 当前唯一 schema；不兼容旧形状
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
    type: develop               # enum，canonical Core Task type，见 tasks/README.md
    layer: backend              # enum，frontend / backend / shared / null
    status: merged              # enum，可取 / taken-by / done / merged
    assigned_to: zhangsan       # string，负责人标识，未认领为 null
    pr: 12                      # int PR 号，无为 null
    parent_id: null             # string 父任务 id，无为 null
    depends_on: []              # string[]，依赖的 task-id 列表
    delivery: 串行              # enum，串行 / 可并行；B 类 / 修复任务可为 null
    urgency: null               # enum，hotfix / null
    document_review_commit: null # draft-tech-design 收口时填：包含末轮 report 的固定 commit
    latest_document_review: null # draft-tech-design 收口时填：document-reviews/.../round-NN.md
  - id: hact-v2-integration-verify # 每 iteration 恰有一条 System Verification Core Task work item
    iteration: v2
    sprint: null
    source: null                # 非 develop source；不得伪装成 source=integration 修复任务
    title: System Verification
    type: integration-verify
    layer: null
    status: 可取
    assigned_to: null
    pr: null
    parent_id: null
    depends_on: []
    delivery: null
    urgency: null
    latest_system_review: iterations/v2/system-review/review-001.md
    integration_result: integration-tests/result-2026-09-20.md
    final_candidate: <40-char project commit SHA>
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

code_reviews:                    # 每个 task 的 latest immutable review pointer
  - task_id: hact-v2-008
    reviewed_candidate: {40-char commit/tree SHA}
    latest_review: iterations/v2/code-reviews/hact-v2-008/round-02.md
    conclusion: pass             # pass / blocked
```

### 枚举对齐

| 字段 | 枚举值 |
|---|---|
| `tasks[].source` | develop work item：sprint / foundation / integration / manual-test / bug / optimization；`type=integration-verify`：null |
| `tasks[].status` | 可取 / taken-by / done / merged |
| `tasks[].layer` | frontend / backend / shared / null |
| `tasks[].delivery` | 串行 / 可并行 / null |
| `tasks[].urgency` | hotfix / null |
| `integration_tests[].status` | 待执行 / 执行中 / 通过 / 失败 |
| `code_reviews[].conclusion` | pass / blocked |

> Task 终态检查按 `tasks[].type` 路由。`develop` 才运行 `node scripts/check-sprint.js --review-chain {task-id}`；`draft-tech-design` 运行 `node scripts/check-task-completion.js --task {task-id}`，从该 Task 的 `document_review_commit` 读取 `latest_document_review` 及整条报告链。其他类型以对应 Task Contract 为准。固定 Git 基线、review scope、report chain 与 finding closure 仍必需；status 只保存 immutable evidence pointer，不复制轮数或 findings。

### System Verification 最小指针

每期必须有且仅有一个 `type=integration-verify` work item，并只在该条目存：

- `latest_system_review`：当前最新 immutable reviewer report；
- `integration_result`：当前 runtime result；
- `final_candidate`：两条 lane 最终共同指向的 project commit。

Findings 不复制进 status，由 checker 沿 latest report 读取。

### 不进 YAML（留在 markdown 里，供人阅读）
任务包字段正文、`description`、`completion_report`、`output`、PRD/TRD/sprint/联调报告正文。

---

## 五、写入协议

- 按 task-id 更新对应状态，保留其他内容；显式写 `null`，不省略现有契约要求的键。status 与相关产物随既有 Git delivery 一起提交。
- 四态、done 的稳定 Candidate 含义及 merged 的接受条件按 State/Task，不把“提 PR”或“同会话完成”当作状态定义；Gate approval 不从状态推导。
- 每个 develop Task 只更新自己的最新 review pointer，完整报告链保持 immutable，不按每次 CR 重复追加同一 Task 记录。
- System Verification 使用上文三个最小指针及项目现有 `check-system-review`/completion 入口；B 类经 B Intake 登记 develop，不创建 dispatch-new Core Task。

各 Task 特有的产物、状态更新、required verification 与 Human Authority 只读其 canonical Contract，不在本页重复维护事件流程表。
