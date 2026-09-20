# task: manual-test

**discipline**: `product`
**Gate**: G4（可选签于任务尾部）
**属性**: 无

> 提供测试环境，由用户主导验收，收集反馈派修复任务，用户明确通过后签 G4。

---

## 前置条件

- **触发**：`integration-verify` / System Verification 完成判据满足，两条 assurance lane 对同一 final candidate 成立且无未解决 system obligation；补缝任务仅已派发不算完成
- **文件**：
  - `iterations/vN/prd.md`（acceptance criteria，验收基准）
  - `integration-tests/result-{日期}.md`（联调结果，用于向用户说明当前状态）

---

## 字段规范

本 task 无特有属性字段。

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 验收报告 | `iterations/vN/acceptance-report.md` | 见 `../hact-method-lab/templates/acceptance-report.md` |
| G4 签字 | `status.yml iterations.vN.gates` | `iterations.vN.gates.G4: { signed: true, date: YYYY-MM-DD }` |
| 修复任务包（如有） | `iterations/vN/queue/{task-id}.md` | 见 develop.md §字段规范 |
| backlog.md 条目（范围外问题） | `backlog.md` | 标注「超出本期范围，留下期」 |
| 进度跟踪 | `_meta/sessions/manual-test-progress.md` | 本轮派发任务清单 + 历史轮次 + 当前状态 |
| feedback.md 条目（发现共性问题时） | `feedback.md` | `{日期} \| {发现} \| 建议更新到 {文件哪节}` |

---

## 完成判据

- [ ] 用户明确说「验收通过」（不得由 AI 自行判断）
- [ ] 所有用户反馈问题已处理：修复或有明确结论（记入 backlog 的须已分级）
- [ ] 本期 backlog `[欠账]` 条目已逐条交用户定夺（本期补 / 留下期），无一条静默带过 —— 这是开发期发现的缺口在 G4 前唯一的出口
- [ ] 验收报告 AC 验证表的「验证来源」如实标注：不可视区 AC 取自脊柱+联调测试结果（不重复人工核对正确性）、可视区/业务 AC 经人工验收；全表仍列全 PRD 每条 AC 做完备性对账
- [ ] 【linter】所有 develop(source=manual-test) 任务已 [merged]（`check-gate.js G4` 核 status.yml）
- [ ] 【linter】验收报告已写，结论为"通过"（`check-gate.js G4` 核）
- [ ] 完成判据已核对（`check-gate.js G4` 退出码 0 + 语义残量人签；存量无脚本退回 `skeleton/06-gates.md` §7 G4/G5 段人工逐条核对兜底，不额外派隔离单元）
- [ ] G4 已签（`status.yml` 已记录 + commit）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `integration-verify` | System Review 与 Runtime Verification 完成判据满足，测试环境可用 | system-review lineage + integration result |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（source=manual-test） | 验收问题修复任务包 | `iterations/vN/queue/{task-id}.md` |
| `deploy` | G4 已签，可部署 | `status.yml` |
| `wrap-up-iteration` | G4 已签，可并行启动收尾 | `status.yml` |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/manual-test.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
