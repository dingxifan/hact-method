# task_plan · B 类 Dynamic Workflow 试点

## 项目目标

以 B 类流程（dispatch-new → develop → pr-review）为试点，把整个 B 类执行侧做成 Dynamic Workflow 模式。
目标状态：人只负责「发现 bug → 派任务」和「最终审 PR」，中间的修复-测试-循环全部由 DW 脚本自动完成。

## 背景

触发：Boris Cherny 的 Dynamic Workflows 文章（agent/parallel/pipeline API）。
核心判断：B 类任务是 hact-method 里最适合 DW 试点的场景——
- 无 Gate 前置，没有需要人工决策的里程碑节点
- 目标清晰（bug 修好/优化完成），成功条件可程序化判断
- 人工介入点少（派任务、审 PR），其余可全自动

## 阶段划分

| # | 阶段 | 状态 | 说明 |
|---|------|------|------|
| 1 | 设计讨论 | ✅ 完成 | D1-D8 全部定稿，见 findings.md |
| 2 | 方法论落地 | ✅ 完成 | workflows/ 目录 + README.md + templates/CLAUDE.md 已更新 |
| 3 | 脚本模板编写 | ✅ 完成 | workflows/b-class-develop.js 已写入，5 阶段 + schema 定义 |
| 4 | 接口打通 | ⏸️ 待安排 | b-queue 任务包格式 + b-tasks.md 行格式需在实际项目中核对 |
| 5 | 试跑验证 | ⏸️ 未开始 | 在 hact-app 项目中用一个真实 B 类 bug 跑通 |

## 待决设计问题（阶段 1 需要逐一过）

| # | 问题 | 状态 |
|---|------|------|
| D1 | DW 的范围：仅 develop 阶段，还是涵盖 pr-review 自动合并？ | ✅ 仅 develop 阶段 |
| D2 | DW 的触发方式：人工手动运行，还是 b-queue 有新任务自动触发？ | ✅ 人工手动触发（传 task-id） |
| D3 | loop 的停止条件：build+lint+type 通过？还是加单元测试？还是对抗审查 findings:[]？ | ✅ loop 内只跑机械验证（build+lint+type+单元测试）；机械全过后退出 loop，最后跑一次对抗审查 |
| D4 | 升级给人的条件（同一问题修 N 轮 / 根因在设计层 / hotfix 超范围）？ | ✅ 四条：a.3 轮机械验证未过升级、b1.对抗审查阻断则再修一轮再复审（失败则升级）、c.根因在设计层、d.hotfix 超范围 |
| D5 | DW 脚本存放位置：templates/workflows/？还是新建 workflows/ 目录？ | ✅ 新建 `workflows/` 目录（hact-method 根目录下，与 templates/ 平级） |
| D6 | pr-review 阶段是否也 DW 化，还是保持人工？ | ✅ 保持人工 |
| D7 | DW 与现有 status.yml / b-tasks.md 的写入契约如何对接？ | ✅ 只有主脚本写状态文件；子 agent 只负责代码修复，返回结果给主脚本 |
| D8 | DW 失败（脚本报错/agent 崩溃）时的回退机制？ | ✅ 自动重试一次；二次失败则任务回 `[可取]` + 上报错误原因 |

## 关键约束

- B 类 DW 是**试点**，不影响现有 A 类流程
- DW 脚本是**模板**，放在 hact-method；实际运行在各项目仓
- pr-review 仍由人工完成（DW 只到推 PR 为止）
