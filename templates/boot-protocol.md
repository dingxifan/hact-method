# 项目仓共同启动协议

> `CLAUDE.md` 与 `AGENTS.md` 都以本文为单一启动协议。入口先声明运行时并加载对应映射；本文负责同步、推断和加载单份规范。确定 `task.type` 后、执行任务前，再按 `runtime/preflight.md` 只协商本任务所需能力。

## 规范加载

存量项目若仍有 `standards-{shared,frontend,backend}.md`，升级须先按 `../hact-method-lab/guide/02-一期完整流程.md` 的迁移说明在独立 worktree 完成约束归位与活跃任务接线；不得因方法论同步而静默忽略尚未迁移的项目规则。迁移完成前，沿用项目上次确认的方法论版本处理进行中任务。

本仓使用 hact-method 的执行规范。Step 1 推断出 `task.type` 后，只加载对应路径的单份规范，不得预加载多份：

| task.type | 规范路径 | 备注 |
|---|---|---|
| `init-project` | `../hact-method-lab/specs-execution/init-project.md` | |
| `draft-foundation` | `../hact-method-lab/specs-execution/draft-foundation.md` | V0 地基设计；骨架代码归 `develop(source=foundation)` |
| `draft-prd-vN` | `../hact-method-lab/specs-execution/draft-prd-vN.md` | |
| `draft-ux` | `../hact-method-lab/specs-execution/draft-ux.md` | PRD 标明需要时触发 |
| `draft-tech-design` | `../hact-method-lab/specs-execution/draft-tech-design.md` | |
| `plan-sprint` | `../hact-method-lab/specs-execution/plan-sprint.md` | |
| `develop` | `../hact-method-lab/specs-execution/develop.md` | 含 per-task 独立审查与自合并 |
| `generate-integration-tests` | `../hact-method-lab/specs-execution/generate-integration-tests.md` | |
| `manual-test` | `../hact-method-lab/specs-execution/manual-test.md` | |
| `deploy` | `../hact-method-lab/specs-execution/deploy.md` | |
| `wrap-up-iteration` | `../hact-method-lab/specs-execution/wrap-up-iteration.md` | |
| `dispatch-new` | `../hact-method-lab/specs-execution/dispatch-new.md` | B 类 |
| `revise-doc` | `../hact-method-lab/specs-execution/revise-doc.md` | B 类 |

B 类任务包创建后统一由 `develop(source=bug/optimization)` 拾取，复用 freshness preflight、隔离证据审查和有界复审。仅用户明确要求接管既有手动 diff 时，才按当前运行时映射走兼容审查；缺失写代码前的 preflight 证据时，先补做并如实标 `retroactive`。

## Step 0：代码同步

对项目仓、hact-method 与个人 notes 仓逐一同步。同步失败必须保留原始错误，不能改写为“已同步”。以下命令表达所需 Git 语义；按当前可用 shell 执行等价命令：

```bash
sync_repo() {  # 用法: sync_repo <仓路径> <必须分支|->
  dir="$1"; want="$2"
  branch=$(git -C "$dir" rev-parse --abbrev-ref HEAD) || return 1
  if [ "$want" != "-" ] && [ "$branch" != "$want" ]; then
    echo "⚠️ $dir 当前在 $branch 而非 $want" >&2; return 1
  fi
  before=$(git -C "$dir" rev-parse HEAD)
  git -C "$dir" fetch origin || return 1
  if git -C "$dir" rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
    git -C "$dir" pull --ff-only || return 1
  else
    echo "$dir（$branch）：当前分支无远端跟踪，仅 fetch"
  fi
  echo "$dir（$branch）：拉取 $(git -C "$dir" rev-list --count "$before..HEAD") 个 commit"
}

sync_repo . -
sync_repo ../hact-method-lab master
sync_repo "../hact-notes-{username}" - \
  || echo "个人 notes 仓同步未成功（未创建/无跟踪/冲突）——不阻断"
```

完成后必须输出：

```text
📋 会话启动·代码同步
- 项目仓（{当前分支}）：{已拉取 N 个 commit / 已是最新 / ⚠️ 有冲突——停止，请人工处理}
- hact-method（master）：{已拉取 N 个 commit / 已是最新}
- 个人 notes（hact-notes-{username}）：{已拉取 N 个 commit / 已是最新 / 未配置}
同步完成，进入 Step 1。
```

项目仓或 hact-method 同步失败（冲突、分叉、凭据失败或方法论仓不在 `master`）时停止；个人 notes 仓失败只提示，不阻断。

## Step 1：状态推断与规范加载

1. 读取 `project.md`。
2. 读取相关 `gates.md`。存在 `iterations/v0/` 时先判断 V0，避免被预建的空 `v1/` 误导。
3. 读取 `iterations/vN/sprint.md`，由状态列和 PR 列判断任务进度。
4. 用户已明确指定任一 `task.type` 时优先加载该规范并由规范自身核前置；用户只给 task-id 时，先在 iteration queue / `b-queue/` / `status.yml` 解析其 source 与状态：B 类 task-id 无论当前 A 类处于哪个 Gate，均优先路由 `develop(source=bug/optimization)`。没有显式任务时再按下表推断。

| 状态信号 | 人类说明 | 推断任务类型 |
|---|---|---|
| `phase=v0;G2=0` | `v0/gates.md` G2 未签 | `draft-foundation` |
| `phase=v0;G2=1;foundation=unmerged` | V0 G2 已签，但 `status.yml` 无已合并的 `foundation` task | `develop(source=foundation)` |
| `phase=v0;foundation=merged` | V0 `foundation` task 已合并 | `continue-v1`，继续按下列 V1 信号判断 |
| `class=B;status=available` | `b-queue/` 或 `status.yml` 有 source=bug/optimization 的 `[可取]` 任务 | `develop(source=bug/optimization)`，列出或拾取指定任务 |
| `class=B;status=active` | B 类任务为 `[taken-by]` 或 `[done]` | `develop(source=bug/optimization)`，按 task-id 续做 |
| `phase=v1;G1=0` | G1 未签 | `draft-prd-vN` |
| `phase=v1;G1=1;G2=0;ux=required;outputs=incomplete` | PRD 任一功能需 UX，`prototype.html` / `prototype-map.md` / `ux-flows.md` 任一未齐 | `draft-ux` |
| `phase=v1;G1=1;G2=0;ux=ready` | 无需原型，或三份 UX 产物均已存在 | `draft-tech-design` |
| `phase=v1;G2=1;G3=0` | G2 已签、G3 未签 | `plan-sprint` |
| `phase=v1;G3=1;G4=0;tasks=available` | 存在 `[可取]` | `develop`，列出可认领任务 |
| `phase=v1;G3=1;G4=0;tasks=active` | 存在 `[taken-by]` 或 `[done]` | `develop`，续做 |
| `phase=v1;G3=1;G4=0;tasks=merged;integration=missing` | 全部开发任务 `[merged]`，联调报告不存在 | `generate-integration-tests` |
| `phase=v1;G3=1;G4=0;tasks=merged;integration=present` | 联调报告存在 | `manual-test` |
| `phase=v1;G4=1;G5=0` | G4 已签、G5 未签 | `wrap-up-iteration`；同时提示可按用户指令并行执行 `deploy` |
| `phase=v1;G5=1` | G5 已签 | `wait`，本迭代完结等待指令 |

推断 `manual-test` 时只检查联调报告是否存在；进入相应规范后再读全文。不得按人贴角色标签；实现层由 `develop` 在会话内确认。

5. 加载单份对应执行规范，从该规范的动作与完成判据提取本任务所需能力。
6. 执行 `runtime/preflight.md`，只核第 5 步命中的能力；存在直接相关的 `blocked` 时停在能力边界，不进入任务执行。
7. 输出 Gate 进度、任务状态分布、能力结论与下一步动作。处于等待状态时，收到新指令仍要先加载对应执行规范并完成对应能力预检。

恢复进行中任务时，以实际工作区和 `git diff --stat` 对账进度记录；冲突时信工作区，进度记录只说明上次意图。
