# task: develop

**discipline**: `dev-frontend`（layers=[frontend]）/ `dev-backend`（layers=[backend]）
**Gate**: —
**属性**: `source` · `layers` · `task_type` · `urgency`

> 从任务包写代码到推 PR：覆盖 V0 走骨架、sprint 功能开发、联调修复、验收修复、bug 修复、优化。

---

## 执行责任

主线可直接实现并连续推进已授权任务集；仅独立且有收益的工作委派。首次审查使用不继承实现历史的 Codex 子代理；压缩/恢复从原始契约、实际 Git、既有报告和 progress 重建状态，不自动重开任务或清零轮次。

## 前置条件

- **触发**：任务包已入 queue，状态为 [可取]
- **文件**：任务 reference 中的项目技术约束、Foundation、TRD/共享契约及测试入口可查
- **source=sprint**：G3 已签（`plan-sprint` 完成）
- **source=foundation**：G2(v0) 已签（`draft-foundation` 完成）；建造单元 = `iterations/v0/foundation-design.md`（获准的最小地基件 + 一根标杆切片），执行层按真实切片决定、无任务包队列
- **source=integration**：上游联调脚本失败场景已记录，修复任务包由 `generate-integration-tests` 派出
- **source=manual-test**：验收问题已记录，修复任务包由 `manual-test` 派出
- **source=bug / optimization**：任务包由 `dispatch-new` 派出，无 Gate 前置

---

## 字段规范

B 类使用 `specs-execution/dispatch-new.md` 的短包子集，不要求 A 类 module/sprint 等规划元数据或凑 AC 条数；字段语义沿用下表。固定改动审查、实际回归和敏感裁决不省略。

> **序列化锁定**：任务包用 **YAML frontmatter** 承载下表全部字段（`---` 包裹），模板见 `templates/queue/task-package.md`，`check-sprint.js`（G3 linter）据此机械 parse。下表字段 + 条件 `api-contract` / `baseline` 是字段的**单一真相**。

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `package-schema` | int | 新任务 ✅ | 固定 `2`；存量缺失按 legacy 兼容，不批量回填。schema 2 启用 module/design-reference 等新机械契约 |
| `task-id` | string | ✅ | 唯一标识，对应 sprint.md 行或 B 类总账行 |
| `module` | string | schema 2 ✅ | TRD「模块拆分」中的稳定模块名；用于 G3 超预算时按业务模块切与生成最小全局索引，不得从 `context`/文件名猜测 |
| `sprint_id` | string | ✅ | 所属 Sprint 标识，如 `v4`；由 plan-sprint 填写 |
| `layers` | string[] | ✅ | `[frontend]` / `[backend]` / `[shared]` |
| `source` | enum | ✅ | `sprint` / `foundation` / `integration` / `manual-test` / `bug` / `optimization` |
| `task_type` | enum | ✅ | `dev-frontend`（layers=[frontend]）/ `dev-backend`（layers=[backend]）/ layers=[shared] 时由分配者在任务包中指定 |
| `contract-impact` | enum | ✅（新包） | `governed` = 只实现已经确认/修订完成的 PRD、TRD、Foundation、project.md 技术约束，不在 develop 中改契约；`none` = 不触及共享契约。B 类可为 `none` 或有明确依据的局部兼容 `governed`，范围见 dispatch-new；不得借此修订已签规格或增加业务承诺 |
| `urgency` | enum | ✅ | `normal`（默认）/ `hotfix` |
| `risk` | enum | ✅ | `standard`（默认）/ `sensitive`。触及 develop 合并前安全敏感预检四类之一时填 `sensitive`：权限 / 认证 / 数据隔离、不可逆数据操作、金额 / 计费计算、对外不可撤销副作用；否则填 `standard`，**存疑即 `sensitive`**。缺省按 `standard` 处理。develop 侧按**有效 risk** 消费（自报 `sensitive` 或主线四类语义扫命中即升档并回改本字段），末端安全敏感预检基于 diff 独立判定、不唯此字段（决策#29，见 `specs-execution/develop.md`） |
| `title` | string | ✅ | 简短描述，15字以内 |
| `description` | string | ✅ | 格式：「当前状态 → 期望状态」，不写"实现XXX" |
| `files` | string[] | ✅ | 本任务必须修改的文件路径，精确到已知行号范围；不预防性列入"可能"文件 |
| `asset-writes` | string[] | ✅（新包） | 本任务会写的跨文件共享资产；无则 `[]`。使用稳定键，如 `db:users`、`enum:OrderStatus`、`type:UserDTO`、`api:GET /users`、`event:order.created`、`config:auth-policy`。`files` 相同或资产键相同的任务必须以 `depends_on` 排出先后；旧包缺字段时兼容，但不能据此获得并行资格 |
| `supersedes` | string[] | ✅ | 本包取代的既有实体，无则 `[]`。一行一条并写清是什么：代码路径（旧实现 / 旧分支 / 将无调用方的模块）、lint 规则 id、spec 文件、`decisions #N`。非空即欠一笔**退役账**：develop 在 PR description 逐条给「已下线 / 保留 + 解除条件」，`wrap-up-iteration` 于签 G5 前核对。**不进 `check-sprint.js` 必填校验**（存量项目任务包无此字段，机械必填会全线红） |
| `ac-format` | enum | ✅ | 新任务固定 `intent-oracle-v1`；存量缺省按旧格式兼容，不要求批量回填 |
| `acceptance-criteria` | string[] | ✅ | 3–5 条，每条是一个 block scalar，含回链 tag + `intent` + `oracle`；`example` 可选，默认是派生说明，不高于 oracle。仅输入封闭、可按 oracle 复算且经写包独审确认的例子标 `golden: true`，develop 才承担字面物化义务；其余测试物化 intent/oracle |
| `design-reference-format` | enum | frontend 条件必填 | `sliced-v1`：design 已有全局基线 + 页面规格结构；`legacy-full`：存量 design 尚无稳定页面标题。backend/shared 不写 |
| `reference` | string[] | ✅ | 只列做实现决策必需的权威锚。普通情况不接受全文；仅 `design-reference-format=legacy-full` 允许 `design.md 全文（存量）`。frontend `sliced-v1` 须含全局视觉基线和相关页面标题；无其他必需锚可填 `[]` |
| `context` | string | ✅ | 关键实现切入点（如：`GoalList.vue L142 handleDelete()`…） |
| `known-risks` | string[] | ✅ | 只列本任务新打开或显著放大的实际风险；无则 `[]` |
| `do-not` | string[] | ✅ | 只列本任务真实 scope 边；凭据与真实性红线由 develop 全局纪律承接；无则 `[]` |
| `escalate-if` | string[] | ✅ | 只列无法从权威原文自行裁决的分支；无则 `[]` |
| `depends_on` | string[] | ✅ | 本任务依赖的前置 task-id 列表，无依赖填 `[]`。两类来源：① 编译/接口依赖（下游引用上游新增的共享类型/接口，须等上游合并）② 共享资产消费（多任务写同一表/枚举/共享类型时，指向 source-of-truth 任务）。`check-sprint.js` 对 `files` 与 `asset-writes` 做两两交叉核验；共享写集没有任一方向的依赖路径即 FAIL。与 sprint.md「依赖」列、status.yml `depends_on` 三处一致 |
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

**任务包体量**：normative core 以 8–12KB 为软预算。超过时拆包，或把历史解释迁到 frontmatter 后的 non-normative appendix；develop/独审默认只消费 normative core。

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| PR | 代码仓库 | PR description 含 5 段：task-id / 改动摘要 / AC 验证 / 偏离说明 / 遗留问题 |
| 任务状态与 PR | `status.yml tasks[]` | 唯一动态源；不更新任务包/sprint 的重复状态 |
| preflight / review rounds | A 类 `iterations/vN/code-reviews/{task-id}/`；B 类 `b-reviews/{task-id}/` | `preflight.md` + `round-NN.md`；含固定 Git tree、finding 及处置与 full/targeted scope；时间戳可选 |
| code_reviews[] 审计索引 | 项目根 `status.yml` | 每 task 一条（结论、结论/轮次、report 目录与证据版本），由 develop 末端写入；不复制逐条问题 |
| 执行进度 / 上下文重置记录 | `_meta/sessions/develop-{task-id}-progress.md` | context-state YAML：已授权任务集与当前交付批次 / 当前阶段 / 下一动作 / 待接收单元 / 证据引用 / 已用尝试 / 已完成文件 / 阻塞点 / 关键决策；阶段切换或中断时更新，旧记录缺新增字段从权威证据重建；wave 整组恢复仍以既有 wave-progress/v1 为准 |

---

## 完成判据

- [ ] 所有 `acceptance-criteria` 均已满足
- [ ] 不可视区 AC 的 `intent/oracle` 已落成测试且全绿；仅 `golden: true` 的 example 要求字面 1:1 物化
- [ ] 写代码前 freshness preflight 已通过并落 `timing: before-code` 记录；命中的规格/示例漂移均在代码开发前按 action 关闭
- [ ] layer 对应 checklist 的适用项已验证（backend 按实际改动选择契约、鉴权/边界、并发/副作用等验证，不逐类造测试；frontend 机械检查、可测逻辑与受影响视觉/交互分别验证）；不新增逐项空报告
- [ ] 集合内每个任务已通过独立证据审查；开发首审核本包兑现、受影响行为、有效证据，审查员独立触发相关专项；整改默认原审查员 targeted 接续，Foundation 使用专用 brief。新报告 bounded-v1 的结论与阻断一致；同快照 evidence_only 补证仍计 code_rounds 并遵守三轮上限，历史报告不回写
- [ ] 全量检测全绿（整合后 build/type/lint/test 覆盖集合全部改动）
- [ ] 已发现的组合缺口及证据已在 PR 遗留问题或补缝任务中移交；不打回独立合规的原包
- [ ] PR 已推，description 5 段完整（含偏离说明和遗留问题）
- [ ] **安全敏感改动**（权限/认证/数据隔离等四类）已有用户或其明确指定审批人的具体风险裁决（合并前唯一人工门；触及与否基于 diff 独立判定、不唯任务包 `risk` 自报，曾按 standard 范围审查的先补 sensitive 边界独审）
- [ ] **PR 已合并到 master**（task 状态 `[merged]`；`code_reviews[]` 已记录轮次、report 目录与证据版本；finding 路由在报告中可追溯）
- [ ] 已授权任务集全部收尾完成：状态与按 source 必需的追踪/反馈记录已提交，执行/审查/测试结果均已接收；不存在未完成的本轮必要动作。单元 `done` 或单个任务独审通过不等于 develop 完成

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `plan-sprint`（source=sprint） | 任务包（含 files / AC / reference 契约锚） | iterations/vN/queue/*.md |
| `draft-foundation`（source=foundation） | 走骨架设计（地基件清单 + 标杆切片）+ 地基蓝图 | iterations/v0/foundation-design.md + 项目根 foundation.md |
| `generate-integration-tests`（source=integration） | 失败联调场景 + 修复任务包 | iterations/vN/queue/*.md |
| `manual-test`（source=manual-test） | 验收问题 + 修复任务包 | iterations/vN/queue/*.md |
| `dispatch-new`（source=bug/optimization） | B 类任务包 | b-queue/*.md |
| `revise-doc`（影响任务包时） | 更新后的任务包或 项目约束变更说明 | iterations/vN/queue/{task-id}.md 或 b-queue/{task-id}.md 更新 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `generate-integration-tests`（source=sprint 全 [merged]） | 已合并到 master 的代码 | master 分支 |
| `manual-test` / 上游复测会话（source=integration/manual-test） | 已合并的修复代码 | master 分支 |
| `deploy`（hotfix [merged]） | 已合并的 hotfix | master 分支 |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/develop.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
