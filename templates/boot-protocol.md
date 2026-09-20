# Codex 项目启动

> 主线按本协议定位任务；委派单元不执行本协议。工作中恢复只核当前 Task、权威输入与实际 Git / process state。

## 1. 规范来源

项目已采用版本以 `_meta/method-sync.json` 的 `source` SHA 为唯一方法论来源。首次启动或升级后运行：

```bash
node ../hact-method-lab/scripts/sync-method.cjs --runtime-check --root .
```

只核一次；不在每轮复审重跑。输出版本漂移时先按项目既有升级流程处理，不能把方法论工作树的最新内容静默混进当前 adopted SHA。

方法论文件通过同一 SHA 读取。例如：

```bash
node ../hact-method-lab/scripts/sync-method.cjs --read tasks/develop.md --root .
```

检查器和报告生成命令使用项目 `scripts/` 副本。旧规范中出现的 `../hact-method-lab/templates/scripts/` 命令前缀，在存量项目继续解释为项目自己的 `scripts/`，除非另有迁移决定。

### Migration boundary

- vNext Core 只接受已完成 normalization 的项目；日常运行只走 vNext Task / Protocol / Runtime Contract。
- 旧项目先由 `legacy-migration/normalize-legacy-project.cjs` 核对真实 Git 与历史状态、形成固定 baseline；它不补造 review/preflight 证据。
- normalizer 未通过时不得把旧任务带入 vNext lifecycle；后续工作以新的 vNext task 引用历史事实，不 reopen 旧任务。

## 2. 最小加载规则

### 2.1 先加载一个 Task Contract

用户已经明确 Task 时，直接加载对应 `tasks/{task}.md`，由 Task 自身检查 Preconditions；不要先根据 Gate 猜另一个 Task。

用户未指定 Task 时，先按 Step 1 从 `status.yml` 与项目事实推断一个 canonical Task，再只加载该 Task Contract。

不要预加载全部 `tasks/`。

### 2.2 Shared Protocol 按触发条件加载

只在当前动作实际需要时读取：

| 触发 | Protocol |
|---|---|
| 状态读取、认领、流转 | `protocols/state.md` |
| Gate readiness / approval | `protocols/gates.md` |
| candidate、merge、Accepted Truth、handoff | `protocols/git-truth.md` |
| Independent Review | `protocols/review.md` |
| Human Authority 判断 | `protocols/authority.md` |
| 中断、恢复、重入 | `protocols/recovery.md` |
| B 类 bug / optimization intake | `protocols/b-intake.md` |

Task Contract 明确引用其他 Protocol 时按引用加载。不要因为“可能会用到”而把全部 Protocol 当启动上下文。

### 2.3 Runtime Adapter 按实现需要加载

`runtime/codex.md` 只在需要 Codex-specific realization 时加载，例如：

- Git/worktree/index 操作
- command / test execution
- fixed Git snapshot
- isolated review context
- Git delivery
- Discussion Persistence
- context compaction 后的 Runtime 恢复

纯 reasoning / document work 若 Task Contract 已足够，不必预加载整份 Runtime Adapter。

用户明确要求外部 UX 设计会话时才加载 `runtime/external-ux.md`。

System-review artifacts 只在 canonical Task 已路由为 `integration-verify`，或恢复该 Task 时加载。Package develop、planning 与其他 Task 不预加载完整 system-review history。

## 3. Canonical Task routing

vNext Core Task Catalog：

| canonical Task | Task Contract |
|---|---|
| `init-project` | `tasks/init-project.md` |
| `draft-foundation` | `tasks/draft-foundation.md` |
| `draft-prd` | `tasks/draft-prd.md` |
| `draft-ux` | `tasks/draft-ux.md` |
| `draft-tech-design` | `tasks/draft-tech-design.md` |
| `plan-sprint` | `tasks/plan-sprint.md` |
| `revise-doc` | `tasks/revise-doc.md` |
| `develop` | `tasks/develop.md` |
| `integration-verify` | `tasks/integration-verify.md`（System Verification） |
| `manual-test` | `tasks/manual-test.md` |
| `deploy` | `tasks/deploy.md` |
| `wrap-up-iteration` | `tasks/wrap-up-iteration.md` |

Aliases: `draft-prd-vN` → `draft-prd`; `generate-integration-tests` →
`integration-verify`. `draft-ux-external` is a runtime route that returns to
canonical `draft-ux`; it is not a Task name.

非 Core Task：

- `dispatch-new` → `protocols/b-intake.md` → `develop(source=bug|optimization)`
- `draft-ux-external` → `runtime/external-ux.md`，最终仍回 `draft-ux`
- `harvest-notes` → `utilities/harvest-notes.md`，仅用户明确要求时运行

## Step 0：确认工作基线

先核：

- 当前 repository / branch / HEAD / upstream
- working tree / index / stash
- adopted Method SHA
- 项目 `status.yml`

### R2.4 · Repository capability routing

仓库能力分三类，不能互相冒充：

- **repository-read**：读取远端 ref、文件、commit、PR/issue 等仓库事实。
- **repository-write**：通过当前运行时已授权的原生仓库连接器/API 直接创建或更新 branch、文件、commit、PR 等远端对象。
- **repository-execution**：在真实 checkout 中执行 Git/Node/测试/build/hook/worktree 等命令并取得运行结果。

选择最短可信路径：

1. 当前远端存在已授权的 **native repository-write**，且本动作不依赖本地命令结果时，优先直接写远端 branch/commit/PR，并以返回的 Git SHA/PR 状态作为持久化事实。
2. 任何结论依赖测试、hook、worktree、build、脚本或真实工作树时，必须使用 **repository-execution**；native write 不能替代执行证据。
3. native repository-write 不可用时，使用已有本地 Git 执行环境完成 fetch/commit/push/PR 所需动作；不得因为过去某次会话缺能力，就假定当前仍缺，也不得因为当前能写远端，就假定拥有本地执行能力。
4. native repository-write 必须保留当前仓既有的 branch/PR/protected-branch 与授权边界；不能因为 connector 能写就直接改稳定分支、force-push、删分支或绕过既有 review/merge 规则。
5. 若变更已经在本地 execution worktree 中实现、测试或审查，则该 worktree 是本次 diff 的持久化来源：从它 commit/push，native connector 可继续处理远端 PR/metadata，但不得重新拼装同一批文件形成第二份未经同一证据链确认的远端 diff。
6. `scripts/hact-watcher/` 的 Dropbox/Watcher 路径自 R2.4 起为 **dormant experimental asset**，不在日常执行选项中，不自动启动、配置或回退到它。重新启用须有新的显式方法决策。
7. provider-specific 操作仍服从项目当前 remote 与项目规则；例如 Gitee 项目需要 Gitee API 时继续读 `gitee-ops.md`。native connector 只有在它确实对应当前 remote/provider 且已授权时才可使用。

迁移项目的历史核对只在 normalizer 中进行；它通过后，日常 Core 不再对旧 Gate、旧任务或旧 schema 设置 runtime 特判。历史 Markdown 可保留，但不再作为当前进度真相。

新任务建立基线前可 fetch 并在工作树干净、无活跃写入且当前分支有上游时快进同步；进行中任务先恢复已有基线，不因一次提问或 context compaction 重复 pull。

不明来源的 local changes 保留并隔离，不擅自 restore / stash / force clean。

## Step 1：状态推断与 Task 选择

1. 读取 `project.md`。
2. 读取 `status.yml iterations.*.gates`；存在 `iterations/v0/` 时先判断 V0。
3. 读取 `status.yml tasks[]` 判断当前 work item、Owner、source、依赖与状态。动态状态不从旧 Markdown 复选框推断。
4. 用户已明确 canonical Task 时优先该 Task；用户给 legacy alias 时先 canonicalize。
5. 用户只给 task-id 时，先在 `status.yml` 与对应 queue 找到该 Task Contract/source，再继续。
6. B 类 task-id / bug / optimization 请求先做 B Intake；已有合法 Development Intake 且用户已授权实现时直接衔接 `develop`。
7. 没有显式 Task 时，按下表推断。

| 状态信号 | 推断 Task |
|---|---|
| `phase=v0; G2=0` | `draft-foundation` |
| `phase=v0; G2=1; foundation not merged` | `develop(source=foundation)` |
| `phase=v0; foundation merged` | 继续按 V1 信号判断 |
| B 类已有未闭合 intake/work item | `develop(source=bug|optimization)` |
| `phase=v1; G1=0` | `draft-prd` |
| `phase=v1; G1=1; G2=0; ux required; outputs incomplete` | `draft-ux` |
| `phase=v1; G1=1; G2=0; ux ready/not-required` | `draft-tech-design` |
| `phase=v1; G2=1; G3=0` | `plan-sprint`；若 planning 已 merged，则进入 G3 approval boundary |
| `phase=v1; G3=1; G4=0; sprint task claimable/active` | `develop` |
| `phase=v1; G3=1; G4=0; sprint tasks merged; System Verification missing/incomplete` | `integration-verify` |
| `phase=v1; G3=1; G4=0; integration-verify merged; semantic + runtime lanes satisfied; no pending system obligation` | `manual-test` |
| `phase=v1; G4=1; G5=0` | `wrap-up-iteration`；`deploy` 仅按用户授权/项目策略进入 |
| `phase=v1; G5=1` | `wait` / 下一明确 Task |

### `可取` 不是单独的认领充分条件

对任何 Task，从 `可取` 进入 `taken-by` 前必须再核该 Task 的 Preconditions。

尤其：

- `source=sprint` 必须 G3 approved；
- `depends_on` 必须满足；
- required artifact / authorization 必须存在。

因此 G3 未签时，即使 planning 已把 sprint Task 登记为 `status: 可取`，也不得认领。不要为了表达 dependency wait / Gate wait 增加第五状态。

## Step 2：加载最小执行上下文

Task 确定后：

1. 加载 `tasks/{task}.md`；
2. 读取其 Authoritative Inputs；
3. 按 §2 的触发规则加载实际需要的 Shared Protocol；
4. 只有需要 Codex-specific realization 时加载 `runtime/codex.md`；
5. 再开始正式修改 / review / verification。

正常启动只输出当前 Task 范围和下一动作；异常时给出可查依据。任务途中不重复声明整套运行时。

## Step 3：执行与恢复

进入 Task 后以 Task Contract 的 Completion & Handoff 为准。

Context compaction、session interruption 或跨 Runtime 恢复时，不重新执行整套任务路由；读取 fixed Method SHA、当前 Task、Accepted Truth、candidate/evidence 与实际 Git state，从第一个未满足 completion condition 继续。

需要浏览器、远端、托管、部署或独审时才核对应 capability。缺必需 capability 时形成明确 gap，不把未执行的验证写成已完成。
