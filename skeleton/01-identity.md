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

## 3. users.role 退化为权限标记

`users.role` 字段在 v2 里**只用于权限授予**，与流程无关：

| 取值 | 含义 |
|---|---|
| `manager` | 可读写所有项目数据；可触发立项、迭代、Gate 签署等管理性写操作 |
| `developer` | 只能修改与自己相关的任务状态、提交完成报告 |

仅对应"能不能写哪些表"（hact-app 后端的权限守卫）。

无论是 `manager` 还是 `developer`，做事时都按当前 task 加载规范——`manager` 不会因为是 manager 就懂前端开发，`developer` 不会因为是 developer 就只能写代码。**规范由 task.type 决定，不由 user.role 决定。**

---

## 4. 跨会话身份连续性

同一用户在不同时间打开的会话**共享同一身份**——CC 启动协议靠 `git config user.name` 推断"当前操作者"，无须每次会话声明。

由此推导：

- **"我的待办"** = 当前 user 名下未完成的任务集
- **断点续做** = CC 启动协议自动找出当前 user 进行中的任务并建议续做
- **协作冲突** = 同一任务不能被两个 user 同时拉走（详见 `05-state-machine.md` 软锁机制）
