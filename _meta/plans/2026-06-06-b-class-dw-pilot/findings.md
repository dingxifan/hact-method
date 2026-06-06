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

## 设计决策（全部定稿）

| # | 决策 |
|---|------|
| D1 | DW 范围：仅 develop 阶段（fix-test loop）；pr-review 保持人工 |
| D2 | 触发方式：人工手动，传 task-id 运行脚本 |
| D3 | loop 内只跑机械验证（build + lint + type + 单元测试）；机械全过后退出 loop，最后跑一次对抗审查 |
| D4 | 升级给人的四条：a. 同一问题 3 轮机械验证未过；b1. 对抗审查有阻断则再修一轮再复审，二次阻断升级；c. 根因在设计层；d. hotfix 超出 files 范围 |
| D5 | 脚本存放：新建 `workflows/` 目录（hact-method 根目录，与 templates/ 平级） |
| D6 | pr-review 保持人工（已含于 D1） |
| D7 | 只有主脚本写状态文件（b-queue/、b-tasks.md、status.yml）；子 agent 只负责代码修复 |
| D8 | 脚本失败自动重试一次；二次失败则任务回 `[可取]` + 上报 |

## DW 整体流程（设计定稿后）

```
人工触发：claude --workflow workflows/b-class-develop.js --task {task-id}

主脚本：
  1. 读 b-queue/{task-id}.md，认领任务（写 status.yml + b-queue 状态）
  2. loop（最多 3 轮）：
       agent-fix：读任务包 + 当前代码，实现修复
       主脚本：运行机械验证（build/lint/type/单元测试）
       通过 → 退出 loop
       失败 → 继续下一轮
     3 轮未过 → 升级给人，任务回 [可取]
  3. agent-review：对抗审查（AC + diff，6 类检查）
       findings:[] 或只有 [建议] → 继续
       有 [阻断] → agent-fix 再修一轮 → 再跑 agent-review
         二次阻断 → 升级给人
  4. 主脚本：commit + push PR
  5. 主脚本：更新 b-queue 状态 [done]、b-tasks.md 追加 PR 号、status.yml

异常处理：
  脚本报错 → 自动重试一次 → 二次失败则任务回 [可取] + 上报
```
