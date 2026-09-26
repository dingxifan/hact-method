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

遇到 capability gap、reasoning gap 或 independence gap 时可 escalation，但不自动转移 Task ownership。reasoning gap 先在当前执行环境内提高 model/effort；只有不可消解的 capability / isolation gap 才需要人工协作交接。

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

## 7. Effective Permission 的检查时机

bounded operation 开始时确认一次 Effective Permission：

```text
Effective Permission =
Task Contract authorization boundary
∩ current Human Authority
∩ current resource permissions
∩ environment protection
∩ tool capability
```

最窄限制胜出；Runtime receipt 或 Git persistence receipt 都不能扩大 Authority。exact operation、target、snapshot 与 Authority references 只固定本次意图和证据，不创建第二套权限矩阵。

同一 bounded operation 内，只要 scope、target、snapshot、Human Authority、resource/environment protection、tool capability 与动作风险等级均未变化，读取、修改、测试和同类机械整改可以连续执行，不在每个 repository mutation 或 lifecycle append 前重复计算。

仅在以下边界重新计算：

- scope、target、snapshot、Authority、环境保护或 tool capability 发生变化；
- 从本地工作进入 commit、push/shared transport、merge、deployment/promotion 或 external action；
- retry / recovery continuation 涉及不确定 start/effect；
- 原 bounded operation 的动作变为更高影响、不可逆或 non-idempotent。

Human Authority、环境策略或资源权限的收窄/撤销立即优先适用。

权限扩张必须由新的、scoped、immutable Authority event 明确绑定 action/scope、snapshot/world、target/environment 和适用的 validity scope。External Effect Receipt 只能引用该事件，不能自行创建 Authority、ownership 或 state。将 `RESULT_SHA` 发布为远端可读事实若需要 shared-write Authority，仍须遵守本协议；snapshot handshake 本身不扩大权限。这里不创建 Approval Envelope 或第二套授权模型。
