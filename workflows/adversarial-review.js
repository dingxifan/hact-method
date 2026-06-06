export const meta = {
  name: 'adversarial-review',
  description: '对 hact-method 方法论进行三角色对抗性审查，产出结构化分析报告',
  phases: [
    { title: '对抗性审查', detail: '三个独立 agent 各自读文件并从不同角度审查（并行）' },
    { title: '合并报告', detail: '去重排序，合并写入 findings.md' },
  ],
}

const FINDINGS_PATH = 'E:\\group-code\\hact-method\\_meta\\plans\\2026-06-06-method-audit\\findings.md'

// ─── 统一发现格式 ─────────────────────────────────────────────────────
const FORMAT = `每条发现使用以下格式：

### [问题标题]
**严重程度**: P0（系统性缺陷）/ P1（重要漏洞）/ P2（摩擦点）/ P3（优化建议）
**所在层**: skeleton / specs-structural / specs-execution / templates / 跨层
**定位**: 文件路径 § 章节名
**问题**: [2-3 句，说清楚"什么假设在什么条件下失效"]
**影响**: [不处理会导致什么]
**建议**: [具体改进方向]`

const READ_DOCS_STEP = `
**第一步：读取文档**
1. 使用 Glob 工具列出 E:\\group-code\\hact-method 下所有 .md 文件（pattern: **/*.md）
2. 过滤掉路径中包含 _meta、.git、docs 的文件
3. 对每个文件使用 Read 工具读取完整内容
4. 完成阅读后，进行下方的审查分析——**不要把文件内容复制到回复中，只输出你的发现**
`

// ─── Phase 1: 三角色并行对抗性审查（各自读文件）─────────────────────
phase('对抗性审查')
const [criticFindings, devFindings, aiFindings] = await parallel([
  () => agent(
    `你是一位资深方法论顾问，从未接触过 hact-method，见过大量"任务驱动""敏捷变体""人机协作"框架的兴衰。
${READ_DOCS_STEP}
职责：找出这套方法论在概念层面的根本性缺陷——逻辑矛盾、未验证假设、被设计者忽视的反例。只攻击"这套思想本身是否成立"，不关心执行细节。

---

从以下维度逐一深挖，为每个问题找到具体文件位置和章节支撑：

1. 任务驱动假设的边界：task.type 能真的替代角色身份吗？当同一人持有多个 discipline 授权时，"你是谁不重要"是否仍然成立？
2. Gate 价值质疑：5 个 Gate 对 5-8 人小团队是增值还是增负？签字摩擦成本是否被低估？
3. 拉取池模型的隐含假设：queue 假设开发者有足够上下文来自主选任务，这个假设在什么情况下失效？
4. B 类恒定 2 会期约束：真实 BUG 复杂度差异巨大，固定 2 会期是否是未经验证的赌注？
5. merged 终态不变量：用"修订路径"代替状态回退，在什么场景下会产生多个并存版本的认知混乱？
6. 23 条决策的内部一致性：逐条检查 BRIEF.md 关键决策，找出相互矛盾或将来会摩擦的决策对。
7. 方法论自举悖论：用 hact-method 开发 hact-app，方法论缺陷会否污染其自身的验证过程？

${FORMAT}

输出全部发现，不要自我审查。你的工作就是找缺陷。`,
    { label: '理论批评者', phase: '对抗性审查' }
  ),
  () => agent(
    `你是一名能力正常的后端开发者，今天是加入团队的第一天，没有任何 hact-method 先验知识，只能依赖文档行事。
${READ_DOCS_STEP}
职责：逐步骤地按规范走，记录每一个让你卡住、迷惑、或需要依赖隐性知识才能继续的点。不批判设计哲学，只报告"第 N 步我不知道该怎么做"。

---

模拟以下典型场景，在 specs-execution 文档中找操作盲区：

1. 认领任务：打开 queue/，有哪些任务间依赖关系没在文件里写清楚？
2. develop 全流程：specs-execution/develop.md 能否让我独立完成从拉任务到推 PR 的全程？哪些步骤依赖"默认你知道"的上下文？
3. PR 被打回：CR 给了结构性建议，pr-review + develop 规范里我的下一步是什么？路径是否清晰？
4. status.yml 并发更新：两名开发者同时修改 status.yml，规范里的冲突处理是否足够具体？
5. 跨任务依赖阻塞：我的任务依赖一个未完成的上游任务，规范是否告诉我该等待还是继续？
6. B 类紧急 BUG：收到紧急 BUG，dispatch-new.md 步骤是否完整？如何与进行中的 A 类任务并行？
7. CC 会话重开：关闭会话再重开，specs-execution 是否有足够的实操指引让我知道从哪里继续？

${FORMAT}

输出全部发现，具体指出哪个规范文件的哪个步骤导致困惑。`,
    { label: '现场开发者', phase: '对抗性审查' }
  ),
  () => agent(
    `你是一名专门审计"人机协作系统"可靠性的工程师，见过大量因过度信任 AI 而在生产环境翻车的案例。
${READ_DOCS_STEP}
职责：找出 hact-method 中对 CC（Claude Code）能力的过强假设，以及 CC 出错、迷失或不可用时，系统会在哪里静默失败或产生不可逆损失。

---

逐一排查以下风险维度：

1. 上下文丢失的静默错误：哪些任务规范依赖"CC 记得之前说过什么"？CC 在长会话中丢失上下文时，哪里会产生静默错误而非明显报错？
2. task.type 误判无检查：若用户声明了错误的 task.type，CC 加载错误规范，有没有早期发现机制？
3. 集成测试的 AI 幻觉风险：generate-integration-tests 自动生成联调脚本，CC 可能生成"通过但测了假场景"的脚本，规范里有防幻觉设计吗？
4. status.yml 写入可靠性：多处规范要求 CC 更新 status.yml，若 CC 写入格式错误的 YAML 或遗漏字段，失败如何被发现？有 schema 校验吗？
5. AI 测试与人工验收的边界模糊：generate-integration-tests 是否实际上替代了应由人做的验收？规范对边界的定义是否足够清晰？
6. CC 不可用的降级路径：每种 task type 的 specs-execution 是否有"CC 无法操作时人工如何处理"的降级描述？还是系统性缺失？
7. 双源规范的污染风险：draft-tech-design 从开发者个人 notes 拉取 [规范] 并入 standards，若 notes 里有错误规范，过滤机制在哪里？

${FORMAT}

输出全部发现，标出所有"CC 完美运行才能成立"的假设点。`,
    { label: 'AI风险审计者', phase: '对抗性审查' }
  ),
])

// ─── Phase 2: 合并报告并直接写入文件 ──────────────────────────────────
phase('合并报告')
await agent(
  `你是合并编辑。你收到了三份独立的 hact-method 方法论对抗性审查结果，需要合并成一份统一报告并直接写入文件。

=== 理论批评者的发现 ===
${criticFindings}

=== 现场开发者的发现 ===
${devFindings}

=== AI 风险审计者的发现 ===
${aiFindings}

---

合并步骤：
1. 去重：若多个 agent 发现同一问题，合并为一条，附注"（多角色共同发现：X + Y）"
2. 排序：P0 → P1 → P2 → P3；同级别内，跨层问题优先，其次 skeleton → specs-structural → specs-execution → templates
3. 跨层一致性检查：专门扫描骨架层定义与执行层描述之间的矛盾，作为独立章节
4. 总览统计：P0/P1/P2/P3 各多少条，多角色共同发现几条，Top 3 最高优先级问题

按以下结构输出完整报告（中文），然后使用 Write 工具将报告写入 ${FINDINGS_PATH}（完全覆盖）：

# hact-method 对抗性审查报告

## 总览
- P0 数量：
- P1 数量：
- P2 数量：
- P3 数量：
- 多角色共同发现：X 条
- Top 3 最高优先级问题：
  1.
  2.
  3.

## P0 — 系统性缺陷

## P1 — 重要漏洞

## P2 — 摩擦点

## P3 — 优化建议

## 跨层一致性问题`,
  { label: '合并并写入报告', phase: '合并报告' }
)

log(`审查完成，报告已写入 ${FINDINGS_PATH}`)
return '完成'
