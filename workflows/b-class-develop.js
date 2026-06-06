export const meta = {
  name: 'b-class-develop',
  description: 'B类任务自动修复：认领→前置检查→fix-test loop→对抗审查→commit+PR',
  phases: [
    { title: '认领任务', detail: '读全字段任务包；schema-change检查；认领 b-queue/b-tasks.md/status.yml；push 到远端' },
    { title: 'Fix-Test Loop', detail: '复用检查 → agent-fix（含最小测试/do-not/escalate-if）→ 机械验证 → 偏离核查，最多3轮' },
    { title: '对抗审查', detail: '独立 agent 审查 AC+diff（含接口契约）；有阻断则修复后复审' },
    { title: 'Commit + PR', detail: '清理范围外文件 → 凭据检查 → commit → push → 创建PR' },
    { title: '状态更新', detail: '更新 b-queue/b-tasks.md/status.yml，commit + push' },
  ],
}

// args 可能是 JS 对象或 JSON 字符串（workflow harness 行为），统一 parse
const _parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args || {})
const taskId = String(_parsedArgs.taskId || '')

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

// test_files：agent-fix 新建或修改的测试文件路径，供 Phase 4 一并 git add
const FIX_SCHEMA = {
  type: 'object',
  properties: {
    completed:       { type: 'boolean' },
    do_not_violated: { type: 'boolean' },
    violated_rule:   { type: 'string' },
    escalate_reason: { type: 'string' },
    test_files:      { type: 'array', items: { type: 'string' } },
  },
  required: ['completed', 'do_not_violated', 'violated_rule', 'escalate_reason', 'test_files'],
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

// push_local / push_remote：git push 之后由 agent 读回，JS 判断是否一致
const PR_SCHEMA = {
  type: 'object',
  properties: {
    pr_number:   { type: 'number' },
    pr_url:      { type: 'string' },
    push_local:  { type: 'string' },
    push_remote: { type: 'string' },
  },
  required: ['pr_number', 'push_local', 'push_remote'],
}

// 回滚后工作树状态：JS 判断 stdout.trim() === '' 才算干净
const ROLLBACK_SCHEMA = {
  type: 'object',
  properties: {
    status_porcelain: { type: 'string' },
  },
  required: ['status_porcelain'],
}

// push 验证：由 JS 比较两个 sha，不交给 agent 判断
const PUSH_VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    local_sha:  { type: 'string' },
    remote_sha: { type: 'string' },
  },
  required: ['local_sha', 'remote_sha'],
}

// Phase 5 状态更新 push 验证
const STATE_SCHEMA = {
  type: 'object',
  properties: {
    local_sha:  { type: 'string' },
    remote_sha: { type: 'string' },
  },
  required: ['local_sha', 'remote_sha'],
}

// ── Helper：验证 push 是否到达远端，返回 boolean ─────────────────
// JS 做判断：不信 agent 自评，只信 sha 是否相等
const verifyPush = async (branch, label) => {
  const result = await agent(
    `运行以下两条命令，将输出原样返回，不做任何判断：
1. git rev-parse HEAD（返回本地当前 commit 的完整 sha）
2. git ls-remote origin ${branch} | awk '{print $1}'
   （返回远端该分支的 sha；如果输出为空说明远端没有该分支，返回字符串 "not_found"）`,
    { label: label || `push验证·${branch}`, schema: PUSH_VERIFY_SCHEMA }
  )
  return result.local_sha === result.remote_sha && result.remote_sha !== 'not_found'
}

// ── Helper：升级给人，任务回 [可取]，push 并验证 ─────────────────
const escalateTask = async (reason, detail) => {
  await agent(
    `将 b-queue/${taskId}.md 中状态行改回 \`status: [可取]\`，追加回退原因一行：
「DW升级回退——${reason}：${detail.slice(0, 120)}」

在 status.yml 找到 id=${taskId} 的 task：status 改回 \`可取\`，assigned_to 改为 null。
在 b-tasks.md 找到 task-id 为 ${taskId} 的行，将状态列改回 \`[可取]\`。

git add b-queue/${taskId}.md status.yml b-tasks.md
git commit -m "chore(b-queue): ${taskId} 升级回退 [可取]——${reason}"
git push origin HEAD`,
    { label: '升级·任务回可取' }
  )
  // 技术一：JS 验证 push 是否到达远端，不信 agent 自评
  const pushOk = await verifyPush('HEAD', '升级push验证')
  if (!pushOk) {
    log(`⚠️ 升级状态未推到远端，请手动执行: git push origin HEAD（本地已有提交）`)
  }
}

// ── Helper：回滚工作树代码改动，返回是否回滚干净 ─────────────────
// 技术一：agent 执行 reset/checkout，再读 git status --porcelain 原文返回
// JS 判断 stdout.trim() === '' 才算真正干净，不信 agent 自评
const rollbackCode = async (label) => {
  const result = await agent(
    `按序执行：
1. git reset HEAD .
2. git checkout -- .
3. 运行 git status --porcelain，将输出原样返回（不做任何判断或解释）

返回：status_porcelain 字段填 git status --porcelain 的完整 stdout。
工作树干净时该命令无输出，此时返回空字符串 ""。`,
    { label: label || '回滚代码改动', schema: ROLLBACK_SCHEMA }
  )
  const clean = result.status_porcelain.trim() === ''
  if (!clean) {
    log(`⚠️ 回滚验证失败：工作树仍有改动，请人工检查：\n${result.status_porcelain}`)
  }
  return clean
}

// ── Phase 1：认领任务 ─────────────────────────────────────────────

phase('认领任务')

// Phase 1 策略：单 agent 做 git 操作并返回文件原文（单字段 schema 可靠），JS 解析字段
// 避免 TASK_SCHEMA（8+字段）导致 StructuredOutput input:{} 失效 + taskId 插值在 resume 时可能丢失
const CLAIM_SCHEMA = {
  type: 'object',
  properties: { task_content: { type: 'string' } },
  required: ['task_content'],
}

const claimResult = await agent(
  `你是一个任务认领 agent，当前工作目录是项目根目录。

**步骤（按序，不可跳过）**：

1. 读取 b-queue/${taskId}.md 的完整内容（记录备用）

2. 将 b-queue/${taskId}.md 中的状态行改为 \`status: [taken-by: dw-bot]\`

3. 在 status.yml 找到 id=${taskId} 的 task：
   status 改为 \`taken-by\`，assigned_to 改为 \`dw-bot\`

4. 在 b-tasks.md 找到 task-id 为 ${taskId} 的行，将状态列从 \`[可取]\` 改为 \`[taken-by: dw-bot]\`

5. git add b-queue/${taskId}.md status.yml b-tasks.md
   git commit -m "chore(b-queue): 认领 ${taskId} [taken-by: dw-bot]"
   git push origin HEAD

**返回**：task_content 字段填入步骤1读取的 b-queue/${taskId}.md 完整原文（含所有 ## 章节）。`,
  { label: '认领·读取任务包', phase: '认领任务', schema: CLAIM_SCHEMA }
)

// JS 解析任务包字段（不依赖 LLM 结构化输出，确定性强）
const md = claimResult.task_content || ''
const _get = (key) => { const m = md.match(new RegExp(`^${key}:\\s*(.+)$`, 'm')); return m ? m[1].trim() : null }
const _section = (key) => { const m = md.match(new RegExp(`## ${key}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i')); return m ? m[1].trim() : '' }
const _list = (key) => _section(key).split('\n').filter(l => /^[\-\*\d]/.test(l.trim())).map(l => l.replace(/^[\-\*\d\.\s]+/, '').trim()).filter(Boolean)
const _layers = (s) => (s||'').replace(/[\[\]\s]/g,'').split(',').filter(Boolean)

const taskInfo = {
  title:                _get('title'),
  task_type:            _get('task_type'),
  layers:               _layers(_get('layers')),
  source:               _get('source'),
  urgency:              _get('urgency'),
  schema_change:        _get('schema_change') === 'true',
  files:                _list('files'),
  acceptance_criteria:  _list('acceptance_criteria'),
  relevant_standards:   _list('relevant_standards'),
  reference:            _list('reference'),
  context:              _section('context'),
  known_risks:          _list('known_risks'),
  do_not:               _list('do_not'),
  escalate_if:          _list('escalate_if'),
  api_contract:         _get('api_contract'),
}

// 技术一：验证 Phase 1 认领 push 是否到达远端
const phase1PushOk = await verifyPush('HEAD', '认领push验证')
if (!phase1PushOk) {
  log('⚠️ 认领状态未推到远端，请手动执行: git push origin HEAD（本地已有提交）')
}

// schema-change=true：AC 含「TRD已更新」条件，需人工决策，DW 不处理
if (taskInfo.schema_change) {
  await escalateTask('schema-change=true', '任务含接口或数据结构变更，TRD 需人工更新后重新派发')
  log('⚠️ 升级给人工：schema-change=true')
  return { escalated: true, reason: 'schema_change', task_id: taskId }
}

log(`认领成功：${taskInfo.title}（${taskInfo.task_type}，${taskInfo.layers.join('/')}层，${taskInfo.files.length} 个文件）`)

// ── Phase 2：Fix-Test Loop ────────────────────────────────────────

phase('Fix-Test Loop')

// Step 3：复用检查
const reusablesInfo = await agent(
  `你是一个 Explore agent，当前工作目录是项目根目录。

读取 reusables.md，找出与以下任务相关的已有可复用资产：
- 任务标题：${taskInfo.title}
- 需改动的文件：${taskInfo.files.join(', ')}

返回：
- applicable：相关资产列表（每条格式：「资产名（路径）→ 用于：任务哪个部分」）
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
let testFiles = []

for (let round = 1; round <= 3; round++) {
  log(`第 ${round} 轮 Fix-Test`)

  const quotedFiles = taskInfo.files.map(f => '"' + f + '"').join('\n')

  const fixResult = await agent(
    `你是一个代码修复 agent，当前工作目录是项目根目录。
只修改代码/测试文件，不写任何状态文件（b-queue/、status.yml、b-tasks.md）。

━━━ 禁止事项（违反任意一条 → 立即停止，do_not_violated=true）━━━
${taskInfo.do_not.map((d, i) => `${i + 1}. ${d}`).join('\n')}

━━━ 升级条件（满足任意一条 → 立即停止，escalate_reason 填原因）━━━
${taskInfo.escalate_if.map((e, i) => `${i + 1}. ${e}`).join('\n')}

━━━ 任务信息 ━━━
- 标题：${taskInfo.title}
- 描述：${taskInfo.description || '（见AC）'}
- 执行层：${taskInfo.task_type}（${taskInfo.layers.join('/')}）
- 实现切入点：${taskInfo.context}

━━━ 验收标准（AC）━━━
${taskInfo.acceptance_criteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

━━━ 需改动的文件（只改这些，不新增、不改其他代码文件）━━━
${quotedFiles}

━━━ 必须优先复用（不得重新实现）━━━
${reusablesInfo.none ? '无' : reusablesInfo.applicable.map(a => `- ${a}`).join('\n')}

━━━ 需遵守的规范章节（先读再实现）━━━
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
遇到 standards 未覆盖的视觉决策 → 不自行决定，将场景写入 escalate_reason 上报。` : ''}

━━━ 最小测试要求 ━━━
检查项目是否有测试框架（package.json 中有 jest/vitest/mocha 等，或存在 jest.config/vitest.config）：
- 有测试框架：为每条 AC 编写至少一个最小单元测试，只覆盖核心路径；
  测试文件放在与被测文件同目录的 __tests__/ 下，或与项目已有测试目录保持一致；
  将新建或修改的测试文件路径列入 test_files。
- 无测试框架：跳过测试编写，test_files 返回 []。

${round > 1 ? `━━━ 上一轮机械验证失败 ━━━
${lastErrors}
针对以上错误修复，不扩大改动范围。` : ''}

━━━ 返回字段说明 ━━━
- completed：实现是否完成（boolean）
- do_not_violated：是否触碰禁止事项（boolean）
- violated_rule：触碰了哪条（无则返回空字符串 ''，不要返回"无"/"N/A"等文字）
- escalate_reason：升级原因（无需升级时必须返回空字符串 ''，不要返回"无"/"N/A"等文字）
- test_files：新建或修改的测试文件路径列表（无则 []）`,
    { label: `Fix 第${round}轮`, phase: 'Fix-Test Loop', schema: FIX_SCHEMA }
  )

  // 累积测试文件（跨轮去重）
  if (fixResult.test_files && fixResult.test_files.length > 0) {
    const seen = new Set(testFiles)
    for (const f of fixResult.test_files) {
      if (!seen.has(f)) { seen.add(f); testFiles.push(f) }
    }
  }

  // do-not 越界 → 回滚并升级
  if (fixResult.do_not_violated) {
    await rollbackCode('回滚·do-not违反')
    await escalateTask('do-not违反', fixResult.violated_rule)
    log(`⚠️ 升级给人工：触碰禁止边界——${fixResult.violated_rule}`)
    return { escalated: true, reason: 'do_not_violated', task_id: taskId, rule: fixResult.violated_rule }
  }

  // escalate-if 触发（严格判断：空字符串才放行）
  if (fixResult.escalate_reason.trim() !== '') {
    await rollbackCode('回滚·escalate触发')
    await escalateTask('escalate-if触发', fixResult.escalate_reason)
    log(`⚠️ 升级给人工：${fixResult.escalate_reason}`)
    return { escalated: true, reason: 'escalate_if_triggered', task_id: taskId, detail: fixResult.escalate_reason }
  }

  // 实现未完成（completed=false 且无明确原因）
  if (!fixResult.completed) {
    await rollbackCode('回滚·实现未完成')
    await escalateTask('实现未完成', `第 ${round} 轮 agent-fix 未完成实现，且未给出明确原因`)
    log('⚠️ 升级给人工：agent-fix 未完成实现')
    return { escalated: true, reason: 'fix_incomplete', task_id: taskId, round }
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
  await rollbackCode('回滚·三轮验证失败')
  await escalateTask('三轮机械验证均未通过', lastErrors.slice(0, 200))
  log('⚠️ 升级给人工：三轮机械验证均未通过')
  return { escalated: true, reason: 'mechanical_fail_3_rounds', task_id: taskId, errors: lastErrors }
}

// 偏离核查
deviationInfo = await agent(
  `在当前目录运行 git diff --stat，列出所有被修改的文件。

对比以下计划改动文件清单：
${taskInfo.files.map(f => `- "${f}"`).join('\n')}

另外，对照以下 AC 列表，根据 diff 判断哪些 AC 尚未实现：
${taskInfo.acceptance_criteria.map((ac, i) => `AC${i + 1}: ${ac}`).join('\n')}

返回：
- extra_files：实际修改但不在计划清单中的文件（不含测试文件，空则 []）
- unimplemented_acs：判断为尚未实现的 AC 编号，格式 ["AC2", "AC3"]（空则 []）`,
  { label: '偏离核查', phase: 'Fix-Test Loop', schema: DEVIATION_SCHEMA }
)

// hotfix 超范围 → D4 升级条件
if (taskInfo.urgency === 'hotfix' && deviationInfo.extra_files.length > 0) {
  await escalateTask('hotfix超出files范围', `多改了：${deviationInfo.extra_files.join(', ')}`)
  log(`⚠️ 升级给人工：hotfix 超出 files 范围`)
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

涉及文件：${taskInfo.files.map(f => '"' + f + '"').join(', ')}

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

// 清理范围外文件（extra_files 不提交，撤销其改动保持工作树干净）
if (deviationInfo.extra_files.length > 0) {
  await agent(
    `以下文件不在本次任务范围内，撤销它们的改动以保持工作树干净：
${deviationInfo.extra_files.map(f => `git checkout -- "${f}"`).join('\n')}

执行完后运行 git status 确认这些文件已恢复。`,
    { label: '清理范围外文件', phase: 'Commit + PR' }
  )
}

// 凭据检查（推 PR 前，exec spec Step 7 红线）
const credentialResult = await agent(
  `在当前目录运行 git diff 和 git diff --cached，扫描所有代码改动中是否存在以下凭据：
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
  log(`⚠️ 停止推送：发现疑似凭据——${credentialResult.locations.join(', ')}`)
  return { escalated: true, reason: 'credential_found', task_id: taskId, locations: credentialResult.locations }
}

// 构建 AC 验证段：unimplemented_acs 标 [ ]，其余标 [x]
const acLines = taskInfo.acceptance_criteria.map((ac, i) => {
  const acId = 'AC' + (i + 1)
  const unimplemented = deviationInfo.unimplemented_acs.some(u => u === acId)
  if (unimplemented) {
    return `- [ ] ${acId}：${ac}（未实现，见遗留问题）`
  }
  return `- [x] ${acId}：${ac}（验证方式：{根据 diff 内容填写具体验证方式}）`
}).join('\n')

// 偏离和遗留说明
const deviationNote = deviationInfo.extra_files.length > 0
  ? `改动超出 files 清单：${deviationInfo.extra_files.join(', ')}（已在提交前撤销）`
  : '无'
const pendingNote = deviationInfo.unimplemented_acs.length > 0
  ? `${deviationInfo.unimplemented_acs.join(', ')} 未能实现，已记入 backlog`
  : '无'

// git add 包含任务文件 + 测试文件，所有路径加引号防空格裂开
const allFilesToAdd = [...taskInfo.files, ...testFiles]
const quotedAllFiles = allFilesToAdd.map(f => '"' + f + '"').join(' ')

const prResult = await agent(
  `当前工作目录是项目根目录。按序执行：

1. 确认当前在分支 ${taskId}：
   git checkout -b ${taskId}（新建）或 git checkout ${taskId}（已存在）

2. git add ${quotedAllFiles}
   git commit -m "fix(${taskId}): ${taskInfo.title}"

3. git push origin ${taskId}
   （触发本 workflow 即为对此 push 的授权）

4. 创建 PR（/gitee-ops 或 gh pr create，按项目远端类型选择）。
   PR body（**AC验证段：已实现的条目根据 diff 填写验证方式，[x]/[ ] 严格按模板**）：

## ${taskId}：${taskInfo.title}

> 由 B 类 Dynamic Workflow 自动执行

### 改动摘要
{根据 diff 用 2-3 句话说明：修复了什么、改动了哪些文件、核心手段}

### Acceptance Criteria 验证
${acLines}

### 偏离说明
${deviationNote}

### 遗留问题
${pendingNote}

5. 运行以下两条命令，将输出原样填入返回值（不做判断）：
   git rev-parse HEAD → push_local
   git ls-remote origin ${taskId} | awk '{print $1}' → push_remote
   （push_remote 为空则填 "not_found"）

**返回**：{ pr_number: N, pr_url: '...', push_local: '...', push_remote: '...' }`,
  { label: 'Commit + PR', phase: 'Commit + PR', schema: PR_SCHEMA }
)

// 技术一：JS 验证 Phase 4 push 是否到达远端
if (prResult.push_local !== prResult.push_remote || prResult.push_remote === 'not_found') {
  log(`⚠️ Phase 4 push 未到达远端。本地 SHA: ${prResult.push_local}，请手动: git push origin ${taskId}`)
}

log(`PR #${prResult.pr_number} 已创建`)

// ── Phase 5：状态更新 ─────────────────────────────────────────────

phase('状态更新')

const stateResult = await agent(
  `当前工作目录是项目根目录。按序执行：

1. 将 b-queue/${taskId}.md 中状态行改为 \`status: [done]\`

2. 在 status.yml 找到 id=${taskId} 的 task：
   status 改为 \`done\`，pr 改为 ${prResult.pr_number}

3. 在 b-tasks.md 找到 task-id 为 ${taskId} 的行，在行末追加 \`PR#${prResult.pr_number} 待审\`

4. git add b-queue/${taskId}.md status.yml b-tasks.md
   git commit -m "chore(b-queue): ${taskId} 标记 [done]，PR #${prResult.pr_number}"
   git push origin ${taskId}

5. 运行以下两条命令，将输出原样填入返回值（不做判断）：
   git rev-parse HEAD → local_sha
   git ls-remote origin ${taskId} | awk '{print $1}' → remote_sha
   （remote_sha 为空则填 "not_found"）

**返回**：{ local_sha: '...', remote_sha: '...' }`,
  { label: '状态更新', phase: '状态更新', schema: STATE_SCHEMA }
)

// 技术一：JS 验证 Phase 5 push 是否到达远端
if (stateResult.local_sha !== stateResult.remote_sha || stateResult.remote_sha === 'not_found') {
  log(`⚠️ Phase 5 push 未到达远端。本地 SHA: ${stateResult.local_sha}，请手动: git push origin ${taskId}`)
}

// ── 已知局限（不阻断流程）────────────────────────────────────────
// exec spec Step 10：B 类就地分流写入个人 notes（hact-notes-{name}）。
// DW 无用户身份，无法确定写入哪个 notes 仓，需人工在 PR review 后执行。
// checklist 自检（templates/checklists/{layer}-checklist.md）：
// 当前未包含在机械验证中，由 pr-review 阶段人工核查。

log(`✅ B 类任务完成：${taskId}，PR #${prResult.pr_number} 等待人工 pr-review`)
log('📌 提醒：Step 10 feedback 就地分流（写个人 notes）需人工完成。')
return {
  success:    true,
  task_id:    taskId,
  pr_number:  prResult.pr_number,
  pr_url:     prResult.pr_url,
  test_files: testFiles,
}
