# Runtime Context Protocol

Runtime Context 是当前判断与行动实际使用的信息集合，不是新的项目资产、权威来源或持久化对象。本文只规定跨 Task、跨执行环境的信息选择；统一目标和职责见 `BRIEF.md`，加载入口与触发条件仍按 `templates/boot-protocol.md`。

## 1. 最小充分，按当前任务选择

只读取影响当前任务及下一项已授权动作的判断、实现或验证的信息。“最小”只能去除无关输入，不能省略 Task Contract 的必需输入、Authority、约束或 evidence，也不能降低证明标准。

不因材料存在而默认加载，不因文件类型、日期或属于历史而自动排除。开发需要相关代码与行为/验收契约；研究可读取未确认方案、历史基准和反证；审查与恢复按各自专项要求取输入。会改变当前结论的历史原因、原始证据、样本范围、必要约束、受影响调用链及验证事实，仍须读取。

## 2. 读取不等于采信

草案、假设和未确认材料可以作为待检验对象，不能当作已确认结论；已被替代的历史也不因读取恢复效力。聊天摘要或实现者总结只辅助定位，不替代原始 Contract、权威事实和 evidence。

事实层级、snapshot 与 Accepted Truth 由 `protocols/git-truth.md` 判断，授权由 `protocols/authority.md` 判断。本文不新增采信层级。

## 3. 具体疑点驱动补读，事实变化后重新核对

初始上下文不要求覆盖全部可能问题；出现具体疑点、事实冲突、证据缺口或影响面扩大时，补读解决问题所需的来源。信息不足则补读或如实报告缺口，不能用较少输入支持超出证据的结论。

可从代码、文档或 Git 重新取得的信息不必为未来可能使用而持续携带；当前动作需要时仍须取得。所依赖的权威事实变化后，重新读取相关来源，核对已有判断、授权与验证是否仍适用；持久化不代表运行时理解自动更新。

## 4. 专项纪律与原有事实载体

Independent Review 的 Fresh Isolation、同源投影、允许输入与充分性按 `protocols/review.md`；不能用上下文复用继承 Owner narrative。中断恢复、现实核验与 Task context boundary 按 `protocols/recovery.md`；工具实现按 Runtime Adapter。最小加载不绕过这些专项要求。

任务完成不自动产生 Context 摘要或经验提取产物。影响后续行动且需跨会话保留的必要事实，按 Git Truth 进入已有 Contract、Task/status、durable decision、candidate、review/finding 或 evidence，不维护第二份事实副本。

不新增 Task 字段、状态、Gate、Context 清单或更新记录，不要求自动归档、历史清理或知识提取系统。
