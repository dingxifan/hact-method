# Gitee 仓库操作

本项目远端为 Gitee，**禁止使用 `gh` CLI**（不支持 Gitee）。
所有仓库操作通过 `curl` 调用 Gitee API v5。

## 第一步：提取 owner / repo / token

```powershell
# 从 git remote 获取 owner 和 repo
git remote get-url origin
# 示例输出：https://gitee.com/your-name/hact-app.git
# → owner = your-name，repo = hact-app

# 从 backend/.env 读取 token
$GITEE_TOKEN = (Get-Content backend/.env | Select-String "GITEE_ACCESS_TOKEN").ToString().Split("=")[1].Trim()
```

## 常用操作

### 查看开放 PR 列表
```powershell
curl "https://gitee.com/api/v5/repos/{owner}/{repo}/pulls?access_token=$GITEE_TOKEN&state=open"
```

### 创建 PR
```powershell
curl -X POST https://gitee.com/api/v5/repos/{owner}/{repo}/pulls `
  -H "Content-Type: application/json" `
  -d "{`"access_token`":`"$GITEE_TOKEN`",`"title`":`"PR标题`",`"head`":`"feature-branch`",`"base`":`"master`",`"body`":`"PR描述`"}"
```

### 合并 PR
```powershell
curl -X PUT https://gitee.com/api/v5/repos/{owner}/{repo}/pulls/{number}/merge `
  -H "Content-Type: application/json" `
  -d "{`"access_token`":`"$GITEE_TOKEN`",`"merge_method`":`"merge`"}"
```

### 查看分支列表
```powershell
curl "https://gitee.com/api/v5/repos/{owner}/{repo}/branches?access_token=$GITEE_TOKEN"
```

### 查看单条 PR
```powershell
curl "https://gitee.com/api/v5/repos/{owner}/{repo}/pulls/{number}?access_token=$GITEE_TOKEN"
```

## 规则

- owner/repo 从 `git remote get-url origin` 提取，不要硬编码
- token 从项目根目录 `.env` 的 `GITEE_ACCESS_TOKEN` 字段读取
- merge_method：`merge`（保留历史）/ `squash`（合并为单提交）/ `rebase`

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| 401 Unauthorized | token 无效或未读到 | 检查 `.env` 中 `GITEE_ACCESS_TOKEN` |
| 404 Not Found | owner/repo 路径错误 | 用 `git remote get-url origin` 重新确认 |
| 422 Unprocessable | head 分支不存在或已合并 | 先 `git branch -a` 确认分支名 |
| PR 已存在 | 重复创建同 head 的 PR | 先查列表确认是否已有开放 PR |
