# task: code-review

**discipline**: `review`
**Gate**: —
**属性**: `pr-links` · `layer`（从 PR 改动文件派生）

> 批量复核若干个 develop PR：对照 standards 和 checklist 给出反馈，决定通过或打回。

---

## 前置条件

- **触发**：一个或多个 develop PR 处于待审状态（develop task 状态为 [done]，PR 未合并）
- **无 Gate 前置**：code-review 可随时创建，不等 sprint 全部完成
- **最晚触发点**：所有 source=sprint 的 develop 任务完成后，在创建 `generate-integration-tests` 之前，确保所有 PR 已经过 code-review

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `pr-links` | URL[] | ✅ | 本次批量审查的所有 PR 链接，≥1 个 |
| `layer` | enum[] | ✅ | 从各 PR 改动文件路径推断：`.vue/.tsx/.css` 等 → `frontend`；controller/service/module 等 → `backend`；混合 → `[frontend, backend]` |

**layer 推断规则**：

| 改动文件特征 | layer |
|---|---|
| 仅前端文件（`.vue`、`.tsx`、`.css`、`components/`、`pages/` 等） | `frontend` |
| 仅后端文件（`controller`、`service`、`module`、`entity`、`.dto.ts` 等） | `backend` |
| 前后端文件混合 | `[frontend, backend]`，两份 checklist 都用 |
| 仅配置/文档文件 | `null`，跳过 checklist，只核对 PR description 完整性 |

---

## 工作内容

1. **读 PR diff + PR description**：逐个读取 `pr-links` 中的 PR；确认 description 包含完整 5 段（task-id / 改动摘要 / AC 验证 / 偏离说明 / 遗留问题）；重点核查「偏离说明」——有改动超出 `files` 清单的文件需额外审查；核查「遗留问题」——已知缺陷是否已记入 backlog
2. **确定 layer**：按推断规则确定本次需要加载哪份 checklist
3. **对照 standards**：核对 `standards-shared.md` + `standards-{layer}.md` 的相关章节，检查代码是否遵守
4. **逐条过 checklist**：
   - `layer` 含 `backend` → 过 backend-checklist（DB Schema / API 错误码 / 权限校验 / 并发安全 / 静默失败防御）
   - `layer` 含 `frontend` → 过 responsive-checklist（断点适配 / 触控尺寸 / 事件处理 / XSS 防护）
5. **写反馈**：每个 PR 独立写 review comment，问题分两级：
   - `[阻断]`：必须修复才能合并
   - `[建议]`：可接受，建议下期处理
6. **给出决定**：每个 PR 独立决定——
   - **通过**：调平台 merge API 直接合并，develop task 状态推 [merged]
   - **打回**：在 PR comment 中列出所有 `[阻断]` 问题，develop task 回 [可取]
7. **简单 bug 直修**（满足全部条件时可选）：见"边界场景"
8. **更新 sprint.md**：在对应 develop 任务行备注 CR 结论（通过已合并 / 打回原因）

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 各 PR 的 review comment + 决定 | 代码仓库各 PR | Markdown，含 [阻断]/[建议] 标记 |
| sprint.md CR 结论备注 | `iterations/vN/sprint.md` | 在对应行追加 `CR:通过` 或 `CR:打回(原因)` |

---

## 完成判据

- [ ] `pr-links` 中每个 PR 都有 review comment + 明确决定（通过 / 打回）
- [ ] 所有 `[阻断]` 问题已在 comment 中列出，说明原因
- [ ] sprint.md 已更新各 PR 的 CR 结论
- [ ] 通过的 PR 已通过平台 merge API 合并，对应 develop task 状态已推 [merged]

> **注意**：code-review task 的 [done] = 结论写入 PR。PR 合并是 develop task 进入 [merged] 的触发点，两者独立。

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

## 边界场景

| 场景 | 处理方式 |
|------|---------|
| 多个 PR 的 layer 混合（部分 frontend、部分 backend） | 按各 PR 各自的 layer 加载对应 checklist，不混用 |
| PR description 缺失任意必填段落（task-id / AC 验证 / 偏离说明 / 遗留问题） | 视为 `[阻断]`，要求补充后重新提交 |
| **简单 bug 直修**：改动 ≤5 行 + 原因显而易见 + 非业务逻辑（配置笔误、空指针防御等） | CR 人直接修改并合并，原 PR comment 注明「已直修」。无需新 PR，无需他人 review |
| `layer=null`（仅配置/文档改动） | 跳过 checklist，只核对 PR description 完整性 + 无凭据泄露 |
| 同一批次有 PR 需要打回、有 PR 可以通过 | 各自独立决定，不因为有打回就阻塞可通过的 PR |
| sprint 全部 PR 已通过但某个有 `[建议]` 未处理 | 不阻断合并，将 `[建议]` 写入 backlog.md 并标记 `[CR-建议]`，联调阶段统一处理 |

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| 同一 PR 被打回 3 次仍有相同 `[阻断]` 问题 | 停止反复 review，上报，判断是否需要 `revise-doc` 或重新设计 |
| CR 发现问题根因在 TRD/standards 层（不是实现问题） | 打回 PR，同时创建 `revise-doc` 任务；等 revise-doc 完成后 develop 重做 |
| 发现凭据出现在代码或 PR description 中 | 立即要求 develop 执行人撤销凭据 + 重写 commit history，合并前必须清理 |
| PR 涉及安全敏感改动（权限/认证/数据隔离）但 review 人无相关 discipline | 上报，等待有 `architecture` discipline 的人介入后再决定 |
