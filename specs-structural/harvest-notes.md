# task: harvest-notes

**discipline**: `management`
**Gate**: —
**属性**: 无

> 收割成员个人积累仓（hact-notes），把验证有效的 `[规范]`/`[checklist]`/`[方法论]` 条目去重择优，上提到 hact-method 公共层。pull 模型：管理者拉取，开发者不推送。

---

## 前置条件

- **Gate**：无
- **执行工作区**：hact-method（方法论心态）——要写公共层，须管理者权限
- **依赖**：`_meta/hact-config.md` 的「成员个人积累仓登记表」非空
- **权限**：对成员 notes 仓**只读**；对 hact-method 公共层可写
- **文件**：
  - `_meta/hact-config.md`（成员仓登记表 + 收割游标）
  - 各成员本地仓 `../hact-notes-{name}\notes.md`（只读）

---

## 字段规范

无特殊字段。可选记录本次收割的批次标识（日期），写入游标表备注。

---

## 主要产物

| 产物 | 路径 | 说明 |
|------|------|------|
| 上提的编码规范 | `templates/standards/{backend\|frontend\|shared}.md` | 来自成员 `[规范]`（跨层条目入 `shared.md`） |
| 上提的自检项 | `templates/checklists/{backend\|frontend}-checklist.md` | 来自成员 `[checklist]` |
| 新增方法论待议 | `_meta/plans/方法论待议.md` | 来自成员 `[方法论]`，留待方法论调整会话处理 |
| 推进的收割游标 | `_meta/hact-config.md` | 各成员上次收割点 |

---

## 完成判据

- [ ] 登记表中每个成员的 notes 仓已遍历（不可访问的已记录、跳过）
- [ ] 游标之后的新增 `[规范]`/`[checklist]`/`[方法论]` 条目已去重择优
- [ ] 采纳条目已写入对应公共层文件
- [ ] 收割游标已推进
- [ ] hact-method 已 commit（push 由管理者确认）

---

## 接口约定

**输入来自**

| 上游 | 交接内容 | 格式 |
|------|---------|------|
| `wrap-up-iteration` 第二步（A 类） | 分流进执行人 notes 的反馈条目 | `notes.md` 打标签条目 |
| `develop` 移交（B 类轻量分流） | B 类踩坑分流进 notes 的条目 | `notes.md` 打标签条目 |
| 成员日常随手记 | 任意时刻的个人积累 | `notes.md` 打标签条目 |

**输出给**

| 下游 / 目的地 | 交接内容 |
|---|---------|
| `templates/standards` / `templates/checklists` | 全队下期可用的公共规范 / 自检项 |
| 方法论调整会话 | `_meta/plans/方法论待议.md` 的新条目（人工讨论后改方法论文件） |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/harvest-notes.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
