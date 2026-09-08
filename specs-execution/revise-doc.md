# exec: revise-doc

> 运行时加载本文时，当前任务是对已确认的 PRD / TRD / Foundation / project.md 技术约束做最小化修订，记录原因，判断下游影响。
> 已签 Gate 不撤销，只记录变更；修订范围严格最小化，不借机重写或扩展。

**上下文密度**：低–中。只读目标文档 + backlog，不加载代码。

---

## 红线

- **已签 Gate 不撤销**：修订不影响已签的 Gate 状态，只在文档上记录变更
- **修订范围严格最小化**：只改 `reason` 所指的具体段落，不借机重写其他部分，不扩大范围
- **涉及核心定义变更须先上报**：接口 schema 大幅变动 / 数据库表结构重大修改 → 在 backlog 标注并上报，等用户确认修订边界后再动手，不静默修改
- **级联修订不合并在一个 task 里**：PRD 修订影响 TRD 时，创建新的 `revise-doc(target=trd)` 任务，不在同一会话里同时改两份文档

---

> **步骤协议**：每步完成输出 `✅ [步骤] 完成：[2–3 句结论] → 下一步：[步骤] — [一句说明]` 后**直接继续**（非 🚫 步骤不问"继续？"、不等回应）；🚫 处必须停下等用户明确回应；⚖️ 处按既定规则默认判定，输出结论 + 理由后直接继续，用户可随时推翻（推翻则修正后再继续）。

---

## 会话启动

**task-id 命名规范**：`{项目缩写}-rd-{三位序号}`，如 `hact-rd-001`
（创建 revise-doc 任务包时，由触发方按此规范生成 task-id 写入任务包）

读任务包，确认：
- `target`：`prd` / `trd` / `foundation` / `project`
- `reason`：修订原因（触发来源 + 具体问题）

---

## Step 1：读原文档，定位问题段落

按 `target` 读对应文件：

| target | 文件路径 |
|--------|---------|
| `prd` | `iterations/vN/prd.md` |
| `trd` | `iterations/vN/trd.md` |
| `foundation` | 项目根 `foundation.md` |
| `project` | 项目根 `project.md` 技术层（当前技术选择与约束；普通状态更新不走契约修订） |

定位 `reason` 所指的具体段落，输出：
```
问题位置：{文件} § {章节名}
当前内容：{原文摘要}
问题描述：{一句话说明哪里有歧义或缺失}
```

---

## Step 2：确认修订内容

提出最小化修订方案，输出「原文 → 修订后」对照，等用户确认：

```
修订范围：{文件} § {章节}

原文：
{原始段落}

修订后：
{改动后段落}

改动说明：{一句话说明改了什么，为什么这样改}
```

**涉及核心定义**（接口 schema / 数据库表结构 / 权限模型大幅变动）→ 上报：
```
⚠️ 本次修订涉及核心定义变更（{具体内容}），请确认修订边界后再执行。
```

🚫 等用户确认修订内容

---

## Step 3：执行修订

用户确认后，直接编辑目标文件对应段落。

---

## Step 4：记入 backlog

在 项目根 `backlog.md` 追加 `[修订]` 条目：

```markdown
- [修订] {YYYY-MM-DD} | target={target} | {改了什么，一句话} | 原因：{reason 字段内容}
```

---

## Step 5：判断下游影响

| target | 判断逻辑 | 动作 |
|--------|---------|------|
| `prd` | 是否影响 TRD 的接口 / 数据结构？ | 是 → 创建 `revise-doc(target=trd)` 任务包，写入 queue；不在本会话改 TRD |
| `trd` | 是否影响已派发的 queue 任务包？ | 是 → 更新对应任务包的 intent/oracle/reference，在任务包备注「TRD 已修订，请重新拾取」 |
| `foundation` | 是 claim-only 还是 invariant 变化？ | claim-only → 只更新声明/机制锚；invariant 变化 → 新开地基跟进任务，禁止静默要求当前包扩 scope |
| `project` | 是否改变已确认的技术选择或约束？ | 说明适用范围和下游影响，修订后更新相关任务 reference；涉及代码的另按授权安排，不在文档修订中实施 |

**AC 漂移兜底**：对受影响任务包重跑 intent/oracle 对账；example 按 oracle 复算。intent/oracle 变化才更新测试契约；仅 example 算错则改 example 或取消 golden，不创建代码整改。只复核受影响 AC，不重跑完整任务包/代码审查。

**修订涉及已 [merged] PR**：先按 intent/invariant 复核运行行为。实现已满足而文档落后时，代码改动文件数必须为 0；只有新权威 intent/invariant 明确改变且当前行为不满足时，才创建新的 develop 任务并记 `[偏离]`。不回滚已合并 PR。

无下游影响 → 记录「无下游影响」，继续 Step 6。

---

## Step 6：commit

```bash
git add {修订的文件} backlog.md {受影响的任务包（如有）}
git commit -m "fix(doc): {修订内容摘要} [{项目名}]"
```

---

## Step 7：反向交接（触发方为 wrap-up-iteration 时）

读任务包的 `source` 或 `context` 字段，确认本次 revise-doc 是否由 `wrap-up-iteration` 偏离对账创建：

- **是**：通知 wrap-up-iteration 执行人：「revise-doc {task-id}（target={target}）已完成，可继续偏离对账」
- **否**（由 develop 独立审查 / manual-test / 用户触发）：无需额外交接，直接完成

---

## Step 8：feedback 检查

回顾触发本次修订的根因：
- 同一文档短期内被多次修订（≥2 次）→ 说明上游文档质量有问题，写入 项目根 `feedback.md`（格式：`{日期} | {发现} | 建议在 {draft-prd-vN / draft-tech-design} 阶段加强 {哪个环节}`）
- 单次偶发修订 → 跳过

```
✅ revise-doc 完成：{target} 已修订，backlog 已记录，[无下游影响 / 已创建级联修订 / 已更新 {N} 个任务包]。
```

---

## 上下文管理

本 task 修订范围小，通常单次会话完成，无需断点续做文件。

**中断续做**：
1. 读 项目根 `backlog.md`：`[修订]` 条目是否已追加 → 已追加说明 Step 4 完成，从 Step 5 继续
2. 读目标文件：内容是否已是修订后版本 → 已修订说明 Step 3 完成，从 Step 4 继续
3. 读 `queue/`：是否已有对应级联 revise-doc 任务包 → 有则 Step 5 已完成
