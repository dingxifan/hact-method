# task: init-project

**discipline**: `management`
**Gate**: —
**属性**: `project-name`

> 新项目首次立项：创建协调仓目录结构和占位文件，记入 registry，开放 A / B 类任务入口。

---

## 前置条件

- **触发**：首次收到一个新项目的需求，且 `projects/registry.md` 中无对应记录
- **无 Gate 前置**：流程起点
- **需确认**：项目名称（英文或拼音，kebab-case，如 `mail-ai` / `simple-auth`）

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `project-name` | string | ✅ | 英文或拼音，kebab-case；全局唯一；确认后不再更改 |

---

## 工作内容

1. **确认项目名**：与用户确认 `project-name`，说明命名规则；名称确认后不再更改
2. **创建协调仓目录结构**：

```bash
mkdir -p projects/{项目}/iterations
touch projects/{项目}/project.md
touch projects/{项目}/decisions.md
touch projects/{项目}/design.md
touch projects/{项目}/reusables.md
touch projects/{项目}/backlog.md
touch projects/{项目}/feedback.md
touch projects/{项目}/b-tasks.md
mkdir -p projects/{项目}/queue/done
```

3. **写入占位文件初始结构**：各文件按下方"主要产物"中的初始内容填入，不留空文件
4. **更新 registry**：在 `projects/registry.md` 追加项目记录（见"主要产物"格式）
5. **commit**：`git commit -m "feat: 初始化项目 {project-name}"`
6. **告知下一步**：「项目 {project-name} 已初始化，A 类任务从 `draft-prd-vN` 开始；B 类任务直接用 `dispatch-new`。」

---

## 主要产物

| 产物 | 路径 | 初始内容 |
|------|------|---------|
| project.md | `projects/{项目}/project.md` | 见下方模板 |
| reusables.md | `projects/{项目}/reusables.md` | 见下方模板 |
| b-tasks.md | `projects/{项目}/b-tasks.md` | 见下方模板 |
| decisions.md | `projects/{项目}/decisions.md` | 空表格（含表头） |
| design.md | `projects/{项目}/design.md` | 空文件，待首期产品阶段填写 |
| backlog.md | `projects/{项目}/backlog.md` | 空文件 |
| feedback.md | `projects/{项目}/feedback.md` | 空文件 |
| registry 条目 | `projects/registry.md` | 追加一行 |

**project.md 初始模板：**

```markdown
# {project-name}

## 产品层
> 由 draft-prd-vN 填写

## 技术层
> 由 draft-tech-design 填写

## 当前状态
未开始
```

**reusables.md 初始模板：**

```markdown
# 可复用资产 · {project-name}

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
# B 类任务总账 · {project-name}

| task-id | target-source | urgency | title | 状态 | 日期 |
|---------|--------------|---------|-------|------|------|
```

**decisions.md 初始模板：**

```markdown
# 架构决策记录 · {project-name}

| # | 决策 | 原因 | 日期 |
|---|------|------|------|
```

**registry.md 追加格式：**

```markdown
| {project-name} | {YYYY-MM-DD} | {一句话描述} | 进行中 / 暂停 / 归档 |
```

---

## 完成判据

- [ ] `projects/{项目}/` 目录及全部子文件已创建
- [ ] 各占位文件含初始结构（无空文件）
- [ ] `projects/registry.md` 已追加项目记录
- [ ] 变更已 commit

---

## 接口约定

**输入来自**

| 上游 | 交接内容 | 格式 |
|------|---------|------|
| 用户 | 项目名称 + 一句话描述 | 对话 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `draft-prd-vN` | 项目目录就位，A 类流程可启动 | `projects/{项目}/` |
| `dispatch-new` | 项目目录就位，B 类流程可启动 | `projects/{项目}/b-tasks.md` |

---

## 边界场景

| 场景 | 处理方式 |
|------|---------|
| 项目名与已有项目重名 | 告知用户冲突，要求重新命名；不覆盖已有目录 |
| 用户只有 B 类需求（无 A 类计划） | 照常初始化，`iterations/` 目录保留但为空；B 类任务直接用 `dispatch-new` |
| 需要同时初始化代码仓库 | 代码仓库初始化属于执行层（specs-execution），本 task 只负责协调仓目录；告知用户代码仓库需单独处理 |
| 项目已有部分文件（历史遗留）| 不覆盖已有文件；仅创建缺失的文件和目录 |

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| 项目名中途要改 | 需手动 rename 所有相关路径 + 更新 registry；代价较高，强烈建议确认后再创建 |
| commit 失败（git 权限问题） | 检查 git 配置，修复后重新 commit；不跳过 commit 步骤 |
