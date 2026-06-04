# 02 — 工作区

> **本文回答**：v2 有几个工作区？每个工作区是什么"心态"？文件读写权限的边界？
>
> **不回答**：有哪些任务（→ `04-task-catalog.md`）；任务状态怎么流转（→ `05-state-machine.md`）。

---

## 1. 三个工作区，按"心态"切割

工作区切的**不是"谁"**——是"做什么类型的事时所处的心智状态"。同一用户可以在不同心态间切换，每次切换 = 开新 CC 会话，进对应的工作目录。

| 工作区 | 心态 | 物理形态 |
|---|---|---|
| **hact-method** | 方法论 | `E:\group-code\hact-method\` |
| **项目根** | 项目 | `E:\group-code\{project-name}\`（项目仓根目录） |
| **hact-notes** | 个人积累 | `E:\group-code\hact-notes-{姓名}\`（每人独立私有仓） |

---

## 2. hact-method（方法论心态）

**触发场景**：调整方法论 / 跨项目浏览 / 立新项目。

**典型任务**（详见 04）：
- `init-project`（立项）
- 纯读浏览（无任务实体）

**无 task 包的活动**：
- 方法论调整（改 skeleton / specs / templates / BRIEF / 等）——**发散性工作，不预定义为 task type**，由有 `management` 授权的 user 直接做（BRIEF.md 决策 #20）

**文件权限**：
- **可写**：`hact-method/` 自身所有文件（skeleton / specs-* / templates / CLAUDE / BRIEF / STATUS）
- **可读**：各项目仓的编排状态（按需）
- **不写**：具体项目的代码

---

## 3. 项目根（项目心态）

**触发场景**：一切与具体项目相关的工作——无论是编排（写 PRD / 规划迭代）还是开发循环（写代码 / 推 PR）。

**典型任务**：
- `draft-prd-vN`（含 G1 签字）
- `draft-tech-design`（含 G2 签字；出 TRD + 3 份 standards）
- `revise-doc`（修订归项目根）
- `plan-sprint`（含 G3 签字）
- `develop`（写代码 + 推 PR）
- `pr-review`（PR 复核）
- `generate-integration-tests`（联调脚本）
- `manual-test`（含 G4 签字）
- `deploy`（部署归项目根）
- `wrap-up-iteration`（含 G5 签字）
- `dispatch-new`（B 类入口：派新 BUG / 优化）

**物理形态**：项目仓根目录（`E:\group-code\{project-name}\`），代码与协调文件合并存放。

**文件权限**：
- **可写**：当前项目仓的所有内容（代码 + 协调文件）
- **可读**：`hact-method` 自身规范文件（skeleton / specs / templates）
- **不写**：`hact-method` 自身规范、其他项目的目录

---

## 4. 个人积累（hact-notes 心态）

**触发场景**：开发循环中随手记录自己的经验——踩过的坑、想沉淀的编码规范、自检易漏项、对方法论的反思。不依赖任何 task，随时可记。

**物理形态**：每人一个私有仓 `hact-notes-{姓名}`，建在**团队 Gitee 组织**下（由 init-project Step4.5 自动创建，只加本人为 push 协作者），clone 到本地 `E:\group-code\hact-notes-{姓名}\`，与项目仓同层。

**为什么独立私有仓**：个人积累是"对自己的总结"，带私人性质。单一共享仓会因 git 整仓 clone 导致人人本地揣全员草稿，与"私人"冲突——故每人一仓，本人独享。

**内容**：一个 `notes.md`，条目打标签：

| 标签 | 含义 | 是否上提 |
|---|---|---|
| `[规范]` | 该成为团队编码规范的经验 | ✅ 由 harvest-notes 上提 |
| `[checklist]` | 自检易漏、该进 checklist 的项 | ✅ |
| `[方法论]` | 流程 / 方法论层面的问题或建议 | ✅ |
| `[心得]` | 纯个人心得、复盘 | ❌ 永不上提，私有 |

**文件权限**：
- **可写**：仅本人（权限绑身份，**不走 discipline 准入**——见 `01-identity.md` §3）
- **可读**：本人完全可读写；管理者对 `[规范]`/`[checklist]`/`[方法论]` 条目**只读**（经 `harvest-notes` 收割上提，见 `04-task-catalog.md`）；其他开发者无权限
- **不写**：任何他人的 notes 仓

**与公共层的关系**：个人 notes 是"原料"，公共层（hact-method 的 `templates/standards`、`templates/checklists`、`_meta/plans/方法论待议.md`）是"成品"。管理者跑 `harvest-notes` 把验证有效的个人条目去重择优、上提为公共。这条"个人攒 → 上提公共"是 **pull 模型**（拉取，非推送），与 dispatch 拉取池哲学一致，且开发者全程**无需 hact-method 写权限**。

---

## 5. 心态切换 = 开新会话

工作心态**不是用户固有属性**——是用户当前活动决定的：

- 同一用户上午在 hact-method 调整方法论 → 关 CC 会话
- 下午进项目根做 `draft-tech-design` → 开新 CC 会话，新工作目录
- 晚上在同一项目根拉 `develop` 任务 → 可在同一会话继续，或开新会话

CC 启动协议在不同工作目录下读到不同的 `CLAUDE.md` 和状态文件，自动识别当前心态，给出对应推荐——这是"心态由活动驱动"的物理体现。

跨工作区的**身份不变**（见 `01-identity.md`）；切换的只是**工作目录** + **加载的规范集**。

---

## 6. 跨工作区边界的处理

会出现"看起来需要跨心态"的场景。归属规则：

| 场景 | 归属 | 理由 |
|---|---|---|
| 修订已签 Gate 的产物（如 PRD 已签 G1 要改） | **项目根** | 修订归项目根（BRIEF.md 决策 #11）。发现需要修订时，结束当前任务 → 在项目根拉 `revise-doc` 任务，不就地改 |
| Gate 5 收尾要更新 standards / decisions | **项目根** | 反向沉淀产物仍是编排动作 |
| 部署（hotfix / 合并部署 / 单期部署，全包） | **项目根** | 部署一律归项目根（BRIEF.md 决策 #9） |
| 派新 BUG / 派新优化（B 类入口） | **项目根** | B 类入口在项目根（BRIEF.md 决策 #5） |
| 跨项目方法论调整提案 | **hact-method** | 任何方法论文件改动都在 hact-method |

### 核心原则：触发点 ≠ 执行点

心态由"做什么"决定。如果一个动作的本质是规范修订，即使**触发点**在开发任务中途，**执行点**也要回到正确心态重新加载规范。

**举例**：做 `develop` 任务写代码到一半，发现 PRD 有歧义。正确做法：当前 develop 任务回退到 `[可取]` + 写阻塞理由 → 关当前会话 → 在项目根开新 CC 会话拉 `revise-doc`（target=prd）→ 修订完后重新拉 develop 继续。

**为什么不就地改**：当前会话加载的是 `develop` 规范，改 PRD 应加载 `revise-doc` 规范。规范加载错位，工具书不对路。
