# exec: dispatch-new

B 类用于局部缺陷修复与小优化，无 Gate 前置。可以先读代码、调用链、测试和相关契约定位，再写最小任务包；不要求先猜文件或先造完整规格。A 类 PRD→TRD→任务规划与 G1–G5 不变。

## 1. 先调查，再按实际影响分流

只读检查现象、最小复现、相关实现、调用方与已有验证。已有信息足够就直接使用，不重复索要整套问卷。不能复现时如实记录 evidence-gap，不宣称已经定位原因。

| 留在 B 类 | 先处理上游决策，不直接实现 |
|---|---|
| 目标明确，局部改动及相邻行为可验证，失败可发现且可回退 | 新用户场景、新功能边界、权限/业务规则重新定义，或需要改已签 PRD/TRD、Foundation、project.md 技术约束、design.md |
| 未触及共享契约，填 `contract-impact: none` | 破坏已有调用方兼容性、数据库迁移/DDL、不可逆数据操作 |
| 既有意图下局部兼容的 API、类型或事件变化，填 `governed`，引用确认依据并列出共享写集、调用方和兼容性验证 | 改动范围或连带影响尚不清楚：继续只读调查；若仍无法圈定，报告缺口，不把“未知”填成 none |

跨文件不自动升级；跨模块核心逻辑重构无法用一个明确局部边界覆盖时不走 B 类。若已有权威契约与拟议结果冲突，先走 `revise-doc`；产生新业务承诺时走 A 类。不能靠 `governed` 授权自己改规格。

## 2. 写短包

最小内容是“问题 → 预期结果 → 验证条件”，附原始依据、实际影响范围和禁区。用户已明确给定目标与验收条件且授权修复时直接起草并执行，不重复等待签同一意图；存在实质决策分歧才提问。

写入 `b-queue/{task-id}.md`（序号先查 `status.yml` 和既有包，重复报告复用原任务）。以下为新 B 类短包；不用填 A 类的 sprint/module/delivery，也不凑 3–5 条 AC：

```yaml
---
package-schema: 2
task-id: {项目缩写}-b-{三位序号}
source: bug                 # 或 optimization
layers: [backend]           # 按实际层
task_type: dev-backend
urgency: normal             # 核心功能不可绕过时 hotfix
risk: standard             # 敏感四类命中或存疑即 sensitive
title: {简短标题}
description: {实际问题 → 用户预期结果}
contract-impact: none       # 或有依据的 governed
files:
  - {调查后确认的具体文件}
asset-writes: []            # governed 必须列出受影响的共享资产键
depends_on: []
ac-format: intent-oracle-v1
acceptance-criteria:
  - |-
    intent: {用户可观察结果}
    oracle: {复现输入、结果与相邻行为回归判据}
reference:
  - {原始问题/用户确认的持久记录或已有契约锚}
context: {定位证据；governed 还需说明调用方、兼容边界和验证入口}
do-not: []                 # 本任务不得改变的实际行为边界
---
```

有真实风险、升级条件、退役对象或前端视觉参照时补 `known-risks` / `escalate-if` / `supersedes` / design 引用，不为凑表复制通用条款。前端修复仍验证完整用户任务、失败与恢复，不只验证一个按钮。`files` 是调查后的写集，执行中变化须核对授权/共享冲突并更新包，不能静默扩围。

`governed` 的 reference 必须能回到已确认意图，context 说明为什么仍兼容；涉及共享写集的任务与其他活跃任务串行协调。检查器只能检查字段和高置信风险信号，不能证明语义兼容，preflight 和独立审查必须核实实际调用方与回归证据。

## 3. 派发与继续

运行：
```bash
node ../hact-method-lab/templates/scripts/check-b-task.js b-queue/{task-id}.md --root .
```

通过后在 `status.yml tasks[]` 登记一次：`type: develop`、`source: bug/optimization`、`iteration/sprint/delivery: null`、`status: 可取` 及实际依赖。状态/负责人/分支/PR 只写 status，不写第二份 B 类总账或任务包状态。

按已授权分支提交任务包与 status。已有开发授权时直接衔接 `develop`，继续实现→独审→修复→验证→交付；只要求诊断/派发时到此为止。hotfix 标注优先级并协调冲突，不擅自部署或向他人发消息。

B 类也要固定 diff 检查、freshness preflight、独立审查和实际回归。敏感改动保留合并前人工裁决；B 类无 Gate 不等于无质量门或无授权边界。
