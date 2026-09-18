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

### Legacy compatibility

- adopted SHA 已提供 vNext `tasks/` 时，正常执行只走 vNext Task Contract；`specs-execution/` 只作 migration / legacy reference。
- 没有完成 vNext 升级的旧项目继续沿用其已获准版本，不自行拼接新旧入口。
- 存量项目若仍有 `standards-{shared,frontend,backend}.md` 或其他历史结构契约，按项目既有升级说明处理；普通开发任务不顺手做方法论迁移。

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

## 3. Canonical Task routing

vNext Core Task Catalog：

| canonical task | Task Contract | legacy alias / note |
|---|---|---|
| `init-project` | `tasks/init-project.md` | |
| `draft-foundation` | `tasks/draft-foundation.md` | |
| `draft-prd` | `tasks/draft-prd.md` | `draft-prd-vN` |
| `draft-ux` | `tasks/draft-ux.md` | 外部设计路径仍归同一 Task |
| `draft-tech-design` | `tasks/draft-tech-design.md` | |
| `plan-sprint` | `tasks/plan-sprint.md` | |
| `revise-doc` | `tasks/revise-doc.md` | |
| `develop` | `tasks/develop.md` | 承接 A/B/repair source |
| `integration-verify` | `tasks/integration-verify.md` | `generate-integration-tests` |
| `manual-test` | `tasks/manual-test.md` | |
| `deploy` | `tasks/deploy.md` | |
| `wrap-up-iteration` | `tasks/wrap-up-iteration.md` | |

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
| `phase=v1; G3=1; G4=0; sprint tasks merged; integration missing` | `integration-verify` |
| `phase=v1; G3=1; G4=0; integration passed/present` | `manual-test` |
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
