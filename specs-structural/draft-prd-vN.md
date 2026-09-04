# task: draft-prd-vN

**discipline**: `product`
**Gate**: G1（可选签于任务尾部）
**属性**: `version`

> 捕获本期用户故事和 acceptance criteria，输出 PRD，签 G1。

---

## 前置条件

- **触发**：A 类需求到来，项目已初始化（`iterations/` 目录存在）
- **迭代项目**：读取 `project.md` 了解已有产品现状，不重复已有内容
- **无 Gate 前置**：draft-prd-vN 是流程起点，无上游 Gate 要求
- **B 类任务**（需求已明确的 bug / 优化）：跳过本 task，直接走 `dispatch-new`
- **[v2+] 迭代目录**：首次开始新迭代（vN，N ≥ 2）时，在会话启动阶段与用户确认后创建 `iterations/vN/queue/done`；首期 v1 由 `init-project` 预创建，无需本 task 处理

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `version` | string | ✅ | `v1` / `v2` / …；与本期 TRD、sprint 文件版本号一致 |

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| [v2+] 迭代目录结构 | `iterations/vN/queue/done/` | 目录；仅 v2+ 创建，v1 由 `init-project` 预创建 |
| PRD | `iterations/vN/prd.md` | Markdown，套结构化模板 `templates/prd.md`（固定 6 段 header + 功能块 `### 功能：` + 槽位，供 `scripts/check-docs.js` 解析） |
| V0 as-built 证据账本（走过 V0 时） | `iterations/vN/as-built-ledger.md` | 只列本期触及事实的设计声明、实际路径/符号锚、观察、关系与动作；模板 `templates/as-built-ledger.md` |
| G1 签字 | `iterations/vN/gates.md` | `- [x] G1：PRD 已确认 — YYYY-MM-DD` |
| project.md 更新（产品层） | `project.md` | 追加或更新产品层内容 |
| 进度断点（compact 时写入） | `_meta/sessions/draft-prd-progress.md` | 已确认功能清单 + 骨架描述 + 排除项 |

**PRD 必含段落：**

| 段落 | 说明 |
|------|------|
| 产品目标 | 一句话，聚焦本期价值主张 |
| 目标用户 | 画像 + 核心痛点（对应三角 D） |
| 核心功能 | 每个功能（块 header `### 功能：`）：入口 + draft-ux + 涉及实体 + 场景描述 + acceptance criteria + 明确排除 |
| 用户故事 | 3–5 个，覆盖核心场景 |
| MVP 边界 | 明确"不做什么"及原因 |
| 开放问题 | 定稿前需解决的问题列表；定稿时应为空 |

---

## 完成判据

> 标 **【linter】** 的判据由 `scripts/check-docs.js` 确定性机械核（draft-prd-vN Step 7.4 跑）——这就是该判据的最终判定，PRD 不再额外派隔离单元冷核。**【linter·非空】/【linter·枚举】** 是受限标签：linter 只核机械部分（槽位非空 / 取值合法），括注里的语义部分仍由签字人核。未带 linter 标的是纯**语义判据**，由签字人（产品）确认。

- [ ] 场景还原完整（5 要素齐全）
- [ ] 三角评估已逐功能完成
- [ ] **【linter】** PRD 6 个段落全部存在，无空段
- [ ] **【linter】** "开放问题"段落为空（全部已解决）
- [ ] **【linter·非空】** 每个功能已填 `入口` 槽位（是否"明确指向触发来源"由人核）
- [ ] **【linter·枚举】** 每个功能 `draft-ux` 取值合法（∈ {需要, 不需要}）；**含新页面或多分支交互流程的功能是否应标 `需要`，由人核**（linter 只验枚举，不验该不该是"需要"）
- [ ] **【linter】** 每个功能已标注 `涉及实体`（读写的数据实体，逗号分隔；纯展示写"无"）
- [ ] **【linter】** 每个功能至少 1 条 Acceptance Criteria
- [ ] 每条有行为的 AC 已拆 `intent + oracle`；example 可选且与 oracle 一致，不把例子当高于判据的真值
- [ ] 有新页面 / 新交互 / ≥3 个状态：已在 acceptance criteria 中覆盖交互规格
- [ ] project.md 产品层已更新
- [ ] **【linter】** 走过 V0 时 `as-built-ledger.md` 存在、至少一条本期相关事实、证据含路径/符号锚，漂移/未知均有处置动作
- [ ] 【linter】判据 `check-docs.js` 全绿（退出码 0）+ 语义判据签字人已确认（见 `skeleton/06-gates.md` §7；存量项目无 linter 时退回人工逐条核对兜底，不额外派隔离单元）
- [ ] 末端独立内容审查已过（draft-prd-vN Step 7.5 派隔离审查单元审内容有效性：一致性 / AC 可验性 / 覆盖完整；输出问题清单已处理）——语义判据，签字人确认；"是否用户真要的"归用户（design §10），审查单元不判
- [ ] G1 已签（`gates.md` 已记录 + commit）

---

## 接口约定

**输入来自**

| 上游 | 交接内容 | 格式 |
|------|---------|------|
| 用户（需求方） | 需求描述（口头 / 文字） | 对话 |
| `init-project` | 项目目录结构就位 | `{项目}/` 根目录 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `draft-tech-design` | 定稿 PRD + G1 已签 | `iterations/vN/prd.md` |
| `revise-doc`（如有修订） | PRD 被标记为待修订 | backlog `[修订]` 条目 |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/draft-prd-vN.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
