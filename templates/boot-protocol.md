# Codex 项目启动

> 主线按本协议定位任务；委派单元不执行本协议。工作中恢复只核当前任务、原始契约与实际 Git/进程状态。

## 规范加载

项目已采用版本以 `_meta/method-sync.json` 的 `source` SHA 为唯一来源。首次启动或升级后运行 `node ../hact-method-lab/scripts/sync-method.cjs --runtime-check --root .`，只核一次；不在每轮复审重跑。输出版本漂移时先同步，不能把它当任务失败或绕过 hook。没有已完成同步记录的旧项目沿用获准旧版，不静默采用当前分支。

下表及规范内部的方法论路径是定位符：用 `node ../hact-method-lab/scripts/sync-method.cjs --read specs-execution/develop.md --root .` 读取同一 SHA 内容（按所需文件替换路径）；后续 brief、结构契约和 guide 同样按该 SHA 读取，不直接读移动中的方法论工作树。检查器和报告生成命令使用项目 `scripts/` 副本，规范中旧 `../hact-method-lab/templates/scripts/` 命令前缀统一解释为 `scripts/`。首次核对通过后复用这个来源，给审查员传同一读取方式。方法论分支更新不会自动升级项目；项目升级仍走既有 sync-method 与 hook 委托。

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

B 类任务包创建后统一由 `develop(source=bug/optimization)` 拾取，复用 freshness preflight、隔离证据审查和有界复审。仅用户明确要求接管既有手动 diff 时，按 develop 的独立审查规则处理既有 diff；缺失写代码前的 preflight 证据时，先补做并如实标 `retroactive`。

## Step 0：确认工作基线

先读当前分支、工作树与上游状态。使用用户指定的方法论分支/版本，不自动切 master。新任务建立基线前可 fetch 并在工作树干净、无活跃写入且当前分支有上游时快进同步；进行中任务先恢复已有基线，不因一次提问或压缩重复 pull。无关在制品保留，远端不可用只阻断必须依赖远端的动作。个人 notes 仅实际收割/写入时访问。

采用本版单源状态前，存量项目须逐仓核对 status 与旧 Gate/任务记录、已获用户确认的签署和实际 Git；同步更新项目 check-gate/check-sprint/check-b-task 与既有 hook 的委托路由（不覆盖原 hook）。未核对或旧 hook 仍只盯 gates.md 时沿用获准旧版，不只删文件、不在一次普通开发中自动迁移。历史 Markdown 可保留，但升级后不再双写或作为进度真相。

## Step 1：状态推断与规范加载

1. 读取 `project.md`。
2. 读取 `status.yml iterations.*.gates`。存在 `iterations/v0/` 时先判断 V0，避免被预建的空 `v1/` 误导。
3. 读取 `status.yml tasks[]` 判断状态、负责人和 PR；sprint 仅在规划问题时读，旧 Markdown 状态不参与推断。
4. 用户已明确指定任一 `task.type` 时优先加载该规范并由规范自身核前置；用户只给 task-id 时，先在 iteration queue / `b-queue/` 查契约，并在 `status.yml` 解析其 source 与状态：B 类 task-id 无论当前 A 类处于哪个 Gate，均优先路由 `develop(source=bug/optimization)`。没有显式任务时再按下表推断。

| 状态信号 | 人类说明 | 推断任务类型 |
|---|---|---|
| `phase=v0;G2=0` | status 中 V0 G2 未签 | `draft-foundation` |
| `phase=v0;G2=1;foundation=unmerged` | V0 G2 已签，但 `status.yml` 无已合并的 `foundation` task | `develop(source=foundation)` |
| `phase=v0;foundation=merged` | V0 `foundation` task 已合并 | `continue-v1`，继续按下列 V1 信号判断 |
| `class=B;status=available` | `status.yml` 有 source=bug/optimization 的 `[可取]` 任务 | `develop(source=bug/optimization)`，列出或拾取指定任务 |
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

5. 加载单份执行规范，按其中的完成条件继续；只有实际使用浏览器、远端、托管或独审时核相应能力。缺必需能力时不宣称该验证完成。
6. 正常启动只输出任务范围和下一动作；异常给可查依据。任务途中不重复声明运行时。

检查器应实际执行。项目 hook 漂移时使用已有 `scripts/check-hook-state.js` 诊断并手动运行当前任务必要检查；不覆盖自定义 hook。配置诊断 `node scripts/check-codex-project.js --root .` 只核入口/角色文件形状，不证明模型、浏览器或远端可用。
