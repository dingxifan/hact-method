# Codex Runtime Adapter

本文只描述 Codex 如何实现 HACT capability。Task 语义属于 `tasks/`，共性纪律属于 `protocols/`；本文不得复制第二套 Task / Gate / Review / Recovery 规则。

## 1. Capability profile, not routing

Codex 更适合：

- repository-heavy execution
- 多文件代码修改
- 本地 command / build / lint / type-check / test
- Git branch / worktree / index / snapshot 操作
- deterministic verification
- isolated review context 的技术实现
- Git delivery 与长程 execution / repair

Codex 不因为拥有 shell、Git 或更强执行能力而拥有更高 Authority。

Codex 是 repository execution environment。接收到一个 bounded Execution Packet 后，应在已授权范围内连续执行必要 reasoning、修改、验证、机械整改和 review closure，直至 validation PASS 或明确 BLOCKED。

对已 Accepted Sprint 的 `source=sprint` Develop，开始前当前 Codex interaction 必须已有 active Goal。当前 Codex 支持 `/goal` 时，用户先以 `/goal ...` 建立 Sprint-level Develop Goal，再提交 Develop Execution Packet；Packet 内的 `Goal:` 字段不能代替 activation。该 Goal 是当前 interaction 持续自主推进整个 Sprint 的执行目标，不是 HACT 的新 Task、state、lifecycle、ledger 或 Bridge；Codex 产品本身的 Goal controls / budget 仍由 Codex 管理。

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

缺少非必要 capability 不阻断；缺少当前 Task 必需 capability 时形成 `CAPABILITY` blocker 并返回证据。

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

remote/upstream 只在 push/PR/merge 时检查；Gate/status/owner/dependencies 只在当前动作会读取或改变它们时检查；stash、其他 worktree、部署能力与 external-effect receipt 只在实际相关时检查。四项输入未变化时复用结论，不在每个文件修改、命令或机械整改前重新盘点。

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

Codex 在已授权范围内执行到 validation PASS 或明确 blocker，不把已知执行问题改写成新的开放式分析。失败尽早分类为：

- `MECHANICAL`：格式、lint、deterministic checker、已知 schema/link/heading 等；
- `SEMANTIC`：需要改变 Product/Technical/Contract/behavior meaning；
- `AUTHORITY`：需要扩大 write set、commit/push/deploy/Gate/external authority；
- `CAPABILITY`：必要工具、环境、权限或 recoverable identity 缺失。

`MECHANICAL` 问题不得仅因为需要格式、lint、schema、link、heading、regex 或 deterministic checker 修正而返回 ChatGPT。语义与 scope 不变时，直接修正、重跑同一检查并持续到 PASS 或错误改变类别。修改、验证与同类纠正属于一个 bounded operation，不受“One Turn = One State Transition”限制。类别改变或即将越界时停止并返回 evidence-backed blocker。

返回 evidence-first result：changed files、fixed artifact/candidate identity、实际 command/exit/result、validation evidence、blocker 分类与必要 next action。execution evidence 已完整时不等待 narrative completion；但在收敛前确认没有 command running、approval pending、validation in progress 或 unresolved external effect。

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

首次 Independent Review 使用不继承实现叙事的 Fresh Isolated Context。

可使用当前 Codex 提供的 fresh session、isolated subagent 或其他等价机制；不要把某个 API 参数、UI 按钮或固定模型名写成方法论前提。

优先在同一用户可见 Codex interaction 内启动内部 fresh reviewer，并把 report 返回主执行上下文。Fresh Isolation 要求认知与输入隔离，不要求用户管理第二个窗口。

若当前 Codex 无法形成可信隔离，返回 `CAPABILITY` blocker 与已核事实。

### 7.2 Reviewer input

Review brief 提供：

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

### 7.4 Package Review modes

Package classification 与 effective mode 由 `tasks/develop.md` 决定。Codex 只实现已选模式：

- lightweight：Fresh Isolated Context 核 package intent/oracle、scope、受影响兼容性、必要 evidence/tests 与 escalation signals；
- full-local：在同一基础上深入实际触及的 sensitive boundary、局部 shared contract 与完整受影响调用链。

实际 fixed diff 触发升档时，补足 full-local scope；在现有 review evidence 正文写明 effective mode 与依据，不为此扩展 package checker enum。不得因已启动 lightweight reviewer 就忽略升档，也不得把任何 package review 标成 System Full Review。

### 7.5 System Verification realization

`integration-verify` 固定 final system candidate 后，在同一 Core Task 内实现两条 lane：

- Semantic / Holistic Independent Review 使用 Fresh Isolated Context，读取 final Contract、architecture、全部相关 package evidence 与 fixed system candidate；
- Runtime Integration Verification 使用项目真实 command/browser/service/environment 入口产生原始 execution evidence。

两条 lane 可以交换 evidence，但不能互相替代。每次 System Reviewer invocation 形成新的 immutable report。修复产生新 candidate 后，targeted Fresh Review 关闭 stable findings；影响无法限定时做 full review。Runtime Adapter 不维护 route、closure event 或平行 finding state。

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

## 11. Execution Packet and Result Packet

Codex 只消费用户人工复制的 bounded Execution Packet 中完成本次 operation 所需的 repository、`BASE_SHA`、Task、artifact/candidate、allowed/forbidden scope、execute、validation、stop 与 return。Sprint-level Develop Packet 还应包含 `Accepted Sprint`、`Scope`、`Autonomy`、`Human Boundary`、`Success` 与 `Final Return`，且只在 active Goal 已建立后执行。它先按 `protocols/git-truth.md` 验证 snapshot handshake；Packet 不是新的 Task 或 state，也不改变 ownership、Gate 或 Authority。

active Sprint-level Develop Goal 下，普通实现选择、mechanical / test / checker failure、review finding、repair 与 targeted re-review 不终止 Goal。需要 Human Authority 的 `SEMANTIC` 或 `AUTHORITY` 问题在当前 Codex interaction 直接询问用户；决定后继续同一 Goal。局部 blocker 只暂停受影响 Task 及其依赖，其他独立且 eligible 的 Task 继续。除用户明确终止、所有可合法执行 Task 完成，或 unresolved capability / authority / contract blocker 使继续不安全或不可能外，不把 Goal 作为完成的理由；最终返回 immutable Sprint Result Packet 和 `RESULT_SHA`。此规则不覆盖 Codex 自身的系统安全或预算控制。

需要返回 ChatGPT 验收时，完成后形成 immutable `RESULT_SHA`，并只在现有 Authority / Git policy 允许时使其成为远端可读取事实；Result Packet 返回 `BASE_SHA`、`RESULT_SHA`、remote ref/state、changed files、validation evidence、Git Truth、blocker 与必要 decision。若尚无 shared-write Authority，不伪装跨环境 handoff 已闭合。只在 `SEMANTIC`、`AUTHORITY` 或 `CAPABILITY` blocker 时停止请求新的 Packet；不得因机械修正、测试补齐、验证重跑或 finding closure 往返。

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
