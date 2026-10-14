# {项目名}

{一句话描述项目用途}

## 工作入口

ChatGPT 承担 reasoning、design、document authoring 与 acceptance judgement，Codex 是 repository execution environment。主线首次处理任务先由 Codex 运行 `node ../hact-method-lab/scripts/sync-method.cjs --runtime-check --root .`，再以 `--read templates/boot-protocol.md --root .` 读取已采用 SHA 的入口。Task/Protocol/Runtime 都读同一 adopted SHA，检查器使用项目 `scripts/` 副本。

项目完整采用 current schema，缺失或不匹配 fail closed；旧项目先在 Core 外按 `guide/08-旧项目全面接入新版.md` normalization，不混读旧入口或增加兼容豁免。进入任务后按 Git truth、state 与 recovery evidence 接续，用户补充条件或询问进度不重跑启动、不清空有效授权。

人工交接绑定 `BASE_SHA`，长正文走文件。Sprint Develop 先激活 ChatGPT 生成的当前窗口 Goal，再交 Packet；格式见 `runtime/chatgpt.md` §3，Task 范围见 `tasks/develop.md` §5.9。完成后返回 immutable `RESULT_SHA` 与有用结果，Owner 回读 Git truth；Packet/Wave/window 不成为持久对象。

## 自主执行与边界

- 分析/评审请求先检查报告；明确目标在已授权范围内连续完成工程、验证、独审、整改与 Git delivery。普通困难不返回 ChatGPT、不要求实施前二选一；具体执行与提前返回条件按 `runtime/codex.md` §5。
- 普通工程决策由 Codex 完成，不发明无法从 Accepted Truth 与 Contract 推导的产品或核心技术语义。必要 Human Authority 在当前 interaction 请求；范围取舍、生产/外部效果及不可逆操作按既有边界，用户停止与系统安全/预算控制优先。
- 保留无关改动，按 Task/共享资产确定写集；共享工作树、索引、数据库或端口的冲突写入须串行或隔离。压缩恢复先核实际状态再继续，不用聊天摘要覆盖契约与证据。

## 委派与独立审查

主线可直接实现，只对独立且足够大、有收益的工作委派，不按文件数派发。委派单元直接执行 brief，不重复启动/同步/认领，不修改 Gate/status；子代理不自动拥有独立工作树。

Task 要求独审时按 `protocols/review.md` 使用固定 snapshot、Fresh Isolated Context 和同源投影；实现方式按需读 `runtime/codex.md` §7。复审沿用 finding id、snapshot 与有效 evidence，不因换 session/agent 清零；活跃单元不重复派发。

## 验证与交付

执行当前 Contract 必需的目标回归与集成验证；相同 snapshot/依赖/配置/环境下有效证据可复用，仅新改动、失败或具体疑点扩验。区分未运行、失败和通过，不能以声明代替独审、真实用户路径或安全验证。

仓库能力按 `boot-protocol.md` 选择：当前 provider 有授权 native write 时可使用，需要 test/hook/worktree/build 证据时回真实本地。Gitee 操作读 `gitee-ops.md`，连接读 `connections.yml` 与 `scripts/check-conn.js`。按实际动作核浏览器/SSH/托管/审查能力；失败先排可恢复原因，达既有恢复上限或需取舍才暂停。Dropbox/Watcher 已退出执行路径。

Git 同步未限定目标时按 `protocols/git-truth.md` §8 处理枚举的全部远端及实际 push 目标，逐目标核验并列未完成项；不以 origin/upstream 代替清单。明确限定范围或禁止写入的目标遵守实际授权。
