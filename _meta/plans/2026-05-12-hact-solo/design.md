# hact-solo 设计文档

> 日期：2026-05-12  
> 状态：已通过用户审阅

---

## 背景

hact-method 是针对 5-8 人团队设计的 AI 协作开发方法论。本文档记录将其"塌缩"为个人开发者版本（`hact-solo`）的设计决策，目标是在保留核心质量保障机制的同时，彻底消除多人协调开销，最大化个人开发流畅性。

---

## 核心原则

**保留**：任务驱动模型、文档先行（PRD→TRD→代码）、Gate 质检节点、checklist 自检、knowledge 积累机制（decisions/reusables/feedback）

**移除**：用户-discipline 权限体系、hact-app 可见层、PR/CR 工作流、queue 认领机制、dispatch-new 独立任务

**简化**：Gate 从 5 个合并为 3 个、task 包字段从 12 个减到 6 个、specs 目录扁平化

---

## 方案选择

| 方案 | 描述 | 选择 |
|---|---|---|
| A — 完整镜像+删减 | 复刻 hact-method 全部目录层级，逐份重写 | ❌ 工作量大，骨架层对个人无意义 |
| **B — 精简三层** | guide/ + specs/（扁平）+ templates/，立刻可用 | ✅ 选定 |
| C — 极简启动集 | 只写 CLAUDE.md 模板 + develop.md，按需补写 | ❌ 太薄，缺少前期规范 |

---

## 目录结构

```
hact-solo/
├── CLAUDE.md                    ← 方法论区启动协议
├── BRIEF.md                     ← 方法论概述
├── STATUS.md
├── guide/
│   ├── 00-核心概念.md
│   ├── 01-启动新项目.md
│   └── 02-典型流程.md
├── specs/                       ← 所有 task 规范，扁平化
│   ├── init-project.md
│   ├── draft-prd.md
│   ├── draft-tech-design.md
│   ├── plan-sprint.md
│   ├── develop.md
│   ├── generate-integration-tests.md
│   ├── manual-test.md
│   ├── deploy.md
│   └── wrap-up.md
└── templates/
    ├── CLAUDE.md                ← 项目仓 CLAUDE.md 模板（核心交付物）
    ├── project.md
    ├── decisions.md
    ├── reusables.md
    ├── backlog.md
    ├── b-tasks.md
    ├── feedback.md
    ├── standards/
    │   ├── shared.md
    │   ├── frontend.md
    │   └── backend.md
    ├── checklists/
    │   ├── frontend-checklist.md
    │   └── backend-checklist.md
    └── iterations/
        ├── gates.md
        └── sprint.md
```

与团队版的关键结构差异：
- 去掉 `skeleton/`（身份模型、权限、状态机骨架，对个人无意义）
- `specs/` 扁平化（合并 specs-structural + specs-execution 两层）
- 去掉 `_meta/input/`（个人不需要跨项目输入材料管理）

---

## Task 类型：12 → 8

| 状态 | Task | 变化说明 |
|---|---|---|
| ✅ 保留 | `init-project` | 无变化 |
| ✅ 保留 | `draft-prd` | 去掉版本号后缀（串行迭代，无并行） |
| ✅ 保留 | `draft-tech-design` | 无变化 |
| ✅ 保留 | `plan-sprint` | 任务包字段简化：12 → 6 个 |
| ✅ 保留 | `develop` | 去掉 PR/branch；直接 commit；自检完整保留 |
| ✅ 保留 | `generate-integration-tests` | 无变化 |
| ✅ 保留 | `manual-test` | 无变化 |
| ✅ 保留 | `deploy` | 无变化 |
| 🔀 重命名 | `wrap-up`（原 `wrap-up-iteration`） | 同时签 GC（原 G4+G5） |
| ❌ 移除 | `code-review` | 合并进 develop 尾部自检步骤 |
| ❌ 移除 | `dispatch-new` | B 类直接 inline 写入 `b-tasks.md` |
| ❌ 移除 | `revise-doc` | 直接修改文档，无需独立 task 会话 |

---

## Gate 重设计：5 关 → 3 关

| Gate | 原映射 | 签字时机 | 确认内容 |
|---|---|---|---|
| **GA** — 文档关 | G1 + G2 | `draft-tech-design` 尾部 | PRD 完整 + TRD + standards 三份就绪 |
| **GB** — 开发关 | G3 | `plan-sprint` 尾部 | sprint 拆解完成，queue 写满 |
| **GC** — 收尾关 | G4 + G5 | `wrap-up` 尾部 | 验收通过 + 收尾完成，本期关闭 |

**签字格式**（`iterations/vN/gates.md`）：

```
GA | 2026-05-12 | PRD + TRD 确认，standards 三份就绪
GB | 2026-05-13 | sprint 拆解完成，queue 8 个任务
GC | 2026-05-20 | 验收通过，收尾完成，v1 关闭
```

无权限检查，无 hact-app 同步。GA 合并意味着 PRD 和 TRD 在连续工作流中完成，中间状态靠 STATUS.md 记录。

---

## 关键 Spec 变化

### develop.md

**移除**：
- PR/branch 工作流（`git push origin {task-id}`、PR description 五段格式）
- `taken-by` 状态变更
- `code-review` 移交步骤
- 批量会话模式（独立/批量交付区分）
- "上报 devmgr" 路径

**保留/调整**：
- 三层结构：骨架（理解+计划）→ 结构层（实现）→ 执行层（自检+交付）
- Step 5 自检（checklist + 机械验证 build/type-check/lint）完整保留
- 直接 commit：简单改动到 main，复杂改动开 feature branch 自 merge
- feedback.md 检查保留

### plan-sprint.md 任务包字段

| 字段 | 团队版 | 个人版 |
|---|---|---|
| `task-id` | ✅ | ✅ |
| `title` | ✅ | ✅ |
| `acceptance-criteria` | ✅ | ✅ |
| `files` | ✅ | ✅ |
| `context` | ✅ | ✅ |
| `relevant-standards` | ✅ | ✅ |
| `taken-by` | ✅ | ❌ |
| `urgency` | ✅ | ❌ |
| `reference` | ✅ | ❌ |
| `known-risks` | ✅ | ❌ |
| `do-not` | ✅ | ❌ |
| `escalate-if` | ✅ | ❌ |

### wrap-up.md

`manual-test` 验收通过后直接进入 `wrap-up`，完成三步（偏离对账 + feedback 分流 + project.md 更新），签 GC，本期关闭。不再拆两个独立会话。

### B 类流程

发现 bug 或优化需求 → 在 `b-tasks.md` 追加一行（标题 + 验收标准 + urgency）→ 直接开 `develop` 会话处理。无 `dispatch-new` 中间环节。

---

## 项目仓结构

与团队版保持一致，结构不因人数变化：

```
{project-name}/
├── [代码文件]
├── iterations/
│   └── v1/
│       ├── prd.md
│       ├── trd.md
│       ├── standards-shared.md
│       ├── standards-frontend.md
│       ├── standards-backend.md
│       ├── gates.md              ← GA / GB / GC 三行
│       └── queue/
│           └── done/
├── project.md
├── decisions.md
├── reusables.md
├── backlog.md
├── feedback.md
├── b-tasks.md
└── CLAUDE.md
```

**项目仓 CLAUDE.md 模板核心结构**：

```markdown
# {项目名}

@../hact-solo/specs/draft-prd.md
@../hact-solo/specs/draft-tech-design.md
@../hact-solo/specs/plan-sprint.md
@../hact-solo/specs/develop.md
@../hact-solo/specs/generate-integration-tests.md
@../hact-solo/specs/manual-test.md
@../hact-solo/specs/deploy.md
@../hact-solo/specs/wrap-up.md

## 当前状态
<!-- CC 启动时读取这里，推断当前阶段 -->

## 项目约定
<!-- 项目特有约定，覆盖 specs 默认行为 -->
```

`@` 引用让项目仓不复制 spec 内容，hact-solo 更新后所有项目自动受益。

---

## 不在本次范围内

- hact-solo 的 `_meta/` 跨会话计划管理（复用 planning-with-files-zh skill）
- 具体 spec 文件的完整内容（在实施阶段逐份写）
- 与 hact-method 的版本同步策略（当前两仓独立维护）
