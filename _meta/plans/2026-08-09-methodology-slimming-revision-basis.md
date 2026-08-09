# 方法论瘦身修订底稿：对象收口、证据分层与独审路由

> 状态：修订输入底稿；正式落地结果见 `2026-08-09-methodology-slimming-implementation-note.md`  
> 日期：2026-08-09  
> 上游讨论：`2026-08-09-runtime-adaptation-vs-master-method-discussion.md`  
> 主要实证：`document-extraction`、`file-extract`  
> 用途：作为下一轮 hact-method 瘦身修订的范围、原则、实施顺序与验收依据

---

## 一、这轮瘦身要解决什么

最近一个月的方法论演进解决了大量真实失效：假绿、机械边空口声明、AC 不可达、跨包归属真空、旧代码零路由但未退役、审计字段定义后无人填写等。这些增量大多有真实项目证据，不宜因开发变慢而整体回滚。

与此同时，`document-extraction` 与 `file-extract` 暴露出另一类问题：方法论控制面只小幅增加，项目侧的 standards、foundation as-built、任务包和独审记录却持续膨胀；代码独审逐渐同时承担代码正确性审查、规格澄清、历史清账和方法论实验，最终又统一进入“阻断 → 改代码/文档 → 完整重审”的单一路径。

本轮瘦身的目标不是降低质量门槛，而是：

1. 让每类事实只住在一个权威对象里；
2. 让不同寿命的信息不再混在同一份活文档；
3. 让独审 finding 按根因进入正确控制流；
4. 只对当前任务真实打开的风险面付验证成本；
5. 保留能抓真问题的探针、可达性、退役账和闭环机制；
6. 删除重复叙述、历史考古、已被机器承接的散文约束和无预算的证据展开。

---

## 二、核心判断

### 2.1 用户感受到的减速有真实依据

至少存在三类会被误送进代码整改循环的问题：

1. **契约与 as-built 漂移**：实现满足实质要求，文档描述落后或写错；
2. **AC 意图正确、例子错误**：具体数字或状态推演与既定判据算不出来；
3. **强制档声明错误**：真实不变式已被另一层保证，但文档把某个具体 service/helper 写成唯一手段，或把人审级机制写成机械/构造级。

这些不是边缘案例：

- file-extract `fe-rd-002` 登记 V1 TRD 与 as-built 10 处不一致，明确写明“十条无一是 code bug”，实现零改动；
- `fe-rd-005` 又登记 V2 七处同类不一致，同样“七处无一是 code bug”；
- `fe-v3-010` 的 AC 示例原要求 42 行，但既定双阈值与真实窗形状只能得出 40，最终正确动作是订正任务包示例而非修改阈值；
- doc-extract V0 二审把“合法状态边可绕过 service”判为构造级缺陷，后续复核确认 DB 已保证真正不变式、service 没有额外受保护副作用，最终降级为文档澄清。

### 2.2 不能据此否定独审

同一批审查也抓到了可构造、可达、会改变行为的真实缺陷，例如：

- 鉴权装饰器别名绕过；
- 裸 SQL 破坏登记记录不变式；
- stale dist 导致测试看起来绿但测的不是当前源码；
- 收窄重抽时父窗已付费抽到的表头被静默丢弃；
- 同路由换参后旧状态不刷新；
- 付费模型调用预估上界低于真实调用数；
- 错误信封把应为 400 的输入错误变成 500。

因此，本轮不取消独审，也不回退反例探针。要修改的是独审的作用域、阻断门槛与 finding 路由。

### 2.3 主要问题是“控制面小增，项目数据面放大”

从共同基点 `2d31383` 到当前 master，8 份关键方法论流程/模板文件总字符只增加约 6.3%；但项目产物增长明显更快：

| 指标 | 早期 | 当前 | 变化 |
|---|---:|---:|---:|
| file-extract 平均任务包 | V1 8,568 bytes | V3 26,208 bytes | 3.06× |
| doc-extract 平均任务包 | V1 7,938 bytes | V6 24,524 bytes | 3.09× |
| file-extract 三份 standards | V1 G2 约 28,425 字符 | 当前约 56,259 字符 | 1.98× |
| doc-extract 三份 standards | V1 G2 约 17,838 字符 | 当前约 99,224 字符 | 5.56× |
| file-extract V3 独审 | 24 个任务 | 61 rounds | 平均 2.54 轮 |

方法论每新增一个短字段或证据义务，项目侧会在每个任务包、每轮审查、每次 as-built 回填中展开。当前缺少“哪些证据只验证一次、哪些按任务增量验证、何时停止展开”的预算规则。

### 2.4 当前数据能证明负担增加，不能精确证明速度下降幅度

`code_reviews[].rounds` 在 file-extract V3 才较完整，V1/V2 缺少可比基线；项目任务数量、复杂度与并行度也不同。因此目前可以确认：

- 文档漂移显著；
- 任务包和 standards 显著变重；
- 独审已成为显著墙钟成本；
- 规格澄清大量发生在 develop/独审阶段。

但目前不能严谨回答“单位代码产出下降了百分之多少”。瘦身后需补充分类墙钟和 finding 类型指标。

---

## 三、Standards 是否还应存在

### 3.1 结论

`standards` 仍有价值，但必须大幅收窄。

- 作为“项目开发百科”或“跨迭代追加的项目知识总库”，其价值已很低，且开始产生负收益；
- 作为“项目级、跨任务、长期稳定的默认约束表”，仍有不可替代的价值。

最早期的方法论缺少 V0/Foundation、reusables、机械检查器、完整 TRD、任务包和独审机制，大量知识没有别的家，只能先放入 standards。现在这些对象已经形成，standards 不应继续代替它们。

### 3.2 Standards 的新定义

> 当一个开发者未来再次做同类改动时，不需要读取任何历史背景，也仍然需要遵守的项目级默认规则。

适合保留的内容：

- 所有业务 HTTP 调用必须经过项目单例；
- 项目错误信封采用什么结构；
- 版本化写入默认使用 CAS；
- 纯计算核不得依赖 IO；
- 配置驱动清单不得钉死全局数量与全序集合；
- 新增付费外部调用默认必须经过配额闸；
- 项目注释的长期受众和禁止承载的历史信息。

不适合继续放在 standards 的内容：

- “V2 曾把 A 改成 B”的演进叙述；
- 某个任务号、PR、独审轮次或事故代号；
- 某条 AC 的具体业务行为或数字；
- 某个当前代码文件、符号和行号；
- 某个 lint selector 当前只覆盖哪些变量名；
- “插件尚未安装，所以暂时依靠人审”的临时状态；
- 实测事故数据、长篇原因复盘和历史实现比较；
- 某个具体页面/接口/DTO 的本期字段清单。

### 3.3 Standards 准入门槛

一条内容进入 standards，至少同时满足：

1. 跨两个以上任务重复适用；
2. 预计跨两个以上迭代仍然成立；
3. 不是某个功能的业务契约；
4. 不是当前代码位置或当前实施状态；
5. 能写清明确的 `applies-if`；
6. 若声明机械/构造级，能指出机制 id；否则明确标为人审级；
7. 存在明确的覆盖方式或退出/替换条件；
8. 内容表达的是当前真值，不依赖读者理解历史才能执行。

不满足准入门槛的内容必须迁出，不得以“这条也许以后有用”为由继续 append。

### 3.4 Standards 建议形态

```markdown
### BE-DATA-03 · 版本化写入默认走 CAS

- applies-if：修改版本化实体或启用指针
- rule：写入必须携带 expectedRevision；冲突返回 REVISION_CONFLICT
- enforcement：base-repository-cas + concurrency-test
- grade：构造级
- override：仅允许 TRD 显式指定另一种等价并发控制机制
```

这里只保留当前规则。具体是哪张表、哪个 AC、以前发生过什么事故，分别进入 TRD、任务包、decisions/history。

### 3.5 是否最终取消独立 standards 文件

本轮不直接删除 `standards-backend/frontend/shared.md`。先完成职责迁移与当前态压缩，再观察剩余内容：

- 若仍有较多跨任务、可覆盖的项目默认约束，则保留三份按 layer 拆分的 standards；
- 若迁移后只剩少量条目，且多数已被 Foundation、lint、类型系统和测试承接，则合并为更小的 `project-constraints.md`；
- 无论采用三份文件还是单文件，develop/独审都只加载任务匹配的规则 id，不再默认读取整份全文。

---

## 四、目标对象边界

| 对象 | 唯一职责 | 可以承载 | 不得承载 | 覆盖关系 |
|---|---|---|---|---|
| PRD | 本期用户可观察需求事实 | intent、业务场景、AC | 实现手段、代码路径、项目通用规范 | 产品行为权威 |
| TRD | 本期技术契约 | 接口、数据形状、状态、错误码、模块职责、对 AC 的技术精化 | 历史事故、通用编码规范、任务执行叙事 | 可显式覆盖 Standards 默认值；不得静默破坏 Foundation |
| Foundation | 项目跨切面不变式与强制等级 | invariant、grade、mechanism id、probe、coverage、exception | 单期业务契约、代码考古、完整实现教程 | 普通 TRD 不得静默覆盖；改变须显式修订地基 |
| Standards | 跨任务、长期稳定的默认实现约束 | rule、applies-if、grade、enforcement id、override 条件 | AC、版本增补史、代码行号、事故复盘、临时缺口 | 默认值；可被 TRD 的显式等价方案覆盖 |
| Task package | 当前任务相对 as-built 的增量交付契约 | delta、AC 回链、必要 references、当前 risks、scope 边 | 通用规则全文、历史复盘、已存在机制的重复教程 | 服从 PRD/TRD/Foundation；引用 Standards id |
| Reusables | 当前可复用实现索引 | 资产、角色、入口、适用场景、退役状态 | 规范散文、事故历史 | 是实现参考，不自动成为强制规则 |
| Checks/tests | 机械证据 | 规则 id、失败条件、反例、覆盖范围 | 方法论叙事 | 证明机制生效；不能自行创造业务需求 |
| Decisions/history | 为什么这样决定 | 取舍、事故、实测数据、被替代方案 | 当前必须执行的隐含规则 | 解释来源，不作为 develop 默认权威输入 |
| Waiver/backlog | 临时缺口与解除条件 | owner、scope、expiry/解除条件、风险 | 永久规则、已完成历史 | 到期/条件满足后必须关闭或升格 |

### 4.1 冲突处理

对象之间不采用一个粗暴的全序优先级，而按各自管辖面裁决：

- 产品行为冲突 → PRD intent 为准；
- 本期接口/状态/错误契约冲突 → TRD 为准；
- 跨切面不变式冲突 → Foundation 为准，必要时先修订 Foundation；
- 实现默认方式冲突 → Standards 是默认，TRD 可显式给等价替代；
- 任务包例子与 oracle 冲突 → 判例子错误，不修改代码迁就；
- as-built 与文档冲突 → 先判断行为是否满足 intent/invariant，再决定修代码还是 revise-doc，禁止默认“文档一定对”。

---

## 五、AC 与任务包的瘦身方向

### 5.1 AC 三层拆分

现行“不可视区 Given/When/Then 例子 1:1 物化为测试”容易把一个算错的例子升级为假契约。建议拆成：

1. `intent`：规范性的用户可观察结果；
2. `oracle/predicate`：如何计算是否满足；
3. `example`：默认是派生说明，不自动高于 oracle。

只有满足下列条件的例子才标 `golden: true` 并要求字面 1:1 固化：

- 输入完全封闭；
- 预期值可从 oracle 复算；
- plan-sprint 独审已经独立复算通过；
- 上游状态、阈值和数据形状已锁定；
- 例子不是为了说明方向而随手选择的近似数字。

普通例子用于帮助理解；develop 物化的是 intent/oracle。若例子与 oracle 冲突，finding 类型为 `example-error`，动作是修任务包或 revise-doc，不进入代码整改。

### 5.2 任务包只描述 delta

任务包字段保留，但缩短其承载范围：

- `acceptance-criteria`：只写本任务真正改变或新增的行为；
- `relevant-standards`：引用规则 id，不重述规则和事故历史；
- `reference`：只列做出实现决策必需的权威锚点，优先符号/章节锚，不堆几十个易漂移行号；
- `known-risks`：只列本任务新打开或显著放大的风险；
- `do-not`：只列本任务真实 scope 边，不重复全局凭据/编码红线；
- `escalate-if`：只列无法从权威原文自行裁决的分支；
- 历史解释、事故过程与为什么排除其它方案放 non-normative appendix 或 decisions，不进入默认独审上下文。

建议给任务包设置 8–12KB 软预算：超过阈值时必须二选一：

1. 任务本身过大 → 拆包；
2. 任务并不大，只是历史解释过多 → 把非规范说明迁到 appendix。

不设置绝对硬卡，以免复杂任务为过 linter 被迫丢语义；但超预算必须留下理由并在独审前确认 normative core 范围。

### 5.3 Freshness preflight

依赖任务合并后、执行方写第一行代码前，做一次轻量过期核对：

- `files` 是否仍是当前落点；
- `reference` 指向的契约和符号是否仍存在；
- 上游是否已完成任务包原计划新建的机制；
- AC 示例能否按当前 oracle 复算；
- `do-not/escalate-if` 中的冲突是否已被上游裁决；
- 任务包是否把已经 merged 的包当承接方；
- 退役对象是否已有新调用方或已被删除。

命中漂移时只修任务包/revise-doc，不进入代码开发。file-extract V3 已记录该做法七次奏效、避免七轮返工，应从 session 经验升级为正式步骤。

---

## 六、独审控制流重构

### 6.1 Finding 必须先分类，再决定动作

建议所有独审统一输出：

```yaml
type: behavior-bug | contract-drift | example-error | enforcement-claim | scope-gap | future-risk | evidence-gap
severity: blocking | advisory
reachability: current | conditional | unreachable | unknown
evidence: <反例 / 路径 / 文档冲突>
impact: <当前可观察后果>
action: fix-code | revise-doc | fix-mechanism | downgrade-claim | global-gap-review | backlog | request-evidence
```

| type | 判据 | 默认动作 | 是否进入代码整改 loop |
|---|---|---|:---:|
| behavior-bug | 当前可达，行为/安全/数据不变式错误 | fix-code | 是 |
| contract-drift | 实现满足 intent，但 PRD/TRD 描述落后或写错 | revise-doc | 否 |
| example-error | 示例与 oracle/现有阈值推演冲突 | 修例子或 revise-doc | 否 |
| enforcement-claim | 声明机械/构造级，但机制不存在或射程不足 | 补机制或降低声明档 | 仅选择补机制时 |
| scope-gap | 缺陷落在任务包之间、无人认领 | global-gap-review/补任务 | 否，不重审无关单包 |
| future-risk | 当前不可达的潜伏风险 | backlog/waiver | 否 |
| evidence-gap | 审查员存疑但尚无可达性/后果证据 | 补证据或规格澄清 | 否 |

### 6.2 阻断门槛分档

- **Foundation / 安全敏感任务**：继续保持严格档；存疑可以阻断，但必须转成明确的 probe 或 evidence-gap，不允许靠散文长期悬置；
- **Standard 任务**：阻断必须给出当前可达路径、可观察后果和反例证据；只有“可能不对”但无法证明影响时，不得直接要求改代码；
- **纯文档/注释/历史问题**：不得升级成代码阻断，除非该文本被运行时/检查器直接消费并导致错误行为。

当前 develop review brief 的“存疑即判阻断，不放行”应收窄适用范围，而不是整句保留给所有任务。

### 6.3 重审只覆盖变化面

- 行为 bug 改代码 → 复审对应行为、反例和受影响回归；
- 只改文档 → 复核契约一致性，不重跑完整代码审查；
- 只降低错误的强制档声明 → 复核不变式当前实际保证，不要求代码长成文档原先指定的手段；
- scope-gap 新开任务 → 由新任务独审，不重审原本各自合规的包；
- 同一 finding 的证据面未变化 → 禁止换措辞重复报同一问题。

### 6.4 Per-task 与 global seam 分工

保留逐包独审，但只审包内忠实性。全部 merged 后增加一次全局接缝审，专门检查：

- 两个包互相写“不在本包”；
- 上期有、本期无人认领的入口/选项/路径；
- 后端接口已实现但调用方无法做成事；
- 旧实现零调用方但仍注册/测试/维护；
- 跨包共享类型或错误码各自长出第二定义；
- 任务全部合规，但组合后某终态不可达。

doc-extract V5 二次独审 8 个阻断中，6 个按定义不属于逐包独审 scope。不能靠增加 per-task 轮次解决 global seam 问题。

---

## 七、Foundation / V0 的收口方向

V0 `foundation-design.md` 的体量在两个项目中基本稳定；真正变重的是根 `foundation.md` 的 as-built 回填和后续关注点增补。因此不需要取消 V0，而应把 Foundation 从叙事文档收成可验证声明表。

建议每个关注点只保留：

| 字段 | 说明 |
|---|---|
| invariant | 真正不得被打穿的语义，不写指定 helper/service |
| required-grade | 构造级 / 机械级 / 人审级 |
| mechanism-id | 当前承接机制；可以是 DB、类型、lint、框架守卫、测试 |
| probe | 验证机制的最小反例和命令 |
| coverage-scope | 机制覆盖到哪一层、哪些入口 |
| exception | 已授权例外及其双侧边界 |
| last-verified | 最近一次真实 probe 的日期/commit |
| state | active / pending / superseded |

独审结果必须区分：

- **invariant failure**：不变式真被打穿 → code/mechanism bug；
- **claim failure**：文档把档位或唯一手段写高/写窄，但真实不变式已被别层保证 → 改声明、降档或更新 mechanism，不强迫代码模仿指定 service/helper。

master 新增的 foundation 反例探针和干净环境自绿应保留；需要删除的是把具体实现手段误写成不变式，以及把每次事故过程继续塞进 Foundation 单元格。

---

## 八、保留、修改、迁出、候选删除

| 处置 | 内容 | 结论与理由 |
|---|---|---|
| 保留 | `supersedes` + 退役账 | 直接减少维护义务；旧代码零路由但仍注册/测试不算退役 |
| 保留 | Foundation 反例探针 | 能把“看起来挡得住”变成可证伪声明，已有真实收益 |
| 保留 | 干净环境自绿 | 能抓 stale dist、跨平台命令、依赖前置和 CI 缺失 |
| 保留 | AC 可达性 | 能区分“写了状态名”与真实流程能到达该状态 |
| 保留 | 调用方验收锚 | 能前移跨层契约缺口，但只写调用方结果，不复制前端完整任务 |
| 保留 | 欠账时效分池 | 修的是消费时点；具体代码缺口不能等到 G5 后处理 |
| 保留 | 审计留痕缺失检测 | 字段定义不等于流程实际填写，缺失必须能被发现 |
| 修改 | “存疑即阻断” | Foundation/安全保留严格性；standard 要求可达性和后果证据 |
| 修改 | GWT 1:1 物化 | 物化 intent/oracle；普通示例不得压过判据，golden 例子须预复算 |
| 修改 | 双侧实证 | 仅对决定通过/豁免的边界断言强制，不把普通说明扩大成两倍探针 |
| 修改 | 每包读取全部 standards | 改为按 `applies-if` 匹配规则 id；历史 appendix 不进默认上下文 |
| 修改 | review rounds | 增加 code/spec 两类轮次和墙钟，单一整数无法判断减速来源 |
| 迁出 | standards 中的版本增补史 | 迁 decisions/history，standards 只留当前真值 |
| 迁出 | standards 中的任务号、PR、AC 号、事故长叙事 | 迁 decisions/history 或对应 PRD/TRD |
| 迁出 | standards 中的当前代码路径与 lint 射程 | 迁 enforcement registry；规则正文只引用 mechanism id |
| 迁出 | 临时工具盲区和补偿性纪律 | 迁 waiver/backlog，写解除条件与责任点 |
| 候选删除 | 已被类型/lint/测试完整承接的重复散文 | 保留一句规则索引即可，删除大段“如何人工检查” |
| 不删除 | 独立审查本身 | 已证明能前移真缺陷；应改 scope、分类和重审范围，而非取消 |

---

## 九、建议实施顺序

### 阶段 A · 建立瘦身审计表，不改规则语义

先对现有文件逐条分类：

| 原条目 | 当前对象 | 类型 | 目标对象 | 动作 | 是否影响正式行为 |
|---|---|---|---|---|:---:|
| … | standards-backend | 稳定默认 / 版本契约 / 机制登记 / 历史 / waiver | … | 保留 / 改写 / 迁移 / 删除 | 是/否 |

首批范围：

1. `templates/standards/*`；
2. 代表项目 `document-extraction/standards-*`；
3. 代表项目 `file-extract/standards-*`；
4. `foundation.md` 表结构与 review brief；
5. task-package template 与 develop review brief。

本阶段只分类和测量，不批量改正式方法论，避免边看边删导致证据丢失。

### 阶段 B · 先收 Standards

1. 定义 Standards 新 schema 与准入门槛；
2. 将模板 standards 改为“当前稳定默认规则”形态；
3. 给项目 standards 做当前态 compact；
4. 历史内容迁入 decisions/history；
5. 机制位置迁入 enforcement registry；
6. 临时缺口迁入 waiver/backlog；
7. develop/task-package review 改为只加载命中的规则 id。

这是优先级最高的一组，因为当前任务包和独审的输入膨胀主要从 standards 扩散。

### 阶段 C · 再拆 AC 与示例权威

1. 修改 PRD/task package 模板，区分 intent/oracle/example；
2. 给 golden 例子增加预复算要求；
3. 修改 develop 的测试物化措辞；
4. task-package review 新增 `example-error`，禁止默认转代码整改；
5. 用 `fe-v3-010` 做回放验收：新方法应在写包审查阶段改 42→40，不产生代码整改要求。

### 阶段 D · 重构独审输出与 loop

1. develop review brief 增 finding `type/reachability/action`；
2. 收窄 standard 任务的“存疑即阻断”；
3. 规定文档-only finding 不进入完整代码重审；
4. 增 freshness preflight；
5. 把 global seam review 与 per-task review 分开；
6. `rounds` 拆为 `code_rounds/spec_rounds`，补两类墙钟。

### 阶段 E · 收 Foundation

1. 把关注点表改为 invariant/mechanism/probe 结构；
2. 增 claim failure 与 invariant failure 分类；
3. 保留探针、干净环境和安全可达性；
4. 删除事故长叙事与实现教程；
5. 加 `last-verified` 与 superseded 状态，防止旧机制定位长期漂移。

### 阶段 F · 双项目回放与小样本试点

回放至少四类案例：

1. doc-extract V0 状态迁移 B3：应判 claim/doc 修订，不要求无意义代码改造；
2. doc-extract `@Public` 别名绕过：应继续判 behavior/mechanism blocker；
3. file-extract `fe-v3-010` 42→40：应在写包前判 example-error；
4. doc-extract V5 归属真空：应由 global seam review 捕获，不要求每包独审重复承担。

然后在后续至少 20 个真实任务上试点，数据达到目标再推广到正式正文。

---

## 十、验收指标

### 10.1 文档体量与职责

- standards 不再按 `v1/v2/v3` 追加版本段；
- 正文不得依赖任务号、PR 号或事故代号才能理解；
- 单条 standards 能独立回答 `applies-if / rule / grade / enforcement / override`；
- Foundation 每个 ≥机械级声明都有 mechanism id + probe；
- 临时机检缺口全部有 waiver/backlog 解除条件，不留在 standards 伪装永久规则；
- 任务包 P50 回落到约 8–12KB，超预算均有拆包或 appendix 理由；
- develop/独审默认加载的 standards 条目数量可统计，不再整份全文读取。

### 10.2 独审效率

- 每条 blocking finding 都有 type、reachability、impact、action；
- 文档-only blocker 的代码改动文件数必须为 0；
- 文档-only 修订不触发完整代码复审；
- `spec_rounds` 与 `code_rounds` 分开记录；
- global seam finding 不回灌成无关 per-task 重审；
- freshness preflight 命中的漂移在写代码前关闭。

### 10.3 质量不回退

- Foundation probe 仍能抓 `@Public` 别名、裸 SQL、类型结构绕过、stale dist；
- 安全项仍要求反例端到端可达；
- 调用方验收锚仍能抓接口有字段但调用方做不成事；
- `supersedes` 仍逐条核退役账；
- AC 示例瘦身后，intent/oracle 的行为覆盖率不下降；
- global seam review 能抓互推、无人认领和旧能力回归。

### 10.4 试点指标

后续 20 个任务至少记录：

- `execution_wall_clock`；
- `review_wall_clock`；
- `spec_clarification_wall_clock`；
- `code_rounds`；
- `spec_rounds`；
- finding type/action；
- 每轮是否实际改代码；
- 任务包 bytes；
- 实际加载的 standards 条目数。

核心观察指标：

1. `零代码改动关闭的 blocking findings / 全部 blocking findings`；
2. stale-spec 命中率；
3. spec-only 完整重审次数；
4. 每任务 code rounds；
5. 每任务 standards 加载量；
6. global seam 与 per-task finding 的分布；
7. 真行为缺陷逃到 G4/G5 的数量。

---

## 十一、首轮修订建议清单

若以本文件直接开工，建议首轮只做以下六项：

1. 新增 Standards 新定义、对象边界和准入门槛；
2. 建一张 standards 条目迁移审计表，先分类不删；
3. 修改 task package：AC 拆 intent/oracle/example，增加 golden 例子规则；
4. 修改 develop review brief：finding 增 type/reachability/action，收窄 standard 档“存疑即阻断”；
5. 在 develop 拾取阶段加入 freshness preflight；
6. 定义 global seam review，明确与 per-task review 的边界。

暂不在首轮做：

- 删除独立审查；
- 降低 Foundation 安全探针；
- 取消 `supersedes`/退役账；
- 大规模一次性重写所有项目 standards；
- 用硬字符数 linter 强行截断任务包；
- 在没有 20 个任务试点数据前继续增加新的审查轮次。

---

## 十二、仍需拍板的问题

1. Standards 收缩后继续保留三份 layer 文件，还是最终合并为 `project-constraints.md`？
2. TRD 显式覆盖 Standards 默认值时，是否要求单独的 override 记录与解除条件？
3. golden example 的预复算由 task-package reviewer 承担，还是增加轻量脚本/可执行 oracle？
4. global seam review 放在 develop 全 merged 后，还是 plan-sprint + develop 各做一次不同形态的接缝核对？
5. Foundation `last-verified` 是每期刷新、触及式刷新，还是检查器版本变化时刷新？
6. standards 条目进入的“两任务/两迭代”门槛是否作为硬规则，还是允许安全项一次事故直接升格？
7. 任务包 8–12KB 采用软预算提示，还是同时统计 normative core 与 appendix 两个尺寸？

其中第 6 项建议设安全例外：安全/数据不变式可一次事故直接升格，但仍必须满足 applies-if、机制与退出条件要求。

---

## 十三、暂定立场

1. 这一个月新增的质量机制不整体回滚；保留真实探针、可达性、退役账和闭环。
2. Standards 不删除，但从知识总库收缩为稳定默认约束表；历史、契约、机制登记和临时缺口全部迁出。
3. Foundation 保留并改为可验证声明表，区分不变式失败与声明失败。
4. AC 的 intent/oracle 高于普通例子；只有预复算过的 golden example 才要求字面物化。
5. 独审继续存在，但 finding 必须分类；文档问题、scope 问题和未来风险不再默认进入代码整改 loop。
6. per-task review 审包内，global seam review 审包间；增加轮次不能替代扩大正确 scope。
7. 方法论瘦身的验收不是“少了多少行”，而是：同等真缺陷发现能力下，减少无代码改动的阻断轮次、重复上下文和错误路由。
