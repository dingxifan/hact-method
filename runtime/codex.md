# Codex Runtime Adapter

本文只描述 Codex 如何实现 HACT capability。Task 语义属于 `tasks/`，共性纪律属于 `protocols/`；本文不得复制第二套 Task / Gate / Review / Recovery 规则。

## 1. Natural Home

Codex 更适合：

- repository-heavy execution
- 多文件代码修改
- 本地 command / build / lint / type-check / test
- Git branch / worktree / index / snapshot 操作
- deterministic verification
- isolated review context 的技术实现
- Git delivery 与长程 execution / repair

Codex 不因为拥有 shell、Git 或更强执行能力而拥有更高 Authority。

## 2. Capability Profile

执行 Task 前只核当前 Task 真正需要的 capability：

- repository read / write
- code / artifact authoring
- command / test execution
- Git snapshot
- isolated context
- persistence
- code-hosting operation
- external / production action（仅在已授权时）

缺少非必要 capability 不阻断；缺少当前 Task 必需 capability 时形成 capability gap，再决定切 Runtime 或请求处理。

模型名、reasoning tier、agent 数量不属于 Task Contract。

## 3. Bootstrap Adapter

正常启动按 `templates/boot-protocol.md`：

1. 从 adopted Method SHA 确定 canonical Task；
2. 加载一个 `tasks/{task}.md`；
3. 按实际触发条件加载 Shared Protocol；
4. 只有需要 Codex-specific realization 时才加载本文对应小节。

不要在 Runtime Adapter 重新维护 Task routing 表，也不要把旧 `specs-execution/` 恢复成 vNext 正常入口。

进入 repository mutation 前，额外核：

- branch / HEAD / upstream
- worktree / index / stash
- 当前 Task 的实际写集

`init-project` 没有既有 `status.yml` 时按其 Task Contract 的 bootstrap exception 执行。

## 4. Working Tree Discipline

### 4.1 Read before mutation

修改前读取当前权威文件与真实实现位置；发现文件自上次读取后变化时重新读取，不盲写。

### 4.2 Unknown local changes

不明来源的 dirty change：

- 不擅自删除
- 不擅自 restore / checkout --
- 不擅自 stash
- 不用 mtime 猜作者

目标是隔离当前 Task 写集，不是清理别人的 Local Working Truth。

可使用安全 branch / worktree / commit / tree 隔离；无法安全隔离时保留并上报。

### 4.3 Shared mutable assets

共享工作树、index、数据库、端口、生成目录或其他共享资产存在写冲突时，必须串行或隔离。

Task ownership 与 Codex session / subagent / Git author 不等价；Owner 语义以 `protocols/state.md` 与项目 status 为准。

## 5. Command & Verification Adapter

Task Contract 决定“必须证明什么”；Codex 负责调用项目真实入口证明它。

优先使用项目已有：

- unit / integration tests
- build
- type-check
- lint
- static checker
- schema / migration validation
- browser / smoke runner
- project-specific deterministic checks

命令不存在时不得假装运行过；判断 not-applicable、形成 evidence gap，或在授权范围内补必要基建。

相同 snapshot、依赖、配置和环境上仍有效的结果可以复用。Task / Protocol 已经规定的 verification 不在本文重复列一遍。

## 6. Fixed Git Snapshot Adapter

当 Task / Review Protocol 要求 immutable candidate 时，Codex 优先用 Git object 固定：

1. 分离当前 Task 写集与无关改动；
2. 精确 stage 当前 Task 文件；
3. 固定 reviewed base；
4. 从 index / tree 形成 reviewed head；
5. 从固定 base/head 机械得到 changed files；
6. 按项目既有 evidence schema 记录必要 diff identity / digest；
7. 持久化 candidate / evidence pointer。

已有项目如果使用 `git write-tree`、binary diff SHA-256、review anchor builder 或等价机制，继续沿用；vNext 不为了统一表面形式重写 checker。

正式 review 不得以持续变化的裸 working-tree diff 代替 fixed target。

## 7. Independent Review Adapter

Review 语义、projection、finding 与 bounded convergence 由 `protocols/review.md` 和当前 Task Contract 定义；本节只说明 Codex 如何实现隔离。

### 7.1 Fresh isolation

首次 Independent Review 使用不继承实现叙事的 Fresh Isolated Context。

可使用当前 Codex 提供的 fresh session、isolated subagent 或其他等价机制；不要把某个 API 参数、UI 按钮或固定模型名写成方法论前提。

若当前 Codex 无法形成可信隔离，记录 isolation gap，再按 Protocol 决定是否切 Runtime。

### 7.2 Reviewer input

按 `protocols/review.md` 的 same-source reviewer projection 提供：

- Method SHA
- fixed candidate
- Task Contract 的必要 sections
- authoritative inputs
- 当前 finding 真正需要的 Shared Protocol
- 原始 evidence
- targeted re-review 时的 prior report / finding ids

默认不传 Owner 完整聊天、私有推理或辩护性总结。

### 7.3 Review writes

Reviewer 需要探针、临时测试或生成文件时，使用独立 worktree / temp area，不污染待审 snapshot。

## 8. Git Delivery Adapter

Task / Git Truth Protocol 决定何时允许 Candidate → Accepted Truth；Codex 负责实现当前 repository 的 Git policy，例如：

- branch / commit / push
- PR
- merge
- status reconciliation

普通已授权 Git delivery 可连续执行。以下情况暂停对应动作：

- branch protection / permission 不允许
- merge conflict 无法安全解决
- required Human Authority 尚未完成
- production / external side effect 需要额外授权
- 将被接受的 snapshot 与通过 review / verification 的 snapshot 不一致

不得用 force 或历史改写绕过保护，除非用户对该具体高影响操作另有明确授权。

## 9. Discussion Persistence Adapter

Discussion Persistence 是 repo-local workflow skill，只用于把**已经冻结的讨论 / 设计 / 规范 artifact** 通过受控通道持久化；它不替代普通代码实现或 Codex 原生 Git delivery。

当 fixed Method SHA 中存在：

`.agents/skills/discussion-persistence/SKILL.md`

且用户明确要求持久化时，按该 Skill 与其 `references/protocol.md` / `references/recovery.md` 执行。

当前增量 candidate 的关键实现约束：

- `base_branch == target_branch`
- 提交前重新验证 remote candidate HEAD
- `base_sha` 等于该 HEAD
- branch 命中允许的 incremental prefix
- 只提交本轮冻结文件
- ordinary fast-forward append
- 不 force push
- 新 commit direct parent 必须等于 submitted `base_sha`

native write 或 local execution 的不确定结果先以远端 Git truth 核实；不得自动换 transport、重建 artifact 或改变 branch。

## 10. Recovery & Context Compaction Adapter

Recovery 的事实顺序由 `protocols/recovery.md` 定义。Codex context compaction / session interruption 后，不尝试重建完整聊天，而是重新取得最小运行事实：

- Method SHA
- 当前 Task / status
- Accepted Project Truth
- fixed candidate / evidence pointer（若有）
- 实际 branch / HEAD / worktree / PR / merge state

然后从 Task Contract 第一个未满足 completion condition 继续。

Runtime-specific 注意：

- 已通过且 snapshot 未变化的 command/test 不重复；
- 仍在运行的单元先确认真实状态，不盲目重派；
- safe checkout / switch 前保护 Local Working Truth；
- 已 merge 但 status 尚未落定时先核远端事实，再补 state；
- 项目已有 wave / batch recovery schema 时继续用当前 schema，不在 vNext Runtime Adapter 发明第二套。

## 11. External / Production Actions

Task Contract 与 `protocols/authority.md` 决定是否允许外部副作用；Codex 只负责执行已经授权的具体 mechanism 并采集 evidence。

通用边界：

- secrets 不写入 repository / report；
- 远端业务代码通过 Git / artifact / platform release 发布，不在服务器直接 patch；
- artifact / target identity 必须能与被批准 snapshot 对上；
- 失败后先确认实际 serving state，再按 Task / project policy处理 rollback / recovery。

更具体的 deploy / manual-test / wrap-up 语义只读对应 Task Contract，不在 Runtime Adapter 再维护副本。

## 12. Cross-runtime Handoff

正常 handoff 使用 Git truth，而不是聊天摘要：

- Method SHA
- canonical Task
- Accepted Project Truth
- fixed candidate（若有）
- authoritative inputs
- finding / evidence pointers
- recovery pointer（需要时）

下一个 Runtime 自己重新读取这些事实。

外部 UX 设计会话按 `runtime/external-ux.md`，最终仍回 `tasks/draft-ux.md`。

## 13. Legacy Serialization Compatibility

vNext 可以继续消费项目已经部署的：

- `status.yml` schema
- task package schema
- checker / hook
- review evidence schema
- connection / deployment config

除非另有明确迁移 Task，不为 vNext 的组织方式重写这些可执行接口。

旧 `specs-execution/`、`specs-structural/`、review brief 可作为 migration / serialization reference，但 adopted SHA 已提供 vNext Task Contract 时，它们不再是正常 Task 的第二套规范真相。

发生冲突时：

1. Task / Protocol 决定方法论语义；
2. 当前项目 schema / checker 决定既有机器序列化约束；
3. 若两者无法兼容，显式记录 compatibility gap 并创建迁移工作，不由 Runtime 静默猜测。

Runtime Adapter 可以随 Codex capability 演进；Task Contract 与 Shared Protocol 不绑定某个 Codex 版本。
