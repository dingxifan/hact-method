# Develop Handoff：CC → Codex

> 本模板用于 Claude Code 将边界清晰的 `develop` 任务交给 Codex 执行。
> 目标是让 Codex 不依赖 CC 长上下文，也能按权威文件完成代码实现、验证和状态回写建议。

## 使用前提

只有满足以下条件，才建议交给 Codex：

- 任务包已经存在，且字段完整。
- `reference` 指向具体文件和行号，或至少能定位到具体章节。
- `relevant-standards` 明确。
- 不需要重新讨论 PRD/TRD。
- 当前任务不属于安全敏感最终裁决范围。
- 测试、lint、build 命令已知，或明确说明项目暂缺。

不满足时，应先由 CC 补齐任务包或发起 `revise-doc`。

## 交接包格式

```markdown
# Codex Develop Handoff

## 1. 基本信息

- project:
- repository:
- branch-base: master
- task-id:
- task.type: develop
- source: sprint / foundation / integration / manual-test / bug / optimization
- iteration:
- layer: frontend / backend / shared / fullstack
- urgency: normal / hotfix

## 2. 任务入口

- task-package:
- sprint-file:
- status-file: status.yml

## 3. 必读权威输入

### 任务包
- 读取：`{task-package}` 全文

### PRD / TRD 引用
- `{file}:{line}` — `{用途}`

### Standards
- `{standards-file}#{section}` — `{用途}`

### Design / UX（frontend 时必填）
- design.md:
- prototype.html:
- ux-flows.md:

## 4. 允许修改范围

### 预期修改文件
- `{path}` — `{原因}`

### 允许新增文件
- `{path or pattern}` — `{原因}`

### 禁止修改
- `{path or pattern}` — `{原因}`

## 5. 验收标准

从任务包复制 AC，并保留来源标签：

- [ ] `{AC-1}`
- [ ] `{AC-2}`

## 6. 验证命令

- install:
- build:
- type-check:
- lint:
- test:
- targeted-test:

若某命令不存在，Codex 必须记录“未运行 + 原因”，不得假装通过。

## 7. 状态写回规则

Codex 完成后应建议或执行以下状态更新：

- task package status:
- sprint.md status:
- status.yml task status:
- code_reviews[]:

是否允许 Codex 直接写回状态：是 / 否

## 8. 风险和人工门

- 是否涉及权限 / 认证 / 数据隔离：
- 是否涉及不可逆数据操作：
- 是否涉及金额 / 计费：
- 是否涉及对外不可撤销副作用：
- 若任一为“是”：Codex 不得自行合并，只能提交结果并请求 architecture 裁决。

## 9. 完成输出要求

Codex 最终必须汇报：

- 读取了哪些文件。
- 修改了哪些文件。
- 每条 AC 如何验证。
- 跑了哪些命令及结果。
- 哪些命令未运行及原因。
- 是否发现上游文档或任务包问题。
- 是否建议进入 review / merge / revise-doc。
```

## Codex 执行纪律

### 1. 不扩任务

Codex 只完成 handoff 包定义的任务。发现顺手可改的问题时：

- 小于等于 5 行、明显错误、与当前任务直接相关：可修，并在结果中说明。
- 其他情况：记为建议，不直接改。

### 2. 不猜语义

如果 AC、TRD、standards 互相冲突：

1. 停止实现冲突部分。
2. 明确列出冲突来源。
3. 建议 CC 发起 `revise-doc` 或补充 handoff。

### 3. 测试优先

不可视区 AC 应优先物化为测试。项目无测试基建时：

- 不静默跳过。
- 在完成输出中标明“测试基建缺失”。
- 建议补 `standards-backend.md` 或相关测试框架约定。

### 4. 前端设计边界

frontend 任务必须读取 `design.md`。若 prototype / ux-flows 缺失但任务需要交互判断：

- 不自行发明交互。
- 标记设计缺口。
- 请求 CC 补齐或确认降级。

### 5. 审查分离

如果同一 Codex 会话既执行又审查，必须分两段：

1. 执行段只负责实现和自测。
2. 审查段重新读取任务包、diff、standards、测试结果。

审查段不能只基于执行段总结下结论。

## 最小示例

```markdown
# Codex Develop Handoff

## 1. 基本信息

- project: mail-ai
- repository: E:\Group-code-lab\mail-ai
- branch-base: master
- task-id: mail-v1-003
- task.type: develop
- source: sprint
- iteration: v1
- layer: backend
- urgency: normal

## 2. 任务入口

- task-package: iterations/v1/queue/mail-v1-003.md
- sprint-file: iterations/v1/sprint.md
- status-file: status.yml

## 3. 必读权威输入

### 任务包
- 读取：`iterations/v1/queue/mail-v1-003.md` 全文

### PRD / TRD 引用
- `iterations/v1/prd.md:42` — AC 来源
- `iterations/v1/trd.md:88` — API 契约

### Standards
- `standards-backend.md#错误信封`
- `standards-shared.md#DTO 命名`

## 4. 允许修改范围

### 预期修改文件
- `src/mail/mail.controller.ts`
- `src/mail/mail.service.ts`
- `test/mail.service.spec.ts`

### 禁止修改
- `iterations/v1/prd.md`
- `iterations/v1/trd.md`

## 6. 验证命令

- build: `npm run build`
- test: `npm run test -- mail`
```

## 交接失败的常见形态

| 失败形态 | 处理 |
|----------|------|
| 只有一句“帮我做这个任务” | 退回 CC，补 handoff |
| task 包没有 AC 来源 | 退回 `plan-sprint` 或 `revise-doc` |
| standards 未指定 | Codex 可局部搜索，但需报告 handoff 不完整 |
| 涉及权限/数据隔离但无人工门说明 | 停止，要求 architecture 裁决 |
| 测试命令缺失 | 可探索 package scripts，但必须报告缺失 |
