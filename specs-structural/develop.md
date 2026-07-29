# task: develop

**discipline**: `dev-frontend`（layers=[frontend]）/ `dev-backend`（layers=[backend]）
**Gate**: —
**属性**: `source` · `layers` · `task_type` · `urgency`

> 从任务包写代码到推 PR：覆盖 V0 走骨架、sprint 功能开发、联调修复、验收修复、bug 修复、优化。

---

## 前置条件

- **触发**：任务包已入 queue，状态为 [可取]
- **文件**：对应 layer 的 `standards-{layer}.md` + `standards-shared.md` 已存在（`draft-tech-design` 产物）
- **source=sprint**：G3 已签（`plan-sprint` 完成）
- **source=foundation**：G2(v0) 已签（`draft-foundation` 完成）；建造单元 = `iterations/v0/foundation-design.md`（地基件 + 标杆切片），全栈、无任务包队列
- **source=integration**：上游联调脚本失败场景已记录，修复任务包由 `generate-integration-tests` 派出
- **source=manual-test**：验收问题已记录，修复任务包由 `manual-test` 派出
- **source=bug / optimization**：任务包由 `dispatch-new` 派出，无 Gate 前置

---

## 字段规范

> **序列化锁定**：任务包用 **YAML frontmatter** 承载下表全部字段（`---` 包裹），模板见 `templates/queue/task-package.md`，`check-sprint.js`（G3 linter）据此机械 parse。下表字段 + 条件 `api-contract` / `baseline` 是字段的**单一真相**。

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `task-id` | string | ✅ | 唯一标识，对应 sprint.md 行或 B 类总账行 |
| `sprint_id` | string | ✅ | 所属 Sprint 标识，如 `v4`；由 plan-sprint 填写 |
| `layers` | string[] | ✅ | `[frontend]` / `[backend]` / `[shared]` |
| `source` | enum | ✅ | `sprint` / `foundation` / `integration` / `manual-test` / `bug` / `optimization` |
| `task_type` | enum | ✅ | `dev-frontend`（layers=[frontend]）/ `dev-backend`（layers=[backend]）/ layers=[shared] 时由分配者在任务包中指定 |
| `urgency` | enum | ✅ | `normal`（默认）/ `hotfix` |
| `risk` | enum | ✅ | `standard`（默认）/ `sensitive`。触及 develop 合并前安全敏感预检四类之一时填 `sensitive`：权限 / 认证 / 数据隔离、不可逆数据操作、金额 / 计费计算、对外不可撤销副作用；否则填 `standard`，**存疑即 `sensitive`**。缺省按 `standard` 处理。develop 侧按**有效 risk** 消费（自报 `sensitive` 或主线四类语义扫命中即升档并回改本字段），末端安全敏感预检基于 diff 独立判定、不唯此字段（决策#29，见 `specs-execution/develop.md`） |
| `title` | string | ✅ | 简短描述，15字以内 |
| `description` | string | ✅ | 格式：「当前状态 → 期望状态」，不写"实现XXX" |
| `files` | string[] | ✅ | 本任务必须修改的文件路径，精确到已知行号范围；不预防性列入"可能"文件 |
| `supersedes` | string[] | ✅ | 本包取代的既有实体，无则 `[]`。一行一条并写清是什么：代码路径（旧实现 / 旧分支 / 将无调用方的模块）、lint 规则 id、spec 文件、`decisions #N`。非空即欠一笔**退役账**：develop 在 PR description 逐条给「已下线 / 保留 + 解除条件」，`wrap-up-iteration` 于签 G5 前核对。**不进 `check-sprint.js` 必填校验**（存量项目任务包无此字段，机械必填会全线红） |
| `acceptance-criteria` | string[] | ✅ | 3–5条，每条可独立验证；"功能正常"不算；每条须标注覆盖的 PRD AC id `(源：PRD AC-nn)`（可选人读后缀 `·{关键词}`，linter 只读 `AC-nn`），纯技术约束标 `(技术)`（由 plan-sprint 回链写入；check-sprint 据 id 机械核逐条覆盖）。**不可视区（backend/逻辑）任务的 AC 以可执行例子规格（Given/When/Then：输入→期望输出）书写**，供 develop 物化成可运行测试——测试脊柱：行为源自 PRD 幕 1、技术精度源自 `draft-tech-design` 幕 2，由 plan-sprint 回链写入；前端任务维持散文 AC |
| `relevant-standards` | string[] | ✅ | 精确指向 `standards-{layer}.md` / `standards-shared.md` 的章节（§ 章节名）。注：`design.md` 现为 frontend 任务的**无条件必读项**（见 `specs-execution/develop.md` 精确加载上下文），不再依赖本字段触发，无需在此重复列出 |
| `reference` | string[] | ✅ | 文件路径 + 行号 + 说明；行号必填、不接受"全文"或无范围（指向已存在代码/文档，可精确定位）；无相关文件时明确标注原因 |
| `context` | string | ✅ | 关键实现切入点（如：`GoalList.vue L142 handleDelete()`…） |
| `known-risks` | string[] | ✅ | 来自 TRD 或现有代码的实际陷阱，不是猜测 |
| `do-not` | string[] | ✅ | 明确禁止边界，防止范围蔓延；必须包含通用凭据红线 |
| `escalate-if` | string[] | ✅ | 触发上报的条件；必须包含"上下文不足以做实现决策" |
| `depends_on` | string[] | ✅ | 本任务依赖的前置 task-id 列表，无依赖填 `[]`。两类来源：① 编译/接口依赖（下游引用上游新增的共享类型/接口，须等上游合并）② 共享资产消费（多任务共享同一表/枚举/共享类型时，指向 source-of-truth 任务）。**消费方无需另存**——由其他任务的 `depends_on` 反查得出（谁的 `depends_on` 含本 task-id，谁即消费方）。与 sprint.md「依赖」列、status.yml `depends_on` 三处一致 |
| `api-contract` | object | 条件 | 仅 `layers=[backend]` 且该接口被前端消费时必填；由 plan-sprint 推导写入，develop 只读；见下方格式说明 |
| `baseline` | enum | 条件 | 仅「视觉地基包」填 `visual`（普通包不写此行）；标记本包是全局 reset + UI 库主题覆盖 + token 全局接线的跨切面地基。由 plan-sprint 在 v1（或 design.md 变更迭代）拆出、`check-sprint.js` 据此核 v1 必有；其余 frontend 任务 `depends_on` 它。见 `specs-execution/plan-sprint.md` Step 2 |

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
| sprint.md 状态 + PR 列更新 | `iterations/vN/sprint.md` | 状态列 → `[merged]`，PR 列 → `#N` |
| code_reviews[] 审计留痕 | 项目根 `status.yml` | 每 task 一条（conclusion + 建议级 issues），由 develop 末端写入 |
| 上下文重置记录（触发时写入） | `_meta/sessions/develop-{task-id}-progress.md` | context-state YAML：已完成文件 / 阻塞点 / 关键决策 |

---

## 完成判据

- [ ] 所有 `acceptance-criteria` 均已满足
- [ ] **不可视区 AC 已 1:1 落成测试且全绿**（backend/逻辑任务：AC 的 Given/When/Then 例子各有对应测试，`npm run test` 全绿）
- [ ] layer 对应 checklist 自检通过（backend = `backend-checklist.md` 测试品类清单：鉴权/边界/错误路径/契约/数据并发/安全注入·穿越各有测试，留人判项有结论；frontend = `frontend-checklist.md` 三段式：机械归 lint/vue-tsc/stylelint + 可测逻辑写测试 + 视觉/交互留人走查）
- [ ] **集合内每个任务已通过独立审查 subagent**（对抗式、自读权威原文，brief = `templates/review-briefs/develop-review.md`；**source=foundation 时 `foundation-review.md`**，逐关注点穷举验实际档≥应有档 + 命门 + 标杆质量；无阻断级 finding；frontend 含设计保真比对）
- [ ] 全量检测全绿（整合后 build/type/lint/test 覆盖集合全部改动）
- [ ] PR 已推，description 5 段完整（含偏离说明和遗留问题）
- [ ] **安全敏感改动**（权限/认证/数据隔离等四类）若执行人无 `architecture` 授权，已经有该授权者裁决（合并前唯一人工门；触及与否基于 diff 独立判定、不唯任务包 `risk` 自报，曾降档审查的先重派默认模型独审）
- [ ] **PR 已合并到 master**（develop 自审自合并，无独立 pr-review；task 状态 `[merged]`，`code_reviews[]` 已追加审计留痕）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `plan-sprint`（source=sprint） | 任务包（含 files / AC / standards 引用） | iterations/vN/queue/*.md |
| `draft-foundation`（source=foundation） | 走骨架设计（地基件清单 + 标杆切片）+ 地基蓝图 | iterations/v0/foundation-design.md + 项目根 foundation.md |
| `generate-integration-tests`（source=integration） | 失败联调场景 + 修复任务包 | iterations/vN/queue/*.md |
| `manual-test`（source=manual-test） | 验收问题 + 修复任务包 | iterations/vN/queue/*.md |
| `dispatch-new`（source=bug/optimization） | B 类任务包 | b-queue/*.md |
| `revise-doc`（影响任务包时） | 更新后的任务包或 standards 变更说明 | iterations/vN/queue/{task-id}.md 或 b-queue/{task-id}.md 更新 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `generate-integration-tests`（source=sprint 全 [merged]） | 已合并到 master 的代码 | master 分支 |
| `manual-test` / 上游复测会话（source=integration/manual-test） | 已合并的修复代码 | master 分支 |
| `deploy`（hotfix [merged]） | 已合并的 hotfix | master 分支 |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/develop.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
