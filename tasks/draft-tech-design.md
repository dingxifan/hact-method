---
schema: hact-task/vnext
task: draft-tech-design
class: A
discipline: architecture
gate: G2
preferred_runtime: reasoning
required_capabilities:
  - repository-read
  - semantic-reasoning
  - artifact-authoring
  - isolated-review
  - persistence
review: required
---

# draft-tech-design

## 1. Purpose & Scope

### Purpose

把 G1 approved 的 Product Contract 与已完成的 UX 事实（如适用）转换为可实现、可验证、可追溯的 Technical Contract；用确定性交叉对账和独立语义审查证明 TRD 没有丢失 PRD 承诺、没有凭空新增产品承诺，并维护本期新出现的跨切面 Foundation 关注点。

Task `merged` 只表示 Technical Contract 已进入 Accepted Project Truth；G2 approval 是后续独立 Human Authority Event。

### In scope

- 识别会阻断技术设计的真实疑点
- 定义本期技术选型变更、数据模型、接口、模块和共享资产边界
- 承接 PRD 每条 AC，并把不可视区 oracle 精化到技术可执行精度
- 对 PRD 实体 → TRD 技术承载、PRD AC → TRD 技术载体做双向 deterministic cross-check
- 承接 UX 的用户任务、状态、失败 / 恢复和画面数据需求
- 明确测试环境与验证入口
- 原地维护 `foundation.md` 的新跨切面关注点
- 更新长期技术事实与必要架构决策
- 进行独立 TRD semantic review

### Out of scope

- 修改 Product Contract 以适应实现便利
- 在 TRD 凭空创建 PRD 没有的行为承诺
- 把普通 example 升格为新的产品真相
- 直接拆 Sprint task package
- 实现代码
- 由 AI 自动批准 G2

## 2. Preconditions

从 `可取` 进入 `taken-by` 前必须满足：

- 当前迭代 PRD 已进入 Accepted Project Truth。
- G1 已 approved，并绑定明确 PRD snapshot。
- 当前 HACT Method fixed SHA 已知。
- PRD 中所有 `draft-ux: 需要` 的部分都已完成对应 `draft-ux` Task：
  - UX artifact 已进入 Accepted Project Truth；
  - Independent Review blocking findings 已关闭；
  - 用户接受记录仍对应当前 prototype / design 版本。
- Owner 能读取项目 Accepted Truth 并持久化正式 artifact。

若 PRD 全部 `draft-ux: 不需要`，UX 前置不适用。

技术栈已有 Accepted Truth 时不重新询问；技术层为空表示当前 Method 前置不完整，先回 `init-project` / Foundation 补齐。

## 3. Authoritative Inputs

### Required

- 当前 HACT Method fixed SHA
- G1 approved 的 `iterations/vN/prd.md`
- 项目根 `project.md`
- 项目根 `decisions.md`
- 项目根 `reusables.md`
- 项目根 `foundation.md`（存在时）
- 当前 `status.yml`
- 项目当前 shared contract / checker / verification entry

### Conditional

- `iterations/vN/ux-flows.md`
- `iterations/vN/prototype.html`
- `iterations/vN/prototype-map.md`
- `design.md`
- UX evidence
- 现有 migration / schema / state-machine / API contract
- 上游 revision record

### User input

只在以下情况需要新的 Human Authority：

- 产品范围 / 业务承诺有歧义，必须回到 Product Contract
- 多个技术方向对成本、可逆性、安全或长期约束有实质差异，需要用户取舍
- Foundation 安全边界出现无法合法裁决的风险
- 其他 `protocols/authority.md` 定义的边界

已批准 PRD 不因技术实现困难而静默缩水。

上一会话或其他执行环境的聊天总结不是权威输入。

## 4. Outputs

### Primary artifacts

| Artifact | Authoritative path | Notes |
|---|---|---|
| TRD | `iterations/vN/trd.md` | 使用当前结构化 TRD schema |
| Project technical truth | `project.md` | 仅更新长期技术事实、验证入口与仍适用约束 |
| Architecture decisions | `decisions.md` | 仅记录仍影响后续实现的重要取舍 |

### Conditional outputs

| Artifact | Path | Condition |
|---|---|---|
| Foundation update | `foundation.md` | 本期识别出新的稳定跨切面关注点时原地维护 |

### State updates

- 当前 `draft-tech-design` Task：`可取 → taken-by → done → merged`
- Task `merged` 后 G2 进入 ready
- **不得因为 Task `merged` 自动写 G2 approved**
- G2 approval 由单独 authority event 更新 `status.yml`

聊天草稿、未落盘疑点清单或主线自评不是正式 Output。

## 5. Decision Rules & Boundaries

### 5.1 PRD → TRD 是承接，不是再定义产品

TRD 的每项技术设计都必须能指向：

- PRD AC
- UX U/S（如适用）
- 已有项目 / Foundation 约束
- 或明确的纯技术基础设施需求

如果技术设计需要改变用户可观察行为、业务范围或产品承诺，先走 `revise-doc(target=prd)`。

不得用“技术上更方便”把新产品承诺塞进 TRD。

### 5.2 保留 Intent / Oracle，技术层只做精化

PRD 的 `intent` 是外部可观察承诺，TRD 不重写其含义。

对不可视区行为，TRD 可以把 oracle 精化为：

- 确切状态码
- 错误码
- 字段 / 类型
- 状态转换
- 并发 / 事务结果
- 可运行断言所需的技术精度

这种精化必须忠实于 PRD。

普通 `example` 只帮助理解；除非上游已经明确成为 golden contract，否则不能因为 TRD 写了具体数字 / 字符串就自动升格为新承诺。

### 5.2.1 最终不变量优先，最小机制实现

技术设计先明确最终必须成立的事实、Contract 与 invariant，识别真正会破坏它们的 failure mode，再选择满足这些结果所需的最小 mechanism；最后才决定是否需要 table、state、lock、generation、receipt、log、checkpoint 或其他 durable object / control。不得从枚举所有中间过程、为每个过程建立状态和持久记录出发。

新增 durable object / state / control 前只问三件事：

1. 它保护哪个明确的最终不变量、Contract 或安全边界？无法指出时，默认不增加。
2. 中间信息丢失后能否从现有权威事实重新推导、重新扫描、重新计算或廉价重建？能则优先保持 transient / derived。
3. 它是否为用户可观察正确性、crash / 不可逆恢复、安全 / Authority 边界、外部兼容协议或无法重新获取的必要事实所必需？

若均不满足，默认不持久化。仅为 debug、解释过程、完整审计、未来可能有用、更多保险、每一步可恢复或每个中间瞬间都有状态，不足以成为新增理由，除非已对应上述明确风险。

### 5.3 实体 → 技术承载 deterministic cross-check

对 PRD 每个实体，TRD 必须有明确、与真实形态一致的技术承载。

当前结构化 schema：

- 持久化表使用 `### 表：{实体}`；
- 非表实体使用 `### 承载：{实体}`，类型只允许 `artifact | external-system | derived-state | runtime-state`，并给出稳定位置；
- PRD 实体 → TRD 同名技术承载必须有正向覆盖
- TRD 新表 → 必须能解释其上游来源或纯技术必要性
- 非持久化实体 / 外部系统 / 前端态必须明确说明，而不是伪造表来让 checker 变绿

检查失败时优先修真正的设计错误；若 PRD 实体分类本身错误，走 `revise-doc(target=prd)`，不偷偷改历史 Product Contract。

### 5.4 AC → 技术载体 deterministic cross-check

每条 PRD AC 必须至少被一个真实技术载体承接，并用稳定回链表示。

同时禁止：

- 悬空 AC id
- TRD 引用不存在的 AC
- 只贴 `AC-nn` 但内容并未真正承接该 AC

前两类可机械检查；最后一类属于 semantic review。

### 5.5 UX 必须被整条承接

有 UX 时，技术设计必须按 U/S 核：

- 用户任务入口
- 跨页 / 跨模块上下文
- 保存 vs 提交
- 失败、重试、恢复
- 页面所需请求 / 响应字段
- 完成反馈所需状态

不要把已设计好的用户任务重新拆成互不相干的接口清单。

### 5.6 测试环境约定不可省略

TRD 必须明确：

- 后端地址
- 前端访问方式
- 数据库 / 测试数据指向
- 有副作用操作的禁止清单
- 项目实际 build / type / lint / test 入口的指针

命令真值以项目脚本 / 配置为准，不在 TRD 复制一套可能漂移的命令体系。

### 5.7 Foundation 新关注点继续原地维护

本期若发现新的：

- 核心实体维度
- 全局错误类目
- 新作用域 / 租户 / 权限维度
- 全局拦截 / policy
- 其他已经证明稳定且跨切面的约束

必须在项目根 `foundation.md` 原地增补，不创建每期 Foundation 副本。

准入仍使用 Foundation 的跨切面 + 稳定纪律；一次性实现细节不进入 Foundation。

### 5.8 ≥机械级 Foundation 声明要有落地点

对本期新增 Foundation 关注点：

- 已存在 enforcement：记录真实机制位置，并用范围内反例证明会被挡
- 本期需要新建 enforcement：标记“待建”，交 `plan-sprint` 拆地基跟进包，其 AC 必须包含违规反例验证
- 两者都做不到：只能声明人审级

安全敏感项若需要构造级，不能靠文档口号代替真实 mechanism。

### 5.9 Shared assets 只定义真相源，不提前拆任务

TRD 可以定义：

- 表 / schema
- enum
- shared type
- API
- event
- config / policy
- module ownership direction

但具体 develop package 的 `depends_on`、`asset-writes` 和 source-of-truth task 在 `plan-sprint` 决定。

### 5.10 Gate 与 Task 正交

`draft-tech-design merged`：

- 说明 TRD 已完成并进入 Accepted Project Truth
- 使 G2 进入 ready

只有用户批准明确 Accepted snapshot，才形成 G2 approved。

## 6. Verification

### Deterministic

必须机械证明：

- TRD 结构化必填段落存在且非空
- PRD 持久化实体 ↔ TRD 技术承载对账无遗漏
- PRD AC ↔ TRD 回链双向覆盖
- 无悬空 AC reference
- 测试环境约定存在
- 适用的 `check-docs.js` 通过

现有 checker / hook 不因本迁移修改。

### Semantic

必须确认：

- 每个 TRD 技术载体真正承接其引用的 AC
- oracle 精化忠实于 PRD intent，没有夹带 / 缩水
- UX 画面需要的数据字段、状态和恢复行为得到真实技术承载
- 接口 / 数据 / 模块边界内部一致
- 新 Foundation 关注点确实跨切面且 enforcement 声明可信
- 技术设计没有静默改变产品范围
- 新增 durable table/state/generation/receipt/action-log/checkpoint/immutable artifact 等都能说明必要性及其保护的最终不变量；不存在仅为过程可观测而新增的长期权威对象

## 7. Review & Human Authority

### Independent Review

Required。

默认使用：

`Same Runtime + Fresh Isolated Context + Same Source of Truth`

本 Task 的 review focus：

1. TRD 内部一致性
2. AC 真承接，而非只贴 id
3. 不可视区技术精化忠实于 PRD
4. 接口字段 / 状态足够支撑 UX 画面和用户任务
5. PRD → TRD 覆盖完整
6. 新 Foundation 关注点没有越权或空口升档
7. 不存在多个机制重复保护同一风险、却不能证明各自独立必要性的 durable object / control

Reviewer 按 `protocols/review.md` 的 same-source projection 读取本 Task 必要 sections；不继承 Owner 的疑点处理叙事，也不替用户完成产品 / 业务取舍。

每次 invocation 在 `iterations/vN/document-reviews/{task-id}/round-NN.md` 追加一个 `hact-document-review/v1` report。报告绑定 candidate commit/tree、TRD path/SHA-256、Fresh Isolation、prior report 与 stable finding lineage。先单独 commit 新 report；收口时在本 Task 的 status 条目写 `document_review_commit` 与 `latest_document_review`，Accepted Truth 只从该 immutable Git snapshot 读取报告链，不依赖路径之后是否变化。`templates/review-briefs/trd-review.md` 只是指向本节与 Review Protocol 的薄入口，不复制审查规范。

### Human Authority

必须由用户决定：

- Product Contract 需要改变时的产品 / 业务取舍
- 有实质长期代价的架构方向冲突
- AI 无法合法裁决的重要风险边界
- 最终 G2 approval

不要求用户机械批准每个字段、接口或普通技术选择。

## 8. Completion & Handoff

### `done`

满足：

- TRD candidate 已形成
- deterministic verification 可针对明确 Shared Candidate snapshot 执行
- 正式 Output 已持久化
- Foundation / project / decisions 的本期必要变化已包含在 candidate

### `done → taken-by`

deterministic check 或 Independent Review 出现 blocking finding 时回 `taken-by`，修正后形成新 candidate。

若 finding 根因是 PRD contract 缺口，先创建 / 执行 `revise-doc(target=prd)`，不在 TRD 里自创补丁。

### `merged`

满足：

- deterministic verification 通过
- Independent Review 无未关闭 blocking finding
- 必要架构 / authority 问题已经获得相应 Human Authority
- TRD 与相关项目事实已进入 Accepted Project Truth
- `node scripts/check-task-completion.js --task {task-id}` 对 final candidate/report chain 通过

此时 **G2 尚未因此自动批准**。

### G2

Task `merged` 后 G2 进入 ready。

用户批准明确 Accepted snapshot 后，按现有 `status.yml` Gate serialization 记录 G2 authority event；Git history 与 fixed candidate 提供 snapshot binding。

### Downstream

G2 approved 后：

- `plan-sprint` 才满足硬前置并进入 `可取`
- `plan-sprint` 从 Git 重读 PRD、TRD、UX（如有）、Foundation、project / decisions / reusables
- 本 Task 新增且标记“待建”的 Foundation 关注点必须在 `plan-sprint` 形成对应地基跟进 package

下游不继承完整 conversation。
