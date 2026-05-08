# task: revise-doc

**discipline**: 派生于 `target`——`prd` → `product`；`trd` / `standards` → `architecture`
**Gate**: —
**属性**: `target` · `reason`

> 修订一份已签 Gate 的产物文档（PRD / TRD / standards），记录原因，通知下游。

---

## 前置条件

- **触发场景**（任一即可创建本 task）：
  - `develop` 执行中发现实现与 TRD / standards 有实质偏离，无法自行决策
  - `code-review` 发现问题根因在 TRD / standards 层，不是实现问题
  - `manual-test` 发现验收失败根因在 PRD 定义有歧义
  - 用户主动要求修订某文档
- **原则**：已签 Gate 不撤销，只记录变更；修订不影响 Gate 签字状态

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `target` | enum | ✅ | `prd` / `trd` / `standards`（决定 discipline 和修订对象） |
| `reason` | string | ✅ | 修订原因：触发来源 + 具体问题（如"develop task-003 发现接口响应字段缺失"） |

---

## 工作内容

1. **读原文档**：读待修订文档的当前版本，定位需要修改的段落
2. **修订内容**：按 `reason` 所述问题做最小化修订，不扩大范围
3. **记入 backlog**：在 `backlog.md` 追加 `[修订]` 条目，说明改了什么 + 原因
4. **判断下游影响**：
   - `target=prd`：是否影响 TRD 的接口 / 数据结构 → 若是，同时创建 `revise-doc(target=trd)`
   - `target=trd`：是否影响已派发的任务包 → 若是，更新 queue 中对应任务包，通知相关 develop task 重新拾取
   - `target=standards`：是否影响已在进行的 develop task → 若是，在对应任务包 `relevant-standards` 字段追加变更说明
5. **commit**：`git commit -m "fix(doc): {修订内容摘要} [{项目名}]"`

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 修订后的目标文档 | `iterations/vN/prd.md` / `trd.md` / `standards-*.md` | 原文件直接修改，commit 记录变更 |
| backlog 修订条目 | `backlog.md` | `- [修订] {日期} \| {改了什么} \| {原因}` |

---

## 完成判据

- [ ] 目标文档已修订，内容最小化（未扩大范围）
- [ ] backlog 已追加 `[修订]` 条目，说明完整
- [ ] 下游影响已判断：受影响的任务包 / task 已通知或更新
- [ ] 变更已 commit（commit message 包含修订原因）

---

## 接口约定

**输入来自**

| 上游 task | 触发场景 | 格式 |
|-----------|---------|------|
| `develop` | 发现 TRD / standards 有歧义，偏离记录触发修订 | backlog `[偏离]` 条目 |
| `code-review` | 发现问题根因在文档层 | PR comment 中的 `[阻断]` 反馈 |
| `manual-test` | 验收失败根因在 PRD 定义 | 验收报告条目 |
| 用户 | 主动要求修订 | 对话 |
| `wrap-up-iteration` | 偏离对账时发现 backlog `[偏离]` 需反向更新文档 | backlog.md `[偏离]` 条目 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（受影响的） | 更新后的任务包或 standards 变更说明 | `queue/{task-id}.md` 更新 |
| `revise-doc(target=trd)`（级联） | 当 PRD 修订影响接口/数据结构时创建 | 新 task |
| `wrap-up-iteration` | backlog 的 `[修订]` 条目（收尾时对账用） | `backlog.md` |

---

## 边界场景

| 场景 | 处理方式 |
|------|---------|
| 修订内容影响已合并的 develop PR（[merged] 状态） | 创建新的 develop task（source=sprint，urgency 按影响程度定）修复已合并代码；不回滚已合并 PR |
| PRD 修订导致 TRD 需要同步修改 | 立即串行创建 `revise-doc(target=trd)`，在当前 task 完成判据中标注"已创建级联修订" |
| standards 修订涉及已完成但未合并的 develop PR | 在对应 PR comment 补充说明 standards 变更，由 code-review 判断是否需要修改代码 |
| 修订范围有争议（用户和 AI 对改动边界看法不同） | 以最小化改动为准，超出部分记入 backlog 留下期处理 |
| 同一文档短期内被多次修订 | 检查是否根因在上游（PRD 定义质量问题 / TRD 覆盖不完整）；超过 2 次则在 backlog 记录风险，`wrap-up-iteration` 时做方法论反馈 |

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| 修订内容涉及已签 Gate 的核心定义（如接口 schema 大幅变动） | 不静默修改；在 backlog 标注并上报，等用户确认修订边界后再动手 |
| 级联修订（PRD→TRD→任务包）链条过长 | 先完成当前 task，再依次创建下游修订 task；不在一个 task 里同时改多份文档 |
| 修订后发现同期其他 develop 任务也受影响但状态已 [merged] | 记入 backlog `[偏离]`，留 `wrap-up-iteration` 做偏离对账处理 |
