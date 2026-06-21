# task: init-project

**discipline**: `management`
**Gate**: —
**属性**: `project-name`

> 新项目立项：在 `E:\Group-code-lab\` 下创建独立项目仓库，建立代码与协调文件合并的目录结构，git 初始化。

---

## 前置条件

- **触发**：首次收到一个新项目的需求
- **无 Gate 前置**：流程起点
- **需确认**：项目名称（英文或拼音，kebab-case，如 `mail-ai` / `hact-app`）
- **执行位置**：hact-method 工作区，项目仓创建为 `E:\Group-code-lab\` 的子目录

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
| standards-{shared,frontend,backend}.md | `{name}/standards-*.md` | 空桩（标题 + 待播种注），项目根跨迭代活文档；首期 draft-tech-design 播种、vN+1 原地增补（**不**走 templates/） |
| _meta/input/ | `{name}/_meta/input/` | 空目录，存放背景材料和上下文文档 |
| _meta/sessions/ | `{name}/_meta/sessions/` | 空目录，存放跨会话接续文件 |
| hact-notes 仓（每成员） | `gitee.com/{notes-org}/hact-notes-{姓名}` | 私有仓 + 登记入 `_meta/hact-config.md`（决策#21） |
| hact-app 注册 | project_id + Gitee Webhook | 注册并验证 webhook 链路 |

---

## 完成判据

- [ ] `E:\Group-code-lab\{name}\` 目录及全部子文件已创建
- [ ] 各占位文件含初始结构（无空文件）
- [ ] git 已初始化，初始 commit 已完成
- [ ] Gitee 远端已绑定并推送，团队成员已添加为协作者
- [ ] 每个成员的 `hact-notes-{姓名}` 仓已创建并登记入 `_meta/hact-config.md`（已登记者跳过）
- [ ] 已注册到 hact-app 且 Gitee Webhook 链路验证通过

---

## 接口约定

**输入来自**

| 上游 | 交接内容 | 格式 |
|------|---------|------|
| 用户 | 项目名称 + 一句话描述 | 对话 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `draft-prd-vN` | 项目仓就位，A 类流程可启动 | `{name}/` 根目录 |
| `dispatch-new` | 项目仓就位，B 类流程可启动 | `{name}/b-tasks.md` |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/init-project.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
