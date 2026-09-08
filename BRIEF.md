# BRIEF.md — hact-method（AI 与人协作工作方法 v2）

## 项目背景
human-ai-col（v1 方法论）已完成第二阶段单人验证（simple-auth v1 hact 端到端演练 2026-05-06 收关）。在准备第三阶段团队引入时，对整体方法做了一轮深度重构（讨论原稿见 `../human-ai-col/_meta/plans/2026-05-06-method-optimization/`）。重构后的核心变化是从"角色扮演"转向"任务驱动"，与 v1 方法论的差异已大到无法在原仓库内并行演进，因此另起新仓 hact-method。

## 核心目标

当前执行环境（2026-09-08）：Codex 为唯一目标，项目入口为 AGENTS.md；原 CC 入口、中立能力映射及 CC↔Codex 兼容测试退役。历史决策中的双运行时和固定模型档位不再构成当前义务。质量以原始契约、固定改动、独立审查和实际验证为准，具体执行按当前 Codex 工具能力与用户授权。

当前约束载体（2026-09-08）：三个项目 Standards 及公共/栈候选库、生成/匹配/回填/收缩审计机制退役。PRD/TRD 承接业务与接口契约，Foundation 承接跨切面不变量，project.md 技术层承接项目特有选择与验证入口，任务 do-not 承接本任务禁区，check/test/config 承接可执行限制。模型自主选择等价实现，不再生成通用编码说明。下文决策 #17/#23/#25/#27 及相关 Standards 表述仅保留历史背景，执行以现行规范为准。

存量项目升级须逐仓确认，在独立 worktree 将仍有效且独有的约束迁入上述现有对象，并更新活跃任务引用、检查器和入口；未完成前沿用原方法论版本，不只删文件。历史报告/已完成任务保留原样，旧字段不再被当前检查器消费。现有业务检查、类型与安全边界不随文档退役删除。

审查信任前提（2026-09-06）：开发人员（含实现 AI）可信但会犯错，审查聚焦规范、错误与外部风险，不要求抵抗开发人员恶意或有意绕过。此口径收窄决策#25 等历史文字中的无界“不可绕过”表述；独立证据验证与实际外部安全边界继续成立。执行判据单一来源为 `templates/review-briefs/review-scope.md`。
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
| 联调 | 人工跑清单 | AI 驱动穿透流 + 浏览器场景；具体执行器由运行时映射选择 |

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
| 第一阶段：搭骨架 | skeleton/ 下完成方法论骨架 | 用户身份模型 / 角色清单 / 工作区 / 任务全谱 / 状态机 / Gate 全部完稿 | ✅ 完成（2026-05-07） |
| 第二阶段：写结构层规范 | specs-structural/ 下完成每种 task.type 的契约 | 每个 type 有完成判据 / 所属 Gate / 产物形态定义 | ✅ 完成（2026-05-08） |
| 第三阶段：写执行层规范 | specs-execution/ 下补每种 task 的具体做法 | 主线 task 执行规范齐备，并由真实项目边用边补 | 🔄 边用边补 |
| 第四阶段：团队引入 | 真实开发者按本方法独立跑通任务流 | 至少一名开发者独立完成一个 task 全流程（拉包 → develop → 独立审查 → 合并） | 🔄 进行中 |

> 原「开发看板应用」阶段已取消（2026-08-30）：配套看板应用停更、CC_TOKEN 与 webhook 链路失效，相关机制已从方法论移除。其原本承担的"用本方法走完整流程"验证职责，已由 mail-ai / doc-extract / file-extract / JHH-Nortion 等真实项目承担。此后阶段编号顺延，历史记录中的"第三/四/五阶段"按旧编号理解。

## 约束条件
- 时间：无固定 deadline，验证可用为第一目标
- 资源：管理者主导设计，开发团队在第五阶段引入
- 前置：human-ai-col v1 方法论已成熟（旧仓为基础参考）

## 关键设计决策（继承自重构讨论，不要绕回）

1. **摒弃角色身份模型，改用 discipline 知识聚类**：discipline 不是身份、不是路由，只是任务知识的聚类维度。具体 discipline 清单不预设，由 04 任务全谱自然涌现（详见 skeleton/03 + 04）
2. **工作区 3 个**：hact-method / 项目根 / hact-notes（个人积累；2026-05-31 因决策#21 增设，原为 2 个，见 `skeleton/02-workspaces.md`）
3. **任务驱动**：人无身份，AI 运行时加载工作规范靠任务声明
4. **B 类没 Gate**：只有任务流 + b-tasks.md 总账
5. **B 类入口**：项目根"派新 BUG / 派新优化"
6. **B 类恒定 2 会期**：BUG 处理 + 功能优化，不需要起/关
7. **hotfix 不独立**：是任务包 urgency 属性，归 BUG 会期
8. **部署默认合并**：master 上所有"已验过"commit 一次性部署
9. **部署归项目根**：原则不破，所有迭代/B 类都遵循
10. **联调自动化**：后端穿透流 + 浏览器场景，失败按证据写修复任务；具体驱动只住运行时映射
11. **修订归项目根**：编排心态归编排区
12. **共同启动协议状态推断**：从文件状态推断子阶段，不在 iteration 文件加显式运行时标记
13. **任务是一等公民，Gate 退为聚合视图**：Gate N = 所属 task 集合的状态聚合
14. **task.type 是路由键**：决定加载哪份 standards、所属 Gate、完成判据
15. **任务范围扩到全流程**：PRD 起草、TRD 起草、standards 写作、联调脚本、修复任务、部署任务全部 task 化
16. **users.role 退化为权限标记**：只管"能不能写"，与流程角色解绑
17. **迭代是项目下一等公民**：目录结构 `projects/{项目}/iterations/vN/` 反映这一层级——跨迭代产物（decisions / reusables / design / backlog / feedback / b-tasks / **standards**）留项目根，迭代内产物（prd / trd / iteration Gate 状态 / sprint）入迭代目录。目录与未来看板应用数据模型 `projects → iterations → sprints/tasks` 同构。取消 v1 沿用的 product/ tech/ 角色风目录（与任务驱动模型冲突）
   > 落地修正（2026-05-08）：hact-method 改为纯方法论仓，仓内 `projects/` 目录移除；每个项目改为 `../{项目}/` 下的独立仓，协调文件合并进项目仓根。本决策的层级模型（projects → iterations → sprints/tasks）不变，仅物理路径由 `projects/{项目}/iterations/vN/` 调整为项目仓根的 `iterations/vN/`。
   > standards 归位（2026-06-20）：`standards-{shared,frontend,backend}.md` 由「迭代内产物」改为「跨迭代项目级活文档」，物理路径从 `iterations/vN/standards-*.md` 移到项目根。理由：standards 是代码库级编码约定、本质跨迭代，per-iteration 重生成产生副本链 + 真相源含糊 + 并行迭代约定漂移；改为单一源（v1 播种、vN+1 原地增补），与 decisions/reusables/design 同级，历史基线靠 git。所有消费者（plan-sprint/develop/manual-test/revise-doc）改读项目根。
   > v0 例外（2026-06-29，决策#25）：迭代不再隐含绑 PRD/G1——**v0 走骨架是合法的无 PRD 迭代**（仅签 G2(v0)、无 G1/G3-5）。projects→iterations→sprints/tasks 层级模型不变，只是 v0 这一期不含功能侧 Gate；标准功能迭代（v1+）仍 G1→G5。
   > 看板应用退场（2026-08-30）：原文「与未来看板应用数据模型同构」的那个消费者已不存在（应用停更、链路失效，相关机制已从方法论移除）。**层级模型 projects → iterations → sprints/tasks 不变**——它现在的机器侧消费者是项目根 `status.yml` 与 `check-sprint.js` / `check-gate.js`。
18. **task → discipline 是 1:N；user → discipline 是 M:N**（路径 X）：每个 task 挂**单一**主 discipline（schema 上 `tasks.discipline` 是单值字段）；每个用户可被授权多个 discipline（schema 上 `user_disciplines` 是 junction 表）。跨学科辅助知识由 spec 文本跨引用相邻子规范来补，不在 schema 表达。理由：27 个 task 里真跨学科的极少（≤2），M:N 的 schema 复杂度对实际场景投资回报低；wrap-up-iteration 这种"看似跨学科"的任务实际是机械化分流，1 分钟内可完成，无需拆子任务
19. **权限模型 = user-discipline 关联（废弃 user.role）**：新增 `user_disciplines (user_id, discipline_id)` junction 表达"用户被授权做哪类 discipline 的任务"。拉取准入 = `task.discipline ∈ user.disciplines`（task 侧 1:N，user 侧 M:N）；任务级写权限由 taken-by 决定。管理性操作不另开后门——立项是独立 task `init-project`(management)；Gate 签字合并入最近前置任务（G1 在 draft-prd-vN/product，G2 在 draft-tech-design/architecture，G3 在 plan-sprint/dispatch，G4 在 manual-test/product，G5 在 wrap-up-iteration/management），通过 user 授权决定谁能拉
20. **复杂工作不强行预定义为 task type**：任务驱动模型不要求"所有动作都是任务"，只要求"被反复执行的、有清晰 spec 的动作是任务"。例：方法论调整本身是发散性工作，没清晰 spec——由有 `management` discipline 授权的 user 在 hact-method 工作区按需直接做，无固定任务包。本原则适用于所有低频+复杂+难标准化的活动
21. **个人积累跟人、私有（pull 上提）**：新增"个人积累仓" `hact-notes-{姓名}`（每人一个私有仓，建在团队 Gitee 组织下、由 init-project 自动创建、只加本人为 push 协作者——本人 push、别人无读权限、管理者作为 org admin 只读收割）。开发者随手记 `[规范]`/`[checklist]`/`[方法论]`/`[心得]` 四类标签条目。可上提的三类由管理者跑 `harvest-notes`(management) 只读收割、去重择优、上提到公共层（templates/standards、templates/checklists、方法论待议）；`[心得]` 永不上提。收割用游标避免重复、不回写成员仓。开发者全程不需要、也无权 push hact-method——积累从"推送"改为"拉取"，与 dispatch 拉取池哲学一致。这是兼得"保持 hact-method 干净（锁开发者写权限）"与"人人能积累"两个目标的方案。
   > 落地说明（2026-05-31）：上文"团队 Gitee 组织 / org admin"在实际落地中为 **Gitee 企业版（enterprise）**，命名空间 `dingxifan`（"苏州立刻电子商务有限公司"），非普通组织。建仓接口用 `/enterprises/{notes-org}/repos`，管理者为企业 admin 天然只读。配置见 `_meta/hact-config.md`，操作见 `guide/05-个人积累仓管理.md`。
   > 权限口径调整（2026-07-11）：`hact-method-lab` 已对团队 8 名成员开放**开发者**权限（管理者决定，允许直接贡献方法论改动），原文"开发者全程不需要、也无权 push hact-method"收窄为"**无权写 master**"——master 设 Gitee 保护分支（开发者不可直推/force-push/删除，PR 合并权在管理员），成员贡献走 feature 分支 + PR、管理者合并把关。notes + harvest-notes 仍是个人积累上提的主路径不变，PR 是方法论文档的直接贡献通道，两者并存。
22. **个人 notes 写入是权限模型的有限例外**：notes 写入不走"拉取准入 = task.discipline ∈ user.disciplines"——它是个人资产，权限绑 user 身份（本人写、管理者只读）。一旦经 harvest-notes 上提进公共层，后续修改回归常规 `management` 模型。harvest-notes 本身是固定 task（机械化收割），与决策#20"方法论调整是发散性工作、无固定 task"边界分清：harvest 只搬运/提炼，方法论的实质改动仍在发散性会话里做
23. **双源规范（设计甲）**：`draft-tech-design` 维护项目 standards（v1 播种 / vN+1 增补）时，除公共 `templates/standards` 外，再并入执行人本人 hact-notes 的 `[规范]`（对照公共模板 / 项目根现有 standards 去重），让本人尚未上提的规范当期即生效。理由：当前架构与开发高度重叠，生成端执行人≈真实开发者。团队分化后是否扩展到 develop 加载端（设计乙）+ checklist 对称（O1），留方法论待议
24. **砍除独立 pr-review，代码审查内化进 develop（merge-on-push）**（2026-06-20）：废除 `pr-review` task type + `review` discipline（discipline 9→8、task 13→12）。理由：develop 执行模型翻转后已内置 **per-task 独立对抗审查 subagent**（自读权威原文=任务包/diff/standards/测试，绝不收执行体自评），把原 pr-review 的内容复审（standards 合规 / 测试保真 / AC 忠实 / 设计保真）全部接管且更早（per-task vs 末端批量）——独立审查现做完即由 develop **自合并到 master**（提交 PR 后立即 merge），状态 `[done]` 退为瞬态、终态 `[merged]` 由 develop 自身落定。**治理代价明确接受**：master 写入无第二人工门，仅**安全敏感改动**（权限/认证/数据隔离）保留一道 `architecture` discipline 人工裁决（develop 末端 escape-hatch）。审计留痕 `code_reviews[]` 改由 develop 末端写（写入 `status.yml`，字段见 skeleton/07）；跨 PR 共性 feedback 并入 wrap-up。审查知识落 `templates/review-briefs/develop-review.md`。团队引入期（第五阶段）若需恢复独立人工 merge 门可再评估

25. **地基层 + V0 走骨架（A 类项目 init 后、V1 前先建跨切面地基）**（2026-06-29）：补一个被「按页/按功能切包」天然漏掉的**结构盲区**——EP 主题覆盖 / 全局 reset / 错误信封 / 数据隔离这类**跨切面公共件不属于任何业务页**（视觉地基 2026-06-28 是其第一个被打疼的实例）。模型：**地基的形式由"业务代码怎么碰它"决定**（说它=共享类型 / 穿过它=单例瓶颈 / 住进它=外壳 / 被它笼罩=环境基线 / 往里填=脚手架）；**强制边三档**（构造上不可能 > 机械探测 > 人审）是同一件事的背面——命门「**一个图省事的人顺手写出来，多大概率合规？**」；两进料口（**技术内生**=跨项目复发、可清单化 / **领域涌现**=从早期探讨摸）；准入门槛=已证明跨切面 + 稳定。**新管线**：`init-project`（加共识讨论步 → 播种 `foundation.md` 地基蓝图）→ **V0 走骨架**（`draft-foundation` 设计·签 G2(v0) + `develop(source=foundation)` 建——穿透前端→API→DB 的最小空壳 + 一根标杆切片）→ V1（PRD 挂领域地图 / draft-ux 填 token 真值进 V0 框架 / draft-tech-design 瘦身：读栈+standards 增补 / plan-sprint 视觉地基包按「框架(V0)/值(V1)」二分）。**关键判断**：① **新建 `draft-foundation` 不拆 draft-tech-design**（两者身子不相交：V0 无 PRD/AC）；② **develop 不拆、`source=foundation` 做成一味**（与 develop 共享执行+独审+合并核心、只差进料口 = sub7 拆了又撤的格，与①相反）；③ Gate 复用 **G2(v0)**、不加新 Gate；④ **代码生成机制删**（本环境 CC 即生成器，劳动已消，确定性一致由 ②③④ 兜——标杆模块因此升为 CC 漂移主防线）；⑤ standards/reusables **载荷重分配**（地基吸走强边「必须」，二者降为人审残量 + 可选复用 + 标杆指针）。task 12→13（draft-foundation；discipline 仍 8）。**存量兼容**：tech-design 的首期簇（栈/standards 首播/测试基建/视觉地基约定）保留为「未走 V0 的存量项目」兜底。审查知识落 `templates/review-briefs/foundation-review.md`（逐关注点穷举验实际档≥应有档 + 命门）。设计沉淀见 `_meta/plans/2026-06-29-foundation-walking-skeleton/`
   > V0 减重（2026-09-08）：V0 从“除微型项目外默认走”改为**证据触发、不默认走**。只有已证明跨切面、约束稳定、晚建会横切多层/数据或扩大安全风险、且一根薄切片可证明的项才进入 V0；预置关注点只是候选，未入选项标 V1+，不阻断 G2(v0)。V0 只写实际命中的最小 Standards，不做三层全量首播；“V1 会用”的运行器、黄金样本、基线和业务能力不得作为 V0 额外交付。若范围超过一个正常中型 develop 任务，删到最难后补的约束，仍超出则跳过 V0。独立 foundation-review、真实强制边证据和安全项构造级要求保留，但只覆盖获准 V0 行。
   > 审查收紧（2026-07-12，foundation-review 证据化）：构造级/机械级声明须以**亲手撞过的反例**为证（判构造级前写绕过代码跑检查、必须真被挡，原只绑安全项 → 通用到每个 ≥机械级声明），自绿须**审查员在干净环境亲自复现**（区分仓库不可移植=阻断 / 审查环境特性=不阻断）——**收紧现有 foundation-review 门、非新增机制**（与 2026-07-08 机制冻结相容，正是冻结在等的"库存过一轮真实迭代"驱动）。实证：doc-extract V0 二轮独审——一轮默认模型"读代码判断"漏五类非安全构造级洞、二轮"必须撞反例"抓住，证 brief 严苛度 > 模型大小。G3（机械级是否强制接自动门/CI）记方法论待议、随第五阶段真人 push 重评。设计沉淀见 `_meta/plans/2026-07-12-foundation-review-probe-tightening/`

26. **按 token 计费后的运行成本原则**（2026-07-01）：从 Claude 包月转为 Claude Code/API 按量后，方法论的主成本不再只是 spec 行数，而是「每次会话读入的活文档」与「每个任务倍增的 subagent 调用」。保留决策#17 的项目级活文档单一源，但给 `decisions.md` / `reusables.md` 加归档约定，避免项目寿命越长越贵；保留决策#24 的 per-task 独立审查，但给任务包新增 `risk` 字段，并把纯审查/一致性核对类 subagent 默认降为 `model: "haiku"`，安全敏感任务与生成/写代码类 subagent 继续使用默认模型。**降档范围按"任务性质"而非"所属阶段"判断**——同一原则同步覆盖 `generate-integration-tests` 的按模块/场景并行执行 subagent（纯执行脚本+结果上报，天然倍增）与各阶段会话启动的 Explore 并行读文件 fan-out（纯读取+摘要）；生成类/写代码类/含判断取舍的 subagent（如 standards 生成、任务包撰写）不降档。同步把本仓 `STATUS.md` 历史正文只留索引，完整记录归 `_meta/status-history.md`。
   > 审查档位上调（2026-07-14）：**纯审查/一致性核对类 subagent 的降档目标从 `haiku` 改为 `model: "sonnet"`（Sonnet 5）**——doc-extract 实测 haiku 在独立审查里**系统性误报**（把合规写法判成问题、把不存在的缺口列出来），误报的返工成本抵消了降档省的钱，且污染 loop 收敛。**只动"审查/一致性核对"这一类**（develop per-task 独审 standard 档 / prd-review / trd-review / prototype-review / task-package-review）；**纯读取+摘要的 Explore fan-out 与 `generate-integration-tests` 纯执行+上报 subagent 仍留 `haiku`**（无审查判断、误报语义不适用，成本敏感）。sensitive / `source=foundation` 仍不降档、继承会话默认模型（Sonnet 5 是 standard 档，不是 sensitive 档）。决策#29 五层防线结构不变，只是其中"standard 降档"档位由 haiku 变 sonnet。此为决策#26 参数按实证回调，非新增机制（与机制冻结相容）。

27. **技术栈剥离（骨架/规范栈无关，栈内容住 standards 栈子模板）**（2026-07-08）：方法论名义项目无关，但栈词汇（Vue/NestJS/Element Plus 变量名）曾渗进 skeleton 与 specs——换栈项目要动骨架，违背分层。修正：**skeleton 与 specs-execution 只说约束类型**（"前端组件实现""UI 库主题变量""type-check 命令按项目栈"），**栈特定写法下沉 `templates/standards/{layer}-{栈}.md` 栈子模板**（首批 `frontend-vue3.md` / `backend-nestjs.md`，即原通用模板中迁出的 Vue/EP/Pinia/Vite 与 TypeORM/class-validator/NestJS 细则）；通用模板 `frontend.md` / `backend.md` 瘦身为栈无关原则。**路由键 = `project.md` 技术层**（V0 `draft-foundation` 确立）：standards 播种从双源升三源（通用模板 + 栈子模板 + 个人 notes `[规范]`），项目栈无对应子模板 → 退回通用模板、栈特定约定直接写项目 standards。工具依赖层（Gitee/pinchtab/pm2/nginx）保留声明式引用不属此列；checklist 栈拆分暂缓（记方法论待议）。

28. **人工确认点分级（🚫 只留人拍板，可推导判定 ⚖️ 默认判定+可推翻）**（2026-07-08）：准备段一期主线累计 20+ 次人工确认，混着"必须人拍板"（范围/取舍/验收/Gate 签字/安全）与"可从既有信息推导"（交付方式、执行层、可逆目录创建）两类——后者是把 develop 已实现的"全自动 loop + 少数人工门"哲学在准备段的欠账。分级：**🚫 硬阻断**（必须停下等回应）只留人拍板项；**⚖️ 默认判定**——CC 按既定规则自判、输出结论+理由后直接继续，用户可随时推翻（推翻则修正再继续）；步骤协议同步改为非 🚫 步骤**不再问"继续？"**、直接续跑。首批落地：plan-sprint Step 2.5 交付方式并入 Step 2（规则不变、不再单独阻断）；develop 第零步执行层自动判定（仅两层都有可取任务才问）；draft-prd v2+ 建目录不等确认、vN+1 继承/继承·微调功能批量确认（新增/重构/简化仍逐个）；四个会话启动选项列表在用户开场已明确主线意图时跳过。不动清单：疑点清单、骨架方向、TRD 内容确认、五个 Gate 签字、前端设计门、manual-test 验收循环、draft-ux 全部（共创类）、init-project 信息收集。

29. **安全敏感判定多层化（risk 不信自报，只升不降）**（2026-07-08）：决策#24（develop 自审自合并）+ #26（`risk: standard` 独审降档 haiku）+ `risk` 由 plan-sprint/dispatch-new 自报且 check-sprint 不校验，三者叠加出一条无机械拦截的合并链——漏标 sensitive 的任务包 → haiku 审 → 自动进 master；B 类连 G3 检查器都没有。修正为**五层防线**，`risk` 自报不再是安全档位的单点输入：① 填包规则「存疑即 sensitive」（plan-sprint / dispatch-new / 任务包模板）；② plan-sprint Step 3.5 独审 brief 增第⑥类「risk 标注核对」（包内容触及四类而标 standard = 阻断，改标即修）；③ `check-sprint.js` 敏感启发词核对（词面命中而未标 sensitive → `🧑` 段提示；启发式有误报，不做 FAIL）；④ develop 阶段 B 按**有效 risk**定模型档位（自报 sensitive ∨ 主线按四类语义扫任务包命中 → 不降档 + 回改字段）；⑤ 末端安全敏感预检**基于 diff 独立判定、不读 risk 自报**+ 漏标闭环（判定触及但曾被降档审过 → 先重派默认模型独审，再进 architecture 裁决）。①②③ 住 A 类 G3 链，④⑤ source 无关、同时兜 B 类。误报代价 = 多花一次默认模型独审，相对 #26 的降档收益可接受；启发词表单一来源住 `check-sprint.js`（机械层），develop 侧用四类语义判断、不复制词表。

30. **Claude Code + Codex 双运行时，共享一份方法论正文**（2026-09-04）：`CLAUDE.md` / `AGENTS.md` 是薄入口，共同启动、任务路由、任务包、`status.yml`、Gate、固定审查证据和检查器不分叉；专属模型、代理、浏览器和代码托管实现只住 `templates/runtime/{cc,codex}.md`。运行时属于会话能力，不进入任务状态。隔离审查缺失时不得同会话自审替代；共享写集重叠默认串行。GPT-5.6 长上下文用于跨文档收敛与证据账本，不把整仓预加载或长输出当目标。决策#24/#26/#28/#29 中的具体模型与代理词只保留历史背景，当前执行以本决策及运行时映射为准。

31. **强模型时代只删重复编排，不删治理边界**（2026-09-04）：运行时能力协商后移到 `task.type` 推断与单份规范加载之后，只检查当前任务实际命中的能力；freshness 无漂移时只留固定锚与一行摘要，发生漂移才展开证据与路由；事件时间戳是 implementation / review / round 耗时的单一真相源，不再持久化可计算的派生分钟，只有跨多段累计的 `spec_minutes` 保留。V0 仍由人类在 init-project 中自主决定走或跳；Gate、首次独立完整审查、固定 diff、共享资产冲突约束与最终全量验证不变。

32. **双运行时内部闭合必须由真实证据而非同源声明证明**（2026-09-04）：独立审查发现双入口虽已共用正文，但 develop 专属命令残留、G1→G3 路由断层、TRD 独审冲突、假 Git SHA 可过和同源 handoff canonical 等问题，首轮结论 `block`。修复后：启动以机器可核状态矩阵覆盖；代码托管/模型词只住映射；任务认领核依赖已 merged；每任务取独立 base tree，前序 accepted 文件以 blob 防二次污染；B 类在固定 diff 上核契约；V0 异常须 closed + 闭合锚且未知不可冒充关闭；review 审计要求当前仓真实 Git 对象并重算 hash/files/finding 闭合；四场景使用 schema-complete 独立夹具并做变异测试；hook、初始化和前后端联调证据均有负向检查。五轮独立复审最终结论 `pass`。自动夹具只证明内部契约，不替代真实 CC↔Codex 试点。

## 工具依赖

使用 hact-method 前需配置 Git、Node.js 与项目技术栈所需工具。隔离单元、浏览器场景、远端命令和代码托管操作的具体配置不在本 Brief 复制，分别以 `templates/runtime/cc.md`、`templates/runtime/codex.md` 为准；任务路由确定后由 `templates/runtime/preflight.md` 按需实测能力，不因配置文件存在就声称可用。

项目共同要求：`connections.yml` 只保存坐标与 `${secret:NAME}` 引用，真凭据留机器本地；浏览器或远端能力缺失时必须记录未运行原因，不能伪造通过。

### 服务器端工具

| 工具 | 用途 |
|------|------|
| **pm2** | 后端进程管理，deploy 阶段重启服务 |
| **nginx** | 前端静态文件服务 |
