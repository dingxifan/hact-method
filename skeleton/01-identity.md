# 01 — 身份模型

> **本文回答**："谁是谁？" 身份的物理载体是什么？
>
> **不回答**：有哪些任务（→ `04-task-catalog.md`）；任务知识怎么分组（→ `03-disciplines.md`）；任务状态怎么流转（→ `05-state-machine.md`）；工作区的具体边界（→ `02-workspaces.md`）。

---

## 1. 用户是唯一身份

身份的物理载体只有一个：**用户（user）**。

| 通道 | 身份字段 |
|---|---|
| CC 端会话 | `git config user.name` + `user.email` |
| Web 端（hact-app） | 登录账号 |

两个通道映射到同一个 user 实体——通过 user 表的同一行关联。具体认证机制是 hact-app 的实施细节，本文只规定原则：**必须打通**。

**跨工作区身份不变**：

- 在 hact-method（方法论心态）做事的 X
- 在项目根（项目心态）做事的 X

是同一个 X。工作区切换的是**工作心态**，不是**身份**。

---

## 2. 任务是路由键

用户登录后**没有角色身份**。CC 加载工作规范靠的是当前 task 的 type，不是 user 的属性。

同一用户的不同会话：

```
上午：拉 draft-prd-vN 任务  → CC 加载 PRD 起草规范
下午：拉 develop 任务        → CC 加载 dev-{layer} 开发规范
晚上：拉 plan-sprint 任务  → CC 加载 sprint 规划规范
```

三次会话都是同一个 user，加载的规范完全不同——驱动它的是"手上是哪类任务"，不是"扮演什么角色"。

**反向查询路径**：

```
task.type → spec → standards
```

具体清单见 `04-task-catalog.md`；spec 按 discipline 组织见 `03-disciplines.md`。

---

## 3. 权限通过 user-discipline 关联表达

权限不是用户的固有标签——而是**用户对 discipline 的授权集合**：

```
tasks.discipline             ← 单值（每个 task 挂一个主 discipline）
user_disciplines (junction)  ← 多值（一个 user 可被授权多个 discipline）
├── user_id
└── discipline_id
```

非对称：**task 侧 1:N**（一个 discipline 涵盖多个 task），**user 侧 M:N**（一个人可被授权多个领域）。

### 拉取准入

```
user 能拉 task 的条件：
  task.discipline ∈ user.disciplines
```

跨学科辅助知识由 spec 文本里跨引用相邻子规范来补——不在 schema 表达。

### 任务级写权限（taken-by）

拉取后，**任务的产物只能由 taken-by 的 user 写入**——粒度细到单个 task：

- `draft-prd` 任务的 taken-by 是 X → 该 task 关联的 PRD 文档只能 X 改
- `feature` 任务的 taken-by 是 Y → 该 task 关联的代码、完成报告只能 Y 改

### 管理性操作不另开后门

"立项 / 签 Gate"这类工作在 v2 里都是普通任务——立项是独立 task `init-project`(management)；Gate 签字合并入最近前置任务（G1 在 draft-prd-vN，G2 在 draft-tech-design，G3 在 plan-sprint，G4 在 manual-test，G5 在 wrap-up-iteration——详见 `06-gates.md`）。

谁能拉这些任务由 `user_disciplines` 授权决定——跟其他任务一视同仁。"谁能签 G1"等于"哪个用户被授权了 product"，不靠管理员标签开后门。

**例外**：方法论调整本身是发散性工作，没清晰 spec，**不预定义为 task type**——有 `management` 授权的 user 在 hact-method 工作区按需直接做（详见 `02-workspaces.md` §2）。

### 个人积累（hact-notes）的特殊权限模型

个人积累仓 `hact-notes-{姓名}` 的写权限**不走 discipline 准入**——notes 是个人资产，权限直接绑定 user 身份，而非 `user_disciplines` 授权：

- **写**：只有本人（组织仓下本人是唯一 push 协作者）。无需任何 discipline 授权。
- **读**：本人完全可读写；管理者经 `harvest-notes` 对 `[规范]`/`[checklist]`/`[方法论]` 条目**只读**收割；其他用户无权限（私有仓）。

这是对"拉取准入 = discipline"规则的**有限例外**：内容是纯个人原始沉淀时，权限绑身份。一旦经 `harvest-notes` 上提进公共层（hact-method），该公共产物的后续修改回归常规模型（`management` discipline）。物理形态与心态见 `02-workspaces.md` §4。

---

## 4. 跨会话身份连续性

同一用户在不同时间打开的会话**共享同一身份**——CC 启动协议靠 `git config user.name` 推断"当前操作者"，无须每次会话声明。

由此推导：

- **"我的待办"** = 当前 user 名下未完成的任务集
- **断点续做** = CC 启动协议自动找出当前 user 进行中的任务并建议续做
- **协作冲突** = 同一任务不能被两个 user 同时拉走（详见 `05-state-machine.md` 软锁机制）
