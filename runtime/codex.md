# Codex Runtime Adapter

本文只描述 Codex 如何实现 HACT capability。Task 语义属于 `tasks/`，共性纪律属于 `protocols/`；本文不得复制第二套 Task / Gate / Review / Recovery 规则。

## 1. Capability profile, not routing

Codex 实现仓库读写、命令/构建/测试、固定 Git snapshot、隔离审查与交付；工具能力和 Git author 不产生额外 Authority。接到明确的 bounded Goal/Packet 后按 §5 持续完成，不因普通困难或复杂度停止，也不得发明无法从 Accepted Truth 与 Contract 推导的产品或核心技术语义。

`source=sprint` 开发必须先有 active execution-window Goal；Packet 的 Goal 字段不能代替激活。输入顺序与格式见 `runtime/chatgpt.md` §3，当前窗口、逐包完成及 Wave 约束见 `tasks/develop.md` §5.9。Codex 只完成窗口内 packages，不因其他 Task eligible 扩大范围；模型与 effort 由 Human 选择。

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

缺少非必要 capability 不阻断；当前 Task 必需 capability 缺失时，先在既有 scope、Authority 与恢复上限内排查并尝试解决，需要明确授权时在当前 interaction 请求。只有合理尝试后仍使 Goal 客观上无法完成，才以 `CAPABILITY` blocker 返回事实与证据。

模型名、reasoning tier、agent 数量不属于 Task Contract。

## 3. Bootstrap Adapter

正常启动按 `templates/boot-protocol.md`：

1. 从 adopted Method SHA 确定 canonical Task；
2. 加载一个 `tasks/{task}.md`；
3. 按实际触发条件加载 Shared Protocol；
4. 只有需要 Codex-specific realization 时才加载本文对应小节。

不要在 Runtime Adapter 重新维护 Task routing 表；canonical Task 只读 `tasks/`。

进入普通 repository execution 前只做 Minimum Execution Preflight：

- `Target`：正确 repository / worktree / baseline；
- `Collision`：未知 local changes 不与本次 write set 冲突；
- `Boundary`：允许/禁止范围与当前 Authority 清楚；
- `Validation`：真实验证入口与停止条件已知。

Packet 携带 `BASE_SHA` 时，`Target` 还必须验证实际 execution base 对应该 SHA。若 Accepted remote 已移动且会改变本次事实世界，停止并返回 `snapshot mismatch`；不得自行将旧 Packet rebase 到新事实。此 stop reason 不改变既有 blocker 分类、Task state 或 Authority。`init-project` 只按 `protocols/git-truth.md` 的 bootstrap exception 执行。

remote/upstream 只在 fetch/pull/push/PR/merge 或用户要求 Git 同步时检查；Git 同步按 `protocols/git-truth.md` §8 枚举并逐个处理全部范围内远端，不以默认 remote / upstream 代替清单；Gate/status/owner/dependencies 只在当前动作会读取或改变它们时检查；stash、其他 worktree、部署能力与 external-effect receipt 只在实际相关时检查。四项输入未变化时复用结论，不在每个文件修改、命令或机械整改前重新盘点。

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

明确执行任务使用 bounded execution contract：

```text
Repository / Base SHA / Goal / Allowed / Forbidden / Execute / Validate / Stop / Return
```

Codex 在已授权范围内持续执行到 Goal 成功完成，不把已知执行问题改写成新的开放式分析。失败尽早分类以决定修复或授权动作，分类本身不是返回 ChatGPT 的触发器：

- `MECHANICAL`：格式、lint、deterministic checker、已知 schema/link/heading 等；
- `SEMANTIC`：需要改变 Product/Technical/Contract/behavior meaning；
- `AUTHORITY`：需要扩大 write set、commit/push/deploy/Gate/external authority；
- `CAPABILITY`：必要工具、环境、权限或 recoverable identity 缺失。

`MECHANICAL` 问题与普通实现、测试或 review 失败，在语义与 scope 不变时直接修正、复验并继续。修改、验证与同类纠正属于一个 bounded operation，不受“One Turn = One State Transition”限制。类别改变或即将越界时停止受影响动作，按 Contract / Authority 处理；明确的授权动作在当前 interaction 请求，不能以分类变化自动要求新 Packet。

成功完成前，只有以下两种情况才返回 originating ChatGPT conversation：无法从 Accepted Project Truth 与适用 Contract 可靠确定完成 Goal 所需的正确产品或核心技术语义；或经合理排查、修复尝试及适用授权请求后，Goal 在当前执行条件下客观上无法完成。明确动作所需的 Human Authority 直接在当前 Codex interaction 请求，授权本身不构成返回 ChatGPT 的理由。

完成或真实 blocker 的消息应清楚说明结果并提供 immutable `RESULT_SHA`，只补充实际有用的简短上下文，例如验证 / review 结论、远端可读性、未完成项及必要决定。不要求固定返回字段或正式结果 schema；Git 与既有 evidence 才是权威事实。收敛前确认没有应完成而仍在运行的命令、待决授权、验证或 unresolved external effect。

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

Review 语义、finding 与 bounded convergence 由 `protocols/review.md` 和当前 Task Contract 定义；本节只说明 Codex 如何实现隔离。

### 7.1 Fresh isolation

每次 Independent Review（包括 targeted re-review）使用不继承实现叙事的 Fresh Isolated Context。

可使用当前 Codex 提供的 fresh session、isolated subagent 或其他等价机制；不要把某个 API 参数、UI 按钮或固定模型名写成方法论前提。

普通 Package Review 优先在同一用户可见 Codex interaction 内启动内部 fresh reviewer，并把 report 返回主执行上下文。Same Runtime 是默认 locality preference，不是独立性条件；System / Holistic Review 按 §7.5 与 `protocols/review.md` 选择 Runtime。

若当前 Codex 无法形成可信隔离，先尝试符合 `protocols/review.md` 的可用隔离机制；合理尝试后仍无法满足必要独审时，按本文件的返回边界报告 `CAPABILITY` blocker，不以 Owner 自审替代。

### 7.2 Reviewer input

Brief 的固定输入与允许范围按同一 Method SHA 的 `protocols/review.md` §3/§14，Task sections 按同源 projection。Codex 将这些来源交给 fresh reviewer，不转交 Owner narrative；targeted review 带必要 prior report/finding IDs。

### 7.3 Review writes

Reviewer 需要探针、临时测试或生成文件时，使用独立 worktree / temp area，不污染待审 snapshot。

### 7.4 Package Review modes

Package classification 与 effective mode 由 `tasks/develop.md` 决定。Codex 只实现已选模式：

- lightweight：Fresh Isolated Context 核 package intent/oracle、scope、受影响兼容性、必要 evidence/tests 与 escalation signals；
- full-local：在同一基础上深入实际触及的 sensitive boundary、局部 shared contract 与完整受影响调用链。

实际 fixed diff 触发升档时，补足 full-local scope；在现有 review evidence 正文写明 effective mode 与依据，不为此扩展 package checker enum。不得因已启动 lightweight reviewer 就忽略升档，也不得把任何 package review 标成 System Full Review。

### 7.5 System Verification realization

`integration-verify` 固定 final system candidate 后，在同一 Core Task 内实现两条 lane：

- Semantic / Holistic Independent Review 在 reasoning 更适合且 immutable sources 完整可读时优先使用 Fresh ChatGPT reviewer context，读取 final Contract、architecture、全部相关 package evidence 与 fixed system candidate；ChatGPT capability 不足时可使用其他满足要求的 Runtime，不能复用 planner context；
- Runtime Integration Verification 必须由 Codex 使用项目真实 command/build/test/browser/service/database/environment 入口产生原始 execution evidence，并负责 deterministic validation、evidence capture 与 Git persistence。

两条 lane 可以交换 evidence，但不能互相替代。每次 System Reviewer invocation 形成新的 immutable report。Codex 经 `develop(source=integration)` 实施修复与 deterministic validation；新 candidate 按 repair impact 重跑受影响 runtime verification，并由 targeted Fresh Review 关闭 stable findings，影响无法限定时做 full review。全部 required assurance conclusions 最终必须对同一个 fixed final candidate 有效，未受影响结论的复用须证明适用性，不能直接沿用旧 SHA 的 PASS。Runtime Adapter 不维护 route、closure event 或平行 finding state。

## 8. Git Delivery Adapter

Task / Git Truth Protocol 决定何时允许 Candidate → Accepted Truth；Codex 负责实现当前 repository 的 Git policy。

对已经建立 remote Accepted branch 的普通项目变更，默认 delivery 顺序固定为：

1. 从已验证的 Accepted baseline 建立 source / task branch；
2. commit 固定 candidate；
3. push source branch，使 candidate 成为远端可引用的 Shared Candidate Truth；
4. 创建 PR，目标为项目已确认的 Accepted branch；
5. 确认 required review、deterministic verification 与必要 Human Authority 对将被合并的 candidate 有效；
6. 按 repository policy merge PR；
7. 重新读取 remote Accepted branch，核验 merge 后 immutable SHA，并以该 SHA 作为 Accepted result / `RESULT_SHA`；
8. reconcile status 与必要 delivery pointer。

direct push 可以发布 source/candidate branch，但普通项目变更不得 direct push 到 Accepted/default branch 来替代 PR merge。若其他 remote 只是同步已经通过 PR merge 的 Accepted 结果，按 `protocols/git-truth.md` §8 复制同一 Accepted SHA；该镜像同步不重新建立 acceptance。`init-project` 首次 bootstrap 尚无 Accepted branch 时使用 Git Truth Protocol 的 bootstrap exception。

普通已授权 Git delivery 可连续执行。以下情况暂停对应动作：

- branch protection / permission 不允许
- PR capability / repository policy 无法完成 required acceptance path
- merge conflict 无法安全解决
- required Human Authority 尚未完成
- production / external side effect 需要额外授权
- 将被接受的 snapshot 与通过 review / verification 的 snapshot 不一致

不得用 force、direct push 到 Accepted/default branch 或历史改写绕过保护；也不得把“快速同步”当作普通 Candidate → Accepted Truth 的替代路径。

## 9. Recovery & Context Compaction Adapter

Recovery 的事实顺序由 `protocols/recovery.md` 定义。Codex context compaction / session interruption 后，从最近 verified durable conclusion 取得下一动作需要的最小运行事实：

- Method SHA
- 当前 Task / status
- Accepted Project Truth
- fixed candidate / durable evidence pointer（若有）
- 实际 branch / HEAD / worktree / PR / merge state

做最小 reality probe 后，从下一 bounded authorized action 继续。不要创建 Recovery Pointer、Runtime Resume Capsule 或为了表示进度写 heartbeat event。

Runtime-specific 注意：

- 已通过且 snapshot 未变化的 command/test 不重复；
- 仍在运行的单元先确认真实状态，不盲目重派；
- safe checkout / switch 前保护 Local Working Truth；
- 已 merge 但 status 尚未落定时先核远端事实，再补 state；
- 项目已有 wave / batch recovery schema 时继续用当前 schema，不在 vNext Runtime Adapter 发明第二套。

## 10. External / Production Actions

Task Contract 与 `protocols/authority.md` 决定是否允许外部副作用；Codex 只负责执行已经授权的具体 mechanism 并采集 evidence。

通用边界：

- secrets 不写入 repository / report；
- 远端业务代码通过 Git / artifact / platform release 发布，不在服务器直接 patch；
- artifact / target identity 必须能与被批准 snapshot 对上；
- 失败后先确认实际 serving state，再按 Task / project policy处理 rollback / recovery。

更具体的 deploy / manual-test / wrap-up 语义只读对应 Task Contract，不在 Runtime Adapter 再维护副本。

## 11. Execution Packet and completion return

消费 `runtime/chatgpt.md` §3 的最小控制信息及文件引用，执行前按 Git Truth 核 `BASE_SHA`。Sprint Packet 须先有 active Goal，Wave 由 Codex 在窗口内组织，不要求用户维护过程。执行、提前返回与结果说明按 §5；局部 blocker 只暂停受影响 Task 及窗口内依赖，其他安全的 in-scope Task 继续。窗口完成后返回，不自动进入窗口外 Task。

返回最近稳定的 immutable `RESULT_SHA`；仅在已有 Git policy/Authority 允许时发布为远端可读事实。缺 shared-write Authority 时在当前 interaction 请求，明确说明仅本地可读的限制，不伪装 handoff 闭合。Owner 回读 Git truth 后判断下一窗口，不要求正式 Result Packet 或固定返回 schema。

## 12. External Effect Adapter

普通 dispatch 只消费完成 bounded operation 所需的 Task、artifact/candidate、allowed/forbidden scope 与 validation。External Effect 另外消费：

- canonical Task / Method SHA；
- exact operation action / target / snapshot；
- current Authority references；
- durable `operation_id` / `request_key`；
- `external-effect.md` 要求的 versioned intent receipt。

Codex 在 operation 开始时计算 Effective Permission；边界未变化时连续修改、测试和机械整改。仅在 scope/target/snapshot/Authority/environment/tool capability/risk 变化，或进入 commit、push/merge、external/deployment、uncertain retry/recovery 时重算；它不能因 tool capability 自行扩大 scope 或 Authority。

artifact/candidate、validation、review 和 external-effect evidence 进入各自权威对象。Codex 不直接把 execution result 写成 HACT state；只有既有 status contract 明确授权的 state mutation 才可执行。

start 结果不确定时先按 durable request key lookup；backend 无 recoverable identity 时进入 `CAPABILITY_GAP` / reconciliation，禁止 blind retry。external effect 只有在 authoritative observation 证明未发生时才可 retry，否则按 operation-specific idempotency/compensation contract 或 escalation 处理。

Codex 作为 reviewer 时只读取 fixed candidate、review brief 与 brief 允许的 immutable paths；实现叙事、Owner private reasoning 和 mutable-worktree narrative 不进入 reviewer input。checker PASS、job completion、review PASS 或 commit 都不能由 Codex 单独投射为 Gate、Human Authority 或 Task completion。
