# exec: deploy

> CC 加载本文时，当前任务是将已验收代码部署到目标环境，验证服务正常。
> 默认合并部署：一次包含所有已验收改动（A 类迭代 + B 类 normal + hotfix）。

**上下文密度**：中。需读 `deployment.config` + 执行若干 shell 命令。

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
- 触发来源（A 类 G4 签字 / B 类积累 / hotfix 授权）

读 `deployment.config`（首次部署时不存在，见"边界场景"）。

```
部署目标：{target}
包含内容：{A 类 vN / B 类 {task-id 列表} / hotfix {task-id}}
继续？
```

🚫 等用户确认部署范围

---

## Step 1：本地构建验证

```bash
npm run build   # 或对应构建命令（见 deployment.config）
```

并执行类型检查（如 `npm run type-check`）。

**构建失败** → 立即阻断，输出错误日志，不进行后续步骤。等修复后重新开始。

```
✅ 本地构建验证通过。
→ 下一步：推送代码
继续？
```

---

## Step 2：推送代码

将所有待部署分支合并至主分支，push 到远端：
```bash
git push origin master
```

**hotfix 快速通道**（`urgency=hotfix`）：仅合并 hotfix 分支，不合并其他未验收改动。

---

## Step 3：服务器拉取

通过 SSH 在服务器执行：
```bash
git pull
```

确认拉取成功（无冲突 / 无错误）。拉取失败 → 检查冲突原因，解决后重试。

---

## Step 4：服务器构建

执行 `deployment.config` 中的构建命令。

**构建失败** → 保留旧版本，**不重启服务**，记录错误，上报。等修复后重走步骤 3–7。

```
✅ 服务器构建完成。
→ 下一步：重启服务
继续？
```

🚫 等用户确认重启

---

## Step 5：重启服务

执行 `deployment.config` 中的重启命令（如 `pm2 restart {app}`）。

---

## Step 6：健康验证

curl 健康检查端点（见 `deployment.config`）：
```bash
curl -f {health-check-url}
```

检查服务日志（最近 50 行），确认无异常错误。

**健康检查失败** → 检查日志定位原因；无法快速修复则回滚至上一个成功版本。

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
→ 下一步：wrap-up-iteration（可并行执行，无强依赖）
```

---

## 边界场景

**首次部署（`deployment.config` 不存在）**：
1. 先建 `deployment.config`，填入：服务器地址 / 构建命令 / 健康检查端点 / 重启命令
2. commit 后继续 Step 1

**无服务器（纯静态 / Gitee Pages 等）**：
- 跳过 Step 3–6，替换为对应平台发布命令
- 健康验证改为访问页面确认

**多环境（staging 先于 prod）**：
- 按 `target` 依次执行完整流程
- 每个环境独立验证通过后再推进下一个

---

## 上下文管理

**中断续做**：
1. 读 `deploy-log.md` 确认最后一条记录的步骤
2. 读 `deployment.config` 确认配置
3. 从上次中断的步骤继续（Step 4 之后的步骤可重跑，不破坏幂等性）
