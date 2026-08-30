# exec: deploy

> CC 加载本文时，当前任务是将已验收的代码部署到目标环境，验证服务正常。
> 默认合并部署：一次包含所有已验收改动（A 类迭代 + B 类 normal + hotfix）。

**上下文密度**：中。需读 `connections.yml`（连到哪）+ `deployment.config`（怎么构建重启），执行若干 shell 命令，全程在主线操作，不派 subagent。

---

## 红线

- **禁止在服务器上直接修改代码**：唯一合法路径是本地修改 → `git push` → 服务器 `git pull`
- **构建失败不重启服务**：保留旧版本运行，记录错误上报，等修复后重走步骤
- **健康检查未通过不算完成**：服务重启成功不等于部署成功，必须健康检查通过才记录结果
- **hotfix 快速通道须有授权**：urgency=hotfix 的任务需有 `dispatch` discipline 用户授权后才能不等 G4 部署

---

> **步骤协议**：默认 **auto-run until failure**。正常路径不逐步询问；每步完成后输出 `✅ [步骤名] 完成：[1–2 句结论]` 并直接进入下一步。只有标 `🚫` 的人工断点必须等用户明确回应才继续；失败、冲突、权限不足、健康检查异常等非绿灯场景立即停下并报告。

---

## 会话启动

读任务包，确认 `target`（目标环境，如 `prod` / `staging`）。触发前置（A 类 G4 已签 / B 类积累批量 / hotfix 须 `dispatch` 授权）见 structural `前置条件` + 红线。

**先确认连接可用**：跑 `node scripts/check-conn.js check --live`。红则先修连接再谈部署——连不上服务器时后面每一步都会以更难读的形态失败。服务器坐标从 `connections.yml` 取：`ssh.{target}.mcp-alias`（走 SSH MCP 时用它）/ `ssh.{target}.host` / `ssh.{target}.app-dir`（服务器上的仓库目录）。连接与凭据的分层约定见 hact-conn skill。

**首次部署（`deployment.config` 不存在）**：先建 `deployment.config`，只填**命令侧**字段，commit 后继续：
```
build-command=
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

```
✅ 服务器构建完成。
→ {auto-restart=true 或非 prod：自动进入 Step 5 / prod 且 auto-restart=false：等待确认重启}
```

🚫 **仅当 `target=prod` 且 `auto-restart` 不是 `true` 时**，等用户确认重启。其余情况自动继续。

---

## Step 5：重启服务

执行 `deployment.config` 中的 `restart-command`（如 `pm2 restart {app}`）。

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
