# STATUS.md — hact-method

## 当前状态
- 当前阶段：**第一阶段·搭骨架 完成**（2026-05-07）
- 下一阶段：第二阶段·结构层规范（待启动）
- 整体进度：第一阶段完成；BRIEF.md 关键设计决策已敲定 20 条
- 上次更新：2026-05-07

## 本阶段进展
- 仓库初始化（2026-05-07）：目录结构 + 三件套 + 第一个 plan + git init
- 目录结构调整：取消 product/ tech/，改为"迭代一等公民"切法（projects/{项目}/iterations/vN/）
- 骨架 7 文档完成：01-identity / 02-workspaces / 03-disciplines / 04-task-catalog / 05-state-machine / 06-gates / README
- 骨架自检通过：8 完成标志覆盖 + 跨文档互引一致性 + 概念一致性 全部 ✅
- 第一阶段产物：`skeleton/`（含 7 份文档）+ BRIEF.md 决策清单（20 条）+ CLAUDE.md / STATUS.md 三件套

## 已知风险

| 风险 | 可能性 | 影响 | 应对 |
|------|--------|------|------|
| 骨架写完发现某个 task.type 漏掉，回头补 | 中 | 中 | skeleton/ 完成后做一次"任务全谱"自检 |
| 与旧仓双向反复参考，两份文档语义滑移 | 低 | 中 | 设计依据只读旧仓 _meta/plans/，不读 roles/ templates/ docs/ |
| 第一个应用 hact-app 开发期间发现骨架有结构性缺陷 | 中 | 高 | 接受这种情况发生；hact-app 即压力测试 |

## 悬而未决
（无）

## 已决策
- **新建独立仓库 hact-method**（vs 在 human-ai-col 内并行）：物理隔离，避免新旧混淆（2026-05-07）
- **目录基底**：skeleton/ + specs-structural/ + specs-execution/ + projects/ + templates/ + _meta/
- **项目编排切法**：迭代一等公民——`projects/{项目}/iterations/vN/` 装迭代内产物，跨迭代产物（decisions / reusables / design / backlog / feedback / b-tasks）留项目根（2026-05-07，取消 v1 沿用的 product/ tech/ 角色风目录）
- **第一个应用**：hact-app（v1 看板的精神继承），将作为方法论的首个落地实例
- **gitee 远端**：本地先跑，待 skeleton/ 稳定再推

## 下一个决策点
启动第二阶段·结构层规范——为 12 个 task type 各写一份 `specs-structural/{task}.md`，覆盖 skeleton/04 之外的边界场景、错误处理、字段细节。建议优先级：高频 task（develop / code-review）先于低频 task（init-project / wrap-up-iteration）。

---

## 历史里程碑

### 2026-05-07 第一阶段·搭骨架 完成
- **骨架 7 文档** 全部就位：01-identity（身份模型）/ 02-workspaces（三工作区）/ 03-disciplines（9 discipline + CC 上下文管理）/ 04-task-catalog（12 task 完整字段）/ 05-state-machine（4 状态简化版 + 异常转移）/ 06-gates（5 Gate + 子状态聚合）/ README.md
- **BRIEF.md 决策清单** 累积到 20 条（核心：摒弃角色身份模型、任务驱动、用户唯一身份、path X 单 discipline、Gate 签字合并到前置 task、异常转移单一机制等）
- **骨架自检** 通过（8 完成标志 / 跨文档互引一致性 / 概念一致性 全部 ✅；自检中发现并修复 1 处不一致——04 wrap-up 前置条件）
- **关键模型决策**：
  - 用户 = 唯一身份载体；权限通过 user-discipline 关联表达
  - 9 discipline = 任务知识的聚类（含 management / product / architecture / dispatch / review / integration-testing / dev-frontend / dev-backend / deploy）
  - 12 task type = 全部任务的清单（生命周期段：父级 / A 类·准备 / 跨段 / A 类·开发循环 / A 类·收尾 / B 类入口）
  - 4 状态 = 可取 / taken-by / done / merged
  - 5 Gate 签字合并到对应前置 task

### 2026-05-07 目录结构调整
- 发现沿用 v1 的 product/ tech/ projects/ 三分结构跟 v2 任务驱动模型冲突（product/ 命名隐含"产品助手固定工作区"，但 v2 没有这个角色）
- 改为"迭代一等公民"切法：取消 product/ tech/，编排产物全部进 `projects/{项目}/`，迭代内产物入 `iterations/vN/` 子目录
- 决策动机：未来 hact-app 数据模型是 projects → iterations → sprints/tasks，目录跟 schema 同构，命名摩擦最小
- BRIEF.md 关键设计决策加 #17

### 2026-05-07 仓库初始化
- 在 `E:\group-code\hact-method\` 新建仓库（与 human-ai-col 同级、独立 git 仓）
- 写入 CLAUDE.md / BRIEF.md / STATUS.md 三件套
- 建好目录骨架（8 个顶级目录）
- 创建第一个 plan：`_meta/plans/2026-05-07-skeleton-build/`
- 设计依据：human-ai-col `_meta/plans/2026-05-06-method-optimization/`（讨论原稿留旧仓不搬迁）
