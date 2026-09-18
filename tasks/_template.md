---
schema: hact-task/vnext
task: {task-type}
class: {A | B | cross-cutting}
discipline: {optional-knowledge-tag}
gate: {G1 | G2 | G3 | G4 | G5 | null}
preferred_runtime: {reasoning | execution | human-led | any}
required_capabilities: []
review: {required | conditional | none}
---

# {task-type}

## 1. Purpose & Scope

### Purpose
说明这个 Task 为什么存在，以及完成后项目获得什么稳定结果。

### In scope
- …

### Out of scope
- …

Task Contract 只定义本 Task 独有规则。共性规则引用 `protocols/`；具体工具操作进入 `runtime/`。

## 2. Preconditions

定义 Task 从 `可取` 进入 `taken-by`、或执行下一关键动作前必须成立的硬前置：
- Required Gate
- Required artifacts
- Required task state
- Required authorization
- Conditional prerequisites

## 3. Authoritative Inputs

### Required
- …

### Conditional
- …

### User input
- …

上一 Runtime 的聊天总结不是权威输入。Shared Protocol 是规则来源，但按当前动作的触发条件加载；不要因为出现在 Authoritative Inputs 中就预加载全部 `protocols/`。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| … | `…` | … |

### State updates
- `status.yml`: …

### Conditional outputs
- …

聊天草稿、本地 dirty state 或未持久化文本不属于正式 Output。

## 5. Decision Rules & Boundaries

只记录该 Task 特有、容易被错误推断或遗漏的方法论规则；不要写 Runtime 命令、固定 UI 操作或逐步话术。

## 6. Verification

### Deterministic
描述必须机械证明什么。

### Semantic
描述必须进行哪些语义判断。

## 7. Review & Human Authority

### Independent Review
只定义本 Task 的特殊 review focus，隔离方式与 finding 结构引用 `protocols/review.md`。

### Human Authority
明确哪些决定必须由 Human 做，以及是否关联 Gate。

## 8. Completion & Handoff

### `done`
何时形成稳定 Shared Candidate Truth。

### `merged`
何时 Task 自身完成并进入 Accepted Project Truth。

Gate approval 与 Task `merged` 正交。

### Downstream
列出下游 Task 及其读取的 Accepted Truth。
