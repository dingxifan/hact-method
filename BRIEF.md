# BRIEF.md — hact-method

## 项目用途与目标

本仓是 AI 与人协作方法及项目模板的单一来源，不保存具体项目代码或数据。以任务驱动协作：Task 定义工作契约，模型在有效授权内完成分析、设计、执行与验证。没有固定 deadline，以验证可用为先；管理者主导方法设计，团队在真实项目试行中引入。

## 信息使用目标与职责

以最小充分、可靠的依据完成当前任务与下一项已授权动作：减少无关正文、重复规则和过程记录，从真实契约、代码及证据取得会改变判断、实现或验证的事实。模型在既有边界内完成相关性判断与普通工程推导，不以历史累积或材料数量代替充分性。

| 问题 | 现有责任位置 |
|---|---|
| 什么需持久化、何时成为正式事实 | `protocols/git-truth.md`：接受层级、durable decision 与必要 evidence；不保存完整讨论或另建上下文副本 |
| 当前任务承诺什么、实际事实是否仍成立 | `tasks/`：Authoritative Inputs、freshness、受影响调用链及验证，不能只相信任务包或总结 |
| 何时加载哪些规范及补读事实 | `templates/boot-protocol.md`：单 Task 起步、按动作触发，保留必要输入并按具体疑点补读，不递归预加载全部方法文件 |
| 如何证明结论、恢复工作及行使权限 | 既有 Review、Recovery、Authority Protocol：固定候选与原始证据、现实核验、有效授权；选择信息不能替代这些要求 |

正文减法使这些已有来源更清楚，不改变 Task 必需输入、质量与授权边界。任务结束只将必要事实放入原有载体，不要求经验提取、Context 摘要、自动归档或新的信息管理流程。保留历史不等于默认继承，能重新取得的信息在当前判断需要时仍必须读取。

## 当前唯一执行基线

- `tasks/` 是唯一任务执行契约，`protocols/` 定义跨任务不变量，`runtime/` 只实现运行时能力；检查器与真实证据负责质量控制。旧 specs 双层、自动中转、watcher、轮询账、恢复胶囊和兼容入口已退役。
- 项目工作默认在 Codex 中连续完成需求澄清、设计、规划、仓库执行与验证；ChatGPT Work 按需使用，不独占设计或规划。真实跨入口交接使用稳定文件与短 Execution Brief / Packet，Codex 内直接任务不额外制作往返材料。Git 是 Shared Project Truth；执行按已采用的 fixed Method SHA，不静默混入工作树最新版。
- 以结论可恢复为目标，默认同一运行时完成有界工作；一个用户动作最多一次对外交接的偏好不阻止必要 fresh review/re-review。普通失败与机械错误在既定范围内修正复验，外部效果收据只按 `protocols/external-effect.md` 的触发条件使用。
- 权威输入、固定候选、独立审查、真实验证、Gate 人签与外部效果核验保留。系统语义独审适合且 immutable sources 完整时优先 Fresh ChatGPT reviewer；runtime integration verification 由 Codex 执行。两条 lane 同属 `integration-verify`，必要结论最终对同一 fixed final candidate 有效；系统 finding 须在新候选经 fresh review 关闭。
- **结果严格，机制克制。** 先确定 Contract、最终不变量、安全/Authority 边界、不可逆恢复与外部兼容义务，再选择最小充分机制。可从权威事实重推、重算或廉价重建的中间信息默认不持久化；仅为完整过程审计、可观测或更多保险，不足以增加长期状态、记录或控制层。
- A 类 PRD→TRD→任务规划和 G1–G5 不变，整体滚动规格重构暂缓。B 类先真实调查、短 Intake，再按既有边界 develop；有已确认依据的局部兼容共享契约实现可 governed，不夹带已签规格修订、业务/权限重定义、破坏兼容或迁移。诊断不等于实施授权。
- 动态 Task/Gate 状态只写 `status.yml`。个人积累、学科准入、重复总账、成本计时、反馈清空与数量归档退出必经链；私人仓与旧记录不自动删除。仍有效的既有决定不因换会话重复确认，Human Authority 边界见 `protocols/authority.md`。
- 普通 Candidate→Accepted Truth 必须 `source branch → PR → merge → Accepted branch SHA verification`，direct push 只发布 candidate/source branch；已通过 PR merge 的 Accepted SHA 可按 Git Truth 同步授权镜像。首次 bootstrap 尚无 Accepted branch 时使用既有例外。
- 约束由 PRD/TRD、Foundation、`project.md` 技术层、任务 do-not 与 check/test/config 各自承载；Standards 及公共/栈候选库、生成/匹配/回填/收缩机制退役，模型自主选择等价实现，不生成通用编码说明。
- 项目采用本版按 `templates/method-install-policy.json` 区分 Method-owned、merged、project-owned；存量项目逐仓确认，经 `guide/08-旧项目全面接入新版.md` 的一次性 normalization、所有权归类、隔离候选和独立迁移审查后整体进入 current schema，不维护日常兼容层，不删除项目原有业务/类型/安全检查，不补造历史 Task/Gate/review。
- 开发方可信但会犯错；审查聚焦规范、错误及实际外部风险，不要求抵抗开发者恶意绕过。审查范围以 `templates/review-briefs/review-scope.md` 为准。建议不隐式阻断，必要证据与固定候选质量链不缩减。
- 提交只核本次涉及的任务证据，保留全局依赖与共享资产检查；未变历史 round 不反复重审。末轮 round 即最终独审结论，不再重复 final-review。复用固定 Method 来源与项目脚本，files 只维护当前落点、不自登记任务包；原审查员接续、三次实质代码审查额度从 Git 增量推导，同快照同问题集中补证一次，历史报告和计数保留，不增加轮次账/写集字段或审查阶段。实际节时尚待项目验证。

## 关键设计决策

Develop 默认仍为三次实质代码审查；用尽后可由用户对固定候选及限定问题明确批准一次追加（累计四次），决定留在项目既有 decisions.md、任务包只存指针。生成器和审计器使用同一限额判断；无批准不扩额，第五次拒绝，历史和全部质量/Authority边界保留。此次必要变更源自 file-extract V11-005/F004 的已批准有界升级，不代表其他项目已获追加或已分发。

保留原编号供现有引用定位；以下为已确认的当前口径，旧版本操作不因引用编号恢复有效。长篇论证与原文按需查[固定历史基线](https://github.com/dingxifan/hact-method/blob/9d6bc0ae8dbfdd34fa5cd4e7d759e3ee90f83c5c/BRIEF.md)，正常执行无需通读历史。

1. discipline 是知识聚类，不是角色身份、路由或授权来源。
2. 方法论仓与项目仓各自独立；个人积累仓仅可选，不由初始化自动创建。
3. 任务驱动：按当前 Task 加载工作契约。
4. B 类无 G1–G5；动态状态统一 `status.yml`，旧 b-tasks 总账退役。
5. B 类 bug/optimization 入口按 `protocols/b-intake.md`，不再注册 dispatch-new Core Task。
6. B 类无额外起/关仪式；历史“恒定两会期”不构成执行要求。
7. hotfix 是 urgency 属性，不独立建 Task 类型；部署仍需指定 snapshot/target 授权。
8. 默认合并部署已验证的结果；只能包含获适用接受/授权的变更，不由代码合并自动取得部署权。
9. 部署在项目范围按 `tasks/deploy.md` 处理，A/B/迭代共用边界。
10. 联调以真实穿透流、外部边界和浏览器场景验证，不以 mock 或静态声明冒充；具体执行器由 Runtime 实现。
11. 修订在项目事实与 `tasks/revise-doc.md` 边界内完成。
12. 用户已明确 Task 时直接加载该契约；否则按权威状态推断，不在迭代文件另写运行时标记。
13. Task lifecycle 与 Gate 正交；Gate readiness 聚合底层事实，approval 仍是独立 Human Authority，不能由任务完成推导。
14. task.type 决定 canonical Task Contract；当前 Catalog 见 `tasks/README.md`。
15. 正常全流程使用现有 Core Tasks；不为运行时编排增 Task。
16. 用户身份/资源写权限不等于产品、Gate 或其他 Human Authority。
17. 项目独立仓根保留跨迭代事实，迭代产物在 `iterations/vN/`；V0 可无 PRD，仅使用 G2(v0)，标准功能迭代仍 G1–G5。看板、Standards 与旧总账机制已退役。
18. Task 的知识分类不扩展成授权或模型路由机制。
19. 权限按 `protocols/authority.md`，旧 user-discipline 准入表不再参与执行。
20. 低频、复杂、发散的方法论调整不强行预定义 Task 类型；获用户明确授权后在本仓直接处理。
21. 私人积累可保留，非任何 Task/Gate 前置；方法论贡献遵守实际仓库保护与 Git acceptance，不自动拥有 default branch 写权。
22. harvest-notes 是用户显式触发的可选 utility，不是 Core Task，不自动读取或写入成员仓。
23. 个人 notes 双源规范注入随强制积累与 Standards 机制退役，不重新启用。
24. Package 独审内化进 develop，取消独立 pr-review；按仓库策略自合并仍必须走 PR，敏感 Human Authority 不省略；Package Review 不代替最终 System Assurance。
25. V0 证据触发、不默认走：跨切面、稳定、晚建代价高且薄切片可证明才准入；过大则继续缩减或跳过。不提前建设仅 V1 会用的能力，未入选项不阻断 G2(v0)。develop 不拆类型，foundation 作为 source。强制边声明须真撞反例，审查员干净环境复现；安全项构造级要求保留，仓库不可移植与审查环境限制分开判。
26. 减少无关活文档和重复调用负担；不强制数量归档、成本计时或固定模型降档，模型选择由 Human 决定。
27. 方法论保持栈无关，项目特有技术选择与验证入口由 project/TRD/Foundation/实际检查承载；不恢复 Standards 栈模板。
28. 可从权威事实推导的普通工程与机械动作自主继续，不逐步问“继续”；范围取舍、Gate、体验验收、安全/外部效果及授权扩大仍由 Human 决定。
29. risk 不信自报：审查按包内容与实际 diff 独立判断，存疑升档、不能因 standard 标签漏掉敏感边界；机械启发词只作提示，词表在 checker 单一维护，语义判断不复制词表。当前 mode 与 Human Authority 按 develop 契约，不沿用历史模型档位。
30. ChatGPT/Codex 共享同一 Method/Task/事实基线；Runtime location 不创建 state 或 ownership，必要独审缺少可信隔离时不能用自审替代，共享写冲突串行。
31. 能力只核当前任务实际需要的部分；freshness 无漂移保持紧凑，有漂移才展开。V0 走/跳、Gate、独审、固定 diff、共享写冲突与最终验证保留；历史计时字段不恢复。
32. 检查与模拟证据只证明对应内部契约，不能冒充真实跨环境或项目试点已通过；实际边界须由实际证据证明。

## 执行入口与工具

项目入口为 `templates/AGENTS.md`；当前状态与下一工作见 `STATUS.md` 及 `_meta/.current_plan` 指向的计划。Git、Node.js 和项目技术栈工具按需使用；浏览器、远端、隔离单元与托管能力只在当前动作需要时实测，不因配置存在宣称可用。`connections.yml` 仅保存坐标及 `${secret:NAME}`，凭据留机器本地；缺能力如实说明未运行原因。pm2/nginx 等按项目实际部署配置使用。
