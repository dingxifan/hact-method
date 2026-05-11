# 04 — 任务全谱

> **本文回答**：v2 有哪些 task type？每个 task 的关键字段（discipline / 完成判据 / 产物 / 关联 Gate / 属性）？
>
> **不回答**：discipline 的概念（→ `03-disciplines.md`）；身份/拉取规则（→ `01-identity.md`）；状态枚举与流转（→ `05-state-machine.md`）；Gate 详情（→ `06-gates.md`）。
>
> 04 给出**结构层契约的简表**——每个 task 的完整契约（含边界场景、错误处理、字段细节）由 `specs-structural/{task}.md` 在第二阶段补全；执行细节由 `specs-execution/{task}.md` 在第四阶段补全。

---

## 总览

**12 个 task type**，按生命周期段分布：

| 段 | task | discipline | Gate |
|---|---|---|---|
| hact-method | `init-project` | management | — |
| 准备 | `draft-prd-vN` | product | G1 |
| 准备 | `draft-tech-design` | architecture | G2 |
| 准备 | `plan-sprint` | dispatch | G3 |
| 跨段 | `revise-doc` | product / architecture（按 target 派生） | — |
| 开发循环 | `develop` | dev-frontend / dev-backend（按 layer 派生） | — |
| 开发循环 | `code-review` | review | — |
| 开发循环 | `generate-integration-tests` | integration-testing | — |
| 开发循环 | `manual-test` | product | G4 |
| 收尾 | `deploy` | deploy | — |
| 收尾 | `wrap-up-iteration` | management | G5 |
| B 类入口 | `dispatch-new` | dispatch | — |

---

## 通用属性定义

以下属性可能出现在多个 task 上：

| 属性 | 取值 | 出现于 |
|---|---|---|
| `urgency` | `normal` (默认) / `hotfix`（紧急） | `develop` |
| `layer` | `frontend` / `backend` / `shared` / `null` | `develop`, `code-review`（从 PR 派生） |
| `source` | `sprint` / `integration` / `manual-test` / `bug` / `optimization` | `develop` |
| `target` | `prd` / `trd` / `standards` | `revise-doc` |
| `target-source` | `bug` / `optimization` | `dispatch-new` |
| `version` | `vN`（迭代版本号） | `draft-prd-vN`, `draft-tech-design`, `wrap-up-iteration` |
| `pr-link` | URL | `code-review` |

`layer` 和 `source` 的组合决定 `develop` 任务加载哪份 standards 和如何理解任务上下文（详见 §6 develop 条目）。

---

## 12 task 完整定义

### 1. `init-project`

> 立项：新建项目目录结构和初始配置文件。

- **discipline**: `management`
- **完成判据**: `projects/{项目}/` 子结构创建完成；初始 PRD/TRD 占位文件就位；项目记入 registry
- **主要产物**: `projects/{项目}/` 完整目录树（含 `iterations/`）
- **关联 Gate**: —
- **属性**: `project-name`（字符串）

详见 `specs-structural/init-project.md`（第二阶段）。

---

### 2. `draft-prd-vN`

> 写本期 PRD：捕获用户故事、acceptance criteria、业务约束。

- **discipline**: `product`
- **完成判据**: PRD 文档完整 + 用户确认 + 在任务尾部询问"要不要签 G1"——签了即合并 G1
- **主要产物**: `projects/{项目}/iterations/vN/prd.md`
- **关联 Gate**: **G1**（可选签于任务尾部）
- **属性**: `version`（vN）

详见 `specs-structural/draft-prd-vN.md`。

---

### 3. `draft-tech-design`

> 写本期技术设计：TRD（接口/数据结构）+ 三份 standards。

- **discipline**: `architecture`
- **完成判据**: TRD 完整 + 3 份 standards 完整 + 在任务尾部询问"要不要签 G2"
- **主要产物**: 4 份文件——
  - `projects/{项目}/iterations/vN/trd.md`
  - `projects/{项目}/iterations/vN/standards-shared.md`
  - `projects/{项目}/iterations/vN/standards-frontend.md`
  - `projects/{项目}/iterations/vN/standards-backend.md`
- **关联 Gate**: **G2**（可选签于任务尾部）
- **前置条件**: G1 已签
- **属性**: `version`（vN）

详见 `specs-structural/draft-tech-design.md`。

---

### 4. `plan-sprint`

> 拆解 sprint 任务、设依赖、入 queue。

- **discipline**: `dispatch`
- **完成判据**: queue 写满本期 develop 任务包 + sprint.md 反映当前拆解 + 在任务尾部询问"要不要签 G3"
- **主要产物**: 多个 develop 任务包（在 queue/）+ `projects/{项目}/iterations/vN/sprint.md`
- **关联 Gate**: **G3**（可选签于任务尾部）
- **前置条件**: G2 已签（TRD + standards 就位）
- **属性**: 无

详见 `specs-structural/plan-sprint.md`。

---

### 5. `revise-doc`

> 修订一份已签 Gate 的产物文档（PRD / TRD / standards）。

- **discipline**: 派生——
  - `target=prd` → `product`
  - `target=trd` → `architecture`
  - `target=standards` → `architecture`
- **完成判据**: 修订内容 commit + 在 backlog 记录修订原因 + 触发原 Gate 的复议（如需要）
- **主要产物**: 更新对应文档 + `backlog.md` 加 `[修订]` 条目
- **关联 Gate**: 不签新 Gate（已签的不撤销，只记录变更）
- **属性**: `target`（prd / trd / standards）+ `reason`（字符串）

详见 `specs-structural/revise-doc.md`。

---

### 6. `develop`

> 拿任务包写代码 + 推 PR。涵盖原 feature / fix / fix-integration / fix-acceptance / fix-bug / optimization。

- **discipline**: 派生——
  - `layer=frontend` → `dev-frontend`
  - `layer=backend` → `dev-backend`
- **完成判据**: 代码完成 + 通过 code-review + PR `[merged]`
- **主要产物**: PR + 代码改动 + （可选）新增/更新单元测试
- **关联 Gate**: —
- **属性**:
  - `source`：sprint / integration / manual-test / bug / optimization（决定上下文加载）
  - `layer`：frontend / backend / shared
  - `urgency`：normal / hotfix
- **加载规范分支**:
  - source=sprint → 引用 PRD + sprint.md
  - source=integration → 引用失败的联调脚本场景
  - source=manual-test → 引用人工验收报告条目
  - source=bug → 引用 bug 报告 + 复现步骤
  - source=optimization → 引用改进目标 + 基线指标

详见 `specs-structural/develop.md`。

---

### 7. `code-review`

> 复核 PR：按 standards 评判代码质量，给反馈或批准。

- **discipline**: `review`
- **完成判据**: CR 反馈写完 + 决定（通过 / 打回）记录在 PR
- **主要产物**: CR 反馈 + 决定（通过 / 打回）
- **关联 Gate**: —
- **属性**: `pr-link`（URL）+ `layer`（从 PR 改动文件派生，决定加载哪份 standards）

详见 `specs-structural/code-review.md`。

---

### 8. `generate-integration-tests`

> 设计联调测试场景 + 写脚本（pinchtab + curl）+ 跑测试 + 把失败转 develop(source=integration)。

- **discipline**: `integration-testing`
- **完成判据**: 测试脚本就位 + 跑过一轮 + 失败任务全部派出 develop(source=integration)
- **主要产物**: `integration-tests/` 目录（pinchtab + curl 脚本）+ 一轮跑结果 + 派生的修复任务包
- **关联 Gate**: —
- **前置条件**: sprint 完成（所有 source=sprint 的 develop 任务 `[merged]`）——任务入口检查
- **属性**: 无

详见 `specs-structural/generate-integration-tests.md`。

---

### 9. `manual-test`

> 人工验收：对照 PRD acceptance criteria 验证系统，发现问题转 develop(source=manual-test)。

- **discipline**: `product`
- **完成判据**: 验收通过 + 所有 develop(source=manual-test) 已 `[merged]` + 在任务尾部询问"要不要签 G4"
- **主要产物**: 验收报告 + 派生的修复任务包（如有）
- **关联 Gate**: **G4**（可选签于任务尾部）
- **前置条件**: 联调通过（所有 source=integration 的 develop 任务 `[merged]`）——任务入口检查
- **属性**: 无

详见 `specs-structural/manual-test.md`。

---

### 10. `deploy`

> 部署代码到服务器。

- **discipline**: `deploy`
- **完成判据**: 服务器跑起来 + 验收通过（pm2 list / curl health 等）
- **主要产物**: 服务器更新 + 部署日志
- **关联 Gate**: —
- **前置条件**: G4 已签（合并部署模式下也允许 hotfix 走快速通道，详见 `specs-structural/deploy.md`）
- **属性**: `target`（环境标识，如 prod / staging）

详见 `specs-structural/deploy.md`（含 `deploy-to-server` skill 的 hact-method 适配）。

---

### 11. `wrap-up-iteration`

> Gate 5 三步收尾：偏离对账 / feedback 审阅 / project.md 合并。机械化分流，1 分钟内可完成。

- **discipline**: `management`
- **完成判据**: 三步全部完成 + 在任务尾部询问"要不要签 G5"
- **主要产物**:
  - 反向更新的 PRD/TRD/standards/decisions（来自偏离对账）
  - 反向更新的方法论文件（来自 feedback 流向 specs/skeleton 的部分）
  - 反向更新的 standards 模板（来自 feedback 流向 templates/standards/ 的部分）
  - 清空的 `feedback.md`
  - 更新的 `project.md`（去除"开发中"标注）
- **关联 Gate**: **G5**（可选签于任务尾部）
- **前置条件**: G4 已签（与 `deploy` 任务并行可执行，无依赖）
- **属性**: `version`（vN）

详见 `specs-structural/wrap-up-iteration.md`。

---

### 12. `dispatch-new`

> 派新 BUG 任务或新优化任务（B 类入口）。

- **discipline**: `dispatch`
- **完成判据**: 新 develop 任务包入 queue + 元数据完整
- **主要产物**: 新 develop 任务包（source=bug 或 source=optimization）
- **关联 Gate**: —
- **属性**: `target-source`（bug / optimization）

详见 `specs-structural/dispatch-new.md`。

---

## 任务关系（不在本文档讲）

任务之间的执行顺序、依赖、状态流转、Gate 触发条件等——见：
- 执行顺序与依赖：`05-state-machine.md`
- Gate 触发与签字判据：`06-gates.md`
