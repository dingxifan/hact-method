# 03 — Disciplines

> **本文回答**：v2 里有哪些 discipline？每个 discipline 的范围、边界、典型工作？
>
> **不回答**：每个 task 挂哪个 discipline（→ `04-task-catalog.md`）；身份/拉取规则（→ `01-identity.md` §3）。

---

## 什么是 discipline

**Discipline = 任务知识的聚类。**

它服务两个用途：

1. **写规范时的组织维度**——按 discipline 分组组织 spec，避免一份 spec 试图覆盖所有任务
2. **拉取准入控制**——`task.discipline ∈ user.disciplines` 决定哪些 user 能拉哪些 task

它**不是**：
- 不是身份（v2 已废弃身份扮演模型，见 `01`）
- 不是 task → spec 路由键（`task.type` 才是路由键，见 `01`）

discipline 与 task 的关系：每个 task 挂**单一** discipline（path X，1:N）；每个用户可被授权多个 discipline（M:N）。具体哪个 task 在哪个 discipline 见 `04-task-catalog.md`。

---

## 9 个 discipline

### `management`

**范围**：治理类知识——方法论的维护与演化、新项目的立项决策。

**边界**：
- 不包含产品需求判断（→ `product`）
- 不包含技术决策（→ `architecture`）
- 不包含任务派发（→ `dispatch`）
- 只覆盖"如何让方法论本身运转"层面的事

**典型工作**：改 hact-method 自身（skeleton / specs / templates / BRIEF / STATUS 等）、起新项目、按需调整流程规则。

---

### `product`

**范围**：产品需求与用户视角验证——用户故事、PRD 写作、acceptance criteria 制定、人工测试判断。

**边界**：
- 不包含技术实现取舍（→ `architecture`）
- 不包含代码（→ `dev-frontend` / `dev-backend`）
- 不替架构师决定接口结构

**典型工作**：起草和修订 PRD、跑人工测试（manual-test）验证系统是否符合 PRD 描述。

---

### `architecture`

**范围**：技术架构与编码规范——TRD（接口/数据结构设计）、shared/frontend/backend standards 写作。

**边界**：
- 不包含具体业务逻辑实现（→ `dev-*`）
- 不包含任务协调（→ `dispatch`）
- 不写代码、不审 PR

**典型工作**：起草和修订 TRD、写本期 standards、修订 standards、设计接口边界。

---

### `dispatch`

**范围**：任务派发与协调——sprint 拆解、依赖管理、queue 管理、新任务包装。

**边界**：
- 不包含代码审查（→ `review`）
- 不包含测试设计（→ `integration-testing`）
- 不包含技术设计（→ `architecture`）
- 只覆盖"任务如何被组织、被分发"层面的事

**典型工作**：规划 sprint 拆出 dev 任务、把 BUG/优化包装成新任务入队列。

---

### `review`

**范围**：代码审查——读 PR、按 standards 评判代码质量、给反馈或批准。

**边界**：
- 不包含写代码（→ `dev-*`）
- 不包含派任务（→ `dispatch`）
- 不包含设计审查（PRD / TRD 的审查在 draft 时即时发生，不另开 review 任务）
- 只是审视和判断（不动笔写新代码）

**典型工作**：拉 code-review 任务，读 PR，对照 standards 写 CR 反馈或批准合并。

---

### `integration-testing`

**范围**：联调测试设计与脚本编写——识别测试场景、写 pinchtab/curl 脚本、跑测试、把发现的问题转修复任务。

**边界**：
- 不包含单元测试（在 `develop` spec 内由开发者自做）
- 不包含人工验收（→ `product`）
- 专注端到端联调

**典型工作**：拉 generate-integration-tests，基于 PRD/TRD 设计测试场景，写脚本，跑测试，把失败转 `develop(source=integration)`。

---

### `dev-frontend`

**范围**：前端开发——Vue 组件实现、视觉规格落地、前端单元测试、pinchtab 等浏览器侧。

**边界**：
- 不包含后端 API 设计（→ `architecture`）
- 不包含联调测试设计（→ `integration-testing`）
- 不审 PR（→ `review`）

**典型工作**：拉 `develop(layer=frontend)` 任务，按 `standards-frontend.md` 写 Vue 代码，推 PR。

---

### `dev-backend`

**范围**：后端开发——NestJS 控制器/服务实现、数据库交互、API 实现、后端单元测试。

**边界**：
- 不包含前端 UI（→ `dev-frontend`）
- 不包含 API 设计（→ `architecture`）
- 不审 PR（→ `review`）

**典型工作**：拉 `develop(layer=backend)` 任务，按 `standards-backend.md` 写代码，推 PR。

---

### `deploy`

**范围**：部署运维——nginx 配置、PM2 进程管理、SSH 操作、build pipeline 验收。

**边界**：
- 不包含代码本身（→ `dev-*`）
- 不包含基础架构决策（→ `architecture`）
- 专注"把代码部署到服务器并跑起来"

**典型工作**：拉 `deploy` 任务，本地 build 验证，推服务器，重启服务，验收成功。

---

## 关于 schema 派生 discipline 的两个特例

某些 task 的 discipline 不固定，由 task 的属性决定（详见 `04-task-catalog.md`）：

| task | 派生维度 | 取值 |
|---|---|---|
| `develop` | `layer` | `frontend` → `dev-frontend` / `backend` → `dev-backend` |
| `revise-doc` | `target` | `prd` → `product` / `trd` → `architecture` / `standards` → `architecture` |

实施上：task 创建时把派生结果写到 denormalized 字段 `task.discipline`，下游查询直接读字段，无运行时计算开销。

---

## 边界（不在本文档讲）

| 你想知道 | 去哪个文档 |
|---|---|
| 每个 task 挂哪个 discipline | `04-task-catalog.md` |
| 拉取规则 / 权限模型 | `01-identity.md` §3 |
| 任务的状态枚举与流转 | `05-state-machine.md` |
| Gate 和迭代的关系 | `06-gates.md` |
| 哪个工作区做哪类任务 | `02-workspaces.md` |
