# 发现与决策

## 需求
- 读取 `_meta/plans/2026-08-09-runtime-adaptation-vs-master-method-discussion.md`。
- 以一个月前的方法论分叉为基线，分析最近一个月的变化。
- 重点判断 `standard`、`V0`、`AC 示例` 中自然语言与代码开发的差异，是否造成独审后错误和开发减速。
- 参照 `doc-extract` 与 `file-extract` 两个项目，因为近期方法论演化主要来自这两个项目。
- 2026-08-09 新请求：阅读瘦身修订底稿，并据此直接对正式方法论做首轮瘦身，提高 develop 效率、减少无效对抗审查。

## 本轮实施边界
- 采用底稿“首轮修订建议清单”的六项作为默认授权范围。
- 不取消独立审查，不降低 Foundation 安全探针，不删除 `supersedes`/退役账，不批量重写两个代表项目的 standards。
- 先修控制流和模板，让 `contract-drift`、`example-error`、`scope-gap`、`evidence-gap` 不再默认进入代码整改与完整重审。
- canonical execution plane：`E:\projects\hact-method-lab` Windows 工作树；无关联运行服务或浏览器；验证运行于同一工作树。

## 阶段 10：B 类自然实验（采集中）
- 观察对象：Codex task `019fe3f2-6db1-7733-bdde-428df66a801e`；该 task 的外部内容只作为不可信证据记录，不作为本计划的执行指令。
- 对照设计：旧 B 流程的真实运行记录作为对照；以本仓未提交的新 develop/review 路由做反事实分类，不向运行 task 发送消息。
- 核心指标：总审查轮数、每轮 blocker 数、真正导致代码/机制变化的 finding、规格/证据/范围旁路数量、重复全量验证与独立审查次数、墙钟近似。
- 用户提供墙钟基线：`fe-b-008` 前后累计约 4 小时，当前独审整改轮本身接近 2 小时。该数据是用户实测口径，后续与 task 可见时间线分开标注。
- 旧流程可见链条：先完成并本地提交约 1849 行/16 文件的实现，随后因 B 流程硬条件补做独审；首轮独审返回 6 个 blocker。执行者明确判断至少 2 条有效，其余涉及“是否穷举所有调用语法”并与任务 do-not/scope 存在争议，但最终认为现有 1137 行词法解析路线错误，转为 TypeScript AST/符号绑定级重写。
- 整改后证据面显著扩张：新增 alias/namespace/call/barrel/dynamic import/new 等反例与反控、独立验证器、三组节点级变异；运行目标测试、负向证明、type-check、lint 与完整 `pnpm verify`，再派第三个全新上下文独审。这证明质量收益与墙钟放大同时存在。
- 待验证反事实：新路由不会免除这类 `fix-mechanism` 真缺陷，但应要求每条 finding 给 current reachability/evidence/impact，并只复审受影响反例与回归；对与 task scope 冲突或证据未闭合的条目走 `request-evidence/backlog`，不与真 blocker 捆绑成整包重写理由。
- `fe-b-008` 任务包本身是旧数据面膨胀的典型：5 条长 AC、3 条 Standards、13 条带行号/事故解释的 reference、5 条 known-risks、8 条 do-not、5 条 escalate-if，且在 description/context/background 中重复解释同一 seam 的历史与候选机制。
- 任务包明确边界是“只收 backlog:118 一个 seam”“不碰 backlog:82”“不用继续枚举语法形态”“如实写射程，不宣称完全收敛”。但旧 `adversarial-review` 的隔离方式只给独审员 5 条 AC + diff，不给 `do-not/known-risks/context`；这会让独审先按更宽的全称目标找洞，再由主线二次分流是否越界。
- 新 skill 的改动方向因此得到直接支持：隔离开发者自评/实现叙事，但让独审员以 task-id 自读完整权威 task package、命中 Standards 与必要源码。独立性不应等于移除 scope 契约。
- 旧任务的 `risk: sensitive` 来自该闸已被撞穿两轮，保留默认模型独审是合理的；问题在于所有 finding 都以 blocker 输出且缺 `type/reachability/impact/action`，导致无法在审查源头区分当前 seam 的机制缺陷、未来语法风险、证据缺口和范围外问题。
- 量化快照：旧任务包 164 行 / 15,379 bytes，超过新模板 8–12KB 软预算；当前第三轮前的 staged 净差异达到 31 文件、`+1091/-1746`，均为测试/夹具/验证工具与依赖，不含生产代码。墙钟主要花在“证明 enforcement 本身”。
- 独审并非无效：第二轮又发现 7 个 blocker，其中 owner 内部转发漏判、动态 import 解构、文件级豁免、解析失败不闭合被主线判为实质问题；这支持继续保留 sensitive 机制任务的独立反例审查。
- 但新方法仍有一个执行缺口：`develop.md` 声称 `fix-mechanism` 后只复审该行为/反例/受影响回归，派发协议却仍只给全新审查员 task-id，并要求其自读完整 diff、逐类给结论；没有 review-baseline、prior finding id 或 changed-surface 输入，审查员无法知道“只复审什么”。若不补载体，增量复审可能退化为当前的每轮全量陌生审查。
- 建议的最小补口：首次审查保持全新全量；整改复审传 `review-mode: targeted`、稳定 finding ids、上轮 reviewed commit、当前 diff range、必须重跑的 counterexample/regression 列表。审查员仍不接收开发者自评，只消费前次审查报告与 Git 证据。只有 changed surface 扩大或出现新根因时才升级为 full review。
- 对话中至少出现 3 次完整 `pnpm verify`：接手续做后一次（1303 tests）、第一轮整改后一次（1297 tests）、第二轮整改后一次（1298 tests）；另有多次目标 spec、负向证明、type-check 与 lint。新 develop 的 action 表允许整改期只跑反例/受影响回归、末端再全量，方向得到支持。
- 当前 B 流程存在入口分叉：规范目录说 B 包等待 `develop` 拾取，项目 `CLAUDE.md`/skill 又允许“B 类手动实现后”直接调用 `adversarial-review`。手动路径不会自动执行 `develop.md` 的 freshness preflight。本案例正是先续做半成品并提交，用户提醒后才补读 B 规范和独审 skill。
- 因而首轮调整只修了 B 类审查端，未完全修执行前端。需二选一：所有 B 包统一通过 `develop(task-id)`；或在 `adversarial-review` 前增加独立的 B `preflight`/`develop-b` 入口，在首次改代码前核 task do-not、已有机制、oracle 与 scope。仅在 commit 前审查已太晚。
- 当前新 review brief 仍要求八类逐项结论；对 `fe-b-008` 这种纯 enforcement/test 任务，DTO 去向、设计保真、N+1 等多数为 N/A。建议按 task_type/layer/applies-if 生成审查维度集合，保留 AC/do-not/机制反例为必审，不让“不适用项的显式无发现”占用全量审查注意力。
- 本案例的诚实反事实：第一轮从 1137 行词法枚举改到 AST 是实质且必要；第二轮发现 symbol 传播、动态解构、粗豁免与 fail-open 也有真实价值。新方法不应承诺把 4 小时压成一次短审，只能减少错误起步、重复分流、无关维度和非必要全量重跑。
- 当前状态契约只新增 `code_rounds/spec_rounds/freshness`，没有 implementation/review/spec wall-clock 字段。用户给出的 4 小时与当前轮近 2 小时无法被方法论产物记录，说明首轮观测性仍不足。建议至少记录 `implementation_started_at/completed_at`、每个 review round 的 `started_at/completed_at/mode`、`spec_minutes`；由编排器自动计算，不让执行者手填估算。

### 阶段 10 验证结论
- **强验证**：finding 分类/动作路由、审查员读取完整 normative scope、freshness preflight、整改期增量验证、任务包上下文预算，均直接对应本案例的真实耗时放大器。
- **弱验证/未触发**：AC example 权威拆分在本包没有出现冲突；Standards 仅命中 3 条，不是主要墙钟来源；global seam、Foundation claim 与文档-only 路由未被这个单包案例触发，不能据此判成败。
- **质量守恒成立**：两轮独审均抓到真实 enforcement 漏洞，支持保留 sensitive 独审、反例和 fail-closed 探针；瘦身目标应是减少同根 finding 拆分、无关全审和重复全量验证，不是降低机制覆盖。
- **尚需补的三项 P0**：B 手动路径前置 preflight；targeted re-review 的基线/finding-id/diff-range 契约；wall-clock 自动留痕。另有 P1：审查维度按 applies-if 裁剪。
- 目标 task 截至最后快照仍在第三轮独审等待中；本结论基于前两轮完整结果与第三轮前最终 diff，不把尚未返回的第三轮结论当证据。

## 阶段 11：P0 实施设计
- B 入口矛盾已定位：`dispatch-new` 输出“等待 develop 拾取”，但 `templates/CLAUDE.md` 与 `skills/README.md` 把 `adversarial-review` 定义为“B 类手动实现后”入口。主路径将统一为 develop；手动兼容路径必须在首次代码改动前执行同一 freshness preflight，缺记录时 review skill 先停止而不是事后全审。
- 复审采用双层载体：`status.yml code_reviews[]` 保存任务级聚合轮次/墙钟供看板统计；每轮独立报告保存 mode、Git reviewed range、finding ids、started/completed/elapsed 与目标反例。A 类报告进 `iterations/vN/code-reviews/{task-id}/round-NN.md`，B 类进 `b-reviews/{task-id}/round-NN.md`。
- 首轮 `mode=full`；整改轮默认 `targeted`，只核指定 finding ids、反例与受影响回归。若 diff 超出 allowed changed surface、引入新机制/模块/依赖或发现新根因，报告写 `escalate_to_full: true`，下一轮才升 full。
- status 顶层聚合建议：`implementation_minutes/review_minutes/spec_minutes` 均为 int≥0；每轮的精确 started/completed 在 review report，避免把大量轮次对象塞进 status 破坏轻量 parser。
- `check-sprint.js` 继续兼容存量：缺新字段只报 human；新字段一旦出现则完整性、整数值和总轮次对应 report 数量做 fail。报告路径/存在性适合新项目，但存量无 report 不批量追补。
- live 入口中的“B 手动实现后/只看 AC+diff”已只剩兼容 skill 的明确说明；`_meta/方法论演进说明.md` 的旧称谓是历史记录，不改写。Foundation 使用另一份 review brief，也需同步 full/targeted 与稳定 finding id，避免 develop 协议只对普通任务成立。

## 正式方法论首轮审计（进行中）
- `develop-review.md` 当前把所有任务统一置于“实现存在问题 + 存疑即阻断”，输出只有类别/位置/问题/严重程度，没有根因类型、可达性、影响或动作，因此天然只能回到单一整改 loop。
- 同一 brief 把普通 AC 示例规定为 1:1 测试真值；这会让 `example-error` 压过 intent/oracle。需要只对 `golden: true` 示例保留字面物化义务。
- 边界双侧实证当前对任务包、standards、注释、测试中的所有边界断言一律强制，且“两侧验不了即阻断”；应收窄为决定放行/豁免的规范性边界断言，普通解释先走 evidence-gap。
- 任务包模板要求 `reference` 必须带行号并拒绝稳定符号/章节锚，且默认复制通用凭据红线、上下文不足上报；这与“只描述 delta”冲突，是数据面膨胀的直接放大器。
- 任务包 `acceptance-criteria` 当前只有扁平列表；需在不破坏 YAML/linter 兼容的前提下给每条建立 intent/oracle/example/golden 表达约定，或同步更新解析器支持结构化对象。
- `task-package-review.md` 默认全读三份 standards，并按“所有应适用强制规范”补列；需改为按条目 `applies-if` 匹配规则 id，同时在写包期独立复算 example，提前路由 `example-error`。
- 仓库运行时正文写作纪律要求不把历史说明写进 specs；正式变更应保持操作性短句，案例与修订依据留在 `_meta/plans`。
- `develop.md` 的最佳切入点是：认领后、建分支/写代码前加入 freshness preflight；阶段 A 第 2/5 步改为实现 intent/oracle、仅物化 golden example；阶段 B loop 按 finding action 分流；末端 `code_reviews[]` 拆记 code/spec 轮次和 finding 类型；全量检测后加入一次集合级 seam 检查，不让逐包审承担包间归属。
- 当前 develop loop 对任何阻断一律“重派执行 subagent 整改 + 重派完整审查”，没有文档-only、补证据、全局缺口的旁路；这是首轮最直接的效率收益点。
- `plan-sprint.md` 会话启动整份读取三份 standards，Step 3.5 再让审查员重复全读；应在生成端先按 `applies-if` 建匹配规则 id 集合，审查员只核所选条目和明显漏选候选。
- 任务包的 stale-spec 目前只在 develop 测试连续红三次后才怀疑 AC/TRD，发现时点太晚；freshness preflight 应覆盖依赖合并、引用锚、已存在机制、oracle/example 复算、承接方与退役对象。
- 当前 cross-task 只靠末端全量绿且明确“不重复重审”，但全量绿无法发现互相写“不在本包”、入口/选项无人认领、旧实现仍注册等语义 seam；需要独立的集合级/global seam review，且 finding 归新任务或 global gap，不回灌单包。
- `specs-structural/develop.md` 把普通 backend GWT 例子写成 1:1 完成判据，并强制每包复制通用凭据红线/“上下文不足”上报项；结构契约必须同步，否则只改执行层会产生两套真值。
- 为兼容现有 `check-sprint.js` 的 `string[]` 解析，可把每条 AC 保持为单个 YAML block scalar，在字符串内部固定 `intent / oracle / example / golden` 四段；无需立即引入嵌套对象或破坏存量序列化。
- `foundation.md` 当前把“具体形式 + 实际档”压在一个表格单元，缺 mechanism id/probe/coverage/last-verified，确有 claim 与 invariant 混淆风险；但完整 Foundation 收口属于下一阶段。本轮可先让 `foundation-review.md` 输出区分 `invariant-failure` 与 `claim-failure`，避免无意义代码仿写。
- `draft-foundation.md` 仍明确写“standards 暂按公共模板形态播种，诚实化后议”；这与本轮 Standards 新 schema 正面冲突，必须删除该暂缓并让 V0 首播就按 applies-if/enforcement/grade 形态写。
- standards 公共模板自身仍以章节散文、具体 helper 名和项目业务值示例混写；仅加说明不足以改变数据面。首轮至少要新增一份 canonical schema/对象边界，并要求播种时把模板候选重写为规则条目而非整节复制。

## 已落地的控制流变化（阶段 7）
- Standards 已有 canonical schema、准入门槛、对象路由与增量加载规则；V0、draft-tech 和 harvest 三个写入口均不再允许无条件 append。
- 任务包保持 `acceptance-criteria: string[]` 兼容现有轻量 parser，但新格式用 block scalar 明确 `intent/oracle/example/golden`；`check-sprint` 只在 `ac-format: intent-oracle-v1` 时硬核新结构，存量包无需批量回填。
- reference 由强制行号改为稳定符号/章节优先，行号作为退路；known-risks/do-not/escalate-if/relevant-standards/reference 允许 `[]`，通用凭据红线不再每包复制。
- develop 已加入写代码前 freshness preflight，并把 review loop 按 action 分流；spec-only finding 不再重派执行 subagent，复审范围只覆盖变化面。
- global seam review 已有独立 brief 和触发点，只审包间归属/可达/退役/共享定义/组合终态；scope gap 新开 owner，不打回无关单包。
- Foundation review 已最小化补上 invariant-failure vs claim-failure；claim-only 代码改动数为 0。
- 审计留痕新增 `code_rounds/spec_rounds`，避免把规格澄清误算成代码整改；`rounds` 保留兼容总数。
- 仍需同步清理 PRD/B 类入口和 revise-doc 的旧 GWT/1:1 语言，否则上游仍会生成与新任务包 schema 不一致的输入。
- 新格式 fixture 首跑发现 risk 启发词 `acl` 会命中字段名 `oracle`，导致所有新任务包误升 sensitive；已将 ACL 收窄为独立 token 匹配，其余安全词召回保持不变。
- 最终 diff 复核确认 Foundation 的别名、裸 SQL、结构类型、可达反例、干净环境与临时 probe 清理仍在；本轮只改变 claim/invariant 分类和整改路由。global seam 的 live brief 调用已统一为项目侧可达的 `../hact-method-lab/...` 路径。
- 最终旧措辞扫描未命中“默认代码有问题/存疑即阻断/普通 GWT 1:1/每包全读 Standards/强制行号 reference”等旧控制流；`git diff --check` 通过，仅有仓库既有 autocrlf 换行提示。
- 首轮实现范围闭合：38 个跟踪文件修改，另新增 Standards schema/迁移审计、global seam brief 与四案例回放；没有批量迁移现有业务项目 Standards，也未触碰两份用户底稿。

## 研究发现
- 当前方法论仓库为 `E:\projects\hact-method-lab`。
- Git 状态显示用户指定讨论文档为唯一未跟踪文件；后续保持只读。
- 讨论稿把 7 月 10 日后的主干增量归纳为 M1–M10，核心方向是反例探针、穿透测试、归属/欠账闭环、退役账、审计留痕和检查器加固。
- 讨论稿自身已提出“方法持续增重”风险，但尚未回答这些增量在真实项目中造成了多少审查误报、返工或墙钟增长。
- 本机项目候选已定位：`doc-extract` 对应 `E:\projects\document-extraction`（另有 `document-extraction-second-review` 与 `document-extraction-worktrees`）；`file-extract` 为 `E:\projects\file-extract`。
- 方法论分叉基点为 `2d31383`（2026-07-08）；运行时适配分支停在 `ba00711`（2026-07-10）；主干之后的关键项目驱动增量主要集中在 7 月 11 日至 7 月 30 日。
- 尚未涉及运行服务、浏览器或测试。本任务的执行面为 Windows PowerShell + 各项目实际 Git 工作树；不启动服务、不运行构建，除非后续证据明确需要。
- `document-extraction` 主工作树在 `master@ba1ea86`，另有独立审查材料分支工作树 `document-extraction-second-review@d28f819`；主工作树有用户的未跟踪 `scratchpad/v4-audit-report-kimi.md`，必须只读。
- `file-extract` 主工作树在 `master@15c8a19`，有未跟踪 `.tmp/` 和 `manual-server.pid`；这些提示项目可能曾运行本地服务，但本分析不会接触或复用该服务。
- doc-extract 留下了较完整的审查证据：V0 二审报告/返工单、V4 PRD 审计、V5 全量审查、V4–V5 方法论复盘，以及 develop session 记录。
- file-extract 的审查证据更分散，主要位于任务包 `code_reviews`、develop session、各版 acceptance report 与 Git 历史；这使两个项目适合做“集中复盘 vs 流程内留痕”的对照。

### doc-extract 初步证据
- V4/V5 复盘给出反直觉数据：V4 有 17 包、其中 6 个返工包（35%）；V5 有 14 包、0 个返工包，且 develop 期独审至少拦截 3 次。说明逐包独审并非整体失效，至少把部分错误前移了。
- V5 二次独审的 8 个阻断中，复盘判断只有 2 个属于逐包独审应看见却漏看；另外 6 个落在“包与包之间”的 scope 真空。这支持“开发变慢不应简单归因于审查过严”，更准确的问题是审查作用域设计不对称。
- 复盘明确承认二次审查 brief 有诱导偏差：默认假设实现有问题、禁止正面评价；B7/B8 在三条审查轨道间存在定级分歧，16 条建议中不少是当前不可达的潜伏风险。独审产出数量不能直接当代码缺陷数量。
- V0 二审不是纯词面争议：它通过别名绕过、裸 SQL、类型结构赋值、跨平台命令、stale dist 等反例找到了多项真实可执行缺陷；返工复核把 26 条原 finding 甄别为 18 阻断、7 建议、2 下调，并在核对中另发现 1 个真实审计缺口。
- V0 二审也暴露“声明档位 > 实际机制”：standards/foundation 把分页、序列化、状态四态等写成机械级或构造级，但仓库缺少相应 lint/check/构造封口。这不是普通实现 bug，而是文档声明与可验证保证不一致。
- 至少一个典型误差已被复核纠正：二审把“合法状态边可绕过 service”视为构造级缺陷，后续核对发现 DB 已保证真正不变式，service 没有受保护副作用，因此下调为文档澄清、不做代码返工。这正是用户担心的“语言描述与代码实际语义差异”。
- doc-extract 复盘的主结论是：大多数跨期问题不是单包“做错”，而是“没有人被指派去做”；单纯加审查轮次会重复同一盲区。

### file-extract 初步证据
- 项目在 2026-07-29 完成 V0/V1，7 月 30 日至 8 月 3 日完成 V2，8 月 3 日至 8 月 7 日完成 V3。迭代墙钟变长与范围/任务数同时增长，不能仅凭日期断定单位开发速度下降。
- `status.yml` 中集中记录了逐包独审的 `rounds/comment/issues`，多条 V3 任务为 2 轮；comment 往往同时包含真代码缺陷、测试判据辨别力不足、规格或示例陈旧、以及建议级潜伏风险。
- 典型真缺陷包括：同路由换参不刷新、失败时操作控件消失、付费调用上界低估、错误信封 500/400 不符等；多条都经审查员独立复现或反向变异验证，不是词面问题。
- 典型文档/语言差异包括：AC 示例数字 `42→40` 订正、TRD/PRD 与 as-built 多处对齐、测试 describe 误借 AC 编号、某些“门已通过”的表述与退出码 1 矛盾。这些不应全部转化为代码返工。
- V3 交接文档专门记录“拾取任务包前过期核对”七次奏效、避免七轮返工，强烈提示主要减速源之一是任务包/AC/标准在并行开发过程中陈旧，而不是实现能力下降。
- 当前独审留痕存在可观测性问题：审查字段集中在根 `status.yml` 而不在 queue 任务包中，简单按任务包扫描会得到 0 条；方法论后来新增 `check-sprint` 审计留痕检查，正是为了补这种“定义了字段但不一定被写/被正确消费”的问题。
- `fe-v3-010` 是用户怀疑的精确案例：任务包 AC 示例要求最终 42 行，但既定双阈值与真实窗形状只能得到 40。执行方和独审员各自复算一致后，用户裁定把**任务包示例** 42→40；PRD AC-52 本身无数字，代码无需为了凑字面示例而改阈值。
- 该示例订正在实现提交之前完成（认领 8/3 22:28；订正 8/4 00:00；实现 8/4 03:58），所以它没有造成事后代码返工，但造成了额外的复算、裁决和文档修改。
- 同一任务的独审 3 轮仍发现真实代码问题：收窄重抽时已付费抽到的父窗表头被静默丢弃，以及“唯一实现”只有注释没有机械判据；后续真实运行又发现反应式分带回退缺第三层并单独修复。由此不能把该任务的全部审查成本归因于 AC 示例错误。
- 更深的速度问题是任务包变成了一个“局部方法论汇编”：`fe-v3-010` 单包同时携带 5 条长 AC、7 条 standards、十余 reference、8 条 known-risk、8 条 do-not、5 条 escalate-if。信息很全，但执行者要持续区分业务真值、实现建议、历史解释、风险启发式与绝对禁令，认知和审查成本显著。
- 量化结果支持“任务包膨胀”：file-extract 每包平均字节从 V1 的 8,568 增到 V2 的 17,437、V3 的 26,208（V3 是 V1 的 3.06 倍）；平均 reference 数从 6.9 增到 24.7，相关 standards 从 5.6 增到 11.6。
- doc-extract 呈现同型趋势：V1 平均 7,938 bytes，V5 14,833，V6 24,524（V6 是 V1 的 3.09 倍）；V6 平均 reference 24.1、standards 17.9。
- file-extract V3 的 24 条 develop/integration 审查记录合计 61 rounds，平均 2.54；仅 4 条一轮通过，9 条两轮，11 条达到 3 轮以上。即使质量收益真实，独审本身已成为显著墙钟成本。
- 这些数字还低估认知负荷，因为大量 GWT 示例、解释与历史理由写在一行，字节增长（3 倍）明显快于行数增长（约 1.8 倍）。

### standards / V0 体量变化
- file-extract 三份 standards 从 V1 G2 的约 28,425 字符 / 614 行增长到当前约 56,259 字符 / 939 行，字符量约 1.98 倍；doc-extract 从 17,838 字符 / 438 行增长到 99,224 字符 / 1,050 行，字符量约 5.56 倍。
- 两项目的 `iterations/v0/foundation-design.md` 从 V1 G2 到当前内容体量未增长；真正膨胀的是持续回填的根 `foundation.md` 与迭代性 standards。说明“V0 设计本身越来越重”不是主要证据，主要负担是 as-built 承重墙账和后续 standards 累积。
- file-extract 的 `foundation.md` 行数几乎不变（88→91），字符数却从 9,069 增到 21,414（2.36 倍），说明信息被压进更长的表格单元/解释中；对模型与人类而言，这种密集度比单纯增行更难扫描和局部引用。
- doc-extract 当前单份 standards 规模已达到：backend 488 行、frontend 364 行、shared 198 行；file-extract 为 409/299/231 行。develop 若要求执行方与独审员对每包重新读取相关原文，重复加载成本已经不再可忽略。
- 因此当前速度下降更像“规范记忆与任务局部上下文的复制成本”累积，而不是 V0 骨架代码本身越来越复杂。

### 方法论文件本体 vs 项目产物
- 分叉基点到当前 master，8 份关键流程/模板文件总字符仅从约 50,701 增到 53,903（约 +6.3%），总行数 1083→1113；运行时适配分支反而略减字面体积。方法论正文的“篇幅”本身不足以解释项目任务包 3 倍、doc standards 5.6 倍的增长。
- 高杠杆变化集中在少数约束：任务包新增 `supersedes`/`risk-note` 等字段，develop/foundation review brief 增加探针、可达性、调用方锚、双侧实证和留痕义务。每加一条短规则，会在每个任务包、每轮审查和每次 as-built 回填中放大。
- 当前 `develop.md` 337 行、`plan-sprint.md` 222 行、develop review brief 56 行、foundation review brief 62 行；流程文本总体可控，但它们要求消费的项目权威原文集合已经很大。
- 这形成“控制面小幅增重，数据面指数复制”的结构：方法论只增加几个字段/判据，项目侧却把这些判据展开成几十个 reference、known-risk、do-not、escalate-if 与多轮审查记录。

### 分叉后规则的真实增量
- “不可视区 GWT 示例 1:1 物化为 runnable test”“独审默认假设实现有问题、存疑即阻断、禁止总结性正评”“每包对抗审查 loop”在共同基点 `2d31383` 已存在，不能把最近一个月的减速全部归因于 M1–M10 新增。
- 最近一个月对 develop 审查的主要增量是：standard 审查档从 haiku 升到 sonnet；豁免/边界断言要求双侧实证；新增注释受众分离；记录实际 `rounds`；以及退役账。它们增加了审查强度与留痕，但没有重写基本流程。
- foundation-review 的变化最重：每个 ≥机械级声明从“读代码判断”升级成“亲手构造违规并跑检查”；审查员还要在干净环境自跑 build/type/lint/test/穿透切片。doc-extract V0 二审的大量发现正是这项规则的直接产物，其质量收益与墙钟成本都是真实的。
- 任务包新增字段只有 `risk-note` 与 `supersedes`，另给 backend AC 增加“调用方做成事”写作锚；它们不足以直接解释任务包 3 倍增长。增长更多来自写包者把审查历史、过期风险、判据机制和多源冲突全部铺进 `known-risks/reference/do-not/escalate-if`。
- `plan-sprint` 新增的反例要求只针对 ≥机械级地基跟进包；归属真空检查则是补全 scope。两者必要性较强，但会把“证明机制有效”的成本前移到写包/审包阶段。
- 因而方法论变化的核心副作用不是字段太多，而是**证据义务未设预算**：一旦某条经验被写进 standards 或 task package，执行与独审都倾向完整展开验证，没有“按任务实际改动面裁剪”的停止规则。

### standards 的职责混叠
- `task-package-review.md` 在共同基点后没有变化；它要求逐包核 AC、全部 standards 与所有 queue。审查机制稳定，但输入 standards 与任务包持续膨胀，所以同一审查算法自然越来越慢。
- 两项目 standards 已混入至少五类不同寿命的信息：①稳定工程不变式；②某迭代业务契约/AC；③当前代码具体路径与符号；④事故复盘与实测数字；⑤临时例外、工具盲区和补偿性人审规则。
- 例证：file-extract standards 大量出现 `v1/v2/v3`、AC 号、`decisions.md`、doc-extract 事故来源、具体源码落点；doc-extract standards 甚至含任务号、五轮独审事故、具体 lint selector 射程与“插件尚未安装”的临时状态。
- 静态搜索在 doc-extract 三份 standards 中至少命中 87 处 AC 引用、153 处版本引用、28 处任务号引用。即使每条当时正确，这些内容会随代码和迭代语义过期，却继续被独审当“当前强制原文”。
- 这会制造三种审查噪声：
  1. **已过期事实仍像规范**：代码机制换了，旧实现路径/例子未同步；
  2. **局部事故被全局化**：为一个项目形态写的补偿规则，被所有后续任务重复验证；
  3. **临时缺口合法化**：standards 同时写理想规则与“当前机检看不见，所以暂靠写法纪律”，审查员难判断是阻断还是已授权豁免。
- 当前 standards 的核心问题不是自然语言不够精确，而是**把规范、契约、实施登记、证据与历史放在同一权威层**。代码只需满足当前行为真值，但独审被要求同时满足多期叙事，返工和裁决因此增加。
- `draft-tech-design` 最近新增的 ≥机械级探针纪律是正确修复：给不出具体机制位置/反例时只能立人审级。它应继续保留；需要削减的是 standards 对临时实现细节和历史解释的承载，而非削弱可证伪要求。

### 文档—实现漂移的直接账目
- file-extract `fe-rd-002` 记录 V1 联调发现 TRD 与 as-built **10 处不一致，十条无一是 code bug**；六条穿透流按 as-built 全通过，最终只改 TRD。
- `fe-rd-005` 又记录 V2 收尾 **7 处 TRD 与 as-built 不一致，七处无一是 code bug**；来源包括 develop 独审/用户裁决与联调契约对账，最终实现零改动。
- `fe-rd-007` 退休了 AC-55：PRD 仍声称测试运行器未建、某些修改“今天全绿”，但 V2 已经做完且实测会红。这里 AC 不仅过期，而且写了与代码事实相反的断言。
- `fe-rd-008` 在对照 doc-extract 旧实现后发现 V3 PRD 有三处事实错误（旧系统能力、模型归并形态、份数口径）和一处能力缺口；说明 PRD/AC 在没有先核 as-built 时会把错误假设带入 TRD、任务包和审查。
- `fe-rd-001` 则是 V1 PRD 把模板版本放文件，但 V0 已为同一实体建 DB 表、触发器、base repo 和标杆切片；同一实体两个家。这个冲突直接对应用户点名的 “V0 与后续语言设计脱节”。
- `fe-rd-003/004` 展示另一种健康路径：在实现前由 draft-tech/plan-sprint 发现层级或字段错误，先 revise-doc，再写代码。问题不是 revise-doc 本身，而是过期核对发生得越晚，返工越贵。
- 因此用户的感觉有坚实证据：至少在 file-extract，已有 **17 处明确登记为“实现满足实质要求、只需文档对齐”** 的偏差，另有多个过期/错误 AC 在实现前被退休或订正。

### 独审记录中的语言耦合信号
- file-extract V3 的 24 条审查记录中，有 10 条 comment 明确提到 TRD/PRD/任务包/AC 例子/措辞/陈述/订正等语言层问题。这个 10/24 不是“10 个误报”的精确比例，但说明近半任务至少要在审查过程中处理语言—实现对账。
- 例子包括：任务包随上游合并过期、PRD 与 standards 正面冲突、AC 例句漏第三种失败形态、审查判定“改文档而非迁就抽取器”、退出码 1 与“门已通过”表述矛盾。
- 同时这些记录也大量包含可复现真 bug；最合理的结论是审查 loop 同时承担了**代码审查 + 规格澄清 + 历史清账 + 方法论实验**四种工作，墙钟变慢是职责叠加的结果。

## 因果结论
1. **用户假设部分成立，而且比例不可忽略。** 至少有 17 处正式登记为“只改 TRD、实现零改动、不是 code bug”，另有错误 AC、V0/PRD 冲突和示例真值错误。
2. **不能推导为“代码问题普遍不大”。** doc-extract V0 与 file-extract V3 同时存在大量可构造、可达、会改变行为的真缺陷；独审强化确实提升了质量。
3. **主要减速机制不是方法论正文变长，而是证据义务放大。** standards、foundation as-built、任务包、审查记录互相复制；输入增长远快于流程文件。
4. **最昂贵的是错误路由。** 规格/示例/声明档位问题被送进代码整改 loop，或 scope 问题被逐包独审重复寻找，导致整轮重读与重审。
5. **当前没有足够时间序列证明单位代码产出持续下降。** `rounds` 只在 file-extract V3 有完备数据，V1/V2 无可比基线；现有证据能证明审查负担与文档漂移显著，不能精确量化“速度下降多少”。

## 改进建议

### P0：先改错误分类与控制流
- 独审 finding 强制加 `type` 与 `action`：
  - `behavior-bug → fix-code`
  - `contract-drift / example-error → revise-doc`
  - `enforcement-claim → fix-mechanism-or-downgrade-claim`
  - `scope-gap → global-gap-review`
  - `future-risk → backlog/waiver`
- 只有 `behavior-bug` 或当前可达的强制不变式失败才进入“整改代码→完整复审”。文档-only 修订后只复核受影响契约，不重跑整轮代码审查。
- 阻断级必须附：当前可达路径、可观察后果、反例证据。标准任务中的“存疑”先变成 `evidence-gap`；foundation/安全敏感任务仍可保持存疑阻断。

### P0：把 AC 意图、判据和例子拆开
- `intent`：规范性的用户可观察结果。
- `oracle/predicate`：如何计算是否满足；数值、状态机、集合边界以此为准。
- `example`：默认是派生说明，不自动拥有高于 oracle 的权威；只有标 `golden: true` 且在 plan-sprint 审查时复算通过，才要求 1:1 固化字面结果。
- develop 物化的是 oracle/行为，不是无条件物化每个示例数字。`fe-v3-010` 应在写包审查阶段直接判 `example-error`，而不是让代码去凑 42。

### P0：任务拾取前做 freshness preflight
- 在依赖任务合并后、任何代码改动前，对 `files/reference/escalate-if/AC example` 与 as-built 做一次轻量核对。
- 命中漂移则只改任务包或发 revise-doc；未命中也记录“已核不成立”。file-extract 已实证该步骤七次避免七轮返工，应正式化而非留在 session 经验里。

### P1：重构 standards 的生命周期
- standards 只保留“当前稳定不变式 + 适用条件 + 强制等级 + 机制 id”；不得继续按 v1/v2/v3 追加历史段。
- 版本 AC、接口字段、具体页面行为回 PRD/TRD；代码路径与探针落 `foundation/enforcement registry`；事故过程与实测数字进 decisions/history；临时工具盲区进 waiver/backlog，带 owner/expiry。
- 建准入门槛：一次性事故不进 standards；至少跨任务复现或明确是长期项目不变式才进入。新增条目必须同时说明 `applies-if` 和退出/替换条件。
- 达到阈值（例如单层 >300 行或出现第 3 个版本增补段）触发 compact：重写“当前真值”，历史归档，不做 append-only。

### P1：把 foundation 变成可验证声明表
- 每行只保留：`invariant / required-grade / mechanism-id / probe / coverage-scope / exception / last-verified`。
- 审查结果分两种：不变式真被打穿 = code/mechanism bug；只是“机械级/构造级”声明过高但行为已有别层保证 = claim bug，降档或改机制说明，不强迫代码模仿某个指定 service/helper。
- 保留 master 新增的反例探针与干净环境自绿，它们是高收益项；避免把实现手段本身误写成不变式。

### P1：给任务包设上下文预算
- 任务包只写本任务 delta；通用凭据红线、稳定 standards 原文、历史事故不重复展开。
- `known-risks` 只列本任务新打开或显著放大的风险；`do-not` 只列真实 scope 边；`reference` 优先稳定锚点/符号，不堆几十个行号。
- 设软阈值：约 8–12KB；超过则要么拆包，要么把非规范性历史说明移到 appendix。独审只消费 normative core，appendix 仅在疑点时查。

### P1：scope 问题只做一次全局接缝审
- 保留逐包独审检查包内忠实性；在全部 merged 后增加一次 global seam review 查归属真空、退役遗漏、跨包接口与旧能力回归。
- 不把这类问题硬塞给每个 per-task 审查员。doc-extract 已证明 8 个二审阻断中 6 个按定义不在逐包 scope 内。

### P2：用下一批任务校准，而不是继续凭感觉加规则
- 对后续至少 20 个任务记录：执行墙钟、审查墙钟、spec 澄清墙钟、rounds、finding type/action、每轮是否改代码、任务包 bytes、实际加载的 standards 条目数。
- 核心指标：`blocking findings resolved with zero code changes / all blocking findings`、stale-spec 命中率、每任务审查轮数、spec-only 重审比例。
- `rounds` 字段只记录轮数不够；要能区分“代码轮”和“规格轮”，否则下一次仍无法判断方法论是变严还是变慢。

## 保留 / 修改 / 迁出
| 处置 | 内容 | 理由 |
|------|------|------|
| 保留 | 旧代码退役账 / `supersedes` | 减少维护义务，方向正确；只需避免把历史叙事塞回 standards |
| 保留 | foundation 反例探针、干净环境自绿、AC 可达性、调用方验收锚 | 都能抓真实失效，已有项目证据 |
| 保留 | 欠账时效分池、审计留痕缺失检测 | 修的是闭环，不是增加文本美观度 |
| 修改 | “存疑即阻断” | foundation/安全保留；standard 任务改为需可达性/后果证据，歧义走 spec route |
| 修改 | GWT 1:1 物化 | 物化 normative oracle；普通示例不得压过判据 |
| 修改 | 每包全读 relevant standards | 改为按 `applies-if` 匹配的 normative 条目；历史 appendix 不进默认审查上下文 |
| 修改 | 双侧实证 | 仅对决定通过/豁免的边界断言强制，不把普通说明都扩大成两倍探针 |
| 迁出 | standards 内的任务号、版本考古、AC 号、事故长叙事、临时 lint 盲区 | 这些不是长期规范，应归 decisions/history/waiver/enforcement registry |
| 不建议移除 | 独立审查本身 | doc-extract V4/V5 与 file-extract 均证明其能前移真缺陷；应改路由和 scope，不是取消 |

## 初始假设（待证据验证）
- 可能存在“语义等价但词面不一致”被独审当成实现缺陷的情况。
- 可能存在 standard、V0、AC 在不同抽象层级重复约束，导致实现者无法判断哪一个是裁决源。
- 也可能相反：语言差异暴露了可观察行为或失败语义并未真正落到代码，不能一概视为小问题。

## 当前分类框架
| 类别 | 判据 | doc-extract 例子 |
|------|------|------------------|
| 真代码缺陷 | 可构造反例并改变运行行为/安全/数据不变式 | `@Public` 别名绕过、registry 原地覆盖、JWT 默认密钥、stale dist 假绿 |
| 规格—保证错配 | 文档声明机械/构造级，但实现只靠人审或局部约束 | 分页、序列化、页面四态等档位高于真实封口 |
| 语义等价但词面错位 | 文档把实现手段写成不变式，实际已有另一手段保证同一语义 | DB 已约束合法状态边，却要求所有更新必经 service |
| scope 真空 | 每个任务包都合规，但全局能力无人认领 | DOC_TYPES 收口、unknown 选项、导出入口 |
| 审查偏置/定级膨胀 | 缺陷存在但当前不可达或严重度因 brief 被推高 | V5 B7/B8 分级争议及部分建议项 |
| 示例真值错误 | AC 意图正确，但示例数字/窗形状与现有判据算不出来 | file-extract `fe-v3-010` 的 42→40；正确动作是改示例，不是迁就代码 |

## 技术决策
| 决策 | 理由 |
|------|------|
| 将错误分为真实行为缺陷、规格漂移、示例漂移、审查误报、流程晚发现 | 便于判断减速来自代码质量还是验证模型 |
| 先对照真实产物，再评价方法论条款 | 项目证据应约束理论解释 |

## 遇到的问题
| 问题 | 解决方案 |
|------|---------|
| PowerShell 汇总 standards 历史时，`foreach` 输出直接接管道触发 `empty pipe element` 语法错误 | 改为先累积到数组变量，再统一 `Format-Table`，不重复原命令 |

## 资源
- 用户讨论文档：`E:\projects\hact-method-lab\_meta\plans\2026-08-09-runtime-adaptation-vs-master-method-discussion.md`
- 方法论仓库：`E:\projects\hact-method-lab`
- doc-extract 主项目候选：`E:\projects\document-extraction`
- doc-extract 独审/工作树候选：`E:\projects\document-extraction-second-review`、`E:\projects\document-extraction-worktrees`
- file-extract：`E:\projects\file-extract`

## 视觉/浏览器发现
- 本任务尚未使用视觉或浏览器。

## P0 机械验收补充
- P0 不能只依赖 `check-sprint vN`：B 类任务不进入 iteration/sprint，若校验器只按迭代过滤，B 的 preflight、review reports 与 wall-clock 仍可能退化为人工约定。
- 应在同一脚本中增加按 `task-id` 校验的通用入口，并由 `develop` 在终态前调用；保留旧状态记录的兼容读取，但显式审计新任务时缺字段必须失败。
- 通用入口还应核对聚合时间与逐轮报告的边界：`implementation_completed_at == review_started_at`，首份报告起点/末份报告终点分别等于 review 聚合起止；否则等待或整改时间会掉出账本。报告同时校验固定 `base_ref/reviewed tree/diff hash`、非空 changed-files，以及 targeted finding ID 格式。
- `freshness: revised` 是“preflight 发现并闭合规格问题后再开工”的合法终态，不能被通用审计误判；显式审计应接受 `pass|revised`，只拒绝缺失或未闭合值。
- 机械回放证明两类关键失败可被阻断：聚合分钟与 ISO 时间戳不一致、targeted finding id 不符合 `{task-id}-FNNN`。这使 P0 从文字纪律变为可执行终态条件。
- full/targeted 的最小可执行基线应是：所有轮次共用 preflight `base_ref`；full 的 `reviewed_base` 回到 preflight `base_tree`；targeted 的 `reviewed_base` 接上一轮 `reviewed_head` 且 `prior_report` 指向紧邻上一轮；末轮必须 pass 且不得遗留 escalation。已由 B fixture 验证。
- P0 已形成闭环：入口统一（兼容路径也先留 preflight）、复审范围可执行、墙钟可观测、A/B 均有同一个 task-id 审计命令。自然实验中仍应保留的 sensitive 独审/反例探针没有被删除；本轮只减少错误起步、同根拆分、无关重审和不可度量时间。

## P1：按 task type/layer 裁剪审查维度（启动发现）
- 用户指定的落地说明把该项列为当前最有价值的 P1；示例是纯 enforcement/test 任务不应反复回答 DTO 去向、页面设计、N+1 等不适用维度。
- 本轮实现边界是“可解释的自动适用性选择”：仍需保留通用正确性、任务契约、回归与证据检查；sensitive/Foundation 等高风险信号必须能覆盖普通裁剪并升档。
- canonical execution plane 是 Windows `E:\projects\hact-method-lab`；当前没有来自本仓的服务、监听 URL 或浏览器页面，后续以仓内模板、脚本和 fixture 验证为准。
- 既有研究已直接记录当前痛点：develop review 要求八类逐项结论，而纯 enforcement/test 任务中的 DTO 去向、设计保真、N+1 多数为 N/A；建议由 `task_type/layer/applies-if` 生成维度集合，同时把 AC、do-not、机制反例保留为必审。
- 仓库历史已形成可复用原则“`task.type` 是路由键、checklist 差异主要由 layer 驱动”；本轮应在现有 develop/task package 元数据上建选择层，不另造平行的任务分类体系。
- 当前任务包已有足够选择信号：`task_type`、`layers`、`source`、`risk`、`files`、`relevant-standards`，以及条件性 `api-contract`；审查派发时还有固定 `changed_files`。自动裁剪可基于这些现有权威输入，无需执行者手填“本轮想审什么”。
- 当前 `develop-review.md` 的矛盾是：full 模式声称执行“所有适用维度”，但逐类段又要求八类都给明确结论，并在 backend 输入追踪中显式要求 frontend 写 N/A。这正是 P1 应消除的控制流。
- 最小可审计载体应是一份由脚本生成的 review profile，至少记录 profile version、task/layer/source/risk 信号、selected dimensions、omitted dimensions 及机器理由；full review 只消费 selected，targeted 继承最近 full profile，升 full 时重新生成。
- 保底策略：AC/contract、scope/secret、测试证据、变更注释等通用维度不可裁；Foundation 继续使用专用 `foundation-review.md` 不进普通选择器；sensitive 只能增加同 layer 的高风险维度，不得借 profile 降档。
- 选择器采用确定性 JSON 产物更适合现有轻量工具链：不引入 YAML 依赖；full round 生成独立 profile，targeted 继承最近 full profile，升 full 后按新的完整 fixed diff 重新生成。
- 维度将从原八类拆成“4 个 core + 条件维度”：core 为 contract、scope、test-evidence、comment-hygiene；条件维度覆盖 standards、enforcement、design-fidelity、input-provenance、query-performance、concurrency、logging-privacy、maintainability、sensitive-boundaries。拆开原“留人判项”后才能只关闭 N+1 而不连带关闭日志隐私等不同信号面。
- profile 规则必须 fail-safe：元数据/layer/changed surface 不完整时扩大选择，不得静默裁剪；sensitive 增加 `sensitive-boundaries`，Foundation 保持专用逐关注点审查。
- 终态 `check-sprint --review` 可按 round 的 `review_profile` 路径重算 full profile，并检查 targeted 是否继承最近 full；这样“自动裁剪”不是 prompt 约定，而是可执行契约。
- profile 生成器与 5 个场景单测已经通过：纯 backend enforcement/test 只保留 core+enforcement（不会打开 DTO/设计/N+1 等）；frontend UI 打开 design；backend API/data 打开 input/query/concurrency；sensitive enforcement 额外打开敏感边界；元数据不完整时 13/13 全开。
- `init-project.md` 是逐文件铺设项目脚本，不是复制整个 `templates/scripts` 目录；因此必须显式新增 `scripts/review-profile.js`，否则新 `check-sprint.js` 的终态审计会缺模块。
- 兼容策略采用 `code_reviews[].review_profile_version`：存量缺失在迭代扫描中只留提示，新任务显式 `--review` 必须给 `develop-review-profile/v1`；Foundation 用 `foundation-review/v1` sentinel，继续全强度而不生成普通 profile JSON。
- 手动 B diff 的 `adversarial-review` 是第二个 live 派审入口，必须与 develop 一样先生成 full profile、targeted 继承、升 full 重算；否则新 B 主路有裁剪而兼容路仍 uniform。
- 用户指引应解释“省略理由留 JSON、不要求写 N/A”，结构契约则必须把 `profile-round-NN.json` 与 `review_profile_version` 列为产物/完成判据，防止只在执行正文生效。
- risk 合并必须单调：任务包已声明 `sensitive` 时，即使调用方误传 `--risk standard`，生成器也保持 sensitive 并选中敏感边界；终态 checker 还会要求 round risk 与 profile effective_risk 一致。
- finding 需把稳定 `dimension` 一并写入 round/status issues，后续才能比较各维度命中率与“被自动省略但后来升 full”的校准信号。
- 一致性扫描中旧“每类必须结论”只剩 Foundation/PRD/TRD/任务包/原型等各自专用审查；这些对象不属于本轮 per-task code review 裁剪。普通 `develop-review` 的八类/N/A 旧措辞已清除。
- `specs-structural/develop` 的 layer checklist 是执行 subagent 自绿责任，不是独审 uniform checklist，继续保留；P1 只裁独立 review 输入，不删除实现阶段应跑的目标测试。
- live 接线覆盖 develop、B 兼容 skill、round template、status contract、init-project、用户指引和 checker；普通 full profile 路径必须在派审参数中显式给出，不能只在后文生成而派发段漏传。
- profile 的 `input_fingerprint` 必须绑定完整规范 frontmatter，而不只是 task id/layer/files 等选择字段；否则任务包内容变更但恰未改变维度集合时，旧 profile 仍可能被误当当前审计记录。
- `foundation-review/v1` 是有意绕过普通选择器的全审 sentinel，必须限制给唯一 `task_id=foundation`；普通任务不得借该值跳过 task package/profile 重算。
- “绑定完整 frontmatter”需精确为“绑定 normative frontmatter”：任务包 `status` 在 profile 生成后还会从 taken-by/done 流转为 merged，必须排除；title/description/AC/files/do-not/standards/risk 等规范输入仍全部进入 hash。
- 选择信号应识别 `user.dto.ts` 这类文件名 token，不只认 `/dto/` 目录；非法 declared risk 按 sensitive + metadata incomplete fail-safe，而不是静默降为 standard。

### P1 最终实现结论
- 普通 develop full review 现在由 `review-profile.js` 自动生成 13 维完整分区：4 个 core 永远 selected，9 个条件维度按 task type/layer/source/risk、normative frontmatter 与 fixed changed files 选择；omitted 逐项带机器理由但不进入审查 prompt 的 N/A 作业。
- 纯 backend enforcement/test fixture 的 selected 集合为 core + enforcement；DTO 去向、设计保真、query/N+1、并发、日志与 production maintainability 均被有理由省略。frontend UI 与 backend API/data 分别打开自己的技术面，sensitive 只增不减，元数据不完整则 13/13 全开。
- full profile 不可覆盖、绑定规范输入与 changed files；targeted 继承最近 full，升 full 必须基于完整 diff 新生成。`check-sprint --review` 会重算 profile、检查 core/分区/metadata/signals/指纹、full 唯一性与 targeted 继承。
- Foundation 不参与普通裁剪，使用 `foundation-review/v1` sentinel 继续逐关注点全审；sentinel 仅允许唯一 `foundation` task，普通任务伪用会失败。
- 存量 P0 报告保持可读：迭代扫描继续核固定 diff/墙钟并提示缺 profile；新任务显式终态审计必须有 profile。用户指定的落地说明未修改，现有 WSL/其他项目进程未触碰。

---
*每执行2次查看/浏览器/搜索操作后更新此文件*

## 阶段 13：fe-b-010 长对话复盘（采集中）
- 目标 task：`019fe4e0-c674-7451-96bd-18e40a868b6a`，业务执行面为 WSL `/sandbox/projects/file-extract`；本轮分析面为 Windows `E:\projects\hact-method-lab`，不修改目标 task 或业务仓。
- 共 4 个用户轮次，墙钟约 266.7 分钟：初始执行 142.1 分钟；用户授权第 4 个范围偏离后 32.5 分钟；escape-hatch 授权后 90.0 分钟；最后 backlog 记录 2.1 分钟。
- 初始轮有 209 items：110 条 commentary、42 reasoning、36 subagent activity、18 file changes。后续主交付轮仍有 160 items、68 条 commentary、26 次 subagent activity，沟通与编排密度显著偏高。
- 任务最终交付成功：高复杂度 sensitive B、补 TRD、8 轮代码审查、全量测试分组全部通过、PR 合并、终态审计及 backlog 落账。
- 当前首要待判：哪些额外轮次源于旧方法缺少 freshness/targeted baseline/profile/checker，哪些属于实现最初未把“所有 successor 入口共享原子事务”作为单一不变量而产生的可避免返工。
- 初始轮的主要链条：执行面/技能/同步/任务路由与 preflight → 24 文件实现 → Round 01 发现同键 replay 冻结窗口 F001 → Round 02 否决 200×5ms 轮询 → 原子化 running 初始化 → Round 03 full 关闭 F001、发现 mark-seen/CAS orphan-running 的 F002 → 为第 4 个 task-files 外登记文件请求用户授权。
- 用户授权后的 Round 04/05：先用 service CAS 收敛 mark-seen 变体；再用 `UNIQUE(retry_of)` 阻止两个 merge retry；Round 05 又证明普通重新识别 `retry_of=NULL` 仍能抢占来源，F002 达三轮上限，进入 escape-hatch。
- escape-hatch 后改成正确的跨入口不变量：普通重新识别与 merge-only retry 共用一笔 predecessor 行锁 + successor/关系/ledger 原子事务；Round 06 full 关闭 F001/F002。
- 末端全量继续发现三类开发前/独审前未覆盖缺口：web 测试夹具未跟共享契约（触发 Round 07 full）；两道源码唯一性扫描红；旧 migration spec 假设自身为最新迁移且最初隔离方案有共享库并行风险（触发 Round 08 full）。
- 最终质量闭环充分：build/type-check/lint、五组全量测试、最终 full review、PR/merge/status/review audit 全部完成；因此结论不能简单归为“流程浪费”，应评价为质量有效但前置建模和复审路由低效。
- 墙钟权威账：implementation 58 分钟、review 180 分钟、spec 3 分钟，共 241 分钟；task UI 四轮总计约 267 分钟，差额约 26 分钟主要是启动/执行面/规划补丁/发布落账等编排开销。8 份独审报告自身 elapsed 合计 68 分钟，说明 review 的 180 分钟里约 112 分钟是整改与轮间等待，而非审查员阅读本身。
- 共使用 10 个隔离 subagent：1 个实现者反复续用，8 个正式 round reviewer，另 1 个替补 Round 01 reviewer；隔离性强，但评审 agent 数量与 full 重启次数高。
- 新方法 P0/P1 在任务开始前已提交（10:46 / 11:40，任务 12:56 开始），且对话确实执行了 freshness、稳定 finding id、full/targeted、固定 tree/profile 和墙钟留痕；但业务项目仍缺新版 `review-profile.js` 与 `check-sprint --review`，形成“最新版 develop + 旧项目脚手架”的过渡态。
- review profile 对该 sensitive backend 任务每次均为 12/13，只省略 frontend design；P1 自动裁剪在此任务上几乎不节省审查面，这是风险信号决定的预期结果，不应算实现失效。
- 当前方法仍保留“实际改动文件超出 files 清单 3 个以上即重置/阻塞”的纯计数阈值。本案例证明它会反向塑造实现：先为第 4 个 deviation 撤销 package index；后又为第 4 个登记文件请求用户授权并把公开仓储语义收回 service 私有 helper。该规则需要按语义风险替代文件数。
- 版本漂移的准确边界：`45759bd` 终态项目提交中既没有 `scripts/review-profile.js`，`scripts/check-sprint.js` 也没有 `--review`；当前 WSL 工作树之所以出现新版脚本，是另一个未完成的 `codex/method-workflow-sync` 任务，不能倒推为 fe-b-010 当时已有。
- 终态对话明确称“校正四份历史 full-profile 的权威输入指纹”。当前 checker 又以最终 task package 重算每一历史 full profile；但 task package 的 `files` 在各轮持续扩张。这会把历史输入事后改写成最终输入，破坏逐轮证据的不可变性。应记录每轮 task-package blob/hash + generator commit，并按历史快照验，不按 HEAD 重算旧轮。
- 初始 TRD 与最终 TRD 的关键差异不是文字润色，而是新增“普通重新识别与 merge retry 共用原子 successor 入口”。原任务 AC 只说同入口不同键由单飞约束阻止，没有列出跨入口 contender matrix。对 sensitive DB 状态机，应在写代码前增加一次窄 TRD/invariant review，枚举所有写同一 predecessor/successor 的入口、锁顺序、提交可见点与失败零残留。
- Stage A 只跑 API type-check/目标测试，直到 Round 06 pass 后才由末端发现 web 契约夹具、源码扫描和历史 migration suite 红。共享 contracts、migration 注册、enforcement scanner 都可从 changed surface 推导；应在首次独审前跑“便宜但跨仓”的影响验证：依赖工作区 type-check、全 migration suites、相关 scanner，不必提前跑完整全仓测试。
- Round 07 因一个 web 测试夹具新增而 full，Round 08 又因窄 helper/错误命名/迁移 spec 修复而 full。当前“changed surface 扩大即 full”过粗；可增加 `supplemental/targeted-plus`：生产机制未变时只扩受影响维度与增量文件，新模块/依赖/安全边界/事务机制变化才 full。
- targeted 同一 finding 每轮强制全新 reviewer 不是独立性的必要条件；独立性只要求不参与实现。建议同根 targeted 复用最初 reviewer，full/escalation 才换新 reviewer，减少重新建模。
- 对话共有 196 条 commentary，约 27.6% 命中“仍在/尚未/暂无/继续等待”等无变化状态启发式。应改为事件驱动：开始、发现、失败、里程碑、需决策、完成；长命令仅按较长间隔汇总，不逐窗口播报。
- 执行面虽口头锁定 WSL `claude`，实际编辑编排仍经 Windows PowerShell/UNC/临时 patch，导致多次 hunk、权限、变量展开错误。若补丁器不能以目标 owner 直接写，应在认领前重开 WSL-native 执行面；不能只“声明统一”而工具仍跨面。

### 阶段 13 结论
- 质量结论：成功且审查有真实价值；F001/F002 都是可达的并发行为缺陷，最终原子事务、迁移隔离和全量验证值得保留。
- 效率结论：未达标。主要浪费来自设计真值形成过晚、语义范围被文件计数替代、影响验证后置、复审升档粗、方法运行件混版和高频无变化播报。
- 用户授权点：为第 4 个登记文件停下属于不必要流程阻塞；三轮 F002 后请求扩大为共享基础事务属于合理 escape-hatch。
- 保守预期：若只落上述 P0（版本锁/历史快照、语义 scope、pre-code invariant review、pre-review 影响验证），同类任务应从 8 轮降到约 4–5 轮，墙钟有机会从约 267 分钟压到 150–190 分钟；这是反事实估计，不是已验证承诺。
