# External UX Runtime Adapter

本文描述 `draft-ux` 在用户**明确要求外部设计会话**时的人工交接方式。它不是新的 Task，也不是独立 Gate。

只有用户明确选择外部设计会话时才使用此路径。

## 1. Design Packet

从当前 `draft-ux` Accepted / Candidate Truth 形成一个最小 design brief，由用户人工交给外部设计会话。

Brief 只包含或引用：

- G1 approved PRD 的相关部分；
- `ux-flows.md` 中 U-id / S-id；
- 用户目标、起点、完成结果；
- 失败 / 取消 / 恢复行为；
- 已确认的重要 UX 取舍；
- `design.md` 相关页面 / 全局视觉基线；
- 当前 prototype version（若已有）。

不要复制完整历史聊天，不把 Owner 的私有推理当输入。

## 2. External design output

外部设计会话可以产出：

- `prototype.html`
- `prototype-map.md`
- 必要 design delta

仍必须：

- 以跨功能用户任务组织，而不是按页面 / PRD 功能机械切割；
- 使用虚构但连贯的数据；
- 不调用生产服务；
- 不新增 PRD 没有的业务承诺。

外部设计会话没有额外 Authority。

## 3. Result Packet

用户人工带回稳定结果后，Owner 必须重新核：

- source / version / snapshot；
- U/S 与 PRD AC mapping；
- design consistency；
- 是否夹带新的业务规则。

仅“文件已经带回”不等于 `draft-ux done`。

## 4. Required verification after return

无论原型由哪个设计会话生成，都回到 `tasks/draft-ux.md` 的同一完成链：

1. 当前版本 browser execution / evidence
2. deterministic `check-ux` 或等价结构检查
3. Fresh Isolated Context Independent Review
4. 用户真实体验接受

外部设计会话不能替代其中任何一项。

## 5. Persistence

正常交接基于 versioned Git snapshot。

不是：

`外部设计聊天总结 → Owner`

如果外部设计会话不能直接写 Git，用户将冻结 artifact 放入给 Codex 的 Execution Packet；Codex 落盘、验证并形成 Shared Candidate，再由 Owner 从 Git Truth 继续。
