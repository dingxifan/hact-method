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

检查器和报告生成命令只使用项目当前 `scripts/` 副本。

### Current-schema boundary

- 日常 Core 只接受当前 Method schema；缺失或不匹配时 fail closed。
- 旧项目必须先在 Core 之外按 `guide/08-旧项目全面接入新版.md` 完成一次性 normalization、所有权归类、隔离候选与独立迁移审查。该边界不是运行时兼容层；完成后不再读取旧 schema。
- 历史事实只作 Git reference，不进入当前 lifecycle，不补造 review/Gate/Task 证据。

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
| non-idempotent / production / effect-indeterminate action | `protocols/external-effect.md` |

Task Contract 明确引用其他 Protocol 时按引用加载。不要因为“可能会用到”而把全部 Protocol 当启动上下文。

### 2.3 Runtime Adapter 按实现需要加载

`runtime/codex.md` 只在需要 Codex-specific realization 时加载，例如：

- Git/worktree/index 操作
- command / test execution
- fixed Git snapshot
- isolated review context
- Git delivery
- context compaction 后的 Runtime 恢复

纯 reasoning / document work 若 Task Contract 已足够，不必预加载整份 Runtime Adapter。

用户明确要求外部 UX 设计会话时才加载 `runtime/external-ux.md`。

### 2.4 Runtime Orchestration 按实际 crossing 加载

Stay Local 是默认。当前 canonical Task 确实需要 Runtime crossing 时加载 Runtime Orchestration Skill；只有操作可能 non-idempotent、effect-indeterminate 或必须恢复同一 execution identity 时才加载持久化协议：

- `.agents/skills/runtime-orchestration/SKILL.md`；
- 当前 Runtime 对应的 adapter 小节；
- 命中上述 trigger 时的 `protocols/external-effect.md`。

该 Skill 只实现既有 Task/Protocol 决定，不建立第二套 Task routing、state、Gate、Authority、Review 或 completion system。普通 handoff 不创建记录；只有 external effect 创建 receipt。加载 Runtime/skill 或发现 tool capability 都不能静默扩大 Authority。

System-review artifacts 只在 canonical Task 已路由为 `integration-verify`，或恢复该 Task 时加载。Package develop、planning 与其他 Task 不预加载完整 system-review history。

`integration-verify` 进入 `merged` 或 `manual-test` 前必须运行项目副本 `node scripts/check-system-review.js vN`；latest report 必须 `pass` 且无 open finding，不从文件存在性推断完成。

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

非 Core Task：

- `dispatch-new` → `protocols/b-intake.md` → `develop(source=bug|optimization)`
- `draft-ux-external` → `runtime/external-ux.md`，最终仍回 `draft-ux`
- `harvest-notes` → `utilities/harvest-notes.md`，仅用户明确要求时运行

## Step 0：Minimum Execution Preflight

普通执行开始前只核：

- `Target`：正确 repository / worktree / 必要 baseline；
- `Collision`：未知 local changes 不与本次 write set 冲突；
- `Boundary`：允许/禁止范围与当前 Authority 清楚；
- `Validation`：真实验证入口与停止条件已知。

Method SHA 只在当前动作受 HACT Method 约束时核；upstream 只在 pull/push/PR/merge 时核；stash、全量 status/Gate/owner/dependency 与其他 worktree 只在当前动作实际依赖或改变它们时核。四项输入未变化时复用结论。

需要真实测试/build/hook/worktree 证据时使用 repository execution；远端 connector 不能替代本地证据。Git delivery 只在用户授权和 repository policy 允许时执行，细节按 Runtime Adapter。

## Step 1：状态推断与 Task 选择

1. 用户已明确 canonical Task 时优先该 Task。当前动作不读取或改变 lifecycle truth 时，不为确认流程感预读全量 status/Gate/owner/dependencies。
2. 用户只给 task-id 时，才在 `status.yml` 与对应 queue 找到该 Task Contract/source。
3. 没有显式 Task，或当前动作会读取/改变 Task、Gate、owner、dependency 时，读取 `project.md` 与所需的 `status.yml` slice；存在 `iterations/v0/` 时按需判断 V0。动态状态不从旧 Markdown 或聊天总结推断。
4. B 类 task-id / bug / optimization 请求先做 B Intake；已有合法 Development Intake 且用户已授权实现时直接衔接 `develop`。
5. 需要推断 Task 时按下表判断。

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

1. 加载 `tasks/{task}.md` 与本次动作需要的 Authoritative Inputs；
2. 按 §2 的触发规则加载实际需要的 Shared Protocol；
3. 只有实际 crossing 才加载 Runtime Orchestration Skill；
4. 只有需要 Codex-specific realization 时加载 `runtime/codex.md`；
5. 做 Minimum Execution Preflight：`Target / Collision / Boundary / Validation`；
6. 直接开始正式修改 / review / verification。

未触发的 remote/upstream、Gate、ownership、deployment 或其他 lifecycle 状态不预查、不比较。preflight 输入未变化时不重复执行；只在边界变化或进入 commit/push/merge/external/deployment 等更高影响动作时增量检查。

正常启动只输出当前 Task 范围和下一动作；异常时给出可查依据。任务途中不重复声明整套运行时。

## Step 3：执行与恢复

进入 Task 后以 Task Contract 的 Completion & Handoff 为准。

Context compaction、session interruption 或跨 Runtime 恢复时，不重新执行整套任务路由；读取 fixed Method SHA、当前 Task、Accepted Truth、candidate/evidence 与实际 Git state，从第一个未满足 completion condition 继续。

需要浏览器、远端、托管、部署或独审时才核对应 capability。缺必需 capability 时形成明确 gap，不把未执行的验证写成已完成。

non-idempotent / external action 使用 versioned External Effect Receipt；job/thread/revision/polling 只是 transient telemetry。`check-external-effect` 只验证 receipt 结构，不能替代 Authority、真实 effect observation、Review、Gate 或 Task completion。
