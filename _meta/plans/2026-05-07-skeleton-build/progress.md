# 会话日志 · hact-method 骨架搭建

## 2026-05-07 仓库初始化

**前置**：human-ai-col `_meta/plans/2026-05-06-method-optimization/` 完成方法论重构讨论，决定独立建仓而非在原仓内并行。

**完成内容**：
- 新仓 `E:\group-code\hact-method\` 创建并 `git init`
- 写入 CLAUDE.md / BRIEF.md / STATUS.md
- 8 个顶级目录骨架（skeleton/ specs-structural/ specs-execution/ product/ tech/ projects/ templates/ _meta/）已建（用 .gitkeep 占位）
- 本 plan 创建，`_meta/.current_plan` 指向本目录
- 旧仓 STATUS.md 加冻结声明，旧仓本期 plan 加收尾日志

**下次起点**：列骨架文档清单（任务 0），跟用户对一遍后开始写。

**关键决策（不要绕回）**：见 BRIEF.md 关键设计决策清单。

---

## 2026-05-07 目录结构调整（仓库初始化后立即调整）

**触发**：用户问"product / tech / projects 三个目录的用途是什么"——戳到一个直接搬 v1 时没仔细想的点。

**问题**：BRIEF.md 沿用的 product/ tech/ projects/ 三分目录是 v1 角色风结构，跟 v2 任务驱动模型有冲突——product/ 命名隐含"产品助手固定工作区"，但 v2 没有这个角色概念。

**决定**：选项 C（迭代一等公民）
- 取消 product/ 和 tech/
- 项目编排切法：`projects/{项目}/iterations/vN/` 装迭代内产物，跨迭代产物（decisions / reusables / design / backlog / feedback / b-tasks）留项目根
- 决策动机：未来 hact-app 数据模型是 projects → iterations → sprints/tasks，目录跟 schema 同构，写规范和写代码命名摩擦最小

**改动文件**：
- 删除 product/ tech/ 两个空目录
- BRIEF.md：关键设计决策 #17 加入
- CLAUDE.md：项目根目录规则 + projects/ 子结构说明
- STATUS.md：已决策 + 历史里程碑（新增"目录结构调整"条）

**下次起点不变**：任务 0（列骨架文档清单）。

---

## 2026-05-07 骨架文档清单 + 03 重新定位（任务 0）

**讨论过程**：

1. 初稿列了 7 份文档（含 03-roles.md "5 角色作为任务工具书"）
2. 用户挑战"角色"作为骨架一等公民——3 个具体问题：（a）"角色"这词是否恰当；（b）任务远超 5 个、不再一对一映射；（c）保留分组层意义何在
3. 第一次重构：03 改为 disciplines（职责面），保留 5 个数字、保留 v1 映射、显式表达 M:N
4. 用户再次挑战 3 点：（a）为什么固定 5；（b）既然角色被抛弃为什么还要 v1 映射；（c）M:N 已在 04 字段表达，03 是否还需要讲
5. 第二次重构（最终）：
   - 取消 5 这个先验数字（数量由 04 任务聚类涌现）
   - 删除 v1 角色映射（v2 文档不应消费 v1 概念）
   - 03 不讲 M:N，只定义 discipline 内涵——M:N 由 04 数据自然表达

**最终决定**：

- 7 份骨架文档（01-06 + README）
- 03-disciplines.md = 知识聚类的定义文档（不是清单文档）
- 03 + 04 写作合并：先草拟 04 任务清单 → 自然聚类成 disciplines → 写 03 定义 → 回 04 补 disciplines 字段

**BRIEF.md 决策更新**：

- #1 旧："角色清单 5 个：..." → 新："摒弃角色身份模型，改用 discipline 知识聚类"
- 新增 #18：task ↔ discipline 是 M:N（schema 层是数组字段）

**写作顺序**：01 → 02 → (03+04 合并) → 05 → 06 → README → 自检

**任务 0 完成**。下一步开写 `01-identity.md`。

---

## 2026-05-07 权限模型重新设计（01 Section 3 重写）

**触发**：用户挑战 01 Section 3 复用 hact v1 的 `manager`/`developer` 二态——v1 没真正建模权限（单 manager + 单 developer 假设），v2 复用必出问题。

**分析**：
- v1 实际场景：1 manager + 1 developer。二态是"老板 + 小工"模式
- v2 是 5-8 人团队 + 任务驱动 + discipline 模型：PM、架构师、devmgr 三个不该都是 manager 也不该都是 developer
- v2 真正要回答 4 层权限：(1) 能不能登录、(2) 能拉哪类任务、(3) 拉到后能改什么、(4) 管理性操作允许；v1 用 manager/developer 模糊处理 1+4，2/3 没建模

**最终决定（候选 A）**：
- 废弃 `user.role` 字段
- 新增 `user_disciplines (user_id, discipline_id)` junction
- 拉取准入 = `task.disciplines ∩ user.disciplines ≠ ∅`（任一即可）
- 任务级写权限由 taken-by 决定
- 管理性操作（立项 / 签 Gate / 调方法论）作为 disciplines 含 `management` 的任务存在，不另开后门

**为什么不选 B（保留 user.role 二态作系统级 + 加 user_disciplines 作业务级）**：
- 系统级权限是 hact-app 产品自己的事，方法论文档不该管
- 在骨架里写两层划分反而越界

**为什么不选 C（ABAC 现场判断）**：太复杂，备选不首选

**改动**：
- 01 Section 3 重写（"users.role 退化"改为"权限通过 user-discipline 关联表达"）
- BRIEF.md 加决策 #19：权限模型 = user-discipline 关联
- 03 disciplines 清单要含 `management`（task_plan 任务 3 注明）
- hact-app schema 改造延后到 hact-app v2 落地时处理

**搁置**：
- 跨学科任务（disciplines = [devmgr, pm, architect]）的拉取规则——任一即可 vs 必须全部？倾向"任一"，hact-app 真做时回来敲
- `management` 这个 discipline 的最终命名（可能改为 `governance` / `admin` 等），写 03 时定

---

## 2026-05-07 02-workspaces.md 完稿（任务 2）

**结构**（6 节，约 110 行）：
1. 三个工作区按"心态"切割（父级 / 项目根 / dispatch）
2. 父级（方法论心态）—— 触发场景 + 典型任务 + 文件权限
3. 项目根（编排心态）—— 同上 + 强调"一个心态、两个物理位置"（协调侧 + 代码侧）
4. dispatch（循环心态）—— 强调物理形态可文件式可 web 式（跟实施走）
5. 心态切换 = 开新 CC 会话；跨工作区身份不变（链 01）
6. 跨工作区边界处理表（含修订 / Gate 5 / 部署 / B 类入口 / 方法论提案 5 种场景）

**关键设计点**：
- 工作区切的是"心态"不是"身份"——任何用户都可以在三种心态间切换
- 项目根的"两个物理位置"（协调侧 hact-method/projects/{}/ + 代码侧仓库根）是同一心态
- dispatch 物理形态不强制（queue/*.md 文件式 / hact-app web 式）
- 边界冲突核心原则：心态由"做什么"决定，不由"在哪个目录"决定

**任务 2 完成**。下一步：任务 3（03-disciplines.md + 04-task-catalog.md 合并写）——这是骨架最重的一份。

---

## 2026-05-07 02 §6 补充

**触发**：用户读 02 §6 核心原则觉得后半句"如果...回项目根执行"不够直观，要更详细的解释。

**补充内容**：
- 把"核心原则"改为子节"触发点 ≠ 执行点"
- 加一个具体例子（dispatch 写 feature 时发现 PRD 有歧义）
- 4 个"为什么不就地做"的理由：规范加载错位 / 审计可追溯 / 状态污染 / 摩擦是设计的

**没改**：§6 边界处理表保持原样（已经够清楚）。
