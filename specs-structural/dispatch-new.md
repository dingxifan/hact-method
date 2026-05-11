# task: dispatch-new

**discipline**: `dispatch`
**Gate**: —
**属性**: `target-source`

> B 类入口：收到 bug 报告或优化需求，判断是否属于 B 类，写任务包入 queue，记入 b-tasks.md。

---

## 前置条件

- **触发**：收到 bug 报告或优化需求（来自用户 / 测试 / 外部反馈）
- **无 Gate 前置**：B 类任务随时可进入，不依赖当前迭代状态
- **B 类判定**：需求不涉及新用户场景 / 接口 schema 变更 / 跨多模块重构 → 属于 B 类，走本 task；否则升级 A 类（见边界场景）

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `target-source` | enum | ✅ | `bug`（缺陷修复）/ `optimization`（功能优化） |

派发出的 develop 任务包字段规范见 `specs-structural/develop.md §字段规范`，其中：
- `source` 固定为 `bug` 或 `optimization`（与 `target-source` 一致）
- `urgency` 按紧急程度填 `normal` 或 `hotfix`

---

## 工作内容

1. **B 类判定**：确认需求不涉及以下任一情况——新用户场景 / 接口 schema 变更 / 跨多模块重构 / 需要产品决策；满足则继续，不满足则升级 A 类
2. **收集信息**：
   - `target-source=bug`：收集现象描述 / 复现步骤 / 已试方案 / 最可能修复方向
   - `target-source=optimization`：收集改进目标 / 基线指标（如有）/ 验收标准
3. **判断 urgency**：影响核心功能且无法绕过 → `hotfix`；其余 → `normal`
4. **写任务包**：按 develop.md §字段规范写完整 16 字段任务包，写入 `iterations/vN/queue/{task-id}.md`，状态 [可取]；task-id 命名格式：`{项目缩写}-b-{三位序号}`，如 `hact-b-001`
5. **记入 b-tasks.md**：在 `b-tasks.md` 追加一行（见"主要产物"格式）

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| develop 任务包 | `iterations/vN/queue/{task-id}.md` | 见 develop.md §字段规范 |
| b-tasks.md 条目 | `b-tasks.md` | 见下方格式 |

**b-tasks.md 行格式：**

```markdown
| {task-id} | {target-source} | {urgency} | {title} | {状态} | {日期} |
```

状态流转：`[可取]` → `[taken-by]` → `[merged]`（与 queue 中任务包状态同步）

---

## 完成判据

- [ ] B 类判定通过（或已升级 A 类并终止本 task）
- [ ] 任务包 16 字段完整，无空字段
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
| `develop`（source=bug / optimization） | 任务包（[可取] 状态） | `iterations/vN/queue/{task-id}.md` |

---

## 边界场景

| 场景 | 处理方式 |
|------|---------|
| 需求涉及新用户场景 / 接口 schema 变更 / 跨模块重构 | 升级 A 类：终止本 task，告知用户需走 `draft-prd-vN` 流程 |
| 同一 bug 多次出现（重复报告） | 检查 b-tasks.md 是否已有对应条目；若有则更新现有条目的频次备注，不新建 |
| `urgency=hotfix` | 任务包写完立即通知相关 develop 执行人优先拾取；不等积累再派 |
| bug 复现步骤不明确 | 先追问复现步骤，无法复现则在任务包 `known-risks` 标注；不写复现不明的任务包 |
| 优化需求无量化验收标准 | 与用户确认可观测的成功指标（如"响应时间 < 200ms"），写入 `acceptance-criteria` |

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| B / A 类判定有争议 | 倾向升级 A 类；宁可多走流程，不要遗漏产品决策 |
| 任务包写完后发现问题比预期复杂（develop 执行中升级） | develop 执行人通过异常转移将任务回 [可取] + 写升级原因；由 dispatch 判断是否需要升级 A 类 |
| hotfix 与当前迭代 sprint 任务冲突（代码改动重叠） | 在 hotfix 任务包 `known-risks` 中标注冲突文件，由 develop 执行人协调合并顺序 |
