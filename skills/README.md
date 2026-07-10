# skills/ · 本仓自带 skill 的安装方式

本目录存放方法论配套的 Claude Code skill 定义。**仓内存在 ≠ 已安装**——CC 只加载 `~/.claude/skills/`（用户级）或项目 `.claude/skills/`（项目级）下的 skill；不安装则会话中调用报 Unknown skill。

## 现有 skill

| skill | 用途 | 主要调用点 |
|-------|------|-----------|
| `adversarial-review` | commit 前独立对抗审查（只看 AC + diff） | B 类任务手动实现后、diff ≥ 15 行时（各项目 CLAUDE.md 约定） |
| `gitee-ops` | Gitee 远端 PR/分支操作，替代 gh CLI | develop 自合并、人工 PR 操作 |
| `verification-loop` | 构建/类型/lint/测试/安全/diff 六阶段机械验证 | 推 PR 前、联调前（pre-integration-check） |

## 推荐安装：用户级软链接

```bash
ln -s /path/to/hact-method-lab/skills/adversarial-review ~/.claude/skills/adversarial-review
ln -s /path/to/hact-method-lab/skills/gitee-ops          ~/.claude/skills/gitee-ops
ln -s /path/to/hact-method-lab/skills/verification-loop  ~/.claude/skills/verification-loop
```

选软链接而非拷贝的理由：
- **跨项目一次安装**：所有项目仓的 CC 会话共用，无需每仓重复；
- **随仓自动更新**：各项目会话启动 Step 0 会 `git pull` 本仓，skill 定义更新即时生效，无拷贝漂移。

实测（2026-07-10，macOS + CC）：软链接创建后 harness **热加载**，当前会话即出现在可用技能列表，无需重开会话；若个别环境不识别软链接，退化为 `cp -r` 拷贝安装（代价：本仓更新后需手动重拷）。

## 已知撞名核查

`verification-loop` 与 everything-claude-code 插件的同名 skill 同源（本仓版本为其中文精简 + 方法论适配：增加联调前触发点、无 test script 跳过不阻断）。实测该插件的同名本体**未注册**为可调用 skill（仅存在 `/verify` legacy shim），本仓版本可直接补位，无冲突。安装其他新 skill 前，建议先在会话可用技能列表中确认名字空缺。
