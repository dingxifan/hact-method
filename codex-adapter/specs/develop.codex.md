# Codex Spec：develop

> 本短流程卡用于 Codex 执行边界清晰的 `develop` 任务。
> 它不替代 Claude Code 版 `specs-execution/develop.md`，只定义 Codex 接到 handoff 后怎么短上下文执行。

## 输入

Codex 必须从 `codex-adapter/handoff/develop-handoff.md` 格式的交接包开始。没有交接包，不进入实现。

必读顺序：

1. handoff 包。
2. task package 全文。
3. handoff 指定的 PRD/TRD 行号。
4. handoff 指定的 standards 章节。
5. handoff 指定的相关代码文件。
6. frontend 任务额外读取 design.md；如 handoff 指定，再读 prototype / ux-flows。

## 禁止事项

- 禁止修改 handoff 未允许的文件，除非先说明原因并获得确认。
- 禁止修订已签 PRD/TRD 的语义。
- 禁止自行签 Gate。
- 禁止在安全敏感改动上自行给出最终合并裁决。
- 禁止因测试命令缺失而声称测试通过。

## 执行步骤

### Step 1：入口核对

确认：

- task-id、source、layer 明确。
- task package 存在。
- allowed / forbidden 文件范围明确。
- AC 可定位。
- 验证命令存在或已说明缺失。

若缺少关键输入，停止并输出“handoff 不完整”。

### Step 2：读取权威输入

按 handoff 精确读取，不默认读全文。

如果引用行号失效：

1. 读取目标文件附近上下文。
2. 报告引用失效。
3. 继续前确认是否能可靠定位。

### Step 3：制定局部实现计划

输出 3-7 条内部计划，覆盖：

- 要改哪些文件。
- 每条 AC 对应什么实现。
- 测试如何覆盖。
- 是否有越界风险。

计划不需要用户逐条确认，除非发现 handoff 矛盾或安全敏感改动。

### Step 4：实现

按任务包和 allowed files 修改代码。

规则：

- 优先最小改动。
- 复用现有模式。
- 不做无关重构。
- 不创建新抽象，除非任务包或现有代码结构明确需要。

### Step 5：验证

按 handoff 跑验证命令。

推荐顺序：

1. targeted test
2. unit test
3. type-check
4. lint
5. build

若命令不存在：

- 记录“未运行 + 原因”。
- 不把它算作通过。

若测试失败：

- 先判断是否由当前改动引入。
- 最多进行有根据的修复。
- 若失败来自上游环境或测试基建缺失，停止并报告。

### Step 6：自检

交付前自检：

- 每条 AC 是否有实现说明。
- 每条不可视区 AC 是否有测试或降级说明。
- 修改文件是否都在允许范围内。
- 是否触及安全敏感类别。
- 是否发现 PRD/TRD/standards 矛盾。

### Step 7：完成输出

Codex 输出必须包含：

```markdown
## Codex develop 结果

### 读取
- ...

### 修改
- ...

### AC 验证
- [x] `{AC}` — `{验证方式}`

### 命令结果
- `{command}` — 通过 / 失败 / 未运行（原因）

### 风险
- ...

### 上游问题
- 无 / `{说明}`

### 建议下一步
- 进入 review / 退回 revise-doc / 需要人工裁决
```

## 状态写回

第一阶段建议 Codex 不直接合并、不直接签 Gate——这是试点期的临时保守设置，用于在协议验证前控制风险，不是退回决策#24 之前"独立审查之外还要再过一道人工合并门"的模型。Pilot C 验证协议可靠后，应放开为审完即合并，不长期保留这道等价于旧 pr-review 的门。

是否允许写回任务状态由 handoff 决定：

- 若 `是否允许 Codex 直接写回状态：否`，Codex 只报告建议。
- 若为 `是`，Codex 可按 handoff 更新任务包、sprint.md、status.yml，但仍不得自行处理安全敏感合并裁决。

## 何时退回 CC

出现以下任一情况，停止执行并退回 CC：

- AC 与 TRD 冲突。
- standards 缺少关键约束。
- 需要新增产品行为。
- 设计缺口影响 frontend 实现。
- 安全敏感改动缺少 architecture 裁决。
- 测试基建缺失导致不可视区 AC 无法验证。

## 成功标准

一次 Codex develop 被视为成功，需要满足：

- 修改范围受控。
- AC 有逐条验证说明。
- 测试 / lint / build 结果清楚。
- 未运行项诚实记录。
- 下游 CC 可直接接回结果。
