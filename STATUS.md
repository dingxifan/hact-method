# STATUS.md — hact-method

## 当前状态
- 当前阶段：第一阶段·搭骨架
- 当前子阶段：仓库初始化完成，准备列骨架文档清单
- 整体进度：刚启动
- 上次更新：2026-05-07

## 本阶段进展
- 仓库初始化（2026-05-07）：目录结构 + 三件套 + 第一个 plan + git init

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
列骨架文档清单：每份 = 一个文件名 + 一句话目的 + 大纲。列完后跟用户对一遍再开写。

---

## 历史里程碑

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
