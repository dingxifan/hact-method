# exec: draft-tech-design

> CC 加载本文时，当前任务是读 PRD 输出 TRD + 三份 standards，签 G2。
> 三层顺序：**骨架**（架构轮廓）→ **结构层**（完整契约）→ **执行层**（standards）

**上下文密度**：中高。需读多份输入文件，输出 4 份文档。疑点清单阻断前不开始写 TRD。

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

**前置检查：G1 是否已签**

读 `iterations/vN/gates.md`（路径不存在时读 `iterations/` 目录找最新版本）：
- G1 未签 → 阻断：「⚠️ G1 未通过，PRD 尚未确认，请先完成 draft-prd-vN 再启动技术设计。」
- G1 已签 → 继续

**必读文件**（用 Explore subagent 并行读取，不占主线上下文）：
- `iterations/vN/prd.md`
- `project.md`（技术层已有决策）
- `decisions.md`
- `reusables.md`
- `../hact-method/templates/standards/backend.md`
- `../hact-method/templates/standards/frontend.md`

**技术偏好确认**：
- 首期项目：询问用户技术栈偏好，确认后写入 `project.md` 技术层，后续迭代直接复用
- 迭代项目：从 `project.md` 技术层读取已有选型，不重新询问

**选项列表**（G1 已满足，确认要做什么）：

```
{项目名} · G1 已签，PRD 已确认

可做的任务：
[1] draft-tech-design — 技术设计（TRD + 三份 standards）← 主线
[2] revise-doc(target=prd) — 若发现 PRD 有歧义或遗漏，先修再做技术设计

其他可做（输入「展开」/ 自由描述）：
- 查看 PRD 内容摘要
- 其他

请选 [1]、[2]，或输入「展开」，或直接说你要做什么。
```

🚫 等用户选择后再继续

用户选 [1] → 继续下方步骤（技术偏好确认 → 疑点清单 → TRD）
用户选 [2] → 加载 revise-doc exec spec，按 revise-doc 流程执行

开场说：「我将分三层完成技术设计：先确认架构骨架方向，再写完整 TRD 契约，最后生成三份 standards。首先输出疑点清单等你确认，确认后才开始写。」

---

## 第一层：骨架（架构轮廓）

### Step 1：输出疑点清单

读完 PRD 后，列出所有技术边界不清晰的点：

```markdown
## 疑点清单 · v{N}

1. [功能/数据实体] {疑点描述} → 需确认：{具体问题}
2. [接口/模块] {疑点描述} → 需确认：{具体问题}
...
```

分类涵盖：字段约束 / 接口语义 / 并发场景 / 第三方依赖 / 鉴权边界 / 数据迁移。

无疑点时明确说"已通读 PRD，无疑点"，不省略此步。

🚫 等用户逐条回答疑点，**不得带假设开始写 TRD**

---

### Step 2：输出 TRD 骨架

疑点清单确认完毕后，输出架构骨架——**每项只写一行**，不展开细节：

```markdown
## TRD 骨架 · v{N}

### 技术选型变更
- {新增依赖}：{一句话用途}

### 数据库变更
- 新建表：{表名}（{核心字段列举}）
- 修改表：{表名}（{变更说明}）

### 接口清单
- POST /api/{路径}：{一句话功能}
- GET /api/{路径}：{一句话功能}

### 模块划分
- 前端：{模块名} / {模块名}
- 后端：{模块名} / {模块名}

### 共享组件建议
- {组件名}（{前端/后端/全栈}）：{一句话说明}
```

🚫 等用户确认骨架方向（模块划分、接口粒度、共享组件方向）

---

## 第二层：结构层（完整契约）

### Step 3：写完整 TRD

骨架确认后，逐段写完整 TRD，**每段写完后报告进度**：

**§ 技术选型变更**：仅写本期新增；格式：依赖 / 版本 / 用途 / 选型理由。迭代项目不重复已有。

**§ 数据库设计**：每表独立块，含：字段名 / 类型 / 约束 / 索引 / 外键。PRD 每个数据实体必须有对应表。

**§ 接口设计**：每接口含：路径 / 方法 / 鉴权要求 / 请求体字段 / 响应体字段 / 错误码清单。

**§ 测试环境约定**（不可省略）：后端地址 / 前端访问方式 / 数据库指向 / 有副作用操作的禁止清单。

**§ 交互技术方案**：仅写有技术含义的交互（轮询 vs WebSocket / 复杂状态流转 / 跨模块数据共享）。

**§ 模块拆分**：前后端各自模块职责边界，标明模块间调用方向。

**§ 共享组件建议**：表格格式，引用 reusables.md 已有资产（标"已有，建议复用"），新建议标明路径。

```
✅ TRD 完成：[接口数量] 个接口，[表数量] 张表，[模块数量] 个模块，共享组件建议 [数量] 条。
→ 下一步：生成三份 standards — 执行层约束文档
继续？
```

🚫 等用户确认 TRD 内容，有修改则改完再继续

---

## 第三层：执行层（Standards）

### Step 4：生成三份 Standards

TRD 确认后，启动 **2 个并行 subagent** 生成 frontend / backend standards；主线同时生成 shared。

**Standards 来源规则**（双源：公共模板 + 执行人个人 notes）：
- 首期：从 `../hact-method/templates/standards/{layer}.md` 挑选本期 TRD 相关项，不全量复制
- 迭代：以上期 `iterations/vN-1/standards-*.md` 为基础，按本期 TRD 增量追加或修订
- **双源补充**：再取执行人个人 notes（`../hact-notes-{name}/notes.md`）中 `[规范]` 标签、与本 layer 相关的条目并入本期 standards——让本人已积累、尚未经 harvest-notes 上提的规范当期即生效
  - **去重**：并入前对照公共模板 + 上期 standards，**已收录的同条目不重复并入**（避免 vN+1 重复注入），只补未收录的
  - notes 不存在 / 无 `[规范]` 条目 → 仅用公共模板 + 上期 standards
  - 与上期 standards 同项但建议不同 → 保留上期版本，把不同建议记入 `feedback.md` 走分流，不当场覆盖

> **适用前提（设计甲）**：当前架构 / 开发高度重叠，draft-tech-design 执行人 ≈ 本期真实开发者，故在生成端注入本人 notes 即覆盖实际写代码的人。团队分化后是否扩展到 develop / code-review 加载端（设计乙），见 `../hact-method/_meta/plans/方法论待议.md`。

**Subagent prompt 要点**（frontend / backend 各一份）：
- 传入：TRD 完整内容 + 对应 `../hact-method/templates/standards/{layer}.md` + 上期 standards（如有）+ 执行人个人 notes 中本 layer 相关的 `[规范]` 条目
- 输出：本期适用的规范条目，格式与模板一致，不生成模板中没有的条目类型；并入 notes 条目前先对照公共模板 / 上期 standards 去重
- 主线负责写文件，不让 subagent 直接写文件

主线生成 `standards-shared.md`（命名规范 / 错误码 / API 响应格式 / 权限模型）。

三份汇总后检查：无重复条目 / 无相互矛盾 / 覆盖 TRD 提到的所有关键约束。

**Subagent 失败判定**：以下任一情况视为失败，主线接管该份 standards：
- subagent 返回内容为空或格式完全不符合模板结构
- subagent 返回内容包含大量与 TRD 无关的通用规则（未基于 TRD 提炼）
- subagent 运行超时或报错

主线接管时：直接基于 TRD 对应层（frontend/backend）的相关章节手动生成该份 standards，记录原因。

---

### Step 5：知识沉淀

更新 `decisions.md`，追加本期关键架构决策（格式：决策 / 原因 / 日期）。

更新 `project.md` 技术层（技术选型 / 数据库结构 / 模块划分）。

---

### Step 6：G2

```
✅ TRD + standards 完成：TRD [N] 段，standards 三份（shared / frontend / backend），decisions.md 已更新。
要签 G2 吗？
```

🚫 等用户确认

用户确认 → 写 `iterations/vN/gates.md`：
```markdown
- [x] G2：TRD 已确认 — {YYYY-MM-DD}
```
执行 `git add iterations/vN/trd.md iterations/vN/standards-shared.md iterations/vN/standards-frontend.md iterations/vN/standards-backend.md iterations/vN/gates.md && git commit -m "feat(trd): v{N} TRD + standards 完成，G2 签署 [{项目名}]" && git push`

**feedback 检查**（签 G2 后）：
- 疑点清单超过 5 条且多条根因相同（如 PRD 对某类场景描述方式有共性问题）→ 写入 `feedback.md`（格式：`{日期} | {发现} | 建议在 draft-prd-vN 的开放问题清零步骤中加强 {具体环节}`）
- standards 生成后发现与 TRD 有明显脱节（需要大量人工修正）→ 写入 `feedback.md`
- 无发现 → 跳过

移交：「TRD 完成，下一步 `plan-sprint`。」

---

## 红线

- **禁止省略测试环境约定段**：TRD 中「测试环境约定」是必填段，无论项目大小
- **禁止跳过疑点清单确认**：疑点清单未经用户逐条确认前不开始写 TRD
- **禁止自行补全 PRD 遗漏**：PRD 有歧义或缺失时，列入疑点清单等用户确认，不自行假设填写

---

## Subagent 使用

| 触发点 | Subagent 任务 | 失败处理 |
|--------|-------------|---------|
| 会话启动 | Explore 并行读 6 份输入文件 | 读取失败则主线单独读，不阻断 |
| Step 4 standards 生成 | 2 个并行 subagent 各生成一份 | 失败则主线接管该份，记录原因 |

---

## 上下文管理

- Step 2（TRD 骨架确认后）做一次 compact，再开始写完整 TRD——骨架确认是探索讨论阶段的天然终点，写作阶段需要保持各段内部一致性
- compact 前在 `_meta/sessions/draft-tech-design-progress.md` 记录：疑点清单各条答案摘要 + TRD 骨架（接口列表 / 模块划分 / 共享组件）

**断点续做**：
- 读 `iterations/vN/trd.md` 判断写到哪一段（按 7 段结构对照）
- 读 `iterations/vN/standards-*.md` 判断哪几份已完成
- 读 `iterations/vN/gates.md` 判断 G2 是否已签
- 从未完成的段落或文件继续
