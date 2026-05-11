# 02 — 工作区

> **本文回答**：v2 有几个工作区？每个工作区是什么"心态"？文件读写权限的边界？
>
> **不回答**：有哪些任务（→ `04-task-catalog.md`）；任务状态怎么流转（→ `05-state-machine.md`）。

---

## 1. 两个工作区，按"心态"切割

工作区切的**不是"谁"**——是"做什么类型的事时所处的心智状态"。同一用户可以在不同心态间切换，每次切换 = 开新 CC 会话，进对应的工作目录。

| 工作区 | 心态 | 物理形态 |
|---|---|---|
| **hact-method** | 方法论 | `E:\group-code\hact-method\` |
| **项目根** | 项目 | `E:\group-code\{project-name}\`（项目仓根目录） |

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
- `code-review`（PR 复核）
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

## 4. 心态切换 = 开新会话

工作心态**不是用户固有属性**——是用户当前活动决定的：

- 同一用户上午在 hact-method 调整方法论 → 关 CC 会话
- 下午进项目根做 `draft-tech-design` → 开新 CC 会话，新工作目录
- 晚上在同一项目根拉 `develop` 任务 → 可在同一会话继续，或开新会话

CC 启动协议在不同工作目录下读到不同的 `CLAUDE.md` 和状态文件，自动识别当前心态，给出对应推荐——这是"心态由活动驱动"的物理体现。

跨工作区的**身份不变**（见 `01-identity.md`）；切换的只是**工作目录** + **加载的规范集**。

---

## 5. 跨工作区边界的处理

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
