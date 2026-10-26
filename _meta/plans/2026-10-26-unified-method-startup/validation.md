# 验证记录

2026-10-26，本地候选，基线 `e04aa858a8a43105f1a50c4388a3a5d29d0e3099`。

## 已执行

- `node scripts/sync-method.test.cjs`：PASS。包括新版本发现、发现过程项目零改动、官方一致、不可访问远端失败、ahead/diverged 拒绝、安装漂移拒绝、后置定制冲突首次写入前拒绝，以及既有 ownership/retirement 回归。
- `node legacy-migration/normalize-legacy-project.test.cjs`：PASS。
- `node scripts/check-current-entry.js`：PASS。
- `node scripts/check-current-entry.test.js`：PASS。
- `node scripts/check-paths.js`：PASS，120 个运行时文件，无绝对路径命中。
- `node --check scripts/sync-method.cjs`：PASS。
- `git diff --check`：PASS。
- 真实远端启动探针：在系统临时目录新建独立 Git 项目，安装官方 `e04aa85`，调用 `startup` 查询真实官方 GitHub main。返回 `current`，installed/target 均为完整 `e04aa858a8a43105f1a50c4388a3a5d29d0e3099`，查询前后项目状态完全一致。临时目录已删除。未访问业务项目。

## 明确未完成

- 没有 fresh independent review，不将实现者自检称为独审。
- 没有真实业务项目自动隔离升级、应用、跨协作者接续的端到端证明。
- 用户报告 METHOD-UPGRADE-F001 的固定项目 Git objects/实际链未在本次取得或复跑；没有关闭该 finding，也未修改 checker 解析与 scope 行为。
- 自动升级由主线 Codex 执行 Guide 07，不是启动命令直接自动覆盖文件；命令退出 3 是升级待执行信号，不能当成成功。
- 没有 push、merge、项目分发、部署、Gate/status 项目状态修改。

上述限制不由 fixtures 或真实远端查询 PASS 抵销；候选用于进一步审查，尚不能宣布已全面采用。

## 后续修订：历史兼容与未来规则

以下是 0244f61 之后的增量验证，原阶段记录保留原义。

- `check-sprint.review.test.js`：PASS。新增 JSON 列表与 rejected→删除修复的真实 Git 两轮链正例，旧报告字节不改；最终候选越界、伪造历史 diff hash、未闭合 finding 的负例继续失败。退役额外字段可忽略，不恢复旧机制。
- `check-sprint.ready.test.js`：PASS。无关已完成重复历史不影响 ready/wave-ready；当前任务或其依赖重复仍拒绝。
- `check-sprint.staged-scope.test.js`：PASS，29 个 Git 正反夹具；增加未变历史重复与被当前任务依赖引用的对照，新造重复仍拒绝。
- `check-sprint.governance-plane.test.js`、`check-sprint.worktree.test.js`：PASS。
- `normalize-legacy-project.test.cjs`、`sync-method.test.cjs`：PASS。历史重复保留诊断，不阻断安装，status.yml 前后字节一致；安装来源/所有权检查不放宽。
- current-entry、其回归、path、JS syntax、staged diff 检查：PASS。
- 首次独立复审 tree `8226827aca0f620b4b4287220f32cbb6446e9bb5`：独立复现确认 F001 合成四组场景均 PASS，但发现 UPGRADE-COMPAT-F001：ready/wave-ready/staged 的全表重复身份阻断与新契约矛盾。已形成修复 tree `970f43c068a6b5d097dc4a0a73a6f913e00854f2`，沿同 finding 复审，不改写首次结论。
- 真实 `loxson_salary_new` 固定 candidate/base objects 仍未取得；原项目 METHOD-UPGRADE-F001 保持 open，不以合成夹具或 Method 层修复结论关闭。
- 第二次定向独审 tree `970f43c068a6b5d097dc4a0a73a6f913e00854f2`：PASS，关闭本候选 UPGRADE-COMPAT-F001。独立 ready、staged 29 个及额外修改既有重复记录/触碰历史任务包反例全部通过；新增重复身份拒绝测试通过。结果见同目录两份 immutable review 记录。
