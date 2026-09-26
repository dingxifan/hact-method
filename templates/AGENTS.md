# {项目名}

{一句话描述项目用途}

## 工作入口

ChatGPT 可承担 reasoning、design、document authoring 与 acceptance；Codex 是 repository execution environment。主线首次处理任务先由 Codex 运行 `node ../hact-method-lab/scripts/sync-method.cjs --runtime-check --root .`，再用该工具 `--read templates/boot-protocol.md --root .` 读取项目已采用 SHA 的入口。Task Contract、Shared Protocol、Runtime Adapter 与其他方法文件都必须从同一 adopted SHA 读取；检查器使用项目 `scripts/` 副本。

项目正常任务入口是 `tasks/`。项目必须完整采用当前 Method schema；缺失或不匹配时 fail closed，不混用旧入口、不添加兼容豁免。旧项目只在进入 Core 前按 Method `guide/08-旧项目全面接入新版.md` 完成一次性 normalization；完成后日常运行不再读取旧 schema。

已进入任务后按现有 Git truth、Task state 与 recovery evidence 接续；用户补充条件或询问进度不重跑启动、不清空已有授权。

ChatGPT → Codex 使用用户人工复制、带明确 `BASE_SHA` 的 bounded Execution Packet；Codex → ChatGPT 返回带 `RESULT_SHA` 的最小 Result Packet，ChatGPT / Owner 重新读取 Git truth 后判断。Packet 不注册、编号或持久化为 HACT 对象，不改变 Task/Gate/state/Authority。长文档和多文件内容走文件，Packet 只保留控制信息。委派单元直接执行收到的具体任务与 brief，不重复项目同步、任务路由或认领，不修改 Gate/status。下列边界对主线与委派单元都适用。

## 自主执行与边界

- 解释、分析、评审请求先检查并报告；修改请求在已授权范围内连续实现、验证、整改与收尾。已确认且前提未变的决定不重复询问。
- 业务/产品取舍、扩大范围、生产部署与真实外部副作用按用户授权处理；不可把自主执行解释成扩大权限。
- 保留无关改动；按当前 Task Contract 与共享资产确定写集。子代理不自动拥有独立工作树；共享文件、索引、数据库或端口的写操作不得并行冲突。
- 当前 Task 的权威契约、Accepted Project Truth、固定 Candidate 与可复现 evidence 高于聊天摘要。压缩/恢复后先核实际状态，再从未完成动作继续。

## 子代理与独立审查

主线可直接实现；仅对独立、足够大且有收益的工作使用 Codex 子代理，不能按文件数机械派发。

Task 要求 Independent Review 时，按 `protocols/review.md` 执行：使用固定 snapshot、Fresh Isolated Context 与 same-source reviewer projection。具体如何在当前 Codex 版本实现隔离、固定 Git snapshot 与 evidence capture，按需读取 `runtime/codex.md`；不要在本入口文件复制一套 review choreography。

复审继承既有 finding id、review snapshot 与有效 evidence，不因换 session / agent 自动从零开始。仍活跃的单元不重复派发。

## 验证与交付

只运行当前 Task Contract 要求的目标回归与必要集成验证；相同 snapshot、依赖、配置和环境上仍有效的结果可复用。有新改动、失败或具体疑点才扩大验证。未运行、未通过、已通过必须区分；独审、真实用户路径与必要安全验证不以声明代替。

仓库操作先按 `boot-protocol.md` 的 repository capability routing 选择路径：当前 remote/provider 有已授权 native repository-write 时可直接使用；需要测试、hook、worktree、build 等证据时必须回真实本地执行环境。Gitee 项目的 provider-specific 操作仍读取项目根 `gitee-ops.md`；连接读取 `connections.yml` 与 `scripts/check-conn.js`。Dropbox/Watcher 不在当前执行选项中。开始需浏览器/SSH/托管/审查的动作时才核对应能力；工具失败先判断可恢复原因，达到既有恢复上限或确需用户取舍才暂停。
