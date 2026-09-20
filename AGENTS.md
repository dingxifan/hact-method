# hact-method-lab

本仓是方法论与项目模板的单一来源，不保存具体项目代码或项目数据。

开始方法论调整前：

1. 读取 `BRIEF.md`、`STATUS.md` 与 `_meta/.current_plan` 指向的计划文件。
2. 读取 `_meta/plans/方法论待议.md`，只把与当前改造直接相关的条目纳入范围。
3. 以 Codex 为唯一运行环境；项目入口在 `templates/AGENTS.md`，任务执行约定在 `specs-execution/`。修改职责时同步结构契约、模板与检查器，不维护 CC 兼容层。

保持相对路径；不覆盖项目仓的 hook 或存量配置。涉及多个项目仓的分发，需要逐仓确认并使用独立 worktree。

跨仓分发的临时 worktree 必须在收尾时回收，且**不等 PR 合并**：`git worktree remove` 只删除检出目录和登记，不删除分支或提交。已提交、推送且工作树干净的临时分发分支应立即执行 `git -C {项目仓} worktree remove {临时目录}`；不得手工删除目录。宣布分发完成前，必须同时确认该 worktree 不再出现在 `git worktree list --porcelain`，且目录不存在。任一项失败即为未收尾，应先处理权限或占用问题并在交接中列明。

仅未提交的在制品可以保留 worktree；名称必须带任务或分发批次标识，交接中列出路径、分支、未提交状态和下一位负责人。分支删除必须另获显式授权，不能随 worktree 回收执行。
