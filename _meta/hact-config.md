# hact-app 全局配置

> 团队共用，提交进仓库。CC 在 init-project Step 5 时直接读取，无需向用户询问。

| 配置项 | 值 |
|--------|-----|
| hact-app 部署地址 | `http://47.110.94.114` |
| CC_TOKEN | `dev-cc-token-for-testing` |
| SSH server alias | `mail_ai` |

## SSH MCP 首次配置（每台机器做一次）

```bash
npm install -g mcp-ssh-manager
mcp-ssh-manager add
# 填入：alias=mail_ai, host=47.110.94.114, user=root, auth=password
```

配置完成后在 Claude Code MCP 设置中启用 mcp-ssh-manager 即可。
