# workflows/ — Dynamic Workflow 脚本库

## 什么是 Dynamic Workflow（DW）

DW 是 Claude Code 的多 agent 编排能力：一个 JS 脚本用 `agent()` / `parallel()` / `pipeline()` 调度多个独立 Claude 实例并发或循环执行，每个 `agent()` 调用拥有独立上下文窗口。

与普通 exec spec（单 CC 会话 + 人工确认门）的本质区别：

| 维度 | exec spec（单会话） | Dynamic Workflow |
|------|--------------------|--------------------|
| 循环 | AI 被指示"去循环"（伪循环） | JS while 真循环 |
| 上下文 | 单一、累积、有污染 | 每个 agent 独立隔离 |
| 人工介入 | 每步 🚫 确认门 | 只在触发前 + 审结果 |
| 状态写入 | 分散在会话中 | 主脚本统一控制 |

## 本库包含

| 脚本 | 用途 |
|------|------|
| `adversarial-review.js` | 对 hact-method 方法论进行三角色对抗性审查 |

## ⚠️ 已弃用

`b-class-develop.js`（B 类任务自动修复 workflow）已于 2026-06-06 弃用并删除。

**替代方案**：
- B 类任务手动实现后，commit 前运行 `/adversarial-review` skill（`skills/adversarial-review/SKILL.md`）
- PostToolUse hook 在 `git add` 后自动提示是否需要审查
- 对抗审查的独立视角价值得以保留，去掉了 workflow 的运维复杂度

**弃用原因**：
1. `args` 以 JSON 字符串传入，需手动 parse（harness 行为与文档不符）
2. 多字段 StructuredOutput 在当前 CC 版本失效（输入始终为 `{}`）
3. 凭据扫描误触 untracked 临时文件
4. 调试需读 journal.jsonl，体验差
5. 对抗审查（Phase 3）是唯一真正有价值的部分，已提取为独立 skill
