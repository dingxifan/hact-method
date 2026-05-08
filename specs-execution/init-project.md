# exec: init-project

> CC 加载本文时，当前任务是为新项目创建独立仓库（代码 + 协调文件合并）。

**上下文密度**：低。机械化操作为主，单次会话可完整完成。
**执行位置**：父级工作区（`E:\group-code\`）或 hact-method 工作区均可；创建目标在 `E:\group-code\{name}\`。

---

## 步骤追踪协议

每步完成后输出：
```
✅ [步骤名] 完成：[2–3 句结论]
→ 下一步：[步骤名] — [一句说明]
继续？
```
🚫 标记处必须等用户明确回应后才继续。

---

## 会话启动

开场说：「我将为新项目创建独立仓库（`E:\group-code\{name}\`），代码和协调文件合并存放。请确认项目名称（英文或拼音，kebab-case）——名称确认后不再更改。」

🚫 等用户给出项目名称

---

## 执行步骤

### Step 1：名称校验

检查 `E:\group-code\` 下是否已有同名目录。

- 有冲突 → 告知用户，请求重新命名，回到 🚫
- 无冲突 → 继续

```
✅ 名称校验通过：`E:\group-code\{name}\` 不存在冲突。
→ 下一步：创建目录结构
继续？
```

🚫 等用户确认

---

### Step 2：创建目录结构

```bash
mkdir -p "E:/group-code/{name}/iterations"
mkdir -p "E:/group-code/{name}/queue/done"
mkdir -p "E:/group-code/{name}/_meta/input"
mkdir -p "E:/group-code/{name}/_meta/sessions"
```

---

### Step 3：写入占位文件

按 `specs-structural/init-project.md §主要产物` 写入各文件初始结构。每个文件写完确认内容正确，不留空文件：

- `project.md`
- `decisions.md`
- `design.md`
- `reusables.md`
- `backlog.md`
- `feedback.md`
- `b-tasks.md`

同时写入以下文件：
- `CLAUDE.md`：内容复制自 `E:\group-code\hact-method\templates\CLAUDE.md`，将 `{项目名}` 替换为实际项目名，`{一句话描述}` 留空待用户补充
- `.claude/commands/pic.md`：内容复制自 `E:\group-code\hact-method\templates\.claude\commands\pic.md`（slash command，输入 `/pic` 启动联调前全面检查）

---

### Step 4：Git 初始化

```bash
cd "E:/group-code/{name}"
git init
git add .
git commit -m "feat: 初始化项目 {name}"
```

---

### Step 5：移交

```
✅ init-project 完成：`E:\group-code\{name}\` 已创建，占位文件已写入，git 已初始化。
→ 下一步：draft-prd-vN — A 类需求从产品阶段开始；B 类需求直接用 dispatch-new。
```

---

## Subagent 使用

无。全程使用 Write / Bash 工具直接执行。

---

## 断点续做

检查 `E:\group-code\{name}\` 目录是否存在及哪些文件已创建；从未完成的步骤继续。
