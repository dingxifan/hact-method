# task: dispatch-new

**discipline**: `dispatch`
**Gate**: —
**属性**: `target-source`

> B 类入口：收到 bug 报告或优化需求，判断是否属于 B 类，写任务包入 queue，记入 b-tasks.md。

---

## 前置条件

- **触发**：收到 bug 报告或优化需求（来自用户 / 测试 / 外部反馈）
- **无 Gate 前置**：B 类任务随时可进入，不依赖当前迭代状态
- **B 类判定**：以下三条任意命中即升级 A 类——①修改或删除已有接口/字段（breaking change）；②跨模块核心逻辑；③需要产品决策。纯加法 schema 变更（新增可选字段/参数）按业务逻辑复杂度 + 风险可控性二次判定，详见 `specs-execution/dispatch-new.md §Step 1`

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `target-source` | enum | ✅ | `bug`（缺陷修复）/ `optimization`（功能优化） |

派发出的 develop 任务包字段规范见 `specs-structural/develop.md §字段规范`，其中：
- `source` 固定为 `bug` 或 `optimization`（与 `target-source` 一致）
- `urgency` 按紧急程度填 `normal` 或 `hotfix`

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| develop 任务包 | `b-queue/{task-id}.md` | 见 develop.md §字段规范 |
| b-tasks.md 条目 | `b-tasks.md` | 见下方格式 |

**b-tasks.md 行格式：**

```markdown
| {task-id} | {target-source} | {urgency} | {title} | {状态} | {日期} |
```

状态流转：`[可取]` → `[taken-by]` → `[merged]`（与 queue 中任务包状态同步）

---

## 完成判据

- [ ] B 类判定通过（或已升级 A 类并终止本 task）
- [ ] 任务包 17 字段完整，无空字段
- [ ] `urgency` 已按影响程度判断填写
- [ ] b-tasks.md 已追加条目

---

## 接口约定

**输入来自**

| 上游 | 交接内容 | 格式 |
|------|---------|------|
| 用户 / 外部反馈 | bug 报告或优化需求 | 对话 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（source=bug / optimization） | 任务包（[可取] 状态） | `b-queue/{task-id}.md` |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/dispatch-new.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
