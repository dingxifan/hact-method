# 02 — 工作区

> **本文回答**：v2 有几个工作区？每个工作区是什么"心态"？文件读写权限的边界？
>
> **不回答**：有哪些任务（→ `04-task-catalog.md`）；任务状态怎么流转（→ `05-state-machine.md`）。

---

## 1. 三个工作区，按"心态"切割

工作区切的**不是"谁"**——是"做什么类型的事时所处的心智状态"。同一用户可以在不同心态间切换，每次切换 = 开新 CC 会话，进对应的工作目录。

| 工作区 | 心态 | 物理形态 |
|---|---|---|
| **父级** | 方法论 | `E:\group-code\`（容器目录） |
| **项目根** | 编排 | `hact-method/projects/{项目}/` + 对应代码仓根目录 |
| **dispatch** | 循环 | 项目代码仓内的 `queue/*.md` 或 hact-app web 界面（跟实施走） |

---

## 2. 父级（方法论心态）

**触发场景**：调整方法论 / 跨项目浏览 / 立新项目。

**典型任务**（详见 04）：
- `init-project`（立项）
- 纯读浏览（无任务实体）

**无 task 包的活动**：
- 方法论调整（改 skeleton / specs / templates / BRIEF / 等）——**发散性工作，不预定义为 task type**，由有 `management` 授权的 user 直接做（BRIEF.md 决策 #20）

**文件权限**：
- **可写**：`hact-method/` 自身所有文件（skeleton / specs-* / templates / CLAUDE / BRIEF / STATUS）
- **可读**：`hact-method/projects/*` 下所有项目的编排状态
- **不写**：具体项目的代码

---

## 3. 项目根（编排心态）

**触发场景**：写 PRD / TRD / 签 Gate / 规划迭代 / 跑部署 / 修订上一关。

**典型任务**：
- `draft-prd-vN`（含 G1 签字）
- `draft-tech-design`（含 G2 签字；出 TRD + 3 份 standards）
- `revise-doc`（修订归项目根，详见 §6）
- `plan-sprint`（含 G3 签字）
- `manual-test`（含 G4 签字）
- `deploy`（部署归项目根，详见 §6）
- `wrap-up-iteration`（含 G5 签字）

**工作目录**（一个心态、两个物理位置）：
- **协调侧**：`hact-method/projects/{项目}/` —— PRD / TRD / iteration Gate 状态 / decisions / design / b-tasks
- **代码侧**：项目代码仓根目录 —— 部署配置（如 `deployment.config`）等编排级文件

**文件权限**：
- **可写**：协调侧 `hact-method/projects/{项目}/` 下所有 + 代码侧的编排级文件
- **可读**：`hact-method` 自身规范文件（skeleton / specs / templates）
- **不写**：`hact-method` 自身规范、其他项目的目录

---

## 4. dispatch（循环心态）

**触发场景**：拉任务 / 写代码 / 推 PR / 处理 CR / 派 BUG / 派优化。

**典型任务**：
- `develop`（开发循环；source 区分 sprint / integration / manual-test / bug / optimization；urgency=hotfix 时是热修）
- `code-review`（PR 复核）
- `generate-integration-tests`（联调脚本生成）
- `dispatch-new`（B 类入口：派新 BUG / 优化任务；BRIEF.md 决策 #5）

**物理形态**：
- **文件式**：项目代码仓内的 `queue/*.md` 任务包文件
- **web 式**：hact-app web 界面（hact-app v2 上线后可选）
- 跟着每个项目的实施选择走——骨架不强制单一形态

**文件权限**：
- **可写**：项目代码仓的代码 + 任务的状态字段（具体取值见 `05-state-machine.md`）
- **可读**：`hact-method` 自身规范（按当前 task.type 加载对应 spec）、PRD / TRD（只作背景理解）
- **不写**：`hact-method` 自身规范、PRD / TRD（修订回项目根，详见 §6）

---

## 5. 心态切换 = 开新会话

工作心态**不是用户固有属性**——是用户当前活动决定的：

- 同一用户上午在父级调整方法论 → 关 CC 会话
- 下午进项目根做 `draft-tech-design` → 开新 CC 会话，新工作目录
- 晚上进 dispatch 拉 `develop` → 又一个新 CC 会话

CC 启动协议在不同工作目录下读到不同的 `CLAUDE.md` 和状态文件，自动识别当前心态，给出对应推荐——这是"心态由活动驱动"的物理体现。

跨工作区的**身份不变**（见 `01-identity.md`）；切换的只是**工作目录** + **加载的规范集**。

---

## 6. 跨工作区边界的处理

会出现"看起来跨工作区"的场景。归属规则：

| 场景 | 归属 | 理由 |
|---|---|---|
| 修订已签 Gate 的产物（如 PRD 已签 G1 要改） | **项目根** | 修订归项目根（BRIEF.md 决策 #11）。dispatch 里发现需要修订时，回项目根做，不就地改 |
| Gate 5 收尾要更新 standards / decisions | **项目根** | Gate 5 由 devmgr 兼任执行，但反向沉淀产物仍是编排心态 |
| 部署（hotfix / 合并部署 / 单期部署，全包） | **项目根** | 部署一律归项目根（BRIEF.md 决策 #9） |
| 派新 BUG / 派新优化（B 类入口） | **dispatch** | B 类入口在 dispatch（BRIEF.md 决策 #5），不在父级 |
| 跨项目方法论调整提案（method-pending） | **父级** | 任何方法论文件改动都在父级 |

### 核心原则：触发点 ≠ 执行点

心态由"做什么"决定，不由"在哪个目录"决定。如果一个动作的本质是编排（修订、部署），即使**触发点**在 dispatch，**执行点**也回项目根。

**举例**：你在 dispatch 拉了个 `develop` 任务，写代码到一半发现 PRD 有歧义。**正确做法不是就地改 PRD**——而是：当前 develop 任务标 `[paused-by-deviation]` → 关 dispatch 会话 → 进项目根开新 CC 会话 → 拉 `revise-doc`（target=prd）任务 → 修订完回 dispatch 续 develop。

**为什么不就地做**：

1. **规范加载错位**——dispatch 当前会话加载的是 `develop` 开发规范；要改 PRD 应该加载 `revise-doc`（target=prd）规范。错位心态下做错位事情，工具书不对路
2. **审计/可追溯**——编排动作和开发循环的 commit 模式不同（信息风格、改动文件、签字流程）。混在一起做会让事后回看搞不清这个 commit 是开发还是编排
3. **状态污染**——dispatch 是高频拉/释/CR 的工作区，部署、修订这种"低频但重大"的动作就地做容易跟 dispatch 状态纠缠
4. **摩擦是设计的**——切心态有成本（关会话、开新会话、换目录、加载新规范）。这个摩擦强迫你"停下来想一下：我要做的事属于哪个心态"，而不是顺手做错位的事
