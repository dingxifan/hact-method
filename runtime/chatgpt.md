# ChatGPT Runtime Adapter

本文只描述当前 ChatGPT Runtime 如何实现 HACT capability。它不是 Task Contract，也不是项目事实来源。

## 1. Natural Home

ChatGPT 更适合：
- reasoning-heavy Task
- 需求澄清
- 产品/架构讨论
- 文档 Contract
- 计划
- 独立语义 review
- 高成本 decision analysis

ChatGPT 不因为“更会推理”而拥有更高 Authority。

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
使用受控 Persistence Adapter。

Adapter 只负责：
- 把已确定 artifact 写到指定 path
- 形成 candidate branch / commit
- 返回 immutable snapshot

Adapter 不得重新解释 PRD/TRD、扩大 Scope 或修改语义。

## 6. Stay Local

当前 ChatGPT 已具备完成 Task 所需能力时优先 Stay Local。

只在以下情况切 Runtime：
1. Capability gap
2. Reasoning escalation
3. Isolation gap

## 7. Reasoning effort

Effort / model tier 属于 Runtime 内部配置，不写入 Task Contract。

简单低风险问题使用足够而非最大强度；复杂语义工作使用更高 effort；Pro / 最高成本模型只用于稀少的高风险 decision escalation、architecture review、premortem 等。

Pro 不作为固定 Task role。

## 8. Independent Review

ChatGPT-owned Task 默认：

`Main Chat Owner → fixed Git candidate → Fresh Chat Review Context`

Fresh reviewer 加载同一 Method SHA、同一 Task Contract 和 `protocols/review.md`，自己读取 candidate 与 authoritative inputs，不读 Owner 生成聊天。

默认不要求换模型品牌。

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

## 10. Recovery

Conversation 丢失后重新执行 Bootstrap，从 Method SHA、`status.yml`、当前 Task Contract、Accepted Truth、candidate、review findings 和 recovery pointer 恢复。

聊天摘要只能作为辅助线索，不能覆盖 Git truth。

## 11. Cross-runtime handoff

正常 ChatGPT → Codex handoff 应发生在稳定边界：

`Accepted Git Truth → next Task`

不是：

`聊天总结 → Codex`

Independent review、specialist check、Decision escalation 可以读取固定 Shared Candidate snapshot。

## 12. Deployment note

具体 connector、persistence bridge 和 UI 操作属于部署层，可变化。

HACT 只依赖能力概念：
- repository read
- semantic reasoning
- artifact authoring
- isolated context
- persistence
- optional execution capability
