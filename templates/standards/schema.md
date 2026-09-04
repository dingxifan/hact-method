# Standards 规则 schema

> 本文件定义项目根 `standards-{shared,frontend,backend}.md` 的职责与条目格式。公共 layer/stack 模板是候选规则库；播种或维护项目 Standards 时，必须按本 schema 选择并改写，不整节复制。

## 唯一职责

Standards 只保存：开发者未来再次做同类改动时，不读任何历史背景也仍须遵守的、跨任务且长期稳定的项目默认规则。

| 事实 | 权威对象 |
|---|---|
| 本期用户可观察行为、AC | PRD |
| 本期接口、状态、错误与模块契约 | TRD |
| 跨切面不变式、强制档与探针 | Foundation |
| 跨任务稳定默认实现约束 | Standards |
| 当前任务相对 as-built 的增量 | Task package |
| 机制位置、检查范围与运行命令 | 对应 check/test/config；Standards 只引用 enforcement id |
| 取舍、事故、版本演进与实测数据 | decisions/history |
| 临时缺口、补偿纪律与解除条件 | waiver/backlog |

TRD 可用明确的等价方案覆盖 Standards 默认值；不得静默破坏 Foundation 不变式。实现与文档冲突时先核 intent/invariant，不默认强迫代码模仿文档指定的 helper/service。

## 条目格式

```markdown
### BE-DATA-03 · 版本化写入默认走 CAS

- applies-if：修改版本化实体或启用指针
- rule：写入携带 expectedRevision；冲突返回 REVISION_CONFLICT
- grade：构造级
- enforcement：base-repository-cas + concurrency-test
- override：TRD 可指定另一种等价并发控制机制并写明验证方式
- superseded-when：项目不再存在版本化实体，或 Foundation 由更强机制接管
```

- id：稳定且唯一；建议 `{SH|FE|BE}-{主题}-{两位序号}`。
- `applies-if`：让 plan-sprint 能只选择当前任务命中的规则。
- `rule`：只写当前可执行真值，不写来源故事或事故过程。
- `grade`：`构造级 / 机械级 / 人审级`。高于人审级必须给 enforcement id；机制位置与覆盖范围由对应 check/test/config 承接。
- `override`：默认值允许怎样被 TRD 的等价方案显式覆盖；不可覆盖写“不可覆盖，须先修 Foundation”。
- `superseded-when`：规则何时退出或由谁接管，防止永久追加。

## 准入门槛

普通条目必须同时满足：

1. 跨两个以上任务重复适用；
2. 预计跨两个以上迭代仍成立；
3. 不是业务契约、当前代码位置或当前实施状态；
4. 能写清 `applies-if`；
5. 强制档与 enforcement 真实一致；
6. 有覆盖方式与退出/替换条件；
7. 脱离历史叙事仍可执行。

安全或数据不变式可在一次事故后直接升格，但仍须满足 `applies-if / grade / enforcement / superseded-when`。未过门槛的候选按事实类型迁往 TRD、Foundation、decisions/history 或 waiver/backlog，不以“以后也许有用”为由留在 Standards。

## 维护与加载

- Standards 只保留当前态；禁止新增 `v1/v2/v3` 版本增补段、任务号、PR 号、AC 号、事故长叙事与易漂移行号。
- 维护时更新或替换既有条目；历史原因进 decisions/history，不在正文 append。
- plan-sprint 先读条目 id + `applies-if`，只把命中的 id 写入 `relevant-standards`。
- develop 与 per-task review 只加载 `relevant-standards` 命中的条目；不得默认重读整份 Standards。
- 已被类型、lint 或测试完整承接的散文只留规则索引与 enforcement id，删除重复人工教程。
- **消耗审计与收缩**：每次 full review 在 round report 写实际核过的 `standards_checked` id。只有本期出现 standards-candidate 或用户明确发起 cleanup 时，才扫最近两个已完成迭代的任务包 `relevant-standards` 与 review reports。连续两期零引用只产生**复核候选**，不是删除证据；只有 `superseded-when` 已成立、`applies-if` 在项目中已不可能命中，或规则已迁入明确的更强权威对象时才能删除。安全/数据规则默认保留，除非能给出更强承接锚。仍在执行的 enforcement 只保留简短规则索引，不把机制说明抄回散文。0 candidate 的普通迭代不展开三份全文；旧报告缺 `standards_checked` 记 `unknown`，不得当零使用。零 finding 不能单独证明规则无价值。
