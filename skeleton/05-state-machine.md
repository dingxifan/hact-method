# 05 — 状态机

> **本文回答**：task 有哪些状态？怎么流转？软锁怎么工作？双向暂停和召回是什么？
>
> **不回答**：有哪些 task（→ `04-task-catalog.md`）；身份/拉取规则（→ `01-identity.md`）；Gate（→ `06-gates.md`）。

---

## 1. 状态枚举（6 个）

| 状态 | 含义 |
|---|---|
| `可取` | 在 queue 里，任何符合 discipline 准入的 user 都可拉 |
| `taken-by: <user>` | 已被某 user 拉走，在做（含写代码 / 推 PR / 等 CR）|
| `done` | 持有者宣告完工（PR 已推 / 产物已就位）|
| `paused-by-deviation` | 持有者发现上游产物有问题（PRD/TRD/standards 有歧义或错误），主动暂停 |
| `paused-by-cr` | reviewer 在 CR 中发现方案级问题（不是改改就好的小问题），需要更高层介入 |
| `merged` | 终态，工作已合并 |

**通用 vs 选择性使用**：

- `可取` / `taken-by` / `merged`——所有 task 必经
- `done`——大部分需经过（如 develop 推 PR 后未合并前；少数无 PR 的 task 如 init-project 可直接 `taken-by → merged`）
- `paused-by-*`——按需出现，不是所有 task 都会用到（spec 内可声明本 task 不支持某种 pause）

---

## 2. 状态流转

主要 transitions：

| From | To | Trigger | 谁触发 |
|---|---|---|---|
| `可取` | `taken-by` | 用户拉任务（软锁，详见 §3）| 任何符合 discipline 的 user |
| `taken-by` | `可取` | 主动放弃（详见 §4） | 持有者 |
| `taken-by` | `可取` | dispatch user 召回（详见 §5）| dispatch discipline user |
| `taken-by` | `done` | 推 PR / 产物提交 | 持有者 |
| `done` | `merged` | CR 通过（develop）/ 系统判定（无 CR 的 task）| reviewer / 系统 |
| `done` | `taken-by` | CR 打回（轻度，普通迭代）| reviewer 触发，持有者继续 |
| `taken-by` / `done` | `paused-by-deviation` | 持有者发现上游偏离（详见 §6a） | 持有者 |
| `taken-by` / `done` | `paused-by-cr` | CR 发现方案级问题（详见 §6b）| reviewer |
| `paused-by-*` | `taken-by` | 暂停原因消除，恢复继续 | 持有者 |
| `paused-by-*` | `可取` | dispatch 决定重派（如召回机制 §5） | dispatch user |

**关键不变量**：
- `merged` 是终态——一旦进入，任何回退要走"修订"路径（`revise-doc` 等），不是状态机层面的回退
- `taken-by` 的 user 字段必须始终是某一个具体 user（不能空），与 `taken-by` 状态绑定

---

## 3. 软锁机制（`可取 → taken-by`）

**软锁**：拉任务时设置 `taken-by: <user>` 字段并推到共享存储；不靠数据库事务、不靠分布式锁、不靠心跳。

**两种实现**：

| 形态 | 软锁靠 |
|---|---|
| 文件式（`queue/*.md`） | git push 时序——任务包改动 push 后第一个 push 成功即获锁；后到者 push 冲突 → 重新选一个任务 |
| web 式（hact-app） | 数据库 UPDATE WHERE 条件加 `status='可取'`——并发请求只有一个 affected_rows=1，其他得 0 → 重选 |

**冲突处理**：

- 冲突极少发生（要求多个 user 在毫秒级同时拉同一 task）
- 冲突时**后到者重选**——CC 启动协议会刷新 queue 状态，提示"刚才那个被别人拉走了，重选一个"
- 不需要重试 / 排队 / 锁等待——直接看 queue 当前状态再决定

**软锁的特点**：

- 拉到即持有，**没有自动释放**——一直持有到 `merged` / 主动放弃 / 被召回
- 没有心跳——长期 `taken-by` 但无进展是正常状态（可能持有者在度假、在思考、在做别的事）
- 长期无进展由召回机制处理（§5），不是状态机超时

---

## 4. 主动放弃（`taken-by → 可取`）

持有者可以主动声明"放弃当前任务"，把状态打回 `可取`。

**触发场景**：
- 发现自己实力 / 时间 / 上下文不匹配
- 优先级变化（要去做更紧急的事）
- 个人情况（生病、轮岗等）

**操作要求**：

- 在任务包里写"放弃理由"（自然语言一段）
- 状态字段从 `taken-by: <user>` 改为 `可取`，`taken-by` 字段清空
- 已做的代码改动由后续接手者决定保留或丢弃（spec 内说明）
- 操作完成后 push（文件式）或 commit（web 式）

**禁止**：放弃时不要默默把任务直接删掉——必须留下理由痕迹，给后续接手者上下文。

---

## 5. 召回（dispatch user 主动）

dispatch discipline 的 user 可以从其他持有者手里召回任务。

**触发场景**：
- 持有者长期无进展（多日无 commit / 无任何更新）
- 任务定义本身有问题，需要拆分 / 重派 / 取消
- 资源调整（项目优先级变化，需要重新分配）

**操作要求**：

- 必须在任务包里写"召回理由"
- 状态从 任意（含 `taken-by` / `paused-by-*` / `done`）→ `可取`
- 原持有者会在下次 CC 启动协议运行时被告知"该任务已不属于你，本地分支可保留作为参考"

**召回的安全保障**：

- 只有 dispatch discipline 的 user 能执行（`task.discipline ∈ user.disciplines` 中含 `dispatch`）
- 召回操作产生 git commit / DB 记录，可追溯
- `merged` 状态的 task 不能被召回（终态）

---

## 6. 双向暂停

v2 设计两个方向的暂停信号——开发者侧 `paused-by-deviation`，reviewer 侧 `paused-by-cr`。

### 6a. 开发者声明偏离（→ `paused-by-deviation`）

**触发**：持有者执行任务时发现上游产物有问题——

- PRD 描述不清、内部矛盾
- TRD 接口设计跟实际场景不一致
- standards 缺关键约束 / 跟现有代码冲突

**操作**：

- 在任务包写"偏离声明"（自然语言描述发现的问题）
- 状态：`taken-by / done` → `paused-by-deviation`
- 通常会触发新的 `revise-doc` 任务（见 `04` §5）——通过项目根工作区由对应 discipline 的 user 拉来修订

**恢复**：

- `revise-doc` 完成后，原任务持有者评估问题是否已解决
- 解决了 → `paused-by-deviation → taken-by`，继续工作
- 没解决 / 任务已不适合做 → 主动放弃或被召回

### 6b. CR 严重问题（→ `paused-by-cr`）

**触发**：reviewer 在 CR 过程中发现的不是"改改就好"的轻度问题，而是方案级别——

- 实现思路根本不对（违反 TRD 设计意图）
- 涉及到 standards 没覆盖的边界，需要 architect 介入
- 跟其他 in-progress 任务有冲突，需要协调

**操作**：

- reviewer 在 CR 任务里详述问题（不是简单"打回修改"）
- 状态：被审 develop 任务 `taken-by / done` → `paused-by-cr`
- reviewer 自己的 CR 任务暂时挂起 / 完结（视情况，spec 内说明）

**恢复**：

- 通常需要先创建 `revise-doc` 修订 TRD/standards，或补充设计讨论
- 修订完后，原 develop 任务 `paused-by-cr → taken-by` 继续，或 `→ 可取` 让别人接手
- 严重情况下可被召回 → `可取`，重新派给更适合的 user

---

## 7. 跨任务的状态联动

某些 task 之间状态有耦合关系：

| 触发 | 影响 |
|---|---|
| `develop` 推 PR（→ `done`）| 系统创建 `code-review` 任务（status=`可取`，target-pr 指向该 PR）|
| `code-review → merged`（CR 通过） | 关联的 `develop` task → `merged`；PR 实际合并 |
| `code-review` 打回（轻度） | 关联的 `develop` task `done → taken-by`，持有者继续修改 |
| `code-review` 打回（严重） | 关联的 `develop` task → `paused-by-cr`（详见 §6b）|
| 任意 `develop(source=X)` → `merged` | 检查是否触发下游 task 的前置条件（详见 04 §"任务前置检查"）|

具体**任务前置检查表**（哪些 task 由哪些 task 完成触发）见 `04-task-catalog.md`。

---

## 8. 状态机 vs Gate

**状态机**关心的是**单个 task 的生命周期**——拉、做、合。

**Gate** 关心的是**一组 task 集合的进度聚合**——本期 PRD 起草任务们都 `merged` 了，G1 才能签。

两者正交：
- task 的状态由本文档（§1-§7）规定
- Gate 的内涵和签字判据由 `06-gates.md` 规定
- Gate 子状态视图（"X/Y task 已完成、哪些 paused"）是 task 状态的聚合查询

---

## 9. 边界（不在本文档讲）

| 你想知道 | 去哪个文档 |
|---|---|
| 有哪些 task type | `04-task-catalog.md` |
| 任务前置依赖怎么判 | `04-task-catalog.md` §"任务前置检查" |
| Gate 内涵与子状态聚合 | `06-gates.md` |
| 拉取准入规则 | `01-identity.md` §3 |
| 哪个工作区做哪类任务 | `02-workspaces.md` |
