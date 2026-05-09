---
name: gitee-ops
description: Use when performing repository operations on Gitee remotes — creating PRs, merging PRs, querying branches, or any action that would require gh CLI on GitHub. Never use gh CLI with Gitee.
---

# Gitee Repository Operations

## Overview

Gitee 与 GitHub 不兼容，`gh` CLI 无法用于 Gitee 仓库。所有 HTTP 调用**必须用 Bash 工具执行**（Windows PowerShell 的 `curl` 是 `Invoke-WebRequest` 别名，行为不同；Bash 工具里的 `curl` 是真实 curl，无此问题）。

## 准备：提取 owner / repo / token

**用 Bash 工具执行以下命令**（一次性，后续步骤复用变量）：

```bash
# 从 git remote 提取 owner 和 repo
REMOTE=$(git remote get-url origin)
# 示例输出：https://gitee.com/dingxifan/hact-app.git
OWNER=$(echo $REMOTE | sed 's|https://gitee.com/||' | cut -d/ -f1)
REPO=$(echo $REMOTE | sed 's|.*/||' | sed 's|\.git||')

# 从 backend/.env 读取 token（在项目根目录执行）
GITEE_TOKEN=$(grep GITEE_ACCESS_TOKEN backend/.env | cut -d= -f2 | tr -d '\r\n ')

echo "owner=$OWNER repo=$REPO token_len=${#GITEE_TOKEN}"
```

确认 token_len=32 且 owner/repo 正确后继续。

## 常用操作

> 以下所有命令均用 **Bash 工具**执行，在同一 Bash 命令中读取变量再调用 curl。

### 查看开放 PR 列表

```bash
GITEE_TOKEN=$(grep GITEE_ACCESS_TOKEN backend/.env | cut -d= -f2 | tr -d '\r\n ')
REMOTE=$(git remote get-url origin)
OWNER=$(echo $REMOTE | sed 's|https://gitee.com/||' | cut -d/ -f1)
REPO=$(echo $REMOTE | sed 's|.*/||' | sed 's|\.git||')

curl -s "https://gitee.com/api/v5/repos/$OWNER/$REPO/pulls?access_token=$GITEE_TOKEN&state=open" \
  | python3 -c "
import json,sys
prs=json.load(sys.stdin)
for p in prs: print(f'PR #{p[\"number\"]} [{p[\"head\"][\"label\"]}] → {p[\"base\"][\"label\"]}: {p[\"title\"][:60]}')
"
```

### 创建 PR

```bash
GITEE_TOKEN=$(grep GITEE_ACCESS_TOKEN backend/.env | cut -d= -f2 | tr -d '\r\n ')
REMOTE=$(git remote get-url origin)
OWNER=$(echo $REMOTE | sed 's|https://gitee.com/||' | cut -d/ -f1)
REPO=$(echo $REMOTE | sed 's|.*/||' | sed 's|\.git||')

curl -s -X POST "https://gitee.com/api/v5/repos/$OWNER/$REPO/pulls" \
  -H "Content-Type: application/json" \
  -d "{
    \"access_token\": \"$GITEE_TOKEN\",
    \"title\": \"PR 标题\",
    \"head\": \"feature-branch\",
    \"base\": \"master\",
    \"body\": \"PR 描述\"
  }" | python3 -c "import json,sys; p=json.load(sys.stdin); print(f'PR #{p[\"number\"]}: {p[\"html_url\"]}')"
```

### 合并 PR

```bash
GITEE_TOKEN=$(grep GITEE_ACCESS_TOKEN backend/.env | cut -d= -f2 | tr -d '\r\n ')
REMOTE=$(git remote get-url origin)
OWNER=$(echo $REMOTE | sed 's|https://gitee.com/||' | cut -d/ -f1)
REPO=$(echo $REMOTE | sed 's|.*/||' | sed 's|\.git||')
PR_NUMBER=17   # 替换为实际 PR 号

curl -s -X PUT "https://gitee.com/api/v5/repos/$OWNER/$REPO/pulls/$PR_NUMBER/merge" \
  -H "Content-Type: application/json" \
  -d "{
    \"access_token\": \"$GITEE_TOKEN\",
    \"merge_method\": \"merge\"
  }" && echo "PR #$PR_NUMBER 已合并"
```

### 查看单条 PR 详情

```bash
GITEE_TOKEN=$(grep GITEE_ACCESS_TOKEN backend/.env | cut -d= -f2 | tr -d '\r\n ')
REMOTE=$(git remote get-url origin)
OWNER=$(echo $REMOTE | sed 's|https://gitee.com/||' | cut -d/ -f1)
REPO=$(echo $REMOTE | sed 's|.*/||' | sed 's|\.git||')

curl -s "https://gitee.com/api/v5/repos/$OWNER/$REPO/pulls/{number}?access_token=$GITEE_TOKEN"
```

## 使用规则

- **绝不使用 `gh` CLI** — 它不支持 Gitee
- **所有 curl 调用用 Bash 工具**，不用 PowerShell（避免别名和 BOM 问题）
- token 从项目根目录的 `backend/.env` 读取 `GITEE_ACCESS_TOKEN` 字段
- owner / repo 从 `git remote get-url origin` 提取，不要硬编码
- API 根路径：`https://gitee.com/api/v5/`
- merge_method 可选值：`merge`（保留提交历史）/ `squash`（合并为单提交）/ `rebase`

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| 401 Unauthorized | token 错误或读取时带了多余空格/换行 | 确认 `tr -d '\r\n '` 已去除，重新读取 |
| 404 Not Found | owner/repo 路径错误 | 用 `git remote get-url origin` 重新确认 |
| 422 Unprocessable | head 分支不存在或已合并 | 先 `git branch -a` 确认分支名 |
| PR 已存在 | 重复创建 | 先查列表确认是否已有同 head 的开放 PR |
| JSON parse error | curl 返回了 HTML 错误页 | 去掉 python3 管道，直接看原始 curl 输出排查 |
