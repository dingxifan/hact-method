# task: plan-sprint

**discipline**: `dispatch`
**Gate**: G3（可选签于任务尾部）
**属性**: 无

> 读 TRD 拆分 develop 任务，写任务包入 queue，输出 sprint.md，签 G3。

---

## 前置条件

- **Gate**：G2 已签（TRD + 三份 standards 就位）
- **文件**：
  - `iterations/vN/trd.md`
  - `iterations/vN/standards-shared.md` / `standards-frontend.md` / `standards-backend.md`
  - `reusables.md`（了解可复用资产，避免任务包重复指派已有实现）

---

## 字段规范

本 task 无自身特有属性。其产物（develop 任务包）的字段规范见 `specs-structural/develop.md §字段规范`。

---

## 工作内容

1. **通读 TRD**：读 `trd.md` + `standards-*.md` + `reusables.md`，建立完整上下文
2. **输出疑点清单**：列出 TRD 中任何实现边界不清晰的点（字段取值 / 接口行为 / 模块职责边界等）；等用户逐条确认——**无未解决疑点才继续**
3. **拆分任务**：按 TRD 模块拆分本期所有 develop 任务；每个任务确定 layer / source=sprint / urgency=normal / 依赖关系 / 交付方式（`独立` 或 `批量`，判断标准见 exec spec §Step 2.5）
4. **写任务包**：为每个 develop 任务写完整任务包（16 字段，见 `develop.md §字段规范`），写入 `iterations/vN/queue/{task-id}.md`，初始状态设为 [可取]
5. **写 sprint.md**：汇总本期任务列表，标注依赖关系，初始状态全部 [可取]
6. **询问签 G3**：「任务包已写完，要签 G3 吗？」——用户确认后 commit，G3 写入 `iterations/vN/gates.md`

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 各 develop 任务包 | `iterations/vN/queue/{task-id}.md`（每个任务独立一个文件） | 见 develop.md §字段规范（16 字段） |
| sprint.md | `iterations/vN/sprint.md` | 见下方格式说明 |
| G3 签字 | `iterations/vN/gates.md` | `- [x] G3：开发包就绪 — YYYY-MM-DD` |
| 进度断点（compact 时写入） | `_meta/sessions/plan-sprint-progress.md` | 任务骨架表（task-id / 标题 / layer / 依赖）+ 疑点清单答案摘要 |

**sprint.md 格式：**

```markdown
# Sprint vN · {项目名}

| task-id | title | layer | 依赖 | 状态 | PR | 交付 |
|---------|-------|-------|------|------|----|------|
| task-001 | {标题} | backend | — | [可取] | — | 独立 |
| task-002 | {标题} | backend | — | [可取] | — | 批量 |
| task-003 | {标题} | frontend | task-001 | [可取] |

## 依赖说明
- task-003 blocked-by task-001：{原因}
```

**任务包命名规则**：`{task-id}` 格式为 `{项目缩写}-{vN}-{序号}`，如 `auth-v1-001`。

---

## 完成判据

- [ ] 疑点清单已输出，用户逐条确认，无未解决疑点
- [ ] TRD 每个模块都有对应的 develop 任务包
- [ ] 所有任务包 16 字段完整，无空字段
- [ ] 依赖关系已标注（无依赖标 `—`，有依赖标被依赖的 task-id）
- [ ] 每个任务的 `交付` 列已填（`独立` 或 `批量`），判断理由已向用户说明并确认
- [ ] sprint.md 已写，任务列表与 queue/ 一致
- [ ] G3 已签（`gates.md` 已记录 + commit）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `draft-tech-design` | TRD + 三份 standards，G2 已签 | `iterations/vN/trd.md` + `standards-*.md` |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`（多个） | 任务包（[可取] 状态） | `iterations/vN/queue/{task-id}.md` |
| `code-review` | sprint.md（用于追踪 PR 状态） | `iterations/vN/sprint.md` |

---

## 边界场景

| 场景 | 处理方式 |
|------|---------|
| 某个 TRD 模块无法拆成独立 develop 任务（耦合过深） | 先写一个大任务包，在 `known-risks` 中标注耦合点；不强行拆分 |
| reusables.md 已有可复用组件，与本期某任务重叠 | 在对应任务包 `context` 字段标注复用来源，`files` 不列入已有文件（除非需要修改） |
| 前后端任务无依赖关系 | 全部标 `—`，允许并行认领 |
| 某前端任务依赖后端接口（接口未上线） | 后端任务标 `交付=独立`，前端任务标 `交付=批量`，依赖列写后端 task-id；前端批量会话必须等后端 PR 合并后才能开始 |
| TRD 有多个迭代版本在并行（vN 和 vN+1 同时有任务） | 各自建独立 sprint.md；queue 天然隔离于各自迭代目录（`iterations/vN/queue/` / `iterations/vN+1/queue/`） |

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| 疑点清单确认超过 3 轮仍有未解决项 | 上报；未解决项对应的任务包暂不写入 queue，等疑点清后补写 |
| 任务包写完后 TRD 被修订（`revise-doc(target=trd)`） | 受影响的任务包回 [可取] 并更新内容；sprint.md 同步更新 |
| 发现某任务包技术上不可行（写到一半才发现） | 停止，上报；该任务包退回疑点清单重新确认，不强行写完 |
