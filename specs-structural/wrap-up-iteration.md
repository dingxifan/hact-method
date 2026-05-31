# task: wrap-up-iteration

**discipline**: `management`
**Gate**: G5（可选签于任务尾部）
**属性**: `version`

> G5 三步收尾：偏离对账 / feedback 审阅分流 / project.md 合并。可与 deploy 并行执行。

---

## 前置条件

- **Gate**：G4 已签
- **与 `deploy` 的关系**：无强依赖，可并行执行；部署失败不阻断收尾，两者结论独立
- **文件**：
  - `backlog.md`（偏离记录）
  - `feedback.md`（各阶段反馈）
  - `iterations/vN/prd.md` / `trd.md` / `standards-*.md`

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `version` | string | ✅ | 本期版本号，如 `v1` |

---

## 工作内容

### 第一步：偏离对账

读 `backlog.md` 中所有 `[偏离]` 条目，逐条判断：

| 偏离影响范围 | 处理方式 |
|---|---|
| 影响接口或数据结构 | 创建 `revise-doc(target=trd)` 反向更新 TRD |
| 影响功能边界或用户行为 | 创建 `revise-doc(target=prd)` 反向更新 PRD |
| 仅影响实现细节 | 记入 `decisions.md`，无需更新 PRD / TRD |

无 `[偏离]` 条目 → 跳过第一步。

### 第二步：feedback 审阅分流

读 `feedback.md`，逐条按以下规则分流：

| feedback 内容 | 目的地 |
|---|---|
| 开发踩的坑、禁止事项、编码规范（原则级） | 执行人 hact-notes（标签 `[规范]`） |
| 自检容易漏的验证项（能写成 checkbox） | 执行人 hact-notes（标签 `[checklist]`） |
| 角色工作流 / 规范有问题 | 执行人 hact-notes（标签 `[方法论]`），由 harvest-notes 后续进待议清单，不在收尾阶段直接改方法论文件 |
| 项目架构决策有遗漏 | `decisions.md`（项目仓） |
| 跨项目通用机制问题 | 执行人 hact-notes（标签 `[方法论]`） |
| 无价值 | 直接删除 |

分流完成后**清空 `feedback.md`**。

### 第三步：project.md 合并

确认 `project.md` 已反映本期最终状态：
- 产品层（目标 / 用户 / 功能边界）与最终 PRD 一致
- 技术层（技术选型 / 数据库结构 / 模块划分）与最终 TRD 一致
- 去除"开发中"标注，标记为"已上线"（若已部署）

### 签 G5

三步完成后：「迭代 vN 已收尾，要签 G5 吗？」——用户确认后 commit，G5 写入 `iterations/vN/gates.md`。

---

## 主要产物

| 产物 | 路径 | 说明 |
|------|------|------|
| 反向更新的 PRD / TRD（如有偏离） | `iterations/vN/prd.md` / `trd.md` | 通过 `revise-doc` task 执行 |
| 更新的 decisions.md | `decisions.md` | 实现细节偏离的沉淀 |
| 誊入个人 notes 的反馈条目 | `../hact-notes-{name}/notes.md` | feedback 分流：`[规范]`/`[checklist]`/`[方法论]`，由 harvest-notes 后续上提 |
| 清空的 feedback.md | `feedback.md` | 分流完成后清空 |
| 更新的 project.md | `project.md` | 本期最终状态快照 |
| G5 签字 | `iterations/vN/gates.md` | `- [x] G5：迭代收尾完成 — YYYY-MM-DD` |

---

## 完成判据

- [ ] 第一步：backlog `[偏离]` 条目全部处理（创建 revise-doc 或记入 decisions.md）
- [ ] 第二步：feedback.md 每条已分流，文件已清空
- [ ] 第三步：project.md 反映本期最终状态，无"开发中"标注
- [ ] G5 已签（`gates.md` 已记录 + commit）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `manual-test` | G4 已签 | `gates.md` |
| 本期所有 task | 积累的 backlog `[偏离]` + feedback | `backlog.md` / `feedback.md` |

**输出给**

| 下游 task / 目的地 | 交接内容 | 格式 |
|---|---------|------|
| `revise-doc`（如有偏离） | 偏离需反向更新的文档 | 新建 task |
| 执行人 hact-notes | feedback 分流的规范 / checklist / 方法论条目 | 誊入个人 notes 打标签 |
| `harvest-notes`（下游） | 个人 notes 的可上提条目 | 由管理者收割上提公共层 |
| 下一期 `draft-prd-vN` | 迭代正式闭环，可启动下一期 | G5 已签 |

---

## 边界场景

| 场景 | 处理方式 |
|------|---------|
| `deploy` 失败，但收尾三步已完成 | G5 可独立签字；project.md 中标注"待部署"而非"已上线" |
| feedback 条目归属有争议（standards？checklist？） | 是"要遵守的规则"→ standards；是"容易漏、要专门核查"→ checklist；涉及方法论结构的才进待议清单 |
| 同一期大量 `[偏离]`（>5 条） | 在 feedback.md 追加一条"本期 TRD 覆盖质量问题"，分流到 `_meta/plans/` 记录，下次方法论讨论时处理 |
| 迭代未部署就收尾（纯文档迭代） | project.md 标注"本期无部署"，正常签 G5 |
| B 类任务长期运行，项目根积累大量 feedback | 参照 skeleton 的"清理项目积累"机制，建独立 cleanup task 跑三步但不签 G5 |

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| 偏离对账创建 revise-doc 后，revise-doc 未完成就想签 G5 | 不签；等 revise-doc 完成后再签，确保文档与实现一致 |
| feedback 分流后发现某条需要团队讨论才能决策 | 记入 `_meta/plans/` 待议清单，不阻断 G5；G5 之后再讨论 |
| project.md 与 PRD / TRD 有多处出入 | 逐条对齐后再签 G5；不跳过此步骤 |
