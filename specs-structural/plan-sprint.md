# task: plan-sprint

**discipline**: `dispatch`
**Gate**: G3（可选签于任务尾部）
**属性**: 无

> 读 TRD 拆分 develop 任务，写任务包入 queue，输出 sprint.md，签 G3。

---

## 前置条件

- **Gate**：G2 已签（TRD + 三份 standards 就位）
- **文件**：
  - `iterations/vN/prd.md`（AC 来源，任务包 AC 须能回链到此）
  - `iterations/vN/trd.md`
  - `iterations/vN/standards-shared.md` / `standards-frontend.md` / `standards-backend.md`
  - `reusables.md`（了解可复用资产，避免任务包重复指派已有实现）

---

## 字段规范

本 task 无自身特有属性。其产物（develop 任务包）的字段规范见 `specs-structural/develop.md §字段规范`。

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 各 develop 任务包 | `iterations/vN/queue/{task-id}.md`（每个任务独立一个文件） | 见 develop.md §字段规范（17 字段） |
| sprint.md | `iterations/vN/sprint.md` | 见下方格式说明 |
| G3 签字 | `iterations/vN/gates.md` | `- [x] G3：开发包就绪 — YYYY-MM-DD` |
| 进度断点（compact 时写入） | `_meta/sessions/plan-sprint-progress.md` | 任务骨架表（task-id / 标题 / layer / 依赖）+ 疑点清单答案摘要 |

**sprint.md 格式：**

```markdown
# Sprint vN · {项目名}

| task-id | title | layer | 依赖 | 状态 | PR | 交付 |
|---------|-------|-------|------|------|----|------|
| task-001 | {标题} | backend | — | [可取] | — | 独立 |
| task-002 | {标题} | backend | — | [可取] | — | 批量 |
| task-003 | {标题} | frontend | task-001 | [可取] |

## 依赖说明
- task-003 blocked-by task-001：{原因}
```

**任务包命名规则**：`{task-id}` 格式为 `{项目缩写}-{vN}-{序号}`，如 `auth-v1-001`。

---

## 完成判据

- [ ] 疑点清单已输出，用户逐条确认，无未解决疑点
- [ ] TRD 每个模块都有对应的 develop 任务包
- [ ] **【linter】** 所有任务包 17 字段完整，无空字段（`check-sprint.js` 字段完备）；`layers=[backend]` 且有前端消费的任务包 `api-contract` 已填写（presence 由 linter 验，字段结构正确性经用户确认）
- [ ] **【linter】** 字段保真自检通过：`reference` 每条含行号（拒"全文"/无范围）；前端任务 reference 含 ux-flows 行号条目；后端任务 reference 含 TRD 行号条目
- [ ] **【linter】** AC 正向回链 + 逐条反向覆盖：每条任务包 AC 带 `(源：PRD AC-nn)` 或 `(技术)` tag、回链 id 在 PRD 存在，且 PRD 每条 AC（AC-nn）被某任务包 AC 引用（逐条覆盖机械核；逐条**忠实性**仍留 Step 3.5 独审 + 签字人）
- [ ] 任务包独立对抗审查通过（AC忠实性 / AC完备性 / api-contract / relevant-standards覆盖 四类无 [阻断]，或阻断已修复 / 已转 revise-doc）
- [ ] **【linter】** 依赖关系已标注（任务包 `depends_on` 在册，无依赖填 `[]`）
- [ ] 每个任务的 `交付` 列已填（`独立` 或 `批量`），判断理由已向用户说明并确认
- [ ] **【linter】** sprint.md 已写，queue↔sprint.md↔status.yml 三方一致（`check-sprint.js` 三方一致）
- [ ] 完成判据已核对（`check-sprint.js` 退出码 0 + `🧑` 段语义残量人签；存量项目无脚本则退回 `skeleton/06-gates.md` §7 G3 段人工逐条核对）
- [ ] G3 已签（`gates.md` 已记录 + commit）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `draft-tech-design` | TRD + 三份 standards，G2 已签 | `iterations/vN/trd.md` + `standards-*.md` |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（多个） | 任务包（[可取] 状态） | `iterations/vN/queue/{task-id}.md` |
| `pr-review` | sprint.md（用于追踪 PR 状态） | `iterations/vN/sprint.md` |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/plan-sprint.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
