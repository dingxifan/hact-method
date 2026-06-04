# task: pr-review

**discipline**: `review`
**Gate**: —
**属性**: `pr-links` · `layers`（从 PR 改动文件派生）

> 批量复核若干个 develop PR：对照 standards 和 checklist 给出反馈，决定通过或打回。

---

## 前置条件

- **触发**：一个或多个 develop PR 处于待审状态（develop task 状态为 [done]，PR 未合并）
- **无 Gate 前置**：pr-review 可随时创建，不等 sprint 全部完成
- **最晚触发点**：所有 source=sprint 的 develop 任务完成后，在创建 `generate-integration-tests` 之前，确保所有 PR 已经过 pr-review

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `pr-links` | URL[] | ✅ | 本次批量审查的所有 PR 链接，≥1 个 |
| `layers` | enum[] | ✅ | 从各 PR 改动文件路径推断：`.vue/.tsx/.css` 等 → `frontend`；controller/service/module 等 → `backend`；混合 → `[frontend, backend]` |

**layers 推断规则**：

| 改动文件特征 | layer |
|---|---|
| 仅前端文件（`.vue`、`.tsx`、`.css`、`components/`、`pages/` 等） | `frontend` |
| 仅后端文件（`controller`、`service`、`module`、`entity`、`.dto.ts` 等） | `backend` |
| 前后端文件混合 | `[frontend, backend]`，两份 checklist 都用 |
| 仅配置/文档文件 | `null`，跳过 checklist，只核对 PR description 完整性 |

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 各 PR 的 review comment + 决定 | 代码仓库各 PR | Markdown，含 [阻断]/[建议] 标记 |
| sprint.md CR 结论备注 | `iterations/vN/sprint.md` | 在对应行追加 `CR:通过` 或 `CR:打回(原因)` |
| backlog.md [CR-建议]条目（有建议时写入） | `backlog.md` | `- [ ] {日期} \| [CR-建议] {描述} \| {文件路径}` |
| feedback.md 条目（发现共性问题时写入） | `feedback.md` | `{日期} \| {发现的问题模式} \| 建议更新到 {standards 文件哪节}` |

---

## 完成判据

- [ ] `pr-links` 中每个 PR 都有 review comment + 明确决定（通过 / 打回）
- [ ] 所有 `[阻断]` 问题已在 comment 中列出，说明原因
- [ ] sprint.md 已更新各 PR 的 CR 结论
- [ ] 通过的 PR 已通过平台 merge API 合并，对应 develop task 状态已推 [merged]

> **注意**：pr-review task 的 [done] = 结论写入 PR。PR 合并是 develop task 进入 [merged] 的触发点，两者独立。

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（一个或多个） | PR（代码改动 + description，含 AC 验证 / 偏离说明 / 遗留问题） | 代码仓库 PR |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（打回的） | `[阻断]` 反馈列表，develop 回 [可取] 重做 | PR comment |
| `generate-integration-tests` | 所有 PR 已通过 CR + 合并，可进入联调 | sprint.md CR 结论全部为"通过" |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/pr-review.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
