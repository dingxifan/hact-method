# hact-method 对抗性审查报告

## 总览
- P0 数量：2
- P1 数量：12
- P2 数量：10
- P3 数量：2
- 多角色共同发现：3 条（task.type 路由缺陷、status.yml 写入无校验/并发冲突、B 类就地分流质量）
- Top 3 最高优先级问题：
  1. task.type 路由完全依赖用户声明，无早期误判检测且推断错误无验证门
  2. 跨会话接续依赖 CC 读文件重建状态，无完整性校验，半写入状态静默继续
  3. status.yml 写入无 schema 校验，格式错误静默污染 hact-app 唯一数据源

---

## P0 — 系统性缺陷

### task.type 路由完全依赖用户声明，无早期误判检测
**严重程度**: P0
**所在层**: 跨层（skeleton / specs-execution / templates/CLAUDE.md）
**定位**: `skeleton/01-identity.md` §2、`templates/CLAUDE.md` §Step 1 推断逻辑
**问题**: 整个系统的规范加载路由键是 `task.type`，但 `templates/CLAUDE.md` Step 1 通过 `sprint.md` 状态分布推断任务类型，而非从显式声明的 task 包读取。推断逻辑依赖对多个文件状态的解读，CC 在推断错误时没有任何验证门：若 `sprint.md` 格式漂移、states 描述不规范，CC 会静默加载错误规范执行。
**影响**: CC 带着错误规范把整个会话跑完，产物按错误规范生成，无人发现直到下一阶段出现结构性不兼容。
**建议**: Step 1 推断完毕后强制要求 CC 输出"我推断当前任务是 X，加载规范 Y，请确认"并等用户明确回应（设 🚫 阻断），不允许自动滑入规范执行。

---

### 跨会话接续依赖 CC 读文件重建状态，无完整性校验
**严重程度**: P0
**所在层**: 跨层（specs-execution 全部 task）
**定位**: 每份 exec spec 的"断点续做"章节（以 `specs-execution/develop.md`、`generate-integration-tests.md`、`manual-test.md` 为代表）
**问题**: 断点续做依赖 CC 读 `progress.md` / `sprint.md` / `gates.md` 等多个文件重建状态，但这些文件是 CC 自己在上一会话写入的。若上一会话在写入中途被截断（context 满、crash、网络断开），文件可能存在半写入状态。CC 新会话读到不完整文件时，会用部分信息推断出一个"看上去合理"的状态继续执行，而非报告状态不一致。
**影响**: 在长流程的 develop / generate-integration-tests 会话中，CC 可能重复派发已处于 `taken-by` 状态的修复任务，或跳过已存在但被误认为"未完成"的步骤，产生重复条目或遗漏步骤且无任何报错。
**建议**: 在每个 exec spec 的"断点续做"章节，增加"状态一致性核查"步骤：对比 `status.yml` 的 task 状态与 `queue/*.md` 文件的状态标记，两者不一致时报告差异等待人工确认，不自行猜测"以哪个为准"。

---

## P1 — 重要漏洞

### queue 任务包内的任务间依赖关系无统一机器可读格式
**严重程度**: P1
**所在层**: specs-execution / specs-structural
**定位**: `specs-structural/plan-sprint.md §sprint.md 格式说明` + `specs-execution/develop.md §拾取任务`
**问题**: `sprint.md` 中 `依赖` 列是自由文本；任务包 16 字段的 `depends-on` 字段仅存在于 `status.yml` 契约，在 `specs-structural/develop.md §字段规范` 的任务包字段列表里找不到对应位置，两处定义脱节。开发者只能靠读 `sprint.md` 自然语言判断依赖是否满足。
**影响**: 新人认领任务时容易无视依赖直接开始，导致后续 PR 在依赖未合并时无法集成。
**建议**: 在任务包字段规范里补入 `depends-on`（task-id 列表），并在 `develop.md §拾取任务` 增加"依赖前置检查"步骤：若 `depends-on` 非空，验证引用任务是否已在 `sprint.md` 标记 `[merged]`，否则阻断。

---

### develop 全流程：会话在哪个分支启动没有明确说明
**严重程度**: P1
**所在层**: specs-execution
**定位**: `specs-execution/develop.md §会话启动` + `templates/CLAUDE.md §Step 0`
**问题**: `develop.md` 描述了"第零步确认执行层"和"拾取任务包"，但没有说明开发者应在哪个 git 分支上开始工作。Step 6 说"分支必须从 master 切"，但 Step 1–5 期间处于什么分支是未定义的——如果开发者在 master 上写了代码才到 Step 6，就需要撤销再重切分支。
**影响**: 第一次按文档操作的新开发者可能在 master 直接写代码，造成混乱甚至破坏主分支。
**建议**: 在 `develop.md §会话启动` 末尾或 Step 1 之前增加"切功能分支"步骤：`git checkout -b {task-id}`，明确所有代码改动在此分支上完成。

---

### PR 被打回后"结构性建议"的处理路径不明确
**严重程度**: P1
**所在层**: specs-execution
**定位**: `specs-execution/pr-review.md §升级条件` + `specs-execution/develop.md §上下文重置协议`
**问题**: `pr-review.md` 定义了普通 `[阻断]` 和"升级条件"两种打回情形，但对"CR 给出结构/方案层建议（不是简单代码问题，也没触发升级条件）"这个中间地带没有明确路径。三条可能的路径（改代码再推 PR、回退任务、开 `revise-doc`）在规范中都有迹可循但都不完整。
**影响**: 开发者和 reviewer 对"结构性建议"的处理各自为政，协调成本高，团队频繁产生隐性沟通。
**建议**: 在 `pr-review.md §打回后处理` 增加决策矩阵：根因在文档层→打回+创建 `revise-doc`；根因在实现方案层→打回、develop 任务保持 `[taken-by]` 由开发者重做；根因在 AC 本身→打回+创建 `revise-doc(target=prd)`。三条路都需要在 PR comment 写明打回原因所属类别。

---

### status.yml 并发更新：软锁只保护任务拾取，不保护状态更新步骤
**严重程度**: P1
**所在层**: specs-execution / skeleton
**定位**: `skeleton/05-state-machine.md §3 软锁机制` + `skeleton/07-status-contract.md §五 写入协议` + `specs-execution/develop.md §Step 8 更新状态`
**问题**: 软锁机制只覆盖"拉任务"动作（`可取 → taken-by`）。多人并行开发时，两个开发者可能同一天分别完成任务都往 `status.yml` 写入状态变更，后 push 者必然遭遇 git 冲突，而规范对"非拾取动作的 status.yml 并发写入冲突"如何解决只字未提。
**影响**: 5-8 人团队在同一 sprint 期间频繁遭遇 `status.yml` git 冲突，合并策略不明确，手动解决冲突时容易弄错字段值导致 hact-app 取数错误。
**建议**: 在 `skeleton/07-status-contract.md §五` 增加"并发写入冲突处理"小节：按 task-id 段分块，两人修改不同 task-id 时保留两段；同一 task-id 冲突以最新状态为准；推荐在 git 层面用 rerere 或标注冲突时各字段取值规则。

---

### 跨任务依赖阻塞：被阻塞任务的状态定义与操作指引缺失
**严重程度**: P1
**所在层**: skeleton / specs-execution
**定位**: `skeleton/05-state-machine.md §4 异常转移` + `specs-execution/develop.md §上下文管理`
**问题**: `develop.md §阻塞于 revise-doc 结论` 只覆盖一种阻塞情形。对于"依赖另一名开发者的 develop 任务还没合并"这种跨任务依赖阻塞，规范没有回答：是等（保持 `[taken-by]`）还是退回 `[可取]`？等待期间可否开始其他任务？阻塞超时如何上报？
**影响**: 新开发者遇到依赖阻塞时不知所措，不同人做法不一致，导致 `sprint.md` 状态出现长期 `[taken-by]` 僵尸任务，误导 hact-app 推断逻辑。
**建议**: 在 `develop.md §上下文管理` 增加"依赖阻塞等待策略"：跨层/同层未认领依赖→保持 `[可取]` 不认领；已 `[taken-by]` 遭阻塞→持有者决定等（写阻塞理由）或退回（写退回理由），等待超过 N 天（需定义阈值）由 dispatch 重派。

---

### B 类紧急 BUG：dispatch-new 没有描述 hotfix 与进行中 sprint 任务的分支冲突处理
**严重程度**: P1
**所在层**: specs-execution
**定位**: `specs-execution/dispatch-new.md §Step 4 known-risks 字段` + `specs-execution/deploy.md §边界场景`
**问题**: `dispatch-new.md` 对 hotfix 与 sprint 分支冲突的处理只有"标注冲突文件、由 develop 执行人协调"的文字提示，没有给出具体协调流程。`deploy.md` 说"解决冲突后再部署"但没说 hotfix 应在 sprint 合并之前还是之后部署，也没有说谁来主导冲突解决。
**影响**: sprint 进行中发生 hotfix 时，团队卡在"hotfix 先合并还是等 sprint 全部 merged"的决策上，若规范不一致可能把半成品 sprint 代码带上生产。
**建议**: 在 `dispatch-new.md §Step 5` 和 `deploy.md §hotfix 快速通道` 明确策略：hotfix 始终从最新 master 切分支、完成后直接合并回 master；与 hotfix 有文件重叠的 sprint 分支需在 hotfix 合并后 rebase 到最新 master。

---

### generate-integration-tests 无防幻觉机制，测试脚本测的是"CC 理解的场景"
**严重程度**: P1
**所在层**: specs-execution
**定位**: `specs-execution/draft-tech-design.md §Step 6（预生成）`、`specs-execution/generate-integration-tests.md §Step 3`
**问题**: subagent 生成 `.http` 脚本时只接收 TRD 接口设计和 PRD AC 文本，若 TRD 与实际实现有偏差（快速直修后常见），测试脚本会用错误的 URL/字段请求。规范 Step 2 的"脚本对齐核查"只读 PR description 里的"偏离说明"，但快速通道条件之一正是"原因显而易见"，开发者不写偏离说明。
**影响**: 集成测试通过但测的是幻觉场景，进入 manual-test 时用户才发现，修复成本高；若用户 manual-test 经验不足，可能带着潜在 bug 直接签 G4 部署。
**建议**: Step 2 脚本对齐时对每个测试端点执行一次"探活"请求（返回任意状态码即可），路径 404 则立即标记"路径不可达，需修正"；快速直修完成后应在 `progress.md` 留一条偏离记录供 Step 2 读取。

---

### status.yml 写入无 schema 校验，格式错误静默污染数据源（多角色共同发现）
**严重程度**: P1
**所在层**: specs-execution / skeleton
**定位**: `skeleton/07-status-contract.md §五（写入协议）`；所有涉及 status.yml 写入的 exec spec（共 10 处）
**问题**: status.yml 是 hact-app 的唯一数据源，但所有写入步骤依赖 CC 每次都输出合法 YAML。规范有"写入纪律"但无写入后校验步骤：既无 yaml lint，也无 schema validate，更无要求 CC 读回确认。CC 在长会话上下文较重时特别容易在嵌套 YAML 缩进上出错，且写入错误随 git commit 一并推送，hact-app 下次 sync 直接 YAML.parse 失败，没有回滚机制。
**影响**: hact-app 数据异常、看板显示错乱，回溯需要手动 git revert 并重新修复 status.yml，代价高且容易遗漏。
**建议**: 每次 CC 写入 `status.yml` 后，强制执行 yaml 语法检查（如 `python -c "import yaml; yaml.safe_load(open('status.yml'))"`），检查失败则报告错误、不执行 `git add`。此步骤应写入 `07` 契约作为写入纪律，而非留给各 exec spec 自行决定。

---

### AI 联调与人工验收边界不清晰，存在责任替代风险
**严重程度**: P1
**所在层**: specs-structural / specs-execution
**定位**: `specs-structural/generate-integration-tests.md §完成判据`、`specs-execution/manual-test.md §Step 2`
**问题**: generate-integration-tests 三条完成判据实质上构成"联调通过证明"，manual-test 前置检查直接读取这三条结论作为准入条件。若 CC 对失败场景的级别判定偏宽松（本应 `[阻断]` 被判为 `[不阻断]`），manual-test 前置检查直接接受，隐性信任传递使用户倾向于轻量验收。规范没有要求人工验收覆盖 generate-integration-tests 已测场景。
**影响**: 联调幻觉场景漏过进入生产，bug 发现于用户反馈阶段，修复成本最高。
**建议**: manual-test Step 2 告知信息中附上联调结果摘要（测了哪些场景、哪些是 `[不阻断]`），引导用户特别关注联调中未覆盖或降级处理的场景；generate-integration-tests 完成判据增加"场景覆盖率自检"：每条 PRD AC 必须有至少一条对应测试场景。

---

### CC 不可用时缺乏系统性降级路径描述
**严重程度**: P1
**所在层**: 跨层（specs-execution 全部 task）
**定位**: 所有 `specs-execution/*.md` 文件；以 `deploy.md`、`generate-integration-tests.md` 为典型
**问题**: 所有 exec spec 假设 CC 会话可正常运行，没有任何 task type 包含"CC 不可用时的人工操作指引"。deploy 的整个步骤序列（本地构建→推送→SSH→重启→健康验证）完全依赖 CC 调用 SSH MCP 执行，没有对应的"手动部署步骤单"。
**影响**: 在 CC 不可用时（API 故障、token 超限、MCP 工具故障），团队没有任何文档指导如何手动完成当前卡住的 task，对 deploy 等时间敏感任务尤为危险。
**建议**: 对每个 exec spec 的"边界与异常"章节增加"CC 不可用时的人工处理路径"；对 deploy 应有独立的"手动部署清单"文档，不依赖 CC 会话。

---

### draft-tech-design 双源规范注入：notes 中的错误规范无有效过滤机制
**严重程度**: P1
**所在层**: specs-execution
**定位**: `specs-execution/draft-tech-design.md §Step 4（Standards 来源规则，双源补充部分）`
**问题**: Step 4 从执行人个人 notes 中取 `[规范]` 标签条目并入当期 standards，过滤机制仅有"对照公共模板/上期 standards 去重"，只能过滤已收录的同条目，无法过滤"新的但错误的规范"。并入过程是 CC 自行判断相关性，没有人工审阅步骤；唯一安全控制只处理冲突场景，不处理"没有已知冲突但内容有误"的场景。
**影响**: 错误规范被注入当期 standards，所有 develop 任务按该错误规范实现，pr-review 也以该规范为评判依据，错误可能在 manual-test 或生产才被发现。
**建议**: 从 notes 并入 standards 改为"建议清单"而非"直接并入"：Step 4 将 notes 来源条目单独列出作为"待评估条目"，在 Step 6（G2 签字确认）由用户逐条确认是否纳入，再写入最终 standards 文件。

---

### task.type 路由假设在多 discipline 持有者处失效（多角色共同发现）
**严重程度**: P1
**所在层**: skeleton / specs-execution 跨层
**定位**: `skeleton/01-identity.md §2 任务是路由键` + `skeleton/03-disciplines.md §各 discipline` + `BRIEF.md 决策#1`
**问题**: "任务驱动"模型要求每个会话只处理一类任务，但 `02-workspaces.md §5 心态切换 = 开新会话` 靠的是人的自律而非技术约束。当管理者（持有全部 9 个 discipline）独自推进早期阶段时，会在一个会话里做 PRD + TRD + sprint，CLAUDE.md 加载机制无法感知"这个会话现在应该服从哪份 spec"。
**影响**: 早期单人驱动阶段，task.type 路由假设根本无法落地——用户实际上仍在凭直觉和习惯行事，方法论规范约束形同虚设，进入团队阶段后才暴露。
**建议**: 增加会话初始化时的"当前 task 声明"硬性步骤，限制单会话内只能声明一个 task.type；或在 CLAUDE.md 跨会话接续规则中明确"已声明任务不得在同会话内切换"。

---

### Gate 签字权限与任务 discipline 的循环依赖（自我验证）
**严重程度**: P1
**所在层**: skeleton / specs-structural 跨层
**定位**: `skeleton/01-identity.md §3` + `skeleton/06-gates.md §1` + `BRIEF.md 决策#19`
**问题**: Gate 签字被合并入前置任务末尾，签字权 = 能拉该任务的用户，即任务完成者即签字者——同一用户既做 PRD 又签 G1，既做 TRD 又签 G2。文档没有任何条文要求签字者不能是任务持有者，也没有要求第三方参与签字。
**影响**: 5 个 Gate 在实践中变成 5 次格式化的自我宣告，无法提供质量把关价值，仅剩流程标记功能，却增加了格式成本。
**建议**: 明确规定 G1/G2/G4 的签字者必须与任务 taken-by 不是同一 user；或在早期单人阶段显式承认 Gate 是"里程碑标记"而非"独立审查门"，消除概念混淆。

---

### B 类恒定 2 会期约束是未经验证的假设
**严重程度**: P1
**所在层**: skeleton / specs-execution
**定位**: `BRIEF.md 决策#6` + `skeleton/06-gates.md §4` + `guide/00-核心概念.md §A 类 vs B 类`
**问题**: "B 类恒定 2 会期"这个约束在文档体系中只出现在 BRIEF.md 决策#6 和速查表中，没有推理或数据支撑。现实中 BUG 复杂度差异可达 10 倍量级以上，而 B 类 develop 任务本身有完整的 16 字段任务包、对抗审查、subagent 循环，跟 A 类 develop 几乎等量，"2 会期"就成了空标签。
**影响**: 团队遇到真实复杂 BUG 时要么违反约束产生认知混乱，要么滥用"升级 A 类"绕过流程，使 B 类实际上成为 A 类的简化入口而非独立路径。
**建议**: 去掉"恒定 2 会期"这个未定义概念，改为"B 类无 Gate、无 PRD，但会期数量由任务包的 AC 复杂度决定"，并明确什么算一个会期的边界。

---

### merged 终态不变量与多迭代并行修订的认知混乱
**严重程度**: P1
**所在层**: skeleton / specs-structural 跨层
**定位**: `skeleton/05-state-machine.md §2 关键不变量` + `skeleton/06-gates.md §6` + `specs-structural/revise-doc.md §完成判据`
**问题**: 多迭代并行下，v1 TRD 已 merged，v2 启动后引用 v1 TRD；此时若 v1 跑 `revise-doc(target=trd)` 修改了 trd.md，修订版和原版都是 merged 状态，哪个是权威版本只能通过读 backlog 手动追溯。status.yml 无法表达文档修订历史，这与"status.yml 是机器侧唯一数据源"原则形成矛盾。
**影响**: hact-app 拿到的永远是 git 当前版本，无从知晓文档经历了多少次 revise-doc，管理者基于看板做的判断可能基于过期信息。
**建议**: 在 `status.yml` 中增加 `documents` 块记录每份关键文档的版本号和最近修订时间；或在 revise-doc 完成时给文档文件头追加版本戳，让机器可识别当前是第几次修订版。

---

### 拉取池假设开发者有足够冷启动上下文
**严重程度**: P1
**所在层**: skeleton / specs-execution
**定位**: `skeleton/04-task-catalog.md §develop` + `specs-execution/develop.md §精确加载上下文` + `guide/00-核心概念.md §queue`
**问题**: 任务包字段（`reference`/`relevant-standards`/`known-risks`）要求精确到文件和行号，是由 `plan-sprint` 时的 CC 会话写入的。写包人（架构师/dispatch 角色）和拿包人（开发者）可能不共享同一会话上下文。`develop.md` 的"精确加载上下文"只规范了 CC 的行为，没有规定人工开发者如何补充上下文，也没有"任务包上下文不足时应如何上报"的人工路径。
**影响**: 团队引入阶段（第五阶段），新开发者面对 CC 或管理者写成的任务包，若 `reference` 引用了他们不熟悉的模块，没有独立探索上下文的规范路径。
**建议**: 在 dispatch `plan-sprint` 阶段增加"任务包可读性测试"——让一个不参与 TRD 写作的 user 试读任务包确认无歧义再入 queue；或在任务包增加 `prerequisites` 字段说明前置知识要求，让开发者在认领前做自我评估。

---

### 设计决策#23 与决策#20 的根本性矛盾
**严重程度**: P1
**所在层**: 跨层（BRIEF.md 决策层 + specs-execution/draft-tech-design）
**定位**: `BRIEF.md 决策#20` vs `BRIEF.md 决策#23` + `specs-execution/draft-tech-design.md §Step 4`
**问题**: 决策#20 允许 management 直接做方法论类发散性工作；决策#23 规定 `draft-tech-design` 双源生成 standards 时并入执行人本人 notes 的 `[规范]`，适用前提是"执行人≈真实开发者"。当管理者（非技术背景）以 management discipline 运行 `draft-tech-design` 时，其 notes 里可能没有实际编码经验来的规范，"适用前提"是条件句而非前置检查，CC 不会验证，会静默做一次空合并继续。
**影响**: 管理者主导时 standards 双源机制完全无提升效果；更糟糕的是，若管理者 notes 有旧项目规范条目，被并入后污染新项目编码约束。
**建议**: 在 `draft-tech-design` 会话启动时增加前置检查：若执行人的主 discipline 是 management（非 architecture/dev-*）则跳过双源合并步骤并明确告知用户。

---

## P2 — 摩擦点

### CLAUDE.md Step 1 状态推断在多迭代并行和 B 类任务混合时存在盲区
**严重程度**: P2
**所在层**: templates
**定位**: `templates/CLAUDE.md §Step 1 推断当前任务类型`
**问题**: Step 1 推断表覆盖了 7 种情形，但以下情形没被覆盖：（1）既有 A 类 sprint 任务进行，又有 B 类任务在 `b-queue/` 中 `[可取]`，没有规则告诉 CC 如何建议 B 类任务；（2）多迭代并行时推断逻辑只读最新迭代，不会主动提示 v2 任务池；（3）`sprint.md` 不存在（G1/G2 阶段）时推断表没有对应行，CC 行为未定义。
**影响**: 开发者重开会话时 CC 给出的状态摘要可能漏掉 B 类待办，或在多迭代并行时只报告一个迭代状态，导致任务被遗忘。
**建议**: 在 Step 1 状态读取逻辑中增加：读取 `b-tasks.md` 找 `[可取]` 的 B 类任务并列出；多迭代时额外扫描所有存在 `queue/` 目录的迭代版本；推断表增加"sprint.md 不存在 + G1 未签"行，推断结果为"项目初始化阶段，下一步 draft-prd-vN"。

---

### develop 全流程：多人公用一台机器时任务归属推断错误
**严重程度**: P2
**所在层**: skeleton / specs-execution
**定位**: `skeleton/01-identity.md §4 跨会话身份连续性` + `specs-execution/develop.md §拾取任务`
**问题**: `01-identity.md §4` 说"CC 启动协议靠 `git config user.name` 推断当前操作者"，`develop.md` 在认领 commit 里写 `[taken-by: {user}]` 取自这个推断。但文档没有回答：两名开发者在同一台开发机共用 git config 时，认领 commit 的署名会相同，导致 hact-app 上任务归属混乱。
**影响**: 任务归属在 hact-app 和 status.yml 中被错误记录，跨会话接续时 CC 会推荐错误的任务（把同机器其他人的任务当成当前用户的）。
**建议**: 在 `develop.md §会话启动` 增加：当 git config user.name 不能唯一标识当前开发者时（如共用机器），在"第零步"让用户明确声明 Gitee username，由 CC 将 `{user}` 赋值为该声明值。

---

### B 类任务就地分流的目标路径依赖 hact-notes 仓已存在且已配置
**严重程度**: P2
**所在层**: specs-execution
**定位**: `specs-execution/develop.md §Step 10 feedback 检查 / 就地分流`
**问题**: `develop.md §Step 10` 规定 B 类任务发现值得沉淀的内容时"当场誊入个人 notes（`../hact-notes-{name}/notes.md`）"，但没有说明：如果当前开发者的 hact-notes 仓尚未创建（新成员在 `init-project` 之后才加入），应该怎么办。`templates/CLAUDE.md §Step 0` 的 git pull 命令加了"不存在则跳过"的注释，但 Step 10 里没有对应的降级说明。
**影响**: 新加入团队的开发者做第一个 B 类任务时，到 Step 10 会发现 notes 仓不存在，规范没有告诉他是跳过、手动创建，还是把内容暂存某处。
**建议**: 在 `develop.md §Step 10 B 类就地分流` 增加：若 `../hact-notes-{name}/` 目录不存在，提示"请通知管理者在 init-project Step 4.5 或 hact-config.md 中登记 notes 仓后再写入；当前条目可暂存在任务包 `feedback` 字段中"。

---

### Context Compact 发生时 progress.md 写入窗口不原子性，存在状态丢失风险
**严重程度**: P2
**所在层**: specs-execution
**定位**: `specs-execution/draft-tech-design.md §上下文管理`；`specs-execution/develop.md §上下文重置协议`；`specs-execution/plan-sprint.md §上下文管理`
**问题**: 多个高密度 exec spec 在 compact 前要求 CC 将关键状态写入 `_meta/sessions/{task}-progress.md`，但 compact 触发时机是上下文"过重时"——可能在 progress.md 写入途中发生，或写完后还没 commit 就 compact 了。规范当前描述是"compact 前确认：已写入"，但没有强制要求 git commit 先于 compact。
**影响**: 在 develop 的"上下文重置协议"中，若 context-state 写入不完整，接手会话可能找不到已完成的文件，重复实现部分模块，与已有代码产生冲突。
**建议**: compact 前的写入步骤强制包含验证子步骤：写入 progress.md 后立即读回输出摘要（证明文件已完整落盘），然后执行 git commit 持久化，最后再执行 compact。

---

### B 类 dispatch-new 的 schema-change 检测逻辑依赖执行人诚实填写
**严重程度**: P2
**所在层**: specs-execution
**定位**: `specs-execution/dispatch-new.md §Step 4（schema-change 字段）`；`workflows/README.md §Phase 1`
**问题**: `dispatch-new.md §Step 4` 要求写入 `schema-change: true/false`，判断完全依赖 dispatch 执行人正确评估。若漏标为 false（"只是加了可选字段，不算"），DW 会继续执行，在 agent-fix 阶段修改了接口，对抗审查也不会专门检测 schema 变更，带着接口改动的 PR 被自动 push。
**影响**: 接口变更绕过人工确认，可能导致前后端接口不兼容，在多迭代并行场景下尤其危险（v1 前端还在用旧接口时）。
**建议**: DW 的 Phase 2（agent-fix 完成后）增加独立的 schema-diff 检查：对比任务包 `files` 字段中 controller/DTO/entity 文件的 git diff，若接口路径或请求/响应字段有任何变动，立即升级给人暂停 DW，不论 `schema-change` 字段标记如何。

---

### Gates.md 与 status.yml 双写存在不一致风险
**严重程度**: P2
**所在层**: specs-execution / skeleton
**定位**: `specs-execution/draft-prd-vN.md §Step 8`；`specs-execution/draft-tech-design.md §Step 6`；同类 Gate 签字步骤（共 5 处）
**问题**: 每次签 Gate 需要同时更新 `gates.md`（人看的文档视图）和 `status.yml`（机器侧数据源）。若 CC 在写 gates.md 后上下文被截断，接续会话读 gates.md 发现 G1 已签（exec spec 前置检查读 gates.md），但 status.yml 中 G1 仍为 false，两个视图长期不一致且无人主动修复。
**影响**: hact-app 看板显示与实际进度不符，管理者基于看板做的判断（如"G2 还没签，不能 dispatch"）可能是错误的，导致流程卡顿或被错误放行。
**建议**: 在 `templates/CLAUDE.md §Step 1` 中增加：对比 status.yml 的 gates 状态与 gates.md 的 `[x]` 标记，如有不一致立即报告并要求人工确认修复，再进入推断逻辑。此检查应常态化。

---

### harvest-notes 的"去重择优"完全依赖 CC 主观判断，无量化标准
**严重程度**: P2
**所在层**: specs-execution
**定位**: `specs-execution/harvest-notes.md §第二步（去重择优）`
**问题**: 去重择优的判断标准只有四种定性描述，"单人、通用、有价值"这个判断完全是 CC 对规范条目"通用性"的主观评估。规范中虽有"采纳清单较多时先让管理者过目"的 🚫 阻断，但"较多"没有定义数量，CC 可能在条目不多时直接写入不经过目。
**影响**: 公共层（templates/standards）被注入低质量或错误的规范条目，污染全团队开发标准，追溯来源需要 git blame 对比 hact-config 游标，不直观。
**建议**: 明确"较多"的阈值（例如超过 3 条新条目即必须让管理者过目）；采纳清单中每条条目标注来源成员和原始措辞，使管理者审阅时有原始上下文。

---

### wrap-up-iteration 的 feedback 分流路径形成知识孤岛（死锁）
**严重程度**: P2
**所在层**: specs-execution
**定位**: `specs-execution/wrap-up-iteration.md §第二步 feedback 审阅分流` + `specs-execution/develop.md §Step 10` + `BRIEF.md 决策#21`
**问题**: wrap-up 第二步说"誊入执行人 notes"，但 wrap-up 的执行人是 management discipline 用户，可能与产生 feedback 的 develop 执行人完全不同。决策#21 规定只有本人可写个人 notes，management 执行 wrap-up 时无法写别人的私有 notes 仓，会导致 feedback 堆积在 `feedback.md` 无法分流，或被跳过清空使知识永久丢失。
**影响**: 团队分化后，wrap-up 第二步"誊入执行人 notes"变成死锁：management 既无法写别人的 notes，也无法确定该写进哪个成员的 notes。
**建议**: 修改 wrap-up 第二步，将 feedback 条目保留在 `feedback.md` 中并标注"来源成员"（taken-by 字段），由各成员在 wrap-up 后各自认领属于自己的条目誊入 notes；feedback 格式中需增加来源归属字段。

---

### 方法论自举悖论：hact-method 用 hact-method 开发 hact-app，缺乏同步协调机制
**严重程度**: P2
**所在层**: 跨层（BRIEF.md 阶段划分 + STATUS.md + 设计原则）
**定位**: `BRIEF.md §阶段划分 第三阶段` + `STATUS.md §已知风险` + `skeleton/README.md §第一阶段完成标志`
**问题**: hact-app 的 TRD 数据模型已反映 `skeleton/07-status-contract.md` 契约。若 status.yml schema 需要修改（如增加文档修订版本号字段），既需要改方法论文档，又需要改 hact-app 数据库迁移和 API，两个仓库的变更需要同步，但文档中对这个同步问题没有任何记录。
**影响**: 随着 hact-app 功能增加，方法论与工具之间的同步成本线性增长；设计者可能倾向于修改方法论来适应已实现的工具，而非相反。
**建议**: 建立 hact-method 变更与 hact-app 变更之间的依赖追踪机制（在 decisions.md 里标注哪些决策直接影响 hact-app schema），并在方法论修改时明确标识"需要 hact-app 同步修改"。

---

### BRIEF.md 决策#12 与决策#15 叠加导致 CC 启动推断能力不足
**严重程度**: P2
**所在层**: skeleton / specs-execution 跨层
**定位**: `BRIEF.md 决策#12 CC 启动协议状态推断` vs `BRIEF.md 决策#15 任务范围扩到全流程`
**问题**: 决策#15 扩大了任务范围（任务越来越多），但决策#12 要求 CC 从文件状态推断子阶段而不加显式标记。项目仓的 CC 启动只能靠人工声明当前任务，status.yml 虽有状态但 CC 不主动读它；queue 文件有任务包但需要开发者知道该去哪里找。
**影响**: 在团队引入阶段，开发者每次开启项目仓 CC 会话时，没有可靠的"上次在做什么"的自动恢复机制，"从断点续做"完全依赖开发者记住自己的 task-id。
**建议**: 在项目仓 CLAUDE.md 中增加跨会话接续规则，明确规定会话启动时读 status.yml 的 taken-by 状态来推断当前操作者的进行中任务，而不是依赖人工声明。

---

### 软锁机制在异步代码审查场景的语义空洞
**严重程度**: P2
**所在层**: skeleton / specs-structural
**定位**: `skeleton/05-state-machine.md §2 + §3` + `specs-structural/develop.md §完成判据`
**问题**: `develop` 任务的 `done` 状态定义为"持有者宣告完工（PR 已推）"，PR 被打回时任务仍处于 `done` 状态，但开发工作尚未完成——`done` 的语义被破坏了。被打回的任务对外部观察者仍显示为 `done`，无法判断"这个任务到底完了没有"。
**影响**: hact-app 看板按 `done` 任务数统计 sprint 完成率时，被打回的 PR 被错误计入已完成，导致进度虚假。
**建议**: 引入 `in-review` 子状态（或在 done 状态添加 `under_review: true/false` 字段），以区分"正在 CR"和"CR 打回修复中"，使看板状态语义清晰。

---

## P3 — 优化建议

### hotfix 认领 commit 应立即单独 push，不等首次代码 commit
**严重程度**: P3
**所在层**: specs-execution
**定位**: `specs-execution/develop.md §拾取任务` + `specs-execution/dispatch-new.md §Step 6`
**问题**: `develop.md` 规定认领 commit 随首次代码 commit 一起推送。但 `dispatch-new.md §Step 6` 在写完任务包后立即 `git push origin master`（status.yml 状态已记录为 `[可取]`），`urgency=hotfix` 的开发者认领后的状态变更 `[taken-by]` 要等到"首次代码 commit 一起推"才能到 master，中间可能有数小时，hact-app 看板显示任务"待认领"而实际已有人在做。
**影响**: 团队看板出现虚假"待认领"状态，可能导致另一名开发者也去认领同一个 hotfix 任务，浪费时间。
**建议**: 对 hotfix 任务，在 `develop.md §拾取任务` 增加特殊说明：`urgency=hotfix` 时，认领 commit 应立即单独 push，与普通任务的"随代码一起 push"策略区分开。

---

### B 类任务 feedback 就地分流依赖 CC 识别"值得沉淀的发现"，无捕获率保证（多角色共同发现）
**严重程度**: P3
**所在层**: specs-execution
**定位**: `specs-execution/develop.md §Step 10（B 类就地分流）`
**问题**: B 类任务完成后，Step 10 要求 CC 识别"遇到 standards 未覆盖的决策"等值得沉淀的发现，这一步是可选的，完全依赖 CC 主动识别。CC 在长会话末尾（上下文已较重）的反思质量较低，最有价值的实现过程发现往往在 Step 4 代码实现时被处理过去，到 Step 10 时已"记忆模糊"，产生较高的漏记率。
**影响**: B 类任务是日常运行中最频繁的任务类型，踩坑经验积累效率直接影响团队学习曲线，漏记率高意味着团队经验沉淀缓慢。
**建议**: Step 4 代码实现时增加"即时记录钩子"：每当 CC 遇到 standards 未覆盖的决策时，立即在 `progress.md` 追加一条"待沉淀"标注，Step 10 只需读 `progress.md` 中的"待沉淀"列表归类写入 notes，不再依赖回忆。

---

## 跨层一致性问题

以下各条均为骨架层（skeleton/）定义与执行层（specs-execution/）描述之间存在的矛盾，逐条列出：

1. **`depends-on` 字段的骨架-执行层脱节**：`skeleton/07-status-contract.md` 的 `tasks[]` 契约中有 `depends_on: []` 字段，但 `specs-structural/develop.md §字段规范` 的任务包 16 字段表里没有 `depends-on`，也没有在 `specs-execution/develop.md §拾取任务` 中补充说明。结果是骨架层定义了此字段，但执行层完全没有使用路径，开发者无从在任务包中填写。

2. **软锁机制覆盖范围的骨架-执行层矛盾**：`skeleton/05-state-machine.md §3` 将软锁定义为"只保护拾取动作，冲突时后到者重选任务"；而 `specs-execution/develop.md §Step 8` 要求写入 status.yml 状态更新——这是拾取之外的第二类写入行为，骨架层对此类写入冲突的处理只字未提，执行层亦未补充，形成空白地带。

3. **Gate 签字的骨架定义 vs 执行层实现的语义漂移**：`skeleton/06-gates.md §1` 将 Gate 定义为"阶段性的独立确认节点"；但 `specs-execution/draft-prd-vN.md §Step 8`、`specs-execution/draft-tech-design.md §Step 6` 等执行层的 Gate 签字步骤是在同一任务末尾由同一执行人完成的，"独立确认"这个语义在执行层退化为"自我宣告"，骨架层与执行层的 Gate 价值定义不一致。

4. **`done` 状态语义的骨架-执行层矛盾**：`skeleton/05-state-machine.md §5 跨任务状态联动` 规定"pr-review 打回 → 关联的 develop 仍 status=done"，但 `specs-structural/develop.md §完成判据` 将 `done` 定义为"持有者宣告完工"——"PR 被打回"与"完工"在语义上明显矛盾，骨架层的状态流转规则与结构层的完成判据定义相互冲突。

5. **merged 终态不变量 vs revise-doc 的版本追踪盲区**：`skeleton/05-state-machine.md §2` 规定 `merged` 是终态；但 `specs-execution/revise-doc.md` 完成后的产物也被标记为 `merged`，导致同一文档的"原版 merged"与"修订版 merged"并存，无法通过 status.yml 区分哪个是当前权威版本。骨架层的不变量约束在多次修订场景下产生版本追踪真空，执行层没有补充解决方案。

6. **B 类"恒定 2 会期"的骨架声明与执行层实际操作量不匹配**：`BRIEF.md 决策#6`（骨架设计层）和 `skeleton/06-gates.md §4` 声明"B 类恒定 2 会期"；但 `specs-execution/develop.md` 的 B 类任务执行路径（16 字段任务包 + 对抗审查 subagent + context 重置协议）与 A 类 develop 执行量几乎等量，"2 会期"约束在执行层没有任何机制保证，形成骨架约定与执行实现的空洞矛盾。

7. **双源规范的骨架适用前提未转化为执行层前置检查**：`BRIEF.md 决策#23`（骨架设计层）明确标注"适用前提：当前架构与开发高度重叠，执行人≈真实开发者"；但 `specs-execution/draft-tech-design.md §Step 4` 的双源并入步骤是无条件执行的，骨架层的适用前提条件未在执行层转化为任何前置检查或跳过逻辑。
