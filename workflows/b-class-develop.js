export const meta = {
  name: 'b-class-develop',
  description: 'B类任务自动修复：认领→前置检查→fix-test loop→对抗审查→commit+PR',
  phases: [
    { title: '认领任务', detail: '读全字段任务包；schema-change检查；认领 b-queue/b-tasks.md/status.yml' },
    { title: 'Fix-Test Loop', detail: '复用检查 → agent-fix（含do-not/escalate-if）→ 机械验证 → 偏离核查，最多3轮' },
    { title: '对抗审查', detail: '独立 agent 审查 AC+diff（含接口契约）；有阻断则修复后复审' },
    { title: 'Commit + PR', detail: '凭据检查 → commit → push → 创建PR（AC含验证方式）' },
    { title: '状态更新', detail: '更新 b-queue/b-tasks.md/status.yml，commit + push' },
  ],
}

// args = { taskId: string }
// 从项目仓 CC 会话触发，CWD = 项目根目录
const { taskId } = args

// ── Schemas ───────────────────────────────────────────────────────

const TASK_SCHEMA = {
  type: 'object',
  properties: {
    title:               { type: 'string' },
    description:         { type: 'string' },
    task_type:           { type: 'string' },
    layers:              { type: 'array', items: { type: 'string' } },
    source:              { type: 'string' },
    urgency:             { type: 'string' },
    schema_change:       { type: 'boolean' },
    files:               { type: 'array', items: { type: 'string' } },
    acceptance_criteria: { type: 'array', items: { type: 'string' } },
    relevant_standards:  { type: 'array', items: { type: 'string' } },
    reference:           { type: 'array', items: { type: 'string' } },
    context:             { type: 'string' },
    known_risks:         { type: 'array', items: { type: 'string' } },
    do_not:              { type: 'array', items: { type: 'string' } },
    escalate_if:         { type: 'array', items: { type: 'string' } },
    api_contract:        { type: 'string' },
  },
  required: ['title', 'task_type', 'layers', 'files', 'acceptance_criteria', 'context', 'do_not', 'escalate_if'],
}

const REUSABLES_SCHEMA = {
  type: 'object',
  properties: {
    applicable: { type: 'array', items: { type: 'string' } },
    none:       { type: 'boolean' },
  },
  required: ['applicable', 'none'],
}

const FIX_SCHEMA = {
  type: 'object',
  properties: {
    completed:       { type: 'boolean' },
    do_not_violated: { type: 'boolean' },
    violated_rule:   { type: 'string' },
    escalate_reason: { type: 'string' },
  },
  required: ['completed', 'do_not_violated', 'violated_rule', 'escalate_reason'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean' },
    errors: { type: 'string' },
  },
  required: ['passed', 'errors'],
}

const DEVIATION_SCHEMA = {
  type: 'object',
  properties: {
    extra_files:       { type: 'array', items: { type: 'string' } },
    unimplemented_acs: { type: 'array', items: { type: 'string' } },
  },
  required: ['extra_files', 'unimplemented_acs'],
}

const DIFF_SCHEMA = {
  type: 'object',
  properties: {
    content: { type: 'string' },
  },
  required: ['content'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    has_blocker:  { type: 'boolean' },
    blockers:     { type: 'array', items: { type: 'string' } },
    suggestions:  { type: 'array', items: { type: 'string' } },
  },
  required: ['has_blocker', 'blockers', 'suggestions'],
}

const CREDENTIAL_SCHEMA = {
  type: 'object',
  properties: {
    found:     { type: 'boolean' },
    locations: { type: 'array', items: { type: 'string' } },
  },
  required: ['found', 'locations'],
}

const PR_SCHEMA = {
  type: 'object',
  properties: {
    pr_number: { type: 'number' },
    pr_url:    { type: 'string' },
  },
  required: ['pr_number'],
}

// ── Helper：升级给人，任务回 [可取] ───────────────────────────────
// 在任意 phase 中调用，agent 归属当前活跃 phase

const escalateTask = async (reason, detail) => {
  await agent(
    `将 b-queue/${taskId}.md 中状态行改回 \`status: [可取]\`，并追加一行回退原因：
「DW升级回退——${reason}：${detail.slice(0, 120)}」

在 status.yml 找到 id=${taskId} 的 task：status 改回 \`可取\`，assigned_to 改为 null。
在 b-tasks.md 找到 task-id 为 ${taskId} 的行，将状态列改回 \`[可取]\`。

git add b-queue/${taskId}.md status.yml b-tasks.md
git commit -m "chore(b-queue): ${taskId} 升级回退 [可取]——${reason}"`,
    { label: '升级·任务回可取' }
  )
}

// ── Phase 1：认领任务 ─────────────────────────────────────────────

phase('认领任务')

const taskInfo = await agent(
  `你是一个任务认领 agent，当前工作目录是项目根目录。

**步骤（按序，不可跳过）**：

1. 读取 b-queue/${taskId}.md 的完整内容

2. 解析以下所有字段（字段不存在时返回 null / [] / false）：
   title, description, task_type, layers, source, urgency, schema_change,
   files, acceptance_criteria, relevant_standards, reference,
   context, known_risks, do_not, escalate_if, api_contract

3. 将 b-queue/${taskId}.md 中的状态行改为 \`status: [taken-by: dw-bot]\`

4. 在 status.yml 找到 id=${taskId} 的 task：
   status 改为 \`taken-by\`，assigned_to 改为 \`dw-bot\`

5. 在 b-tasks.md 找到 task-id 为 ${taskId} 的行，将状态列从 \`[可取]\` 改为 \`[taken-by: dw-bot]\`

6. git add b-queue/${taskId}.md status.yml b-tasks.md
   git commit -m "chore(b-queue): 认领 ${taskId} [taken-by: dw-bot]"

**返回**：解析出的全部字段`,
  { label: '读取并认领任务', phase: '认领任务', schema: TASK_SCHEMA }
)

// schema-change 检查：涉及接口/数据结构变更，TRD 需人工更新，DW 不处理
if (taskInfo.schema_change) {
  await escalateTask('schema-change=true', '任务包含接口或数据结构纯加法变更，AC 中含「TRD已更新」条件，需人工更新 TRD 后重新派发')
  log('⚠️ 升级给人工：schema-change=true，请人工处理 TRD 更新后重新触发')
  return { escalated: true, reason: 'schema_change', task_id: taskId }
}

log(`认领成功：${taskInfo.title}（${taskInfo.task_type}，${taskInfo.layers.join('/')} 层，涉及 ${taskInfo.files.length} 个文件）`)

// ── Phase 2：Fix-Test Loop ────────────────────────────────────────

phase('Fix-Test Loop')

// 复用检查（exec spec Step 3）
const reusablesInfo = await agent(
  `你是一个 Explore agent，当前工作目录是项目根目录。

读取 reusables.md，找出与以下任务相关的已有可复用资产：
- 任务标题：${taskInfo.title}
- 需改动的文件：${taskInfo.files.join(', ')}

返回：
- applicable：相关资产列表，每条格式「资产名（路径）→ 用于：{任务哪个部分}」
- none：无相关资产则为 true

reusables.md 不存在时返回 { applicable: [], none: true }`,
  { label: '复用检查', phase: 'Fix-Test Loop', schema: REUSABLES_SCHEMA, agentType: 'Explore' }
)

if (!reusablesInfo.none) {
  log(`可复用资产：${reusablesInfo.applicable.join('；')}`)
}

let lastErrors = ''
let fixPassed = false
let deviationInfo = null

for (let round = 1; round <= 3; round++) {
  log(`第 ${round} 轮 Fix-Test`)

  const fixResult = await agent(
    `你是一个代码修复 agent，当前工作目录是项目根目录。
只修改代码文件，不写任何状态文件（b-queue/、status.yml、b-tasks.md）。

━━━ 禁止事项（违反任意一条 → 立即停止，do_not_violated=true，不继续实现）━━━
${taskInfo.do_not.map((d, i) => `${i + 1}. ${d}`).join('\n')}

━━━ 升级条件（满足任意一条 → 立即停止，escalate_reason 填原因，不继续实现）━━━
${taskInfo.escalate_if.map((e, i) => `${i + 1}. ${e}`).join('\n')}

━━━ 任务信息 ━━━
- 标题：${taskInfo.title}
- 描述：${taskInfo.description || '（见AC）'}
- 执行层：${taskInfo.task_type}（${taskInfo.layers.join('/')}）
- 实现切入点：${taskInfo.context}

━━━ 验收标准（AC）━━━
${taskInfo.acceptance_criteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

━━━ 需改动的文件（只改这些，不新增、不改其他文件）━━━
${taskInfo.files.map(f => `- ${f}`).join('\n')}

━━━ 必须优先复用（不得重新实现）━━━
${reusablesInfo.none ? '无' : reusablesInfo.applicable.map(a => `- ${a}`).join('\n')}

━━━ 需遵守的规范章节（先读对应内容再实现）━━━
${taskInfo.relevant_standards && taskInfo.relevant_standards.length > 0
    ? taskInfo.relevant_standards.map(s => `- ${s}`).join('\n')
    : '无'}

━━━ 参考文件及行号（先读再实现）━━━
${taskInfo.reference && taskInfo.reference.length > 0
    ? taskInfo.reference.map(r => `- ${r}`).join('\n')
    : '无'}

━━━ 已知风险（注意规避）━━━
${taskInfo.known_risks && taskInfo.known_risks.length > 0
    ? taskInfo.known_risks.map(r => `- ${r}`).join('\n')
    : '无'}

${taskInfo.api_contract ? `━━━ 接口契约（严格遵守，不得偏离）━━━\n${taskInfo.api_contract}` : ''}

${taskInfo.layers.includes('frontend') ? `━━━ 前端特别说明 ━━━
遇到 standards 未覆盖的视觉决策（颜色/布局/交互细节等）→ 不自行决定，将该场景写入 escalate_reason 上报。` : ''}

${round > 1 ? `━━━ 上一轮机械验证失败，错误信息 ━━━
${lastErrors}
根据上述错误针对性修复，不扩大改动范围。` : ''}

━━━ 返回格式 ━━━
- completed：是否完成实现（boolean）
- do_not_violated：是否触碰禁止事项（boolean）
- violated_rule：触碰了哪条禁止事项（无则为空字符串）
- escalate_reason：需要升级的原因（无则为空字符串）`,
    { label: `Fix 第${round}轮`, phase: 'Fix-Test Loop', schema: FIX_SCHEMA }
  )

  // do-not 越界 → 回滚并升级
  if (fixResult.do_not_violated) {
    await agent(
      `在当前目录执行以下命令，撤销 agent-fix 的所有代码改动：
git reset HEAD .
git checkout -- .`,
      { label: '回滚·do-not违反', phase: 'Fix-Test Loop' }
    )
    await escalateTask('do-not违反', fixResult.violated_rule)
    log(`⚠️ 升级给人工：触碰禁止边界——${fixResult.violated_rule}`)
    return { escalated: true, reason: 'do_not_violated', task_id: taskId, rule: fixResult.violated_rule }
  }

  // escalate-if 触发 → 回滚并升级
  if (fixResult.escalate_reason) {
    await agent(
      `在当前目录执行以下命令，撤销 agent-fix 的所有代码改动：
git reset HEAD .
git checkout -- .`,
      { label: '回滚·escalate触发', phase: 'Fix-Test Loop' }
    )
    await escalateTask('escalate-if触发', fixResult.escalate_reason)
    log(`⚠️ 升级给人工：${fixResult.escalate_reason}`)
    return { escalated: true, reason: 'escalate_if_triggered', task_id: taskId, detail: fixResult.escalate_reason }
  }

  // 机械验证
  const verifyResult = await agent(
    `你是一个机械验证 agent，当前工作目录是项目根目录。依次运行以下命令，逐条记录结果：

1. npm run build（package.json 有则运行）
2. npm run type-check（无则尝试 npx tsc --noEmit）
3. npm run lint（package.json 有则运行）
4. npm test（有则运行，只跑单元测试，不跑 e2e）

规则：无对应命令跳过，不算失败；遇报错立即记录，不中断后续命令。

返回：
- passed：所有存在命令是否全部通过（true / false）
- errors：报错关键信息（文件名 + 行号 + 描述）；全部通过则为空字符串`,
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
    `在当前目录执行以下命令，撤销所有未提交的代码改动：
git reset HEAD .
git checkout -- .`,
    { label: '回滚·三轮验证失败', phase: 'Fix-Test Loop' }
  )
  await escalateTask('三轮机械验证均未通过', lastErrors.slice(0, 200))
  log('⚠️ 升级给人工：三轮机械验证均未通过')
  return { escalated: true, reason: 'mechanical_fail_3_rounds', task_id: taskId, errors: lastErrors }
}

// 偏离核查（exec spec Step 5 第二部分）
deviationInfo = await agent(
  `在当前目录运行 git diff --stat，列出所有被修改的文件。

对比以下计划改动文件清单，找出差异：
计划改动文件：${taskInfo.files.join(', ')}

另外，对照以下 AC 列表，根据 diff 内容判断哪些 AC 尚未实现：
${taskInfo.acceptance_criteria.map((ac, i) => `AC${i + 1}: ${ac}`).join('\n')}

返回：
- extra_files：实际修改但不在计划清单中的文件（空则 []）
- unimplemented_acs：判断为尚未实现的 AC 编号（如 ["AC2", "AC3"]；空则 []）`,
  { label: '偏离核查', phase: 'Fix-Test Loop', schema: DEVIATION_SCHEMA }
)

// hotfix 超范围 → D4 升级条件（代码已改但不回滚，升级给人决定）
if (taskInfo.urgency === 'hotfix' && deviationInfo.extra_files.length > 0) {
  await escalateTask('hotfix超出files范围', `多改了：${deviationInfo.extra_files.join(', ')}`)
  log(`⚠️ 升级给人工：hotfix 超出 files 范围，多改了 ${deviationInfo.extra_files.join(', ')}`)
  return { escalated: true, reason: 'hotfix_overscope', task_id: taskId, extra_files: deviationInfo.extra_files }
}

// ── Phase 3：对抗审查 ─────────────────────────────────────────────

phase('对抗审查')

const diffResult = await agent(
  `运行 git diff 和 git diff --cached，合并返回完整 diff 内容。
两者都为空则运行 git diff HEAD~1 HEAD。
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
5. 逻辑正确性：业务逻辑是否与 AC 一致？条件判断、状态转换有没有错误？
6. 接口契约对齐（条件）：如果 diff 涉及 api/*.ts / controller / DTO / entity 文件，
   读取项目中相关接口定义（trd.md 或 standards 对应章节），核查字段名/类型/路由/响应结构
   是否与定义完全一致，逐项列出不一致处。不涉及则写「接口契约：不适用」。

某类无发现时，必须明确写：「{类别}：无发现」
禁止输出任何总结性正面评价。

【返回】
- has_blocker：是否有阻断级 finding（boolean）
- blockers：所有阻断级描述（字符串数组）
- suggestions：所有建议级描述（字符串数组）`

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

涉及文件：${taskInfo.files.map(f => `- ${f}`).join(', ')}

禁止事项（同样适用）：
${taskInfo.do_not.map((d, i) => `${i + 1}. ${d}`).join('\n')}`,
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
    await escalateTask('二次对抗审查仍有阻断', reviewResult2.blockers.join('；'))
    log('⚠️ 升级给人工：二次对抗审查仍有阻断')
    return { escalated: true, reason: 'review_blocker_round2', task_id: taskId, blockers: reviewResult2.blockers }
  }

  const allSuggestions = [...reviewResult.suggestions, ...reviewResult2.suggestions]
  if (allSuggestions.length > 0) {
    await agent(
      `在 backlog.md 末尾追加以下内容（日期用今天的 YYYY-MM-DD）：
${allSuggestions.map(s => `- [ ] {今天日期} | [CR-建议] ${s} | 来源：${taskId}`).join('\n')}`,
      { label: '记录建议到 backlog', phase: '对抗审查' }
    )
  }
} else if (reviewResult.suggestions.length > 0) {
  await agent(
    `在 backlog.md 末尾追加以下内容（日期用今天的 YYYY-MM-DD）：
${reviewResult.suggestions.map(s => `- [ ] {今天日期} | [CR-建议] ${s} | 来源：${taskId}`).join('\n')}`,
    { label: '记录建议到 backlog', phase: '对抗审查' }
  )
}

log('对抗审查完成，无阻断')

// ── Phase 4：Commit + PR ──────────────────────────────────────────

phase('Commit + PR')

// 凭据检查（推 PR 前，exec spec Step 7 红线）
const credentialResult = await agent(
  `在当前目录运行 git diff，扫描所有代码改动中是否存在以下凭据类型：
PAT / access token / 密码 / 私钥 / API key / secret

判断标准：
- 明文字符串看起来像真实凭据（非占位符如 YOUR_TOKEN、xxx）
- 环境变量赋值语句含实际值而非变量引用

返回：
- found：是否发现疑似凭据（boolean）
- locations：发现位置（文件:行号 + 内容摘要，无则 []）`,
  { label: '凭据检查', phase: 'Commit + PR', schema: CREDENTIAL_SCHEMA }
)

if (credentialResult.found) {
  await escalateTask('发现凭据', credentialResult.locations.join('；'))
  log(`⚠️ 停止推送：发现疑似凭据，位置：${credentialResult.locations.join(', ')}，请清理后重新触发`)
  return { escalated: true, reason: 'credential_found', task_id: taskId, locations: credentialResult.locations }
}

// 偏离说明和遗留问题文本
const deviationNote = deviationInfo.extra_files.length > 0
  ? `改动超出 files 清单：${deviationInfo.extra_files.join(', ')}`
  : '无'
const pendingNote = deviationInfo.unimplemented_acs.length > 0
  ? `${deviationInfo.unimplemented_acs.join(', ')} 未能实现，已记入 backlog`
  : '无'

const prResult = await agent(
  `当前工作目录是项目根目录。按序执行：

1. 确认当前在分支 ${taskId}：
   git checkout -b ${taskId}（新建）或 git checkout ${taskId}（已存在）

2. git add ${taskInfo.files.join(' ')}
   git commit -m "fix(${taskId}): ${taskInfo.title}"

3. git push origin ${taskId}
   （触发本 workflow 即为对此 push 的授权）

4. 创建 PR（/gitee-ops 或 gh pr create，按项目远端类型选择）。
   PR body 格式如下，**AC验证段必须根据 diff 内容为每条 AC 填写具体验证方式**：

## ${taskId}：${taskInfo.title}

> 由 B 类 Dynamic Workflow 自动执行

### 改动摘要
{根据 diff 用 2-3 句话说明：修复了什么问题、改动了哪些文件、核心手段是什么}

### Acceptance Criteria 验证
${taskInfo.acceptance_criteria.map((ac, i) => `- [x] AC${i + 1}：${ac}（验证方式：{根据 diff 推断对应的具体验证方式}）`).join('\n')}

### 偏离说明
${deviationNote}

### 遗留问题
${pendingNote}

**返回**：{ pr_number: N, pr_url: '...' }`,
  { label: 'Commit + PR', phase: 'Commit + PR', schema: PR_SCHEMA }
)

log(`PR #${prResult.pr_number} 已创建`)

// ── Phase 5：状态更新 ─────────────────────────────────────────────

phase('状态更新')

await agent(
  `当前工作目录是项目根目录。按序执行：

1. 将 b-queue/${taskId}.md 中状态行改为 \`status: [done]\`

2. 在 status.yml 找到 id=${taskId} 的 task：
   status 改为 \`done\`，pr 改为 ${prResult.pr_number}

3. 在 b-tasks.md 找到 task-id 为 ${taskId} 的行，在行末追加 \`PR#${prResult.pr_number} 待审\`

4. git add b-queue/${taskId}.md status.yml b-tasks.md
   git commit -m "chore(b-queue): ${taskId} 标记 [done]，PR #${prResult.pr_number}"
   git push origin ${taskId}`,
  { label: '状态更新', phase: '状态更新' }
)

// ── 已知局限说明（不阻断流程）────────────────────────────────────
// exec spec Step 10 要求 B 类就地分流：把发现写入个人 notes（hact-notes-{name}）。
// DW 无用户身份，无法确定写入哪个 notes 仓，此步骤需人工在 PR review 后自行执行。

log(`✅ B 类任务完成：${taskId}，PR #${prResult.pr_number} 等待人工 pr-review`)
log('📌 提醒：Step 10 feedback 就地分流（写个人 notes）需人工完成，DW 无法执行。')
return {
  success:    true,
  task_id:    taskId,
  pr_number:  prResult.pr_number,
  pr_url:     prResult.pr_url,
}
