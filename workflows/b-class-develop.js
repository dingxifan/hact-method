export const meta = {
  name: 'b-class-develop',
  description: 'B类任务自动修复：认领→fix-test loop(最多3轮)→对抗审查→commit+PR',
  phases: [
    { title: '认领任务', detail: '读任务包，更新 b-queue + status.yml 认领状态' },
    { title: 'Fix-Test Loop', detail: 'agent-fix 实现修复，机械验证 agent 跑 build/lint/test，最多3轮' },
    { title: '对抗审查', detail: '独立 agent 审查 AC + diff，有阻断则修复后复审' },
    { title: 'Commit + PR', detail: '提交代码，推分支，创建 PR' },
    { title: '状态更新', detail: '更新 b-queue/status.yml/b-tasks.md，commit + push' },
  ],
}

// args = { taskId: string }
// 脚本从项目仓 CC 会话中触发，CWD 即为项目根目录，无需传 projectPath。
// 示例：{ taskId: 'happ-b-001' }
const { taskId } = args

// ── Schemas ───────────────────────────────────────────────────────

const TASK_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    acceptance_criteria: { type: 'array', items: { type: 'string' } },
    files: { type: 'array', items: { type: 'string' } },
    urgency: { type: 'string' },
    known_risks: { type: 'string' },
  },
  required: ['title', 'acceptance_criteria', 'files'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean' },
    errors: { type: 'string' },
  },
  required: ['passed', 'errors'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    has_blocker: { type: 'boolean' },
    blockers: { type: 'array', items: { type: 'string' } },
    suggestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['has_blocker', 'blockers', 'suggestions'],
}

const DIFF_SCHEMA = {
  type: 'object',
  properties: {
    content: { type: 'string' },
  },
  required: ['content'],
}

const PR_SCHEMA = {
  type: 'object',
  properties: {
    pr_number: { type: 'number' },
    pr_url: { type: 'string' },
  },
  required: ['pr_number'],
}

// ── Phase 1：认领任务 ─────────────────────────────────────────────

phase('认领任务')

const taskInfo = await agent(
  `你是一个任务认领 agent，当前工作目录是项目根目录。

**步骤（按序执行，不可跳过）**：

1. 读取 b-queue/${taskId}.md 的完整内容

2. 解析：
   - title：任务标题
   - acceptance_criteria：验收标准数组（每条一个元素）
   - files：需改动的文件路径数组（相对于项目根目录）
   - urgency：紧急程度（hotfix / null）
   - known_risks：已知风险描述（可为空字符串）

3. 将 b-queue/${taskId}.md 中的状态标记改为 \`status: [taken-by: dw-bot]\`

4. 读取 status.yml，找到 id 为 ${taskId} 的 task 条目：
   - status 改为 \`taken-by\`
   - assigned_to 改为 \`dw-bot\`

5. git add b-queue/${taskId}.md status.yml
   git commit -m "chore(b-queue): 认领 ${taskId} [taken-by: dw-bot]"

**返回**：解析出的任务信息`,
  { label: '读取并认领任务', phase: '认领任务', schema: TASK_SCHEMA }
)

log(`认领成功：${taskInfo.title}（涉及 ${taskInfo.files.length} 个文件）`)

// ── Phase 2：Fix-Test Loop ────────────────────────────────────────

phase('Fix-Test Loop')

let lastErrors = ''
let fixPassed = false

for (let round = 1; round <= 3; round++) {
  log(`第 ${round} 轮 Fix-Test`)

  // agent-fix：只修代码，不写状态文件
  await agent(
    `你是一个代码修复 agent，当前工作目录是项目根目录。只修改代码文件，不写任何状态文件（b-queue/、status.yml、b-tasks.md）。

**任务信息**：
- 标题：${taskInfo.title}
- 验收标准（AC）：
${taskInfo.acceptance_criteria.map((ac, i) => `  ${i + 1}. ${ac}`).join('\n')}
- 需改动的文件（**只改这些文件，不新增、不改其他文件**）：
${taskInfo.files.map(f => `  - ${f}`).join('\n')}
${round > 1 ? `
**上一轮机械验证失败，错误信息**：
${lastErrors}

根据上述错误，针对性修复。不要扩大改动范围。` : ''}

实现修复。完成后不需要返回任何结果。`,
    { label: `Fix 第${round}轮`, phase: 'Fix-Test Loop' }
  )

  // 机械验证 agent
  const verifyResult = await agent(
    `你是一个机械验证 agent，当前工作目录是项目根目录。依次运行以下命令，逐条记录结果：

1. npm run build（检查 package.json 是否有该 script，有则运行）
2. npm run type-check（如无则尝试 npx tsc --noEmit）
3. npm run lint（检查 package.json 是否有该 script，有则运行）
4. npm test（如有，只跑单元测试）

规则：项目无对应命令时跳过，不算失败；遇到报错立即记录，不中断后续命令。

**返回**：
- passed：所有存在的命令是否全部通过（true / false）
- errors：如有报错，提取关键错误信息（文件名 + 行号 + 错误描述）；全部通过则为空字符串`,
    { label: `机械验证 第${round}轮`, phase: 'Fix-Test Loop', schema: VERIFY_SCHEMA }
  )

  if (verifyResult.passed) {
    log(`第 ${round} 轮机械验证通过`)
    fixPassed = true
    break
  }

  lastErrors = verifyResult.errors
  log(`第 ${round} 轮失败：${verifyResult.errors.slice(0, 300)}`)
}

if (!fixPassed) {
  await agent(
    `将 b-queue/${taskId}.md 中的状态改回 \`status: [可取]\`。
在 status.yml 中找到 id=${taskId} 的 task，将 status 改回 \`可取\`，assigned_to 改为 null。
git add b-queue/${taskId}.md status.yml
git commit -m "chore(b-queue): ${taskId} 三轮机械验证失败，回退 [可取]"`,
    { label: '升级·三轮机械验证失败', phase: 'Fix-Test Loop' }
  )
  log('⚠️ 升级给人工：三轮机械验证均未通过')
  return {
    escalated: true,
    reason: 'mechanical_fail_3_rounds',
    task_id: taskId,
    errors: lastErrors,
  }
}

// ── Phase 3：对抗审查 ─────────────────────────────────────────────

phase('对抗审查')

const diffResult = await agent(
  `运行 git diff 和 git diff --cached，合并返回完整 diff 内容。
如果两者都为空则运行 git diff HEAD~1 HEAD。
返回：diff 的完整文本内容。`,
  { label: '获取 diff', phase: '对抗审查', schema: DIFF_SCHEMA }
)

const adversarialPrompt = (diffContent) =>
  `你是一名独立审查员，从未见过这段代码的开发过程和实现思路。

【输入】
需求（Acceptance Criteria）：
${taskInfo.acceptance_criteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

代码改动：
${diffContent}

【默认假设】
代码存在问题。你的任务是找出所有失败方式，不是确认代码是否正确。

【逐类检查】（每类必须有明确结论，不允许跳过，不允许合并）

1. AC 覆盖：每条 AC 是否有对应实现？逐条核对，找出遗漏或实现偏差。
2. 边界情况：输入为 null / 空值 / 极值 / 并发时代码会怎样？找出未处理的情况。
3. 错误处理：失败路径是否正确处理？有没有吞异常、错误状态码、静默失败？
4. 安全性：是否存在权限绕过、注入风险、数据隔离漏洞、未校验的用户输入？
5. 逻辑正确性：业务逻辑是否与 AC 描述的行为一致？条件判断、状态转换有没有错误？

某类无发现时，必须明确写：「{类别}：无发现」
禁止输出「整体看起来不错」「代码质量良好」等总结性语言。

【返回】
- has_blocker：是否有严重程度为"阻断"的 finding（boolean）
- blockers：所有阻断级 finding 的描述（字符串数组）
- suggestions：所有建议级 finding 的描述（字符串数组）`

const reviewResult = await agent(
  adversarialPrompt(diffResult.content),
  { label: '对抗审查', phase: '对抗审查', schema: REVIEW_SCHEMA }
)

if (reviewResult.has_blocker) {
  log(`对抗审查发现 ${reviewResult.blockers.length} 个阻断，进行修复...`)

  await agent(
    `你是一个代码修复 agent，当前工作目录是项目根目录。只修改代码文件，不写任何状态文件。

需要修复以下对抗审查阻断（严格只修复这些问题，不扩大改动范围）：
${reviewResult.blockers.map((b, i) => `${i + 1}. ${b}`).join('\n')}

涉及文件：
${taskInfo.files.map(f => `- ${f}`).join('\n')}`,
    { label: '修复阻断', phase: '对抗审查' }
  )

  const diffResult2 = await agent(
    `运行 git diff 和 git diff --cached，合并返回完整 diff 内容。`,
    { label: '获取 diff-2', phase: '对抗审查', schema: DIFF_SCHEMA }
  )

  const reviewResult2 = await agent(
    adversarialPrompt(diffResult2.content),
    { label: '二次对抗审查', phase: '对抗审查', schema: REVIEW_SCHEMA }
  )

  if (reviewResult2.has_blocker) {
    await agent(
      `将 b-queue/${taskId}.md 状态改回 \`status: [可取]\`。
在 status.yml 找到 id=${taskId} 的 task，status 改回 \`可取\`，assigned_to 改为 null。
git add b-queue/${taskId}.md status.yml
git commit -m "chore(b-queue): ${taskId} 二次对抗审查阻断，回退 [可取]"`,
      { label: '升级·二次审查阻断', phase: '对抗审查' }
    )
    log('⚠️ 升级给人工：二次对抗审查仍有阻断')
    return {
      escalated: true,
      reason: 'review_blocker_round2',
      task_id: taskId,
      blockers: reviewResult2.blockers,
    }
  }

  const allSuggestions = [...reviewResult.suggestions, ...reviewResult2.suggestions]
  if (allSuggestions.length > 0) {
    await agent(
      `在 backlog.md 末尾追加以下内容（每条一行，日期用今天的 YYYY-MM-DD）：
${allSuggestions.map(s => `- [ ] {今天日期} | [CR-建议] ${s} | 来源：${taskId}`).join('\n')}`,
      { label: '记录建议到 backlog', phase: '对抗审查' }
    )
  }
} else if (reviewResult.suggestions.length > 0) {
  await agent(
    `在 backlog.md 末尾追加以下内容（每条一行，日期用今天的 YYYY-MM-DD）：
${reviewResult.suggestions.map(s => `- [ ] {今天日期} | [CR-建议] ${s} | 来源：${taskId}`).join('\n')}`,
    { label: '记录建议到 backlog', phase: '对抗审查' }
  )
}

log('对抗审查完成，无阻断')

// ── Phase 4：Commit + PR ──────────────────────────────────────────

phase('Commit + PR')

const acChecklist = taskInfo.acceptance_criteria
  .map((ac, i) => `- [x] AC${i + 1}：${ac}`)
  .join('\n     ')

const prResult = await agent(
  `当前工作目录是项目根目录。执行以下操作（按序，不可跳过）：

1. 确认当前在分支 ${taskId}。如不在则：
   git checkout -b ${taskId}（新建）或 git checkout ${taskId}（已存在）

2. git add ${taskInfo.files.join(' ')}
   git commit -m "fix(${taskId}): ${taskInfo.title}"

3. git push origin ${taskId}
   （触发本 workflow 即为对此 push 的授权）

4. 创建 PR（使用 /gitee-ops 或 gh pr create，根据项目远端类型选择）：
   标题：${taskId}：${taskInfo.title}
   Body：
     ## ${taskId}：${taskInfo.title}

     > 由 B 类 Dynamic Workflow 自动执行

     ### 改动摘要
     B 类自动修复（dispatch-new 任务包驱动，fix-test loop + 对抗审查）

     ### Acceptance Criteria 验证
     ${acChecklist}

     ### 偏离说明
     无（脚本约束只改 task 包 files 字段内文件）

     ### 遗留问题
     见 backlog.md（如有 CR 建议已自动记入）

**返回**：{ pr_number: N, pr_url: '...' }`,
  { label: 'Commit + PR', phase: 'Commit + PR', schema: PR_SCHEMA }
)

log(`PR #${prResult.pr_number} 已创建`)

// ── Phase 5：状态更新 ─────────────────────────────────────────────

phase('状态更新')

await agent(
  `当前工作目录是项目根目录。执行以下状态更新（按序）：

1. 将 b-queue/${taskId}.md 中的状态改为 \`status: [done]\`

2. 在 status.yml 中找到 id=${taskId} 的 task：
   - status 改为 \`done\`
   - pr 改为 ${prResult.pr_number}

3. 在 b-tasks.md 中找到 task-id 为 ${taskId} 的行，在行末追加 \`PR#${prResult.pr_number} 待审\`
   （如 b-tasks.md 不存在，创建并写入一行：\`${taskId} | ${taskInfo.title} | PR#${prResult.pr_number} 待审\`）

4. git add b-queue/${taskId}.md status.yml b-tasks.md
   git commit -m "chore(b-queue): ${taskId} 标记 [done]，PR #${prResult.pr_number}"
   git push origin ${taskId}`,
  { label: '状态更新', phase: '状态更新' }
)

log(`✅ B 类任务完成：${taskId}，PR #${prResult.pr_number} 等待人工 pr-review`)
return {
  success: true,
  task_id: taskId,
  pr_number: prResult.pr_number,
  pr_url: prResult.pr_url,
}
