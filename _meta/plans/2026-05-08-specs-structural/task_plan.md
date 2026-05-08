# 任务计划 · 结构层规范（specs-structural）

## 阶段目标
基于 `skeleton/04-task-catalog.md` 列出的 12 个 task type，在 `specs-structural/` 下逐一写出完整契约文档。每份文档覆盖：边界场景、错误处理、字段细节、与相邻 task 的接口约定——骨架中有意省略的"怎么做"层。

## 完成标志
- 12 份 `specs-structural/{task}.md` 全部落地
- 每份覆盖：字段完整定义 / 前置后置条件 / 完成判据细化 / 边界场景 / 异常处理 / 与相邻 task 的接口约定
- 相互引用一致（自检通过）

## 任务列表

| # | task type | discipline | Gate | 状态 |
|---|---|---|---|---|
| 1 | `develop` | dev-frontend / dev-backend | — | ✅ |
| 2 | `code-review` | review | — | ✅ |
| 3 | `draft-prd-vN` | product | G1 | ✅ |
| 4 | `draft-tech-design` | architecture | G2 | ✅ |
| 5 | `plan-sprint` | dispatch | G3 | ✅ |
| 6 | `revise-doc` | product / architecture（target 派生） | — | ✅ |
| 7 | `dispatch-new` | dispatch | — | ✅ |
| 8 | `generate-integration-tests` | integration-testing | — | ✅ |
| 9 | `manual-test` | product | G4 | ✅ |
| 10 | `deploy` | deploy | — | ✅ |
| 11 | `wrap-up-iteration` | management | G5 | ✅ |
| 12 | `init-project` | management | — | ✅ |

写作顺序说明：高频核心任务（develop / code-review）优先，然后是准备段（draft-prd-vN / draft-tech-design / plan-sprint），最后是辅助与收尾类。

## 前置材料整理（待 subagent 返回后填写）

> 待整理：human-ai-col 和 aicoder 工作区可复用材料清单。

## 下一步起点

材料整理完成后，逐一讨论每个 task spec 的边界场景设计，再下笔写。
