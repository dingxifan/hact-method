# Gitee 仓库操作

本项目远端为 Gitee，**禁止使用 `gh` CLI**（不支持 Gitee）。
所有仓库操作通过 PowerShell `Invoke-RestMethod` 调用 Gitee API v5。

## 第一步：提取 owner / repo / token

```powershell
# 从 git remote 获取 owner 和 repo
git remote get-url origin
# 示例输出：https://gitee.com/your-name/mail-ai.git
# → owner = your-name，repo = mail-ai

# token 统一寻址（见 hact-conn skill）：connections.yml → ~/.hact/secrets.env
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

- owner/repo 从 `git remote get-url origin` 提取，不要硬编码
- token 走 hact-conn 统一寻址（`node scripts/check-conn.js get gitee.token`），**不读 `backend/.env`**——那是应用运行时配置，不是个人凭据的存放处
- merge_method：`merge`（保留历史）/ `squash`（合并为单提交）/ `rebase`
- 换 token 时只改机器本地 `~/.hact/secrets.env` 一处，本机所有项目同步生效

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| 401 Unauthorized | token 无效或未读到 | `node scripts/check-conn.js check --live` 实打验一次，失效则重新生成并更新 `~/.hact/secrets.env` |
| 404 Not Found | owner/repo 路径错误 | 用 `git remote get-url origin` 重新确认 |
| 422 Unprocessable | head 分支不存在或已合并 | 先 `git branch -a` 确认分支名 |
| PR 已存在 | 重复创建同 head 的 PR | 先查列表确认是否已有开放 PR |
