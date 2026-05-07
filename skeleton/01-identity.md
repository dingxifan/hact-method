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

- 在 `group-code` 父级（管理员心态）做事的 X
- 在 `projects/{项目}/` 下（编排心态）做事的 X
- 在 dispatch（循环心态）拉任务的 X

是同一个 X。工作区切换的是**工作心态**，不是**身份**。

---

## 2. 任务是路由键

用户登录后**没有角色身份**。CC 加载工作规范靠的是当前 task 的 type，不是 user 的属性。

同一用户的不同会话：

```
上午：拉 draft-prd 任务   → CC 加载 PRD 起草规范
下午：拉 feature 任务     → CC 加载前端开发规范
晚上：做 fix-cr 任务      → CC 加载 code review 处理规范
```

三次会话都是同一个 user，加载的规范完全不同——驱动它的是"手上是哪类任务"，不是"扮演什么角色"。

**反向查询路径**：

```
task.type → spec → standards
```

具体清单见 `04-task-catalog.md`；spec 按 discipline 组织见 `03-disciplines.md`。

---

## 3. 权限通过 user-discipline 关联表达

权限不是用户的固有标签——而是**用户与 discipline 之间的多对多关联**：

```
user_disciplines (junction)
├── user_id
└── discipline_id
```

每个用户被授权一组 discipline，表示"被允许拉哪些类型的任务"。

### 拉取准入

```
user 能拉 task 的条件：
  task.disciplines ∩ user.disciplines ≠ ∅
```

任一交集即可——v2 的精神是"规范是工具书"，缺的领域 CC 辅助补，不是身份测试。

### 任务级写权限（taken-by）

拉取后，**任务的产物只能由 taken-by 的 user 写入**——粒度细到单个 task：

- `draft-prd` 任务的 taken-by 是 X → 该 task 关联的 PRD 文档只能 X 改
- `feature` 任务的 taken-by 是 Y → 该 task 关联的代码、完成报告只能 Y 改

### 管理性操作不另开后门

立项、签 Gate、调整方法论这类工作，在 v2 里都是任务（type 类似 `init-project` / `sign-gate-N` / `adjust-method`），它们的 disciplines 含 `management`（具体见 03）。

只有被授权 `management` 的用户能拉这些任务。"谁能签 Gate"从"用户身份"降维到"任务准入"——跟其他任务一视同仁。

---

## 4. 跨会话身份连续性

同一用户在不同时间打开的会话**共享同一身份**——CC 启动协议靠 `git config user.name` 推断"当前操作者"，无须每次会话声明。

由此推导：

- **"我的待办"** = 当前 user 名下未完成的任务集
- **断点续做** = CC 启动协议自动找出当前 user 进行中的任务并建议续做
- **协作冲突** = 同一任务不能被两个 user 同时拉走（详见 `05-state-machine.md` 软锁机制）
