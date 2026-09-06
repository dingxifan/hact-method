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
- guide/（面向新用户的入口引导文档，非规范本身，索引/摘要性质）
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
| 立项新项目（`init-project`） | 在本仓执行，用 Bash 创建 `../{project-name}/` |
| 方法论调整（修改 skeleton / specs / templates） | 在本仓执行，直接编辑方法论文件。信息来源见下方「方法论调整信息来源」 |
| 收割个人积累上提（`harvest-notes`） | 在本仓执行，遍历成员 notes 仓只读收割，去重择优写入公共层（templates/standards、templates/checklists、方法论待议） |
| 跨项目浏览 / 对比 | 在本仓执行 |

> 第三个工作区「个人积累（hact-notes）」是开发者私有仓，不在本仓、也不在项目仓——见 `skeleton/02-workspaces.md` §4。

### 方法论调整信息来源

做方法论调整时，CC 必须先读以下来源，再动手修改规范：

| 来源 | 路径 | 说明 |
|------|------|------|
| 待议清单 | `_meta/plans/方法论待议.md` | 经 `harvest-notes` 从成员个人 notes 收割上提的方法论条目，是主要输入 |
| 用户当场描述 | 对话内容 | 用户直接说明要改什么、为什么 |

不主动读各项目仓的 `feedback.md` 或成员个人 notes——方法论类问题应已经 wrap-up 分流（A 类）/ develop 就地分流（B 类）写入成员 notes，再由 `harvest-notes` 上提到待议清单。若用户认为有遗漏可手动指向。**推荐顺序：先跑 `harvest-notes` 收割，再开方法论调整会话。**

### 方法论文件写作纪律（受众分离）

`specs-execution/`、`skeleton/06 §7`、`specs-structural/` 是**运行时被 CC 逐字消费**的文本，写作时按受众分离：

- **正文只写**：做什么 + 必要的一句操作性 why（帮助遵循的短理由）+ `决策#N` 短指针（指 BRIEF，不展开叙事）+ 设计沉淀路径指针（一行）
- **不入正文**：日期出处（"守 2026-06-16"）、退役机制对照（"砍除 X 后"）、迁移注记（"原 Step X 已并入"）、事故代号、内部计划代号（"子计划 3c""sub7"）——这些的 canonical 记录住 BRIEF 决策 / `_meta/status-history.md` / `_meta/plans/` 设计稿，git 历史可追溯，**不在运行时文本里复述**
- 每轮方法论调整收尾时自查：本轮往上述文件新增的文字里有没有混进历史注解
- **一律相对路径，禁盘符**：本方法多人共用，各人工作区根不同（盘符、目录名都不一样），写死绝对路径在别人机器上即失效，且不报错——只让 CC 找不到文件后自行发挥。约定见 `skeleton/02-workspaces.md` §目录约定；`scripts/check-paths.js` 机械把关，已接进本仓 pre-commit 门卫。历史档（`_meta/`）与 `STATUS.md` 不在此列——它们记录既成事实，写具体路径是对的

### 跨仓基础设施改动：一律用临时 worktree，永不碰目标仓主工作树

给多个项目仓分发仓级设施（门卫脚本、`connections.yml`、`deployment.config`、检查器）时，**不得在目标仓的主工作树里 `git add` / `commit` / `checkout` / `stash`**。正确做法：

```bash
git -C {项目仓} worktree add {临时目录} master   # 或 main
# 在临时工作树里改文件、提交、推送
git -C {项目仓} worktree remove {临时目录}
```

**为什么必须这样**（2026-08-30 实测，六仓分发时三仓同时中招）：

1. **落点会错**。项目仓常有别的会话在跑 `develop`、检出在任务分支上。「就地提交」会把仓级设施提交到那条任务分支——随该任务的 PR 并进 master，污染交付 diff 与偏离核查。
2. **更严重的是冲掉在制品**。共用工作树时对方可能有执行 subagent 正在改文件，`checkout` / `stash` / `add -A` 会毁掉尚未 commit 的工作，**而且不会有任何 git 报错**。
3. 临时 worktree 同时解决这两件事；只把落点「显式指定 master」不够——那仍然要动别人的工作树。

分发前先 `ListAgents` 看目标仓有没有活跃会话；有则先打招呼再动手。分发本身**必须合并而非覆盖**（见 `specs-execution/init-project.md` Step 4.1 的警告）——项目仓会在门卫里加自有检查。

### 何时在项目仓开 CC 会话

项目仓创建后，**以下所有任务都在项目仓（`../{project-name}/`）中执行**：

| 任务 | 说明 |
|------|------|
| `draft-prd-vN` / `draft-tech-design` / `plan-sprint` | 写 PRD、TRD、规划 sprint，产物存入项目仓 |
| Gate 签署（G1–G5） | 在项目仓的 `iterations/vN/gates.md` 写入 |
| `develop` | 写代码、内置独立审查、推 PR 并自合并到 master，在项目仓操作 |
| `dispatch-new` / `generate-integration-tests` / `manual-test` / `deploy` | 全部在项目仓执行 |
| `wrap-up-iteration` / `revise-doc` | 迭代收尾和文档修订，在项目仓执行 |

### 项目仓结构（init-project 创建）

```
../{project-name}/
├── [代码文件]               ← 前后端代码
├── iterations/
│   └── vN/
│       ├── prd.md
│       ├── trd.md
│       ├── gates.md
│       └── queue/               ← 任务包（该迭代）
│           └── done/
├── status.yml               ← 机器侧状态契约（项目级单文件，check-sprint.js / check-gate.js 取数源，init-project 建，见 skeleton/07）
├── project.md               ← 跨迭代项目快照
├── decisions.md             ← 架构决策记录
├── design.md                ← 视觉规格
├── standards-shared.md      ← 跨层稳定默认规则（项目级当前态；按 applies-if/id 增量加载）
├── standards-frontend.md    ← 前端编码规范（同上）
├── standards-backend.md     ← 后端编码规范（同上，含测试框架约定）
├── reusables.md             ← 可复用资产
├── backlog.md               ← 积压与偏离
├── feedback.md              ← 各阶段反馈
├── b-tasks.md               ← B 类任务总账
├── connections.yml          ← 外部连接登记（Gitee/SSH/DB/第三方 API）：入库·零机密，机密只写 ${secret:NAME}，真值在机器本地 ~/.hact/secrets.env
├── deployment.config        ← 构建/重启/健康检查命令，首次部署时创建（服务器坐标归 connections.yml）
└── deploy-log.md            ← 部署记录
```

### 加载规范的方式

项目仓 CLAUDE.md 中用 `@` 引用 hact-method 的规范：
```
@../hact-method-lab/specs-execution/{task-type}.md
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

## 当前阶段：第三阶段·写执行层规范（边用边补）+ 第四阶段·团队引入（进行中）

- 第一阶段（搭骨架）✅：skeleton/ 下 7 份骨架文档
- 第二阶段（结构层规范）✅：specs-structural/ 下任务契约 + specs-execution/ 下执行规范
- 第三阶段（执行层规范）🔄：由真实项目（mail-ai / doc-extract / file-extract / JHH-Nortion 等）边用边补
- 第四阶段（团队引入）🔄：8 名成员已有 hact-method-lab 开发者权限；完成标志是至少一名开发者独立跑通一个 task 全流程

## 与 human-ai-col 的关系
- `../human-ai-col/` 是 v1 方法论仓库，已冻结，仅维护存量项目（simple-auth 等）
- 本仓的设计依据：`../human-ai-col/_meta/plans/2026-05-06-method-optimization/`（重构讨论原稿留旧仓，不搬迁）

---

## 参考材料
`_meta/input/` 目录预留给本仓未来沉淀的输入材料（v1 方法论的输入材料留在旧仓）。
