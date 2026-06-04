# 05 — 状态机

> **本文回答**：task 有哪些状态？怎么流转？软锁怎么工作？异常转移怎么处理？
>
> **不回答**：有哪些 task（→ `04-task-catalog.md`）；身份/拉取规则（→ `01-identity.md`）；Gate（→ `06-gates.md`）。

---

## 1. 状态枚举（4 个）

| 状态 | 含义 |
|---|---|
| `可取` | 在 queue 里，符合 discipline 准入的 user 都可拉 |
| `taken-by: <user>` | 已被某 user 拉走，在做（含写代码、推 PR、等 CR、临时阻塞等任何中间情况）|
| `done` | 持有者宣告完工（PR 已推 / 产物就位）|
| `merged` | 终态，工作已合并 |

**通用 vs 选择性**：
- `可取` / `taken-by` / `merged` —— 所有 task 必经
- `done` —— 大部分 task 经过；少数无"提交 → 验证"分离的 task（如 `init-project`）可直接 `taken-by → merged`

**临时阻塞 / 暂停 / 等待** 等中间情况都用 `taken-by` 状态 + 任务包里的 free-text "阻塞原因" 字段表达，**不另立状态**。

---

## 2. 状态流转

主流路径：`可取` → `taken-by` → `done` → `merged`

| From | To | Trigger | 谁触发 |
|---|---|---|---|
| `可取` | `taken-by` | 用户拉任务（软锁，详见 §3）| 任何符合 discipline 的 user |
| `taken-by` | `done` | 推 PR / 产物提交 | 持有者 |
| `done` | `merged` | CR 通过（develop）/ 系统判定（无 CR 的 task）| reviewer / 系统 |
| `taken-by` | `merged` | 直接判定完成（无 PR 的 task，如 init-project）| 系统 |
| 任意非 `merged` | `可取` | 异常转移（详见 §4）| 持有者 / dispatch user |

**关键不变量**：
- `merged` 是终态——一旦进入不回退。要回退走"修订"路径（`revise-doc` 等），不是状态机层面回退
- `taken-by` 必须有 user 字段
- 阻塞 / 暂停 / 等 PR / 等沟通 等中间情况用 `taken-by` + free-text "阻塞原因" 字段表达

---

## 3. 软锁机制（`可取 → taken-by`）

**软锁**：拉任务时设置 `taken-by: <user>` 字段并推到共享存储；不靠数据库事务、不靠分布式锁、不靠心跳。

**两种实现**：

| 形态 | 软锁靠 |
|---|---|
| 文件式（`queue/*.md`）| git push 时序——任务包改动 push 后第一个 push 成功即获锁；后到者 push 冲突 → 重选任务 |
| web 式（hact-app）| 数据库 UPDATE WHERE 条件加 `status='可取'`——并发请求只有一个 `affected_rows=1`，其他得 0 → 重选 |

**冲突处理**：

- 冲突极少发生（要求多个 user 在毫秒级同时拉同一 task）
- 冲突时**后到者重选**——CC 启动协议刷新 queue 状态，提示"刚才那个被别人拉走了，重选一个"
- 不需要重试 / 排队 / 锁等待——直接看 queue 当前状态再决定

**软锁的特点**：

- 拉到即持有，**没有自动释放**——一直持有到 `merged` / 异常转移
- 没有心跳——长期 `taken-by` 但无进展是正常状态（持有者可能在度假、思考、做别的事）
- 长期无进展由异常转移（§4）处理，不是状态机超时

---

## 4. 异常转移（回退 / 放弃 / 召回 / 暂停）

v2 早期阶段——团队小，沟通成本低——所有"非主流"情况用同一个简单机制处理：

**机制**：任何非 `merged` task 可被改回 `可取`，**前提是写理由**。

**典型场景 + 谁可以做**：

| 场景 | 谁做 |
|---|---|
| 持有者觉得自己不适合做 → 主动放弃 | 持有者 |
| 持有者发现上游 PRD/TRD/standards 有问题，不能继续 → 改回可取 + 创建 `revise-doc` 任务 | 持有者 |
| 持有者长期无进展，dispatch 决定重派 | dispatch discipline 的 user |
| CR 发现方案级问题，跟持有者商量后决定回炉重做 | 持有者（讨论后） |

**操作**：

- 改 status 字段为 `可取`
- 在任务包写"回退理由"段（自然语言，1-3 句话）
- push（文件式）或 commit（web 式）
- **告诉相关人**——团队小，发个消息或当面说一下

**已有产出（代码改动 / commit）的处理**：留在原分支，由后续接手者评估保留或丢弃，spec 内说明。

**不做的（v2 早期）**：

- 不区分"主动放弃 vs 被召回 vs 暂停"——都是同一个 transition
- 不引入 `paused-by-*` 等中间状态——临时阻塞用 `taken-by` + free-text "阻塞原因" 字段
- 不要求形式化的"恢复路径"——讨论清楚后下一个 user 重新拉，原已有产出由接手者评估

**未来可能升级**：团队规模扩大 / 跨时区协作出现 / 自动化集成需求时，可以引入更细的状态枚举或正式召回流程。当前阶段保持简单。

---

## 5. 跨任务的状态联动

某些 task 之间状态有耦合关系：

| 触发 | 影响 |
|---|---|
| `develop` 推 PR（→ `done`）| 系统创建 `pr-review` 任务（status=`可取`，target-pr 指向该 PR）|
| `pr-review → merged`（CR 通过） | 关联的 `develop` task → `merged`；PR 实际合并 |
| `pr-review` 打回（CR 评论 / 不通过）| 关联的 `develop` 仍 `status=done`；持有者根据 CR 评论继续提 commit；CR 重审；严重时走异常转移（§4） |
| 任意 `develop(source=X)` → `merged` | 检查是否触发下游 task 的前置条件（详见 04 §"任务前置检查"） |

具体**任务前置检查表**见 `04-task-catalog.md`。

---

## 6. 状态机 vs Gate

**状态机**关心的是**单个 task 的生命周期**——拉、做、合。

**Gate** 关心的是**一组 task 集合的进度聚合**——本期 PRD 起草任务们都 `merged` 了，G1 才能签。

两者正交：
- task 的状态由本文档（§1-§5）规定
- Gate 的内涵和签字判据由 `06-gates.md` 规定
- Gate 子状态视图（"X/Y task 已完成、哪些正在进行"）是 task 状态的聚合查询

---

## 7. 边界（不在本文档讲）

| 你想知道 | 去哪个文档 |
|---|---|
| 有哪些 task type | `04-task-catalog.md` |
| 任务前置依赖怎么判 | `04-task-catalog.md` §"任务前置检查" |
| Gate 内涵与子状态聚合 | `06-gates.md` |
| 拉取准入规则 | `01-identity.md` §3 |
| 哪个工作区做哪类任务 | `02-workspaces.md` |
