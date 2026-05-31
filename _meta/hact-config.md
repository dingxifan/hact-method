# hact-app 全局配置

> 团队共用，提交进仓库。CC 在 init-project Step 5 时直接读取，无需向用户询问。

| 配置项 | 值 |
|--------|-----|
| hact-app 部署地址 | `http://47.110.94.114` |
| CC_TOKEN | `dev-cc-token-for-testing` |
| notes-org（个人积累仓所在 Gitee 命名空间） | `dingxifan`（**Gitee 企业版**，企业全名"苏州立刻电子商务有限公司"，id=16378871）。⚠️ 是企业（enterprise）不是组织（org）：建仓用 `POST /enterprises/dingxifan/repos`，**不要**用 `/orgs/...`（会 404）。仓库地址形如 `gitee.com/dingxifan/hact-notes-{姓名}`。 |

---

## 成员个人积累仓登记表

> 由 `init-project`（或成员上线时）登记；`harvest-notes` 遍历此表收割。管理者对这些仓只读。

| 成员（login / 显示名） | notes 仓地址 | 本地路径 |
|---|---|---|
| dingxifan_admin（dingxifan·管理员） | gitee.com/dingxifan/hact-notes-dingxifan_admin | E:\group-code\hact-notes-dingxifan_admin |
| winniemw（Winnie） | gitee.com/dingxifan/hact-notes-winniemw | E:\group-code\hact-notes-winniemw |
| WayneLu（陆伟平） | gitee.com/dingxifan/hact-notes-WayneLu | E:\group-code\hact-notes-WayneLu |
| colin_zheng（郑磊） | gitee.com/dingxifan/hact-notes-colin_zheng | E:\group-code\hact-notes-colin_zheng |
| xiaobainote（XL） | gitee.com/dingxifan/hact-notes-xiaobainote | E:\group-code\hact-notes-xiaobainote |
| zhang_cheng_1377（张程） | gitee.com/dingxifan/hact-notes-zhang_cheng_1377 | E:\group-code\hact-notes-zhang_cheng_1377 |
| lu-ailu（陆爱露） | gitee.com/dingxifan/hact-notes-lu-ailu | E:\group-code\hact-notes-lu-ailu |
| ba-xiansheng（Jason） | gitee.com/dingxifan/hact-notes-ba-xiansheng | E:\group-code\hact-notes-ba-xiansheng |
| axiaoke（葛春林） | gitee.com/dingxifan/hact-notes-axiaoke | E:\group-code\hact-notes-axiaoke |

---

## harvest-notes 收割游标

> `harvest-notes` 每次收割后推进。记录"上次收割到的点"，下次只看新增条目，避免重复上提。不回写成员仓。

| 成员 | 上次收割点（commit / 时间戳） | 上次收割条目数 |
|---|---|---|
| dingxifan_admin | —（尚未收割） | 0 |
| winniemw | —（尚未收割） | 0 |
| WayneLu | —（尚未收割） | 0 |
| colin_zheng | —（尚未收割） | 0 |
| xiaobainote | —（尚未收割） | 0 |
| zhang_cheng_1377 | —（尚未收割） | 0 |
| lu-ailu | —（尚未收割） | 0 |
| ba-xiansheng | —（尚未收割） | 0 |
| axiaoke | —（尚未收割） | 0 |
