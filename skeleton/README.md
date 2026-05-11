# Skeleton — hact-method 骨架

本目录是 hact-method 方法论的骨架——定义"是什么"层面的核心模型：身份、工作区、知识聚类、任务清单、状态机、Gate。

## 阅读顺序

按层级递进：

1. **[`01-identity.md`](01-identity.md)** — 身份模型：谁是谁？git author + web 登录映射同一 user；权限通过 user-discipline 关联表达
2. **[`02-workspaces.md`](02-workspaces.md)** — 两个工作区按"心态"切割：hact-method（方法论）/ 项目根（项目）
3. **[`03-disciplines.md`](03-disciplines.md)** — 9 个 discipline = 任务知识的聚类（含 CC 上下文管理 heat map）
4. **[`04-task-catalog.md`](04-task-catalog.md)** — 12 个 task type 完整字段（discipline / 完成判据 / 产物 / 关联 Gate / 属性）
5. **[`05-state-machine.md`](05-state-machine.md)** — 4 个状态（可取 / taken-by / done / merged）+ 流转 + 软锁 + 异常转移
6. **[`06-gates.md`](06-gates.md)** — 5 个 Gate + 子状态聚合 + A 类 vs B 类 + 多迭代展示

## 核心设计原则

- **任务驱动，不是身份驱动**——用户登录就是自己，task.type 决定加载哪份规范
- **path X**——task 单 discipline (1:N)；user 多 discipline (M:N)
- **discipline 不是身份**——是任务知识的聚类维度，给规范作者 + 拉取准入用
- **早期保持简单**——异常情况（暂停 / 召回 / 放弃）靠人沟通，不形式化（详见 05 §4 异常转移）
- **复杂工作不预定义**——方法论调整等发散性工作不强行做 task type
- **签字归属内容**——Gate 签字合并到最近前置任务，不另立 sign-gate task

完整 20 条决策见 [`../BRIEF.md`](../BRIEF.md) "关键设计决策" 段。

## 跟其他文档的关系

```
hact-method/
├── CLAUDE.md             项目级 CC 指令 / 文件规范
├── BRIEF.md              项目背景 / 目标 / 阶段 / 关键设计决策（20 条）
├── STATUS.md             当前状态
├── skeleton/             ← 本目录（骨架，第一阶段产物）
├── specs-structural/     第二阶段：每个 task 的完整结构契约（继承 04）
├── specs-execution/      第四阶段：每个 task 的执行规范 + subagent 协议（继承 03 密度声明）
├── projects/             具体项目的编排目录（含 iterations/）
├── templates/            模板（项目模板、standards 模板等）
└── _meta/                研发过程产物（plans / input）
```

## 第一阶段（搭骨架）完成标志

- [x] 骨架 6 份文档完稿（01-06）
- [x] README.md 入口导读完成
- [x] 骨架自检通过——覆盖度（8 完成标志）+ 互引一致性

第一阶段完成后进入第二阶段·结构层规范。详见 [`../STATUS.md`](../STATUS.md) 阶段划分段。

## 下游文档预期

第二阶段将基于本骨架展开 `specs-structural/`：每个 task 一份独立 spec 文档，覆盖完整契约（含边界场景、错误处理、字段细节）。第三阶段实施 `hact-app`（v2 看板应用），是本方法论的首个落地实例。第四阶段补 `specs-execution/`：每个 task 的执行细则 + 高密度 discipline 的 subagent 协议。
