# exec: init-project

> CC 加载本文时，当前任务是为一个新项目建立协调仓目录结构和占位文件。

**上下文密度**：低。机械化操作为主，单次会话可完整完成。

---

## 步骤追踪协议

每步完成后输出：
```
✅ [步骤名] 完成：[2–3 句结论]
→ 下一步：[步骤名] — [一句说明]
继续？
```
🚫 标记处必须等用户明确回应后才继续，不得假设用户同意。

---

## 会话启动

**必读**：`projects/registry.md`（确认名称不重复）

开场说：「我将为新项目建立协调仓目录结构。请确认项目名称（英文或拼音，kebab-case，如 `mail-ai`）——名称确认后不再更改。」

🚫 等用户给出项目名称

---

## 执行步骤

### Step 1：名称校验

检查 `projects/registry.md` 是否已有同名项目。

- 有冲突 → 告知用户，请求重新命名，回到 🚫
- 无冲突 → 继续

```
✅ 名称校验通过：`{name}` 在 registry 中不存在冲突
→ 下一步：创建目录结构
继续？
```

🚫 等用户确认

---

### Step 2：创建目录结构

执行：

```bash
mkdir -p projects/{name}/iterations
mkdir -p projects/{name}/queue/done
touch projects/{name}/project.md
touch projects/{name}/decisions.md
touch projects/{name}/design.md
touch projects/{name}/reusables.md
touch projects/{name}/backlog.md
touch projects/{name}/feedback.md
touch projects/{name}/b-tasks.md
```

---

### Step 3：写入占位文件

按 `specs-structural/init-project.md §主要产物` 写入各文件初始结构。每个文件写完后确认内容正确，不留空文件。

---

### Step 4：更新 registry

在 `projects/registry.md` 追加：
```markdown
| {name} | {YYYY-MM-DD} | {一句话描述} | 进行中 |
```

---

### Step 5：commit

```bash
git add projects/{name}/ projects/registry.md
git commit -m "feat: 初始化项目 {name}"
```

---

### Step 6：移交

```
✅ init-project 完成：项目 {name} 协调仓目录已就绪，占位文件已写入，registry 已更新。
→ 下一步：draft-prd-vN — A 类需求从产品阶段开始；B 类需求直接用 dispatch-new。
```

---

## Subagent 使用

无。全程使用 Write / Bash 工具直接执行。

---

## 断点续做

读 `projects/{name}/` 目录，判断哪些文件已创建；读 `registry.md` 判断是否已登记。从未完成的步骤继续。
