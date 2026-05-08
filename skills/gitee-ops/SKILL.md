---
name: gitee-ops
description: Use when performing repository operations on Gitee remotes — creating PRs, merging PRs, querying branches, or any action that would require gh CLI on GitHub. Never use gh CLI with Gitee.
---

# Gitee Repository Operations

## Overview

Gitee 与 GitHub 不兼容，`gh` CLI 无法用于 Gitee 仓库。所有仓库操作通过 `curl` 调用 Gitee API v5。

## 准备：提取 owner / repo / token

```bash
# 从 git remote 提取 owner 和 repo
git remote get-url origin
# 输出示例：https://gitee.com/dingxifan_admin/hact-app.git
# owner = dingxifan_admin，repo = hact-app

# 从项目 .env 读取 token（在项目根目录执行）
$env:GITEE_TOKEN = (Get-Content .env | Select-String "GITEE_ACCESS_TOKEN").ToString().Split("=")[1]
```

## 常用操作

### 查看开放 PR 列表
```bash
curl "https://gitee.com/api/v5/repos/{owner}/{repo}/pulls?access_token=$GITEE_TOKEN&state=open"
```

### 创建 PR
```bash
curl -X POST https://gitee.com/api/v5/repos/{owner}/{repo}/pulls `
  -H "Content-Type: application/json" `
  -d '{
    "access_token": "'"$GITEE_TOKEN"'",
    "title": "PR 标题",
    "head": "feature-branch",
    "base": "master",
    "body": "PR 描述"
  }'
```

### 合并 PR
```bash
curl -X PUT https://gitee.com/api/v5/repos/{owner}/{repo}/pulls/{number}/merge `
  -H "Content-Type: application/json" `
  -d '{
    "access_token": "'"$GITEE_TOKEN"'",
    "merge_method": "merge"
  }'
```

### 查看分支列表
```bash
curl "https://gitee.com/api/v5/repos/{owner}/{repo}/branches?access_token=$GITEE_TOKEN"
```

### 查看单条 PR 详情
```bash
curl "https://gitee.com/api/v5/repos/{owner}/{repo}/pulls/{number}?access_token=$GITEE_TOKEN"
```

## 使用规则

- **绝不使用 `gh` CLI** — 它不支持 Gitee
- owner / repo 从 `git remote get-url origin` 提取，不要硬编码
- token 从项目根目录 `.env` 的 `GITEE_ACCESS_TOKEN` 字段读取
- API 根路径：`https://gitee.com/api/v5/`
- merge_method 可选值：`merge`（保留提交历史）/ `squash`（合并为单提交）/ `rebase`

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| 401 Unauthorized | token 错误或未读到 | 检查 `.env` 中 `GITEE_ACCESS_TOKEN` 是否存在且有效 |
| 404 Not Found | owner/repo 路径错误 | 用 `git remote get-url origin` 重新确认 |
| 422 Unprocessable | head 分支不存在或已合并 | 先 `git branch -a` 确认分支名 |
| PR 已存在 | 重复创建 | 先查列表确认是否已有同 head 的开放 PR |
