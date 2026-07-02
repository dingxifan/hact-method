# Codex Spec：consistency-check

> 本短流程卡用于 Codex 做跨文件一致性检查。
> 目标是发现文件之间的结构漂移、旧术语残留、状态不一致和引用失效。

## 适用场景

- `plan-sprint` 后检查 queue / sprint.md / status.yml。
- 方法论修改后检查旧术语和悬挂引用。
- develop 后检查任务状态写回是否一致。
- release / wrap-up 前做文档状态薄检查。

## 输入

一次 consistency-check 必须明确：

- 检查目标
- 文件范围
- 允许报告的问题类型
- 是否允许直接修复

没有范围，不做全仓泛扫。

## 检查类型

### 1. 术语一致性

检查旧术语是否残留，新术语是否拼写一致。

常用命令：

```powershell
rg "旧术语"
rg "新术语"
```

注意：`STATUS.md` 和 `_meta/plans/` 可能包含历史事实，不默认要求替换。

### 2. 路径一致性

检查路径是否仍指向旧位置。

重点：

- `standards-*` 是否在项目根，而不是 `iterations/vN/`
- `status.yml` 是否项目级单文件
- `queue/` 与 `b-queue/` 是否区分 A/B 类
- `codex-adapter/` 是否仍为旁路实验层

### 3. task type 一致性

检查 task type 枚举是否一致。

重点：

- `skeleton/04-task-catalog.md`
- `skeleton/07-status-contract.md`
- `templates/status.yml`
- `specs-structural/`
- `specs-execution/`
- `guide/99-任务速查表.md`

### 4. queue / sprint / status 一致性

检查：

- 每个 queue 任务在 `sprint.md` 有一行。
- 每个 queue 任务在 `status.yml tasks[]` 有一条。
- task-id、title、layer、depends_on、delivery 一致。
- status 状态一致。

优先使用 `scripts/check-sprint.js`。没有脚本或脚本不覆盖时，再人工检查。

### 5. Gate 状态一致性

检查：

- `iterations/vN/gates.md`
- `status.yml iterations.vN.gates`
- 相关任务是否 merged

优先使用 `scripts/check-gate.js`。

### 6. AC 回链一致性

检查：

- PRD AC 是否有稳定编号。
- TRD 是否回链 PRD AC。
- 任务包 AC 是否带来源标签。
- 每条 PRD AC 是否至少被任务包覆盖。

优先使用 `scripts/check-docs.js` 和 `scripts/check-sprint.js`。

### 7. 长卡 / 短卡漂移检查

`codex-adapter/specs/*.codex.md` 是 `specs-execution/*.md` 的精简版，两者独立维护，没有自动同步机制，会随时间漂移。

检查触发时机：

- `specs-execution/develop.md`、`review` 相关规范、`revise-doc.md` 等被修改后。
- `codex-adapter/specs/*.codex.md` 被修改后（反向核对是否该回填长卡）。
- 定期 `wrap-up-iteration` 或 `harvest-notes` 时抽查一次。

检查内容：

- 长卡新增的强制步骤、禁止事项、退回条件，短卡是否也有对应约束（不要求逐句一致，但语义不能缺）。
- 短卡在试点中发现的坑（见 `pilots/evaluation-checklist.md` 的"需要调整的协议"）是否已考虑是否该回填长卡。
- 两者引用的 task type、字段名、文件路径是否一致。

发现漂移记为 `[建议]`，除非漂移导致 Codex 会做出与 CC 版方法论矛盾的判断（例如长卡已禁止某类改动，短卡未禁止），此时记为 `[阻断]`。

不要求每次改动都双向同步——短卡允许暂时落后于长卡的细节补充，但不允许在**禁止事项、退回条件、安全敏感判定**这三类核心约束上出现矛盾。

## 输出格式

```markdown
## Codex consistency-check 结果

### 范围
- 

### 使用的检查
- 

### 阻断
- `[阻断] {标题}`
  - 证据：
  - 建议：

### 建议
- `[建议] {标题}`
  - 证据：
  - 建议：

### 无问题项
- 

### 未检查项
- `{项目}`：`{原因}`
```

## 是否直接修复

默认只报告，不修复。

只有 handoff 明确写“允许直接修复”时，Codex 才可以改文件。

可直接修复的典型问题：

- 明显路径错字。
- queue / sprint / status 的机械字段不一致。
- 新增文件漏加入索引。
- 文档链接路径失效。

不直接修复的典型问题：

- PRD/TRD 语义冲突。
- Gate 是否可签。
- task 拆分是否合理。
- 安全敏感设计是否达标。

## 成功标准

- 检查范围清楚。
- 每个 finding 有证据。
- 历史记录和当前规范不混淆。
- 能区分机械不一致和语义待决。
