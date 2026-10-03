# Gitee 仓库操作

本文只适用于目标为 Gitee 的 provider-specific 操作，**禁止对 Gitee 使用 `gh` CLI**（不支持 Gitee）。其他 provider 按各自工具与项目规则处理。
Gitee 的 PR、协作者等平台操作通过 PowerShell `Invoke-RestMethod` 调用 Gitee API v5。Git fetch / push / 同步使用 Git；多远端同步按 adopted Method 的 `protocols/git-truth.md` §8 枚举全部范围内远端，不能以本文的 Gitee 配置代替同步清单。

## 第一步：提取 owner / repo / token

```powershell
# 从连接配置选择当前 Gitee 平台操作的 remote，再获取 owner 和 repo
$giteeRemote = node scripts/check-conn.js get gitee.remote
if (-not $giteeRemote) { throw "未配置 gitee.remote，不能默认使用 origin" }
git remote get-url --all $giteeRemote
# 示例输出：https://gitee.com/your-name/mail-ai.git
# → owner = your-name，repo = mail-ai
# 确认 URL 确实属于 Gitee；多个 URL 指向不同仓库时先确定本次平台操作目标

# token 统一寻址：connections.yml → ~/.hact/secrets.env
$GITEE_TOKEN = node scripts/check-conn.js get gitee.token
if (-not $GITEE_TOKEN) { throw "凭据未配置，按 check-conn 的提示补 ~/.hact/secrets.env" }
```

## 常用操作

### 查看开放 PR 列表
```powershell
Invoke-RestMethod "https://gitee.com/api/v5/repos/{owner}/{repo}/pulls?access_token=$GITEE_TOKEN&state=open"
```

### 创建 PR
```powershell
$body = @{ access_token=$GITEE_TOKEN; title="PR标题"; head="feature-branch"; base="master"; body="PR描述" } | ConvertTo-Json
Invoke-RestMethod -Method POST "https://gitee.com/api/v5/repos/{owner}/{repo}/pulls" -ContentType "application/json" -Body $body
```

### 合并 PR
```powershell
$body = @{ access_token=$GITEE_TOKEN; merge_method="merge" } | ConvertTo-Json
Invoke-RestMethod -Method PUT "https://gitee.com/api/v5/repos/{owner}/{repo}/pulls/{number}/merge" -ContentType "application/json" -Body $body
```

### 查看分支列表
```powershell
Invoke-RestMethod "https://gitee.com/api/v5/repos/{owner}/{repo}/branches?access_token=$GITEE_TOKEN"
```

### 查看单条 PR
```powershell
Invoke-RestMethod "https://gitee.com/api/v5/repos/{owner}/{repo}/pulls/{number}?access_token=$GITEE_TOKEN"
```

## 规则

- owner/repo 从 `connections.yml` 的 `gitee.remote` 对应 URL 提取，确认目标为 Gitee；不硬编码 remote 名或默认选择 origin。此映射只选择 Gitee 平台操作目标，不限制 Git 同步范围
- token 走项目连接配置的统一寻址（`node scripts/check-conn.js get gitee.token`），**不读 `backend/.env`**——那是应用运行时配置，不是个人凭据的存放处
- merge_method：`merge`（保留历史）/ `squash`（合并为单提交）/ `rebase`
- 换 token 时只改机器本地 `~/.hact/secrets.env` 一处，本机所有项目同步生效

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| 401 Unauthorized | token 无效或未读到 | `node scripts/check-conn.js check --live` 实打验一次，失效则重新生成并更新 `~/.hact/secrets.env` |
| 404 Not Found | owner/repo 路径错误 | 用 `git remote get-url --all $giteeRemote` 重新确认本次 Gitee 目标 |
| 422 Unprocessable | head 分支不存在或已合并 | 先 `git branch -a` 确认分支名 |
| PR 已存在 | 重复创建同 head 的 PR | 先查列表确认是否已有开放 PR |
