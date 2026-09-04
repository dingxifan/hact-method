# exec: deploy

> 运行时加载本文时，当前任务是将已验收的代码部署到目标环境，验证服务正常。
> 默认合并部署：一次包含所有已验收改动（A 类迭代 + B 类 normal + hotfix）。

**上下文密度**：中。需读 `connections.yml`（连到哪）+ `deployment.config`（怎么构建重启），执行若干远端命令，全程在主线操作，不额外派隔离单元。

---

## 红线

- **禁止在服务器上直接修改代码**：唯一合法路径是本地修改 → `git push` → 服务器 `git pull`
- **构建失败不重启服务**：保留旧版本运行，记录错误上报，等修复后重走步骤
- **判据是产物不是退出码**：上一条的「构建失败」不能只看 `build-command` 的退出码——**构建根本没跑**（有人直接 `pm2 restart`）或跑了但产物没落地时，退出码判据完全无效（没执行的命令不会返回非零）。必须以 `build-artifact` 存在且**新于本次拉取的 HEAD 提交时间**为准。实测事故：某前端 `.next` 缺失，`next start` 每次立即退出、pm2 无延迟重启，累计 **574 次「Could not find a production build」+ 17 次 EADDRINUSE**（重启太密，端口未释放就自撞），而三道"构建失败"闸一道都没响——因为构建从来没被执行过。
- **健康检查未通过不算完成**：服务重启成功不等于部署成功，必须健康检查通过才记录结果
- **hotfix 快速通道须有授权**：urgency=hotfix 的任务需有 `dispatch` discipline 用户授权后才能不等 G4 部署

---

> **步骤协议**：默认 **auto-run until failure**。正常路径不逐步询问；每步完成后输出 `✅ [步骤名] 完成：[1–2 句结论]` 并直接进入下一步。只有标 `🚫` 的人工断点必须等用户明确回应才继续；失败、冲突、权限不足、健康检查异常等非绿灯场景立即停下并报告。

---

## 会话启动

读任务包，确认 `target`（目标环境，如 `prod` / `staging`）。触发前置（A 类 G4 已签 / B 类积累批量 / hotfix 须 `dispatch` 授权）见 structural `前置条件` + 红线。

**先确认连接可用**：跑 `node scripts/check-conn.js check --live`。红则先修连接再谈部署——连不上服务器时后面每一步都会以更难读的形态失败。服务器坐标从 `connections.yml` 取：`ssh.{target}.mcp-alias` / `ssh.{target}.host` / `ssh.{target}.app-dir`（服务器上的仓库目录）；实际使用哪种远端命令通道由当前运行时映射决定。连接与凭据的分层约定见 hact-conn skill。

**首次部署（`deployment.config` 不存在）**：先建 `deployment.config`，只填**命令侧**字段，commit 后继续：
```
build-command=
build-artifact=
health-check-url=
restart-command=
auto-restart=false
```

> 服务器地址归 `connections.yml` 的 `ssh.{target}.host`。存量项目的 `deployment.config` 里若还有 `server-address=`，按兼容值读，并提示用户迁进 `connections.yml`（两处都有时以 `connections.yml` 为准）。

读 `deployment.config`，确认配置完整。`auto-restart` 为可选字段：
- `true`：该环境允许构建成功后自动执行 `restart-command`（如 staging、静态发布、无停机 reload、已约定发布窗口）。
- `false` 或缺失：`target=prod` 时，执行 `restart-command` 前必须停下确认；非 prod 可自动继续。

```
部署目标：{target}
包含内容：{A 类 vN / B 类 {task-id 列表} / hotfix {task-id}}
重启策略：{auto-restart=true 自动重启 / prod 需确认 / 非 prod 自动继续}
继续？
```

🚫 等用户确认部署范围

---

## Step 1：本地构建验证

执行 `deployment.config` 中的 `build-command`（如 `npm run build`）及类型检查。

**构建失败** → 立即阻断，输出完整错误日志，不进行后续步骤，等修复后重新开始。

```
✅ 本地构建验证通过。
→ 自动进入 Step 2：推送代码
```

---

## Step 2：推送代码

将所有待部署分支合并至主分支，推送到远端：
```bash
git push origin master
```

> hotfix 快速通道：Step 1（本地构建验证）仍须执行；本步骤仅合并 hotfix 分支，不合并其他未验收改动。

---

## Step 3：服务器拉取

SSH 到服务器，执行：
```bash
git pull
```

确认拉取成功（无冲突 / 无报错）。

**拉取有冲突** → 立即停止。不得在服务器上手工解冲突或强制覆盖；回本地解决冲突、重新构建、push 后，再从 Step 3 重试。

---

## Step 4：服务器构建

执行 `deployment.config` 中的 `build-command`。

**构建失败** → 保留旧版本运行，**不执行 Step 5**，记录错误，上报，等修复后重走 Step 3–7。

> 退出码为 0 **不等于**可以重启——必须先过 Step 4.5 产物闸。

```
✅ 服务器构建完成。
→ {auto-restart=true 或非 prod：自动进入 Step 5 / prod 且 auto-restart=false：等待确认重启}
```

🚫 **仅当 `target=prod` 且 `auto-restart` 不是 `true` 时**，等用户确认重启。其余情况自动继续。


---

## Step 4.5：构建产物闸（🚫 不可跳过）

Step 4 的退出码只证明「命令跑完了」，不证明「产物落地了」，更不证明「命令真的被执行过」。本闸以事实为准：

```bash
A={build-artifact}            # deployment.config 中的产物路径
HEAD_TS=$(git log -1 --format=%ct)                    # 本次拉取的 HEAD 提交时间
[ -e "$A" ] || { echo "❌ 产物不存在：$A"; exit 1; }
ART_TS=$(stat -c %Y "$A")
[ "$ART_TS" -ge "$HEAD_TS" ] || { echo "❌ 产物早于本次代码（产物 $(date -d @$ART_TS '+%F %T') < HEAD $(date -d @$HEAD_TS '+%F %T')）——构建未真正执行"; exit 1; }
echo "✅ 产物闸通过：$A"
```

- **产物不存在** → 阻断，**不执行 Step 5**。此时若重启，进程会启动即退出、被进程管理器无延迟拉起，形成紧密重启循环（实测 574 次），且日志被刷屏、端口自撞（EADDRINUSE）。
- **产物早于 HEAD 提交时间** → 阻断。说明本次构建没真跑，服务器上是上一版产物，重启只会把旧版本重新拉起来，而健康检查照样通过——**这是最危险的一种"部署成功"**。
- `build-artifact` 未配置（存量项目）→ 输出 🧑 提示并要求本次补上，不静默跳过。

> 为什么不并进 Step 4：Step 4 的判据是命令退出码（自报），本闸的判据是文件系统事实。两者失效方式不同——退出码对「命令没被执行」完全无效，必须分开落判。

---

## Step 5：重启服务

执行 `deployment.config` 中的 `restart-command`（如 `pm2 restart {app}`）。

**进程管理器配置的两条硬要求**（首次部署时确认，之后不必每次查）：
- **设重启上限与退避**：pm2 默认无限次、无延迟重启。启动即失败的进程会被瞬间拉起上百次，把日志刷满、端口自撞。配 `--max-restarts 5 --restart-delay 5000`，让它失败几次就停下来报错，而不是空转。
- **别用 shell 包装启动命令**：`bash -c "npx xxx start"` 会让进程管理器监管那层 bash 而非真正的服务进程，信号传递与重启行为都不干净。直接指向可执行入口（如 `node_modules/next/dist/bin/next` + args `start -p 3002`）。

---

## Step 6：健康验证

执行健康检查：
```bash
curl -f {health-check-url}
```

检查服务日志最近 50 行，确认无异常错误。

**健康检查失败** → 检查日志定位原因；无法快速修复则回滚至上一个成功版本，记录并上报。

---

## Step 7：记录部署结果

按 `../hact-method-lab/templates/deploy-log.md` 格式在项目根 `deploy-log.md` **追加**一条（不覆盖）：包含内容 / 构建结果 / 健康检查 / 备注。

```
✅ deploy 完成：{target} 部署成功，健康检查通过。
→ 下一步：wrap-up-iteration（可并行执行）
```

---

## 边界场景

**无服务器（纯静态 / Gitee Pages 等）**：
- 跳过 Step 3–6，替换为对应平台发布命令
- 健康验证改为访问页面确认可打开

**多环境（staging 先于 prod）**：
`target` 字段为多个环境时（如 `staging → prod`），依次对每个环境完整执行 Step 1–7：
1. 先对 `staging` 执行 Step 1–7，健康检查通过后记录部署日志
2. staging 无异常后，输出 staging 结果摘要，🚫 等用户确认是否推进 `prod`
3. 用户确认后，再对 `prod` 执行 Step 3–7（本地构建 Step 1–2 无需重复）
4. 每个环境独立验证，staging 失败不推进 prod

**hotfix 与当前未部署的 A 类改动代码冲突**：
- 解决冲突后再部署；不拆分部署（除非冲突短期无法解决）

**部署后发现功能异常**：
- 立即走 `dispatch-new(target-source=bug, urgency=hotfix)` → develop → deploy 快速通道

**回滚后仍有问题**：
- 上报；暂时下线功能或切流量，等根因分析完成后再重新部署

---

## 上下文管理

deploy 通常单次会话完成，无需专门的断点续做文件。

**中断续做**：读 `deploy-log.md` 最后一条记录，判断中断在哪个步骤：
- 无新记录 → 从 Step 1 重新开始
- 有"构建结果：成功"但无"健康检查"结论 → 从 Step 6 继续
- 已有完整记录 → 任务已完成
