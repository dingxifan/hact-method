# 项目仓共同启动协议

> `CLAUDE.md` 与 `AGENTS.md` 都以本文为单一启动协议。先完成 `runtime/preflight.md`，再按本文同步、推断和加载规范。运行时专属实现只看对应映射表。

## 规范加载

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

### Step 0.5：门卫可见性

同步完成后，若项目存在 `scripts/check-hook-state.js`，运行：

```bash
node scripts/check-hook-state.js --method-root ../hact-method-lab
```

- 退出码 0：tracked 门卫已由实际生效 hook 逐字节安装或明确委托，且方法论模板无漂移；把「检查器与门卫」标为 `available`。
- 退出码 1：按 `signals` 报告未安装、active↔tracked 漂移或 template↔project 漂移；标为 `degraded`，继续时必须手动运行本任务相关检查器。**只报告，不自动复制/覆盖**，由人决定安装、重装或合并项目自定义 hook。
- 脚本不存在（存量仓）：标为 `degraded` 并提示补铺；不虚报门卫已生效。

本检查只让本地状态可见，不把 pre-commit 冒充安全边界；`--no-verify` 仍可绕过并须自行留痕。

## Step 1：状态推断与规范加载

1. 读取 `project.md`。
2. 读取相关 `gates.md`。存在 `iterations/v0/` 时先判断 V0，避免被预建的空 `v1/` 误导。
3. 读取 `iterations/vN/sprint.md`，由状态列和 PR 列判断任务进度。
4. 明确声明下表所得的下一任务类型。

| 状态 | 推断任务类型 |
|---|---|
| `v0/gates.md` G2 未签 | `draft-foundation` |
| V0 G2 已签，但 `status.yml` 无已合并的 `foundation` task | `develop(source=foundation)` |
| V0 `foundation` task 已合并 | V0 完成，继续判断 V1+ |
| 无 `sprint.md` 且 G1 未签 | `draft-prd-vN` |
| 存在 `[可取]`，G3 已签且 G4 未签 | `develop`，列出可认领任务 |
| 存在 `[taken-by]` 或 `[done]`，G3 已签且 G4 未签 | `develop`，续做 |
| 全部 `[merged]`，G4 未签 | `generate-integration-tests` |
| 全部 `[merged]` 且联调报告存在，G4 未签 | `manual-test` |
| G4 已签、G5 未签 | `wrap-up-iteration` |
| G5 已签 | 本迭代完结，等待指令 |

推断 `manual-test` 时只检查联调报告是否存在；进入相应规范后再读全文。不得按人贴角色标签；实现层由 `develop` 在会话内确认。

5. 加载单份对应执行规范，输出 Gate 进度、任务状态分布与下一步动作。
6. 处于等待状态时，收到新指令仍要先加载对应执行规范。

恢复进行中任务时，以实际工作区和 `git diff --stat` 对账进度记录；冲突时信工作区，进度记录只说明上次意图。
