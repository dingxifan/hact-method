# State Protocol

本文定义所有 HACT Core Task 的统一生命周期。四态是稳定的人类沟通语言；Task 是否能真正开始，还要同时满足其 Task Contract 的 Preconditions。

## 1. 四态保持不变

`可取 → taken-by → done → merged`

### `可取`

Task 已被正式登记到 Accepted Project Truth，当前没有 Owner，可以被纳入认领判断。

`可取` **不是“所有动态前置已经满足”的同义词**。真正从 `可取` 进入 `taken-by` 前，Owner 必须按当前 Task Contract 重新核 readiness，例如：

- required Gate 是否 approved；
- `depends_on` 是否已经满足；
- required artifact / authorization 是否存在；
- 当前 Runtime 是否具备必需 capability。

若动态前置暂未满足，Task 保持 `可取`，但当前不得认领；不增加第五种 waiting / planned / blocked 状态。

### `taken-by`

Task 已有明确 Owner，工作正在进行。临时阻塞、等待、暂停等仍保持 `taken-by`，通过 blocker / progress 描述原因，不增加新的正式状态。

### `done`

Owner 已形成稳定的 Shared Candidate Truth。通常意味着正式候选产物已经固定到可明确引用的 snapshot，可进入必要的 Independent Review / verification。

`done` 不等于下游 Task 可以正式依赖该结果。

### `merged`

Task 自身的全部完成条件已满足，结果已进入 Accepted Project Truth。

`merged` 是该 Task 的终态；后续变化用新 Task 表达，不回退历史 Task。

## 2. 主流流转

正常路径：

`可取 → taken-by → done → merged`

简单且没有独立 Candidate / Review 分离价值的 Task 可：

`taken-by → merged`

## 3. Registration、readiness 与认领分开

状态回答“Task 被登记、由谁负责、候选是否稳定、是否已接受”。

Task Contract Preconditions 回答“此刻能否执行下一步”。

因此：

- `status: 可取` 表示已登记且未认领；
- 是否真的可认领，由 `可取 + Preconditions` 共同决定；
- `depends_on` 等动态条件不通过时，不改状态，只是不允许 `taken-by`；
- checker / Runtime 可以提供 readiness 判断，但不能发明新的生命周期状态。

对 `source=sprint` 的 develop Task，G3 approval 是认领硬前置。规划阶段可以先把已接受的 Task Package 与对应 `status: 可取` 登记进项目事实，用于 queue ↔ sprint ↔ status 一致性检查；G3 未 approved 时这些 Task 仍不得进入 `taken-by`。

## 4. Candidate 与 Accepted Truth

只有 Accepted Project Truth 中的 state record 才是项目正式状态。

Shared Candidate 中的状态变化只是候选，不得因为 candidate 文件里写了 `taken-by` / `merged` 就当作已生效。Candidate 被接受后，按其进入 Accepted Project Truth 的结果更新正式状态。

## 5. Review finding

若 `done` candidate 的 review / verification 发现 blocking finding：

`done → taken-by`

修正后形成新 candidate，再进入 `done`。

## 6. 异常转移

任何非 `merged` Task 可在有明确理由时回到 `可取`，例如：

- Owner 主动放弃；
- 需要重派；
- 上游 contract 有阻断；
- 当前 Runtime 缺少必要 capability。

原因写入 blocker / progress，不增加额外状态枚举。

## 7. Owner 与 Runtime

`assigned_to` 表示责任归属；`runtime` 仅是当前执行位置 metadata；Git author 仅表示提交归属。三者都不自动产生额外 Authority。

## 8. State 与 Gate 正交

Task lifecycle 回答“这项工作本身做到哪里”。

Gate 回答“项目是否被授权进入下一成熟阶段”。

Task 可以 `merged` 而 Gate 尚未批准。Gate 也不是第五种 Task state。

对 sprint develop 而言，G3 通过 Preconditions 控制是否允许从 `可取` 认领；它不改变四态本身。

## 9. Runtime Crossing 不产生第二套状态

跨 Runtime 执行遵循 `runtime-crossing.md`。Runtime Crossing Record 中的 `observed_state` 只是 non-authoritative observation；恢复时必须重新读取现有 status contract，冲突时以 authoritative status 为准。

Runtime event、job status 或 terminal result 都不得自行推断或写入 `taken-by`、`done`、`merged`，也不得创建或转移 ownership。`delegated` crossing 保留原 Task Owner；`transferred` 只有在既有 status contract 已显式完成 ownership 转移后才成立。derived child Task 同样必须先按现有规则成为 canonical registered Task；crossing 只引用这些事实。
