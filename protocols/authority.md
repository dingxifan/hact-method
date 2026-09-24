# Authority Protocol

HACT 将“谁能执行”和“谁能决定”明确分离。

## 1. Authorization sources

执行权限来自以下交集：
- 用户明确授权
- repository / resource 权限
- branch / environment 保护
- 当前 tool capability
- Task Contract 边界

Git author、Runtime 名称、模型能力、discipline 标签都不产生额外授权。

## 2. Continuous execution

在用户已明确授权的范围内，Owner 可以连续完成读取、分析、写入、测试、整改、review 闭环和必要收尾。

不要为了流程感在每个机械步骤重新询问。

## 3. 必须请求 Human Authority

至少包括：
- 业务范围或产品承诺变化
- 多个合理方向需要用户取舍
- Gate approval
- 真实用户体验验收
- 不可逆或高影响破坏性操作
- 生产/外部副作用
- 授权范围扩大
- AI 无法从权威事实合法裁决的重要歧义

## 4. Runtime capability 不等于 Authority

ChatGPT 能写 Git 不代表它可以批准产品需求；Codex 能部署不代表它自动获得部署授权；更强模型也不能替代 Human Authority。

## 5. Escalation

遇到 capability gap、reasoning gap 或 independence gap 时可 escalation，但不自动转移 Task ownership。

需要高级 reasoning 时优先传递 Decision Packet：
- Decision Question
- Current Facts
- Authoritative References
- Constraints
- Options Considered
- Exact Uncertainty

只持久化 durable conclusion，不持久化完整讨论。

## 6. Scope

只被授权分析/诊断时，不自动实施修改。

已授权实施时可在既定 scope 内连续工作，但不得因为“顺便更好”自行扩大产品、技术或数据范围。

Contract drift 应通过明确 revision / escalation 处理。

## 7. Runtime Crossing 的 Effective Permission

Runtime Crossing Record 中的 `permission_ceiling` 只是该 crossing 的最大上限，不是当前授权。根据 `runtime-crossing.md`，在每一次 repository mutation、commit、push/shared transport、external action、retry、recovery continuation、deployment/promotion、Runtime/action dispatch，以及对应 lifecycle boundary 前，都必须紧邻动作重新计算：

```text
Effective Permission =
Task Contract authorization boundary
∩ current Human Authority
∩ current resource permissions
∩ environment protection
∩ tool capability
∩ stored permission ceiling
```

最窄限制胜出；先前计算、Runtime receipt 或 Git persistence receipt 都不能授权后续边界。Human Authority、环境策略或资源权限的收窄/撤销立即优先适用。

权限扩张必须由新的、scoped、immutable Authority event 明确绑定 action/scope、snapshot/world、target/environment 和适用的 validity scope。Runtime Crossing 只能 append 对该事件的引用，不能自行创建 Authority、ownership 或 state。
