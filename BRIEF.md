# BRIEF.md — hact-method（AI 与人协作工作方法 v2）

## 项目背景
human-ai-col（v1 方法论）已完成第二阶段单人验证（simple-auth v1 hact 端到端演练 2026-05-06 收关）。在准备第三阶段团队引入时，对整体方法做了一轮深度重构（讨论原稿见 `../human-ai-col/_meta/plans/2026-05-06-method-optimization/`）。重构后的核心变化是从"角色扮演"转向"任务驱动"，与 v1 方法论的差异已大到无法在原仓库内并行演进，因此另起新仓 hact-method。

## 核心目标
构建一套以"任务驱动 + 双工作区 + 多迭代并行"为底层模型的 AI 与人协作开发操作系统。用户登录无需扮演角色，task.type 决定加载哪份规范——角色文件成为任务的工具书，不再是身份的定义。

## 关键变化（vs human-ai-col v1）

| 维度 | v1 方法论 | hact-method |
|---|---|---|
| 模型基底 | 角色 → 任务（先有身份，身份决定能做什么） | 用户 + 任务 → 规范（先有任务，task.type 决定加载哪份规范） |
| 角色数 | 6（技术总监/PM/架构师/devmgr/前后端开发） | 5（管理员/PM/架构师/devmgr/前后端开发；Gate 5 收尾归 devmgr 兼任） |
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
2. **工作区 3 个**：group-code 父级 / 项目根 / dispatch
3. **任务驱动**：人无身份，CC 加载工作规范靠任务声明
4. **B 类没 Gate**：只有任务流 + b-tasks.md 总账
5. **B 类入口**：dispatch 工作区"派新 BUG / 派新优化"
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
17. **迭代是项目下一等公民**：目录结构 `projects/{项目}/iterations/vN/` 反映这一层级——跨迭代产物（decisions / reusables / design / backlog / feedback / b-tasks）留项目根，迭代内产物（prd / trd / iteration Gate 状态 / standards / sprint）入迭代目录。目录与未来 hact-app 数据模型 `projects → iterations → sprints/tasks` 同构。取消 v1 沿用的 product/ tech/ 角色风目录（与任务驱动模型冲突）
18. **task ↔ discipline 是 M:N**：每个 task 可触多个 discipline，每个 discipline 涉及多个 task。schema 上 task 的 disciplines 字段是集合（数组）而非单值。M:N 由 04 字段表达，03 不做元叙述
