# Review Handoff：CC → Codex

> 本模板用于 Claude Code 将独立审查任务交给 Codex。
> 审查目标是让 Codex 作为第二视角，只读权威原文，发现实现与任务、标准、测试之间的偏差。

## 使用前提

适合交给 Codex 审查的场景：

- 已有任务包。
- 已有代码 diff 或 PR。
- standards、PRD/TRD 引用明确。
- 执行者已经完成自测。
- 审查目标是找问题，而不是重新设计方案。

不适合交给 Codex 审查的场景：

- 上游 PRD/TRD 尚未收敛。
- 没有 diff，只是让 Codex 泛泛评价想法。
- 需要用户品味判断，例如 UI 是否“好看”。
- 安全敏感改动需要最终裁决。Codex 可指出风险，但不能替代 architecture 人工门。

## 交接包格式

```markdown
# Codex Review Handoff

## 1. 基本信息

- project:
- repository:
- task-id:
- task.type: develop
- source:
- iteration:
- layer:
- review-scope: diff / PR / working-tree

## 2. 审查入口

- task-package:
- diff-source:
- status-file:
- review-brief:

## 3. 必读权威原文

### 任务包
- `{task-package}` 全文

### PRD / TRD 引用
- `{file}:{line}` — `{用途}`

### Standards
- `{standards-file}#{section}` — `{用途}`

### 测试
- test-files:
- test-result:

## 4. 禁止输入

审查时不得使用以下内容作为判断依据：

- 执行者自评
- 执行者“我已经实现了”的总结
- 未落盘的聊天口径
- 与当前任务无关的泛化最佳实践

## 5. 审查维度

- AC 忠实性：实现是否真正满足任务包 AC。
- 范围控制：是否越过任务包允许范围。
- standards 合规：是否违反相关 standards。
- 测试保真：测试是否覆盖不可视区 AC，是否只是空跑。
- 设计保真：frontend 是否遵守 design.md / prototype / ux-flows。
- 安全风险：是否触及权限、认证、数据隔离、不可逆数据、金额、外部副作用。

## 6. 输出格式

Codex 必须按以下格式输出：

### 结论

通过 / 需修订

### 阻断

- `[阻断] {标题}`
  - 证据：`{file}:{line}` / diff 片段 / 测试结果
  - 影响：
  - 建议修复：

### 建议

- `[建议] {标题}`
  - 证据：
  - 建议：

### 已检查但未发现问题

- AC 覆盖：
- standards：
- 测试：
- 范围：

### 未能检查

- `{项目}`：原因
```

## 审查纪律

### 1. 证据优先

每个阻断 finding 必须有证据来源：

- 文件路径和行号
- diff 片段
- 测试输出
- 任务包 AC
- standards 条款

不能只写“可能有问题”。

### 2. 阻断和建议分开

阻断 = 不修不能合并。

建议 = 可以合并，但值得记录或后续处理。

不要把风格偏好升格成阻断。

### 3. 不替执行者补实现

审查任务只输出 findings。若用户明确要求“顺手修”，必须转成 develop handoff 或 method-change handoff。

### 4. 安全敏感项只提示，不裁决

发现以下类别时，必须标为阻断并提示 architecture 裁决：

- 权限 / 认证 / 数据隔离
- 不可逆数据操作
- 金额 / 计费
- 对外不可撤销副作用

Codex 不给“可以直接合并”的最终裁决。

## 最小示例

```markdown
# Codex Review Handoff

## 1. 基本信息

- project: mail-ai
- repository: E:\Group-code-lab\mail-ai
- task-id: mail-v1-003
- task.type: develop
- source: sprint
- iteration: v1
- layer: backend
- review-scope: working-tree

## 2. 审查入口

- task-package: iterations/v1/queue/mail-v1-003.md
- diff-source: git diff master...HEAD
- status-file: status.yml
- review-brief: codex-adapter/specs/review.codex.md

## 3. 必读权威原文

### PRD / TRD 引用
- `iterations/v1/prd.md:42` — AC 来源
- `iterations/v1/trd.md:88` — API 契约

### Standards
- `standards-backend.md#错误信封`

### 测试
- test-files: `test/mail.service.spec.ts`
- test-result: `npm run test -- mail` 通过
```

## 交接失败的常见形态

| 失败形态 | 处理 |
|----------|------|
| 只给 PR 链接，不给任务包 | 退回 CC，补任务包路径 |
| 只有执行总结，没有 diff | 退回 CC，补 diff-source |
| standards 未指定 | Codex 可搜索，但需报告交接不完整 |
| 审查要求包含“顺手重构” | 拆成 develop 或 method-change 任务 |
| 要 Codex 判断 Gate 是否可签 | 拒绝，Gate 留给 CC / 人 |
