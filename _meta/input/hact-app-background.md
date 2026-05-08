# hact-app 产品背景 · PRD 阶段输入材料

> 本文件供 `draft-prd-vN` 会话启动时加载，帮助产品助手快速建立上下文。
> 不需要重新解释这些内容——直接在此基础上展开 PRD。

---

## 一、产品定位

**hact-app 是 hact-method v2 方法论的配套 Web 应用。**

一句话：**CC 负责思考与判断，hact-app 负责状态展示与人类操作收集。**

服务对象：
- **管理者（1人）**：跨项目可见性，跟进多个并行项目的 Gate 进度
- **开发者（3–8人）**：查看任务包、更新状态、提交完成报告
- **CC（作为 API 写入方）**：通过 REST API 写入所有流程状态数据

---

## 二、v1 已验证的功能（继承基线）

v1（2026-05-06 完成，5 Gate 全签）已实现并上线：

| 功能 | 描述 | v2 处理意见 |
|------|------|------------|
| F1 项目总览 | 跨项目状态、Gate 进度、Sprint 完成比例 | 继承，按新数据模型调整 |
| F2 迭代管理 | Gate 时间线、PRD/TRD 只读抽屉、多期并行 | 继承 |
| F3 Sprint 任务看板 | 任务列表、依赖可视化、阻断高亮 | 继承，状态字段按 v2 重构 |
| F4 开发者工作台 | 任务包查看、状态机、完成报告提交 | **重点重构**——v2 改为拉取模式 |
| F5 质审界面 | CR 结论只读展示 | 继承 |
| F6 联调测试清单 | ≤15 条，5s 轮询 | 继承 |
| F7 CC API | `/api/cc/*` 全套写入接口 | 继承但接口语义需调整（见第四节）|
| F8 身份与权限 | manager / developer 两角色 + CC token | **重构**——v2 用 discipline 模型替代 role |

**v1 明确不做（仍然不做）**：通知/推送、Gitee Webhook、Web 端 Gate 签署、用户管理界面、移动端专项适配、Web 内置 AI。

---

## 三、v2 的根本变化（驱动 PRD 重新设计的原因）

v1 是**角色扮演模型**：用户登录后系统根据 `user.role`（manager / developer）决定能看什么、能做什么。CC 扮演 devmgr 角色写数据。

v2 是**任务驱动模型**：用户登录就是自己，系统根据 `task.type` 决定加载哪份规范；用户能拉取哪类任务，由 `user_disciplines`（授权的 discipline 集合）决定，与角色无关。

| 维度 | v1 | v2 |
|------|----|----|
| 权限模型 | `user.role`（manager / developer） | `user_disciplines` junction 表 |
| 任务归属 | devmgr 推送（CC 写 assigned_to） | 开发者拉取（queue 中自取） |
| F4 工作台 | devmgr 派发后才出现任务 | 开发者主动从 queue 拾取 [可取] 任务 |
| CC 写入语义 | CC 作为 devmgr 角色操作 | CC 写入接口不绑定角色，语义反转为"状态推进" |
| 任务状态 | 多态（waiting / in_progress / blocked…） | 4 状态：`可取` / `taken-by` / `done` / `merged` |
| Gate | 独立表 + 签署操作 | 聚合视图（由关联 task 集合状态自动推断） |
| B 类任务 | 走简化 4 关流程 | 无 Gate，走 dispatch 入口直接派发 |

---

## 四、v2 数据模型核心约束（已决策，不在 PRD 讨论）

这些是从 hact-method v2 骨架推导出的 schema 约束，PRD 和 TRD 需要在此基础上展开：

**数据层级**：`projects → iterations → tasks`（sprint 作为 iteration 的派生视图，不是独立实体）

**task 核心字段**：
- `type`：12 种（develop / code-review / draft-prd-vN / draft-tech-design / plan-sprint / revise-doc / dispatch-new / generate-integration-tests / manual-test / deploy / wrap-up-iteration / init-project）
- `discipline`：9 种（management / product / architecture / dispatch / review / integration-testing / dev-frontend / dev-backend / deploy）
- `status`：4 种（可取 / taken-by / done / merged）
- `layer`：frontend / backend / shared / null
- `source`：sprint / integration / manual-test / bug / optimization
- `urgency`：normal / hotfix

**user-discipline 关联**：
- 废弃 `user.role` 字段
- 新增 `user_disciplines(user_id, discipline_id)` junction 表
- 拉取准入：`task.discipline ∈ user.disciplines`

**Gate 聚合视图**（不再是独立记录）：
- G1 = draft-prd-vN [done]
- G2 = draft-tech-design [done]
- G3 = plan-sprint [done]
- G4 = manual-test [done]
- G5 = wrap-up-iteration [done]

---

## 五、已有技术栈（v2 继续复用）

```
前端：Vue 3.5 + TypeScript 5.9 + Vite + Element Plus 2.13 + Pinia 3.0 + Vue Router 4.6 + SCSS
后端：NestJS 10.3 + TypeScript 5.7 + TypeORM 0.3 + MySQL2 3.19（utf8mb4）+ JWT/Passport
部署：Nginx + PM2，服务器自部署
```

---

## 六、v1 视觉规格（v2 继承）

- 主色：竹绿 `#67B279`，风格参考 Todoist 简约
- 间距：8px 网格系统（xs=4 / sm=8 / md=16 / lg=24 / xl=32 / xxl=48），禁用列表外数值
- 响应式断点：`900px`，< 900px 显示底部 Tab
- 触控最小 44×44px

---

## 七、v1 可复用代码资产（开发阶段参考）

v1 已落地 21 项可复用资产（前端 9 + 后端 6 + 共享模式 6），详见 `E:\aicoder\projects\hact\reusables.md`。
主要包括：GateTimeline 组件、StatusTag 组件、MarkdownViewer 组件、usePolling composable、全局异常过滤器、标准 CRUD 服务模式等。

---

## 八、PRD 需要重点决策的问题

以下是 v1 → v2 迁移中**尚未决策**、需要在 PRD 阶段明确的问题：

1. **queue 展示方式**：v2 开发者拉取模式下，Web 端如何展示 queue（全局可见 vs 个人筛选 vs discipline 筛选）？
2. **discipline 授权 UI**：管理员如何给用户授权 discipline（Web 界面 vs 仅通过 CC API）？
3. **Gate 聚合视图**：Gate 不再是独立记录，F2 迭代管理的 Gate 时间线如何从 task 状态聚合展示？
4. **B 类任务入口**：dispatch-new（B 类派发）是否在 Web 端有对应操作入口，还是仍由 CC API 写入？
5. **任务 type 可见性**：12 种 task type 是否全部在 Web 端展示？还是只展示开发者关心的子集？
