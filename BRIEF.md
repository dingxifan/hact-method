# BRIEF.md — hact-method（AI 与人协作工作方法 v2）

## 项目背景
human-ai-col（v1 方法论）已完成第二阶段单人验证（simple-auth v1 hact 端到端演练 2026-05-06 收关）。在准备第三阶段团队引入时，对整体方法做了一轮深度重构（讨论原稿见 `../human-ai-col/_meta/plans/2026-05-06-method-optimization/`）。重构后的核心变化是从"角色扮演"转向"任务驱动"，与 v1 方法论的差异已大到无法在原仓库内并行演进，因此另起新仓 hact-method。

## 核心目标
构建一套以"任务驱动 + 多工作区 + 多迭代并行"为底层模型的 AI 与人协作开发操作系统。用户登录无需扮演角色，task.type 决定加载哪份规范——角色文件成为任务的工具书，不再是身份的定义。

## 关键变化（vs human-ai-col v1）

| 维度 | v1 方法论 | hact-method |
|---|---|---|
| 模型基底 | 角色 → 任务（先有身份，身份决定能做什么） | 用户 + 任务 → 规范（先有任务，task.type 决定加载哪份规范） |
| 角色/学科 | 6 个角色（技术总监/PM/架构师/devmgr/前后端开发） | 废弃角色身份（决策#1/#16），改用 8 个 discipline（management/product/architecture/dispatch/integration-testing/dev-frontend/dev-backend/deploy）；G5 收尾归 management（即旧 devmgr 职责）。〔原 review 于决策#24 砍除——代码审查内化进 develop〕 |
| 工作区切割 | 协调仓 + 代码仓（按 git repo 切） | 引入「项目根（编排）/ dispatch（循环）/ 父级（方法调整）」三种工作心态 |
| Gate | 1-4 + Gate 2.5 后期升 5 关 | 5 关固定；A/B 类有/无 Gate 区分 |
| dispatch | devmgr 写 pending-{layer}.md（推送式） | queue/*.md 拉取池（开发者自取） |
| B 类 | 走简化 4 关 | 无 Gate；恒定 2 会期（BUG 处理 + 功能优化） |
| 多迭代 | 串行（vN+1 不早于 vN G3） | 并行（A 类约束放宽，B 类不受限） |
| 部署 | 按迭代分散触发 | 默认合并部署（master 上"已验过"commit 一次性部署） |
| 联调 | 人工跑清单 | CC 自动化（curl + pinchtab + 失败自动写修复） |

## 关键干系人

| 角色 | 描述 | 利益诉求 | 态度 |
|------|------|---------|------|
| 管理者 | 项目发起人，非技术背景 | 团队协同有序、质量可管理、过程可见 | 主导 |
| 开发团队 | 5-8 名成熟程序员 | 减少返工、任务边界清晰、AI 辅助提效 | 待引入 |
| 外部产品/业务方 | 需求来源 | 需求被准确理解和实现 | 外部输入 |

## 设计依据
本次重构的完整讨论沉淀在 `../human-ai-col/_meta/plans/2026-05-06-method-optimization/`，含 4 份 flow-redesign 文档（A 类线性段 / A 类 Gate 4 / B 类 / 多迭代并行）+ 草案集 + 关键决策清单。讨论原稿留旧仓不搬迁，本仓写作时按需引用。

## 阶段划分

| 阶段 | 目标 | 完成标志 | 状态 |
|---|---|---|---|
| 第一阶段：搭骨架 | skeleton/ 下完成方法论骨架 | 用户身份模型 / 角色清单 / 工作区 / 任务全谱 / 状态机 / Gate 全部完稿 | 进行中 |
| 第二阶段：写结构层规范 | specs-structural/ 下完成每种 task.type 的契约 | 每个 type 有完成判据 / 所属 Gate / 产物形态定义 | 未开始 |
| 第三阶段：开发 hact-app | 用 hact-method 走完一遍 PRD/TRD/Gate 流程，开发出 hact-app（v1 看板的精神继承） | hact-app 部署上线，5 个 Gate 签完 | 未开始 |
| 第四阶段：写执行层规范 | specs-execution/ 下补每种 task 的具体做法 | hact-app 跑起来后边用边补 | 未开始 |
| 第五阶段：团队引入 | 真实开发者通过 hact-app 跑通完整任务流 | 至少一名开发者独立完成一个 task 全流程 | 未开始 |

## 约束条件
- 时间：无固定 deadline，验证可用为第一目标
- 资源：管理者主导设计，开发团队在第五阶段引入
- 前置：human-ai-col v1 方法论已成熟（旧仓为基础参考）

## 关键设计决策（继承自重构讨论，不要绕回）

1. **摒弃角色身份模型，改用 discipline 知识聚类**：discipline 不是身份、不是路由，只是任务知识的聚类维度。具体 discipline 清单不预设，由 04 任务全谱自然涌现（详见 skeleton/03 + 04）
2. **工作区 3 个**：hact-method / 项目根 / hact-notes（个人积累；2026-05-31 因决策#21 增设，原为 2 个，见 `skeleton/02-workspaces.md`）
3. **任务驱动**：人无身份，CC 加载工作规范靠任务声明
4. **B 类没 Gate**：只有任务流 + b-tasks.md 总账
5. **B 类入口**：项目根"派新 BUG / 派新优化"
6. **B 类恒定 2 会期**：BUG 处理 + 功能优化，不需要起/关
7. **hotfix 不独立**：是任务包 urgency 属性，归 BUG 会期
8. **部署默认合并**：master 上所有"已验过"commit 一次性部署
9. **部署归项目根**：原则不破，所有迭代/B 类都遵循
10. **联调 CC 自动化**：curl + pinchtab，失败自动写修复
11. **修订归项目根**：编排心态归编排区
12. **CC 启动协议状态推断**：从文件状态推断子阶段，不在 iteration 文件加显式标记
13. **任务是一等公民，Gate 退为聚合视图**：Gate N = 所属 task 集合的状态聚合
14. **task.type 是路由键**：决定加载哪份 standards、所属 Gate、完成判据
15. **任务范围扩到全流程**：PRD 起草、TRD 起草、standards 写作、联调脚本、修复任务、部署任务全部 task 化
16. **users.role 退化为权限标记**：只管"能不能写"，与流程角色解绑
17. **迭代是项目下一等公民**：目录结构 `projects/{项目}/iterations/vN/` 反映这一层级——跨迭代产物（decisions / reusables / design / backlog / feedback / b-tasks / **standards**）留项目根，迭代内产物（prd / trd / iteration Gate 状态 / sprint）入迭代目录。目录与未来 hact-app 数据模型 `projects → iterations → sprints/tasks` 同构。取消 v1 沿用的 product/ tech/ 角色风目录（与任务驱动模型冲突）
   > 落地修正（2026-05-08）：hact-method 改为纯方法论仓，仓内 `projects/` 目录移除；每个项目改为 `E:\group-code\{项目}\` 下的独立仓，协调文件合并进项目仓根。本决策的层级模型（projects → iterations → sprints/tasks）不变，仅物理路径由 `projects/{项目}/iterations/vN/` 调整为项目仓根的 `iterations/vN/`。
   > standards 归位（2026-06-20）：`standards-{shared,frontend,backend}.md` 由「迭代内产物」改为「跨迭代项目级活文档」，物理路径从 `iterations/vN/standards-*.md` 移到项目根。理由：standards 是代码库级编码约定、本质跨迭代，per-iteration 重生成产生副本链 + 真相源含糊 + 并行迭代约定漂移；改为单一源（v1 播种、vN+1 原地增补），与 decisions/reusables/design 同级，历史基线靠 git。所有消费者（plan-sprint/develop/manual-test/revise-doc）改读项目根。
18. **task → discipline 是 1:N；user → discipline 是 M:N**（路径 X）：每个 task 挂**单一**主 discipline（schema 上 `tasks.discipline` 是单值字段）；每个用户可被授权多个 discipline（schema 上 `user_disciplines` 是 junction 表）。跨学科辅助知识由 spec 文本跨引用相邻子规范来补，不在 schema 表达。理由：27 个 task 里真跨学科的极少（≤2），M:N 的 schema 复杂度对实际场景投资回报低；wrap-up-iteration 这种"看似跨学科"的任务实际是机械化分流，1 分钟内可完成，无需拆子任务
19. **权限模型 = user-discipline 关联（废弃 user.role）**：新增 `user_disciplines (user_id, discipline_id)` junction 表达"用户被授权做哪类 discipline 的任务"。拉取准入 = `task.discipline ∈ user.disciplines`（task 侧 1:N，user 侧 M:N）；任务级写权限由 taken-by 决定。管理性操作不另开后门——立项是独立 task `init-project`(management)；Gate 签字合并入最近前置任务（G1 在 draft-prd-vN/product，G2 在 draft-tech-design/architecture，G3 在 plan-sprint/dispatch，G4 在 manual-test/product，G5 在 wrap-up-iteration/management），通过 user 授权决定谁能拉
20. **复杂工作不强行预定义为 task type**：任务驱动模型不要求"所有动作都是任务"，只要求"被反复执行的、有清晰 spec 的动作是任务"。例：方法论调整本身是发散性工作，没清晰 spec——由有 `management` discipline 授权的 user 在 hact-method 工作区按需直接做，无固定任务包。本原则适用于所有低频+复杂+难标准化的活动
21. **个人积累跟人、私有（pull 上提）**：新增"个人积累仓" `hact-notes-{姓名}`（每人一个私有仓，建在团队 Gitee 组织下、由 init-project 自动创建、只加本人为 push 协作者——本人 push、别人无读权限、管理者作为 org admin 只读收割）。开发者随手记 `[规范]`/`[checklist]`/`[方法论]`/`[心得]` 四类标签条目。可上提的三类由管理者跑 `harvest-notes`(management) 只读收割、去重择优、上提到公共层（templates/standards、templates/checklists、方法论待议）；`[心得]` 永不上提。收割用游标避免重复、不回写成员仓。开发者全程不需要、也无权 push hact-method——积累从"推送"改为"拉取"，与 dispatch 拉取池哲学一致。这是兼得"保持 hact-method 干净（锁开发者写权限）"与"人人能积累"两个目标的方案。
   > 落地说明（2026-05-31）：上文"团队 Gitee 组织 / org admin"在实际落地中为 **Gitee 企业版（enterprise）**，命名空间 `dingxifan`（"苏州立刻电子商务有限公司"），非普通组织。建仓接口用 `/enterprises/{notes-org}/repos`，管理者为企业 admin 天然只读。配置见 `_meta/hact-config.md`，操作见 `guide/05-个人积累仓管理.md`。
22. **个人 notes 写入是权限模型的有限例外**：notes 写入不走"拉取准入 = task.discipline ∈ user.disciplines"——它是个人资产，权限绑 user 身份（本人写、管理者只读）。一旦经 harvest-notes 上提进公共层，后续修改回归常规 `management` 模型。harvest-notes 本身是固定 task（机械化收割），与决策#20"方法论调整是发散性工作、无固定 task"边界分清：harvest 只搬运/提炼，方法论的实质改动仍在发散性会话里做
23. **双源规范（设计甲）**：`draft-tech-design` 维护项目 standards（v1 播种 / vN+1 增补）时，除公共 `templates/standards` 外，再并入执行人本人 hact-notes 的 `[规范]`（对照公共模板 / 项目根现有 standards 去重），让本人尚未上提的规范当期即生效。理由：当前架构与开发高度重叠，生成端执行人≈真实开发者。团队分化后是否扩展到 develop 加载端（设计乙）+ checklist 对称（O1），留方法论待议
24. **砍除独立 pr-review，代码审查内化进 develop（merge-on-push）**（2026-06-20）：废除 `pr-review` task type + `review` discipline（discipline 9→8、task 13→12）。理由：develop 执行模型翻转后已内置 **per-task 独立对抗审查 subagent**（自读权威原文=任务包/diff/standards/测试，绝不收执行体自评），把原 pr-review 的内容复审（standards 合规 / 测试保真 / AC 忠实 / 设计保真）全部接管且更早（per-task vs 末端批量）——独立审查现做完即由 develop **自合并到 master**（提交 PR 后立即 merge），状态 `[done]` 退为瞬态、终态 `[merged]` 由 develop 自身落定。**治理代价明确接受**：master 写入无第二人工门，仅**安全敏感改动**（权限/认证/数据隔离）保留一道 `architecture` discipline 人工裁决（develop 末端 escape-hatch）。审计留痕 `code_reviews[]` 改由 develop 末端写（hact-app `CRDrawer.vue` 兼容不变）；跨 PR 共性 feedback 并入 wrap-up。审查知识落 `templates/review-briefs/develop-review.md`。团队引入期（第五阶段）若需恢复独立人工 merge 门可再评估

## 工具依赖

使用 hact-method 前需一次性配置以下工具，配置完成后无需重复操作：

### 开发机 / CC 工具

| 工具 | 调用位置 | 安装 / 配置方式 |
|------|---------|----------------|
| **superpowers** | 所有 skill 的基础框架 | 按 superpowers 官方文档安装 |
| **pinchtab skill** | generate-integration-tests 前端场景脚本 | 通过 superpowers 安装 |
| **simplify skill** | develop 自检阶段，检查冗余实现 | 通过 superpowers 安装 |
| **pic skill** | 联调前全面检查（`/pic`） | 通过 superpowers 安装 |
| **gitee-ops skill** | Gitee PR 操作（`/gitee-ops`，禁止使用 gh CLI） | 通过 superpowers 安装 + 配置 Gitee token |
| **SSH MCP** | deploy 阶段执行远端命令 | 在 Claude Code MCP 配置中添加 SSH server alias |

### 服务器端工具

| 工具 | 用途 |
|------|------|
| **pm2** | 后端进程管理，deploy 阶段重启服务 |
| **nginx** | 前端静态文件服务 |
