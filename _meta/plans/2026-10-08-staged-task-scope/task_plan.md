# 提交检查的任务范围修复

基线：`d17a3a8a6fb08d878be1330d6c6dc4cc4d8f41b6`。分支：`codex/fix-staged-task-scope`。

目标：兑现 BRIEF 已明确的“提交只审本次涉及任务证据，未变化历史不反复阻断”，保留 current-only 全量规划要求。用户已授权先修 Method 再继续业务实现；本执行单元仅修改 Method，不改项目 Task/Gate/status、不分发、不推送。

范围：`templates/scripts/check-sprint.js`、对应 Git 正反夹具、`tasks/plan-sprint.md` 的提交与全量验证区别。由 HEAD/index 重算任务及 AC 增量，不补造历史、不加兼容字段或豁免账。Method 原 current plan、STATUS 与旧计划不改写。

验证：未变历史包不重审 schema；触达包必须当前 schema；全量仍严格；状态变化/合并不避审；AC 新增/修改/删除及丢失覆盖、正向引用、全局共享资产/三方一致、工作树污染均用真实临时 Git 仓正反验证。复用既有依赖就绪与 review/foundation/Gate 夹具。业务项目只读复现。

边界：纯 PRD revise-doc 提交保留先文档、后级联规划的原路由；AC ID 不扩展新语法。原 checker 无独立循环依赖检测，本次不新增该机制，不将此项宣称为已通过。固定候选交主线独审后才能发布。

## 实现与验证结果

- `check-sprint.js` 的 staged scope 由 HEAD/index 推导；全量入口和 review/共享写集核心逻辑保留。新增/修改包、任务身份/依赖/生命周期变化触发当前 schema；原覆盖丢失与本次删除 AC 悬空引用也会失败。
- 9 组 `check-sprint.*.test.js` 全部通过：design-reference、foundation-carrier、governance-plane、ready、review、shared-assets、staged-scope、task-identity、worktree。其中 staged-scope 新增 20 个真实 Git 正反场景。
- `node scripts/check-current-entry.js`、`node scripts/check-paths.js`、`git diff --check` 通过。
- 真实项目 `../loxson-salary-new/.worktrees/reconcile-attendance-mail`，HEAD `ccefe9469c4624e6a65a8e2419da38421ffac88b` 的相同暂存候选：原项目 checker `--staged` 退出 1（5 通过 / 101 失败）；本候选模板 checker 退出 0（7 通过 / 0 失败）。仅只读检查，未修改该项目文件或索引。
- `check-gate.test.js` 未通过：Windows 夹具硬编码 `ProgramFiles/Git/bin/sh.exe`，本机该路径不存在，shell 语法检查 spawn 返回 null；调整测试进程安装根仍未找到相同布局，未修改测试或系统配置。9 组目标回归不因此冒充 Gate 集成通过，实际项目 hook/check-gate 由主线后续验证。
- 独立审查、Method 发布与项目采用尚未由本执行单元运行；提交候选交主线继续。不改 Gate/status/current-plan 指针，不推送、不合并。

## 首审整改（METHOD-SCOPE-F001 / F002 / F003）

首审固定候选 `e9baf5640616b9f04d4671dfa75d46604a3384b6` 为 BLOCK，原始 finding 保留在 `review-round-01.md`，本节不代替独立关闭结论。

- F001：未变活跃包仍必须 current schema。仅 HEAD/index 均已 merged、任务记录相同且包/记录未触达的完成历史退出 schema 重认证。回归包含 legacy 活跃同写失败、补当前 schema 后仍因无依赖失败、再补串行依赖通过。
- F002：覆盖前像读取 Git `--no-renames --diff-filter=MD`，包含被重命名的旧路径。真实 Git rename 失去唯一 AC 覆盖失败，合法改名保留覆盖通过。
- F003：活跃或新增 frontend 消费 backend 会重新触发条件 api-contract 检查，即使 backend 为未变完成历史。缺接口契约失败；既有合法接口可被消费而无需重审完整历史 schema/review。
- 定向 Git 回归扩至 24 场景并通过；真实业务暂存候选仍为 7 项通过 / 0 项失败。其他八组 checker 回归、当前入口、路径与 diff 格式检查复验全部通过。首审三个 finding 等待同一独审员 targeted re-review。
