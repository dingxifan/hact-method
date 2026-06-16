# task_plan · 两审查统一调整方案（本轮范围：主题 1-4）

> 输入：`_meta/plans/2026-06-06-method-audit/`（广度 33 条）+ `_meta/plans/2026-06-16-develop-loading-audit/`（AC 保真深度）
> 本轮范围（用户 2026-06-16 选定）：**主题 1-4「现在就咬人」**，不动 BRIEF.md 决策清单。
> 主题 5-8（团队期 / 决策层 / 韧性）+ 1 条过时项整理 → 见文末「本轮不做」。

## 落地原则
- 只改方法论文件（spec / skeleton / templates），不动 hact-app。
- status.yml 新增字段以**可加性**为主，尽量不 bump schema；涉及 hact-app sync 的点单独标注。
- 推送前需人类确认（global CLAUDE.md），本轮实现后不自动 push。

---

## 主题 1：AC 保真链路（最高杠杆，spearhead）

> 根因：PRD 有 AC → TRD 七段无 AC 承载 → plan-sprint 不读 PRD → 任务包 AC 是重新发明 → develop / 对抗审查只认任务包 AC，全链无回溯。

### 1.1 AC 可追溯回链（治 X1+X2 根）— ✅ 定稿（替代 A，2026-06-16 二次讨论后）

> 独立 agent 校验结论：问题成立但 headline 夸大（manual-test 已直读 PRD AC 是"暗回链"，真实形状是"AC 中段失联、两套 AC 无对账、G4 返工"）；原拟「功能号锚定 id」在迭代项目会漂移失效；status.yml `prd_ac_refs` 当前无消费方、属负投资。
> 定稿采纳**替代 A：文本引用回链，不引入稳定 id、不动 hact-app**。
- [x] `specs-execution/plan-sprint.md` 会话启动·必读文件：加入 `iterations/vN/prd.md`
- [x] `specs-structural/plan-sprint.md` 前置条件·文件：加入 `prd.md`
- [x] `specs-execution/plan-sprint.md` Step3：任务包 AC 每条用 **PRD AC 文本引用**回链 `(源：PRD {功能名}·{AC 关键词})`，纯技术约束标 `(技术)`；加 **AC 双向对账自检**（纵向每条任务包 AC 可回链 / 横向 PRD 每条 AC 被覆盖）
- [x] `specs-structural/plan-sprint.md` 完成判据：加 AC 双向对账判据
- [x] `specs-structural/develop.md` 字段规范：`acceptance-criteria` 说明加文本回链 + `(技术)` 标签
- [x] `specs-execution/draft-tech-design.md` Step3 §接口设计：增 `# 满足 AC：{功能名}·{AC 关键词}` + 「AC 覆盖映射自检」（载体放宽为 接口/模块/交互场景，纯前端交互 AC 挂 ux-flows，避免误报）
- [x] `specs-execution/manual-test.md` Step5：AC 验证表加「完备性对账」——须列全 PRD 每条 AC，使两套 AC 对上账

**本条延后（待 hact-app 真做 traceability 视图时连同替代 B 一起上）**：
- ⏸️ 稳定 AC-id（替代 B：全局递增序列 + project.md 台账 + revise-doc id 生命周期规则）
- ⏸️ `skeleton/07-status-contract.md` tasks[] 增 `prd_ac_refs`（需 bump schema + hact-app sync）
- ⏸️ generate-integration-tests / pr-review 的 AC-id 列（无 id 则退化为文本引用，暂不专门改）

### 1.2 ~~对抗审查回注 PRD AC~~ → ❌ 撤销（2026-06-16 二次讨论，走 X）

> 校验 + 讨论结论：往 develop Step5.5 回注 PRD AC 会掺杂其"只审代码对任务包 AC"的焦点纯粹性（第二层独立性）。用户提出更优思路 → 把独立审查移到**源头 plan-sprint**（见 1.2′）。Step5.5 一字不动、保持纯粹。中途漂移（revise-doc 改 PRD/TRD 后 AC 二次漂移）由 revise-doc 兜（见 1.2″）。

### 1.2′ 任务包独立对抗审查（plan-sprint 源头，替代 1.2）— ✅ 定稿 + 落实

> 不对称命题：任务包是杠杆最大产物却只有 CC 自审，下游代码反有独立审查（Step5.5）。补一道独立眼睛，与 Step5.5 对称、内联实现（不复用 adversarial-review skill——那是 B 类代码路径，审对象不同）。时机定在 plan-sprint Step3 后、G3 前（终态工单 / 最后便宜闸 / 参照物齐全 / 一审护全程 / 任务包 vs PRD 直接比对透传抓双漂移）。
- [x] `specs-execution/plan-sprint.md` 新增 **Step 3.5 任务包独立对抗审查**：独立性约束（只读 queue 产物 + PRD/TRD/standards，禁传写包叙事）+ 默认有问题 + 3 类检查（AC忠实性 / AC完备性 / api-contract 推导）+ 边界（拆分/依赖/交付归用户，files 行号留 develop）+ loop（阻断修包重审，同一阻断 3 次→revise-doc(trd)）+ 按包分批
- [x] `specs-execution/plan-sprint.md` Subagent 使用表 + 上下文管理（compact 后高密度区）登记
- [x] `specs-structural/plan-sprint.md` 完成判据加"独立审查通过"

### 1.2″ revise-doc 中途漂移兜底（替代 1.2 的 source 兜底）— ✅ 定稿 + 落实
- [x] `specs-execution/revise-doc.md` Step5：target=prd 改 AC / target=trd 致任务包 AC 更新时，对受影响任务包重跑 AC 对账，更新回链 + 备注「请重新拾取」

### 1.3 plan-sprint 字段自检从「非空」升级为「保真」（治 X3）— ✅ 定稿（替代 A）+ 落实

> 校验结论：原拟三条机械判据只有 1 条半是真机械。"relevant-standards 覆盖强制规范类"是伪机械（standards 无"文件类型→规范"映射表，靠语义）；"有分支必链 ux-flows"的"有分支"不可机械判定；"files 行号必填"与 Step3.5 豁免 + develop.md:34"已知则填"自相矛盾。定稿按"真机械留自检、语义归独审、伪机械记待议"分级。
- [x] `specs-execution/plan-sprint.md` Step3 加「字段保真自检（机械可查）」：① reference 必含行号（拒"全文"）② 前端任务 + ux-flows 存在 → reference 必链 ux-flows 行号条目（去掉"有分支"限定）；并注明 files 行号不卡、relevant-standards 移交 Step3.5
- [x] `specs-execution/plan-sprint.md` Step3.5 独审加第④类「relevant-standards 覆盖」（语义判断，含输出格式/Subagent 表同步）
- [x] `specs-structural/plan-sprint.md` 完成判据：加字段保真 + 独审四类
- [x] `specs-structural/develop.md` `reference` 字段定义：强化"行号必填、不接受全文/无范围"（`files` 不动）
- [x] `_meta/plans/方法论待议.md`：relevant-standards 扶正为真机械（需文件类型→规范映射表）记入，留团队期（替代 B）

### 1.4 ~~全局横切 standards 必读锚点~~ → ❌ 不做（2026-06-16 二次讨论）

> 校验 + 讨论结论：③ 把"plan-sprint 漏列"误诊为"develop 缺通读"。它要治的"横切约定漏列→失明"，**已被 1.3 新增的 Step3.5 第④类（relevant-standards 覆盖，带全局强制项基准）在源头堵住**，末端还有 Step5.5 接口契约审。再给 develop 加"无条件通读 shared"会：① 与 develop"精确加载、不读整份"哲学正面冲突（变相全量加载）② 与第④类冗余 ③ 制造双读语义、引入双源注入污染。单人阶段执行人≈开发者、失明概率低，ROI 为负。
> 分页约定（唯一真缺项）属项目 draft-tech-design 填 shared 时按需补的项目级内容，不入方法论本轮；事务边界后端专属、backend.md 已有，不补。
> 若团队分化后仍需 develop 侧独立锚点，走"极简全局红线卡（≤15 条、有硬上限）"，与待议「设计乙」合并评估，不走通读整节。

### 1.5 后端分支/失败路径（治后端分支白加）— ✅ 定稿（替代 a：不新增字段）+ 落实

> 校验纠偏：病灶不是"draft-ux 红线排除后端"，而是"后端任务包没被要求把 TRD 错误码/服务流程段链进 reference"——后端失败分支的权威来源本就是 TRD（`draft-tech-design.md:130` 接口段含错误码清单 + `# 服务流程`），ux-flows 被红线切断推不出后端校验点。原拟新增 `branch-paths` 字段会破坏"16 字段"整数 + 游离 Step3.5 独审外，弃用。严重度从 🔴 下调到中。用户选 A：只做 (a)，不强制写成 AC。
- [x] `specs-execution/plan-sprint.md`：后端任务 reference 必链 TRD 错误码清单段 + `# 服务流程：{场景名}` 段行号（与前端 ux-flows 硬卡对称），并入 1.3 字段保真自检
- [x] `specs-execution/plan-sprint.md`：前后端对齐锚点——同一 `# 服务流程：{场景名}` 让前端（UI 反馈）与后端（校验/状态）对同一分支不重不漏
- [x] `specs-structural/plan-sprint.md` 完成判据：字段保真加"后端 reference 必含 TRD 错误码/服务流程段"
- 不新增字段、不碰 draft-ux 红线、develop 精确加载已读 reference 行号故失败分支自动进上下文
- 未采纳 (c)（失败路径强制进 AC）——用户选 A，靠开发者看到即实现，不强制 AC + Step5.5 验证

### 1.6 ~~escalate-if 对「平滑做错方向」敏感~~ → ❌ 不做（2026-06-16 二次讨论，选 B）

> 校验 + 讨论结论：三个理由叠加——① 它要治的"平滑做错"**已被本轮 Step3.5 独立审在源头治**（独立第三方才是正确机制）② develop 自检治不了平滑做错（**自指悖论**：盲区就是意识不到，"意识到盲区就上报"逻辑无效）③ 原拟改法与"develop 不碰 PRD / Step5.5 纯粹"决策冲突，且 **B 类任务包无 PRD 回链是正常态、会被每个 B 类误报**。
> 残余场景（历史包、回链漂移）：历史包一次性手工清理；revise-doc 改坏回链已由 1.2″ 兜。develop 侧不重复设防。

### 1.7 跨任务全局不变量 — ✅ 定稿（落地 depends_on，替代 a）+ 落实

> 校验纠偏：主张 A 真，但真正的洞是**既有 P1——`depends_on` 在 status.yml/develop.md/plan-sprint 已存在，却不在 `specs-structural/develop.md` 16 字段表里**（骨架-执行层脱节，跨层一致性#1）。正确解是落地 depends_on（消费方靠反查、不另存），不是塞 known-risks（属性错配 + 消费方完整性机械不可查，重蹈 X1）。原拟两条均弃。
- [x] `specs-structural/develop.md`：16→**17 字段**，新增 `depends_on`（必填、可空 []；含编译/接口依赖 + 共享资产消费两类；消费方反查得出）
- [x] 同步全仓"16 字段"→"17 字段"：`specs-execution/plan-sprint.md`、`specs-structural/plan-sprint.md`、`specs-execution/dispatch-new.md`、`specs-structural/dispatch-new.md`、`guide/03-BUG与优化处理.md`
- [x] `specs-execution/plan-sprint.md` Step3：加 depends_on 填写说明（接 Step2 依赖列，三处一致）
- [x] `specs-execution/develop.md:273`：`depends-on`→`depends_on`（与 status.yml 命名统一）

**本条延后团队期（记 `_meta/plans/方法论待议.md`）**：
- ⏸️ Step3.5 独审第⑤类「共享资产依赖完备性」（交叉比对 files 校验 depends_on 边标全）——多任务并发才咬人
- ⏸️ develop 选读 decisions.md（主张 B：decisions.md 空表 + 无 files 映射键，风险未发生）

---

## 主题 2：status.yml 健壮性

### 2.1 写入后 YAML 校验 — ⏸️ 当下不做（2026-06-16 用户决定，选 B），记待议

> 校验决定性发现 + 用户判断：处于"**新老方法并行阶段**"——hact-app `sync.service.ts` 仍读 markdown、不读 status.yml，仓里也无 status.yml 文件，status.yml 是"只写没人读"。写入校验价值要等 hact-app 切读才兑现。完整设计（Node schema 脚本 + 分级 + 读回 + 进 07）已记 `方法论待议.md`，与"hact-app sync 切读 status.yml"迭代捆绑做。
> 校验另纠正：拟改的"语法校验≠schema校验"（脏枚举被 hact-app 静默降级，语义错更隐蔽）、手敲 python/node 命令跨平台脆弱（校验器自身报错会误判误阻断）、"无回滚"是 hact-app 侧责任。

### 2.2 接续一致性核查 — ⏸️ 当下不做（与 2.1 同因，记待议）

> 用户"新老方法并行阶段"原则延伸：2.2 本质是 status.yml↔markdown 对账，status.yml 未活时空转，与 2.1 一并延后到 hact-app 切读 status.yml。残余"markdown 自身半写入检测"单人阶段价值薄。

### 2.3 compact 原子性 — ✅ 定稿（reframe 替代 a）+ 落实

> 校验判定原方案打错靶：compact 发生在 turn 之间、不威胁已落盘文件，"写一半被 compact"是伪命题；"没 commit"的真实风险是 /clear/crash/覆盖（非 compact）。原拟"compact 前加 commit+读回"= 冗余仪式（Write 成功即落盘）+ 错配挂点 + 污染 git 历史。
- [x] `templates/CLAUDE.md` 跨会话接续规则：加「断点续做对账原则」——以工作区 / `git diff` 为准核对 progress.md，冲突信工作区，不凭过期 progress.md 重复实现（一处覆盖全 task、零 git 污染）
- 不动四处"上下文管理"；progress.md 不强制进 git；develop 重置协议 commit 留团队/跨机

> done 状态语义（A-P2-11）、merged 版本追踪（A-P1-15）属决策层 → 本轮不做。

---

## 本轮收口（2026-06-16）

用户定：**做完 2.3 本轮结束，其余下期再做。**

### 本轮落实（spec 实改）
- **主题 1 AC 保真链路**：1.1 AC 文本回链 ✅｜1.2′ plan-sprint 独立审查(Step3.5) ✅ + 1.2″ revise-doc 兜底 ✅｜1.3 字段保真分级 ✅｜1.5 后端 reference 链 TRD ✅｜1.7 depends_on 落地(17 字段) ✅
- **主题 2**：2.3 断点续做对账原则 ✅

### 本轮经校验否决/不做
1.2（回注掺杂 Step5.5 纯粹性）｜1.4（与 Step3.5 冗余 + 破坏精确加载哲学）｜1.6（自指悖论 + 已被 Step3.5 上游治 + 误报 B 类）

### 下期再做（已记 `方法论待议.md` / 本文件）
- 2.1 status.yml 写入校验 + 2.2 接续一致性核查 → 捆 hact-app 切读 status.yml 迭代
- 主题 3（会话初始化：task.type 确认门 / 单会话单 task / 推断表盲区 / develop 起始分支）
- 主题 4（双源 management 跳过 + notes 建议清单）
- 团队期：1.7 共享资产完备性检查、decisions 选读、relevant-standards 映射表、全局红线卡（设计乙合并）
- 决策层（动 BRIEF.md）：Gate 自我验证 / B 类 2 会期 / done 状态 / merged 版本追踪
- 过时项：A-P2-5 schema-change 检测重挂 pr-review/adversarial-review

### 受影响文件（本轮实改，11 份）
specs-execution: plan-sprint / draft-tech-design / manual-test / develop / dispatch-new / revise-doc
specs-structural: plan-sprint / develop / dispatch-new
skeleton: 07-status-contract
templates: CLAUDE.md
guide: 03-BUG与优化处理
（+ _meta/plans/方法论待议.md 记延后项）

---

## 主题 3：会话初始化 / task.type 确认

### 3.1 推断后强制确认阻断（A-P0-1）
- [ ] `templates/CLAUDE.md` Step1：推断 + 状态摘要后增 🚫「我推断当前任务是 X，将加载规范 Y，请确认」，等用户明确回应，禁止自动滑入规范执行

### 3.2 单会话单 task（A-P1-12）
- [ ] `templates/CLAUDE.md` 跨会话接续规则：增「单会话只服从一个 task.type；已声明任务不得同会话内切换，换任务开新会话」
- [ ] `skeleton/01-identity.md` §2/§4：补承认"心态切换靠自律非技术约束"+ 单会话单 task 原则（轻触）

### 3.3 推断表盲区补行（A-P2-1）
- [ ] `templates/CLAUDE.md` Step1 推断表：补早期行（sprint.md 不存在 + G1 未签→draft-prd-vN；G1 签 G2 未签→draft-tech-design；G2 签 G3 未签→plan-sprint）；补 B 类（读 b-tasks.md/b-queue 列 [可取]）；补多迭代（扫所有存在 queue/ 的版本）

### 3.4 develop 起始分支（A-P1-2）
- [ ] `specs-execution/develop.md` 会话启动·拾取任务：拾取后立即 `git checkout -b {task-id}`（从最新 master），认领 commit 落功能分支；与 Step6 分支规则呼应

> 多人共用机器归属（A-P2-2）属团队期 → 本轮不做。

---

## 主题 4：双源规范 management 空合并 / 错误注入

### 4.1 management 跳过双源（A-P1-17 + 决策#23↔#20 矛盾）
- [ ] `specs-execution/draft-tech-design.md` Step4：增前置检查——执行人主 discipline 为 management（非 architecture/dev-*）→ 跳过双源 notes 合并，仅用公共模板+上期 standards，明确告知用户

### 4.2 notes 改「建议清单」+ G2 逐条确认（A-P1-11）
- [ ] `specs-execution/draft-tech-design.md` Step4：notes 来源条目改为单列「待评估条目」，不直接并入；Step6 G2 确认时由用户逐条确认是否纳入再写入最终 standards
- [ ] 同步更新 Step4 subagent prompt（notes 条目产出为建议清单而非直接合并）

---

## 本轮不做（明确登记，避免遗失）

| 项 | 归属 | 原因 |
|---|------|------|
| 并发冲突 / 多人共用机器 / 跨任务阻塞 / 冷启动人工路径 / hotfix 分支冲突 / hotfix 立即 push | 主题 5 团队期 | 无 5-8 人团队 |
| wrap-up feedback 死锁 / harvest 量化 / notes 仓不存在降级 / B 类即时记录钩子 | 主题 6 团队期 | 同上 |
| Gate 自我验证 / B 类 2 会期 / done 状态语义 / merged 版本追踪 | 主题 7 决策层 | 需动 BRIEF.md，下一轮 |
| CC 不可用降级 / hact-method↔hact-app 同步 / 联调防幻觉与验收边界 | 主题 8 韧性 | 优先级低 |
| A-P2-5（schema-change 检测挂 DW）| 过时项 | DW 已删；底层关切重挂 pr-review/adversarial-review，并入主题 8 |

---

## 受影响文件清单（约 10 份）
specs-execution: develop / plan-sprint / draft-tech-design / draft-prd-vN
specs-structural: develop / plan-sprint / draft-ux
skeleton: 07-status-contract / 01-identity
templates: CLAUDE.md / standards/shared.md

## 阶段
| 阶段 | 状态 |
|------|------|
| 读两审查 + 通读在范围 spec | complete |
| 制订统一调整方案（本文件）| complete |
| 用户确认方案 | 待确认 |
| 落实编辑 | 未开始 |
| 自检（交叉引用一致性 + YAML 校验示例可跑）| 未开始 |
