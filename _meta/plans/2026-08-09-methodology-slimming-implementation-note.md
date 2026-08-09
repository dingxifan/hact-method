# 方法论瘦身落地说明：改了什么，会影响什么

> 日期：2026-08-09  
> 状态：本轮调整已落到正式方法论，本文随变更一并归档  
> 上游依据：`2026-08-09-methodology-slimming-revision-basis.md`  
> 验证来源：`document-extraction`、`file-extract` 历史案例，以及运行中的 B 类任务 `fe-b-008` 只读观察

---

## 一句话说明

这轮瘦身没有取消独立审查，也没有降低安全和数据一致性的要求。它主要做了三件事：

1. **写代码前先确认任务没有过期**，减少沿着旧任务包做错方向；
2. **审查发现先分类，再决定该改代码、改文档还是补证据**，不再把所有问题都塞进代码整改；
3. **第一次完整审，整改后只定向复审受影响部分**，避免每轮都从头做一遍全量对抗审查。

通俗地说，原来的做法更像“发现任何疑点，都让开发者整包返工，再重新全面考试”；现在改成“先判断疑点属于谁，真正的代码缺陷才修代码，补考只考没过的题；如果整改扩大了范围，再重新全面考试”。

---

## 一、为什么要瘦身

最近一个月的方法论确实抓到了不少真实问题，例如鉴权绕过、旧构建产物假绿、数据不变式被绕开、解析失败后放行等。这说明独立审查和反例探针不能简单删除。

但实际执行也暴露出明显的成本放大：

- Standards、Foundation、任务包和审查记录不断追加历史背景，同一件事在多处重复；
- 一个文档表述错误、示例算错或 scope 无人认领，也会被当成代码 blocker；
- 整改后再次派一个全新审查者时，没有告诉它上轮 finding、固定基线和本轮改动范围，于是很容易重新做一次完整陌生审查；
- 任务执行只记录“审了几轮”，没有记录实现、规格澄清和审查各花了多少墙钟时间。

运行中的 `fe-b-008` 是一个很有代表性的自然实验：前后累计约 4 小时，当前一轮接近 2 小时；多轮独审确实抓到了真实 enforcement 漏洞，但也出现了同根问题被拆成多个语法变体、反复完整验证和每轮重新建立上下文的成本。

所以这轮的目标不是“少审一点”，而是：

- 更早发现任务包过期；
- 让审查成本花在当前真正打开的风险面上；
- 保留真正能抓缺陷的质量门；
- 让耗时可以被记录和比较，而不是只凭体感。

---

## 二、流程前后有什么不同

### 调整前

```text
拿到任务包
  → 写代码
  → 完整独立审查
  → 所有疑点都作为 blocker
  → 改代码或改文档
  → 再做一次完整独立审查
  → 反复跑完整验证
  → 合并
```

这个流程的问题不是“严格”，而是不同性质的问题最后都走同一条返工路线。

### 调整后

```text
拿到任务包
  → freshness preflight：先确认任务包、代码和验收判据仍然一致
  → 写代码并做目标验证
  → 首轮 full review：完整独立审查
  → finding 分类和路由
      ├─ 真代码/机制缺陷：修复，再做 targeted review
      ├─ 文档或示例错误：修文档，不强迫代码迁就
      ├─ 证据不足：补证据，不伪装成代码 bug
      └─ 跨包 scope 缺口：另开 owner，不打回已合规任务
  → 只有范围扩大、新机制或新根因出现时，下一轮才升级 full review
  → 末端统一跑一次完整验证
  → 机械审计通过后合并
```

---

## 三、具体调整了什么

| 调整项 | 原来的问题 | 现在的做法 | 直接影响 |
|---|---|---|---|
| Standards 收口 | 混入任务号、事故历史、当前代码位置和临时盲区，越写越长 | 只保留跨任务、跨迭代仍成立的默认规则，并要求 `applies-if`、强制等级和机制 id | develop 和独审只加载命中的规则，不必默认消费整份项目百科 |
| AC 分层 | 一个示例数字写错，也可能逼代码按错误示例实现 | AC 拆成 `intent`、`oracle`、`example`；只有复算过的例子才是 `golden` | 普通示例不再压过真正验收判据；示例错误优先修文档 |
| 任务包只写 delta | 重复粘贴通用规则、历史原因和大量行号 | 只写当前任务新增/改变的行为、必要锚点、新风险和真实 scope 边界 | 任务包更短，独审上下文更聚焦；设置 8–12KB 软预算 |
| Freshness preflight | 依赖任务已经改变了代码，执行者仍按旧任务包开工 | 写第一行代码前核对文件、符号、机制、oracle、scope 和退役对象，并落 `preflight.md` | 任务过期时先改任务包或规格，避免代码完成后才返工 |
| Finding 分类 | 文档漂移、示例错误、未来风险和真实 bug 都叫 blocker | finding 必须写 type、reachability、evidence、impact、action | 不同问题进入不同处理路径，不再默认“改代码” |
| Full/targeted 两级复审 | 每次整改后都重新完整陌生审查 | 首轮 full；整改轮默认 targeted，只核指定 finding、反例、受影响回归和增量 diff | 减少无关重审，同时保留首次完整审查的覆盖面 |
| 稳定审查基线 | 审查者可能看到漂移中的工作区，且不知道上轮审了什么 | 每轮记录固定 `base_ref`、`reviewed_base/head`、diff hash、changed files、prior report 和稳定 finding id | 审查范围可复现，不靠执行者口头描述 |
| B 类统一入口 | B 类既可走 develop，也可“手动实现后再独审”，后者绕过 preflight | 新 B 任务统一进入 `develop(source=bug/optimization)`；手动 skill 只作已有 diff 的兼容入口 | B 类也拥有和 A 类相同的开工前核对、审查路由和时间记录 |
| 整改期验证分层 | 每轮整改都可能重复跑完整 build/type/lint/test | 实现和整改期优先跑目标测试、反例和受影响回归；末端再跑一次完整验证 | 减少重复全量验证，但最终合并质量门不变 |
| Global seam review | 每个包单独合规，但组合后可能出现无人认领的入口或旧实现未退役 | 在本期最后一个 sprint 集合后专门检查包间接缝 | 跨包问题另开补缝 owner，不反复打回无关任务包 |
| 墙钟与机械审计 | 只有 rounds，没有真实耗时；约 4 小时只能靠人工回忆 | 记录 implementation/review/spec 时间和逐轮报告，并增加 A/B 共用的 task-id 校验命令 | 可以比较瘦身前后效果，也能阻止漏报告、错时间和错误复审链 |

---

## 四、独审现在怎样处理问题

独审仍然独立，不接收开发者的自我评价和实现辩解；但独审者会读取完整的权威任务包，而不是只拿几条 AC 和一份 diff。这样既保持独立性，也不会丢掉任务的 `do-not`、风险和 scope 契约。

finding 的默认去向变为：

| 问题类型 | 通俗解释 | 默认动作 | 是否进入代码整改 |
|---|---|---|:---:|
| `behavior-bug` | 当前真的会跑错 | 修代码 | 是 |
| `enforcement-claim` / `invariant-failure` | 声称有机械保护，但实际能绕过 | 修机制或降低错误声明 | 视证据而定 |
| `contract-drift` | 文档与当前真实行为不一致 | 修文档或先裁决契约 | 通常否 |
| `example-error` | 例子算错，但 intent/oracle 没错 | 修例子 | 否 |
| `scope-gap` | 事情确实要做，但当前没有任务负责 | 新开 owner 或 backlog | 不打回当前合规包 |
| `future-risk` | 现在不可达，将来可能出问题 | backlog 或建议 | 否 |
| `evidence-gap` | 还无法证明它是 bug | 补证据 | 否 |

同一个根因下的不同语法、输入或调用变体，合并在同一个稳定 finding id 中。例如 `task-F001` 可以包含多个反例，但不会因为列出了五种语法就制造五个 blocker。

---

## 五、full review 与 targeted review 的边界

### Full review

以下情况做完整独审：

- 当前任务第一次进入独审；
- targeted 整改超出了原定 changed surface；
- 引入了新模块、新依赖或新机制；
- 审查发现了不同于上轮的新根因；
- 上轮明确写了 `escalate_to_full: true`。

### Targeted review

整改后默认只检查：

- 上轮尚未关闭的 finding id；
- 对应反例是否已经翻转；
- 受影响的回归测试；
- 上一棵 reviewed tree 到当前 tree 的增量 diff。

targeted 审查不能偷偷扩成全量审查。它若发现范围扩大，只记录证据并要求下一轮 full。

机械上还会检查：

- full 的基线必须回到 preflight 记录的原始 base tree；
- targeted 的 base 必须接上上一轮 reviewed head；
- `prior_report` 必须指向紧邻上一轮；
- 最后一轮必须 `pass`，不能残留未执行的 full escalation。

---

## 六、B 类任务受到的影响

B 类 bug/优化不再推荐“先手动修完，再单独调用 adversarial-review”。新流程是：

```text
dispatch-new
  → b-queue/{task-id}.md
  → develop(source=bug/optimization)
  → preflight
  → 实现
  → full / targeted 独审
  → 末端全量验证
  → task-id 机械审计
  → 合并
```

`adversarial-review` skill 没有删除，但只用于用户明确要求接管已经存在的手动 diff。此时必须补一份诚实的 `timing: retroactive` preflight，不能伪造成“写代码前已经检查”。

这项调整不会回溯改变已经运行中的 `fe-b-008` 对话；该对话只用于验证旧流程的耗时和质量收益。以后新启动、并读取新版方法论的 B 类任务才会采用新入口。

---

## 七、时间现在如何记录

`status.yml code_reviews[]` 新增三类聚合时间：

- `implementation_minutes`：preflight 闭合后，到第一次 full review 派发；
- `review_minutes`：第一次 full review 开始，到最终通过，包含等待和整改；
- `spec_minutes`：preflight、规格澄清和 revise-doc 消耗。

逐轮报告另外记录：

- `started_at` / `completed_at`；
- `elapsed_minutes`；
- `mode: full|targeted`；
- 固定 Git 基线、diff hash 和 changed files；
- 本轮 finding 与结论。

时间由编排器在事件发生时写入并向上取整，不允许事后凭感觉估算。

新增的通用检查命令为：

```bash
node scripts/check-sprint.js --review {task-id}
```

它不依赖 iteration，所以 A/B 类都能使用。新任务缺 preflight、逐轮报告、时间字段或合法复审链时会失败；旧 status 条目仍能被迭代扫描读取，只会提示缺少新字段，不要求虚构历史数据。

---

## 八、哪些质量底线没有动

本轮明确保留：

- 首次独立完整审查；
- sensitive 和 Foundation 任务的高强度审查；
- 鉴权、数据一致性、金额、不可逆外部副作用等安全敏感预检；
- 可构造反例、fail-closed、干净环境自绿和 stale build 检查；
- AC 可达性与调用方锚；
- `supersedes`、旧实现退役账和零调用方核验；
- 最终合并前的完整 build/type/lint/test；
- 跨包 scope 和共享定义的 global seam review。

因此，“瘦身”不是减少必要测试，也不是把 blocker 降级。它减少的是：错误起步、重复叙述、同根 finding 拆分、无关维度重审，以及规格问题被误送到代码整改。

---

## 九、会影响哪些文件和角色

### 对执行者

- 开工前多一个很轻的 preflight，但预期会减少后期大返工；
- 整改时不再默认重复全量验证，只跑当前反例和受影响回归；
- 需要留下固定 tree 和真实时间戳，不再只写“已审两轮”。

### 对独审者

- 首轮仍需完整审查；
- 必须按根因分类 finding，并写清当前可达性、证据和影响；
- targeted 轮只能审指定 finding 和增量 diff；
- 不再用不同语法变体重复制造同根 blocker。

### 对任务规划者

- AC 要区分 intent、oracle、example 和 golden；
- 任务包只写本任务 delta；
- Standards 只登记长期默认规则，历史和事故迁往 decisions/history；
- 跨包无人认领问题交给 global seam，而不是塞进任意一个任务包。

### 对看板和审计

- `status.yml` 多出实现、审查、规格三段耗时；
- 每轮 review 有独立报告目录；
- 旧数据保持可读，新任务必须通过严格审计。

### 对已有项目

- 本轮只修改了 `hact-method-lab`，没有批量重写 `document-extraction` 或 `file-extract` 的现有 Standards 和任务包；
- 已经运行中的会话不会自动换方法；
- 若某个已有项目保存了自己的 `CLAUDE.md` 或 `scripts/check-sprint.js` 副本，需要在启用新流程时同步新版模板，否则只能读到新规范，不能执行新的机械检查。

---

## 十、已经做过的验证

### 历史案例静态回放

四类案例均进入预期路径：

- DB 已保证真实不变式，但文档把 service 写成唯一机制：降级错误声明，不改代码；
- `@Public` 别名可绕过鉴权且当前可达：继续作为真实机制 blocker；
- AC 示例 42 与 oracle 只能算出 40：修示例，不改算法迁就；
- 多个任务互相声明“不在本包”，最终无人负责：另开 scope owner，不打回原包。

### B 类自然实验

`fe-b-008` 证明两点同时成立：

1. 独审不能取消，因为多轮确实抓到了真实 enforcement 漏洞；
2. 没有 freshness、finding 路由和 targeted 基线时，墙钟会被上下文重建、同根变体和重复全量验证明显放大。

### 机械 fixture

- 首轮 full + 第二轮 targeted 的 A/B 报告链通过；
- `freshness: revised` 可作为闭合后的合法状态；
- review 分钟与时间戳不一致会失败；
- finding id 从 `F001` 写成不稳定的 `F1` 会失败；
- targeted 没接上一轮 tree/report 会失败；
- 旧 status 在普通迭代检查中兼容读取，但显式作为新任务终态审计时会因缺字段失败；
- `check-docs.js`、`check-sprint.js` 语法检查与 `git diff --check` 均通过。

---

## 十一、预期收益与不能提前承诺的部分

预期减少的时间主要来自：

- 在写代码前发现任务包过期；
- 文档/示例问题不再触发代码整改；
- 同一根因不按变体拆成多个 blocker；
- 整改后不再默认完整重审；
- 整改期减少重复全量验证；
- 独审者不再重新猜测 scope 和上轮结论。

但目前不能承诺“4 小时一定降到多少”。`fe-b-008` 中至少两轮都发现了真实机制缺陷，这些修复成本不应被省掉。真正要验证的是：在保持真实缺陷发现率的前提下，无效重审时间是否下降。

建议后续连续观察 5–10 个任务：

- preflight 命中并避免返工的次数；
- full / targeted review 轮数；
- 每个独立根因对应的 finding 数；
- behavior bug 与文档/示例/证据类 finding 占比；
- implementation/review/spec 三段墙钟；
- 整改期间完整 verify 的次数；
- targeted 升级 full 的原因。

---

## 十二、本轮没有做的事

以下内容不属于本轮 P0，暂未实现：

- 按 task type/layer 自动裁剪不适用的审查维度；
- 批量迁移两个代表项目已经膨胀的 Standards；
- 自动计算和展示跨任务的效率趋势看板；
- 取消独立审查或降低 sensitive 任务的模型/证据要求。

其中第一项是下一步最有价值的 P1：例如纯 enforcement/test 任务没有必要反复回答 DTO 去向、页面设计和 N+1 等明显不适用的审查维度。

---

## 十三、关键落点

- 主执行流：`specs-execution/develop.md`
- B 类兼容审查：`skills/adversarial-review/SKILL.md`
- 状态与墙钟契约：`skeleton/07-status-contract.md`、`templates/status.yml`
- Freshness 记录：`templates/review-briefs/develop-preflight-record.md`
- 逐轮 full/targeted 报告：`templates/review-briefs/develop-review-round.md`
- 独审规则：`templates/review-briefs/develop-review.md`、`templates/review-briefs/foundation-review.md`
- A/B 通用机械审计：`templates/scripts/check-sprint.js --review {task-id}`
- Standards 新职责：`templates/standards/schema.md`
- 跨包接缝审查：`templates/review-briefs/global-seam-review.md`
- 用户指引：`guide/02-一期完整流程.md`、`guide/03-BUG与优化处理.md`、`guide/99-任务速查表.md`

这份说明记录的是本轮已经落地的行为变化；更完整的论证、历史证据和对象边界见上游修订底稿。
