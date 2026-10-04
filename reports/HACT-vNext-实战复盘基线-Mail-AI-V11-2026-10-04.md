# HACT vNext 实战复盘基线：Mail-AI V11 第一轮

- 日期：2026-10-04
- 项目：Mail-AI V11
- 性质：observational baseline / first-run retrospective
- 状态：记录完成，暂不形成方法论规范变更

## 1. 目的

这是 HACT vNext 在 Mail-AI V11 第一轮完整实践后的观察记录。

本记录用于保留第一轮事实、判断与待验证假设，作为后续横向比较的基线。当前不据此修改 foundation、Gate、Task、Wave、Review 或其他正式方法规则。

计划在再完成 2–3 次较完整实践后，将各轮复盘放在一起比较，再决定哪些现象具有稳定性、哪些只是 V11 的项目特例，以及是否需要正式修改方法论。

## 2. 第一轮总体判断

当前证据支持以下结论：

> HACT vNext 的核心方向成立，暂时没有证据支持重构方法主体。

V11 过程很长、重复验证较多，但必须区分两类来源：

1. **项目自身复杂度与历史债**
   - 历史会话与数据修复；
   - 生产状态漂移；
   - Collection / Scheduler / Source Sync 等真实生产问题；
   - 旧 comparator 等历史代码缺陷；
   - 并行修复导致 candidate / master 持续变化。

2. **HACT 自身的流程摩擦**
   - candidate、review 与 canonical closeout 之间的绑定仍可能滞后；
   - 系统级 review / closeout 受到普通本地工作区状态干扰；
   - candidate 改变后，证据失效范围有时不够精确；
   - Codex dispatch / 回传等 transport 问题容易与项目方法状态混在一起理解。

因此目前的方向是：

> 保留主体，只记录连接处的摩擦；暂不扩建方法论。

## 3. 第一轮证明有效的部分

### 3.1 Git Shared Truth

固定 candidate SHA 能够阻止“旧验证结果自动证明新代码”的错误继承。

V11 中 master 与 candidate 多次发生真实变化。旧 review 失效带来了额外工作，但这些重复多数属于必要验证，而不是无效流程成本。

### 3.2 Fixed Candidate + Fresh Review

实现完成、单 Task PASS 或开发测试通过，不自动等于当前系统整体 PASS。

在历史修复和并行变化较多的情况下，fresh reviewer 对固定 candidate 独立审查仍然有价值，目前没有证据支持删除这一层。

### 3.3 Gate 的保护作用

第一轮没有观察到 Gate 数量本身成为主要阻塞来源。

相反，人工验收、生产 readiness、System Review 没有被互相错误替代，帮助避免了过早收口。

因此目前不提出减少 Gate 的修改。

## 4. 暂存的四个方法摩擦假设

以下内容目前只作为观察项，不作为规范变更。

### H1. Candidate / Review / Canonical Binding

可能存在“新 candidate 和新 review 已产生，但 canonical 引用仍停留在旧事实”的滞后。

后续需要观察这是否会在其他项目中重复出现。

### H2. Clean Fixed-SHA Worktree

System Review / closeout 如果从普通开发工作区开始，dirty worktree、local HEAD 或其他任务残留可能产生无业务价值的 snapshot mismatch。

后续需要验证：固定 SHA 的 clean worktree 是否应成为默认执行习惯。

### H3. 最小证据失效

candidate 改变后，旧证据不能无条件继承是正确的；但不应因此机械重跑所有已经成立且不受影响的验证。

后续需要观察能否稳定做到“只失效真正受变化影响的证据”。

### H4. Transport 与 Method 分离

Codex dispatch、父窗口、回传、Bridge 或其他传输问题属于执行通道问题。

当前判断是：这些问题不应继续演化为 HACT 新的 Task 状态、Gate 或 runtime orchestration。

后续继续观察 transport 异常是否会实际干扰项目状态判断。

## 5. 当前不建议调整的部分

第一轮结束后，暂不建议修改：

- Task / Wave 模型；
- G1–G5；
- Integration Verify；
- Fresh System Review；
- Git Shared Truth。

V11 中多次 review / production verification 的重跑，很多是因为被验证对象本身已经发生变化，不能简单归因为“方法太重”。

## 6. 后续 2–3 轮重点对比项

后续每轮实践只需继续观察以下四项，不新增复盘状态或管理对象：

1. candidate 变化后，canonical truth 是否仍出现明显滞后；
2. System Review / closeout 是否仍被 dirty workspace 或 snapshot mismatch 干扰；
3. 局部修复是否仍造成过大的证据重跑范围；
4. Codex dispatch / 回传异常是否会干扰项目真实状态判断。

## 7. 当前决策

本轮只落盘，不据此实施方法改造。

下一次统一复盘的触发条件是：

> 再完成 2–3 次较完整的 HACT vNext 实践后，对本记录与后续复盘进行横向比较。

届时只对重复出现、证据充分、确实影响执行质量或效率的问题考虑正式修改。

在此之前，本文件只作为第一轮观察基线，不具有 normative method rule 的效力。
