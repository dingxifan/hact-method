# AI 与人协作工作方法 v2 · hact-method

## 项目层
@BRIEF.md
@STATUS.md

## 文件规范（覆盖 file-organizer skill）
本仓是纯方法论仓库，只存放方法论文档和模板，不包含任何具体项目内容。
文件存放以本目录结构为准：

项目根目录只允许：
- CLAUDE.md / BRIEF.md / STATUS.md
- skeleton/、specs-structural/、specs-execution/（方法论核心文档）
- templates/（可复用模板）
- _meta/（研发过程产物：input/、plans/、.current_plan 及历史迭代文档）

**项目内容不存放在本仓**——每个项目是独立仓库，代码与协调文件（PRD/TRD/任务包/Gate等）合并存放在项目仓根目录下。本仓模板和规范被项目仓引用，但不拥有项目数据。

_meta/plans/ 目录由 planning-with-files-zh skill 自动管理：
_meta/plans/YYYY-MM-DD-[阶段名]/
├── task_plan.md    # 当前阶段任务拆解和进度
├── findings.md     # 分析发现和洞察沉淀（按需创建）
└── progress.md     # 会话日志，用于跨会话接续

## 工作区使用指南

**本仓（hact-method）是所有任务的规范来源，但不是所有任务的执行位置。**

### 何时在本仓开 CC 会话

| 场景 | 说明 |
|------|------|
| 立项新项目（`init-project`） | 在本仓执行，用 Bash 创建 `E:\group-code\{project-name}\` |
| 方法论调整（修改 skeleton / specs / templates） | 在本仓执行，直接编辑方法论文件。信息来源见下方「方法论调整信息来源」 |
| 跨项目浏览 / 对比 | 在本仓执行 |

### 方法论调整信息来源

做方法论调整时，CC 必须先读以下来源，再动手修改规范：

| 来源 | 路径 | 说明 |
|------|------|------|
| 待议清单 | `_meta/plans/方法论待议.md` | 各项目 wrap-up 分流后汇聚的待议条目，是主要输入 |
| 用户当场描述 | 对话内容 | 用户直接说明要改什么、为什么 |

不主动读各项目仓的 `feedback.md`——项目 feedback 应已在 wrap-up 阶段分流到待议清单，若用户认为有遗漏可手动指向。

### 何时在项目仓开 CC 会话

项目仓创建后，**以下所有任务都在项目仓（`E:\group-code\{project-name}\`）中执行**：

| 任务 | 说明 |
|------|------|
| `draft-prd-vN` / `draft-tech-design` / `plan-sprint` | 写 PRD、TRD、规划 sprint，产物存入项目仓 |
| Gate 签署（G1–G5） | 在项目仓的 `iterations/vN/gates.md` 写入 |
| `develop` / `code-review` | 写代码、审查，在项目仓操作 |
| `dispatch-new` / `generate-integration-tests` / `manual-test` / `deploy` | 全部在项目仓执行 |
| `wrap-up-iteration` / `revise-doc` | 迭代收尾和文档修订，在项目仓执行 |

### 项目仓结构（init-project 创建）

```
E:\group-code\{project-name}\
├── [代码文件]               ← 前后端代码
├── iterations/
│   └── vN/
│       ├── prd.md
│       ├── trd.md
│       ├── standards-shared.md
│       ├── standards-frontend.md
│       ├── standards-backend.md
│       ├── gates.md
│       └── queue/               ← 任务包（该迭代）
│           └── done/
├── project.md               ← 跨迭代项目快照
├── decisions.md             ← 架构决策记录
├── design.md                ← 视觉规格
├── reusables.md             ← 可复用资产
├── backlog.md               ← 积压与偏离
├── feedback.md              ← 各阶段反馈
├── b-tasks.md               ← B 类任务总账
├── deployment.config        ← 首次部署时创建
└── deploy-log.md            ← 部署记录
```

### 加载规范的方式

项目仓 CLAUDE.md 中用 `@` 引用 hact-method 的规范：
```
@../hact-method/specs-execution/{task-type}.md
```

---

## 跨会话接续规则
每次打开本仓时：
1. 读取 _meta/.current_plan 获取当前阶段目录
2. 读取该目录下的 task_plan.md / findings.md / progress.md
3. 接续上次工作状态，不要重新开始

## 技能覆盖声明
- **file-organizer skill 不适用**：目录结构以本 CLAUDE.md 定义为准
- **brainstorming skill 不适用**：项目内的分析讨论即为 brainstorming 阶段
- **planning-with-files-zh skill 适用**：_meta/plans/ 目录由该 skill 管理

## 当前阶段：第三阶段·开发 hact-app

- 第一阶段（搭骨架）✅：skeleton/ 下 6 份骨架文档
- 第二阶段（结构层规范）✅：specs-structural/ 下 12 份任务契约 + specs-execution/ 下 5 份主线执行规范
- 第三阶段（开发 hact-app）进行中：用本方法论走完 PRD→TRD→sprint→develop 完整流程，开发 hact-app 看板应用

## 与 human-ai-col 的关系
- `../human-ai-col/` 是 v1 方法论仓库，已冻结，仅维护存量项目（simple-auth 等）
- 本仓的设计依据：`../human-ai-col/_meta/plans/2026-05-06-method-optimization/`（重构讨论原稿留旧仓，不搬迁）

---

## 参考材料
`_meta/input/` 目录预留给本仓未来沉淀的输入材料（v1 方法论的输入材料留在旧仓）。
