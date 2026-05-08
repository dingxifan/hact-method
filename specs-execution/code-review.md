# exec: code-review

> CC 加载本文时，当前任务是批量审查若干个 develop PR：对照 standards 和 checklist 给出反馈，决定通过或打回。
> 一次 code-review task 可覆盖多个 PR，但每个 PR 独立决定。

**上下文密度**：中。每个 PR 读 diff + description + 对应 standards 章节，不全量加载。

---

## 步骤追踪协议

每步完成后输出：
```
✅ [步骤名] 完成：[2–3 句结论]
→ 下一步：[步骤名] — [一句说明]
继续？
```
🚫 标记处必须等用户明确回应后才继续。

---

## 会话启动

读任务包，确认 `pr-links` 字段列出的 PR 列表。

```
本次待审 PR：
1. {PR 链接} — {PR 标题}
2. ...
共 {N} 个。继续？
```

🚫 等用户确认

---

## 逐 PR 审查（每个 PR 执行以下步骤）

### Step 1：读 PR diff + description

读取 PR 改动文件列表 + PR description，核查 description 是否包含 5 段：
- task-id
- 改动摘要
- Acceptance Criteria 验证
- 偏离说明
- 遗留问题

**description 不完整** → 视为 `[阻断]`，记录缺失哪段，跳过后续 checklist，直接打回。

---

### Step 2：确定 layer

按改动文件路径推断：

| 改动特征 | layer |
|---------|-------|
| 仅前端文件（`.vue`/`.tsx`/`.css`/`components/`/`pages/`） | `frontend` |
| 仅后端文件（`controller`/`service`/`module`/`entity`/`.dto.ts`） | `backend` |
| 前后端混合 | `[frontend, backend]` |
| 仅配置 / 文档文件 | `null`（跳过 checklist） |

---

### Step 3：对照 standards

只读 `standards-shared.md` + `standards-{layer}.md` 与本 PR 改动**直接相关**的章节（按 PR 改动的模块定位），不全量加载。

记录违反或有疑问的条目。

---

### Step 4：过 checklist

- `layer` 含 `backend` → backend-checklist：DB Schema 核对 / API 错误码覆盖 / 权限校验 / 并发安全 / 静默失败防御
- `layer` 含 `frontend` → responsive-checklist：断点适配 / 触控最小 44×44px / 事件兼容 / XSS 防护
- `layer=null` → 跳过，仅核对 description + 无凭据泄露

每条标 ✅ 或 ❌，❌ 的记录问题描述。

---

### Step 5：写 review comment

将所有问题整理为两级：

```markdown
## code-review · {task-id}

### [阻断]
- {问题描述，引用具体文件/行号}
- ...

### [建议]
- {问题描述}
- ...

### 决定：通过 / 打回
```

**通过条件**：无 `[阻断]` 问题。
`[建议]` 不阻断合并，但需记入 backlog。

---

### Step 6：执行决定

**通过**：
1. 调平台 merge API 合并 PR
2. 对应 develop task 状态推 [merged]
3. 如有 `[建议]`，写入 `backlog.md`

**打回**：
1. 在 PR comment 中列出所有 `[阻断]` 问题
2. develop task 状态回 [可取]

**简单 bug 直修**（满足全部条件时可选）：改动 ≤5 行 + 原因显而易见 + 非业务逻辑（配置笔误、空指针防御等）：
1. 直接修改，建新 PR（`fix/cr-{task-id}-{desc}`）
2. 指定原 develop 执行人 review 后合并
3. 在原 PR comment 注明「已直修，见 {新PR链接}」

---

## 全部 PR 审完后

### Step 7：更新 sprint.md

在 `iterations/vN/sprint.md` 对应 develop 任务行追加 CR 结论：
- 通过已合并：`CR:通过`
- 打回：`CR:打回({原因摘要})`

```
✅ code-review 完成：{N} 个 PR，通过 {X} 个，打回 {Y} 个。
→ 下一步：等待打回 PR 修复后重新提交 / 进入 generate-integration-tests（若全部通过）
```

---

## 上下文管理

**多 PR 中断续做**：
1. 读任务包确认 pr-links 总数
2. 读 sprint.md 确认哪些已有 CR 结论（已审过）
3. 从第一个没有 CR 结论的 PR 继续，不重审已决定的
