# task: draft-tech-design

**discipline**: `architecture`
**Gate**: G2（可选签于任务尾部）
**属性**: `version`

> 读 PRD 输出疑点清单，确认后写 TRD + 三份 standards，签 G2。

---

## 前置条件

- **触发**：G1 已签，`iterations/vN/prd.md` 已存在
- **Gate**：G1 未签则阻断
- **draft-ux 前置**：PRD 中有任何功能标记 `draft-ux: 需要`，且 `iterations/vN/prototype.html` 不存在 → 阻断，提示先完成 `draft-ux`
- **文件**：`project.md`（了解技术约束和已有决策）；`reusables.md`（了解已有共享组件，避免重复建议）

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `version` | string | ✅ | 与 `draft-prd-vN` 同一版本号 |

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| TRD | `iterations/vN/trd.md` | Markdown，套结构化模板 `templates/trd.md`（固定 7 段 header + `### 表：` + `### 接口：` + 槽位，供 `scripts/check-docs.js` 解析与交叉对账） |
| 共享规范 | 项目根 `standards-shared.md` | Markdown；**项目级跨迭代活文档**（非迭代内产物）；v1 播种自 `templates/standards/`，vN+1 在同文件原地增补 |
| 前端规范 | 项目根 `standards-frontend.md` | 同上 |
| 后端规范 | 项目根 `standards-backend.md` | 同上（含「测试框架约定」节） |
| G2 签字 | `iterations/vN/gates.md` | `- [x] G2：TRD 已确认 — YYYY-MM-DD` |
| decisions.md 更新 | `decisions.md` | 表格追加：决策 / 原因 / 日期 |
| project.md 更新（技术层） | `project.md` | 追加或更新技术层内容 |
| 进度断点（compact 时写入） | `_meta/sessions/draft-tech-design-progress.md` | 疑点清单答案摘要 + TRD 骨架（接口列表 / 模块划分 / 共享组件） |

**TRD 必含段落：**

| 段落 | 说明 |
|------|------|
| 技术选型变更 | 仅写本期新增依赖；格式：依赖 / 用途 / 选型理由；迭代项目不重复已有选型 |
| 数据库设计 | 每表用固定 header `### 表：{表名}` 分块（表名与 PRD `涉及实体` 同名同形）；含字段约束 / 索引 / 外键 / 唯一性；PRD 每个数据实体必须有对应表 |
| 接口设计 | 仅本期新增接口；每接口用固定 header `### 接口：{方法} {路径}`；含请求体 / 响应体 / 错误码 / 服务流程 / `# 满足 AC` 回链；**把 PRD 的不可视区 AC 行为例子精化为技术精确规格**（测试脊柱幕 2：补状态码/错误码/断言，供 develop 物化成测试；不在 TRD 预写 runnable 文件） |
| 测试环境约定 | **不可省略**：后端地址 / 前端访问方式 / 数据库指向 / 有副作用操作的禁止清单 |
| 交互技术方案 | PRD 交互中有技术含义的部分（轮询 vs WebSocket / 复杂状态流转 / 跨模块数据共享等） |
| 模块拆分 | 前后端各自的模块划分，明确各模块职责边界 |
| 共享组件建议 | 表格：资产 / 性质 / 涉及模块 / 建议路径；参照 `reusables.md` 避免重复建议 |

---

## 完成判据

> 标 **【linter】** 的判据由 `scripts/check-docs.js` 确定性机械核（draft-tech-design Step 4 跑，含 PRD↔TRD 两条交叉对账）——机械判据的最终判定。未标的是**语义判据**（载体真承接 AC、精化例子忠实 PRD 行为例子），由 Step 5 末端内容审查（陌生视角 subagent）+ 签字人复核 + pr-review 技术保真把关。

- [ ] 疑点清单已输出，用户逐条确认，无未解决疑点
- [ ] **【linter】** TRD 7 个段落全部存在，无空段
- [ ] **【linter】** PRD 中每个数据实体（功能 `涉及实体`）在数据库设计中有对应 `### 表：{名}`（交叉对账）
- [ ] **【linter】** PRD 每条 `AC-nn` 都被 TRD 某载体 `# 满足 AC` 回链承接，且无悬空回链（逐条正向+反向，交叉对账；存量旧格式退人工兜底）
- [ ] **【linter·存在】** 测试环境约定段落存在且非空（"完整"由人核）
- [ ] 不可视区 AC 的 PRD 行为例子已精化为技术精确的可执行规格（补状态码/错误码/断言，测试脊柱幕 2），且回链的载体**真承接**对应 AC（内容真覆盖、非仅 id 在场）（语义判据，Step 5 末端审查 + 签字人核）
- [ ] Step 5 独立内容审查已跑、问题清单已与用户处理（陌生视角验内部一致性 / AC 真承接 / 字段满足画面 / 覆盖，linter 兜不住的内容残量；subagent 失败则主线自审降级）
- [ ] 三份 standards 已输出（shared / frontend / backend）
- [ ] decisions.md 已追加本期架构决策
- [ ] project.md 技术层已更新
- [ ] 【linter】判据 `check-docs.js` 全绿（退出码 0，含 PRD↔TRD 实体↔表 + AC↔回链两条交叉对账）+ 语义判据签字人已确认（见 `skeleton/06-gates.md` §7；存量项目无 linter 时退回人工逐条核对兜底，无 subagent）
- [ ] G2 已签（`gates.md` 已记录 + commit）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `draft-prd-vN` | 定稿 PRD，G1 已签 | `iterations/vN/prd.md` |
| `draft-ux`（条件性） | 交互流程图 + HTML 原型；PRD 有 `draft-ux: 需要` 时必须存在 | `iterations/vN/ux-flows.md` + `iterations/vN/prototype.html` |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `plan-sprint` | TRD + 三份 standards，G2 已签 | `iterations/vN/trd.md` + 项目根 `standards-*.md` |
| `revise-doc`（如有修订） | TRD / standards 被标记为待修订 | backlog `[修订]` 条目 |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/draft-tech-design.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
