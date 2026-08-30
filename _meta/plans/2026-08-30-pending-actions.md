# 2026-08-30 待办清单（用户逐项处理，处理完回报）

> 本轮会话查出但**需用户执行**的事项。方法论侧的改动已全部完成并推送；此处只列人工动作。
> 处理完一项，在对应行打勾并注明日期。

---

## A. 凭据轮换 🔴 最高优先

**改文件挽回不了已入库的历史——只有轮换。** 以下均已 commit、远端可见，6 个仓可读（团队 8 人有开发者权限）。

| # | 凭据 | 位置 | 备注 |
|:-:|---|---|---|
| A1 | **服务器 SSH 密码** | `mail-ai/docs/deployment-manual.md:16` | ⚠️ **check-secrets 扫不到**（不在 `~/.hact/secrets.env`）。由 develop 独审 scope-and-secrets 维度抓到，记录见 `mail-ai/backlog.md`（`mail-b-026-F003`） |
| A2 | **MySQL root 密码** | `mail-ai/docs/deployment-manual.md:86` | 同上，同一盲区 |
| A3 | **Supabase service role key**（全权限） | `jhh-noriton/scripts/perf-test.mjs` | 全权限密钥，可绕过 RLS |
| A4 | mail-ai `DB_PASSWORD` | `docs/deployment-manual.md`、`b-reviews/mail-b-026/round-01.md` | |
| A5 | mail-ai `JWT_SECRET` | `docs/deployment-manual.md`、`docs/security-findings.md` | 讽刺：一份安全文档里 |
| A6 | mail-ai `ENCRYPT_KEY` | `docs/deployment-manual.md` | |
| A7 | mail-ai `FEISHU_APP_SECRET` | `docs/deployment-manual.md` | |
| A8 | mail-ai `AI_API_KEY` | `docs/deployment-manual.md` | |
| A9 | mail-ai `SYSTEM_SMTP_PASSWORD`（`sting@loxson.com`） | **12 处**，源头是 `hact-method-lab/templates/standards/backend-nestjs.md` 的 dotenv 踩坑示例，随模板复制扩散 | 存在 **114 天**（2026-05-08 起） |
| A10 | org-krm-v2 `DB_PASSWORD` | 6 处 standards + `db/inject/run.js`、`_meta/seed_guanwu.js` | |
| A11 | org-krm-v2 `JWT_SECRET` | `docs/deployment-manual.md`（在 mail-ai 仓里）、`docs/security-findings.md` | 跨仓泄露 |

**轮换后要改三处**：① `~/.hact/secrets.env`（本机唯一真相源）② 服务器上对应的 `.env` / `ecosystem.config.cjs` ③ 重启相关服务。

> ⚠️ **A1/A2 说明我的扫描是下限不是全集**：`check-secrets.js` 只能发现「本机 `~/.hact/secrets.env` 里持有的」凭据，持有面之外一片黑。轮换时建议连带人工过一遍 `docs/`、`standards-*.md`、`.env.example`、`*.js`。

---

## B. 清理泄露文件（**轮换之后**再做）

16 个文件，全部已跟踪入库：

```
hact-method-lab/templates/standards/backend-nestjs.md   ← 扩散源头
document-extraction/apps/api/.env.example
document-extraction/standards-backend.md
jhh-noriton/scripts/perf-test.mjs
mail-ai/docs/deployment-manual.md                        ← 一个文件 8 条凭据
mail-ai/docs/security-findings.md
mail-ai/b-reviews/mail-b-026/round-01.md
mail-ai/iterations/v5/standards-backend.md
org-krm-v2/db/inject/run.js
org-krm-v2/_meta/seed_guanwu.js
org-krm-v2/standards-backend.md
org-krm-v2/iterations/v1/standards-shared.md
org-krm-v2/iterations/v{2,3,4,5}/standards-backend.md
```

真值一律换成明显的假占位（如 `<your-password>`）。清完跑一次 `node scripts/check-secrets.js --all` 复验。

---

## C. Gitee 旧 token 吊销

新 token 已轮换、六仓 `check --live` 验通（`~/.hact/secrets.env` 是唯一存放处，Windows 环境变量副本已删）。**旧 token 尚未在 Gitee 后台吊销。**

> 时机：等各会话都同步完再吊销。已在跑的会话进程环境里可能还残留旧值，此刻吊销会让它们断在推 PR 上。

---

## D. `check-secrets.js` 新版分发六仓

六仓装的是旧版，绿色时打印「✅ 未发现真凭据被写入文件」（全集口吻，容易被误读为"本仓无泄露"）。新版带限定语。

- 该文件是**纯新增、无仓级定制，直接覆盖安全**
- ⚠️ `pre-commit-hook.sh` **不能这样覆盖**（各仓有自有检查：file-extract 的架构墙、org-krm-v2 的 NODE_BIN 回退）
- 分发须走**临时 worktree 到 master**，不得在目标仓主工作树里操作
- 建议等当前这批 develop 会话（mail-ai / file-extract / awuchi）跑完再批量做

---

## E. 运维

| # | 事项 | 说明 |
|:-:|---|---|
| E1 | `jhh-nortion-frontend` pm2 改造 | 657 次重启根因已查明：`.next` 缺失导致启动即退出的紧密循环（574 次「Could not find a production build」+ 17 次 EADDRINUSE）。已属历史，但配置隐患仍在：去掉 `bash -c "npx next start"` 包装（pm2 监管的是 bash 不是真进程）、加 `--max-restarts 5 --restart-delay 5000` |
| E2 | 装 `pm2-logrotate` | `/var/log` 6.7G 的主因之一。`mail-ai/backend-out-1.log` 已 579M 未轮转 |
| E3 | `/var/log` 清理 | journal 4.0G（**未配任何上限**）+ syslog 系列 2.2G。命令见本轮对话 |
| E4 | 服务器 `:80` 现为空 | hact-app 下线后没有 `default_server`，`http://47.110.94.114/` 拒绝连接。需要落点则另配 |
| E5 | `112.124.32.216` 与 `47.110.94.114` 的关系已登记 | 前者只跑 mail-ai 的 ONLYOFFICE 容器，已写入 `mail-ai/connections.yml` 的 `ssh.onlyoffice` 段 |

---

## 已完成（不需处理，仅备查）

- hact-app 全面下线：systemd 单元删除 + pm2 移除 + nginx 站点移除 + MySQL `hact_app` 库 DROP + `/var/www/hact-app` 删除（437M）
- doc-extract 停机并清理：pm2 移除 + PG `doc_extract` 库删除 + 文件删除
- `/var/www/projects` 22 个他人项目检出清空（1.3G），5 个有未推送提交的已打 bundle 验证
- 备份全在 `/root/decommission-backup-20260830-142750/`（313M），每份都做过**真恢复验证**
- 本机 `loxson-ry` / `loxson-salary-new` 移除
