# hact-solo 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `E:\group-code\hact-solo\` 创建完整、独立、可立即使用的个人版 AI 协作开发方法论，从 hact-method 团队版塌缩而来。

**Architecture:** 精简三层结构（guide/ + specs/ + templates/），去掉骨架层和结构层，specs/ 扁平化，Gate 从 5 个合并为 3 个（GA/GB/GC），直接 commit 代替 PR/CR 工作流。

**Source Reference:** 所有 spec 从 `E:\group-code\hact-method\specs-execution\` 对应文件改写而来，设计决策见 `E:\group-code\hact-method\_meta\plans\2026-05-12-hact-solo\design.md`。

**Cross-session Resume:** 检查哪些文件已存在来判断断点，从第一个未创建的文件继续。

---

## 文件清单（29 个文件）

```
hact-solo/
├── CLAUDE.md                                    Task 1
├── BRIEF.md                                     Task 1
├── STATUS.md                                    Task 1
├── guide/
│   ├── 00-核心概念.md                            Task 2
│   ├── 01-启动新项目.md                          Task 2
│   └── 02-典型流程.md                            Task 2
├── specs/
│   ├── init-project.md                          Task 3
│   ├── draft-prd.md                             Task 3
│   ├── draft-tech-design.md                     Task 3
│   ├── plan-sprint.md                           Task 4
│   ├── develop.md                               Task 5
│   ├── generate-integration-tests.md            Task 6
│   ├── manual-test.md                           Task 6
│   ├── deploy.md                                Task 6
│   └── wrap-up.md                               Task 6
└── templates/
    ├── CLAUDE.md                                Task 7
    ├── project.md                               Task 7
    ├── decisions.md                             Task 7
    ├── reusables.md                             Task 7
    ├── backlog.md                               Task 7
    ├── b-tasks.md                               Task 7
    ├── feedback.md                              Task 7
    ├── standards/
    │   ├── shared.md                            Task 8
    │   ├── frontend.md                          Task 8
    │   └── backend.md                           Task 8
    ├── checklists/
    │   ├── frontend-checklist.md               Task 8
    │   └── backend-checklist.md                Task 8
    └── iterations/
        ├── gates.md                             Task 8
        └── sprint.md                            Task 8
```

---

## Task 1：创建目录结构 + 根文件

**Files:**
- Create: `E:\group-code\hact-solo\` (目录)
- Create: `E:\group-code\hact-solo\CLAUDE.md`
- Create: `E:\group-code\hact-solo\BRIEF.md`
- Create: `E:\group-code\hact-solo\STATUS.md`
- Create: `E:\group-code\hact-solo\guide\`
- Create: `E:\group-code\hact-solo\specs\`
- Create: `E:\group-code\hact-solo\templates\standards\`
- Create: `E:\group-code\hact-solo\templates\checklists\`
- Create: `E:\group-code\hact-solo\templates\iterations\`

- [ ] **Step 1: 创建目录结构**

```powershell
mkdir "E:\group-code\hact-solo"
mkdir "E:\group-code\hact-solo\guide"
mkdir "E:\group-code\hact-solo\specs"
mkdir "E:\group-code\hact-solo\templates\standards"
mkdir "E:\group-code\hact-solo\templates\checklists"
mkdir "E:\group-code\hact-solo\templates\iterations"
cd "E:\group-code\hact-solo"
git init
```

- [ ] **Step 2: 写 `CLAUDE.md`（方法论区启动协议）**

内容如下：

```markdown
# hact-solo · 个人 AI 协作开发方法论

@BRIEF.md
@STATUS.md

## 文件规范
本仓是纯方法论仓库，只存放方法论文档和模板，不包含具体项目内容。

## 工作区使用指南

**本仓（hact-solo）是所有任务的规范来源，但不是所有任务的执行位置。**

### 何时在本仓开会话
| 场景 | 说明 |
|------|------|
| 立项新项目（`init-project`） | 在本仓执行，用 Bash 创建 `E:\group-code\{project-name}\` |
| 方法论调整（修改 specs / templates / guide） | 直接在本仓编辑 |

### 何时在项目仓开会话
项目仓创建后，所有项目任务都在项目仓执行：
`draft-prd` / `draft-tech-design` / `plan-sprint` / `develop` /
`generate-integration-tests` / `manual-test` / `deploy` / `wrap-up`

### 项目仓结构（init-project 创建）
见 `templates/CLAUDE.md`

### 加载规范的方式
项目仓 CLAUDE.md 中用 `@` 引用本仓规范：
```
@../hact-solo/specs/{task-type}.md
```

## 跨会话接续规则
每次打开本仓时：
1. 读 STATUS.md 获取当前状态
2. 接续上次工作状态

## 技能说明
- planning-with-files-zh skill 适用：跨会话计划管理
- brainstorming skill 适用：方法论调整前的设计讨论
```

- [ ] **Step 3: 写 `BRIEF.md`**

```markdown
# BRIEF.md — hact-solo（个人版 AI 协作工作方法）

## 背景
从 hact-method（团队版，5-8 人）塌缩而来的个人开发者版本。
保留核心质量保障机制，消除多人协调开销。

## 核心原则
- **保留**：任务驱动、文档先行（PRD→TRD→代码）、Gate 质检、checklist 自检、knowledge 积累
- **移除**：user-discipline 权限体系、hact-app、PR/CR 工作流、queue 认领机制
- **简化**：Gate 5→3（GA/GB/GC）、任务包字段 12→6、specs 扁平化

## 与 hact-method 的关系
- `../hact-method/`：团队版（5-8人），独立维护
- 本仓：个人版，不依赖 hact-method，完整自洽

## 8 个 Task Type
init-project / draft-prd / draft-tech-design / plan-sprint /
develop / generate-integration-tests / manual-test / deploy / wrap-up

## 3 个 Gate
- GA（文档关）：PRD + TRD + standards 就绪，签于 draft-tech-design 尾部
- GB（开发关）：sprint 拆解完成，签于 plan-sprint 尾部
- GC（收尾关）：验收通过 + 收尾完成，签于 wrap-up 尾部
```

- [ ] **Step 4: 写 `STATUS.md`**

```markdown
# STATUS.md — hact-solo

## 当前状态
- 当前阶段：方法论初始化
- 上次更新：2026-05-12

## 完成情况
| 文件组 | 状态 |
|--------|------|
| 根文件（CLAUDE/BRIEF/STATUS） | ✅ 完成 |
| guide/ | ⏸️ 未开始 |
| specs/ | ⏸️ 未开始 |
| templates/ | ⏸️ 未开始 |
```

- [ ] **Step 5: 初始 commit**

```bash
git add .
git commit -m "chore: hact-solo 初始化目录结构和根文件"
```

---

## Task 2：guide/ 三文件

**Files:**
- Create: `E:\group-code\hact-solo\guide\00-核心概念.md`
- Create: `E:\group-code\hact-solo\guide\01-启动新项目.md`
- Create: `E:\group-code\hact-solo\guide\02-典型流程.md`

- [ ] **Step 1: 写 `guide/00-核心概念.md`**

基于 `hact-method/guide/00-核心概念.md` 改写，去掉多人相关内容：

```markdown
# 核心概念：10 分钟读懂这套方法

## 一句话概括
**你在做什么比你是谁更重要。**
task.type 决定加载哪份规范——上午写 PRD，下午写代码，换的是任务，不是身份。

## 两个工作区
| 工作区 | 做什么 |
|---|---|
| **hact-solo**（方法论区） | 调整方法论、立新项目 |
| **项目根**（项目区） | 一切与具体项目相关的工作 |

## 8 个任务类型
| 阶段 | 任务 | 做什么 |
|---|---|---|
| 立项 | `init-project` | 创建项目目录 |
| 准备 | `draft-prd` | 写 PRD → GA 前 |
| 准备 | `draft-tech-design` | 写 TRD + standards → 签 GA |
| 准备 | `plan-sprint` | 拆任务包入 queue → 签 GB |
| 开发 | `develop` | 写代码 + 直接 commit |
| 开发 | `generate-integration-tests` | 写联调脚本 + 跑测试 |
| 验收 | `manual-test` | 人工验收对照 PRD |
| 收尾 | `deploy` | 部署到服务器 |
| 收尾 | `wrap-up` | 迭代收尾三步 → 签 GC |

## 3 个 Gate（质检点）
| Gate | 签于 | 确认什么 |
|---|---|---|
| GA | `draft-tech-design` 尾部 | PRD + TRD + standards 就绪 |
| GB | `plan-sprint` 尾部 | sprint 拆解完成，可以写代码 |
| GC | `wrap-up` 尾部 | 验收通过 + 收尾完成，本期关闭 |

签字格式（`iterations/vN/gates.md`）：
```
GA | 2026-05-12 | PRD + TRD 确认，standards 三份就绪
GB | 2026-05-13 | sprint 拆解完成，queue 8 个任务
GC | 2026-05-20 | 验收通过，收尾完成，v1 关闭
```

## A 类 vs B 类
| | A 类 | B 类 |
|---|---|---|
| 定义 | 正常迭代功能开发 | 线上 BUG 或功能优化 |
| 流程 | 走 3 个 Gate | 不走 Gate |
| 入口 | `draft-prd` | 直接写入 `b-tasks.md` → develop |

## 开始工作的正确姿势
1. 打开对应工作区目录，开新 CC 会话
2. 声明任务类型，CC 加载对应规范
3. 按规范完成任务，在末尾签或不签 Gate
4. 关闭会话；下次继续时重复步骤 1
```

- [ ] **Step 2: 写 `guide/01-启动新项目.md`**

```markdown
# 情境：启动新项目

## 前置
已安装：superpowers / pinchtab skill / simplify skill / SSH MCP（部署需要）

## 步骤

### 1. 在 hact-solo 工作区执行 init-project
打开 `E:\group-code\hact-solo\`，开新 CC 会话，声明 `init-project`。

CC 会创建：
```
E:\group-code\{project-name}\
├── iterations\v1\
│   ├── prd.md（占位）
│   ├── trd.md（占位）
│   ├── standards-shared.md
│   ├── standards-frontend.md
│   ├── standards-backend.md
│   ├── gates.md
│   └── queue\done\
├── project.md
├── decisions.md
├── reusables.md
├── backlog.md
├── feedback.md
├── b-tasks.md
└── CLAUDE.md（从 templates/CLAUDE.md 填充项目名）
```

### 2. 切换到项目仓
关闭当前会话，打开 `E:\group-code\{project-name}\`，开新会话。

### 3. 开始 draft-prd
声明 `draft-prd`，描述项目背景和本期目标。
```

- [ ] **Step 3: 写 `guide/02-典型流程.md`**

```markdown
# 情境：A 类主线——一期完整流程

## 全局流程

```
§1 编排阶段
  draft-prd ──────────────────┐
  draft-tech-design ──→ [GA]  │
  plan-sprint ──────→ [GB]    │
        ↓                     │
§2 开发循环                    │
  develop（直接 commit）        │
        ↓                     │
§3 联调与验收                  │
  generate-integration-tests  │
  manual-test                 │
        ↓                     │
§4 收尾部署（可并行）            │
  deploy                      │
  wrap-up ────────→ [GC] ─────┘
```

## § 1 编排阶段

### draft-prd → （无 Gate，直接继续）
写本期 PRD：用户故事 + 验收标准 + 业务约束。完成后直接进入 draft-tech-design。

### draft-tech-design → [GA]
写 TRD（接口 + 数据结构）+ 三份 standards。完成后询问是否签 GA。
**GA 签字 = PRD 和 TRD 一并确认。**

### plan-sprint → [GB]
从 TRD 拆任务包入 queue，生成 sprint.md。签 GB 后开始写代码。

## § 2 开发循环

声明 `develop`，读任务包，写代码，自检（checklist + build/lint），直接 commit。
无 PR，无 code-review 会话。自检通过即移入 queue/done/。

## § 3 联调与验收

**generate-integration-tests**：写 curl/pinchtab 脚本，跑测试，失败的直接 develop 修复。
**manual-test**：对照 PRD 验收标准人工验证，发现问题直接 develop 修复。

## § 4 收尾部署

deploy 和 wrap-up 可并行。wrap-up 三步收尾后签 GC，本期关闭。

## B 类（随时可发起）

发现 bug 或优化点 → `b-tasks.md` 加一行 → 开 develop 会话处理 → commit。
```

- [ ] **Step 4: commit**

```bash
git add guide/
git commit -m "docs: 添加 guide/ 三文件（核心概念 + 启动新项目 + 典型流程）"
```

---

## Task 3：specs/ 前期规范（init-project / draft-prd / draft-tech-design）

**Source:**
- `hact-method/specs-execution/init-project.md`
- `hact-method/specs-execution/draft-prd-vN.md`
- `hact-method/specs-execution/draft-tech-design.md`

**Files:**
- Create: `E:\group-code\hact-solo\specs\init-project.md`
- Create: `E:\group-code\hact-solo\specs\draft-prd.md`
- Create: `E:\group-code\hact-solo\specs\draft-tech-design.md`

- [ ] **Step 1: 读源文件**

读以下三个文件，理解原始内容：
- `E:\group-code\hact-method\specs-execution\init-project.md`
- `E:\group-code\hact-method\specs-execution\draft-prd-vN.md`
- `E:\group-code\hact-method\specs-execution\draft-tech-design.md`

- [ ] **Step 2: 写 `specs/init-project.md`**

从源文件改写，应用以下变化：
- 移除 `hact-app` API 调用（项目注册）
- 移除 `user_disciplines` 初始化
- 项目目录结构引用本仓 templates/（而不是 hact-method/templates/）
- 保留：目录创建逻辑、CLAUDE.md 填充（从 `../hact-solo/templates/CLAUDE.md` 拷贝并替换项目名）、git init

- [ ] **Step 3: 写 `specs/draft-prd.md`**

从源文件改写，应用以下变化：
- 文件名去掉版本号（`draft-prd` 而非 `draft-prd-vN`），文件内 `vN` 保留作迭代标识
- 移除会话末尾「要签 G1 吗？」→ 改为「PRD 完成，直接进入 draft-tech-design（两者连续完成后统一签 GA）」
- 移除 hact-app G1 同步
- 保留：PRD 框架起草、用户故事、AC 写作、疑点确认流程

- [ ] **Step 4: 写 `specs/draft-tech-design.md`**

从源文件改写，应用以下变化：
- GA 签字替换 G2 签字（格式：`GA | {日期} | {一句确认}`）
- GA 签字内涵扩展为"PRD + TRD + standards 三份均确认"（因为 G1 已合并入 GA）
- 移除 hact-app G2 同步
- 保留：TRD 起草（接口 + 数据结构）、standards 三份生成、疑点清单流程

- [ ] **Step 5: commit**

```bash
git add specs/init-project.md specs/draft-prd.md specs/draft-tech-design.md
git commit -m "docs: 添加 specs/ 前期规范（init-project / draft-prd / draft-tech-design）"
```

---

## Task 4：specs/plan-sprint.md

**Source:** `E:\group-code\hact-method\specs-execution\plan-sprint.md`

**Files:**
- Create: `E:\group-code\hact-solo\specs\plan-sprint.md`

- [ ] **Step 1: 读源文件**

读 `E:\group-code\hact-method\specs-execution\plan-sprint.md`

- [ ] **Step 2: 写 `specs/plan-sprint.md`**

从源文件改写，应用以下变化：

**移除：**
- Step 2.5（判断交付方式：独立/批量）——无 PR/branch，不需要合并顺序管理
- 任务包 16 字段 → 6 字段（保留：task-id / title / acceptance-criteria / files / context / relevant-standards）
- sprint.md 中的 `PR` 列和 `交付` 列
- `taken-by` 状态变更
- devmgr 可开启批量 code-review 的移交说明
- G3 → GB 签字，gate 文件写入格式改为 `GB | {日期} | {一句确认}`
- 前置检查：G2 已签 → GA 已签

**保留：**
- 三层结构（骨架 → 任务包 → 收尾）
- Step 1：疑点清单（🚫 等用户确认）
- Step 2：任务骨架输出（一行一任务）
- Step 3：写完整任务包（6 字段格式）
- Step 4：写 sprint.md
- Step 5：GB 签字 + feedback 检查
- Subagent 并行写包（任务 > 4 个时）
- 断点续做逻辑

**6 字段任务包格式：**
```markdown
## {task-id}
- **title**: {15字以内}
- **acceptance-criteria**:
  - {可独立验证的完成标准 1}
  - {可独立验证的完成标准 2}
- **files**: [{改动文件路径列表}]
- **context**: {关键切入点，一句话}
- **relevant-standards**: [{standards-{layer}.md §章节名}]
- **layers**: [frontend/backend/shared]
```

**sprint.md 格式（简化）：**
```markdown
# Sprint v{N} · {项目名}

| task-id | title | layers | 依赖 | 状态 |
|---------|-------|--------|------|------|
| {id} | {标题} | backend | — | [可取] |
| {id} | {标题} | frontend | {id} | [可取] |
```

- [ ] **Step 3: commit**

```bash
git add specs/plan-sprint.md
git commit -m "docs: 添加 specs/plan-sprint.md（简化任务包格式，GB 签字）"
```

---

## Task 5：specs/develop.md（改动最大）

**Source:** `E:\group-code\hact-method\specs-execution\develop.md`

**Files:**
- Create: `E:\group-code\hact-solo\specs\develop.md`

- [ ] **Step 1: 读源文件**

读 `E:\group-code\hact-method\specs-execution\develop.md`

- [ ] **Step 2: 写 `specs/develop.md`**

从源文件改写，应用以下变化：

**移除：**
- 会话模式选择（单任务/批量，由 `交付` 字段决定）→ 只保留单任务模式
- `taken-by` 状态变更（Step 0 的认领操作）
- G3 前置检查 → 改为 GB 前置检查（gate 文件字段名变化）
- 批量会话步骤（Steps 5–9 批量版）
- Step 7：推 PR（`git push origin {task-id}`，PR description 五段格式）
- Step 8 移交时写 PR 编号到 sprint.md → 简化为只更新任务状态为 `[done]`
- Step 9 移交说明（"等待 code-review 合并"）→ 直接 commit 后本会话结束
- Subagent 失败协议中的"上报 devmgr"路径 → 改为"告知用户"
- `do-not` 字段引用（已从任务包移除）

**修改：**
- Step 6（原 commit）：
  - 简单改动（≤ 3 文件）→ 直接 `git add ... && git commit -m "..."` 到 main
  - 复杂改动（> 3 文件，跨模块）→ 开 feature branch → 实现完成后 `git merge` 到 main → 删分支
  - 分支命名（复杂时）：`{task-id}`
- Step 8（原状态更新）：
  - 将 `iterations/vN/queue/{task-id}.md` 状态改为 `[done]`
  - 在 `iterations/vN/sprint.md` 对应行：状态列改为 `[done]`（无 PR 列）
  - B 类任务：在 `b-tasks.md` 对应行状态改为 `[done]`
- 会话结束声明："✅ develop 完成：{task-id} 已 commit，任务已标 [done]。本会话到此结束。"

**完整保留：**
- 第一层骨架：Step 1（理解任务，🚫 等确认）、Step 2（规模评估 + 拆分计划，🚫 等确认）、Step 3（复用检查）
- 第二层结构层：Step 4（逐模块实现，遇到视觉决策暂停）
- 第三层执行层：Step 5（自检：机械验证 build/type-check/lint + checklist 核查 + 偏离核查）完整保留
- Step 10（feedback 检查）完整保留
- hotfix 路径（urgency=hotfix 跳过拆分评估）
- Subagent 使用规则（> 5 文件时派 subagent 实现模块）
- 上下文重置协议（subagent 二次失败 / 调试 > 20 轮 / 用户追加需求）
- 断点续做逻辑
- 前后端差异表

- [ ] **Step 3: commit**

```bash
git add specs/develop.md
git commit -m "docs: 添加 specs/develop.md（移除 PR/CR，直接 commit，自检完整保留）"
```

---

## Task 6：specs/ 质量与交付规范

**Source:**
- `hact-method/specs-execution/generate-integration-tests.md`
- `hact-method/specs-execution/manual-test.md`
- `hact-method/specs-execution/deploy.md`
- `hact-method/specs-execution/wrap-up-iteration.md`

**Files:**
- Create: `E:\group-code\hact-solo\specs\generate-integration-tests.md`
- Create: `E:\group-code\hact-solo\specs\manual-test.md`
- Create: `E:\group-code\hact-solo\specs\deploy.md`
- Create: `E:\group-code\hact-solo\specs\wrap-up.md`

- [ ] **Step 1: 读源文件**

读以上四个源文件。

- [ ] **Step 2: 写 `specs/generate-integration-tests.md`**

从源文件改写，变化：
- 前置检查：sprint 完成（所有 source=sprint 的 develop 任务 `[done]`，无 `[merged]` 概念）
- 失败任务直接开 develop 会话修复，无需"派出任务包入 queue"的正式流程 → 直接描述问题，develop 处理
- 移除 hact-app 集成测试清单同步
- 保留：curl 脚本 + pinchtab 脚本写作、执行逻辑、失败处理

- [ ] **Step 3: 写 `specs/manual-test.md`**

从源文件改写，变化：
- **移除 G4 签字**（G4 已合并入 GC，manual-test 完成后不签字，直接进入 wrap-up）
- 末尾说明：「验收通过后，进入 wrap-up 完成收尾，届时统一签 GC。」
- 移除 hact-app G4 同步
- 保留：对照 PRD AC 验证清单、发现问题转 develop 修复、人工操作步骤

- [ ] **Step 4: 写 `specs/deploy.md`**

从源文件改写，变化：
- 前置检查：manual-test 通过（replace G4 已签）
- 移除 hact-app 部署日志同步
- 保留：SSH MCP 连接、构建 + 重启服务（pm2/nginx）、健康检查、部署日志写入 deploy-log.md

- [ ] **Step 5: 写 `specs/wrap-up.md`**

从 `hact-method/specs-execution/wrap-up-iteration.md` 改写，这是变化最多的一个：

**会话启动变化：**
- 前置条件：manual-test 通过（replace G4 已签）
- 选项列表：只有 `[1] wrap-up` 和 `[2] deploy`，移除其他选项
- version 字段确认保留

**第一步（偏离对账）变化：**
- 移除 revise-doc 任务包创建 → 改为：直接说"需修订以下文档：{列表}"，在当前会话直接修改文档
- 移除 revise-doc 未完成不签 GC 的阻断 → 因为直接修改，无独立任务
- 保留：`[偏离]` 条目分类判断（影响接口→改 TRD，影响功能边界→改 PRD，仅实现细节→记 decisions.md）

**第二步（feedback 分流）变化：**
- 待议清单路径：写入 `../hact-solo/_meta/plans/方法论待议.md`（replace `../hact-method/`）
- 保留：四类分流目标（templates/standards、templates/checklists、decisions.md、待议清单）

**第三步（project.md 合并）：**
- 无变化

**GC 签字（replace G5）：**
- 签字格式：`GC | {日期} | {一句确认}`
- git commit message：`chore: 迭代 {version} 收尾，GC 签署 [{项目名}]`
- 末尾说明：「GC 已签，本期迭代正式关闭。下一期从 draft-prd 开始。」

**红线调整：**
- 保留：feedback 分流完成后必须清空 feedback.md
- 保留：方法论文件不在收尾阶段改（但路径改为 hact-solo 的待议清单）
- 移除：revise-doc 未完成不签 G5（因为直接修改）

- [ ] **Step 6: commit**

```bash
git add specs/generate-integration-tests.md specs/manual-test.md specs/deploy.md specs/wrap-up.md
git commit -m "docs: 添加 specs/ 质量与交付规范（generate-integration-tests/manual-test/deploy/wrap-up）"
```

---

## Task 7：templates/ 根文件

**Files:**
- Create: `E:\group-code\hact-solo\templates\CLAUDE.md`（项目仓模板，核心交付物）
- Create: `E:\group-code\hact-solo\templates\project.md`
- Create: `E:\group-code\hact-solo\templates\decisions.md`
- Create: `E:\group-code\hact-solo\templates\reusables.md`
- Create: `E:\group-code\hact-solo\templates\backlog.md`
- Create: `E:\group-code\hact-solo\templates\b-tasks.md`
- Create: `E:\group-code\hact-solo\templates\feedback.md`

- [ ] **Step 1: 写 `templates/CLAUDE.md`（项目仓 CLAUDE.md 模板）**

这是最重要的模板文件，init-project 时拷贝到项目仓并替换 `{项目名}`：

```markdown
# {项目名}

## 方法论规范
@../hact-solo/specs/draft-prd.md
@../hact-solo/specs/draft-tech-design.md
@../hact-solo/specs/plan-sprint.md
@../hact-solo/specs/develop.md
@../hact-solo/specs/generate-integration-tests.md
@../hact-solo/specs/manual-test.md
@../hact-solo/specs/deploy.md
@../hact-solo/specs/wrap-up.md

## 当前状态
- 当前迭代：v1
- 当前阶段：启动中
  <!-- 阶段选项：启动中 / GA前 / GA已签 / GB已签 / 开发中 / 联调中 / 验收中 / GC已签 -->
- 上次更新：{YYYY-MM-DD}

## 项目约定
<!-- 覆盖 specs 默认行为的项目特有约定，如：
- 后端框架：NestJS / Express / ...
- 前端框架：Vue 3 / React / ...
- 部署目标：prod server alias
- 特殊 do-not 规则
-->

## 跨会话接续
每次打开项目仓时：
1. 读「当前状态」了解所在阶段
2. 读 `iterations/v{N}/gates.md` 确认 Gate 状态
3. 读 `iterations/v{N}/sprint.md` 了解任务进度（开发阶段）
4. 继续当前阶段对应的 task
```

- [ ] **Step 2: 写 `templates/project.md`**

参考 `hact-method/templates/project.md`，内容结构：
```markdown
# 项目快照 · {项目名}

> 跨迭代积累，每期 wrap-up 时更新。

## 产品层
- 项目目标：
- 核心用户：
- 功能边界：

## 技术层
- 技术选型：
- 数据库结构摘要：
- 模块划分：

## 已上线功能
<!-- 每期完成后追加 -->

## 已知风险
```

- [ ] **Step 3: 写其余模板文件**

`templates/decisions.md`：
```markdown
# 架构决策记录 · {项目名}

| 日期 | 决策 | 原因 |
|------|------|------|
```

`templates/reusables.md`：
```markdown
# 可复用资产 · {项目名}

> develop 任务开始前先读此文件，有可用资产必须复用。

## 组件 / 工具函数
## API 封装
## 配置模板
```

`templates/backlog.md`：
```markdown
# 积压与偏离 · {项目名}

> [偏离] 标记的条目由 wrap-up 第一步处理。

| 日期 | 类型 | 描述 | 处理状态 |
|------|------|------|---------|
```

`templates/b-tasks.md`：
```markdown
# B 类任务 · {项目名}

> 发现 bug 或优化点时直接追加一行，然后开 develop 会话处理。

| id | 类型 | 标题 | 验收标准 | urgency | 状态 | 日期 |
|----|------|------|---------|---------|------|------|
| b-001 | bug | {描述} | {可验证的完成标准} | normal/hotfix | [待处理]/[done] | {日期} |
```

`templates/feedback.md`：
```markdown
# Feedback · {项目名}

> 开发过程中随时记录，wrap-up 时统一分流。
> 格式：{日期} | {发现} | 建议去向（standards/checklist/decisions/待议）

```

- [ ] **Step 4: commit**

```bash
git add templates/CLAUDE.md templates/project.md templates/decisions.md templates/reusables.md templates/backlog.md templates/b-tasks.md templates/feedback.md
git commit -m "docs: 添加 templates/ 根文件（CLAUDE.md 项目模板 + 六份跨迭代文件）"
```

---

## Task 8：templates/ standards / checklists / iterations

**Source:**
- `hact-method/templates/standards/`
- `hact-method/templates/checklists/`

**Files:**
- Create: `E:\group-code\hact-solo\templates\standards\shared.md`
- Create: `E:\group-code\hact-solo\templates\standards\frontend.md`
- Create: `E:\group-code\hact-solo\templates\standards\backend.md`
- Create: `E:\group-code\hact-solo\templates\checklists\frontend-checklist.md`
- Create: `E:\group-code\hact-solo\templates\checklists\backend-checklist.md`
- Create: `E:\group-code\hact-solo\templates\iterations\gates.md`
- Create: `E:\group-code\hact-solo\templates\iterations\sprint.md`

- [ ] **Step 1: 读源文件**

读以下文件：
- `E:\group-code\hact-method\templates\standards\shared.md`
- `E:\group-code\hact-method\templates\standards\frontend.md`
- `E:\group-code\hact-method\templates\standards\backend.md`
- `E:\group-code\hact-method\templates\checklists\frontend-checklist.md`
- `E:\group-code\hact-method\templates\checklists\backend-checklist.md`

- [ ] **Step 2: 复制并调整 standards 三份**

直接复制三份 standards 文件，只做以下调整：
- 文件头说明改为"hact-solo 个人版模板"
- 移除"此文件由 draft-tech-design 生成，不手动编辑"之类的团队权限说明
- 内容结构和章节保持一致（standards 的质量标准与人数无关）

- [ ] **Step 3: 复制并调整 checklists 两份**

直接复制两份 checklist，调整同上。内容不变（质量检查项与人数无关）。

- [ ] **Step 4: 写 `templates/iterations/gates.md`（3 关版本）**

```markdown
# Gates · {项目名} · v{N}

> 签字格式：Gate | 日期 | 一句确认内容

GA | | 
GB | |
GC | |
```

- [ ] **Step 5: 写 `templates/iterations/sprint.md`（简化版）**

```markdown
# Sprint v{N} · {项目名}

| task-id | title | layers | 依赖 | 状态 |
|---------|-------|--------|------|------|

## 依赖说明
<!-- 有依赖关系的任务在此说明原因 -->
```

- [ ] **Step 6: 更新 STATUS.md**

更新 `E:\group-code\hact-solo\STATUS.md`，将所有文件组标记为 ✅ 完成。

- [ ] **Step 7: 最终 commit**

```bash
git add templates/standards/ templates/checklists/ templates/iterations/ STATUS.md
git commit -m "docs: 添加 templates/ standards/checklists/iterations，hact-solo 初始化完成"
```

---

## 自检清单（完成后执行）

- [ ] 所有 29 个文件存在
- [ ] `specs/develop.md` 无 PR/branch 相关步骤，自检步骤完整
- [ ] `specs/plan-sprint.md` 任务包只有 6 字段，sprint.md 无 PR 列
- [ ] `specs/wrap-up.md` 签字为 GC，分流路径指向 `../hact-solo/_meta/plans/`
- [ ] `specs/manual-test.md` 无 G4 签字，末尾说明进入 wrap-up
- [ ] `specs/draft-tech-design.md` 签字为 GA，内涵含 PRD + TRD
- [ ] `templates/CLAUDE.md` @引用路径指向 `../hact-solo/specs/`
- [ ] `templates/iterations/gates.md` 只有 GA/GB/GC 三行

---

## 执行说明

**跨会话接续**：检查 `hact-solo/` 目录下哪些文件已存在，从文件清单中第一个不存在的文件对应的 Task 继续。每个 Task 结尾有独立 commit，可精确定位断点。

**执行方式**：推荐 subagent-driven-development（每个 Task 一个 subagent，主线审查后继续）。
