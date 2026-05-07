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

---

## 2026-05-07 任务 3 step 1+2：27 task → 7 discipline 聚类 + 路径 X 决策

### Step 1：27 task 全谱（敲定）

按生命周期分组：

| 段 | task |
|---|---|
| 父级 (2) | init-project, adjust-method |
| A 类·准备 (10) | draft-prd-vN, sign-gate-1, revise-prd, draft-trd-vN, sign-gate-2, revise-trd, write-standards, revise-standards, plan-sprint, sign-gate-3 |
| A 类·开发循环 (8) | feature, fix, code-review, generate-integration-tests, fix-integration, **acceptance**（用户加的 Gate 4 联调后人工验收任务）, fix-acceptance, sign-gate-4 |
| A 类·收尾 (3) | deploy, wrap-up-iteration, sign-gate-5 |
| B 类 (4) | dispatch-bug, dispatch-optimization, fix-bug, optimization |

属性：urgency=normal/hotfix；layer=frontend/backend/shared/null。

5 个待议点的回答：
- sign-gate-N: 5 个独立 type ✓
- code-review: 是任务（CR 主体不在 CC）✓
- 人工验收: 加 acceptance 任务 ✓
- Gate 准备就绪判定: 自动判定，不单独 task ✓
- 派 hotfix: 不单独 type，是 urgency 属性 ✓

### Step 2：7 discipline 聚类

| discipline | 命名理由 |
|---|---|
| `management` | 治理 / 方法论维护 / 立项 |
| `product` | 产品需求 / 用户视角验证 |
| `architecture` | 技术架构 / standards |
| `dispatch` | 任务派发 / 协调 / CR |
| `dev-frontend` | 前端开发 |
| `dev-backend` | 后端开发 |
| `deploy` | 部署运维 |

Q4 应用：sign-gate-N 分散到内容对应的 discipline——sign-gate-1=product / sign-gate-2=architecture / sign-gate-3..5=dispatch。management discipline 因此变瘦，只剩 init-project + adjust-method + wrap-up-iteration。

### 路径决策：X（1:N）vs Y（M:N）

**用户挑战**：27 task 里跨学科只有 6 个，M:N 这层复杂度真的值吗？

**讨论过程**：
1. 用户提议合并 dispatch-bug + dispatch-optimization 的 disciplines（两者本来都是 [product, dispatch]，可以都简化为 [dispatch]，因为"派"的核心是包装动作，不是 product 判定）
2. 我重新审视其他跨学科 task：
   - generate-integration-tests 可 collapse 到 [dispatch]
   - write-standards (shared) 可 collapse 到 [architecture]
   - 真"难拆"的只剩 wrap-up-iteration
3. 我提出 X / Y 两条路径：
   - X：纯 1:N，跨学科信息进 spec 文本
   - Y：保留 M:N
4. **用户选 X**，并明确 **wrap-up-iteration 不拆子任务**——理由：实践中 3 步合在一起 1 分钟内完成，拆子任务过度

### 最终 27 task 的 discipline 分配

| discipline | task |
|---|---|
| `management` | init-project, adjust-method, wrap-up-iteration |
| `product` | draft-prd-vN, revise-prd, sign-gate-1, acceptance |
| `architecture` | draft-trd-vN, revise-trd, write-standards, revise-standards, sign-gate-2 |
| `dispatch` | plan-sprint, code-review*, generate-integration-tests, sign-gate-3, sign-gate-4, sign-gate-5, dispatch-bug, dispatch-optimization |
| `dev-frontend` | feature/fix/fix-integration/fix-acceptance/fix-bug/optimization (layer=frontend) |
| `dev-backend` | (同上, layer=backend) |
| `deploy` | deploy |

*code-review 待 Q3 最终确认，暂归 dispatch

### 改动

- BRIEF.md 决策 #18 改写：M:N → 1:N (task 侧) + M:N (user 侧)
- BRIEF.md 决策 #19 拉取规则更新：`task.disciplines ∩ user.disciplines ≠ ∅` → `task.discipline ∈ user.disciplines`
- 01-identity.md Section 3 同步更新

**Step 2 完成**。下一步 Step 3：写 `03-disciplines.md`（7 discipline 完整定义）。

---

## 2026-05-07 任务 3 step 2 终稿（多轮迭代后定稿 12 task / 9 discipline）

step 2 经过多轮快速迭代。从 27 task 降到 12 task，从 7 discipline 扩到 9 discipline。基底由 M:N 改为 1:N（路径 X）。

### 简化轨迹

| 决策 | task 数 | 备注 |
|---|---|---|
| 起点（用户加 acceptance） | 27 | |
| 路径 X（task→discipline 1:N） | 27 | 不改 task 数，只改 schema |
| sign-gate-N 合并到前置任务（G4=A） | 22 | 5 个 sign-gate 撤掉 |
| 6 dev task → 1 `develop`（source 区分） | 17 | source/urgency/layer 作 attribute |
| dispatch-bug + dispatch-optimization → `dispatch-new` | 16 | target-source 区分 |
| draft-trd + write-standards → `draft-tech-design` | 15 | 一个 task 出 4 份产物（TRD + 3 standards） |
| 3 revise → 1 `revise-doc`（target 派生 discipline） | 13 | 与 develop 同模式 |
| 移除 adjust-method | **12** | 复杂动作不强行预定义 |

### Discipline 演变 7 → 9

- `code-review` 从 dispatch 拆出 → 独立 `review` discipline
- `generate-integration-tests` 从 dispatch 拆出 → 独立 `integration-testing` discipline
- 理由：dispatch 一锅炖了 4 个任务（plan-sprint / code-review / gen-int-tests / dispatch-new），CR 和 int-tests 是独立专业活，不该跟 dispatch 抢。dispatch 瘦回到 2 个 task（纯协调动作）

### 命名调整

- `acceptance` 名字有歧义（UAT / 接受准则 / 交付验收都能套）→ 改名 `manual-test`
- `develop.source=acceptance` 同步改为 `source=manual-test`

### 最终 12 task / 9 discipline

| # | task | discipline | Gate |
|---|---|---|---|
| 1 | init-project | management | — |
| 2 | draft-prd-vN | product | G1 |
| 3 | draft-tech-design | architecture | G2 |
| 4 | plan-sprint | dispatch | G3 |
| 5 | revise-doc | product/architecture（target 派生） | — |
| 6 | develop | dev-frontend/dev-backend（layer 派生） | — |
| 7 | code-review | review | — |
| 8 | generate-integration-tests | integration-testing | — |
| 9 | manual-test | product | G4 |
| 10 | deploy | deploy | — |
| 11 | wrap-up-iteration | management | G5 |
| 12 | dispatch-new | dispatch | — |

### 衍生原则（写进 BRIEF.md 决策 #20）

复杂到无法预定义清晰 spec 的工作不强行做成 task type。任务驱动模型不要求"所有动作都是任务"，只要求"被反复执行的、有清晰 spec 的动作是任务"。例：方法论调整本身发散，由有 `management` discipline 授权的 user 在父级工作区按需做，无 task 包。

### Schema 派生 discipline 的两个特例

| task | 派生维度 | 取值 |
|---|---|---|
| `develop` | layer | frontend → dev-frontend / backend → dev-backend |
| `revise-doc` | target | prd → product / trd → architecture / standards → architecture |

实施：task 创建时把派生结果写到 `task.discipline` denormalized 字段。

### 文档同步改动

- BRIEF.md：决策 #19 改写（去 adjust-method、把 sign-gate 描述切到合并后形态）；新增决策 #20（复杂工作不强行预定义）
- 01-identity.md Section 2 例子 + Section 3 管理性操作小节同步更新（去 adjust-method / feature / fix-cr 引用，加例外段）
- 02-workspaces.md §2-§6 多处更新：父级"典型任务"去掉 adjust-method 加"无 task 包活动"；§3 项目根典型任务改用合并后的 task 名；§4 dispatch 同；§5 §6 的 feature/revise-prd 例子改用 develop/revise-doc

**Step 2 终稿完成**。下一步 Step 3：写 `03-disciplines.md`（9 discipline 完整定义 + 边界 + 典型工作）。

---

## 2026-05-07 任务 3 step 3+4：03-disciplines.md + 04-task-catalog.md 完成

### Step 3: `03-disciplines.md` 落地（169+ 行）

结构：
- 什么是 discipline（概念定义 + 用途 + 它不是什么）
- 9 个 discipline（每个：范围 / 边界 / 典型工作）
- 派生 discipline 的两个特例（develop / revise-doc）
- **CC 上下文管理**——按经验粗分三档（高 / 中 / 低），让 specs-execution 作者知道哪里重点设计 subagent 协议（用户在 step 3+4 中途加的）
- 边界（链 04 / 01 / 05 / 06 / 02）

### Step 4: `04-task-catalog.md` 落地

结构：
- 总览表（12 task × 段 / discipline / Gate）
- 通用属性定义（urgency / layer / source / target / target-source / version / pr-link）
- 12 task 完整定义（每个：discipline / 完成判据 / 主要产物 / 关联 Gate / 前置条件 / 属性 / 加载规范分支）

每个 task 给"简表契约 + 指向 specs-structural/{task}.md"——具体边界场景、错误处理等留给第二阶段写的 specs-structural。

### 衍生说明

中途用户提了一个实操问题："dispatch 工作区的循环任务吃 CC 上下文很厉害，03 要不要声明哪些 discipline 用 subagent？"

我的判断：**该声明，但只声明哪些 discipline 是高密度，具体策略留 specs-execution**——03 的抽象级别是"是什么"，不是"怎么做"，混着写会让 03 失焦。最终在 03 末尾加了一个密度三档表，作为给 spec 作者的 heat map。

### 衍生改动

- 03 末尾加 CC 上下文管理小节
- 04 完整新建（约 220 行）
- task_plan.md 任务 3 状态 → ✅；任务 4 → ⏸️ 下一步
- 下一步起点更新

### 任务 3 完成。下一步：任务 4 写 `05-state-machine.md`。

骨架进度：1 ✅ / 2 ✅ / 3 ✅ / 4 ⏸️ / 5 ⏸️ / 6 ⏸️ / 7 ⏸️

---

## 2026-05-07 任务 4：05-state-machine.md 完成

结构（9 节，约 200 行）：

1. **状态枚举**（6 个）：可取 / taken-by / done / paused-by-deviation / paused-by-cr / merged
2. **状态流转**（transitions 表）：覆盖 12 种主要转移
3. **软锁机制**：文件式 vs web 式实现 + 冲突处理（后到者重选）
4. **主动放弃**：触发场景 + 操作要求 + 禁止默删
5. **召回**：dispatch user 主动；触发场景 + 安全保障
6. **双向暂停**：6a 开发者声明偏离 / 6b CR 严重问题
7. **跨任务的状态联动**：develop ↔ code-review 双向影响 + 任务前置检查
8. **状态机 vs Gate**：状态机管单 task 生命周期，Gate 是集合聚合（链 06）
9. **边界**：链 04 / 06 / 01 / 02

关键设计点：
- **没有自动释放 / 心跳**——拉到一直持有，长期无进展由召回机制处理
- **软锁不靠分布式锁**——文件式靠 git push 时序，web 式靠 DB UPDATE WHERE 条件
- **冲突极少发生 + 后到者重选**——不做重试 / 排队 / 锁等待
- **paused-by-deviation 触发 revise-doc**——双向暂停跟 04 的 revise-doc 任务链路打通
- **状态机 vs Gate 正交**——单 task 生命周期 vs 集合聚合

骨架进度：1 ✅ / 2 ✅ / 3 ✅ / 4 ✅ / 5 ⏸️ / 6 ⏸️ / 7 ⏸️

---

## 2026-05-07 任务 5/6/7 一次性执行完成 + 第一阶段收尾

### 任务 5：06-gates.md（约 113 行）

7 节结构：
1. 5 Gate 内涵（G1 PRD / G2 TRD+standards / G3 开发包就绪 / G4 开发完成 / G5 迭代收尾，每个 Gate 明确签于哪个 task）
2. Gate 是任务集合的聚合视图（每个 Gate 关联的 task 集合）
3. Gate 子状态（未开始 / 进行中 / 阻塞 / 待签 / 已签）——UI 展示用，不是状态机层面
4. A 类 vs B 类（A 类 5 Gate / B 类无 Gate；表格对比 6 维度）
5. 多迭代并行（vN+1 准备段可并行 vN G4 开发段，开发段串行）
6. Gate 与修订的关系（已签 Gate 不撤销）
7. 边界

### 任务 6：README.md（约 52 行）

骨架目录入口：6 文档阅读顺序 + 6 条核心设计原则 + 跟其他目录的关系图 + 第一阶段完成标志 + 下游文档预期。

### 任务 7：骨架自检

#### 完成标志覆盖（8 项）

| # | 完成标志 | 文档 | 状态 |
|---|---|---|---|
| 1 | 用户唯一身份模型 + 跨工作区身份打通 + users.role 权限标记 | 01 §1-§4 | ✅ |
| 2 | 项目根/dispatch/group-code 父级 三种工作心态边界、文件读写权限 | 02 §1-§6 | ✅ |
| 3 | discipline 知识聚类定义；每个 discipline 的范围/边界/典型工作 | 03 §1-§4 + §派生 + §CC 上下文管理 | ✅ |
| 4 | 12 task 清单 + 字段（discipline / 完成判据 / 产物 / 关联 Gate / 属性） | 04 §1-§3 + 12 task 详定 | ✅ |
| 5 | 状态枚举 + 流转规则 + 软锁 + 异常转移 | 05 §1-§7（4 状态简化版） | ✅ |
| 6 | 5 Gate 内涵 + 子状态聚合 + A 类 5 Gate vs B 类无 Gate | 06 §1-§7 | ✅ |
| 7 | README.md 入口导读 | README.md | ✅ |
| 8 | 骨架自检通过（覆盖度 + 互引一致性） | 本节 | ✅ |

#### 互引一致性

| 引用方向 | 验证 |
|---|---|
| 01 → 02（跨工作区身份不变） | 02 §1 三个工作区定义 ✅ |
| 01 → 03（discipline 概念） | 03 §1 概念定义 ✅ |
| 01 → 04（task.type 路由） | 04 12 个 task 全列 ✅ |
| 01 → 05（软锁机制） | 05 §3 软锁定义 ✅ |
| 02 → 04（典型任务列表） | 02 各 § 引用的 task 全部在 04 存在 ✅ |
| 02 → 05（状态字段引用） | 05 4 状态定义 ✅ |
| 02 §6 → 04 revise-doc | 02 §6 举例引用 revise-doc(target=prd)，04 §5 存在 ✅ |
| 03 → 04（派生 discipline） | 04 develop / revise-doc 用了派生模式 ✅ |
| 04 → 03（discipline 引用） | 03 9 discipline 全列 ✅ |
| 04 → 05（状态字段） | 05 4 状态枚举 ✅ |
| 04 → 06（关联 Gate） | 06 5 Gate + 各 task 关联清单 ✅ |
| 05 → 04（任务前置检查） | 04 §"任务前置检查" 存在 ✅ |
| 05 → 06（状态机 vs Gate） | 06 整体描述 Gate 是聚合 ✅ |
| 06 → 04（关联 task 集合） | 04 12 task 全列 ✅ |
| 06 → 05（状态聚合） | 05 状态枚举存在 ✅ |

#### 概念一致性

| 概念 | 文档间一致性 |
|---|---|
| 9 个 discipline 列表 | 03 §"9 个 discipline" 9 个段（management / product / architecture / dispatch / review / integration-testing / dev-frontend / dev-backend / deploy）+ 04 各 task discipline 字段 ✅ |
| 12 个 task | 04 §1-§12 + 02 各 § 典型任务 + 06 关联任务 ✅ |
| 4 个状态 | 05 §1（可取 / taken-by / done / merged）+ 04 + 02 引用 ✅ |
| 5 个 Gate（G1-G5） | 06 §1 + 04 各 task "含 Gate 签字" 字段 ✅ |
| path X（1:N task→discipline） | BRIEF.md #18 + 01 §3 + 03 §派生 ✅ |
| 异常转移 | 05 §4 + 02 §6 + 04 revise-doc 触发段 ✅ |
| Gate 签字合并到前置 task | 06 §1 + 04 各任务"含 Gate 签字"字段 ✅ |

#### 自检发现 + 修复

**1 处不一致已修**：04 `wrap-up-iteration` 的"前置条件"写"G4 已签 + deploy 完成"，但 06 §2 表明 deploy 与 wrap-up 都是 G5 关联任务可并行。改为"G4 已签（与 deploy 并行可执行，无依赖）"。

#### 遗留 / 后续待办

| 项 | 何时做 |
|---|---|
| `specs-structural/{task}.md` 12 份 | 第二阶段 |
| `specs-execution/{task}.md` 12 份 + subagent 协议 | 第四阶段 |
| hact-app schema 实施验证（验证 path X / user_disciplines / 4 状态等） | 第三阶段 |
| `templates/standards/` + `templates/project/` 模板 | 第二阶段后期 / 实施时按需 |

---

## 第一阶段·搭骨架 完成（2026-05-07）

骨架进度：1 ✅ / 2 ✅ / 3 ✅ / 4 ✅ / 5 ✅ / 6 ✅ / 7 ✅

**下次起点**：第二阶段·结构层规范——基于 `skeleton/04-task-catalog.md` 列出的 12 个 task type，依次写 `specs-structural/{task}.md`，覆盖完整契约（含 04 之外的边界场景、错误处理、字段细节）。建议优先写高频 task：先 develop / code-review，再 draft-prd-vN / draft-tech-design / plan-sprint，再其他。

新会话进入 hact-method 时，建议先建一个新 plan：`_meta/plans/2026-05-XX-specs-structural/`，本 plan（`2026-05-07-skeleton-build/`）作为第一阶段历史记录留存。

---

## 2026-05-07 任务 4 简化：05-state-machine.md 6 状态 → 4 状态

**触发**：用户读完 05 觉得 §4（主动放弃）/ §5（召回）/ §6（双向暂停）三段过度设计——"团队小，好沟通"，早期阶段不需要这么形式化。

**讨论**：
1. 我提议简化方向——4 状态（去掉 paused-by-deviation, paused-by-cr）+ §4-§6 合并成一短段
2. 用户同意简化方向，并把节名"非主流转移"改为"异常转移"

**简化结果**：

| 项 | Before | After |
|---|---|---|
| 状态枚举 | 6（含 paused-by-deviation, paused-by-cr） | 4（去掉两个 paused 状态）|
| 阻塞表达 | 独立状态 | `taken-by` + free-text "阻塞原因" 字段 |
| §4§5§6 | 三段独立的回退/召回/暂停规范（约 70 行） | 合并成 §4 异常转移（约 25 行）|
| 区分"主动放弃 vs 被召回 vs 暂停" | 三种独立 transition | 一种 transition：任意非 merged → 可取 + 写理由 |
| 形式化"恢复路径" | 有详细规定 | 不形式化——讨论清楚下一个 user 重新拉 |
| 篇幅 | 约 200 行 | 约 130 行 |

**关键设计**：
- 异常转移机制只一条："任意非 merged task 可改回 可取，前提是写理由"
- 操作要求：改 status + 写理由 + push + 告诉相关人（团队小，发消息）
- 已有产出（代码改动 / commit）由后续接手者评估保留或丢弃
- 升级路径：团队扩大 / 跨时区 / 自动化需求时再引入更细状态

**衍生改动**：
- 04 revise-doc 触发段落：去掉 `[paused-by-deviation]` 引用，改为"通过异常转移回退到可取"
- 04 revise-doc 完成判据：去掉 `[paused]` 引用
- 02 §6 举例段：把"标 [paused-by-deviation]"改为"通过异常转移回退到可取 + 写阻塞理由"
- 05 整体重写

骨架进度不变：1 ✅ / 2 ✅ / 3 ✅ / 4 ✅ / 5 ⏸️ / 6 ⏸️ / 7 ⏸️
