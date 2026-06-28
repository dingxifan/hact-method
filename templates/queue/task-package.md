<!--
  任务包模板 · plan-sprint 产物 · 每个 develop 任务一个文件，存 iterations/vN/queue/{task-id}.md
  序列化锁定：YAML frontmatter（check-sprint.js 据此 parse）。字段规范见 specs-structural/develop.md §字段规范。
  填写规则：所有 <待填> 必须替换为实值；无依赖的 depends_on 填 []（不是 <待填>）；
           api-contract 仅 layers=[backend] 且接口被前端消费时填，否则整段删除（注释掉的不算填）。
  注：本文件 frontmatter 即任务包正文；--- 之后正文段可留空（17 字段已在 frontmatter）。
  视觉地基包：全局 reset + UI 库主题覆盖（设计主色等 token 映射）+ design.md token 全局接线（variables.scss + main/App 入口），
           不属任何业务页。在 frontmatter 加 `baseline: visual` 标记（仅此包加，其余包不加；check-sprint 据此机械核 v1 必有）；
           其余 frontend 任务 depends_on 它。触发与内容见 plan-sprint Step 2。
-->
---
task-id: <待填>            # 唯一标识，命名 {项目缩写}-v{N}-{三位序号}，如 hact-v4-001；对应 sprint.md 行
sprint_id: <待填>          # 所属 Sprint 标识，如 v4-s1；由 plan-sprint 填
layers: <待填>             # [frontend] / [backend] / [shared]（数组写法）
source: <待填>             # sprint / integration / manual-test / bug / optimization
task_type: <待填>          # dev-frontend（layers=[frontend]）/ dev-backend（layers=[backend]）/ shared 时显式指定
# baseline: visual        # 仅「视觉地基包」加此行；普通任务包不写。见顶部说明 + plan-sprint Step 2
urgency: normal           # normal（默认）/ hotfix
title: <待填>              # 简短描述，≤15 字
status: 可取               # plan-sprint 初始写「可取」；流转：可取 → taken-by:{user} → done → merged
description: <待填>        # 格式「当前状态 → 期望状态」，不写"实现XXX"
depends_on: []            # 前置 task-id 列表，无依赖填 []；与 sprint.md 依赖列、status.yml depends_on 三处一致
files:
  - <待填>                # 必改文件路径，精确到已知行号范围；不预防性列"可能"文件
acceptance-criteria:
  # 每条须标覆盖的 PRD AC：(源：PRD AC-nn)；可选人读后缀 (源：PRD AC-nn·删除二次确认)，linter 只读 AC-nn；纯技术约束标 (技术)
  # 不可视区(backend/逻辑)任务：每条以 Given/When/Then 可执行例子书写（输入→期望输出），供 develop 1:1 落成测试
  - <待填>
relevant-standards:
  - <待填>                # 精确指向 standards-{layer}.md / standards-shared.md 的 § 章节（design.md 为 frontend 无条件必读，无需在此列）
reference:
  - <待填>                # 文件路径 + 行号（必填，如 L142 或 142-160，拒"全文"/无范围）+ 说明
  # 前端任务：reference 须含 ux-flows.md 对应功能段行号条目
  # 后端任务：reference 须含 trd.md 错误码清单段 + # 服务流程：{场景名} 段行号条目
context: <待填>           # 关键实现切入点，如 GoalList.vue L142 handleDelete()
known-risks:
  - <待填>                # 来自 TRD 或现有代码的实际陷阱，不是猜测
do-not:
  - <待填>                # 明确禁止边界，防止范围蔓延
  - 禁止在代码、PR 描述、完成报告中明文出现 PAT / access token / 密码 / 私钥 / API key  # 通用凭据红线（默认保留）
escalate-if:
  - <待填>                # 触发上报的条件
  - 上下文不足以做实现决策  # 默认保留
# --- 以下仅 layers=[backend] 且该接口被前端消费时填，由 plan-sprint 推导写入；不需要则整段删除 ---
# api-contract:
#   endpoint: <待填>       # 如 GET /api/...
#   request:              # 可选，有 query / body 时填
#     query: { field: type }
#     body: { field: type }
#   response:             # 字段平铺，不嵌套（嵌套须注明原因）
#     field: type
---
