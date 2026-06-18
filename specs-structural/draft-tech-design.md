# task: draft-tech-design

**discipline**: `architecture`
**Gate**: G2（可选签于任务尾部）
**属性**: `version`

> 读 PRD 输出疑点清单，确认后写 TRD + 三份 standards，签 G2。

---

## 前置条件

- **触发**：G1 已签，`iterations/vN/prd.md` 已存在
- **Gate**：G1 未签则阻断
- **draft-ux 前置**：PRD 中有任何功能标记 `draft-ux: 需要`，且 `iterations/vN/prototype.html` 不存在 → 阻断，提示先完成 `draft-ux`
- **文件**：`project.md`（了解技术约束和已有决策）；`reusables.md`（了解已有共享组件，避免重复建议）

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `version` | string | ✅ | 与 `draft-prd-vN` 同一版本号 |

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| TRD | `iterations/vN/trd.md` | Markdown，含 7 个固定段落 |
| 共享规范 | `iterations/vN/standards-shared.md` | Markdown；v1 源于 `templates/standards/`，vN+1 源于上期同文件增量更新 |
| 前端规范 | `iterations/vN/standards-frontend.md` | 同上 |
| 后端规范 | `iterations/vN/standards-backend.md` | 同上 |
| G2 签字 | `iterations/vN/gates.md` | `- [x] G2：TRD 已确认 — YYYY-MM-DD` |
| decisions.md 更新 | `decisions.md` | 表格追加：决策 / 原因 / 日期 |
| project.md 更新（技术层） | `project.md` | 追加或更新技术层内容 |
| 进度断点（compact 时写入） | `_meta/sessions/draft-tech-design-progress.md` | 疑点清单答案摘要 + TRD 骨架（接口列表 / 模块划分 / 共享组件） |

**TRD 必含段落：**

| 段落 | 说明 |
|------|------|
| 技术选型变更 | 仅写本期新增依赖；格式：依赖 / 用途 / 选型理由；迭代项目不重复已有选型 |
| 数据库设计 | 按表分块；含字段约束 / 索引 / 外键 / 唯一性；PRD 每个数据实体必须有对应表 |
| 接口设计 | 仅本期新增接口；含路径 / 方法 / 请求体 / 响应体 / 错误码 |
| 测试环境约定 | **不可省略**：后端地址 / 前端访问方式 / 数据库指向 / 有副作用操作的禁止清单 |
| 交互技术方案 | PRD 交互中有技术含义的部分（轮询 vs WebSocket / 复杂状态流转 / 跨模块数据共享等） |
| 模块拆分 | 前后端各自的模块划分，明确各模块职责边界 |
| 共享组件建议 | 表格：资产 / 性质 / 涉及模块 / 建议路径；参照 `reusables.md` 避免重复建议 |

---

## 完成判据

- [ ] 疑点清单已输出，用户逐条确认，无未解决疑点
- [ ] TRD 7 个段落全部存在，无空段
- [ ] PRD 中每个数据实体在数据库设计中有对应表
- [ ] 测试环境约定段落存在且完整
- [ ] 三份 standards 已输出（shared / frontend / backend）
- [ ] decisions.md 已追加本期架构决策
- [ ] project.md 技术层已更新
- [ ] 完成判据已冷核（陌生 subagent 逐条核对，凭证存于 `iterations/vN/gate-checks/G2.md`，人已抽看；见 `skeleton/06-gates.md` §7）
- [ ] G2 已签（`gates.md` 已记录 + commit）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `draft-prd-vN` | 定稿 PRD，G1 已签 | `iterations/vN/prd.md` |
| `draft-ux`（条件性） | 交互流程图 + HTML 原型；PRD 有 `draft-ux: 需要` 时必须存在 | `iterations/vN/ux-flows.md` + `iterations/vN/prototype.html` |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `plan-sprint` | TRD + 三份 standards，G2 已签 | `iterations/vN/trd.md` + `standards-*.md` |
| `revise-doc`（如有修订） | TRD / standards 被标记为待修订 | backlog `[修订]` 条目 |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/draft-tech-design.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
