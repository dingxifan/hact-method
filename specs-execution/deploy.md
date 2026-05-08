# exec: deploy

> CC 加载本文时，当前任务是将已验收的代码部署到目标环境，验证服务正常。
> 默认合并部署：一次包含所有已验收改动（A 类迭代 + B 类 normal + hotfix）。

**上下文密度**：中。需读 `deployment.config`，执行若干 shell 命令，全程在主线操作，不派 subagent。

---

## 红线

- **禁止在服务器上直接修改代码**：唯一合法路径是本地修改 → `git push` → 服务器 `git pull`
- **构建失败不重启服务**：保留旧版本运行，记录错误上报，等修复后重走步骤
- **健康检查未通过不算完成**：服务重启成功不等于部署成功，必须健康检查通过才记录结果
- **hotfix 快速通道须有授权**：urgency=hotfix 的任务需有 `dispatch` discipline 用户授权后才能不等 G4 部署

---

## 步骤追踪协议

每步完成后输出：
```
✅ [步骤名] 完成：[2–3 句结论]
→ 下一步：[步骤名] — [一句说明]
继续？
```
🚫 标记处必须等用户明确回应后才继续。

---

## 会话启动

读任务包，确认：
- `target` 字段（目标环境，如 `prod` / `staging`）
- 触发来源（A 类 G4 已签 / B 类积累触发 / hotfix 授权）

**首次部署（`deployment.config` 不存在）**：先建 `deployment.config`，填入以下字段，commit 后继续：
```
server-address=
build-command=
health-check-url=
restart-command=
```

读 `deployment.config`，确认配置完整。

```
部署目标：{target}
包含内容：{A 类 vN / B 类 {task-id 列表} / hotfix {task-id}}
继续？
```

🚫 等用户确认部署范围

---

## Step 1：本地构建验证

执行 `deployment.config` 中的 `build-command`（如 `npm run build`）及类型检查。

**构建失败** → 立即阻断，输出完整错误日志，不进行后续步骤，等修复后重新开始。

```
✅ 本地构建验证通过。
→ 下一步：推送代码
继续？
```

---

## Step 2：推送代码

将所有待部署分支合并至主分支，推送到远端：
```bash
git push origin master
```

> hotfix 快速通道说明：Step 1（本地构建验证）对 hotfix 同样适用，不跳过。区别仅在于本步骤（Step 2）中只合并 hotfix 分支，不合并其他待部署分支。

**hotfix 快速通道**：仅合并 hotfix 分支，不合并其他未验收的改动。

---

## Step 3：服务器拉取

SSH 到服务器，执行：
```bash
git pull
```

确认拉取成功（无冲突 / 无报错）。

**拉取有冲突** → 解决冲突后重试，不强制覆盖。

---

## Step 4：服务器构建

执行 `deployment.config` 中的 `build-command`。

**构建失败** → 保留旧版本运行，**不执行 Step 5**，记录错误，上报，等修复后重走 Step 3–7。

```
✅ 服务器构建完成。
→ 下一步：重启服务
继续？
```

🚫 等用户确认重启

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

在 `deploy-log.md` **追加**（不覆盖）：

```markdown
## {YYYY-MM-DD HH:MM} · {target} · {部署人}
- 包含内容：{A 类 vN / B 类 {task-id 列表} / hotfix {task-id}}
- 构建结果：成功
- 健康检查：通过
- 备注：{有则填，无则省略}
```

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
2. 确认 staging 无异常后，再对 `prod` 执行 Step 3–7（本地构建 Step 1–2 无需重复）
3. 每个环境独立验证，staging 失败不推进 prod

**部署后发现功能异常**：
- 立即走 `dispatch-new(target-source=bug, urgency=hotfix)` → develop → deploy 快速通道

---

## 上下文管理

deploy 通常单次会话完成，无需专门的断点续做文件。

**中断续做**：读 `deploy-log.md` 最后一条记录，判断中断在哪个步骤：
- 无新记录 → 从 Step 1 重新开始
- 有"构建结果：成功"但无"健康检查"结论 → 从 Step 6 继续
- 已有完整记录 → 任务已完成
