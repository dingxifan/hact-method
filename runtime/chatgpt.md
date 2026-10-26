# ChatGPT Runtime Adapter

Task 语义在 `tasks/`，共性纪律在 `protocols/`；本文只说明 ChatGPT 的工作与人工交接。

## 1. Role and truth boundary

项目工作默认可在 Codex 中完成，ChatGPT Work 按需承担 reasoning、需求、PRD/UX/TRD、计划与 acceptance judgement，不独占这些工作，也不因模型能力获得更高 Authority。Chat/Project 中的草稿和讨论不是 Shared Project Truth，只有固定并进入 Git 的 artifact 才按接受层级用于后续工作。

需要真实仓库写入、command/test/checker 或 Git 操作时，把稳定文件与 bounded Execution Packet 人工交给 Codex。用户负责搬运稳定结果及必要决定，不负责 AI 的排序、会话维护或中间 reasoning。

## 2. Bootstrap and repository reading

确认 repository、实际安装的 Method SHA 与当前 Task/state，读取对应 Task、权威输入及当前动作触发的 Protocol，不预加载全部规范；用户明确 Task 时不重新路由。新工作更新检查与隔离试升级由 Codex 按 `guide/07-同步方法论.md` 连续完成，ChatGPT 不另选个人版本或从本地 Method 工作树混读；进行中链与交接沿用同一已固定 Method。init-project 的 bootstrap 例外与 B Intake 分别按原契约。

完整 artifact 必须完整读取。交接绑定明确 `BASE_SHA`，不能只读 floating main；优先 Accepted、fixed candidate 或 Gate approved snapshot。完整 handshake 及接受边界见 `protocols/git-truth.md`。

## 3. Minimal manual handoff

仅实际从 ChatGPT Work 等入口交给 Codex 时使用本节；Codex 直接任务不额外制作 Packet、文件或回传材料。只传递本次 operation 必需的控制信息及简短 Execution Brief，长文档与多文件正文走独立文件：

```text
Repository:
Base SHA:
Task:
Goal:
Allowed:
Forbidden:
Input file(s):
Target path(s):
Execute:
Validate:
Stop:
Return:
```

无输入文件或目标路径时省略对应项。Packet 是临时交接格式，不注册或持久化为 HACT 对象。Codex 的持续执行、错误分类、授权请求和提前返回条件见 `runtime/codex.md` §5；明确动作的授权在当前 Codex interaction 处理，不因分类或普通失败另起 Packet。用户停止及系统强制中断优先适用。

### Sprint-level Develop handoff

当前入口从当前 `BASE_SHA`、已完成/剩余 Accepted Task Packages、依赖图、工作量、已知复杂度及验证/审查边界决定下一个 execution-window scope，不预排未来窗口。Codex 直接任务在当前环境建立并实际激活 Goal，无需 ChatGPT 起草或 Packet；复杂/大型 Task 可以独占窗口。以下顺序仅适用于真实跨入口交接：

按顺序输出两个独立部分：

1. **CODEX GOAL**：可粘贴的 `/goal ...`，绑定 base、Accepted Sprint、本窗口 packages、成功条件、自主范围、Human Boundary、依赖/共享写约束及最终 `RESULT_SHA`；用户先在 Codex 激活。
2. **DEVELOP EXECUTION PACKET**：Goal 已建立后提交，包含 `Repository`、`BASE_SHA`、`Accepted Sprint`、`Scope`、`Autonomy`、`Human Boundary`、`Success`、`Final Return`。

Packet 内写 `Goal:` 不能代替激活。Goal/Packet 明确 Codex 只在当前窗口按依赖、工作量、耦合和验证边界组织 Wave，不跨范围或增加产品/核心技术语义、权限；用户不写 Goal、不逐包排序。窗口和 Wave 的 Task 约束见 `tasks/develop.md` §5.9，模型选择仍由 Human 决定。

跨入口返回后，ChatGPT 重新读取 immutable `RESULT_SHA` 的相关 artifact/code/state 与 evidence，判断结果并在 Sprint 尚有范围及已有授权时重算下一有界窗口；不继承完整聊天或维护旧窗口过程。Codex 直接任务由当前入口完成同样的 Git 核对与窗口选择，不要求返回 ChatGPT。

## 4. Frozen artifact persistence

已完成并确认的 artifact 交给 Codex 时，明确目标路径、冻结内容、原样落盘与不改语义的格式修复范围；不得重新设计或扩大 scope。按 `persist → validate → mechanical repair → validate` 完成，确定性失败不派生开放式研究。Git candidate identity 才证明落盘。

## 5. Review, interaction and recovery

独审输入、Fresh Isolation 与系统 reviewer 选择按 `protocols/review.md`。适合且 immutable sources 完整时使用 Fresh ChatGPT system reviewer，当前 planner/designer/owner 不兼任，targeted re-review 也须 fresh；Codex 保持 runtime verification、repair、evidence capture 与 persistence，必要结论绑定同一 final candidate。

产品/技术取舍、Gate、真实体验、授权扩大及高影响/外部动作按 `protocols/authority.md`；已确定且已授权的 authoring、验证与机械修正连续完成。恢复按 `protocols/recovery.md` 从最近 verified durable conclusion 做最小 reality probe，聊天摘要只作线索，外部结果不确定按 `protocols/external-effect.md` 处理。

## 6. Capability boundary

能力包括 repository read、reasoning、authoring、isolated context、persistence 与 optional repository execution。具体 connector/MCP/SSH/UI 只实现当前环境能力，不构成 ChatGPT↔Codex transport 或新授权。
