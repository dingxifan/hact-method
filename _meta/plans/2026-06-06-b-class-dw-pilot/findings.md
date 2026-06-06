# findings · B 类 Dynamic Workflow 试点

## 触发背景

Boris Cherny（Claude Code 创始人）在 2026 年红杉资本 AI Ascent 大会上的分享：
- "我现在不再给 Claude 写 prompt 了，我有一堆 loop 在跑。我的工作是写 loop。"
- 今年至今手写代码 0 行，日均提交几十个 PR，单日最高 150 个
- 核心范式：从"人指挥 AI 写代码" → "人设计流程，AI 组织 AI 干活"

## Dynamic Workflows 三大 API

| API | 语义 | 适用场景 |
|-----|------|---------|
| `agent()` | 创建独立上下文的 AI 工人 | 单一任务，需要上下文隔离 |
| `parallel()` | 并行运行多个 agent，等全部完成（屏障） | 必须汇总所有结果再继续 |
| `pipeline()` | 流式处理，每个元素独立通过各阶段 | 可逐个处理的批量任务 |

B 类 loop 对应的是**模式 6：Loop until done**：
- 运行测试 → 失败则修复 → 重新运行 → 全过则结束

## B 类流程现状分析

当前 B 类（source=bug/optimization）走的是和 A 类相同的 exec spec（develop.md），差异只在：
- 读 `b-queue/` 而非 `iterations/vN/queue/`
- Step 9/10 分流目的地不同（b-tasks.md / 个人 notes）
- 无 Gate 前置

**问题**：Steps 1-10 仍有多个 🚫 人工确认门，违背"人只看结果"的目标。

## 两种实现路径的本质区别

| 路径 | 本质 | 问题 |
|------|------|------|
| 改 exec spec | 单 CC 会话，AI 被指示"去循环" | 上下文累积、AI 审查自己的代码、无法真正隔离 |
| DW 脚本 | 多 agent 编排，`while` 是真实的程序循环 | 是新的执行模式，方法论需要相应扩展 |

结论：真正实现"人只看结果"需要 DW 脚本，改 exec spec 只是伪循环。

## 方法论扩展方向

当前 hact-method 所有 exec spec 都是"单会话指令"模型（CC 读 → 人确认 → 步骤执行）。
引入 DW 后，B 类任务的执行模型变为：
- 人触发一个 workflow 脚本
- 脚本编排多个 agent 完成修复-测试-循环
- 人只审最终 PR

这意味着方法论需要：
1. 新增 **workflow 脚本存放位置**（templates/workflows/？）
2. 新的 **exec spec 类型**（描述如何触发和监控 DW，而非步骤指令）
3. 与现有 **状态追踪文件**（b-queue/、b-tasks.md、status.yml）的读写契约

## 待确认设计问题

见 task_plan.md D2-D8。
