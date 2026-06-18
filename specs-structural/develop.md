# task: develop

**discipline**: `dev-frontend`（layers=[frontend]）/ `dev-backend`（layers=[backend]）
**Gate**: —
**属性**: `source` · `layers` · `task_type` · `urgency`

> 从任务包写代码到推 PR：覆盖 sprint 功能开发、联调修复、验收修复、bug 修复、优化。

---

## 前置条件

- **触发**：任务包已入 queue，状态为 [可取]
- **文件**：对应 layer 的 `standards-{layer}.md` + `standards-shared.md` 已存在（`draft-tech-design` 产物）
- **source=sprint**：G3 已签（`plan-sprint` 完成）
- **source=integration**：上游联调脚本失败场景已记录，修复任务包由 `generate-integration-tests` 派出
- **source=manual-test**：验收问题已记录，修复任务包由 `manual-test` 派出
- **source=bug / optimization**：任务包由 `dispatch-new` 派出，无 Gate 前置

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `task-id` | string | ✅ | 唯一标识，对应 sprint.md 行或 B 类总账行 |
| `sprint_id` | string | ✅ | 所属 Sprint 标识，如 `v4`；由 plan-sprint 填写 |
| `layers` | string[] | ✅ | `[frontend]` / `[backend]` / `[shared]` |
| `source` | enum | ✅ | `sprint` / `integration` / `manual-test` / `bug` / `optimization` |
| `task_type` | enum | ✅ | `dev-frontend`（layers=[frontend]）/ `dev-backend`（layers=[backend]）/ layers=[shared] 时由分配者在任务包中指定 |
| `urgency` | enum | ✅ | `normal`（默认）/ `hotfix` |
| `title` | string | ✅ | 简短描述，15字以内 |
| `description` | string | ✅ | 格式：「当前状态 → 期望状态」，不写"实现XXX" |
| `files` | string[] | ✅ | 本任务必须修改的文件路径，精确到已知行号范围；不预防性列入"可能"文件 |
| `acceptance-criteria` | string[] | ✅ | 3–5条，每条可独立验证；"功能正常"不算；每条须标注覆盖的 PRD AC 文本引用 `(源：PRD {功能名}·{AC 关键词})`，纯技术约束标 `(技术)`（由 plan-sprint 回链写入） |
| `relevant-standards` | string[] | ✅ | 精确指向 `standards-{layer}.md` / `standards-shared.md` 的章节（§ 章节名）。注：`design.md` 现为 frontend 任务的**无条件必读项**（见 `specs-execution/develop.md` 加载规范），不再依赖本字段触发，无需在此重复列出 |
| `reference` | string[] | ✅ | 文件路径 + 行号 + 说明；行号必填、不接受"全文"或无范围（指向已存在代码/文档，可精确定位）；无相关文件时明确标注原因 |
| `context` | string | ✅ | 关键实现切入点（如：`GoalList.vue L142 handleDelete()`…） |
| `known-risks` | string[] | ✅ | 来自 TRD 或现有代码的实际陷阱，不是猜测 |
| `do-not` | string[] | ✅ | 明确禁止边界，防止范围蔓延；必须包含通用凭据红线 |
| `escalate-if` | string[] | ✅ | 触发上报的条件；必须包含"上下文不足以做实现决策" |
| `depends_on` | string[] | ✅ | 本任务依赖的前置 task-id 列表，无依赖填 `[]`。两类来源：① 编译/接口依赖（下游引用上游新增的共享类型/接口，须等上游合并）② 共享资产消费（多任务共享同一表/枚举/共享类型时，指向 source-of-truth 任务）。**消费方无需另存**——由其他任务的 `depends_on` 反查得出（谁的 `depends_on` 含本 task-id，谁即消费方）。与 sprint.md「依赖」列、status.yml `depends_on` 三处一致 |
| `api-contract` | object | 条件 | 仅 `layers=[backend]` 且该接口被前端消费时必填；由 plan-sprint 推导写入，develop 只读；见下方格式说明 |

**api-contract 格式**：
```yaml
api-contract:
  endpoint: GET /api/...
  request:               # 可选，有 query params 或 body 时填
    query: { field: type }
    body: { field: type }
  response:              # 字段平铺，不嵌套；嵌套须注明原因
    field: type
    # 前端直接按此结构声明 TypeScript 类型
```

**通用凭据红线**（所有任务包默认含此项）：禁止在代码、PR 描述、完成报告中明文出现 PAT / access token / 密码 / 私钥 / API key。

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| PR | 代码仓库 | PR description 含 5 段：task-id / 改动摘要 / AC 验证 / 偏离说明 / 遗留问题 |
| sprint.md 状态 + PR 列更新 | `iterations/vN/sprint.md` | 状态列 → `[done]`，PR 列 → `#N` |
| 上下文重置记录（触发时写入） | `_meta/sessions/develop-{task-id}-progress.md` | context-state YAML：已完成文件 / 阻塞点 / 关键决策 |

---

## 完成判据

- [ ] 所有 `acceptance-criteria` 均已满足
- [ ] layer 对应 checklist 自检通过（`templates/checklists/backend-checklist.md` 或 `frontend-checklist.md`）
- [ ] PR 已推，description 5 段完整（含偏离说明和遗留问题）
- [ ] `pr-review` 通过（PR 状态 [merged]）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `plan-sprint`（source=sprint） | 任务包（含 files / AC / standards 引用） | iterations/vN/queue/*.md |
| `generate-integration-tests`（source=integration） | 失败联调场景 + 修复任务包 | iterations/vN/queue/*.md |
| `manual-test`（source=manual-test） | 验收问题 + 修复任务包 | iterations/vN/queue/*.md |
| `dispatch-new`（source=bug/optimization） | B 类任务包 | iterations/vN/queue/*.md |
| `revise-doc`（影响任务包时） | 更新后的任务包或 standards 变更说明 | iterations/vN/queue/{task-id}.md 更新 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `pr-review` | PR（代码改动 + description） | 代码仓库 PR |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/develop.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
