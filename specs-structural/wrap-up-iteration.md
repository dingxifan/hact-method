# task: wrap-up-iteration

**discipline**: `management`
**Gate**: G5（可选签于任务尾部）
**属性**: `version`

> G5 三步收尾：偏离对账 / feedback 审阅分流 / project.md 合并。可与 deploy 并行执行。

---

## 前置条件

- **Gate**：G4 已签
- **与 `deploy` 的关系**：无强依赖，可并行执行；部署失败不阻断收尾，两者结论独立
- **文件**：
  - `backlog.md`（偏离记录）
  - `feedback.md`（各阶段反馈）
  - `iterations/vN/prd.md` / `trd.md` / `standards-*.md`

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `version` | string | ✅ | 本期版本号，如 `v1` |

---

## 主要产物

| 产物 | 路径 | 说明 |
|------|------|------|
| 反向更新的 PRD / TRD（如有偏离） | `iterations/vN/prd.md` / `trd.md` | 通过 `revise-doc` task 执行 |
| 更新的 decisions.md | `decisions.md` | 实现细节偏离的沉淀 |
| 誊入个人 notes 的反馈条目 | `../hact-notes-{name}/notes.md` | feedback 分流：`[规范]`/`[checklist]`/`[方法论]`，由 harvest-notes 后续上提 |
| 清空的 feedback.md | `feedback.md` | 分流完成后清空 |
| 更新的 project.md | `project.md` | 本期最终状态快照 |
| G5 签字 | `iterations/vN/gates.md` | `- [x] G5：迭代收尾完成 — YYYY-MM-DD` |

---

## 完成判据

- [ ] 第一步：backlog `[偏离]` 条目全部处理（创建 revise-doc 或记入 decisions.md）
- [ ] 第二步：feedback.md 每条已分流，文件已清空
- [ ] 第三步：project.md 反映本期最终状态，无"开发中"标注
- [ ] 完成判据已冷核（陌生 subagent 逐条核对，凭证存于 `iterations/vN/gate-checks/G5.md`，人已抽看；见 `skeleton/06-gates.md` §7）
- [ ] G5 已签（`gates.md` 已记录 + commit）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `manual-test` | G4 已签 | `gates.md` |
| 本期所有 task | 积累的 backlog `[偏离]` + feedback | `backlog.md` / `feedback.md` |

**输出给**

| 下游 task / 目的地 | 交接内容 | 格式 |
|---|---------|------|
| `revise-doc`（如有偏离） | 偏离需反向更新的文档 | 新建 task |
| 执行人 hact-notes | feedback 分流的规范 / checklist / 方法论条目 | 誊入个人 notes 打标签 |
| `harvest-notes`（下游） | 个人 notes 的可上提条目 | 由管理者收割上提公共层 |
| 下一期 `draft-prd-vN` | 迭代正式闭环，可启动下一期 | G5 已签 |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/wrap-up-iteration.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
