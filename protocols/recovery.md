# Recovery Protocol

HACT 假设任何 AI conversation、Runtime context 或本地 session 都可能丢失。

目标不是保护一个永不消失的上下文，而是保证项目工作可以从权威事实恢复。

## 1. Recovery sources

优先读取：
1. 当前 HACT Method fixed SHA
2. `status.yml`
3. Accepted Project Truth
4. 当前 Task Contract
5. 如存在，当前 Shared Candidate snapshot
6. required review / verification evidence
7. 必要 recovery pointer / progress

完整聊天记录不是恢复前置。

## 2. Resume algorithm

1. 确认项目和 method SHA
2. 读取 `status.yml`
3. 确认当前 Task、state、owner、dependencies
4. 读取 Task Contract
5. 重新读取 authoritative inputs
6. 若 Task 已 `done`，锁定 candidate snapshot
7. 读取必要 evidence / findings
8. 找到第一个未满足的 completion condition
9. 从该点继续

不尝试重建原会话的完整思维过程。

## 3. Recovery pointer

长任务、跨 session Task 或高风险执行可以维护轻量 recovery pointer：
- current task
- current phase
- stable snapshot
- next action
- open blocker
- evidence pointers

Recovery pointer 不能替代 Task Contract、`status.yml`、Git 或 review evidence。

## 4. Optionality

短小、单 session、易重跑的 Task 不要求为了形式创建 progress 文件。

Recoverability 是强要求；额外 recovery artifact 是否存在按风险和中断成本决定。

## 5. Dirty state

未形成 stable snapshot 的 Local Working Truth 默认只能由当前 Owner 自行恢复。

若值得跨 session / Runtime继续，应尽量先形成 safe checkpoint，或 Decision Packet / Recovery Pointer。

不能为了“可恢复”把 secrets、不完整危险状态或不适合版本化的临时数据强行提交 Git。

## 6. Context boundary

Task boundary 默认也是 context boundary。下一个 Task Owner 从 Accepted Project Truth 重新建立上下文。
