# task: draft-tech-design

**discipline**: `architecture`
**Gate**: G2（可选签于任务尾部）
**属性**: `version`

> 读 PRD 输出疑点清单，确认后写 TRD + 三份 standards，签 G2。

---

## 前置条件

- **触发**：G1 已签，`iterations/vN/prd.md` 已存在
- **Gate**：G1 未签则阻断
- **文件**：`project.md`（了解技术约束和已有决策）；`reusables.md`（了解已有共享组件，避免重复建议）

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `version` | string | ✅ | 与 `draft-prd-vN` 同一版本号 |

---

## 工作内容

1. **读 PRD + 已有上下文**：读 `prd.md` + `project.md` 技术层 + `reusables.md`；理解业务约束和已有技术决策
2. **输出疑点清单**：列出 PRD 中技术边界不清晰的点（字段约束 / 接口语义 / 数据结构 / 并发场景 / 第三方依赖等）；等用户逐条确认——**禁止带假设输出 TRD**
3. **输出 TRD**：包含 7 个固定段落（见"主要产物"）；迭代项目只写本期增量
4. **输出三份 standards**：
   - 来源规则（双源：公共模板 + 执行人个人 notes）：
     - **v1（首期）**：从 `templates/standards/{layer}.md` 中挑选本期 TRD 相关项，不全量复制
     - **vN+1（迭代）**：以上一期 `iterations/vN/standards-*.md` 为基础，按本期 TRD 增量追加或修订
     - **双源补充**：并入执行人个人 notes（`../hact-notes-{name}/notes.md`）中本 layer 相关的 `[规范]` 条目，让本人尚未上提的规范当期即生效；并入前对照公共模板 + 上期 standards 去重，已收录的不重复并入（设计甲，见执行规范）
   - `standards-shared.md`：跨层共同约束（命名规范 / 错误码 / API 响应格式 / 权限模型）
   - `standards-frontend.md`：前端实现约束，来源于模板或上期 standards + 本期 TRD 新要求 + 执行人 notes `[规范]`
   - `standards-backend.md`：后端实现约束，同上
5. **知识沉淀**：将本期关键架构决策写入 `decisions.md`；更新 `project.md` 技术层
6. **询问签 G2**：「TRD 和 standards 已完成，要签 G2 吗？」——用户确认后 commit，G2 签字写入 `iterations/vN/gates.md`

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
- [ ] G2 已签（`gates.md` 已记录 + commit）

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `draft-prd-vN` | 定稿 PRD，G1 已签 | `iterations/vN/prd.md` |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `plan-sprint` | TRD + 三份 standards，G2 已签 | `iterations/vN/trd.md` + `standards-*.md` |
| `revise-doc`（如有修订） | TRD / standards 被标记为待修订 | backlog `[修订]` 条目 |

---

## 边界场景

| 场景 | 处理方式 |
|------|---------|
| PRD 存在歧义或遗漏 | 写入疑点清单，等用户确认；不自行补全假设 |
| 迭代项目（已有 TRD） | 只写本期增量，引用已有 project.md；不重写全量 TRD |
| reusables.md 已有可复用组件 | 在"共享组件建议"中标注"已有，见 reusables.md"，不重复建议新建 |
| 技术选型有重大变更（替换已有依赖） | 写入 decisions.md 并说明原因；不静默替换 |
| PRD 中某功能技术可行性存疑（三角 F 风险） | 写入疑点清单，明确风险；等用户决策是否调整 PRD 范围，不自行删减 |
| standards 某条与已有 `templates/standards/` 模板有冲突 | 以本期 TRD 决策为准，在 decisions.md 说明冲突和理由 |

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| TRD 定稿后 PRD 被修订（`revise-doc(target=prd)`） | 判断 PRD 变动是否影响接口 / 数据结构；若影响，创建 `revise-doc(target=trd)` task |
| TRD 定稿后开发阶段发现接口设计有误 | 通过 `revise-doc(target=trd)` 修订，不直接改已签 G2 的文件 |
| 疑点清单确认超过 3 轮仍有未解决项 | 上报，记录未决点，等待用户决策后再继续；不跳过未决疑点 |
| standards 生成时发现前后端团队对某规范有分歧 | 记录分歧点，由用户裁定后写入 standards，不自行选边 |
