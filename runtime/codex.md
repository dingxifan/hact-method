# Codex Runtime Adapter

本文只描述 Codex Runtime 如何实现 HACT capability。它不是 Task Contract，也不是项目事实来源。

## 1. Natural Home

Codex 更适合：

- repository-heavy execution
- 多文件代码修改
- 本地命令、build、lint、type-check、test
- Git branch / worktree / snapshot 操作
- 实现后的 deterministic verification
- 在可隔离上下文中执行 independent code review
- 长程 develop / integration / repair 工作

Codex 不因为拥有 shell、Git 或更强执行能力而拥有更高 Authority。

## 2. Capability Profile

使用 Codex 执行 HACT Task 前，按实际环境确认需要的能力：

- repository read
- repository write
- code editing
- command execution
- test execution
- Git snapshot
- isolated context
- persistence
- code-hosting operation（若 Task completion 需要）
- external / production action（只有获得对应授权时）

缺少非必要 capability 不阻断；缺少当前 Task 必需 capability 时才 escalation 或切 Runtime。

模型名、reasoning tier、agent 数量不属于 Task Contract。

## 3. Bootstrap

开始正式 HACT Task 时：

1. 确认项目 repository。
2. 确认当前 HACT Method fixed SHA。
3. 读取 `status.yml`。
4. 确认当前 Task、version/source、state、Owner 与 dependencies。
5. 加载 `tasks/{task}.md`。
6. 加载该 Task 引用的 Shared Protocol。
7. 读取 Authoritative Inputs。
8. 核实际 Git branch、HEAD、worktree、index、stash 与远端状态。
9. 再开始修改。

用户已经明确指定 Task 时，不重新根据 Gate 猜另一个 Task。

不要用先前 Codex summary、聊天压缩摘要或 agent 回报替代上述 bootstrap。

## 4. Stay Local

当前 Codex 已具备完成 Task 所需能力时优先 Stay Local。

只有以下情况切 Runtime：

1. Capability gap
2. Reasoning escalation
3. Isolation gap

不要因为“另一个模型更强”自动转移 Task，也不要因为 context compaction 自动重开 Task。

## 5. Working Tree Discipline

### 5.1 Read before mutation

修改前先读当前权威文件与真实实现位置。发现文件自上次读取后已经变化时重新读取，不盲写。

### 5.2 Unknown local changes

不明来源的 dirty change：

- 不擅自删除
- 不擅自 `checkout --` / restore
- 不擅自 stash
- 不用 mtime 猜作者

目标是把当前 Task 的写集与 review diff 分离，不是清理别人的 Local Working Truth。

可以使用安全 branch / worktree / commit / tree 隔离；若无法安全隔离，保留并上报。

### 5.3 One Task, one Owner

`assigned_to` 是责任归属；Codex session / subagent / Git author 只是执行信息。

一个 Task 默认只有一个 Owner。Codex 内部可委派独立调查、实现子单元或 review，但不自动转移 Task ownership。

共享工作树、共享索引、数据库、端口或其他共享资产存在写冲突时必须串行或隔离。

## 6. develop Implementation Adapter

执行 `tasks/develop.md` 时：

### 6.1 Freshness

在第一处新的代码改动前执行 develop freshness。

优先使用项目已经存在的 checker / hook / preflight schema。旧项目若仍使用：

- `check-sprint.js`
- `develop-preflight-record.md`
- 既有 code-review 目录
- 既有 status / review audit 字段

继续按当前项目版本消费；P2 不要求修改这些可执行接口。

正常结果保持紧凑。发现 drift 时先路由并关闭，再写代码。

接管已有 diff 却缺 before-code record 时，只能记录真实 retroactive 状态，不能伪造时间顺序。

### 6.2 Implement

Codex 主线可以在已授权 scope 内直接：

- 读取代码
- 计划实现
- 编辑文件
- 增补测试
- 运行命令
- 修复 deterministic failure
- 处理 review finding
- 完成必要收尾

不为每个机械步骤重新请求用户确认。

只有独立且有收益的工作才委派；不要为了 agent 数量而拆分。

实现结果必须服从 Task Contract 的 `intent / oracle`、scope、dependency、risk 与 authority 边界。

### 6.3 Self-verification

先运行当前 Task 的 target verification，再进入 independent review。

按项目真实技术栈使用已有：

- unit / integration tests
- build
- type-check
- lint
- static checker
- migration / schema validation
- project-specific deterministic checks

命令不存在时不假装运行过；判断 not-applicable、补基建或形成 evidence gap。

同 snapshot、同依赖/配置、同环境下仍然有效的结果可以复用。

## 7. Fixed Git Snapshot Adapter

代码审查必须从 mutable worktree 转成 immutable review target。

Codex 默认用 Git object 固定候选：

1. 确认当前 Task 写集与无关改动已安全分离。
2. 精确 stage 当前 Task 的 changed files。
3. 固定 `reviewed_base`。
4. 从 index / tree 形成 `reviewed_head`。
5. 从固定 base/head 机械得到 changed files。
6. 按项目当前 evidence schema 计算 deterministic diff identity / digest。
7. 把 candidate pointer 与 evidence pointer 持久化。

旧项目若已用 `git write-tree`、binary diff SHA-256、review anchor builder 或等价 checker，继续使用，不改 checker。

Review 只能读取 fixed base/head 或等价 immutable snapshot。不得用会继续变化的裸 `git diff` 作为正式审查对象。

整改产生代码或测试变化后形成新的 reviewed head，并保留上一轮 chain。

## 8. Independent Review in Codex

### 8.1 Isolation

Codex-owned develop 默认使用：

`Owner Context → fixed Git candidate → Fresh Isolated Review Context`

隔离要求来自 `protocols/review.md`，不是来自某个固定 API 参数。

可使用当前 Codex 提供的 fresh session、isolated subagent 或其他真正不继承实现叙事的机制。具体实现可以变化。

不要把 `fork_turns`、某个 UI 操作、某个模型名写成方法论前提。

如果当前 Codex 无法提供可信隔离，形成 isolation gap，再切 Runtime。

### 8.2 Reviewer inputs

Reviewer 默认只拿：

- Method SHA
- `tasks/develop.md`
- `protocols/review.md`
- 当前 Development Intake / Task Package
- authoritative upstream artifacts
- fixed base/head
- changed files
- 必要 code / dependency / config
- 原始 test / run evidence
- prior report + target finding ids（targeted re-review 时）

默认不拿：

- Owner 完整聊天
- Owner 私有推理
- Owner 辩护性总结
- 与当前 review 无关的历史上下文

### 8.3 First review

首次对 candidate 做 full review，至少覆盖 develop Task 定义的：

- contract / scope
- compatibility
- test-evidence

专项按实际 diff 独立触发。

### 8.4 Targeted re-review

blocking finding 修复后，优先由**未参与实现的原独立 reviewer**继续 targeted review。

原 reviewer 不可用时，创建新的 Fresh Isolated Review Context，读取 prior report、固定 snapshots 与未关闭 finding ids 后接续。

targeted review 不因为换 context、换 agent 或 context compaction 从 round 1 重开。

只有出现具体变化使先前更大范围结论失效时才升级 full。

### 8.5 Evidence-only

代码、测试、依赖和版本化配置都没有变化，只补真实运行 evidence 时，可使用同 snapshot 的 evidence-only targeted review。

同一 snapshot、同一问题集中补证一次。仍不足以判断时形成明确 evidence gap 并暂停 / escalation，不反复派 reviewer。

## 9. Bounded Convergence

Codex 必须保存并继承当前 Task 的：

- prior reports
- finding ids
- reviewed snapshots
- implementation/test-changing review snapshot count
- evidence-only rounds
- attempts

恢复、rebase、切 Runtime、换 agent 都不能清零。

达到 `tasks/develop.md` 的有界复审上限后仍需代码整改时，不用新 agent 无限重试；按根因进入 contract clarification、reasoning escalation、human authority 或 recovery / re-plan。

## 10. Human Authority in Codex

Codex 可以：

- 识别 risk
- 运行检查
- 形成 evidence
- 做 independent review
- 给出 pass / blocking finding / evidence insufficient

Codex 不能：

- 批准 Gate
- 替用户改变业务 Scope
- 替用户完成真实体验验收
- 用更强模型替代 sensitive risk 裁决
- 擅自扩大生产 / 外部副作用授权

develop fixed diff 命中以下任一边界时，在进入 Accepted Project Truth 前停在 Human Authority：

- 权限 / 认证 / 数据隔离
- 不可逆数据操作
- 金额 / 计费 / 对账
- 对外不可撤销副作用

如果 risk 是在 fixed diff 才发现，先补齐 sensitive review，再请求该具体风险的裁决。

## 11. Git Delivery

Codex 根据项目当前 Git policy 实现 Shared Candidate → Accepted Project Truth。

常见实现可以包括：

- branch
- commit
- push
- PR
- merge
- status reconciliation

这些是 Runtime / repository implementation，不改变 Task state 语义。

在已授权范围内，Codex 可以连续完成普通 Git delivery。遇到以下情况必须暂停对应动作：

- branch protection / permission 不允许
- merge conflict 无法安全解决
- sensitive Human Authority 尚未完成
- 生产/外部副作用需要额外授权
- accepted snapshot 与通过 review/verification 的 snapshot 不一致

不得用 force、历史改写或跳过保护来“完成流程”，除非用户对该具体高影响操作另有明确授权。

## 12. Recovery and Context Compaction

Codex context 可能压缩、session 可能中断。恢复时不尝试重建完整聊天。

重新读取：

1. Method SHA
2. `status.yml`
3. Accepted Project Truth
4. `tasks/{task}.md`
5. Shared Candidate snapshot（若有）
6. freshness / review / verification evidence
7. recovery pointer / progress
8. 实际 Git branch / worktree / PR / merge 状态

然后找到第一个未满足 completion condition 继续。

特别规则：

- 已通过且 snapshot 未变化的检查不重复
- 已用 attempts / review boundary 不重置
- 仍在运行的单元先接收或确认状态，不盲目重派
- safe checkout / switch 前先保护 Local Working Truth
- 已合并但 status 未落定时先核真实远端结果，再补 state
- wave / batch 若项目已有原子 recovery schema，继续用当前 schema；P2 不修改 checker 或恢复脚本

Recovery pointer 只保留当前 phase、next action、stable snapshot、open blocker、evidence pointers 等轻量信息，不保存完整 conversation 或 chain of thought。

## 13. Cross-runtime Handoff

正常 Codex → 其他 Runtime handoff 使用：

- Method SHA
- Task Contract
- `status.yml`
- immutable Git snapshot
- authoritative inputs
- findings / evidence pointers
- recovery pointer（需要时）

不是：

`Codex summary → next Runtime`

下一个 Runtime 必须自己重新读取 Git truth。

## 14. Legacy Compatibility During vNext Migration

P2 只增加 vNext `tasks/develop.md` 与本 Adapter，不删除旧 `skeleton/`、`specs-structural/`、`specs-execution/`、review brief、checker、hook 或 Watcher。

在对应上游 / 下游 Task Contract 迁移完成前：

- 旧 develop structural / execution spec 继续作为迁移参考，不自动成为 vNext 的第二套规范
- 项目已部署 checker / hook / review evidence schema 保持工作
- Codex Adapter 负责把 vNext Task Contract 映射到项目当前可执行接口
- 发生冲突时，以当前固定 Method SHA 下的 vNext Task Contract + Shared Protocol 为方法论真相，并把真实兼容缺口显式记录，不静默猜测

Runtime Adapter 可以演进；Task Contract 与 Shared Protocol 不绑定某个 Codex 版本。
