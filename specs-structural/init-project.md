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
- **执行位置**：父级工作区（`E:\group-code\`），项目仓创建为其子目录

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `project-name` | string | ✅ | 英文或拼音，kebab-case；全局唯一；确认后不再更改 |

---

## 工作内容

1. **确认项目名**：与用户确认 `project-name`，说明命名规则；名称确认后不再更改
2. **创建项目仓目录结构**：

```bash
mkdir -p E:\group-code\{name}\iterations\v1\queue\done
mkdir -p E:\group-code\{name}\_meta\input
mkdir -p E:\group-code\{name}\_meta\sessions
touch E:\group-code\{name}\project.md
touch E:\group-code\{name}\decisions.md
touch E:\group-code\{name}\design.md
touch E:\group-code\{name}\reusables.md
touch E:\group-code\{name}\backlog.md
touch E:\group-code\{name}\feedback.md
touch E:\group-code\{name}\b-tasks.md
```

`_meta/` 目录说明：
- `_meta/input/`：背景材料、上下文文档（非交付物，供任务会话加载）
- `_meta/sessions/`：各任务的跨会话接续文件（`{task-type}-progress.md`）

3. **写入占位文件初始结构**：各文件按下方"主要产物"中的初始内容填入，不留空文件
4. **Git 初始化**：

```bash
cd E:\group-code\{name}
git init
git add .
git commit -m "feat: 初始化项目 {name}"
```

5. **告知下一步**：「项目 {name} 仓已创建于 `E:\group-code\{name}\`，A 类任务从 `draft-prd-vN` 开始；B 类任务直接用 `dispatch-new`。」

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

## 边界场景

| 场景 | 处理方式 |
|------|---------|
| 项目名与已有目录重名 | 告知用户冲突，要求重新命名；不覆盖已有目录 |
| 用户只有 B 类需求（无 A 类计划） | 照常初始化，`iterations/` 目录保留但为空；B 类直接用 `dispatch-new` |
| 需要同时创建远端仓库 | 本 task 只建本地仓；推远端属于执行层，可在 git init 后手动执行 `git remote add` |
| 项目仓已存在部分文件（历史遗留）| 不覆盖已有文件；仅创建缺失的文件和目录 |

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| 项目名中途要改 | 需手动 rename 目录，代价较高；强烈建议确认后再创建 |
| git init 失败 | 检查目录权限，修复后重新执行；不跳过 git 初始化 |
