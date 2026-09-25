---
schema: hact-task/vnext
task: deploy
class: cross-cutting
discipline: deploy
gate: null
preferred_runtime: execution
required_capabilities:
  - repository-read
  - command-execution
  - remote-execution
  - deployment
  - persistence
review: none
---

# deploy

## 1. Purpose & Scope

### Purpose

把一个**明确、已接受、已获部署授权的 Git snapshot**发布到指定目标环境，并用构建产物、运行状态和健康验证证明目标环境实际处于预期版本。

`deploy` 可以服务 A 类迭代，也可以服务已经完成的 B 类 bug / optimization / hotfix；是否允许部署由当前 snapshot、目标环境和 Human Authority 决定，而不是由 Runtime 或模型能力决定。

### In scope

- 确认本次 deployment target 与 exact snapshot
- 本地或交付前构建验证
- 将已接受代码通过版本控制进入目标环境
- 目标环境构建 / 发布
- 构建产物事实验证
- 服务 restart / reload / platform publish
- 健康检查与必要运行日志核对
- 失败时停止、回滚或保留旧版本
- 持久化部署结果与实际 deployment state

### Out of scope

- 在服务器上直接修改代码
- 把未进入 Accepted Project Truth 的 Local Working Truth 部署出去
- 在部署过程中“顺便”修改业务逻辑
- 用 restart 成功冒充 deployment 成功
- 用 build exit code 冒充构建产物真实存在
- 未获授权的 production / paid / irreversible external action
- 代替 `manual-test` 做产品验收
- 代替 G5 做迭代事实闭合

Task Contract 只定义 deployment 语义。SSH、平台 CLI、进程管理器、具体构建命令和 UI 操作进入 Runtime Adapter / 项目 deployment configuration。

## 2. Preconditions

从 `可取` 进入 `taken-by` 前必须满足：

- 当前 HACT Method fixed SHA 已知。
- `status.yml` 可读取。
- `target` 环境明确，例如 `staging` / `prod`。
- 待部署 snapshot 是 immutable Git snapshot。
- 本次 deployment scope 能明确列出实际包含的 A / B / hotfix 变更。
- 目标环境的连接、构建、产物、重启 / 发布和健康验证入口可查。
- Secrets 不进入 Git、Task Contract、deploy log 或聊天持久化。

按来源的附加前置：

### A-class regular deploy

- `manual-test` 已 `merged`。
- G4 已 approved。
- 待部署 snapshot 不包含 G4 之后尚未获得相应接受 / 授权的额外业务改动。

### B-class deploy

- 对应 B 类 develop Task 已 `merged`。
- 用户明确授权把指定 B 类 Accepted snapshot 部署到指定 target。
- 不因为“任务很小”自动取得 deployment authority。

### Hotfix fast path

- hotfix develop Task 已 `merged`。
- 用户或其明确指定的发布审批人已对**具体 hotfix snapshot + target**给出 deployment authority。
- 可以不等待 A 类 G4，但不能跳过本 Task 的构建、产物和健康验证。

如果 deployment authorization 已明确覆盖 target、snapshot 和正常 restart / publish side effect，不在每个机械步骤重复询问。

## 3. Authoritative Inputs

### Required

- 当前 HACT Method fixed SHA
- `status.yml`
- exact deploy snapshot / commit SHA
- 本次 deployment scope
- 当前 Accepted Project Truth 中的代码与配置
- 项目当前 deployment configuration
- 项目当前 connection / credential reference
- 当前动作实际触发的 Shared Protocol projection；按 `templates/boot-protocol.md` 与对应 Protocol 的最小加载规则读取，不预加载全部 `protocols/`

### Conditional

- G4 approved snapshot
- hotfix / B-class develop Task Contract
- prior deploy log
- rollback pointer / previous successful version
- environment-specific release policy
- platform-specific health or smoke checks

上一 Runtime 的“已经部署”“已经构建”总结不是权威输入。必须核真实 Git snapshot、目标环境和实际 evidence。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| Deployment result | 真实目标环境 | 外部世界状态，不由 Git 文本替代 |
| Deploy log | `deploy-log.md` 或项目等价位置 | 追加，不覆盖；记录 target、snapshot、结果与 evidence |
| Deployment state pointer | `status.yml` / `project.md` 当前约定位置 | 只记录真实 deployed / failed / pending / rollback 状态 |

### State updates

- `status.yml`：deploy Task lifecycle
- 如项目当前 schema 维护 deployment metadata，则写 exact target / snapshot / result pointer

### Conditional outputs

- rollback record
- incident / bug B Intake

不得把 secret、token、完整生产日志或不必要的用户数据写进 durable artifact。

## 5. Decision Rules & Boundaries

### 5.1 Deploy exact snapshot

部署对象必须是明确 Git snapshot。

禁止使用：

- “最新 main”
- “刚才验收那版”
- 未提交工作树
- 含额外未接受改动的 branch tip

作为正式 deployment target。

执行前必须确认目标环境最终将运行哪个 snapshot；执行后必须能证明实际运行世界与该 snapshot 对应。

### 5.2 Version-control-only source changes

目标服务器 / 平台上的业务代码只能通过正常 source-of-truth 路径更新：

`local / repository change → Accepted Git Truth → target pull / release`

禁止在目标服务器直接编辑代码来修部署问题。

如果部署失败根因需要代码修复，退出 deploy，回到对应 `develop` / B Intake；修复 `merged` 后再创建新的 deploy attempt。

### 5.3 Build failure stops release progression

任何必要 build / type / package / release preparation 失败时：

- 当前 attempt 失败
- 不执行依赖该产物的 restart / publish
- 保留当前可用版本
- 记录 evidence 与恢复入口

不得通过跳过失败命令、忽略错误或手工复制未知产物继续。

### 5.4 Artifact gate

构建命令退出码为 0 不是充分条件。

如果部署形态存在 build artifact，必须验证：

- artifact 存在
- artifact 对应本次 deploy snapshot
- artifact freshness 不早于本次代码 / release source
- 必要 runtime package / image / bundle identity 可核对

artifact gate 未通过时禁止 restart / promotion。

具体文件时间戳、image digest、bundle hash 等实现方式由 Runtime / deployment configuration 决定。

### 5.5 Restart / publish authority

Production、真实用户流量、付费服务、不可撤销第三方动作属于 Human Authority 边界。

deployment authority 至少绑定：

- target
- exact snapshot
- deployment scope

如果授权已经明确覆盖正常 restart / reload / publish，不为同一语义动作重复确认。

但从 staging **推进到另一个更高影响 target**（例如 prod）是新的 deployment target，需要该 target 的明确 Authority，不能用 staging 授权自动外推。

### 5.6 Health and actual behavior

restart / platform publish 成功不等于 deployment 成功。

至少需要：

- 目标服务 / 页面 / health endpoint 可达
- 当前运行版本与目标 snapshot 相符
- 必要近期运行日志无阻断性启动错误
- 项目约定的 deploy smoke / readiness check 通过

健康检查如果只能证明“服务活着”，仍需结合版本 / artifact identity 避免旧版本健康检查假绿。

### 5.7 Failure and rollback

部署后健康验证失败：

- 不宣布 deploy 完成
- 优先保留或恢复最后一个已知可用版本
- 记录真实失败状态
- 根因属于代码时回 `develop`
- 根因属于部署配置 / 环境时在本 Task 授权范围内修正并重新验证
- 需要扩大权限、改变生产架构或执行高影响破坏动作时请求 Human Authority

Rollback 成功只是当前环境恢复，不代表失败的 deployment attempt 变成成功。

### 5.8 Multi-environment promotion

多个 target 必须分别有独立 result / evidence。

例如 `staging → prod`：

- staging 通过不等于 prod 已获授权
- prod 失败不改写 staging 的真实成功记录
- 每个环境绑定实际部署 snapshot
- 如果 promotion 前 snapshot 发生变化，必须重新判断此前 evidence 是否仍有效

### 5.9 Deployment and G5 are independent

deploy 与 `wrap-up-iteration` 在 G4 后可以并行。

G5 不要求 deploy 必须成功；允许：

- deployed
- deployment pending
- deployment failed
- deployment not-applicable

但项目事实必须准确记录真实 deployment state，不能把 pending / failed 写成已上线。

## 6. Verification

### Deterministic

必须能够机械证明：

- deploy target 明确
- deploy snapshot 是 immutable Git object
- 来源前置（A/G4、B merged、hotfix authority）满足
- 必要本地 / release build 通过
- 必要 target build / release preparation 通过
- build artifact gate 通过
- target 实际版本 / artifact identity 与 deploy snapshot 一致
- health / readiness check 通过
- 必要启动日志无 blocking error
- deploy log 已记录 actual result
- secrets 未进入 durable artifact
- 项目当前 deploy checker / connection checker（若存在）通过

### Semantic

必须确认：

- 部署 scope 没夹带未接受业务改动
- target 与用户授权一致
- 失败没有被 restart / exit code / health 假绿掩盖
- rollback / recovery 后的实际运行状态被准确记录
- 多环境 promotion 没有越过新的 Authority 边界

## 7. Review & Human Authority

### Independent Review

deploy 默认不增加固定 AI Independent Review。

质量主要来自：

- exact snapshot
- deterministic artifact / health checks
- repository / environment protection
- Human Authority

对高风险 deployment plan、migration 或不可逆 release 可按风险增加 independent review / specialist check，但不替代 Human Authority。

### Human Authority

至少以下情况需要明确 Human Authority：

- production deployment
- hotfix 绕过 A-class G4 的 deployment
- 从低风险环境 promotion 到更高影响环境
- 不可逆 migration / data operation
- 真实付费 / 外部不可撤销副作用
- 正常 deployment scope 之外的权限或架构改变

更强模型、管理员 shell 权限或能成功执行命令都不能替代 Authority。

## 8. Completion & Handoff

### `done`

满足：

- deployment attempt 已对 exact snapshot 执行
- artifact / health / version evidence 有明确结论
- 外部目标环境实际状态已知
- deploy log candidate 已形成
- 失败时 rollback / current serving state 已明确
- 无未解决 Authority ambiguity

成功和失败都可以形成稳定 deployment result；但只有成功结果满足正常 deploy Task completion。

若当前目标未成功且用户决定暂不继续，Task 保持 `taken-by` / blocker 或按当前项目任务管理方式结束为明确失败，不得把失败标成 `merged`。

### `merged`

成功路径满足：

- target 正在运行 / 提供目标 snapshot
- deterministic deployment verification 通过
- deploy log 与必要 state 已进入 Accepted Project Truth
- `status.yml` 准确记录 deploy `merged`

### Downstream

deploy 不阻断 `wrap-up-iteration` 形成 G5 readiness。

如果 wrap-up 已完成而 deploy 后续状态变化，更新 deployment truth / log；不撤销历史 G5，只记录新事实。

部署后发现功能问题进入新的 B Intake / hotfix develop，不回退已 `merged` deploy Task。

## 9. Recovery Notes

恢复时除 `protocols/recovery.md` 的共同来源外，额外确认：

- target
- exact deploy snapshot
- 当前目标环境实际运行版本
- 上一步已完成的 build / artifact / restart / health evidence
- previous successful version / rollback pointer
- 当前 deploy log
- 尚未完成的 external side effect

不能只根据聊天或“上次做到 Step 5”恢复。

优先从真实目标环境和 Git snapshot重建状态：

- 已实际发布但日志未落 → 核版本与健康后补记录
- build 完成但尚未 restart → 核 artifact 仍有效后继续
- snapshot 已变化 → 旧 deployment evidence 不自动适用
- 是否已执行外部副作用不确定 → 先查询真实系统，不能盲目重做
