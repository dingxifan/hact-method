# 会话日志 · hact-method 骨架搭建

## 2026-05-07 仓库初始化

**前置**：human-ai-col `_meta/plans/2026-05-06-method-optimization/` 完成方法论重构讨论，决定独立建仓而非在原仓内并行。

**完成内容**：
- 新仓 `E:\group-code\hact-method\` 创建并 `git init`
- 写入 CLAUDE.md / BRIEF.md / STATUS.md
- 8 个顶级目录骨架（skeleton/ specs-structural/ specs-execution/ product/ tech/ projects/ templates/ _meta/）已建（用 .gitkeep 占位）
- 本 plan 创建，`_meta/.current_plan` 指向本目录
- 旧仓 STATUS.md 加冻结声明，旧仓本期 plan 加收尾日志

**下次起点**：列骨架文档清单（任务 0），跟用户对一遍后开始写。

**关键决策（不要绕回）**：见 BRIEF.md 关键设计决策清单。

---

## 2026-05-07 目录结构调整（仓库初始化后立即调整）

**触发**：用户问"product / tech / projects 三个目录的用途是什么"——戳到一个直接搬 v1 时没仔细想的点。

**问题**：BRIEF.md 沿用的 product/ tech/ projects/ 三分目录是 v1 角色风结构，跟 v2 任务驱动模型有冲突——product/ 命名隐含"产品助手固定工作区"，但 v2 没有这个角色概念。

**决定**：选项 C（迭代一等公民）
- 取消 product/ 和 tech/
- 项目编排切法：`projects/{项目}/iterations/vN/` 装迭代内产物，跨迭代产物（decisions / reusables / design / backlog / feedback / b-tasks）留项目根
- 决策动机：未来 hact-app 数据模型是 projects → iterations → sprints/tasks，目录跟 schema 同构，写规范和写代码命名摩擦最小

**改动文件**：
- 删除 product/ tech/ 两个空目录
- BRIEF.md：关键设计决策 #17 加入
- CLAUDE.md：项目根目录规则 + projects/ 子结构说明
- STATUS.md：已决策 + 历史里程碑（新增"目录结构调整"条）

**下次起点不变**：任务 0（列骨架文档清单）。
