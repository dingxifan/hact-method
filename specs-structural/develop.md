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
| `acceptance-criteria` | string[] | ✅ | 3–5条，每条可独立验证；"功能正常"不算 |
| `relevant-standards` | string[] | ✅ | 精确指向 `standards-{layer}.md` / `standards-shared.md` 的章节（§ 章节名）；前端涉及视觉必须列 design.md |
| `reference` | string[] | ✅ | 文件路径 + 行号 + 说明；无相关文件时明确标注原因 |
| `context` | string | ✅ | 关键实现切入点（如：`GoalList.vue L142 handleDelete()`…） |
| `known-risks` | string[] | ✅ | 来自 TRD 或现有代码的实际陷阱，不是猜测 |
| `do-not` | string[] | ✅ | 明确禁止边界，防止范围蔓延；必须包含通用凭据红线 |
| `escalate-if` | string[] | ✅ | 触发上报的条件；必须包含"上下文不足以做实现决策" |
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

## 工作内容

1. **拾取任务包**：读 queue 中 [可取] 任务包，将状态改为 [taken-by: {user}]；确认 `acceptance-criteria` 理解无误
2. **规模评估**：
   - `files` ≤ 3 且逻辑简单 → 直接开始
   - `files` > 3 或跨模块 → 输出拆分计划，等确认后再动手
   - `urgency=hotfix` → 跳过拆分评估，走最小化修复路径
3. **复用检查**：读 `reusables.md`；有可用资产必须复用，不重新实现
4. **加载规范上下文**：按 `relevant-standards` 精确加载对应章节；source 决定额外上下文：
   - `sprint` → 读 sprint.md 对应行 + PRD 相关段落
   - `integration` → 读失败的联调脚本场景
   - `manual-test` → 读验收报告对应条目
   - `bug` / `optimization` → 读任务包中的复现步骤 / 改进目标
5. **实现**：按 standards 写代码；遇到 `do-not` 边界立即停，不自行绕过；前端遇到 standards 未覆盖的视觉决策，暂停问用户
6. **自检**：
   - 对照 layer 对应 checklist 逐项检查
   - 有冗余/重复实现 → 精简后再推
7. **推 PR**：PR description 是本任务的唯一交付记录，必须包含：task-id / 改动摘要 / acceptance-criteria 逐条验证 / 偏离说明（含超出 files 清单的文件）/ 遗留问题（已记入 backlog 的问题）；不包含凭据
8. **更新任务状态**：PR 推出后，develop 执行人将任务包状态改为 `[done]`，同时在 `sprint.md` 对应行填入 PR 编号（`#N`）；后续 `code-review` 合并 PR 后再将状态改为 `[merged]`

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
- [ ] `code-review` 通过（PR 状态 [merged]）

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
| `code-review` | PR（代码改动 + description） | 代码仓库 PR |

---

## 边界场景

| 场景 | 处理方式 |
|------|---------|
| `files` > 3 或跨模块 | 输出拆分计划，等用户确认后再动手 |
| `urgency=hotfix` | 跳过拆分评估，走最小化修复路径，PR 标题加 `[hotfix]` |
| `reusables.md` 有可用资产 | 必须复用，不重新实现；在完成报告 `files-changed` 中标注复用来源 |
| 前端遇到 standards 未覆盖的视觉决策 | 暂停，输出选项问用户，等确认再继续 |
| 实现中发现 TRD 有歧义 | 记入 `deviations`，上报后等待 `revise-doc` 任务产出，不自行决定 |
| 改动超出 `files` 清单 | 记入 `deviations`，在 `escalate-if` 条件触发时上报 |
| `source=bug` 修复发现根因在接口/数据结构层 | 立即停止，上报，判断是否需要 `revise-doc` + 新 `develop` |
| 发现非 sprint 范围的功能缺口（从未实现） | 先评估规模：≤3 文件且依赖层已就绪 → 建议 B 类快速通道；否则记 backlog。Sprint 排除项只约束 A 类 Gate 任务，不阻断 B 类 |

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| 同一问题三种方案均失败 | 触发上下文重置：写失败报告（含已试方案 + 失败原因），上报，任务回 [可取] |
| `acceptance-criteria` 技术上无法实现 | 立即上报，说明原因，等待任务包修订，不死磕 |
| PR 被 `code-review` 打回 | 按 CR 反馈修改，重新推 PR，更新完成报告（追加 commit） |
| 依赖的 `revise-doc` 结论未下 | 任务保持 [taken-by] + 写阻塞理由，等 revise-doc 完成后继续 |
| 发现凭据被写入代码 | 立即从 commit 中移除，通知相关人撤销凭据，不推 PR |
