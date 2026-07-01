# 任务路由矩阵：CC 与 Codex 混合执行

> 本文回答：hact-method 的各类任务更适合由 Claude Code、Codex，还是二者混合执行。
> 本矩阵是初始建议，需通过试点修正。

## 判定维度

| 维度 | 更适合 CC | 更适合 Codex |
|------|-----------|--------------|
| 上下文长度 | 需要长对话、长资料、多轮澄清 | 输入可压缩为任务包、diff、行号引用 |
| 工作性质 | 语义收敛、产品判断、方案推演 | 文件编辑、代码实现、检查器、局部审查 |
| 用户参与 | 需要频繁拍板和澄清 | 只需少数明确人工门 |
| 验证方式 | 主要靠人确认语义 | 可跑测试、lint、脚本、`rg` |
| 风险形态 | 方向错会影响整期 | 局部错可回滚、可审查 |

## 任务类型矩阵

| task.type | 推荐执行方 | 原因 | Codex 可参与点 | 交接物 |
|-----------|------------|------|----------------|--------|
| `init-project` | CC 主导 | 涉及项目命名、Gitee、看板应用、成员 notes、地基共识讨论，人工门多 | 创建文件结构、补模板、检查初始化结果 | init 检查清单、目标目录、模板路径 |
| `draft-foundation` | CC 主导，Codex 辅助 | V0 地基设计需要共识讨论、技术栈拍板、强制边判断 | 检查 `foundation.md` 表格完整性、standards 播种一致性 | foundation.md、foundation-design.md、standards |
| `draft-prd-vN` | CC 主导 | 长需求对话和产品语义收敛 | PRD 结构检查、AC 编号一致性检查 | PRD 文件、check-docs 输出 |
| `draft-ux` | CC 主导 | 强交互设计、原型走查、用户反馈多轮 | HTML/CSS 局部修复、结构检查、可访问性检查 | prototype.html、ux-flows.md、design.md |
| `draft-tech-design` | CC 主导，Codex 辅助 | 技术方案推演需要读 PRD、代码现状、决策并和用户拍板 | TRD 结构检查、AC 回链检查、standards 去重、脚本检查 | PRD、TRD、standards、decisions |
| `plan-sprint` | CC 主导初拆，Codex 审查 | 拆包需要理解 PRD/TRD 全貌和依赖 | 任务包独立审查、AC 覆盖检查、`status.yml` 一致性修复 | queue、sprint.md、status.yml、review brief |
| `develop` | Codex 优先，CC 编排 | 单个任务包若边界清晰，非常适合 Codex 执行 | 代码实现、测试、局部审查、状态回写 | develop handoff 包 |
| `generate-integration-tests` | 混合 | 探索真实系统行为需要工具执行和反复修脚本 | curl/Playwright 脚本编写与调试、失败归因 | PRD/TRD 场景、运行地址、测试命令 |
| `manual-test` | CC / 人主导，Codex 辅助 | 人工验收和产品判断不可替代 | 整理验收报告、把失败项转任务包 | 验收记录、失败复现步骤 |
| `deploy` | CC 主导，Codex 辅助 | 涉及服务器权限、发布窗口和运维确认 | 本地 build 检查、部署脚本审查、日志整理 | deploy 配置、目标环境、健康检查命令 |
| `wrap-up-iteration` | CC 主导，Codex 辅助 | 需要偏离对账和反馈分流判断 | `feedback.md` 归类建议、跨文件一致性扫描 | PRD/TRD/diff/feedback/project.md |
| `dispatch-new` | CC 主导，Codex 辅助 | B 类入口要判断 bug/optimization 边界和优先级 | 写任务包、检查字段完整性 | bug/优化描述、目标 source |
| `revise-doc` | CC 主导，Codex 辅助 | 修订常来自上游语义变化，需要用户确认 | 最小化文档 patch、引用修复、下游影响扫描 | 修订原因、目标文档、影响范围 |
| `harvest-notes` | CC 主导，Codex 辅助 | 涉及个人 notes 收割、去重择优和公共层归类 | 去重、格式化、候选条目整理 | hact-config、notes 条目、目标公共文件 |

## Codex 优先承接的工作包

1. **单个 develop 任务**
   - 任务包字段完整。
   - reference 和 relevant standards 明确。
   - 测试命令可运行。
   - 不需要重新讨论 PRD/TRD。

2. **独立审查**
   - 输入只包含权威原文：任务包、diff、standards、测试结果。
   - 不包含执行者自评。
   - 输出只分阻断、建议、通过。

3. **一致性检查**
   - queue / sprint.md / status.yml 对齐。
   - PRD AC / TRD 回链 / 任务包 AC 覆盖。
   - 旧术语、旧路径、悬挂引用扫描。

4. **方法论局部修改**
   - 改动目标明确。
   - 文件范围可列出。
   - 可用 `rg` 或脚本验证无残留。

## 暂不建议 Codex 独立承接的工作

- 从零需求澄清。
- 大型 UX 方案生成和用户走查。
- 需要长时间保留业务上下文的技术方案主推演。
- 上游文档不完整、需要现场补 PRD/TRD 的 develop 任务。
- 安全敏感改动的最终合并裁决。

## 初始结论

混合模式的合理切法不是按「产品/开发」分人，而是按「语义收敛 vs 可验证执行」分工：

- CC 负责让任务变清楚。
- Codex 负责把清楚的任务做扎实。
