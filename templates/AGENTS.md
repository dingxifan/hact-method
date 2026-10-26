# {项目名}

{一句话描述项目用途}

## 工作入口

项目工作默认在 Codex 中连续完成需求澄清、设计、规划、执行与验证，ChatGPT Work 按需使用；用户决定与 Authority 不因入口改变。主线开始新的工作前先运行 `node ../hact-method-lab/scripts/sync-method.cjs --startup --root .`，向官方 main 核对更新。返回 current 后，以 `--read templates/boot-protocol.md --root .` 读取实际安装版本。返回 upgrade-required（退出码 3）时，按输出 target 对应的 `guide/07-同步方法论.md` 自动在隔离候选中尝试升级，验证通过再应用；项目定制冲突、验证失败或无法确认官方版本时停止并报告，不反复索取普通升级许可。用 `git -C ../hact-method-lab show <target>:guide/07-同步方法论.md` 读取本次固定目标的升级说明。Task/Protocol/Runtime 与项目检查器必须同源；source SHA 用于记录实际采用结果和固定审查依据，不再由各协作者自行选择日常版本。

已有 Task 的执行/审查链恢复、委派与复审沿用已固定 Method，不在中途自动升级；先核项目 manifest 与该链的 Method 是否一致，存在不一致时停止协调。新工作入口统一检查更新；已启动的协作者不会被新版本发布自动热切换。

项目完整采用 current schema，缺失或不匹配 fail closed；旧项目先在 Core 外按 `guide/08-旧项目全面接入新版.md` normalization，不混读旧入口或增加兼容豁免。进入任务后按 Git truth、state 与 recovery evidence 接续，用户补充条件或询问进度不重跑启动、不清空有效授权。

真实跨入口交接绑定 `BASE_SHA`，长正文走文件及短 Execution Brief / Packet，结果以 immutable `RESULT_SHA` 回读。Codex 直接任务不额外制作交接或回传材料；Sprint Develop 由当前入口确定有界窗口并实际激活 Goal，Codex 内直接建立，跨入口才按 `runtime/chatgpt.md` §3 交 Packet。Task 范围见 `tasks/develop.md` §5.9；窗口完成后核 Git truth 决定下一已授权窗口，不自行跨 scope，Packet/Wave/window 不成为持久对象。

## 自主执行与边界

- 分析/评审请求先检查报告；明确目标在已授权范围内连续完成工程、验证、独审、整改与 Git delivery。普通困难不返回 ChatGPT、不要求实施前二选一；具体执行与提前返回条件按 `runtime/codex.md` §5。
- Codex 可提出并讨论候选产品或核心技术方案；普通工程决策在 Accepted Truth、Contract 与已有授权内完成，候选不得自行成为 Human Approval 或改写已批准 Contract。必要 Human Authority 在当前 interaction 请求；范围取舍、生产/外部效果及不可逆操作按既有边界，用户停止与系统安全/预算控制优先。
- 保留无关改动，按 Task/共享资产确定写集；共享工作树、索引、数据库或端口的冲突写入须串行或隔离。压缩恢复先核实际状态再继续，不用聊天摘要覆盖契约与证据。

## 委派与独立审查

主线可直接实现，只对独立且足够大、有收益的工作委派，不按文件数派发。委派单元直接执行 brief，不重复启动/同步/认领，不修改 Gate/status；子代理不自动拥有独立工作树。

Task 要求独审时按 `protocols/review.md` 使用固定 snapshot、Fresh Isolated Context 和同源投影；实现方式按需读 `runtime/codex.md` §7。复审沿用 finding id、snapshot 与有效 evidence，不因换 session/agent 清零；活跃单元不重复派发。

## 验证与交付

执行当前 Contract 必需的目标回归与集成验证；相同 snapshot/依赖/配置/环境下有效证据可复用，仅新改动、失败或具体疑点扩验。区分未运行、失败和通过，不能以声明代替独审、真实用户路径或安全验证。

仓库能力按 `boot-protocol.md` 选择：当前 provider 有授权 native write 时可使用，需要 test/hook/worktree/build 证据时回真实本地。Gitee 操作读 `gitee-ops.md`，连接读 `connections.yml` 与 `scripts/check-conn.js`。按实际动作核浏览器/SSH/托管/审查能力；失败先排可恢复原因，达既有恢复上限或需取舍才暂停。Dropbox/Watcher 已退出执行路径。

Git 同步未限定目标时按 `protocols/git-truth.md` §8 处理枚举的全部远端及实际 push 目标，逐目标核验并列未完成项；不以 origin/upstream 代替清单。明确限定范围或禁止写入的目标遵守实际授权。
