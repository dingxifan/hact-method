# task: revise-doc

**discipline**: 派生于 `target`——`prd` → `product`；`trd` / `standards` → `architecture`
**Gate**: —
**属性**: `target` · `reason`

> 修订一份已签 Gate 的产物文档（PRD / TRD / standards），记录原因，通知下游。

---

## 前置条件

- **触发场景**（任一即可创建本 task）：
  - `develop` 执行中发现实现与 TRD / standards 有实质偏离，无法自行决策
  - `develop` 内置独立审查 loop 反复揪出阻断、根因在 TRD / standards 层（审查超界升级）
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

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 修订后的目标文档 | `iterations/vN/prd.md` / `trd.md` / `standards-*.md` | 原文件直接修改，commit 记录变更 |
| backlog 修订条目 | `backlog.md` | `- [修订] {日期} \| target={target} \| {改了什么} \| 原因：{reason}` |
| 级联 revise-doc 任务包（PRD 修订影响 TRD 时） | `iterations/vN/queue/{task-id}.md` | revise-doc(target=trd) 任务包 |
| 受影响的 develop 任务包更新（trd/standards 修订影响 queue 时） | `iterations/vN/queue/{task-id}.md` | 在任务包备注「已修订，请重新拾取」 |
| 新 develop 任务包（修订影响已 [merged] PR 时） | `iterations/vN/queue/{task-id}.md` | source=sprint，说明需修正已合并代码 |
| feedback.md 条目（同一文件被多次修订时） | `feedback.md` | `{日期} \| {发现} \| 建议在 {任务} 阶段加强 {环节}` |

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
| `develop` | 发现 TRD / standards 有歧义，偏离记录触发修订；或内置独立审查 loop 超界、根因在文档层 | backlog `[偏离]` 条目 / 审查 finding |
| `manual-test` | 验收失败根因在 PRD 定义 | 验收报告条目 |
| 用户 | 主动要求修订 | 对话 |
| `wrap-up-iteration` | 偏离对账时发现 backlog `[偏离]` 需反向更新文档 | backlog.md `[偏离]` 条目 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（受影响的） | 更新后的任务包或 standards 变更说明 | `iterations/vN/queue/{task-id}.md` 更新 |
| `revise-doc(target=trd)`（级联） | 当 PRD 修订影响接口/数据结构时创建 | 新 task |
| `wrap-up-iteration` | backlog 的 `[修订]` 条目（收尾时对账用） | `backlog.md` |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/revise-doc.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
