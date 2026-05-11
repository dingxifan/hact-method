# exec: init-project

> CC 加载本文时，当前任务是为新项目创建独立仓库（代码 + 协调文件合并）。

**上下文密度**：低。机械化操作为主，单次会话可完整完成。
**执行位置**：hact-method 工作区；创建目标在 `E:\group-code\{name}\`。

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

开场说：「我将为新项目创建独立仓库（`E:\group-code\{name}\`），代码和协调文件合并存放。请确认项目名称（英文或拼音，kebab-case）——名称确认后不再更改。」

🚫 等用户给出项目名称

---

## 执行步骤

### Step 1：名称校验

检查 `E:\group-code\` 下是否已有同名目录。

- 有冲突 → 告知用户，请求重新命名，回到 🚫
- 无冲突 → 继续

```
✅ 名称校验通过：`E:\group-code\{name}\` 不存在冲突。
→ 下一步：创建目录结构
继续？
```

🚫 等用户确认

---

### Step 2：创建目录结构

```bash
mkdir -p "E:/group-code/{name}/iterations"
mkdir -p "E:/group-code/{name}/iterations/v1/queue/done"
mkdir -p "E:/group-code/{name}/_meta/input"
mkdir -p "E:/group-code/{name}/_meta/sessions"
```

---

### Step 3：写入占位文件

按 `specs-structural/init-project.md §主要产物` 写入各文件初始结构。每个文件写完确认内容正确，不留空文件：

- `project.md`
- `decisions.md`
- `design.md`
- `reusables.md`
- `backlog.md`
- `feedback.md`
- `b-tasks.md`

同时写入以下文件：
- `CLAUDE.md`：内容复制自 `E:\group-code\hact-method\templates\CLAUDE.md`，将 `{项目名}` 替换为实际项目名，`{一句话描述}` 留空待用户补充
- `.claude/commands/pic.md`：内容复制自 `E:\group-code\hact-method\templates\.claude\commands\pic.md`（slash command，输入 `/pic` 启动联调前全面检查）

---

### Step 4：Git 初始化 + 远端绑定

**4.1 本地初始化：**
```bash
cd "E:/group-code/{name}"
git init
git add .
git commit -m "feat: 初始化项目 {name}"
```

**4.2 强制获取 Gitee 远端地址：**

```
请提供项目的 Gitee 远端仓库地址（格式：https://gitee.com/{user}/{repo}.git）。
远端仓库需在 Gitee 上提前创建好（空仓库即可）。
```

🚫 等用户提供远端地址，**不得跳过**

**4.3 绑定远端并完成首次推送：**
```bash
git remote add origin {gitee-url}
git push -u origin master
```

推送成功后确认：
```
✅ 首次推送完成：{gitee-url}
```

推送失败（如仓库不存在或无权限）→ 提示用户先在 Gitee 创建仓库并确认权限，修复后重试。

**4.4 添加团队成员：**

```
请提供需要加入此项目的团队成员 Gitee 用户名（逗号分隔，如：zhangsan,lisi）。
无需添加成员则直接回车跳过。
```

🚫 等用户回应（可跳过）

有成员需要添加时，还需要 Gitee Personal Access Token 以调用 API：
```
请提供你的 Gitee Personal Access Token（在 Gitee → 设置 → 私人令牌 中生成，需有 projects 权限）。
Token 仅本次使用，不会写入任何文件。
```

从 `{gitee-url}` 中解析出 `{owner}` 和 `{repo}`，逐个添加成员（permission 默认 `push`）：

```bash
curl -X PUT "https://gitee.com/api/v5/repos/{owner}/{repo}/collaborators/{username}" \
  -d "access_token={token}&permission=push"
```

每个成员添加后确认响应状态，失败时报告原因（用户名不存在 / token 无权限等）。

```
✅ 成员添加完成：{zhangsan ✅ / lisi ✅ / ...}
```

---

### Step 5：注册到 hact-app + 配置 Gitee Webhook

**5.1 收集必要信息：**

```
请提供以下信息（均为一次性配置，后续项目无需重复）：
1. hact-app 部署地址（如 https://hact.example.com）
2. CC Token（服务器 .env 中的 CC_TOKEN 值）
```

若上述信息已在本次会话中提供，直接复用，不再重复询问。

🚫 等用户提供（可跳过整个 Step 5，跳过则在移交信息中注明"hact-app 注册待手动完成"）

**5.2 生成 webhook_secret：**

```bash
# 生成 32 位随机十六进制串
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

记录生成的值为 `{webhook_secret}`。

**5.3 在 hact-app 注册项目：**

从 `{gitee-url}` 中解析出 `{owner}` 和 `{repo}`，构造标准化 URL（去掉 `.git` 后缀）：

```bash
curl -s -X POST "{hact-app-url}/api/cc/projects" \
  -H "Authorization: Bearer {cc-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{name}",
    "gitee_repo_url": "https://gitee.com/{owner}/{repo}",
    "webhook_secret": "{webhook_secret}",
    "local_path": "E:\\group-code\\{name}",
    "cc_project_id": "{name}"
  }'
```

- 返回 `201` / 含 `id` 字段 → 注册成功，记录返回的 `project_id`
- 返回 `409`（`code: 3002`）→ 项目已存在，跳过，不报错
- 其他错误 → 报告给用户，此步骤标记为待手动完成

**5.4 在 Gitee 配置 Webhook：**

复用 Step 4.4 的 Gitee token（若未收集则此处补收）：

```bash
curl -s -X POST "https://gitee.com/api/v5/repos/{owner}/{repo}/hooks" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "{gitee-token}",
    "url": "{hact-app-url}/api/webhooks/gitee",
    "push_events": true,
    "token": "{webhook_secret}"
  }'
```

- 返回含 `id` 字段 → Webhook 配置成功
- 失败 → 报告原因（token 无权限 / 仓库不存在等）

```
✅ hact-app 注册完成：project_id={project_id}，Webhook 已配置。
→ 下一步：移交
继续？
```

🚫 等用户确认

---

### Step 6：移交

```
✅ init-project 完成：
- 本地仓库：E:\group-code\{name}\
- 远端：{gitee-url}
- hact-app：project_id={project_id}（或"待手动完成"）
→ 下一步：draft-prd-vN — A 类需求从产品阶段开始；B 类需求直接用 dispatch-new。
```

---

## Subagent 使用

无。全程使用 Write / Bash 工具直接执行。

---

## 断点续做

检查 `E:\group-code\{name}\` 目录是否存在及哪些文件已创建；从未完成的步骤继续。
