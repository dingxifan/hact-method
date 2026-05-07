# AI 与人协作工作方法 v2 · hact-method

## 项目层
@BRIEF.md
@STATUS.md

## 文件规范（覆盖 file-organizer skill）
本项目是管理项目（方法论研发 + 新项目编排），不是软件开发项目。
文件存放以本目录结构为准：

项目根目录只允许：
- CLAUDE.md / BRIEF.md / STATUS.md
- skeleton/、specs-structural/、specs-execution/（方法论核心文档）
- projects/、templates/（项目编排）
- _meta/（研发过程产物：input/、plans/、.current_plan 及历史迭代文档）

`projects/` 子结构（迭代一等公民）：
- `projects/{项目}/` 根目录：跨迭代产物（project / decisions / design / reusables / backlog / feedback / b-tasks）
- `projects/{项目}/iterations/vN/`：迭代内产物（prd / trd / iteration Gate 状态 / standards / sprint）

_meta/plans/ 目录由 planning-with-files-zh skill 自动管理：
_meta/plans/YYYY-MM-DD-[阶段名]/
├── task_plan.md    # 当前阶段任务拆解和进度
├── findings.md     # 分析发现和洞察沉淀（按需创建）
└── progress.md     # 会话日志，用于跨会话接续

## 跨会话接续规则
每次打开项目时：
1. 读取 _meta/.current_plan 获取当前阶段目录
2. 读取该目录下的 task_plan.md / findings.md / progress.md
3. 接续上次工作状态，不要重新开始

## 技能覆盖声明
- **file-organizer skill 不适用**：目录结构以本 CLAUDE.md 定义为准
- **brainstorming skill 不适用**：项目内的分析讨论即为 brainstorming 阶段
- **planning-with-files-zh skill 适用**：_meta/plans/ 目录由该 skill 管理

## 当前阶段：第一阶段·搭骨架

新方法论摒弃了"角色扮演"模式，采用"任务驱动"——用户登录系统/CC 都是自己的身份，task.type 决定加载哪份规范。规范是任务的工具书，不是身份的定义。

第一阶段产出：在 `skeleton/` 下完成方法论骨架（用户身份模型 / 角色清单 / 工作区定义 / 任务全谱 / 状态机 / Gate 与子阶段定义）。

骨架完成后进入第二阶段（写结构层规范），再进入第三阶段（开发首个应用 hact-app）。

## 与 human-ai-col 的关系
- `../human-ai-col/` 是 v1 方法论仓库，已冻结，仅维护存量项目（simple-auth 等）
- 本仓的设计依据：`../human-ai-col/_meta/plans/2026-05-06-method-optimization/`（重构讨论原稿留旧仓，不搬迁）

---

## 参考材料
`_meta/input/` 目录预留给本仓未来沉淀的输入材料（v1 方法论的输入材料留在旧仓）。
