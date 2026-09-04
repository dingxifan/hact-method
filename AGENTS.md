# hact-method-lab

本仓是方法论与项目模板的单一来源，不保存具体项目代码或项目数据。

开始方法论调整前：

1. 读取 `BRIEF.md`、`STATUS.md` 与 `_meta/.current_plan` 指向的计划文件。
2. 读取 `_meta/plans/方法论待议.md`，只把与当前改造直接相关的条目纳入范围。
3. 修改运行时中立正文时先读 `templates/runtime/interfaces.md`；实现细节只放 `templates/runtime/` 的映射表。

保持相对路径；不覆盖项目仓的 hook 或存量配置。涉及多个项目仓的分发，需要逐仓确认并使用独立 worktree。
