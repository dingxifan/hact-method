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
