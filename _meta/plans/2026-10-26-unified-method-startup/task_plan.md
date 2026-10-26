# 统一方法论入口与自动试升级

## 目标与授权

2026-10-26 用户同意进入方法论调整，并明确选择：项目启动发现更新时自动尝试升级，遇到项目定制冲突或验证失败时停止。本次仅修改 Method 仓，不分发项目、不 push、不 merge、不部署。日常继续 current-only schema，不新增兼容运行时。

基线：`e04aa858a8a43105f1a50c4388a3a5d29d0e3099`。候选分支：`codex/unified-method-startup-20261026`。

## 具体问题与最小方案

- 项目 source SHA 只有安装一致性意义，不发现官方更新，协作者容易各用不同版本。
- 复用官方 Accepted main 为唯一默认目标；保留 v2 manifest 的 source 作为实际安装回执和执行/审查固定依据。不新增 release branch、版本 registry、scheduler 或升级状态账。
- `--startup` 校验已安装版本并向官方查更新，精确取得 target；退出 3 表示主线须自动按 target 的 Guide 07 隔离准备、执行项目兼容性验证、应用同一候选，再开始工作。命令不冒充自动完成项目升级。
- 正在执行/审查的链不热更新；恢复核 manifest 与链是否一致。无证据证明不存在冲突写入时不升级。
- 安装器在首次写入前计算所有 ownership 决策，已知冲突保持零写入；不声称操作系统故障或磁盘错误下具备完整事务保证。
- 修改启动模板、Guide、Git Truth、init-project、ChatGPT runtime，保持同一口径。

## 审查报告依据及边界

用户提供 `20261026-independent-review.md`，报告绑定 candidate tree `68d97699cfa35cffaa4af8aafc9e57daebacd503`、base `bca870da15a317679276c3858ee86469a48bb95e`、Method `e04aa85`。METHOD-UPGRADE-F001 报告旧 checker 在同一真实链通过，新 checker 失败 7 项；疑点是 JSON 风格 YAML 列表解码及历史 round/final scope 行为变化。这是报告提供的已执行证据，本仓尚未独立取得该项目固定对象复跑，不能声明 finding 已关闭。本次将真实历史链兼容性纳入升级要求，不据报告建议自行修改项目或历史证据。

## 验证与交付

- 安装/启动 fixtures：当前、更新发现、原安装零改动、离线失败、ahead/diverged、安装漂移、后置冲突零写入。
- 现有 normalization 回归、current entry/path 检查、JS syntax 与 diff 检查。
- 隔离临时项目对官方远端做真实启动查询；不在业务项目触发升级。
- 固定本地候选交付，明确独审及真实业务项目升级未验证，不将机械验证等同全面采用通过。

## 待验证边界

真实项目的历史链回归及多协作者接续仍需逐仓授权和独立验证。候选尚未合并，不会改变官方入口；旧项目采用新入口需要一次迁移。中途更新提示不覆盖已经运行的旧会话，写入前一致性核对仍由主线执行。
