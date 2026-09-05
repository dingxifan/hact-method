# `fe-b-010` 长任务案例复盘

> 文档性质：方法论自然实验案例记录。用于积累多个长任务样本后统一修订方法论；不是当前执行规范，也不授权直接修改正式规则。

## 1. 案例元数据

| 字段 | 值 |
|---|---|
| 记录日期 | 2026-08-09 |
| Codex task | `codex://threads/019fe4e0-c674-7451-96bd-18e40a868b6a` |
| 任务 | `fe-b-010`：发现快照与归并重试 |
| 项目 | `file-extract` |
| 执行树 | WSL `/sandbox/projects/file-extract` |
| 终态业务提交 | `45759bd` |
| PR | Gitee PR #55 |
| 类型 | B 类 develop，backend，source=`optimization` |
| 风险 | `sensitive` |
| 复杂度判断 | 高；跨 contracts、template-engine、document-engine、API、数据库迁移、并发事务和付费调用 |
| 结果 | 已合并；最终 build/type-check/lint 与全量测试通过 |
| 本复盘范围 | 只读审阅对话、逐轮审查报告、profile、preflight、任务包、TRD 差异与 status 时间账 |

## 2. 结论摘要

该任务的**交付质量高，执行效率偏低**。

四小时不能简单归因于“独审太严格”。F001、F002 都是可达的并发行为缺陷，最终形成的共享原子 successor 事务、迁移测试隔离和全量验证具有真实价值。但大部分额外墙钟并非审查员阅读代码本身，而是以下因素共同造成：

1. 关键事务不变量在编码后才逐轮形成；
2. 纯文件数量的 scope 闸反向影响设计；
3. 便宜的跨工作区/跨 migration 验证后置；
4. changed surface 一扩大就 full 的升档规则过粗；
5. 最新执行规范与项目旧运行件混用；
6. 历史 review profile 的输入指纹在终态被事后校正；
7. Windows/WSL 执行面没有在工具层真正统一；
8. 进度播报和规划文件维护过密。

新方法已经显示出正向收益：freshness preflight、稳定 finding ID、full/targeted 路由、finding 分类、三轮 escape-hatch 和墙钟留痕都确实工作。因此下一步不应撤销独立审查，而应继续前移设计真值、细化复审路由并修复运行件/version 的可复现性。

## 3. 证据边界与版本说明

### 3.1 不是纯旧方法对照

方法论 P0/P1 在任务开始前已经提交：

- `17bbfe2`，2026-08-09 10:46 +08:00：develop review workflow 瘦身；
- `fcb3558`，2026-08-09 11:40 +08:00：review dimensions 自动选择；
- 目标 task 于 2026-08-09 12:56 +08:00 开始。

对话实际执行了新版能力：

- before-code freshness preflight；
- 首轮 full、整改 targeted；
- fixed tree 与 diff SHA-256；
- 稳定 finding ID；
- review profile；
- implementation/review/spec 三段墙钟；
- 同根三轮后 escape-hatch。

因此本案例应定义为：**新版执行规范与旧项目运行件混用的过渡态自然实验**。

### 3.2 项目运行件当时确实未完全同步

以 `fe-b-010` 终态提交 `45759bd` 为准：

- 项目中不存在 `scripts/review-profile.js`；
- 项目的 `scripts/check-sprint.js` 不支持 `--review`；
- profile 生成和最终 review audit 借用了外部 `hact-method-lab` 的最新版工具；
- 当前 WSL 工作树后来出现的新版脚本来自另一个未完成的 `codex/method-workflow-sync` 工作，不属于本案例当时状态。

这解释了 profile 工具临时定位、终态 checker 漂移和一部分收尾成本，但不能解释 F001/F002、scope 文件计数和验证顺序问题。

## 4. 定量结果

### 4.1 总墙钟

| 口径 | 时间 |
|---|---:|
| Codex 四个用户轮次合计 | 约 266.7 分钟 |
| 规格预检 `spec_minutes` | 3 分钟 |
| 首次实现 `implementation_minutes` | 58 分钟 |
| 审查阶段 `review_minutes` | 180 分钟 |
| 三段权威时间账合计 | 241 分钟 |
| 启动、执行面处理、规划文件、发布落账等差额 | 约 26 分钟 |

`review_minutes` 有意包含独审等待和审查期间整改。8 份 round report 的审查员 elapsed 合计只有 68 分钟，因此 review 阶段约 112 分钟消耗在修复、重测、轮间固定输入和等待，而不是审查员阅读本身。

### 4.2 对话与 agent 密度

| 指标 | 数值 |
|---|---:|
| 用户轮次 | 4 |
| commentary | 196 条 |
| 启发式命中“仍在/尚未/暂无/继续等待”等状态 | 54 条，约 27.6% |
| 唯一 subagent | 10 个 |
| 实现 subagent | 1 个，跨整改轮复用 |
| 正式 round reviewer | 8 个 |
| Round 01 替补 reviewer | 1 个 |
| code review rounds | 8 |
| full | 5 |
| targeted | 3 |

### 4.3 Review profile 实际裁剪

Round 01、03、06、07、08 的 full profile 均为：

- selected：12/13；
- omitted：仅 `design-fidelity`，理由为 backend task；
- effective risk：`sensitive`。

P1 自动裁剪在这个案例上几乎没有节省审查面。这是 sensitive backend + contracts + DB + concurrency 的输入信号决定的预期结果，不能据此判定裁剪器失效。

## 5. 执行时间线

### 5.1 启动与首次实现

1. 对话先核 Windows/WSL、进程 cwd、浏览器 URL 和 Node/pnpm 工具链。
2. 因任务已存在却被初步误判为 `dispatch-new`，加载错误规范后再修正为 `develop`。
3. freshness preflight 在 3 分钟内发现任务包把不存在的 repository `recordProgress` 当成锚点，修订后 result=`revised`。
4. 判断任务为高复杂度 sensitive B，决定补 TRD。
5. 执行 subagent 用 58 分钟完成首版 24 文件实现与目标自绿。
6. 实现已覆盖快照、merge-only retry、安全失败分类、迁移、API 与目标测试，但最初没有把所有 successor 入口统一成数据库原子机制。

### 5.2 Round 01–03：F001

| Round | Mode | 分钟 | 结论 | 主要结果 |
|---|---|---:|---|---|
| 01 | full | 15 | revise | 发现同键请求可看到 running 已提交但 `retryOf` 未冻结的窗口，误报冲突而非 replay |
| 02 | targeted | 7 | revise，升 full | 否决 200×5ms 轮询；存在隐含 1 秒契约和最多 200 次 DB 读取放大 |
| 03 | full | 10 | revise | F001 closed；发现新的 F002：mark-seen 推进 revision 后 superseded CAS 可留下 orphan running |

Round 02 正确证明“短窗口测试变绿”不等于机制成立。将 `retryOf` 与快照移入 running 原子创建，是必要改进。

### 5.3 Round 04–05：F002 局部修复失效

| Round | Mode | 分钟 | 结论 | 主要结果 |
|---|---|---:|---|---|
| 04 | targeted | 7 | revise | service CAS helper 关闭 mark-seen 变体，但两个不同键请求可错位通过 eligibility，后到 gate 的请求仍可能留下 orphan |
| 05 | targeted | 5 | revise | `UNIQUE(retry_of)` 只挡两个 merge retry；普通重新识别 `retry_of=NULL` 仍能先取代来源 |

Round 05 后 F002 达到同根三轮上限，流程进入 escape-hatch。用户授权将范围扩大为“普通重新识别与 merge-only retry 共用原子 successor 机制”。这次用户中断是合理的，因为它改变了跨入口基础事务边界。

### 5.4 Round 06：正确机制闭合

| Round | Mode | 分钟 | 结论 | 主要结果 |
|---|---|---:|---|---|
| 06 | full | 10 | pass | predecessor 行锁、successor insert、关系回填、ledger 写入进入同一事务；F001/F002 verified-closed |

最终机制的核心不变量：

- 普通重新识别与 merge-only retry 共用入口；
- 事务内锁定 predecessor；
- 锁后重查 replay；
- 创建 successor、写 `superseded_by`、写 ledger 一次提交；
- 冲突方整体回滚，零 run、零 ledger、零 executor/模型调用；
- mark-seen 与 successor 关系写通过来源行锁串行化。

### 5.5 Round 07–08：末端验证后置

Round 06 pass 后才开始完整末端验证，继续发现：

1. 根级 type-check：web 测试夹具未构造新增 `DiscoveryRunView` 字段；修复后触发 Round 07 full。
2. 全量 test：两道源码唯一性 scanner 红。
3. 全量 test：旧 migration spec 假设自己是最新迁移，新 migration 注册后列数与 fingerprint 失败。
4. 旧 migration spec 首个修法在共享数据库上临时 `1770.down()`，主线复核发现潜在并行污染；改为 suite-lifetime 外层事务、同一 QueryRunner 与 savepoint 隔离。

| Round | Mode | 分钟 | 结论 | 主要结果 |
|---|---|---:|---|---|
| 07 | full | 5 | pass | 复核单个 web 测试夹具和此前实现 |
| 08 | full | 9 | pass | 复核 scanner 命名收敛、hash helper、旧 migration 事务隔离和完整 29 文件面 |

最终全量：contracts 64、template-engine 314、document-engine 556、web 322、API 1314，全部通过。

## 6. 哪些做法应保留

### 6.1 Freshness preflight

3 分钟修正失效 reference，避免把错误符号交给执行者。成本低、收益明确。

### 6.2 固定 Git tree 与 diff hash

独审没有读取漂移中的裸工作区，F001/F002 的结论均能回到具体 tree 和反例。

### 6.3 稳定 finding 与 action 分类

- F001/F002 保持稳定 ID；
- F003 的 UUID 契约偏差和 F004 的旧注释被保留为 advisory；
- 非阻断项没有混入代码修复循环。

### 6.4 Targeted review

Round 02、04、05 没有默认重审全部维度。虽然总体仍长，但比八轮全部 full 更好。

### 6.5 三轮 escape-hatch

它成功阻止继续堆局部 CAS/唯一约束，迫使流程回到跨入口原子不变量。应保留。

### 6.6 最终全量与迁移隔离复核

旧 migration spec 的共享库降级方案确有污染风险。最终事务隔离和 backlog 记录是有效工程结果，不是形式成本。

## 7. 不合理点与归因

### CASE-B010-01：用文件数代替语义范围

**现象**：当前 develop 以“实际改动文件超出任务包 files 3 个以上”作为上下文重置条件。

**本例后果**：

- 实际第 4 个 deviation 是 `packages/document-engine/src/index.ts`，执行者被要求撤销；
- `list-read-sites.spec.ts` 成为另一个第 4 文件时，流程请求用户授权；
- 为控制文件数，仓储公开语义被收回 service 私有 helper；
- 后续正确机制仍不得不加入 `base.repository.ts` 等文件，证明早期计数没有真实控制住语义 blast radius。

**判定**：当前方法仍存在；高优先级调整候选。

**建议**：允许自动补入同一模块内必要的 wiring、barrel、registry、测试夹具和 migration 注册；只在新增模块、公共 API、运行时依赖、安全边界、数据所有权或事务机制时 escape-hatch。

### CASE-B010-02：TRD 与实现一起写，缺少写代码前的不变量复核

**现象**：用户明确要求判断是否需要 TRD；主线正确判断“需要”，但 TRD 由实现者先写后立即实现，没有独立设计停点。

**证据**：初始 TRD 只写“不同键并发由 batch running 单飞约束最多一个受理”；最终 TRD 才加入“普通重新识别与 merge retry 共用原子 successor 入口”。

**判定**：不是旧工具版本导致；属于当前 develop 对高风险 B 类技术设计缺少前置审查。

**建议**：命中 `sensitive + DB state machine/concurrency + 多入口写同一实体` 时，先产一页 invariant table，由独立 reviewer 只审事务边界后再编码。无需执行完整 `draft-tech-design` 流程。

### CASE-B010-03：影响验证后置

**现象**：Stage A 只跑 API type-check 与目标 tests；完整 workspace type-check、scanner、历史 migration suites 到 Round 06 后才运行。

**后果**：产生 Round 07、Round 08 和多次末端重跑。

**判定**：当前规范只写“必要的 build/type-check/lint”，缺少 changed-surface 到验证集合的确定性映射。

**建议**：首次独审前自动补：

- shared contracts 变化 → 所有消费者 workspace type-check；
- migration 注册变化 → 全部 migration specs；
- 受源码唯一性/架构 scanner 管辖的文件变化 → 对应 scanner；
- public DTO/view 变化 → 前后端契约夹具；
- 全仓 test 仍只在末端跑。

### CASE-B010-04：复审只有 targeted/full 两档

**现象**：新增一个测试夹具也会因 changed surface 扩大而要求下一轮 full。

**后果**：Round 07 对完整 26 文件面重新 full；Round 08 对 29 文件再次 full。

**判定**：当前方法仍存在。

**建议**：增加 `supplemental` / `targeted-plus`：继承最近 full profile，只追加新文件对应维度和受影响回归。只有新生产机制、模块、依赖、安全边界、数据所有权或事务边界才 full。

### CASE-B010-05：历史 profile 可被终态任务包改写

**现象**：终态 checker 用当前任务包重算每次历史 full profile；任务包 files 在执行过程中持续扩张。对话最终“校正四份历史 full-profile 的权威输入指纹”。

**风险**：历史 review 输入被事后改成最终输入，看起来像当轮 reviewer 审过后来才加入的 scope；逐轮证据失去不可变性。

**判定**：当前 P1 checker/profile 设计缺陷；高优先级。

**建议**：每轮记录并锁定：

- `task_package_blob_sha256` 或 Git blob ID；
- `method_commit`；
- `profile_generator_sha256`；
- normalized normative inputs；
- 当前 round profile 自身 hash。

终态 checker 应按历史 task-package snapshot 验证旧轮，只要求最后一个通过轮与最终任务包一致；禁止修改已经完成轮次的输入指纹。

### CASE-B010-06：方法规范与项目运行件没有版本握手

**现象**：Step 0 只同步两个仓的 Git HEAD，不验证项目内复制脚本是否兼容当前 develop 规范。

**后果**：外部规范要求 `review-profile.js` 和 `check-sprint --review`，项目仓却没有；流程临时从方法仓借工具完成审计。

**判定**：用户已提示这是过渡期部分文件未更新；应单列为部署问题，不把全部成本归咎于执行者。

**建议**：项目根增加方法运行件 manifest/lock：

- `method_schema`；
- `method_commit`；
- 每个复制脚本的 hash；
- 所需 capability 列表。

任务启动时先握手。缺 capability 时先执行独立 `sync-method-runtime`，或把整次任务 pin 到项目当前兼容版本；禁止混用最新版散文与旧判官。

### CASE-B010-07：执行面声明与实际写入工具不一致

**现象**：口头锁定 WSL `claude`，主编排仍在 Windows PowerShell，通过 UNC、临时 patch 与 `wsl` 写入。

**后果**：多次 corrupt hunk、patch does not apply、权限临时调整、变量展开干扰和 `.orig` 辅助文件。

**判定**：执行纪律落实不足，不由方法文件版本解释。

**建议**：如果 `apply_patch` 不能以目标 owner 直接写入，认领前停止并重开 WSL-native Codex workspace；执行面判定要包含“编辑工具实际身份”，不能只列目录和 runtime。

### CASE-B010-08：reviewer 轮换与播报过密

**现象**：同一 finding 的 targeted 复审也派全新 reviewer；对话约每 1.4 分钟一条 commentary，至少 54 条属于无变化状态启发式。

**后果**：审查员反复重建同一并发模型，用户界面被大量等待状态淹没。

**建议**：

- 同一 finding 的 targeted 轮复用原独立 reviewer；full/escalation 或 reviewer 停滞时才换；
- commentary 只在开始、发现、失败、实质里程碑、需决策、完成时发送；
- 长命令使用较长间隔的聚合更新，不逐测试窗口播报。

### CASE-B010-09：规划文件放在产品工作树

**现象**：`task_plan.md/findings.md/progress.md` 长期作为未跟踪文件留在项目根，并因跨环境补丁留下 `.orig`。

**收益**：四小时任务跨多个用户轮次仍能恢复上下文。

**成本**：污染 `git status`、增加补丁/权限操作、需要反复证明不入 staging。

**建议**：保留持久化工作记忆，但默认放到 task/thread 专属外部目录；若必须在项目内，使用统一 ignored 路径并由工具直接管理。

### CASE-B010-10：任务路由误判

**现象**：用户已说“拾取 B 类开发任务 010”，主线仍先根据“迭代已闭环”推断为 `dispatch-new`，加载后才发现任务已存在并切回 `develop`。

**建议**：显式 task ID 已存在且用户意图为拾取/开发时，直接路由 develop；`dispatch-new` 只处理尚不存在的新任务创建。

## 8. 用户中断是否合理

### 第一次：授权第 4 个任务 files 外文件

**判定：不合理的流程中断。**

`list-read-sites.spec.ts` 是新增调用的机械登记，是实现现有 enforcement 的必要连带测试，不改变产品语义、公共 API、依赖或安全边界，应由语义 scope 规则自动纳入。

### 第二次：F002 三轮后扩大为共享原子 successor 机制

**判定：合理。**

它把局部 merge-retry 修复扩大为 ordinary create/retry 共用的基础事务原语，涉及 TRD 与 `BaseRepository` 边界；这已经是实质架构决策，应该由用户确认。

## 9. 候选改进优先级

### P0：积累更多案例前也应重点观察

1. **逐轮历史输入不可变**：task package blob、method commit、generator hash。
2. **方法运行件版本握手**：禁止最新版规范 + 旧 checker 混用。
3. **语义 scope**：删除纯“3 个文件”阈值对架构的支配。
4. **敏感状态机 pre-code invariant review**：跨入口 contender/transaction matrix。
5. **changed-surface → pre-review verification plan**：先跑便宜的跨仓静态/目标验证。

### P1：等更多样本校准

1. `supplemental/targeted-plus` 复审档；
2. 同 finding targeted reviewer 复用；
3. commentary 事件驱动与节流；
4. 规划工作记忆外置；
5. existing B task 的确定性路由。

## 10. 反事实估计

若仅应用上述 P0，本案例可能出现的更短路径是：

1. 3 分钟 freshness preflight；
2. 10–15 分钟 invariant review，提前写出跨入口原子 successor；
3. 约 60–75 分钟首次实现及影响验证；
4. 1 次 full review；
5. 1–2 次 targeted/supplemental 修复；
6. 1 次最终全量与发布。

预期 code rounds 约 4–5，墙钟约 150–190 分钟。该数字是根据当前时间账与返工链做的反事实估计，不是已验证承诺；必须由后续同类案例校准。

## 11. 后续案例统一采集字段

为便于累计若干案例后统一优化，后续每个长任务建议至少记录：

```yaml
case:
  thread_id:
  task_id:
  task_type:
  layers: []
  risk:
  method_commit:
  project_runtime_manifest:
  execution_plane:
    edit_tree:
    service_tree:
    browser_url:
    test_runtime:

timing:
  total_minutes:
  spec_minutes:
  implementation_minutes:
  review_minutes:
  reviewer_elapsed_sum:
  release_overhead_minutes:

review:
  code_rounds:
  full_rounds:
  targeted_rounds:
  supplemental_rounds:
  reviewer_count:
  findings:
    behavior_bug:
    mechanism_bug:
    contract_drift:
    evidence_gap:
    scope_gap:
    advisory:

rework:
  pre_code_preventable: []
  late_validation: []
  method_version_drift: []
  execution_plane_errors: []
  scope_gate_interruptions: []

communication:
  commentary_count:
  unchanged_status_count:
  user_decisions:
    necessary:
    avoidable:

outcome:
  merged:
  final_tests:
  production_findings_closed:
  audit_reproducible:
```

统一优化时重点比较：

- review_minutes 与 reviewer elapsed 的差值；
- 首次实现前已明确的关键不变量数量；
- full 升档中真正出现新生产机制的比例；
- test-only changed surface 触发 full 的次数；
- scope 用户中断中真正涉及语义扩张的比例；
- 方法 runtime mismatch 次数；
- 终态是否需要回改历史报告/profile；
- 新规则是否减少轮次，同时保持真实 behavior/mechanism finding 命中率。

## 12. 最终判断

`fe-b-010` 不是“新方法失败”，而是一次很有价值的压力测试：

- 它证明独立审查、稳定 finding、targeted 路由和 escape-hatch 能抓住并闭合真实并发风险；
- 它也证明仅有审查端瘦身还不够，设计真值、scope 语义、验证计划、运行件版本和历史证据不可变性必须一起优化；
- 在收集更多案例前，不宜因一次四小时任务直接弱化 sensitive 审查；应先用统一字段继续观察哪些成本反复出现。

后续同类案例应各自独立落盘，待样本足够后再做横向聚类和正式方法论修订。
