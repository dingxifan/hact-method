# 接续记录：gitee-ops token 全局化配置

## 目标
把 gitee-ops skill 的 `GITEE_ACCESS_TOKEN` 从"仅读 backend/.env"改为"优先读环境变量，无则回退读 backend/.env"，让用户可以用 shell profile 全局配置一次、不用每个项目仓单独放 backend/.env。

## 排查过程（本次会话已解决的坑，避免重复踩）
1. **双用户坑**：用户真实终端是 `administrator` 用户（uid 1000），CC 的 Bash 工具/gitee-ops skill 实际以 `claude` 用户（uid 1001）执行，两者 `$HOME` 和 profile 文件完全独立。`administrator` 的 `~/.bashrc` 改了对 `claude` 没用。administrator 有 sudo，claude 没有，所以用 `sudo -u claude bash -c '...'` 写入 `/home/claude/` 下的文件。
2. **`.bashrc` 交互性 guard 坑**：Ubuntu 默认 `~/.bashrc` 顶部有 `case $- in *i*) ;; *) return;; esac`，非交互 shell 会在这里直接 return，后面追加的 export 永远不执行。CC 的 Bash 工具跑的是非交互 shell（`$-` 里没有 `i`）。**结论：env var 要放 `~/.profile`，不能放 `~/.bashrc`。**
3. **会话环境快照坑**：实测证明，本会话内改 `~/.profile`/`~/.bashrc` 不会被本会话内后续命令读到——环境是会话/容器启动时一次性快照的，不是每条命令重新 source 一次 profile。**改完必须开一个全新会话才会生效**，这不是操作失败。

## 已完成
- 诊断出上述三层原因
- 已通过 `sudo -u claude` 把 export 写入过 `/home/claude/.bashrc`（后来发现该文件不生效，已清理掉这两行冗余 export）
- 提醒用户：会话中途意外在对话里贴过一次明文 token（`afb9932...`），已建议撤销重建；重建后的新 token 在写入 `.profile` 时同样没有经过对话（全程用 `sudo -u claude bash -c "echo ... >> /home/claude/.profile"` 由用户自己执行）

## 待办（已全部完成，本条目可视为收尾）
1. ~~确认用户是否已执行 sudo -u claude 写入~~ 已完成：`/home/claude/.profile` 里已确认存在 `GITEE_ACCESS_TOKEN` 这一行。
2. ~~验证 token_len~~ 已完成：新会话中 `echo "token_len=${#GITEE_ACCESS_TOKEN}"` 输出 32，符合预期。
3. ~~修改 SKILL.md~~ 已完成：`hact-method-lab/skills/gitee-ops/SKILL.md` 6 处 `GITEE_TOKEN=...` 赋值行全部替换为环境变量优先、回退 `backend/.env` 的写法；同步更新了行 23 注释和「使用规则」章节的说明。
4. PR 流程：用户确认不需要再走 PR（本次改动无需额外走 Gitee PR 流程）。

## 注意
- 本条目**不是** `.current_plan` 指向的正式方法论阶段任务，只是一次性 infra 配置的接续记录。未修改 `_meta/.current_plan`（它仍指向 `2026-06-29-foundation-walking-skeleton`，不要动）。
