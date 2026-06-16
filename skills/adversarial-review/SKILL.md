---
name: adversarial-review
description: 对当前代码改动做独立对抗审查。commit 前调用，传入 task-id 获取 AC；审查 agent 只看 AC + diff，不带实现上下文。发现 blocker → 修完再提交；建议 → 写 backlog。B 类任务手动实现后、git commit 前必须调用（diff ≥ 15 行且改了代码文件时）。
---

# Adversarial Review Skill

## 何时调用

- B 类任务手动实现完成，**git commit 之前**
- diff 涉及代码文件（非纯状态文件），且改动 ≥ 15 行
- **跳过条件**（满足任意一条则不调用）：
  - 所有改动仅限 `b-queue/`、`status.yml`、`b-tasks.md`、`backlog.md`
  - `git diff --stat` 总行数 < 15
  - commit message 明确含 `chore` / `dispatch` / `状态`（纯管理提交）

## 步骤

### Step 1：获取 AC

```bash
# 从参数或 b-tasks.md 找当前 B 类任务
# 优先用用户传入的 task-id，否则找 b-tasks.md 中最近 [done]/[taken-by] 行
```

读取 `b-queue/{task-id}.md` 的 `## acceptance_criteria` 章节。  
若找不到任务包，直接让用户描述本次改动目标（2–3 句），作为 AC 替代。

### Step 2：获取 diff

```bash
git diff          # unstaged
git diff --cached # staged
```

两者合并。若均为空，运行 `git diff HEAD~1 HEAD`（已提交但未推送时）。

### Step 3：启动独立审查 agent

用 `Agent` 工具（`subagent_type: claude`）启动独立 agent，**只传 AC + diff**，不附加任何实现上下文、任务包内容或开发过程说明。

Agent 收到的 prompt：

```
你是一名独立审查员，从未见过这段代码的开发过程和实现思路。

【Acceptance Criteria】
{AC 列表，逐条编号}

【代码改动（git diff）】
{diff 完整内容}

【默认假设】
代码存在问题。你的任务是找出所有失败方式，不是确认代码是否正确。

【逐类检查】（每类必须有明确结论，不允许跳过）

1. AC 覆盖：每条 AC 是否有对应实现？逐条核对，找出遗漏或实现偏差。
2. 边界情况：输入为 null / 空值 / 极值时代码会怎样？
3. 错误处理：失败路径是否正确处理？有没有吞异常、静默失败？
4. 安全性：权限绕过、注入风险、数据隔离漏洞、未校验的用户输入？
5. 逻辑正确性：业务逻辑是否与 AC 一致？条件判断有没有错误？

某类无发现时，明确写：「{类别}：无发现」
禁止输出总结性正面评价。

【返回格式】
🚫 BLOCKER（必须修完才能提交）：
- {具体描述，含文件:行号}

💡 SUGGESTION（建议，不阻断提交）：
- {具体描述}

无 blocker 时写：「BLOCKER：无」
```

### Step 4：处理结果

**有 BLOCKER**：
- 列出每条，我逐一修复
- 修完后重新运行 `git diff` 确认已解决
- 若 blocker 涉及 `escalate-if` 条件（如"发现 DB 层数据异常"），停止，通知用户

**只有 SUGGESTION**：
- 写入 `backlog.md`，格式：
  ```
  - [ ] {今天日期} | [CR-建议] {描述} | 来源：{task-id 或 manual}
  ```
- 直接继续 commit

**无任何发现**：
- 直接继续 commit，无需额外操作

## 输出示例

```
📋 对抗审查结果（krm-b-006）

🚫 BLOCKER（1 条）
- ContentPanel.vue:820 __item-label 颜色仍为 secondary，与容器 primary 形成层级反转
  → 修复：将 color: $color-text-secondary 改为 $color-text-primary 或与容器保持一致

💡 SUGGESTION（2 条）
- #72777e 对白底对比度 4.511:1，余量极小；建议改为 #6d7278（4.74:1）
- OrgReviewView.vue:175 硬编码 #8f959e 与变量不同步

已将 2 条建议写入 backlog.md。
修复 blocker 后即可 commit。
```
