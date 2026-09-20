# harvest-notes Utility

`harvest-notes` 是可选 HACT utility，不是 Core Task，不进入正常 Task state、Gate 或迭代生命周期。

## 1. Trigger

只有用户明确要求整理经验 / 笔记 / 项目反馈时才运行。

它不是：

- `init-project` 前置；
- `develop` 前置；
- G5 前置；
- 自动后台收割器。

## 2. Authorized sources only

只读取本次明确获准的来源，例如：

- 项目 `feedback.md`
- 用户点名的 PR / review / incident
- 用户主动提供的笔记
- 已授权的项目 artifact

不得：

- 自动枚举私人资料；
- 因“可能有用”扩大数据来源；
- 清空 / 修改原始私人笔记；
- 把没有访问许可的来源当作阻塞项目工作的理由。

## 3. Extraction rules

只提取：

- 有证据；
- 可复用；
- 跨一次性项目细节仍有意义的发现。

明确区分：

- observed fact
- analysis
- candidate recommendation

个人偏好不能自动升级成方法论规则。

## 4. Outputs

允许零产出。

有价值发现可形成：

- 带来源引用的候选建议；
- 经授权写入 `_meta/plans/方法论待议.md` 或当前等价候选区；
- 必要时对 checklist / template 的**候选**修改建议。

项目具体缺口仍留原项目 backlog / feedback，不因“已收割”而从项目事实面消失。

## 5. No automatic rule approval

整理经验不等于批准规则。

真正修改 HACT 方法论时，仍需：

- 明确 change scope；
- 读取当前 Method truth；
- 做相应分析 / review / verification；
- 形成独立 versioned change。

Utility 本身不替代上述过程。

## 6. Persistence and recovery

如本次产生 durable candidate，应保存：

- 结论；
- 必要理由；
- 来源引用；
- 未覆盖 / 不采纳项。

不要求：

- 永久 harvest cursor；
- 全员 notes registry；
- 完整 conversation；
- chain of thought。

中断后从已提交产物和来源引用恢复即可。
