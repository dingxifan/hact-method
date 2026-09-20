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

使用受控 Persistence Adapter。

Adapter 只负责：
- 把已冻结 artifact 写到指定 path
- 形成 / 追加 candidate commit
- 返回 immutable snapshot

Adapter 不得重新解释 PRD / TRD、扩大 Scope 或修改语义。

### Discussion Persistence V1

当前 ChatGPT 部署的受控写入路径为：

`ChatGPT → Dropbox /HACT/inbox → local Watcher → Git → GitHub verification`

当 fixed Method SHA 中存在 repo-local `Discussion Persistence` Skill 时，显式持久化优先按：

`.agents/skills/discussion-persistence/SKILL.md`

及其 `references/protocol.md` / `references/recovery.md` 执行。

它支持两种模式：

- `NEW_CANDIDATE`
- `INCREMENTAL_CANDIDATE`

继续既有 Shared Candidate 时优先 `INCREMENTAL_CANDIDATE`：

- `base_branch == target_branch`
- `base_sha` 必须等于提交前重新验证的 remote candidate HEAD
- branch 必须命中 Watcher `allowed_incremental_base_prefixes`
- 只提交本轮冻结文件
- 只允许普通 fast-forward append
- 不重放旧 candidate 文件集
- 不 force push

### Transport acknowledgement caveat

当前 ChatGPT Dropbox connector 已实证：publish package 实际已经进入 Dropbox、Watcher 甚至已完成处理时，`check_upload_file_status` 仍可能返回 `FETCH_FAILED`。

因此：

- `FETCH_FAILED` = acknowledgement **indeterminate**，不是 persistence failure；
- 一个 semantic publish 只提交一次；
- indeterminate 时不得换 job id、重传、换 branch、改内容或换 transport；
- 按 recovery rule 检查 `/HACT/results`、`done`、`failed`、必要时 `processing` / `inbox`；
- Watcher `success` 只表示 `EXECUTED`；
- 只有 GitHub 确认 exact `commit_sha`、branch、changed files 后才是 `VERIFIED`；
- incremental mode 还必须验证 `new_commit.parent == submitted base_sha`。

GitHub SHA 是最终 persistence truth。

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

如果中断发生在 persistence 中，优先按 Discussion Persistence recovery 从：

- job id
- Dropbox terminal state
- Watcher result
- GitHub target branch / commit

恢复，不凭记忆重新提交。

## 11. Cross-runtime handoff

正常 ChatGPT → Codex handoff 应发生在稳定边界：

`Accepted Git Truth → next Task`

不是：

`聊天总结 → Codex`

Independent review、specialist check、Decision escalation 可以读取固定 Shared Candidate snapshot。

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
