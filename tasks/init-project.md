---
schema: hact-task/vnext
task: init-project
class: cross-cutting
discipline: management
gate: null
preferred_runtime: execution
required_capabilities:
  - filesystem-authoring
  - repository-init
  - git-snapshot
  - command-execution
  - remote-git
  - persistence
review: conditional
---

# init-project

## 1. Purpose & Scope

### Purpose

把一个尚未进入 HACT 项目事实面的新项目初始化为独立、可恢复、可跨 Runtime 继续工作的 Git 项目，并播种最小但足够的长期项目事实、状态入口和地基蓝图。

`init-project` 是项目 bootstrap Task。它创建后续 Task 依赖的项目级 Accepted Project Truth，但不提前替后续 PRD、TRD 或实现做决定。

### In scope

- 确认稳定且唯一的项目标识 / repository identity
- 创建独立项目 repository 与最小目录结构
- 从一个固定 HACT Method SHA 播种项目模板、检查器和运行入口
- 创建项目根 `status.yml`，建立后续 Task 的统一状态入口
- 建立项目与所采用 Method SHA 的 durable linkage / sync metadata
- 建立首次 Git snapshot 与可验证 remote truth
- 形成项目级 `foundation.md` 初稿：
  - 核心实体 / 主数据
  - 全局作用域
  - 关键不变式
  - 跨切面关注点及应有强制档
- 判断项目是否需要先走 V0 `draft-foundation`
- 播种外部连接登记，但不把 secret 写入 repository
- 在适用时建立协作访问与本地 guard/checker 入口

### Out of scope

- 写 V1 PRD 或列功能清单
- 设计完整 TRD、API、数据库 schema 或业务模块
- 实现 V0 / V1 代码
- 为了“以后可能需要”预建完整工程框架
- 把某个 Git 托管厂商、某个本地目录布局或某组 CLI 命令写成方法论硬依赖
- 自动创建个人知识仓 / notes 仓
- 自动批准任何 Gate

Task Contract 只定义 `init-project` 的方法论承诺。具体目录命令、Git provider API、hook 安装命令、凭据位置和产品 UI 操作属于 Runtime Adapter / project configuration。

## 2. Preconditions

`init-project` 是流程起点，不要求任何 Gate。

进入 `可取` 前必须满足：

- 用户已明确要建立一个新项目，而不是仅讨论一个想法或处理既有项目。
- 项目名称 / repository identity 已由用户确认，满足当前项目命名规则，并不存在未解决的命名冲突。
- 当前采用的 HACT Method fixed SHA 已明确。
- 当前 Runtime 具备创建项目事实面所需的最小写入能力，或存在已授权的 persistence adapter。
- 目标 repository / workspace 尚未存在，或用户明确授权对一个部分初始化的目标执行**非覆盖式补齐**。

条件性前置：

- 在 `foundation.md` 正式播种前，必须有足够的项目背景事实；若没有背景材料或用户描述不足，应先向用户取得必要上下文。
- 在建立 remote Accepted Truth 前，必须有一个用户认可且 Runtime 有权限写入的 Git remote。
- 团队协作者、外部连接、部署目标等只有在项目实际需要时才配置。

### Bootstrap state exception

`init-project` 自身创建 `status.yml`，因此不能要求目标项目在 Task 开始前已经存在 `status.yml`。

在项目状态面建立前：

- Task 仍使用统一四态 `可取 → taken-by → done → merged`；
- 但 bootstrap progress 由当前 Owner 的执行上下文、目标目录 / repository 实际事实和已形成的 Git snapshot 承载；
- 不增加第五状态，也不创建一个虚假的“前置 status”。

`status.yml` 一旦进入项目 repository，后续项目 Task 统一从该状态面恢复。

## 3. Authoritative Inputs

### Required

- 用户确认的项目名称 / repository identity
- 用户对项目用途的原始描述
- 当前 HACT Method fixed SHA
- fixed SHA 下的：
  - 本 Task Contract
  - 适用 Shared Protocol
  - 项目初始化模板
  - 当前 status contract
  - 当前 checker / guard / runtime-entry templates
- 目标 Git remote identity 与当前远端事实

### Conditional

- `_meta/input/` 或等价背景材料
- 组织 / 团队的 repository naming policy
- 当前 Runtime 的项目工作区配置
- remote provider / collaborator configuration
- project persistence configuration
- 外部连接需求
- 已存在的部分初始化目录或 repository

### User input

至少需要 Human Authority 确认：

- 项目名称 / repository identity
- 真实业务背景中无法从权威材料推出的重要事实
- Foundation 中的重要领域 / 作用域判断
- V0 走 / 跳决定
- remote / collaboration 范围中需要用户授权的部分

上一 Runtime 的聊天摘要不是 Authoritative Input。若已有 Git / 文件事实，必须重新读取实际状态。

## 4. Outputs

### Primary artifacts

初始化后的项目 repository 至少建立下列项目级事实面；具体序列化以 fixed Method SHA 的 template 为准，不在本 Contract 重抄模板正文。

| Artifact | Authoritative path | Notes |
|---|---|---|
| Project facts | `project.md` | 产品层 / 技术层长期事实入口 |
| Foundation blueprint | `foundation.md` | init 播种领域地图、跨切面关注点、应有档、V0/V1+ 路由 |
| Reusable registry | `reusables.md` | 初始登记面 |
| Decisions | `decisions.md` | durable decision 入口 |
| Backlog | `backlog.md` | 项目欠账 / revision / deviation 入口 |
| Feedback | `feedback.md` | 方法 / 项目反馈入口 |
| UX baseline | `design.md` | 初始模板；不在 init 中虚构视觉真值 |
| Connection registry | `connections.yml` 或当前等价 artifact | repository 中只保存连接描述与 secret reference |
| Project status | `status.yml` | 创建一次，后续持续维护 |
| Runtime entry | 当前项目入口文件 | 由 fixed Method SHA 的当前模板决定 |
| Project checks / guards | `scripts/` 或当前等价位置 | 从同一 Method SHA 播种，不混用 dirty method tree |
| Method linkage | `_meta/` 下当前 method sync / provenance artifact | 记录项目采用的 Method SHA |
| Background input area | `_meta/input/` | 项目背景材料入口 |
| Recovery / session area | `_meta/sessions/` | 仅在需要时承载 recovery pointer |
| A-class iteration area | `iterations/` | 至少具备当前 status / artifact contract 要求的初始结构 |
| B-class intake area | 当前 B Intake 约定位置 | 若当前方法仍需要文件入口则播种 |

### Initial status semantics

`status.yml` 必须按当前 status contract 创建，而不是从聊天临时发明字段。

初始化时至少满足：

- schema / project identity 合法；
- 当前第一期 Gate block 按模板存在且未被伪签；
- `tasks` / integration / review 等集合按当前 schema 初始化；
- 不把尚未完成的 future Task 伪造成 `可取`；
- 不因创建 status 文件而自动产生任何 Gate approval。

### Foundation seed

`foundation.md` 初始化不是空文件复制完成即算结束。

至少要形成：

- 项目是什么、解决什么问题的稳定背景；
- 少量贯穿全局的核心实体 / 主数据；
- 全局作用域（若存在）；
- 关键业务不变式（若存在）；
- 跨切面关注点候选；
- 每个被保留关注点的应有强制档；
- 安全敏感关注点的强制档不得被静默弱化；
- `V0` / `V1+` 路由结论及必要理由。

### Git truth

Task 最终必须建立：

- 一个可验证的初始 Git snapshot；
- 一个可验证 remote repository / branch truth；
- Method SHA provenance 可从 repository 恢复；
- 不依赖 Owner 聊天才能知道项目初始化到了哪里。

### Conditional outputs

- collaborator access
- local hook / guard installation
- provider-specific remote metadata
- secrets bootstrap / local secret store
- optional Runtime configuration

这些内容只在当前项目 / Runtime 需要时产生，不作为跨环境固定格式。

## 5. Decision Rules & Boundaries

### 5.1 一个项目一个独立 repository truth

项目代码、项目 Contract、状态与长期事实应进入同一个项目级 Git truth 面。

不得把项目运行事实散落在只存在于方法论仓、聊天、个人 notes 或某台机器本地目录中的副本里。

### 5.2 项目名称先确认再建

项目标识属于高迁移成本事实。

发现命名冲突或真实歧义时，在创建 durable repository history 前请求 Human Authority；一旦 repository identity 已形成，不因便利随意重命名。

### 5.3 固定 Method SHA 播种

初始化所复制 / 生成的 template、checker、guard、runtime entry 必须来自同一个明确 Method SHA。

禁止：

- 一部分来自已采用 SHA；
- 一部分来自 method main 最新版；
- 一部分来自未提交 working tree。

Method 更新属于后续明确 migration / sync，不在 init 中偷偷混版。

### 5.4 新仓可播种，存量目标只补缺不覆盖

若目标是全新项目，可按当前模板完整播种。

若目标已有文件或已有 repository history：

- 先读实际内容；
- 只补缺失项；
- 对已有入口、guard、hook、project-specific check 采用 merge / reconciliation；
- 不用模板整份覆盖项目自有机制。

### 5.5 status.yml 是项目状态入口，不是叙述文档

`status.yml` 只保存当前 status contract 允许的机器状态。

PRD、TRD、Foundation 正文、completion report、完整对话或临时 debug 信息不进入 status。

### 5.6 Foundation 是全貌 / 领域与跨切面地基，不是 PRD

init 的共识讨论只回答：

- 这个应用是什么；
- 全局围绕哪些核心实体；
- 是否存在贯穿全局的 scope；
- 哪些不变式 / 跨切面约束值得建立长期承重点。

不得在 `init-project` 中开始列完整功能、用户故事或 AC。那些属于 `draft-prd`。

### 5.7 V0 不默认走

只有关注点同时满足下列条件，才允许路由到 V0：

1. 已证明被多个未来功能共同经过，而不是为某一个 V1 功能专设；
2. 约束已稳定，且晚建会横切多层 / 多模块、要求数据迁移或显著扩大安全风险；
3. 能通过一根最薄真实切片证明，不需要预建未来业务。

“V1 很快会用”“以后可能复用”“模板一次配齐”都不是 V0 准入理由。

若 V0 预计超过一个正常中型 `develop` Task，应继续削薄；仍过大则跳过 V0，回 V1 随真实需求建立。

### 5.8 安全敏感强制边

当项目真实存在数据隔离、鉴权、越权等安全敏感关注点时，其应有强制档不能为了赶进度被静默降为弱约定。

init 只立应有 bar；具体技术形式由 `draft-foundation` / `draft-tech-design` 负责。

### 5.9 Remote provider 不是方法论绑定

Task 要求 durable remote Git truth，但不绑定 Gitee、GitHub 或其他具体 provider。

provider API、token 获取、协作者邀请、CLI 操作进入 Runtime Adapter / project configuration。

### 5.10 Secret 不进入 Git

repository 只保存：

- connection metadata
- secret reference
- non-sensitive configuration

token、password、private key、cookie 等 secret 必须留在当前安全 credential mechanism，不得因初始化方便写入项目 Git。

### 5.11 Guard / hook 是护栏，不是假安全边界

若项目使用 tracked checker + local hook / guard：

- 必须能证明实际生效入口与 tracked source 对齐；
- 不能只因为 hook 文件“存在”就宣称生效；
- 存量项目更新 guard 时不得覆盖项目自有检查。

但 collaborator 有意绕过本地 hook 不属于构造级安全保证；不要把开发便利护栏描述成不可绕过的安全边界。

## 6. Verification

### Deterministic

必须能够机械证明：

- 项目 repository identity 与目标路径 / remote 不冲突；
- required bootstrap artifacts 存在且非意外空文件；
- `status.yml` 符合当前 status contract；
- method provenance 指向一个真实、固定的 Method SHA；
- 初始化使用的模板 / checker 来源可追溯到该 SHA；
- Git repository 已初始化；
- 至少一个初始化 snapshot 可解析；
- remote branch 上存在对应的可验证 Git truth；
- project checks / connection registry 的结构校验在适用时通过；
- secret 没有被写入受控 Git artifact；
- 若安装了 hook / guard，能验证实际生效路径而非只验证文件存在。

旧 checker / hook / script 的具体命令属于 Runtime Adapter；Task Contract 只要求这些证明成立。

### Semantic

必须确认：

- 项目名称与真实项目身份一致；
- 项目背景足以支撑后续 Product Contract；
- Foundation 核心实体不是功能清单换名；
- 全局 scope / invariant 没有明显遗漏或臆造；
- 跨切面关注点确实是项目级候选，而不是一次性功能细节；
- 安全敏感项的应有 bar 合理且没有被弱化；
- V0 / V1+ 判断符合真实晚建代价，而不是模板完整度驱动；
- remote / collaboration 范围符合用户授权。

## 7. Review & Human Authority

### Independent Review

默认不要求为纯机械 bootstrap 再增加一个独立 review round。

以下情况应触发 conditional review：

- 初始化时需要合并 / 保留既有 repository 内容；
- 修改了当前 Method 模板本身，而不是单纯消费模板；
- guard / hook / security-sensitive bootstrap 与项目既有机制存在冲突；
- Foundation 中存在高影响架构歧义，且当前 Owner 无法仅凭权威事实可靠裁决。

Review 的隔离方式与 finding 结构引用 `protocols/review.md`。

### Human Authority

用户至少拥有以下决定权：

- project / repository identity
- 真实业务背景中的关键歧义
- Foundation 中的重要项目级不变式 / scope 结论
- V0 走 / 跳
- remote / collaborator / credential scope 中需要扩大授权的动作

不要求用户逐项确认：

- mkdir / copy / git add 等机械步骤
- 已由 fixed template 明确的占位结构
- 已经批准且前提未变的技术性初始化动作

没有 Gate 与 `init-project` 绑定。

## 8. Completion & Handoff

### `done`

满足：

- 初始化 artifact set 已完整形成；
- Foundation seed 与 V0/V1+ 路由结论已经形成；
- 项目当前 Git candidate snapshot 已固定；
- deterministic verification 可针对该 snapshot 执行；
- 若存在 conditional review，其输入已经固定。

### `done → taken-by`

若 verification / conditional review 发现 blocking finding：

`done → taken-by`

只修相关 bootstrap 缺口，再形成新的 candidate。

### `merged`

满足：

- required bootstrap artifacts 完整；
- verification 通过；
- 必要 Human Authority 已完成；
- remote Git truth 可验证；
- conditional review（如触发）无未关闭 blocking finding；
- 初始化结果已进入项目 Accepted Project Truth。

`init-project` 没有关联 Gate；`merged` 本身不会产生任何 G1–G5 approval。

### Downstream

`init-project` `merged` 后，根据 Foundation 路由：

- 存在获准 V0 承重项 → `draft-foundation`
- 无 V0 准入项 / 用户决定跳过 → `draft-prd`
- B 类工作 → B Intake → `develop(source=bug|optimization)`

下游 Owner 从项目 Git 重新读取：

- Method SHA provenance
- `status.yml`
- `project.md`
- `foundation.md`
- 必要 background / connection / runtime entry

不继承完整初始化 conversation。
