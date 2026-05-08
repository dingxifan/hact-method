# exec: code-review

> CC 加载本文时，当前任务是批量审查若干 develop PR：对照 standards 和 checklist 给出反馈，决定通过或打回。
> 每个 PR 独立决定——有打回不阻塞其他可通过的 PR。

**上下文密度**：中。逐 PR 精确加载，只读改动文件相关的 standards 章节，不全量加载。

---

## 红线

- **不跳过有 `[阻断]` 问题的 PR**：无论其他 PR 如何，有 `[阻断]` 的必须打回，不得因"问题不大"而放行
- **发现凭据立即处理**：代码或 PR description 中出现凭据，不等 review 结束——立即要求撤销 + 清理 commit history，合并前必须解决
- **反馈必须书面化**：不口头转达，review comment 必须写进 PR，develop 执行人以 PR comment 为准
- **不替 develop 执行人写修复代码**：给问题描述和方向，不直接提交修复（简单 bug 直修除外，见 Step 6）

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

读任务包，确认 `pr-links` 字段。

按 PR 改动文件路径推断总体 layer（`frontend` / `backend` / 混合 / `null`），精确加载对应 standards 章节——不全量加载，只读与本批 PR **直接相关**的部分：
- `layer` 含 `backend` → `iterations/vN/standards-backend.md` + `standards-shared.md` 相关章节
- `layer` 含 `frontend` → `iterations/vN/standards-frontend.md` + `standards-shared.md` 相关章节
- `layer=null` → 跳过 standards

```
本次待审 PR：
1. {PR 链接} — {PR 标题}
2. ...
共 {N} 个。继续？
```

🚫 等用户确认

---

## 审查步骤（每个 PR 执行一遍）

### Step 1：读 PR description，核查五段完整性

确认 description 包含五段：

| 段落 | 说明 |
|------|------|
| task-id | 对应 queue 中的任务 ID |
| 改动摘要 | 2–3 句说明做了什么 |
| Acceptance Criteria 验证 | 逐条 AC 附验证方式（`[x]` 格式） |
| 偏离说明 | 无则写"无" |
| 遗留问题 | 无则写"无"，有则确认已记入 backlog |

**任意段落缺失** → 直接记为 `[阻断]`，跳过后续步骤，打回。

重点核查：
- **偏离说明**不为"无"时：超出 `files` 清单的文件需额外审查
- **遗留问题**不为"无"时：确认已写入 `backlog.md`，否则记为 `[阻断]`

---

### Step 2：确定 layer

| 改动文件特征 | layer |
|---|---|
| 仅 `.vue` / `.tsx` / `.css` / `components/` / `pages/` 等 | `frontend` |
| 仅 `controller` / `service` / `module` / `entity` / `.dto.ts` 等 | `backend` |
| 前后端文件混合 | `[frontend, backend]`，两份 checklist 都用 |
| 仅配置 / 文档文件 | `null` |

---

### Step 3：对照 standards

只读与本 PR 改动模块**直接相关**的 standards 章节（按改动文件定位），不全量加载。

记录每条违反或有疑问的条目，标注文件路径和行号。

---

### Step 4：过 checklist

- `layer` 含 `backend` → backend-checklist：DB Schema 核对 / API 错误码覆盖 / 权限校验 / 并发安全 / 静默失败防御
- `layer` 含 `frontend` → responsive-checklist：断点适配 / 触控最小 44×44px / 事件兼容 / XSS 防护
- `layer=null` → 跳过 checklist，只确认无凭据泄露

每条标 ✅ 或 ❌，❌ 的记录具体问题描述。

**安全敏感改动**（权限 / 认证 / 数据隔离相关）且 review 人无 `architecture` discipline → 上报，等有 `architecture` discipline 的人介入后再决定，不单独放行。

---

### Step 5：写 review comment

将所有发现整理为两级，写入 PR comment：

```markdown
## code-review · {task-id}

### [阻断]（必须修复才能合并）
- {问题描述}（`{文件路径}` L{行号}）
- ...

### [建议]（可接受，建议下期处理）
- {问题描述}
- ...

### 决定：通过 ✅ / 打回 ❌
```

无 `[阻断]` = 通过；有 `[建议]` 不阻断合并。

---

### Step 6：执行决定

**通过**：
1. 调平台 merge API 合并 PR
2. 对应 develop task 状态推 [merged]
3. 有 `[建议]` → 写入 `backlog.md`

**打回**：
1. PR comment 中列出全部 `[阻断]` 问题（已在 Step 5 写好）
2. develop task 状态回 [可取]

**简单 bug 直修**（同时满足以下全部条件时可选）：
- 改动 ≤5 行
- 原因显而易见（配置笔误、空指针防御等非业务逻辑）
- 无需理解上下文即可确认正确

→ 直接修改，建新 PR（`fix/cr-{task-id}-{desc}`），指定原 develop 执行人 review 后合并；原 PR comment 注明「已直修，见 {新PR链接}」。

**同一 PR 打回 3 次仍有同一 `[阻断]` 问题** → 停止反复 review，上报；判断根因是否在 TRD/standards 层，若是则创建 `revise-doc` 任务，再决定如何继续。

---

## 全部 PR 审完后

### Step 7：更新 sprint.md

在 `iterations/vN/sprint.md` 对应 develop 任务行追加 CR 结论：
- 通过已合并：`CR:通过`
- 打回：`CR:打回（{原因一句话}）`

---

### Step 8：feedback 检查

回顾本次 review：

- 同一类问题在多个 PR 中反复出现 → standards 有缺口，写入 `feedback.md`
  格式：`{日期} | {发现的问题模式} | 建议更新到 {standards 文件哪节}`
- PR description 缺失段落是共性 → feedback 记录，建议在 develop exec spec 中加强提示
- 无发现 → 跳过此步

```
✅ code-review 完成：{N} 个 PR，通过 {X} 个，打回 {Y} 个。[有 feedback / 无 feedback]
→ 下一步：等待打回 PR 修复后重新提交 / 进入 generate-integration-tests（若全部通过）
```

---

## 上下文管理

**断点续做**（多 PR 中断后接续）：
1. 读 `iterations/vN/sprint.md`，找已有 `CR:通过` 或 `CR:打回` 结论的行（已审完）
2. 从第一个**无 CR 结论**的 PR 继续，不重审已决定的

**多 PR 上下文过重时**（PR 数量 ≥5 或单 PR diff 很大）：
- 每完成 3 个 PR 后考虑一次 compact
- compact 前确认：已审 PR 的 CR 结论已写入 sprint.md（写入即持久化，compact 不丢失进度）

**多 PR 并行审查**（PR 数量 ≥5 且各 PR layer 独立时）：
- 可派 2 个 Explore subagent 并行读取不同 PR 的 diff + description，各自返回"五段完整性结论 + 改动文件列表 + 疑点摘要"
- 主线汇总后逐 PR 执行 Step 3–6（standards 核查和决策仍由主线完成，不委托 subagent）
- subagent 失败 → 主线直接读该 PR，不阻断其他 PR 的审查

**打回 PR 二次 review**（同一 PR 修复后重新提交）：
1. 读上次 review comment 中的 `[阻断]` 清单
2. 只核查 `[阻断]` 是否已修复 + 有无新引入问题
3. 不重跑完整流程

---

## CR 发现根因在文档层时

**`[阻断]` 问题根因在 TRD 或 standards 层**（不是实现问题）：
1. 打回 PR，comment 中说明「根因在文档层，等 revise-doc 完成后重新实现」
2. 同时创建 `revise-doc(target=trd/standards)` 任务包，写入 queue
3. develop task 保持 [可取] 状态，等 revise-doc 完成后再拾取
