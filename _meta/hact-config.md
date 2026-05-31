# hact-app 全局配置

> 团队共用，提交进仓库。CC 在 init-project Step 5 时直接读取，无需向用户询问。

| 配置项 | 值 |
|--------|-----|
| hact-app 部署地址 | `http://47.110.94.114` |
| CC_TOKEN | `dev-cc-token-for-testing` |
| notes-org（个人积累仓所在 Gitee 组织） | _（待填，如 `your-team`；harvest-notes / init-project Step4.5 用）_ |

---

## 成员个人积累仓登记表

> 由 `init-project`（或成员上线时）登记；`harvest-notes` 遍历此表收割。管理者对这些仓只读。

| 成员（git user.name） | notes 仓地址 | 本地路径 |
|---|---|---|
| _（示例）dingxifan_ | _gitee.com/dingxifan/hact-notes-dingxifan_ | _E:\group-code\hact-notes-dingxifan_ |

---

## harvest-notes 收割游标

> `harvest-notes` 每次收割后推进。记录"上次收割到的点"，下次只看新增条目，避免重复上提。不回写成员仓。

| 成员 | 上次收割点（commit / 时间戳） | 上次收割条目数 |
|---|---|---|
| _（示例）dingxifan_ | _—（尚未收割）_ | _0_ |
