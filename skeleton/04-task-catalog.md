# 04 — 任务全谱

> **本文回答**：v2 有哪些 task type？每个 task 的关键字段（discipline / 完成判据 / 产物 / 关联 Gate / 属性）？
>
> **不回答**：discipline 的概念（→ `03-disciplines.md`）；身份与授权规则（→ `01-identity.md`）；状态枚举与流转（→ `05-state-machine.md`）；Gate 详情（→ `06-gates.md`）。
>
> 04 给出**结构层契约的简表**——每个 task 的完整契约（含边界场景、错误处理、字段细节）由 `specs-structural/{task}.md` 在第二阶段补全；执行细节由 `specs-execution/{task}.md` 在第四阶段补全。

---

## 总览

**14 个 task type**，按生命周期段分布：

| 段 | task | discipline | Gate |
|---|---|---|---|
| hact-method | `init-project` | management | — |
| hact-method | `harvest-notes` | management | — |
| V0 走骨架 | `draft-foundation` | architecture | G2(v0) |
| 准备 | `draft-prd-vN` | product | G1 |
| 准备 | `draft-ux` | product | — (可选前置于 G2，PRD 标记 `draft-ux: 需要` 时对 G2 强制) |
| 准备 | `draft-tech-design` | architecture | G2 |
| 准备 | `plan-sprint` | dispatch | G3 |
| 跨段 | `revise-doc` | product / architecture（按 target 派生） | — |
| 开发循环 | `develop` | dev-frontend / dev-backend（按 layers 派生）；自审自合并到 master | — |
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
| `layers` | `[frontend]` / `[backend]` / `[shared]`（数组，可多值）/ `null` | `develop` |
| `task_type` | `dev-frontend` / `dev-backend`（单值路由键；layers 跨层时由分配者指定主） | `develop` |
| `source` | `sprint` / `foundation` / `integration` / `manual-test` / `bug` / `optimization` | `develop` |
| `target` | `prd` / `trd` / `foundation` / `project` | `revise-doc` |
| `target-source` | `bug` / `optimization` | `dispatch-new` |
| `version` | `vN`（迭代版本号） | `draft-prd-vN`, `draft-ux`, `draft-tech-design`, `wrap-up-iteration` |

`layers` 和 `source` 的组合决定 `develop` 的任务上下文与验证范围（详见 §6 develop 条目）。

---

## 14 task 完整定义

### 1. `init-project`

> 立项：新建项目目录结构和初始配置文件。

- **discipline**: `management`
- **完成判据**: `../{项目}/` 仓目录结构创建完成；占位文件就位；git 初始化完成（详见 `specs-structural/init-project.md`）
- **主要产物**: `../{项目}/` 完整目录树（含 `iterations/`）
- **关联 Gate**: —
- **属性**: `project-name`（字符串）

详见 `specs-structural/init-project.md`（第二阶段）。

---

### 2. `draft-prd-vN`

> 写本期 PRD：捕获用户故事、acceptance criteria、业务约束。

- **discipline**: `product`
- **完成判据**: PRD 文档完整 + 用户确认 + 在任务尾部询问"要不要签 G1"——签了即合并 G1
- **主要产物**: `iterations/vN/prd.md`
- **关联 Gate**: **G1**（可选签于任务尾部）
- **属性**: `version`（vN）

详见 `specs-structural/draft-prd-vN.md`。

---

### 3. `draft-ux`

> 从 PRD 中的用户目标出发设计跨功能动线，再安排页面与控件；实际走查任务结果与恢复路径，在 TRD 前确认体验。

- **discipline**: `product`
- **完成判据**: 场景/流程图无遗漏无死路 + prototype.html 可点击走通全部路径 + 落实 design.md 视觉规范 + 独立对抗审查通过 + 用户实际走查确认
- **主要产物**: ux-flows（U-id 用户任务/S-id 场景+流程图）、prototype.html、prototype-map（AC/U/S/锚点/页面及证据索引）、ux-evidence 与 design 页面规格
- **关联 Gate**: 无独立 Gate；PRD 标 `draft-ux: 需要` 时，G2 前须完成原型动线验证、独审和对应版本的用户接受，不能仅以 HTML 存在放行
- **前置条件**: `draft-prd-vN` 已完成、G1 已签；纯数据管理类页面（标准增删改查、无分支流程）可跳过
- **属性**: `version`（vN）

详见 `specs-structural/draft-ux.md`。

---

### 4. `draft-tech-design`

> 写本期技术设计：TRD（接口/数据结构）+ 项目约束与验证入口。

- **discipline**: `architecture`
- **完成判据**: TRD 完整 + 验证入口可查 + 在任务尾部询问"要不要签 G2"
- **主要产物**: TRD 及按需更新的项目约束——
  - `iterations/vN/trd.md`（迭代内）
  - `project.md` 技术层与本期涉及的 `foundation.md`
- **关联 Gate**: **G2**（可选签于任务尾部）
- **前置条件**: G1 已签
- **属性**: `version`（vN）

详见 `specs-structural/draft-tech-design.md`。

---

### 5. `plan-sprint`

> 拆解 sprint 任务、设依赖、入 queue。

- **discipline**: `dispatch`
- **完成判据**: queue 写满本期 develop 任务包 + sprint.md 反映当前拆解 + 在任务尾部询问"要不要签 G3"
- **主要产物**: 多个 develop 任务包（在 queue/）+ `iterations/vN/sprint.md`
- **关联 Gate**: **G3**（可选签于任务尾部）
- **前置条件**: G2 已签（TRD + 验证入口就位）
- **属性**: 无

详见 `specs-structural/plan-sprint.md`。

---

### 6. `revise-doc`

> 修订已确认的 PRD / TRD / Foundation / project.md 技术约束。

- **discipline**: 派生——
  - `target=prd` → `product`
  - `target=trd` → `architecture`
  - `target=foundation` / `target=project` → `architecture`
- **完成判据**: 修订内容 commit + 在 backlog 记录修订原因 + 判断下游影响（已签 Gate 不撤销，只记录变更）
- **主要产物**: 更新对应文档 + `backlog.md` 加 `[修订]` 条目
- **关联 Gate**: 不签新 Gate（已签的不撤销，只记录变更）
- **属性**: `target`（prd / trd / foundation / project）+ `reason`（字符串）

详见 `specs-structural/revise-doc.md`。

---

### 7. `develop`

> 拿任务包写代码 + 推 PR。涵盖原 feature / fix / fix-integration / fix-acceptance / fix-bug / optimization。

- **discipline**: 由 `task_type` 决定（task_type 由 layers 派生）——
  - `layers=[frontend]` → `dev-frontend`
  - `layers=[backend]` → `dev-backend`
  - `layers=[shared]` → 由分配者在任务包中指定 task_type
- **完成判据**: 写代码前 preflight + 代码完成 + 首次 full/整改 targeted 独立证据审查通过（Foundation 用专用 brief）+ 末端全量绿 + PR `[merged]`（develop 自审自合并到 master，无独立 pr-review；安全敏感改动留 architecture 人工裁决）
- **主要产物**: PR（已合并）+ 代码改动 + 测试 + `code_reviews[]` 审计留痕
- **关联 Gate**: —
- **属性**:
  - `source`：sprint / foundation / integration / manual-test / bug / optimization（决定上下文加载）
  - `layers`：[frontend] / [backend] / [shared]（数组，可多值）
  - `task_type`：dev-frontend / dev-backend（单值路由键；layers=[shared] 或跨层时由分配者指定）
  - `urgency`：normal / hotfix
- **加载规范分支**:
  - source=sprint → 引用 PRD + sprint.md
  - source=foundation → 引用 `iterations/v0/foundation-design.md` + `foundation.md`（建走骨架，无任务包队列）
  - source=integration → 引用失败的联调脚本场景
  - source=manual-test → 引用人工验收报告条目
  - source=bug → 引用 bug 报告 + 复现步骤
  - source=optimization → 引用改进目标 + 基线指标

详见 `specs-structural/develop.md`。

---

### 8. `generate-integration-tests`

> 设计联调测试场景 + 写浏览器/HTTP 脚本 + 跑测试 + 把失败转 develop(source=integration)。

- **discipline**: `integration-testing`
- **完成判据**: 测试脚本就位 + 跑过一轮 + 失败任务全部派出 develop(source=integration)
- **主要产物**: `integration-tests/` 目录（浏览器场景 + HTTP 脚本）+ 一轮跑结果 + 派生的修复任务包
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

详见 `specs-structural/deploy.md`。

---

### 11. `wrap-up-iteration`

> Gate 5 必要收尾：偏离闭合、项目事实与用户确认；可选经验不阻断。

- **discipline**: `management`
- **完成判据**: 三步全部完成 + 在任务尾部询问"要不要签 G5"
- **主要产物**:
  - 反向更新的 PRD/TRD/foundation/decisions（来自偏离对账）
  - 本期真实变化的 `project.md` 与 status 中的 G5 签署
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

> dispatch-new 可先只读诊断；已授权开发则派短包后直接衔接 `develop(source=bug/optimization)`；既有手动 diff 仅在用户明确要求时走Codex的兼容审查入口，且仍须有 preflight 记录。

详见 `specs-structural/dispatch-new.md`。

---

### 13. `harvest-notes`

> 可选：整理**已获许可**来源中的经验，把有证据、可复用的发现提炼成候选建议。不是立项、develop 或 G5 的前置。

- **discipline**: `management`
- **完成判据**: 本次明确授权的来源已整理，采纳理由与未覆盖项已说明；不要求登记或游标
- **主要产物**（无有价值发现可零产出）:
  - `_meta/plans/方法论待议.md` 的候选条目（附来源引用）
  - 必要时 `templates/checklists/{backend|frontend}-checklist.md` 的新增项
  - 不回写来源、不清空私人资料、不把整理等同于规则批准；项目具体缺口留原项目待办
- **关联 Gate**: —
- **前置条件**: 用户明确要求；仅使用获准来源
- **执行约束**: 可选整理、不回写来源、不自动批准规则；不访问未授权私人资料
- **属性**: 无

详见 `specs-structural/harvest-notes.md`。

---

### 14. `draft-foundation`

> V0 地基设计：据 `foundation.md` 定栈，只纳入稳定、跨切面且晚建代价高的承重项，验这些 V0 行的强制边，定一根标杆切片。**只产设计、不产代码**（公共代码归 `develop(source=foundation)`）。

- **discipline**: `architecture`
- **完成判据**: foundation.md 已判 V0/V1+，V0 行实际档达标（安全项构造级）+ foundation-design.md 仅含获准地基件与一根标杆切片 + 验证入口 + 栈入 project.md + G2(v0) 签
- **主要产物**: `foundation.md`（更新）+ `iterations/v0/foundation-design.md` + `project.md` 技术层 + `status.yml iterations.v0.gates`
- **关联 Gate**: **G2**（v0；与 draft-tech-design 同槽，architecture 签字，只验获准 V0 行 + 标杆切片 + 验证入口）
- **前置条件**: init-project 完成、`foundation.md` 已播种，且存在满足 V0 准入门槛的高改造成本约束（先于 V1 PRD）
- **属性**: 无（迭代固定 v0）

详见 `specs-structural/draft-foundation.md`。

---

## 任务关系（不在本文档讲）

任务之间的执行顺序、依赖、状态流转、Gate 触发条件等——见：
- 执行顺序与依赖：`05-state-machine.md`
- Gate 触发与签字判据：`06-gates.md`
