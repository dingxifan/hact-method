# Standards 模板条目迁移审计 · 首轮

> 范围：`templates/standards/{shared,frontend,backend,frontend-vue3,backend-nestjs}.md`。本轮先按章节分类，不批量删除候选规则；项目播种端改为按新 schema 选择与改写。

| 原章节 | 当前对象 | 类型 | 目标对象 | 首轮动作 | 是否影响正式行为 |
|---|---|---|---|---|:---:|
| shared · 命名规范 | shared template | 稳定默认候选 | Standards | 保留候选；播种时拆成带 applies-if 的规则 id | 否 |
| shared · 代码注释 | shared template | 稳定默认候选 + 历史去向说明 | Standards + decisions/history | 规则保留；项目 Standards 不复制历史举例 | 否 |
| shared · API 响应格式 | shared template | 项目默认 + 具体机制名 | Standards + TRD/Foundation | 默认形状可保留；具体 interceptor/helper 改为 enforcement id，接口例外归 TRD | 是 |
| shared · 错误码约定 | shared template | 本期业务契约 | TRD | 模板仅保留“错误词汇须有单一权威”的候选规则，不把具体码表播种进 Standards | 是 |
| shared · 权限模型 | shared template | 架构/安全不变式 | Foundation + TRD | 项目鉴权形态归 Foundation，接口权限归 TRD；Standards 只留稳定实现默认 | 是 |
| shared · 测试环境约定 | shared template | 运行/验证机制登记 | project/config/checks | 暂保留候选；后续迁机制登记，Standards 只引用测试机制 id | 否 |
| shared · 跨层安全规范 | shared template | 稳定默认 + Foundation 不变式 | Standards + Foundation | 凭据/日志默认保留；鉴权与数据隔离强边归 Foundation | 是 |
| frontend · 设计系统 | frontend template | 稳定默认 + Foundation 视觉地基 | Standards + Foundation | 组件级默认保留；全局入口/主题强制档由 Foundation 承接 | 是 |
| frontend · 异步/响应式/状态/工具/常量/整洁 | frontend template | 稳定默认候选 | Standards | 保留候选，逐条补 applies-if/grade/enforcement；不整节复制 | 否 |
| backend · 分层/响应/入参/安全 | backend template | 稳定默认 + Foundation 强边 | Standards + Foundation | 默认约束保留；全局管道/守卫等唯一机制移为 enforcement 引用 | 是 |
| backend · 日志/数据库/定时/整洁 | backend template | 稳定默认候选 | Standards | 保留候选，部署运维段另行评估是否迁 deploy 规范 | 否 |
| backend · 部署防火墙 | backend template | 环境/运维流程 | deploy config/spec | 候选迁出，首轮不删 | 否 |
| frontend-vue3 / backend-nestjs | stack template | 栈特定稳定默认候选 + 机制细节 | Standards + checks/config | 作为候选库保留；项目条目只引用机制 id，不复制事故说明 | 否 |

## 首轮结论

- 当前公共模板继续作为候选库存在，避免在未完成项目级迁移前丢失规则。
- 正式项目 Standards 的生成入口已改为按 schema 重写，先停止新增历史/契约/机制叙事。
- 具体章节删除与 enforcement registry 迁移留下一轮；本轮不改变既有项目正式行为。
