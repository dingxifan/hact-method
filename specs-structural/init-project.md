# task: init-project

**discipline**: `management`
**Gate**: —
**属性**: `project-name`

> 新项目立项：在工作区根（方法论仓的上级目录）下创建独立项目仓库，建立代码与协调文件合并的目录结构，git 初始化。

---

## 前置条件

- **触发**：首次收到一个新项目的需求
- **无 Gate 前置**：流程起点
- **需确认**：项目名称（英文或拼音，kebab-case，如 `mail-ai` / `org-krm`）
- **执行位置**：hact-method 工作区，项目仓创建为方法论仓的**同级目录** `../{name}/`

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `project-name` | string | ✅ | 英文或拼音，kebab-case；全局唯一；确认后不再更改 |

---

## 主要产物

> 多数占位文件**复制自 `../hact-method-lab/templates/{产物名}.md`**（单一真相源），把文件内 `{项目名}` 占位替换为实际项目名。templates/ 是格式真相源，本契约不再内联重抄。

| 产物 | 路径 | 初始内容 |
|------|------|---------|
| project.md | `{name}/project.md` | 复制自 `templates/project.md` |
| reusables.md | `{name}/reusables.md` | 复制自 `templates/reusables.md` |
| b-tasks.md | `{name}/b-tasks.md` | 复制自 `templates/b-tasks.md` |
| decisions.md | `{name}/decisions.md` | 复制自 `templates/decisions.md` |
| backlog.md | `{name}/backlog.md` | 复制自 `templates/backlog.md` |
| feedback.md | `{name}/feedback.md` | 复制自 `templates/feedback.md` |
| design.md | `{name}/design.md` | 复制自 `templates/design.md`（空模板，`draft-ux` Step 1.3 填变量） |
| foundation.md | `{name}/foundation.md` | 复制自 `templates/foundation.md`（**地基蓝图**空模板，Step 5 共识讨论填领域地图 + 地基关注点登记 + 安全项应有档=构造级；下游 V0 走骨架据此建） |
| standards-{shared,frontend,backend}.md | `{name}/standards-*.md` | 空桩；V0 按 `templates/standards/schema.md` 首播当前稳定默认规则，后续只更新当前真值 |
| _meta/input/ | `{name}/_meta/input/` | 空目录，存放背景材料和上下文文档 |
| _meta/sessions/ | `{name}/_meta/sessions/` | 空目录，存放跨会话接续文件 |
| hact-notes 仓（每成员） | `gitee.com/{notes-org}/hact-notes-{姓名}` | 私有仓 + 登记入 `_meta/hact-config.md`（决策#21） |
| connections.yml | `{name}/connections.yml` | 复制自 `templates/connections.yml`（外部连接登记，入库·零机密；机密真值在机器本地 `~/.hact/secrets.env`） |

---

## 完成判据

- [ ] `../{name}/` 目录及全部子文件已创建
- [ ] 各占位文件含初始结构（无空文件）
- [ ] `foundation.md` 已经 Step 5 共识讨论播种（领域地图非空 + 地基关注点登记 + 安全敏感项应有档=构造级）
- [ ] git 已初始化，初始 commit 已完成
- [ ] Gitee 远端已绑定并推送，团队成员已添加为协作者
- [ ] 每个成员的 `hact-notes-{姓名}` 仓已创建并登记入 `_meta/hact-config.md`（已登记者跳过）
- [ ] `connections.yml` 已播种，`node scripts/check-conn.js check` 通过

---

## 接口约定

**输入来自**

| 上游 | 交接内容 | 格式 |
|------|---------|------|
| 用户 | 项目名称 + 一句话描述 | 对话 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `draft-foundation`（V0 地基设计） | 项目仓 + 地基蓝图就位，A 类先走 **V0 走骨架**（地基设计→G2→develop 建骨架），骨架跑通后才进 V1 draft-prd-vN | `{name}/foundation.md` |
| `dispatch-new` | 项目仓就位，B 类流程可启动 | `{name}/b-tasks.md` |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/init-project.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
