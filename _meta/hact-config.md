# hact-method 历史 notes 登记（停止自动消费）

2026-09-08：保留以下既有记录作历史，不再由 init-project 登记或 harvest-notes 遍历，不维护游标；它们不构成访问私人仓的授权。未操作任何对应仓。

> 团队共用，提交进仓库。**只放非机密配置**——凭据一律走 `~/.hact/secrets.env`（机器本地、永不入库，见 `guide/06-连接与凭据配置.md`）。

| 配置项 | 值 |
|--------|-----|
| notes-org（个人积累仓所在 Gitee 命名空间） | `dingxifan`（**Gitee 企业版**，企业全名"苏州立刻电子商务有限公司"，id=16378871）。⚠️ 是企业（enterprise）不是组织（org）：建仓用 `POST /enterprises/dingxifan/repos`，**不要**用 `/orgs/...`（会 404）。仓库地址形如 `gitee.com/dingxifan/hact-notes-{姓名}`。 |

---

## 成员个人积累仓登记表

> 以下为旧机制登记，现不自动访问。
>
> **不登记本地路径**——它由约定推导：任一仓的同级目录 `../hact-notes-{login}/`。各人工作区根不同，写死即在别人机器上失效（见 `skeleton/02-workspaces.md` §目录约定）。

| 成员（login / 显示名） | notes 仓地址 |
|---|---|
| dingxifan_admin（dingxifan·管理员） | gitee.com/dingxifan/hact-notes-dingxifan_admin |
| winniemw（Winnie） | gitee.com/dingxifan/hact-notes-winniemw |
| WayneLu（陆伟平） | gitee.com/dingxifan/hact-notes-WayneLu |
| colin_zheng（郑磊） | gitee.com/dingxifan/hact-notes-colin_zheng |
| xiaobainote（XL） | gitee.com/dingxifan/hact-notes-xiaobainote |
| zhang_cheng_1377（张程） | gitee.com/dingxifan/hact-notes-zhang_cheng_1377 |
| lu-ailu（陆爱露） | gitee.com/dingxifan/hact-notes-lu-ailu |
| ba-xiansheng（Jason） | gitee.com/dingxifan/hact-notes-ba-xiansheng |
| axiaoke（葛春林） | gitee.com/dingxifan/hact-notes-axiaoke |
| dingxifan（dingxifan） | gitee.com/dingxifan/hact-notes-dingxifan |

---

## harvest-notes 收割游标

> 以下游标冻结为历史；按需整理只使用本次获准来源。

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
| dingxifan | —（尚未收割） | 0 |
