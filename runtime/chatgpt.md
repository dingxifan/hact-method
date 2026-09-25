# ChatGPT Runtime Adapter

本文只描述当前 ChatGPT Runtime 如何实现 HACT capability。它不是 Task Contract，也不是项目事实来源。

## 1. Capability profile, not routing

ChatGPT 更适合：
- reasoning-heavy Task
- 需求澄清
- 产品/架构讨论
- 文档 Contract
- 计划
- 独立语义 review
- 高成本 decision analysis

ChatGPT 不因为“更会推理”而拥有更高 Authority。

以上只是 capability 倾向，不是切换规则。当前 Runtime 能在授权范围内完成并验证 bounded operation 时保持 Runtime affinity；不因工作从讨论进入文件、或从文件进入推理就自动换窗口。

## 2. Working Context

ChatGPT Project / Chat 是 Working Context，不是 Shared Project Truth。

草稿、未决方案和临时解释只有在形成 durable artifact 并进入 Git snapshot 后才成为 Shared Candidate / Accepted Truth。

删除 ChatGPT Project 不应导致项目无法恢复。

## 3. Bootstrap

开始正式 HACT Task 时：
1. 确认目标 repository
2. 确认 HACT Method fixed SHA
3. 读取 `status.yml`
4. 确认当前 Task / version / state
5. 加载对应 `tasks/{task}.md`
6. 加载该 Task 引用的 Shared Protocol
7. 读取 Authoritative Inputs
8. 再开始工作

`init-project` 是 bootstrap 例外：它负责创建目标项目的 `status.yml`，因此开始时按 `tasks/init-project.md` 的 bootstrap rule 恢复，不要求目标项目已有 status。

B 类 bug / optimization 不再加载 `dispatch-new` Task；先按 `protocols/b-intake.md` 形成 Development Intake，满足 `tasks/develop.md` 硬前置后再进入 `develop(source=bug|optimization)`。

不要预加载全部 Task Contract。用户已经明确指定 Task 时，不重新根据 Gate 猜测另一个 Task。

## 4. Repository reading

优先通过当前可用 repository connector / versioned source 读取权威 Git 内容。

需要完整 artifact 时读取完整 artifact，不用搜索片段代替 Contract。

优先绑定：
- default branch Accepted Truth
- 明确 candidate SHA
- Gate approved snapshot

## 5. Repository writing / Persistence

Git 写能力是 capability profile，不是方法论假设。

### Native write available

直接按 Git Truth Protocol 形成 candidate。

### Native write unavailable

生成实际 artifact 文件并进行一次 file-based handoff，由接收方在 repository 中落盘、验证和形成 candidate。

Adapter 只负责：
- 把已冻结 artifact 写到指定 path
- 形成 / 追加 candidate commit
- 返回 immutable snapshot

接收方不得重新解释 PRD / TRD、扩大 Scope 或修改语义。Git candidate identity 是最终 persistence truth。

## 6. Stay Local

当前 ChatGPT 已具备完成 Task 所需能力时优先 Stay Local。

只在以下情况切 Runtime：
1. 当前 Runtime 无法消解的 capability gap
2. 当前 Runtime 无法建立可信 Fresh Isolation

单纯需要更强 reasoning 时，先在当前 Runtime 内提高 model/effort；不把 reasoning escalation 本身当作跨窗口理由。

发生实际 handoff 时才加载 `.agents/skills/runtime-orchestration/SKILL.md`。普通 bounded execution、child Task routing 或 independent review 使用既有 Task/evidence/review artifacts，不创建运行记录。external effect 另按 `protocols/external-effect.md`。

ChatGPT 作为 Single Front Door 保持 canonical Task 与用户目标叙事不变。跨 Runtime 只改变 bounded execution location，不自动改变 Task identity、state、ownership、Gate 或 Authority。

普通 bounded dispatch 只固定必要的 Task、artifact/candidate 与验证边界。operation 开始时计算 Effective Permission；输入边界未变化时连续执行，只在 scope/target/snapshot/Authority/environment/tool capability/risk 变化，或进入 commit、push/merge、external/deployment、uncertain retry/recovery 时重算。

当目标、允许/禁止范围、验证和停止条件已知时，ChatGPT 派发 bounded executable operation，不再派发开放式“研究一下”。dispatch 至少明确：

```text
Goal / Allowed / Forbidden / Execute / Validate / Stop / Return
```

修改、确定性验证与同类机械修正可以在一次 bounded operation 内连续完成；这不等于允许改变语义、扩大 scope 或跨越 Authority。

## 7. Reasoning effort

Effort / model tier 属于 Runtime 内部配置，不写入 Task Contract。

简单低风险问题使用足够而非最大强度；复杂语义工作使用更高 effort；Pro / 最高成本模型只用于稀少的高风险 decision escalation、architecture review、premortem 等。

Pro 不作为固定 Task role。

## 8. Independent Review

ChatGPT-owned Task 默认：

`Main Chat Owner → fixed Git candidate → Fresh Chat Review Context`

Fresh reviewer 加载同一 Method SHA、同一 Task Contract 和 `protocols/review.md`，自己读取 candidate 与 authoritative inputs，不读 Owner 生成聊天。

Independent Review 使用 review brief：fixed candidate、allowed scope、权威 artifact、原始 evidence；targeted re-review 再加入 prior report / open finding IDs。Owner full chat/private reasoning 与 mutable worktree narrative 默认排除。

默认不要求换模型品牌。

Fresh Isolation 不要求另开一个用户可见窗口。优先在当前主窗口背后使用 fresh isolated reviewer，并把 report 返回同一 interaction；用户只处理真实 decision/Authority，不承担 reviewer 窗口搬运。

## 9. Human interaction

不使用固定“每一步都等确认”的 choreography。

只有以下情况必须停下：
- 产品/业务范围变化
- 多个合理方案需要用户取舍
- 重要语义歧义
- Gate approval
- 真实用户体验验收
- 授权扩大
- 破坏性或外部副作用

已明确且已授权的读取、整理、写 artifact、修 finding、确定性检查准备和持久化应连续推进。

确定性失败先分类为 `MECHANICAL | SEMANTIC | AUTHORITY | CAPABILITY`。`MECHANICAL` 且语义/范围不变时，直接修正并重跑同一检查直到 PASS 或错误改变类别；不要把已知 heading/link/schema/regex 问题重新委派为开放式分析。

普通用户始终留在主 ChatGPT interaction surface；内部 Task/Runtime routing 统一翻译成面向用户目标的 One User Narrative。除显式 audit mode 外，不要求用户理解 crossing/job/event id。

routine implementation、test/build repair、review、polling、recovery 和已授权 child registration 不打断用户。genuine product/business decision、Human Experience、sensitive risk、Authority expansion、external/production action、Gate/final acceptance 或不可消解歧义才中断。

用户侧只能在实际请求结果的适用 completion conditions 满足时显示“完成”。Runtime completed、review PASS、commit 或 child Task completion 单独都不能建立完成。

ChatGPT 先消费可靠 execution evidence，再决定是否需要 narrative。artifact/candidate identity、changed files、command exit/result 和 validation 已足够建立 PASS 或 blocker，且已确认没有 command running、approval pending、validation in progress 或 unresolved external effect 时，停止 polling；不为等待 reasoning/composing 或漂亮总结继续空转。poll count、job/thread continuity 与 streaming revision 不进入 HACT Truth。

## 10. Recovery

Conversation 丢失后从最近 verified durable conclusion 恢复：确认 Method SHA，按需读取 authoritative status、当前 Task Contract、Accepted Truth、candidate、open review findings 与必要 evidence，做最小 reality probe 后定位下一 bounded authorized action。

聊天摘要只能作为辅助线索，不能覆盖 Git truth。

普通 job/thread/revision/polling history 不恢复，也不创建 Recovery Pointer 或 Resume Capsule。external effect 不确定时按 `protocols/external-effect.md` 读取 intent receipt 与 request key；先 authoritative observation，无法确认时 reconciliation，不 blind retry。Runtime observed state 不覆盖 authoritative HACT status。

## 11. Cross-runtime handoff

正常 ChatGPT → Codex handoff 应发生在稳定边界：

`Accepted Git Truth → next Task`

不是：

`聊天总结 → Codex`

Independent review、specialist check、Decision escalation 可以读取固定 Shared Candidate snapshot。

同一 Task 内的 bounded execution或 Independent Review 传递 exact immutable candidate/brief，不用 prompt 重述 semantic Contract。Bridge/tool 的 `job_id`、thread/session、revision、poll/result 只是 transient telemetry。tool/job terminal state 不等于 HACT completion。

一次 handoff 后由接收 Runtime 执行到 durable conclusion。机械修正、补测试、重跑验证和 finding closure 不构成返回 ChatGPT 的理由；只有新的 semantic/Human Authority decision 或不可消解 gap 才返回。

用户明确要求外部 UX 设计会话时，使用 `runtime/external-ux.md`，最终仍回到 `tasks/draft-ux.md` 的同一 completion chain。

## 12. Deployment note

具体 connector、persistence bridge 和 UI 操作属于部署层，可变化。

HACT 只依赖能力概念：
- repository read
- semantic reasoning
- artifact authoring
- isolated context
- persistence
- optional execution capability
