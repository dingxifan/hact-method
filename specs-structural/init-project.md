# task: init-project

**discipline**: `management`
**Gate**: —
**属性**: `project-name`

> 新项目立项：在 `E:\group-code\` 下创建独立项目仓库，建立代码与协调文件合并的目录结构，git 初始化。

---

## 前置条件

- **触发**：首次收到一个新项目的需求
- **无 Gate 前置**：流程起点
- **需确认**：项目名称（英文或拼音，kebab-case，如 `mail-ai` / `hact-app`）
- **执行位置**：hact-method 工作区，项目仓创建为 `E:\group-code\` 的子目录

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `project-name` | string | ✅ | 英文或拼音，kebab-case；全局唯一；确认后不再更改 |

---

## 主要产物

| 产物 | 路径 | 初始内容 |
|------|------|---------|
| project.md | `{name}/project.md` | 见下方模板 |
| reusables.md | `{name}/reusables.md` | 见下方模板 |
| b-tasks.md | `{name}/b-tasks.md` | 见下方模板 |
| decisions.md | `{name}/decisions.md` | 空表格（含表头） |
| design.md | `{name}/design.md` | 空文件，待首期产品阶段填写 |
| backlog.md | `{name}/backlog.md` | 空文件 |
| feedback.md | `{name}/feedback.md` | 空文件 |
| _meta/input/ | `{name}/_meta/input/` | 空目录，存放背景材料和上下文文档 |
| _meta/sessions/ | `{name}/_meta/sessions/` | 空目录，存放跨会话接续文件 |
| hact-notes 仓（每成员） | `gitee.com/{notes-org}/hact-notes-{姓名}` | 私有仓 + 登记入 `_meta/hact-config.md`（决策#21） |
| hact-app 注册 | project_id + Gitee Webhook | 注册并验证 webhook 链路 |

**project.md 初始模板：**

```markdown
# {name}

## 产品层
> 由 draft-prd-vN 填写

## 技术层
> 由 draft-tech-design 填写

## 当前状态
未开始
```

**reusables.md 初始模板：**

```markdown
# 可复用资产 · {name}

> draft-tech-design 前读取，了解已有资产再做共享组件建议。
> develop 过程中发现新资产随时追加。

## 已落地资产

| 资产 | 性质 | 路径 | 适用场景 |
|------|------|------|---------|
|（首期为空）| | | |

## 建议已拒绝

| 资产建议 | 拒绝原因 | 日期 |
|---------|---------|------|
|（首期为空）| | |
```

**b-tasks.md 初始模板：**

```markdown
# B 类任务总账 · {name}

| task-id | target-source | urgency | title | 状态 | 日期 |
|---------|--------------|---------|-------|------|------|
```

**decisions.md 初始模板：**

```markdown
# 架构决策记录 · {name}

| # | 决策 | 原因 | 日期 |
|---|------|------|------|
```

---

## 完成判据

- [ ] `E:\group-code\{name}\` 目录及全部子文件已创建
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
