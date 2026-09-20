# B Intake Protocol

B Intake 是 B 类 bug / optimization 进入 `develop` 之前的轻量入口协议。它不是 Core Task，不进入 G1–G5，也不新增 Task state。

## 1. Purpose

目标是先用真实代码、调用链、测试和已有 Contract 把问题圈定，再形成一个足够短、足够可验证、授权边界明确的 Development Intake。

正常路径：

`B Intake → develop(source=bug|optimization)`

诊断授权不自动等于修改授权。

## 2. When B class applies

可留在 B 类的典型条件：

- 目标明确，属于局部缺陷修复或小优化；
- 实际影响范围可通过调查圈定；
- 预期结果可验证；
- 失败可发现且通常可回退；
- 不产生新的产品承诺；
- 不需要重新定义权限 / 业务规则；
- 不要求破坏已有调用方兼容性；
- 不包含数据库 DDL / migration、不可逆数据操作或等价高影响变化。

以下情况不能为了“快”硬塞进 B 类：

- 新用户场景 / 新功能边界；
- PRD / TRD / Foundation / project technical contract 必须改变；
- 权限或业务规则重新定义；
- 破坏已有调用方兼容性；
- 数据迁移或不可逆数据操作；
- 范围 / 连带影响仍无法圈定。

有 Contract drift 时先走 `revise-doc`；产生新产品承诺时回 A 类流程。

跨文件本身不自动升级为 A 类，关键是意图、兼容性和真实影响边界。

## 3. Investigation first

B Intake 默认允许在修改前做只读调查：

- 复现现象；
- 读取相关实现和调用方；
- 读取已有测试；
- 读取相关 Accepted Contract；
- 判断共享资产 / compatibility impact；
- 判断 risk。

已有信息足够时直接使用，不重复问整套问卷。

不能复现或证据不足时写明 `evidence-gap`，不得把猜测写成根因。

如果继续调查仍无法圈定范围，停在 intake，不把“未知”伪装成 `contract-impact: none`。

## 4. Contract impact

### `none`

只在以下事实成立时使用：

- 不改变已批准产品 / 技术 Contract；
- 不改变共享 schema / API / type / event 的外部语义；
- 不要求调用方迁移；
- 修改完全位于既有意图内。

### `governed`

允许在**既有已确认意图内**做局部兼容变化，但必须：

- reference 能回到确认依据；
- 明确受影响调用方；
- 明确共享 `asset-writes`；
- 明确兼容边界和验证入口。

`governed` 不是修改 Contract 的授权，也不能用于掩盖 migration / breaking change。

## 5. Durable output

B Intake 最终产生一个短 Development Intake / Task Package，当前兼容序列化可继续使用：

`b-queue/{task-id}.md`

至少表达：

- task id
- `source: bug | optimization`
- layers / implementation surface
- title
- actual problem → expected result
- `contract-impact`
- investigated write set / files
- `asset-writes`
- dependencies
- `intent + oracle`
- authoritative references
- context / reproduction evidence
- `do-not`
- risk
- 必要的 `escalate-if` / `supersedes`

不要求 A 类的 sprint / module / delivery 元数据，也不为凑格式制造 3–5 条 AC。

前端 B 类仍验证完整用户任务、失败和恢复，不只验证一个按钮。

## 6. Deterministic validation

项目已有 `check-b-task.js` 或等价 checker 时继续使用；vNext migration 不修改该 checker。

Checker 只能证明：

- 必要字段存在；
- enum / schema 合法；
- 一些高置信 risk / contract signal 没有明显违规。

Checker 不能证明：

- 语义兼容；
- 调用方真实安全；
- Contract 没有漂移；
- risk 判断一定正确。

这些留给 `develop` preflight、verification 和 Independent Review。

## 7. Status handoff

只有 Intake 已满足 `develop` 的硬前置时，才在当前 status contract 中登记对应 develop work item，并使其进入 `可取`。

典型字段语义：

- `type: develop`
- `source: bug | optimization`
- `iteration: null`
- `sprint: null`
- `delivery: null`
- `status: 可取`

Task state 从这里开始属于 `develop`，不是 B Intake 自己的生命周期。

重复问题应先查现有 status / intake，避免创建第二个等价 Task。

## 8. Authority

只读诊断可以在已获诊断授权的范围内连续进行。

以下动作需要对应 Human Authority：

- 从诊断扩大到代码修改，而用户只授权调查；
- 改变产品 / 业务 Contract；
- 扩大 scope；
- 高影响 / 不可逆操作；
- 生产 / 外部副作用；
- 无法从权威事实合法裁决的重要歧义。

已有明确修复授权时，Intake 完成后可直接衔接 `develop`，不重复确认同一意图。

## 9. No Gate

B 类不运行 G1–G5。

无 Gate 不等于：

- 无 Contract；
- 无 test；
- 无 freshness；
- 无 Independent Review；
- 无 Human Authority 边界。

质量和交付纪律由 `tasks/develop.md` 继续承担。
