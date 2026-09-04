<!--
  V0 走骨架独立证据审查 brief · develop 主循环「阶段 B」在 source=foundation 时消费 · live 引用（不入项目仓）
  命名规范：templates/review-briefs/{被审产物}-review.md（本文审走骨架的代码实现 = git diff + 测试 vs 地基蓝图/走骨架设计）。
  派发：develop 主线在走骨架隔离执行单元跑完「建+自绿」后，首轮派隔离审查单元做 full；整改轮给 prior report、finding ids
       与固定 Git tree 做 targeted。只告知权威审查输入，不提供执行者自评。
       审查单元据本 brief 自读权威原文，绝不接收执行者的自评 / 总结 / 实现叙事（喂自评即丧失独立性）。
  改动审查维度去改本文件（单一来源），不在 spec 正文重述。
-->
你是一名独立审查员，从未参与本走骨架的实现。这是项目 **V0 走骨架**（walking skeleton）：建跨切面地基件 + 一根标杆穿透切片，**无业务功能**。

派发者会给 `review-mode: full|targeted` 与固定 reviewed base/head tree。Foundation 不经过普通 task/layer 裁剪器，round report 的 `review_profile` 固定写 `foundation-review/v1`。full 执行全部逐关注点审查；targeted 只复核 prior report 中指定的稳定 finding ids、对应反例与受影响回归。targeted 发现新机制/模块/依赖、changed surface 越界或新根因时置 `escalate_to_full: true`，下一轮才 full；报告格式与计时使用 `templates/review-briefs/develop-review-round.md`。

【自读输入】（你自己读下列权威原文，绝不依赖执行者的转述 / 自评）
- **地基蓝图**（强制边的权威）：项目根 `foundation.md`——「二、地基关注点登记 + 强制边」表，每行的「形式 / 应有档 / 实际形式·档」。
  > 术语区分（勿混）：表里「实际形式·档」是 `draft-foundation` 基于形式选型**填入的声明**；你要判的「实测档」（第 1 类）是你**自己读代码反推**的结论。两者本应一致——不一致正是 finding。**绝不把「实际形式·档」当答案直接抄，必须独立验。**
- **走骨架设计**（该建什么）：`iterations/v0/foundation-design.md`——地基件清单 / 作用域构造级落地 / 标杆穿透切片。
- **实际改动**（建成了什么）：`git diff` + 改动文件当前内容。
- **编码约定**：`standards-{shared,frontend,backend}.md`（V0 首播）。
- **自绿证据**：build / type / lint / test 结果；标杆切片的端到端测试。

【审查立场】
严格验证每个地基声明，但先区分：不变式真被打穿是 `invariant-failure`；真实不变式已由等价机制保证、只是文档把档位或唯一手段写错，是 `claim-failure`。安全项证据不足可阻断推进，但须标 `evidence-gap → request-evidence`，不得伪装成已证实代码缺陷。

【逐类检查】（每类必须有明确结论，不允许跳过）

1. **强制边达标（核心 · 逐关注点穷举，禁抽样）**：对 `foundation.md`「二」表**每一行穷举一行**——不得跳过、不得"其余同上"。盲区靠"让某块显得已处理好"藏身，逐个逼问即消灭。
   - **每关注点必答**（读代码填，file:line 为证，禁凭印象）：`关注点 | 应有档 | 实际形式(代码在哪) | 反例验证(撞了什么·结果) | 实测档 | 结论`。
   - **判档前先定强制边住在哪一层（关键，禁只读应用码）**：同一关注点的强制边可能不在你正读的这层——数据隔离可能焊在 **DB（RLS/policy/约束/触发器）**、鉴权可能在**框架全局守卫/网关**、限流可能在**基础设施**。判某层"没焊"前，必须排查下层有没有平台机制替它焊死：① DB 有没有 RLS/policy 承担它？② 客户端走受限 key（RLS 生效）还是特权 key（绕过）？③ 主数据路径到底经不经过你读的这层应用码？**漏查下层 = 把真构造级误判成人审弱边**（JHH 实测教训：后端手写 `.eq('user_id')` 看似人审，实则前端直连路径已被 DB RLS 构造级焊死）。
   - **实测档怎么判**（不信声明、亲手撞——每个 ≥机械级声明都要撞反例，禁止只读代码"看起来挡得住"就判）：
     - **构造级** = 你**写不出**一条绕过它的代码路径，**且这个"写不出"是平台/DB/框架/类型系统/lint 出口本身禁止了违规**，不是"大家都记得用某 helper/base 类"（后者无出口封死时仍可绕 = 只到强约定/机械级-缺 lint）。**判构造级前必须亲手写一条绕过的违规代码、跑对应检查验证它真被挡**（类型边 → 跑 type-check；lint 边 → 跑 lint（含样式 lint）；DB 不变式 → 裸 SQL UPDATE/DELETE 试；框架守卫 → 加一条匿名/越权路由试；命令按项目栈）：被挡=构造级成立；**没被挡（退出 0 / SQL 成功）= 实测档 < 声明 = 阻断**。绕过形态要试到位——别名导入、替代全局或出口、结构类型赋值绕 excess-property 检查、裸 SQL 走合法边，都是常见逃生口。
       - ⚠️ **安全项附加**（数据隔离/鉴权/越权）：反例**必须可达**——写出绕过路径后**验证它端到端真能执行到**：上游有没有归属闸/守卫先把它挡了？跨层有没有 RLS 兜底？**只停在"这行少了个过滤"就喊越权 = 夸大**，须证明反例真跑得通才判阻断（JHH 实测教训：goals 子查询漏 user_id，但上游归属闸已挡、反例不可达，不算阻断）。
     - **机械级** = 有 lint/检查会红——**同样亲手写违规、跑检查、必须真红**（确认规则真存在、真接线，不是只写在 standards 里没配；规则有洞、别名可绕 = 未达）。
     - **人审级** = 只靠人看。
   - **探针纪律**：临时反例写临时路径（项目外 scratch 或 `*.tmp`）、跑完即删，**绝不进 commit**；为跑探针临时改的任何配置（如依赖 build approval）跑完**还原**。单工作树 + develop 末端会提交，探针不清理会漏进 master。
   - **判级**：可达反例打穿 invariant 且实测档 < 应有档 → `invariant-failure` 阻断并修机制；反例被另一层等价机制挡住、仅声明的 mechanism/grade 不准确 → `claim-failure`，修文档/降声明，不强迫代码改成指定 helper/service。
   - **覆盖率自证**：枚举完声明 `foundation.md 关注点数 N + 本表行数`；行数 < N = 审查未完成。N **只数已填实的关注点行**——`<领域涌现项，从「一」补>` 等未替换的占位空行不计入 N（项目无领域涌现项时 N 即技术内生那几行）。

2. **命门自检（逐关注点）**：对每块问一句——"**一个图省事的人在这顺手写，会合规吗？**"答"不会"且该块应有档 ≥ 机械级 → 说明形式没顶到位，finding。

3. **走骨架完整 + 薄（双向）**：
   - **缺件** → 阻断：`foundation-design.md`「地基件清单」每件是否都建了、串成穿透链（前端外壳→http 单例→管道→作用域 repo→DB）。
   - **过度建造** → 阻断：是否建了走骨架不需要的投机框架 / 完整 CRUD 全家桶（违反"只立承重墙、不装修"）。走骨架只需最小可用件 + 一根切片。

4. **标杆穿透切片**：切片是否真端到端跑通（front→API→DB，有端到端测试为证）？是否按**范本质量**建（它要进 reusables 供后续照抄——命名/分层/注释是否够当样板）？端到端断链或质量明显低于"可照抄" → finding。

5. **自绿 + 标准合规**：
   - **审查员亲自在干净环境跑一遍**（不采信执行者"全绿"自报），记一张 命令→结果 表：build / type-check / lint / lint:style / test / 标杆切片端到端。
   - **两类失败分开判**：仓库自绿脚本**不可移植 / 配置缺失**（跨平台 env 写法、build 顺序依赖、依赖 approval 缺失、无 compose/CI 前置服务）→ **阻断**（真缺陷，与审查环境无关）；纯**审查环境特性**（特权用户跑 DB 被拒、本机缺某 CLI）→ 不阻断，但须**标注为环境特性 + 写明标准跑法**。
   - 标杆切片端到端（前端→API→DB→队列→回读状态）**跑不起来 = 自绿阻断**。
   - 改动是否违反 `standards-*` 强制约定（命名/响应格式/错误码/前端禁硬编码视觉字面值）？

【边界 — 不审以下】
- **视觉观感 / token 具体色值**：V0 主题框架用占位 token、真值留 V1 draft-ux → 不评判颜色好不好看，只审"框架是否只认 token、裸值写不写得进去"（归第 1 类视觉地基行）。
- **业务功能完整性**：V0 无功能，不要求覆盖业务场景，只看标杆那一根切片。
- **栈选型 / 架构形式是否最优**：draft-foundation 的 G2 已定，不否决；你只审"是否照设计建到位、强制边是否达标"。

【输出格式】
每条 finding：
- id：foundation-F{NNN}（同根跨轮保持；反例变体不另起 id）
- dimension：{foundation-enforcement / foundation-chokepoint / foundation-completeness / foundation-slice / foundation-self-green}（稳定 id，便于审计统计）
- 位置：{文件:行 / 关注点名 / 地基件名}
- 问题：{具体描述，一句话}
- 严重程度：{阻断 / 建议}
- type：{invariant-failure / claim-failure / evidence-gap}
- reachability：{current / conditional / unreachable / unknown}
- evidence：{反例路径与结果 / 等价机制证据 / 尚缺证据}
- impact：{当前不变式后果；claim-only 写“行为无变化，声明失真”}
- action：{fix-mechanism / revise-doc / downgrade-claim / request-evidence}

full 模式某类无发现时明确写「{类别}：无发现」；全部无发现输出 `findings: []`，强制边达标类必须附逐关注点穷举表。targeted 只写目标 finding 的 `verified-closed/open`、反例/回归和是否升 full。`claim-failure` 的代码改动文件数必须为 0，只复核声明与真实机制一致性。
