---
name: hact-conn
description: Use when a task needs an external connection or credential — Gitee token/PR operations, SSH to a deploy server, database or third-party API keys. Resolve them through connections.yml + ~/.hact/secrets.env; never read backend/.env, never hardcode, never ask the user for a token that is already registered.
---

# hact-conn · 连接与凭据统一寻址

## 分层（唯一约定）

| 住哪 | 装什么 | 入库？ |
|------|--------|--------|
| `{项目仓根}/connections.yml` | 连接坐标 + `${secret:NAME}` 引用 | ✅ 入库，**零机密** |
| `~/.hact/secrets.env` | `NAME=值`，全部项目共用 | ❌ **永不入库**，`chmod 600` |
| `{项目仓根}/deployment.config` | 构建 / 重启 / 健康检查命令 | ✅ 入库（那是项目命令，不是连接信息） |

一个凭据在一台机器上只有一份。`connections.yml` 是「本项目连到哪」的**单一真相源**——不再从 `backend/.env` 捞 token，不再向用户重复索要已登记的凭据。

## 三条调用方式

在**项目仓根目录**执行（脚本由 `init-project` 铺进 `scripts/`）：

```bash
node scripts/check-conn.js get gitee.token        # 取单值，机密已解析，stdout 干净可直接 $(...)
node scripts/check-conn.js env                    # 输出 export 语句，供 eval 一次性注入
node scripts/check-conn.js check [--live]         # 体检；--live 才真打 Gitee API 与 SSH
```

用 **Bash 工具**执行（PowerShell 下 `curl` 是别名、`$(...)` 语义不同）。取不到值时脚本退 1 并在 stderr 说明缺哪个 `NAME`、该往哪补——**照它说的补，不要改成硬编码或另找回退路径**。

项目仓里没有 `scripts/check-conn.js`（存量仓未铺）→ 直接跑本仓副本 `{hact-method-lab}/templates/scripts/check-conn.js check <项目根>`，并提示用户补铺。

## 命名约定

- **点分路径**：`gitee.token` / `ssh.prod.host` / `ssh.prod.app-dir` / `db.prod.password` / `api.<服务>.key`
- **机密 handle**：`HACT_` 前缀 + 全大写下划线，shell 安全，`secrets.env` 可直接 `source`。**分两类**——
  - **身份类**（跟人走，跨项目共用一份，轮换只改一处）：`HACT_GITEE_TOKEN` / `HACT_SSH_<别名>_PASSPHRASE`
  - **项目资源类**（跟项目走，**必须带项目前缀**）：`HACT_<项目名大写>_DB_PROD_PASSWORD` / `HACT_<项目名大写>_API_<服务>_KEY`
  - 前缀不是洁癖：`secrets.env` 是**全机共用的扁平命名空间**，两个项目各连各的库却都叫 `HACT_DB_PROD_PASSWORD`，后填的会**静默覆盖**先填的。`check` 对 `db.*` / `api.*` 下未带项目前缀的 handle 报 🧑
- **解析顺序**：进程环境变量 → `~/.hact/secrets.env` → 历史别名（`HACT_GITEE_TOKEN` 认 `GITEE_ACCESS_TOKEN`）

## 各站怎么用

| 站 | 取什么 |
|----|--------|
| `gitee-ops`（develop 自合并 / 人工 PR） | `get gitee.token`；owner/repo 仍从 `git remote get-url origin` 推 |
| `deploy` | 连接侧 `get ssh.prod.mcp-alias` / `ssh.prod.host` / `ssh.prod.app-dir`；命令侧仍读 `deployment.config` |
| `init-project` | Step 4 起先跑 `check`——已登记则**不再向用户索要 token**；未登记才收集一次并写进 `~/.hact/secrets.env`，随后各步复用 |
| 任何要连数据库 / 第三方 API 的任务 | `get db.<env>.password` / `get api.<服务>.key` |

## 红线

- **`connections.yml` 里出现任何真凭据 = 事故**。它入库，写进去即视为已泄露，必须轮换。`check` 会以 FAIL 拦住已知形态与机密语义字段的裸串
- **不把 `~/.hact` 放进任何 git 工作树或云同步盘里的仓库目录**。`check` 判 FAIL
- **不新建第三处存放**。缺字段就往 `connections.yml` 加，缺凭据就往 `secrets.env` 加

## 换机 / 新成员上机

1. 拷 `~/.hact/secrets.env` 过去（纯文本，可直接复用），确认仅本账户可读
2. 另拷 `~/.ssh/` 下的私钥文件——**它不在 secrets.env 里**（那里只记路径与口令 handle）
3. 重配 Claude Code 的 SSH MCP server；alias 名照 `connections.yml` 的 `mcp-alias` 填
4. 在项目仓跑 `node scripts/check-conn.js check --live`，缺什么它说什么

## 排错

| 现象 | 原因 | 处理 |
|------|------|------|
| `解析不到值：HACT_xxx` | `secrets.env` 没这行 | 按提示补一行，值不加引号 |
| `明文机密` FAIL | 真凭据写进了 `connections.yml` | 挪进 `secrets.env`、改写 `${secret:NAME}`，并**轮换该凭据** |
| `凭据落位` FAIL | `~/.hact` 落在 git 工作树内 | 移出仓库目录 |
| `MCP alias 找不到` 🧑 | 新机未配 SSH MCP server | 按 `mcp-alias` 值补配；配置写法不同则忽略 |
| `--live` 下 Gitee 返回 401 | token 失效 / 过期 | Gitee → 设置 → 私人令牌 重新生成，更新 `secrets.env` 一处即可 |
| 值末尾被截断 | 在 `secrets.env` 里加了行内 `#` 注释 | 该文件不支持行内注释，整行 `#` 才是注释 |
