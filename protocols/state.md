# State Protocol

本文定义所有 HACT Core Task 的统一生命周期。

## 1. 四态保持不变

HACT 保留稳定的人类沟通语言：

`可取 → taken-by → done → merged`

### `可取`
Task 已满足进入工作所需的硬性前置，可以被已获授权的 Owner 接手。

### `taken-by`
Task 已有明确 Owner，工作正在进行。临时阻塞、等待、暂停等仍保持 `taken-by`，通过 blocker / progress 描述原因，不增加新的正式状态。

### `done`
Owner 已形成稳定的 Shared Candidate Truth。通常意味着正式候选产物已经固定到可明确引用的 snapshot，可进入必要的独立 review / verification。

`done` 不等于下游 Task 可以正式依赖该结果。

### `merged`
Task 的全部自身完成条件已满足，结果已进入 Accepted Project Truth。

`merged` 是终态。

## 2. 主流流转

正常路径：

`可取 → taken-by → done → merged`

简单且没有独立 candidate / review 分离价值的 Task 可：

`taken-by → merged`

## 3. Review finding

若 `done` candidate 的 review / verification 发现 blocking finding：

`done → taken-by`

修正后形成新 candidate，再进入 `done`。

## 4. 异常转移

任何非 `merged` Task 可在有明确理由时回到 `可取`，例如：
- Owner 主动放弃；
- 需要重派；
- 上游 contract 有阻断；
- 当前 Runtime 缺少必要能力。

不为这些场景增加额外状态枚举。

## 5. Owner 与 Runtime

`assigned_to` 表示责任归属；`runtime` 仅是当前执行位置 metadata；Git author 仅表示提交归属。三者都不自动产生额外权限。

## 6. State 与 Gate 正交

Task lifecycle 回答“这项工作本身做到哪里”。

Gate 回答“项目是否被授权进入下一成熟阶段”。

Task 可以 `merged` 而 Gate 尚未批准；已 `merged` Task 不因后续修改需求回退，变化通过新 Task 表达。
