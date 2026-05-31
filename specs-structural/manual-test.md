# task: manual-test

**discipline**: `product`
**Gate**: G4（可选签于任务尾部）
**属性**: 无

> 提供测试环境，由用户主导验收，收集反馈派修复任务，用户明确通过后签 G4。

---

## 前置条件

- **触发**：`generate-integration-tests` 三条件全部满足（联调清单全有结论 / 主流程无阻断 / backlog 已分级）
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
| 验收报告 | `iterations/vN/acceptance-report.md` | 见下方格式 |
| G4 签字 | `iterations/vN/gates.md` | `- [x] G4：验收通过 — YYYY-MM-DD` |
| 修复任务包（如有） | `iterations/vN/queue/{task-id}.md` | 见 develop.md §字段规范 |
| backlog.md 条目（范围外问题） | `backlog.md` | 标注「超出本期范围，留下期」 |
| 进度跟踪 | `_meta/sessions/manual-test-progress.md` | 本轮派发任务清单 + 历史轮次 + 当前状态 |
| feedback.md 条目（发现共性问题时） | `feedback.md` | `{日期} \| {发现} \| 建议更新到 {文件哪节}` |

**验收报告格式：**

```markdown
# 验收报告 · vN · {项目名}

## 验收结论
通过

## Acceptance Criteria 验证
| AC | 描述 | 状态 |
|----|------|------|
| AC-1 | {描述} | ✅ 通过 |
| AC-2 | {描述} | ✅ 通过（修复后通过） |

## 问题记录
| # | 现象 | 复现步骤 | 处理结果 |
|---|------|---------|---------|
| 1 | {描述} | {步骤} | 已修复（{task-id}） |
| 2 | {描述} | {步骤} | 记入 backlog |

## 验收通过日期
{YYYY-MM-DD}
```

---

## 完成判据

- [ ] 用户明确说「验收通过」（不得由 AI 自行判断）
- [ ] 所有用户反馈问题已处理：修复或有明确结论（记入 backlog 的须已分级）
- [ ] 所有 develop(source=manual-test) 任务已 [merged]
- [ ] 验收报告已写，结论为"通过"
- [ ] G4 已签（`gates.md` 已记录 + commit）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `generate-integration-tests` | 联调三条件满足，测试环境可用 | 测试结果记录 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（source=manual-test） | 验收问题修复任务包 | `iterations/vN/queue/{task-id}.md` |
| `deploy` | G4 已签，可部署 | `gates.md` |
| `wrap-up-iteration` | G4 已签，可并行启动收尾 | `gates.md` |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/manual-test.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
