# STATUS 历史里程碑归档

> 本文件是 `STATUS.md`「历史里程碑」的完整存档，`STATUS.md` 只保留一行索引 + 指回本文件。按需查阅，不随 `@STATUS.md` 常驻加载。

## 历史里程碑

### 2026-07-12 方法论调整：foundation-review 证据化收紧（G1 探针通用化 + G2 自绿复现化）

> 触发：doc-extract V0 走骨架完整跑通后二轮独审（Codex 独立对抗复核）暴露"声明档 > 实测档"。两轮对比给出干净证据链——一轮 foundation-review（默认模型）签"0 阻断"、把五类**非安全构造级洞**（结构类型可绕/`window.fetch` 可绕/DB 原地覆盖未挡/状态机合法边裸 SQL 可绕/router 可加顶层路由）判无发现；二轮（提示词强制"判构造级前必须亲手撞反例"）判同批为阻断。唯一结构差 = 执行化探针的强约束。**证 brief 严苛度 > 模型大小**（一轮默认模型也漏 = 审查方法问题、非模型能力问题）。

- **G1 探针通用化**：`foundation-review.md` 原把"亲手写可达反例"只绑安全项，非安全构造级声明走"读代码反推"——正是漏判滑过那格。改为**对每个 ≥机械级声明通用**：判构造级前写绕过代码、跑对应检查（tsc/eslint·stylelint/裸 SQL/加匿名·越权路由）、必须真被挡；保留安全项"可达性"附加判据（JHH 教训）；加探针纪律（临时反例跑完即删、不进 commit、还原临时配置）；输出逐关注点表加"反例验证"列。
- **G2 自绿复现化**：原"build/type/lint/test 全绿吗"改为审查员**亲自干净环境跑一遍 + 记命令→结果表**；两类失败分开——仓库不可移植/配置缺失=阻断、纯审查环境特性=不阻断但标注；标杆切片跑不起来=自绿阻断。
- **G3 搁置记待议**：机械级是否强制"接进自动门（CI/pre-commit）"——纯残余=新增常驻 CI 基建=撞冻结，且 G1+G2 已吸收大半；价值随第五阶段真人 push 上升（真人 commit 不走 develop 自绿），与决策#24 恢复人工 merge 门同点重评。落地候选：Gitee Go / pre-commit 钩子（本仓门卫先例）/ develop 自绿。
- **冻结相容**：收紧现有 foundation-review 门、非新增机制，正是 2026-07-08 冻结在等的"库存过一轮真实迭代"驱动的反馈。落点净：一份运行时文件（foundation-review.md）+ BRIEF #25 子注 + 记账。
- **附带**（Haiku 独审质量疑问，用户提出）：empirical-harvest 补记清单加"Haiku 降档独审漏网率"仪表化项——本环境 risk 链从未部署（53 包 risk 出现 0 次），存量答不了，属前向仪表化；先试 brief 严苛度补、补不上再议升档。
- 设计沉淀 `_meta/plans/2026-07-12-foundation-review-probe-tightening/design.md`。

### 2026-07-08 实证回收（empirical harvest）——用两个试验田的实测记录判定"复杂度是否超过收益"

> 触发：用户对"越做越复杂、收益递减"的担忧 + 评审条目【全-2】。决定放弃分析式复杂度收敛，改为回收 mail-ai（v5–v8 四轮完整 G1–G5）+ JHH-Nortion（v7 完整 G1–G5，Next.js 栈）的全量实测记录做判定。判据先立后挖，全文见 `_meta/plans/2026-07-08-empirical-harvest/findings.md`。

- **触发率大盘**：develop 阶段 B 独立对抗审查 ≈70 条阻断性 finding（含 RLS 漏写 user_id、单测假绿、XSS/IDOR 类），误报记录仅 1；安全敏感人工裁决真实触发 2 次（v6-003 数据隔离、b-001 认证）；manual-test ≈19 次拦截（含 2 个真实外部 API bug）；集成测试拦截率仅 2/118。
- **缺陷逃逸归因**（mail-ai 8 条生产 bug）：≥5 例落"真实外部边界"（Outlook/飞书/IMAP 真实数据/OSS 规模）、唯一 hotfix（b-019 静默丢邮件）根性质是生产可观测性缺失；输入侧规范/审查能拦而漏的 ≈0。执-4 方向证实并收窄：**真实外部边界冒烟 + 生产静默失败告警**，而非更多仓内测试。
- **成本曲线**：mail v5–v8 每轮全 Gate 2–2.5 天/8–10 包，方法论期间四次大改而节拍未变慢。新旧质量对照不可量化（旧期协调文件为 5/16 回填、无 bug 总账），已如实声明。
- **总判定**：已部署机制死重极少（仅 escalate-if 零触发，近零成本）；复杂度疑点全部集中在 6/29 后新增且**从未部署**的库存（#25 V0/foundation、#26/#29 risk 链、#27 栈子模板、#28 ⚖️）。处置：**冻结新增机制，库存过一轮真实迭代后按同法回收再判**。改造候选：generate-integration-tests（向真实边界改造）、api-contract（实体直传盲区）。数据缺口补记清单 5 项（判官留痕/⚖️ 推翻率/独审误报标记/risk 分布/token 计量）。
- 附带修正：全-5"status.yml 只写没人读"部分修正——本次审计以 status.yml/status-history.yml 为主数据源，审计消费首次成立（应用侧切读仍待做）。

### 2026-07-08 方法论调整：安全敏感判定多层化（决策#29，risk 不信自报）

> 触发：全局方法论评审条目【全-1】——决策#24（自审自合并）+ #26（standard 降档 haiku）+ `risk` 由 plan-sprint/dispatch-new 自报且 check-sprint 不校验，三个各自合理的决策叠加出"漏标 sensitive → haiku 审 → 自动进 master"的无机械拦截链；B 类无 G3 检查器，同险更甚。

- **五层防线（只升不降，`risk` 自报不再是安全档位单点输入）**：
  1. 填包规则「存疑即 sensitive」——plan-sprint Step 3 表 / dispatch-new 关键字段表 / `templates/queue/task-package.md` 注释三处同步。
  2. plan-sprint Step 3.5 独审 brief（`task-package-review.md`）增第⑥类「risk 标注核对」：包内容触及四类而标 standard = 阻断（改标即修）；标 sensitive 但看不出触及 = 建议（允许从严保留）。
  3. `templates/scripts/check-sprint.js` 新增检查 7「risk 启发核对」：敏感启发词（四类词表，中英）命中而未标 sensitive → `🧑` 段点名提示（启发式有误报，不做 FAIL）。冒烟验证：漏标鉴权任务被点名（命中"鉴权、密码、auth、jwt"），已标 sensitive 的迁移任务静默。
  4. develop 阶段 B 模型分级改按**有效 risk**：自报 sensitive ∨ 主线按四类语义扫任务包命中 → 不降档，并回改任务包与 status.yml 的 `risk` + 播报升档理由。
  5. develop 末端安全敏感预检显式**基于 diff 独立判定、不读 risk 自报**（对照 diff 路径与改动内容，存疑按触及）+ **漏标闭环**：判定触及但曾被降档审过 → 先重派默认模型独审（重审通过才进 architecture 裁决）。
- **分工**：①②③ 住 A 类 G3 链；④⑤ source 无关，同时兜 B 类（B 类唯一防线）。启发词表单一来源住 check-sprint.js（机械层），develop 侧用四类语义判断、不复制词表。误报代价 = 多花一次默认模型独审，相对 #26 降档收益可接受。
- 顺手修正：`task-package-review.md` 第 5 类残留的栈词（`--el-color-primary`/`variables.scss`/`main.ts`，决策#27 漏网）抽象为"按项目栈"。
- 联动：specs-structural/develop.md risk 字段与完成判据、skeleton/06 G3 覆盖描述、plan-sprint Step 3.5"查六类"与 Step 4.7 描述。计划沉淀 `_meta/plans/2026-07-08-risk-defense-layers/`。

### 2026-07-08 方法论调整：exec spec 受众分离（历史注解清扫 + 写作纪律）

> 触发：全局方法论评审条目【执-2】——运行时被 CC 逐字消费的规范正文里混着写给维护者的历史注解（日期出处、退役对照、迁移注记、事故代号、内部计划代号），按决策#26 成本逻辑每次会话烧 token 且稀释指令密度。评审全文落盘 `_meta/plans/2026-07-08-method-review/findings.md`（9 条目 + 处理状态表）。

- **实测修正**：逐条枚举后 specs-execution 纯历史注解仅 8 处，重灾区在 skeleton/06 §7 与 specs-structural——评审时把三层阅读印象叠加了。本轮主产出因此是**防回潮纪律**，清扫本身收益中等。
- **清扫**（三层，用户确认范围）：exec 8 处（含上轮新增的 Step 2.5 迁移注记——回潮活例）+ templates/frontend.md v8 代号 + skeleton/06 §7 四块（"子计划 3/3b/3c"引言收敛为「检查器覆盖内容 + 设计沉淀路径指针」，"活体标本…整段退场"叙事删，操作内容全保留）+ structural 3 处（序列化锁定退役叙事、"替代旧 pr-review"、"方案甲"代号）。develop 的日期出处改「决策#24」短指针形态。
- **判定原则（入 CLAUDE.md 新节「方法论文件写作纪律（受众分离）」）**：运行时文本正文只留 做什么 + 操作性 why + `决策#N` 短指针 + 设计沉淀路径；日期出处/退役对照/迁移注记/事故代号/计划代号不入——canonical 已在 BRIEF/status-history/plans，不建第三份存档；每轮调整收尾自查新增文字。
- **保留判定**：`（决策#20）`类短指针（why 外置的正确形态）；操作性"旧"（deploy 保留旧版本运行、存量"旧序列化格式"判定条件）；skeleton/README、03、07 的注记（非 per-task 运行时加载，留后续）。

### 2026-07-08 方法论调整：技术栈剥离 + 确认点分级（决策#27/#28）

> 触发：全局方法论评审（本仓 CC 会话）指出两个结构问题——①栈词汇（Vue/NestJS/EP 变量名）渗进骨架层，方法论实际成了"Vue+NestJS 专用版"；②一期主线 20+ 次人工确认无分级，可推导判定与人拍板混在同一档。用户确认后两条同轮落地。

- **决策 #27 技术栈剥离**：
  - 新建栈子模板 `templates/standards/frontend-vue3.md`（Vue 组件/SCSS/EP 使用+陷阱/Pinia/Vite）+ `backend-nestjs.md`（TypeORM/class-validator/NestJS 路由陷阱/Node 日期陷阱/dotenv）；通用模板 `frontend.md`/`backend.md` 瘦身为栈无关原则，头部声明双层关系。
  - `skeleton/03-disciplines.md` 去栈措辞（dev-frontend/dev-backend/integration-testing/deploy 四处）；specs-execution 五份点改（draft-tech-design/draft-foundation 视觉地基条款变量名抽象、plan-sprint EP→UI 库、manual-test vue-tsc→type-check、develop checklist 工具名注"按项目栈"）。
  - standards 播种双源升三源：通用模板 + `project.md` 技术层路由的栈子模板 + 个人 notes `[规范]`；无对应子模板退回通用。draft-tech-design Step 7 与 draft-foundation Step 4 同步。
  - 不动：工具依赖层（Gitee/pinchtab/pm2/nginx 声明式引用）、checklist 栈拆分（记待议）、skeleton/07 CRDrawer.vue（看板应用事实）。
- **决策 #28 确认点分级**：
  - 步骤协议统一升级（12 份 exec spec）：非 🚫 步骤去掉"继续？"直接续跑；新增 ⚖️ 档（按既定规则默认判定 + 输出结论理由 + 直接继续 + 用户可推翻）。deploy 已是 auto-run 不动，develop 无协议行。
  - plan-sprint Step 2.5 交付方式并入 Step 2（判定规则原样保留，改为 ⚖️ 随骨架一并确认），净减 1 个硬阻断；develop 第零步执行层 ⚖️ 自动判定（仅两层都有可取任务才问）；draft-prd v2+ 建目录不等确认、Step 4 增 vN+1 继承/继承·微调批量确认（新增/重构/简化仍逐个，v1 不受影响）；4 个会话启动选项列表（plan-sprint/draft-tech-design/manual-test/wrap-up）加"开场已明确主线意图则跳过"。
  - 保持 🚫 不动：疑点清单、骨架方向、TRD 内容确认、五个 Gate 签字、前端设计门、manual-test 验收循环、draft-ux 全部、init-project 信息收集。
- 联动更新：BRIEF 决策 #27/#28、skeleton/README 决策数 26→28、templates/sprint.md Step 2.5 引用改 Step 2、待议清单（2026-06-22 后端条目⑤标已落地 + 新增 checklist 栈拆分待议）。计划沉淀 `_meta/plans/2026-07-08-stack-decoupling-confirm-tiering/`。

### 2026-07-06 hact-method-lab 独立成仓 — 从 hact-method 的 worktree 切断为独立仓库

> 触发：用户判断新旧方法并行对比阶段已经结束，`method-lab` 分支承载的新方法应该有自己独立的项目身份，而不是继续挂靠在旧仓库 `hact-method` 下当一个分支/worktree。

- **决策**（AskUserQuestion 确认）：新建独立 Gitee 仓库（而非同仓改主分支）；带完整提交历史（而非从当前状态重新起一个初始 commit）；旧基线 `hact-method`（master 分支）原样保留不动；新仓库名 `hact-method-lab`，主分支名改回 `master`。
- **执行**：
  1. 用户在 Gitee `dingxifan` 企业下手动建空仓 `gitee.com/dingxifan/hact-method-lab`（不勾 auto_init，避免和待推送历史冲突）。
  2. 本地加临时 remote `lab`，`git push lab method-lab:master`，推送 261 个 commit（HEAD `15971c3`），推送后核对新仓库 HEAD 与本地一致。
  3. **worktree → 独立仓库的转换**：`hact-method-lab` 此前是 `hact-method` 仓库的 linked worktree，对象库实际存放在另一个 worktree（`/mnt/e/group-code/hact-method/.git`），只改 remote 地址不能解除这层依赖。做法：把旧目录整体 `mv` 成 `hact-method-lab.oldworktree`（不删除，留作安全网）→ 在原路径 `git clone` 新仓库得到真正独立的 `.git` → 把旧目录里唯一的未提交内容（`_meta/sessions/` 下两份 Pilot A 交接文件）手动拷回新目录 → 从旧仓库里 `rm -rf .git/worktrees/hact-method-lab` 清掉失效的 worktree 管理记录（`git worktree prune` 对此场景不生效，因为新目录路径仍然存在、只是内容变成了另一个独立仓库，prune 的"路径缺失"判定不触发，需要直接删管理目录）。
  4. 核对：新目录 `git status` 干净、`git remote -v` 指向新仓库、`git log -1` 与推送前一致、旧仓库 `git worktree list` 不再出现失效条目。
  5. 更新 `STATUS.md`「仓库拓扑」一节，反映独立仓库现实；旧的两 worktree 并行对比描述整体改写、历史备注保留供追溯。
- **有意保留的无害残留**：旧仓库 `hact-method` 里的 `method-lab` 分支未删除（迁移前的推送记录，不再更新，不影响新仓库）；`hact-method-lab.oldworktree` 备份目录暂留几天再由用户决定是否删除。
- **未变**：旧基线 `hact-method`（`/mnt/e/group-code/hact-method`，master 分支）仓库本身、内容、远端一个字节都没动。

### 2026-07-02 Codex 适配层成本立论修订 — 补合并权归属说明 / 长短卡同步检查 / 人工交接操作细节

> 触发：审阅 2026-07-01 新建的 `codex-adapter/` 草案，发现四处缺口需在扩大试点前补：立论前提不稳、develop 合并权归属描述像是退回决策#24 之前的模型、长卡短卡无同步机制、"人工交接"缺具体操作步骤。改动范围全部限定在 `codex-adapter/` 实验区内，不动方法论主体。

- **立论改为"控成本"**（README.md / context-strategy.md）：把"Codex 上下文比 CC 小"这个会随模型版本变化的不稳定前提，换成"可验证执行类任务不需要为完成任务反复支付长上下文加载成本"；并要求 Pilot B/C 扩大前先对比 Codex 与 CC+haiku subagent 的实际花费（决策#26 已把纯审查/一致性核对类 subagent 降级为 haiku，`review.codex.md`/`consistency-check.codex.md` 场景高度重叠），避免在收益不明时多维护一套工具链。
- **develop 合并权归属澄清**（develop-handoff.md / develop.codex.md）：明确"Codex 不直接合并、不直接签 Gate"是试点期临时保守设置，用于协议未验证前控制风险，不是退回决策#24（develop 内置独立审查即可自合并）之前"审查之外还要再过一道人工合并门"的模型；Pilot C 验证协议可靠后应放开为审完即合并。
- **长卡/短卡漂移检查**（consistency-check.codex.md 新增第 7 类检查、method-change.codex.md 加同步提醒）：规定检查触发时机（长卡改动后/短卡改动后/wrap-up 或 harvest-notes 时抽查）与判定标准——两者独立维护允许细节滞后，但禁止事项、退回条件、安全敏感判定这三类核心约束不能出现矛盾。
- **人工交接操作细节**（README.md 新增「人工交接怎么操作」章节、pilot-plan.md、evaluation-checklist.md）：明确交接包必须先落盘为仓库内真实文件（推荐路径 `_meta/sessions/{task-id}-{类型}-handoff.md`），Codex 开场指令只指路（"读取 X，按 Y 执行"）不重复口头背景，并在评估清单/试点记录模板加对应检查项和成本对比字段。
- **主方法论侧的确认**（未改动）：Codex 定位为执行工具而非新身份维度（`01-identity.md` 身份模型不变）；`02-workspaces.md` 三工作区模型不变，项目根心态下执行人可以是 CC 或 Codex，属实施细节不改模型；`status.yml`/task-package 暂不加 `executor` 字段，等 Pilot C 有结果、真要把 develop 任务正式派给 Codex 时再评估。

### 2026-07-01 新建 codex-adapter/ 实验区 — CC+Codex 混合执行草案，不改动正式方法论

> 引入 Codex 作为可选执行工具的第一阶段草案。目标：让边界清晰、可验证的执行任务（文档局部修改、独立审查、单个 develop 任务）可以交给 Codex 短上下文执行，语义收敛类工作仍由 CC 长上下文承担。

- **初始文件**：`README.md`（目标/设计原则/试点顺序）、`context-strategy.md`（短上下文运行策略：文件化交接/精确行号引用/分片加载/expand-read 协议）、`task-routing-matrix.md`（13 个 task type 逐条判定 CC/Codex/混合执行）、三份 handoff 模板（develop / review / method-change）、四份短卡（`specs/*.codex.md`：develop / review / consistency-check / method-change）、`pilots/`（pilot-plan.md 定 A→B→C 试点顺序 + evaluation-checklist.md 评估表）。
- **设计原则**：不靠聊天记忆交接（必须落盘）、Codex 不猜上游语义（冲突即停止退回 CC）、权威来源优先于执行者自评、短上下文优先（按 handoff 精确读取不默认读全文）、可验证优先（能跑脚本/测试/`rg` 的不交给模型记忆）。
- **范围声明**：第一阶段不改动 `skeleton/`、`specs-structural/`、`specs-execution/`、`templates/`、`guide/`，待试点验证后再决定是否回填正式方法论。
- **commit**：`7b8fc89` docs(codex-adapter): 新建 Codex 适配层实验区（草案阶段，不改动正式方法论）。

### 2026-06-29 地基层 + V0 走骨架（主管线重构，BRIEF 决策#25）— 两轮独审收敛，15 commit 已推送 origin/method-lab

> 触发：接 2026-06-28 视觉地基三件套，把它放大成一类普遍盲区——「按页/功能切包天然漏掉的跨切面公共件」（R2/R3）。一路讨论收敛出**地基层**模型并落地为主管线重构。设计全程沉淀 `_meta/plans/2026-06-29-foundation-walking-skeleton/`（task_plan + findings 十节 + progress）。

- **模型**：地基形式由"业务代码怎么碰它"定（说它/穿过它/住进它/被它笼罩/往里填 五形式）；强制边三档（构造上不可能 > 机械探测 > 人审）是命门「图省事的人顺手写多大概率合规」的背面；两进料口（技术内生可清单化 / 领域涌现从早期探讨摸）；准入门槛=已证明跨切面 + 稳定。mail-ai/JHH 实测：两成熟项目数据隔离都守在**人审弱边**（手写 where、当场逮到 remove 漏 accountId）——「bar 不在上游立、再好的团队也滑到弱边」是地基蓝图必须前置的硬证据。
- **新管线**：`init-project`（+共识讨论步→播种 `foundation.md` 地基蓝图）→ **V0 走骨架**（`draft-foundation` 设计签 G2(v0) + `develop(source=foundation)` 建最小空壳+标杆切片）→ V1（PRD 挂领域地图 / draft-ux 填 token 进 V0 框架 / tech-design 瘦身读栈+增补 / plan-sprint 视觉地基包框架值二分）。
- **关键判断**：① 新建 `draft-foundation` **不拆** tech-design（身子不相交）② develop **不拆**、`source=foundation` 一味（共享核心、只差进料 = sub7 撤回的格，与①相反）③ Gate 复用 G2(v0) ④ 代码生成删（CC 即生成器，标杆模块升主防线）⑤ standards/reusables 载荷重分配。task 12→13，discipline 仍 8。存量项目首期簇在 tech-design 保留兜底。
- **post-V0 增长**（阶段9，回答"地基 V0 后怎么长"）：与 V0 同构摊进 V1+——draft-tech-design Step7 增补 foundation.md（识别新跨切面关注点，准入门槛挡膨胀）+ plan-sprint 地基跟进包触发泛化（design.md 或 foundation.md 变更）+ develop 反馈地基缺口回流。补上"地基只建不长"的洞。
- **9 commit（method-lab）**：阶段2 `ce7e639` ／ 阶段3 `1376ee4` ／ 阶段4 `ebe7328` ／ 阶段5 `d70de1d` ／ 阶段6 `8ad216f` ／ 阶段7 `06c0afd` ／ 阶段8 独审整改 `c7c85df` ／ STATUS `acd49dc` ／ 阶段9 post-V0增长+复审两新缝 `5835f45`。
- **状态**：**过两轮独立审查、均收敛**——①首轮 9 finding 全修（F1/F5 真漏=B→A 翻案未回扫，被逮到；簇B 补 V0 生命周期接线；F9 加跳过档）②簇B 复审：F2/F3/F4 真闭合、簇A 扫净、零阻断，仅两建议级新缝（V0→V1 routing 落表 + draft-prd 文字纠正）已修。blueprint-layer 已收编。**2026-07-01 会话已连同后续 4 commit（含本条 STATUS 更新记录）一并推送 origin/method-lab。**

### 2026-06-29 hact-app 概念脱钩（方法独立性）+ 行为管线/演进说明 WIP 归档 — 三 commit 已 push

> 触发：核对工作区时发现一批未提交 WIP（2026-06-26 行为规格管线 + 2026-06-25/28 规划草稿 + 两份演进说明），且用户指出 `hact-app` 概念在本 worktree 与方法耦合过深、应清理以保方法独立性。本地 `method-lab`，**已 push**（`16e7c4b..c6b9a8c`）。

- **对齐纠正（关键）**：`hact-app` 不是"又一个用本方法开发的普通项目"，而是方法的**伴随看板/管理端应用**——`status.yml` 状态契约为它取数而设（skeleton/07）、init-project Step 5 把新项目**注册进它**、Gate UI/identity Web 端/state-machine 并发模型都假设它在场。第二重身份（状态看板基础设施）才是耦合根源。
- **决策（用户拍板）**：**改名脱钩、保留机制**——所有机制（status.yml/状态契约/注册/UI）一个不动，只把专有名 `hact-app` → 通用角色名 **「看板应用」**。范围 = **规范层 + 框架文档**；`_meta/plans` 历史不动。
- **落地（21 跟踪 + 演进说明，纯重命名 84/84 无内容增减）**：skeleton（01/05/06/07/README）、specs-execution（init-project/plan-sprint）、specs-structural（init-project）、templates（status.yml + gitee-ops 命令）、skills/gitee-ops、guide（00–04/99）、BRIEF/CLAUDE、`_meta/hact-config.md`、演进说明正式版。
- **特殊判断**：① `hact-config.md` 是真实运维配置——只改标签、**保留部署地址/token 值**；② 被当项目名举例的 `hact-app` → 历史真样例 `mail-ai`（structural 用 `org-krm`）；③ gitee URL 示例 → `mail-ai.git`；④ guide/01 走查示例原是"建 hact-app 再注册进 hact-app"的循环，例子项目改 `mail-ai`（邮件协作工具）消圈；⑤ sed 替换产生的中日韩字符间多余空格用 `C.UTF-8` locale 清掉，保留中英间正常空格。
- **有意保留**：STATUS 的 `历史里程碑 / 仓库拓扑 / 2026-05-08 快照` 仍有 19 处 `hact-app`——带日期的事实记录 + hact-app worktree 物理仍在，按"不伪造历史"原则只清「当前阶段」框架行。
- **三 commit（已 push `origin/method-lab`）**：① `f2449be` feat 行为规格管线落地（PRD 功能类型触发 + draft-ux 行为待决扫描 + 项目根路径一致性 + CLAUDE 表格化，实现 2026-06-26 设计）② `3c49a42` refactor hact-app 脱钩 ③ `c6b9a8c` docs 演进说明补视觉地基三件套 + 三份规划草稿。三组文件无重叠，干净分离。

### 2026-06-28 视觉地基三件套 — 并入 2026-06-22 前端一致性框架，补「跨切面地基」结构盲区

> 触发：hact-app v8 开发包全 [merged] + 绿测试 + 联调 35 全绿，人工验收一打开即 15 条系统性视觉偏离（主色全错 EP 默认 #409eff vs 设计 #3370ff / 16px 视口外溢 / 侧栏宽 180 vs 208 / 脚栏带整块没做）。根因四缺口 R1（token 定义没接线）/R2（无全局基线层）/R3（跨组件地基活无人认领）/R4（像素无机械门禁）。

- **定性**：v8 与 parked 的 2026-06-22 前端一致性框架（待议 #17）**同根**。R1/R4 框架已识别；**真新增量 = R2/R3**——旧框架是「逐组件复用 + 逐规则 lint」视角，假设每个违规挂在某业务包里，但 EP 主题覆盖 / 全局 reset / body margin 这类**跨切面公共件不属于任何业务页**，plan-sprint 按页/组件切包天然漏掉（reusables 与 lint 两道防线之间的结构缝）。**「视觉地基包」是这次最有价值的产出**。
- **两处类别纠正**（用户原稿）：① token 落地**不能写进 check-sprint/check-gate**——这俩 linter 核 markdown 产物、**G3 时还没代码**；裸 hex grep / 主题覆盖 / 全局入口是**代码级**，必须落 develop 的 stylelint+lint 层。② 具体 stylelint 规则是**技术栈层**（哪个 UI 库/哪些路径），由 draft-tech-design 在项目仓播种，**不在 hact-method 建通用 check-visual-tokens.js**。
- **三件落地**（用户拍板口径：地基包 v1 硬性必有 + design.md 变更触发 / 视觉冒烟涉基线迭代必跑 / 本轮只落三件不碰组件复用）：
  - **① 视觉地基包**：plan-sprint Step 2 骨架规则（v1 含前端则地基包为前端首包、其余 frontend `depends_on` 它，内容 = 全局 reset + UI 库主题覆盖 + token 全局接线，标 `baseline: visual`；vN+1 design.md 变更触发地基跟进包）+ Step 3.5 brief 第⑤维度「视觉地基完备性」+ `check-sprint.js` 硬核（v1 含前端无 `baseline:visual` 包 → FAIL；vN+1 退 human）+ task-package 模板标记说明。
  - **② token 落地门禁**：`standards/frontend.md` 补两条强制（单一全局样式入口 + UI 库主题覆盖、禁库默认主色）+ `frontend-checklist.md` 段一加两机械项（全局入口存在 / 主题被覆盖，地基包 PR 必核）+ `draft-tech-design.md` Step 7 加「视觉地基约定」owner 块（与「测试基建约定」并列）。
  - **③④ 视觉冒烟断言**：`generate-integration-tests.md` 完整档涉视觉基线迭代**必跑**（不再问）+ 固化 3 条机械断言（实测 `--el-color-primary`==设计主色 / `scrollWidth-innerWidth<=0` / 关键容器尺寸==token），取数源 = `design.md` 新增「〇、视觉冒烟锚点」段（④并入③，不单列）。
- **拒绝的 over-engineering**（防膨胀）：像素快照/visual regression CI、design-tokens.json 导出工具链、per-task `visual-tokens-required` 字段、check-gate 加视觉核、通用 check-visual-tokens.js。理由记 `_meta/plans/2026-06-28-visual-baseline-package/findings.md §五`。
- **诚实账**：①是 ADD（核心增量，旧框架缺的格）；②是把 parked #17 想清的事落地 + 类别纠正（落对层）；③是复用既有 pinchtab 的小 ADD。`check-sprint.js` 已 `node --check` 过。
- **改动文件**：specs-execution（plan-sprint / draft-tech-design / generate-integration-tests）+ specs-structural（plan-sprint / generate-integration-tests / develop §字段规范 baseline）+ templates（queue/task-package / review-briefs/task-package-review / scripts/check-sprint.js / standards/frontend / checklists/frontend-checklist / design）+ 收口（待议 #17 / 2026-06-22 findings / 本 STATUS）。**已 commit `0784bf7` 并 push 到 `origin/method-lab`**（用户明确确认 push；分支非 master）；scoped commit，工作区其余无关 WIP 未纳入。

### 2026-06-20 develop 站「展开」四连改 — 单/批量合一 → 会话定标 → 执行模型翻转（独立审查 loop）→ 砍除 pr-review（merge-on-push）

> 接「撤销 sub7、单文件 develop.md(417)」。本会话沿 develop 站连做四步，把 develop 从「逐步人工门的线性 spec」改成「主线编排 + 执行 subagent + 独立对抗审查 loop + 自合并」的全自动模型，并连带砍除独立 pr-review。

- **① 单/批量会话合一**（`4a8aeda`，417→356）：单任务=批量 N=1 特例，处理对象抬成「任务集 size≥1」，删头部模式表 + 批量会话整章 + 双认领块。货币=结构简化（消分叉），与 sub7 相反方向。
- **② 会话定标 + 批次名带 id 集 + 两级循环轻澄清**（`92fda1e`/`77b4c21`，356→360）：拆开 **PR 粒度**（依赖/plan-sprint 已管）与 **会话容量**（上下文/develop 拾取时定标）两个正交维度（findings F2）；批量按 files 估改动面提议依赖序前缀子集 + 软锚点 + 🚫确认。批次分支名 `{layer}-batch-v{N}-{id1}/{id2}/...` 携任务 id 集破撞车。Level1 任务级串行 / Level2 模块级 subagent 轻澄清。货币=正确性（主动定标替被动重置），ADD。
- **③ 执行模型翻转：主线编排 + 执行 subagent + 独立审查 loop**（`1f7b463`，360→270，新建 `templates/review-briefs/develop-review.md`）：全自动 loop 取代逐步 🚫 人工门，人工只守一个 upfront 门=前端设计到位。主线编排（定标/设计门/浮决策/末端全量/提交）；每任务「读懂→计划→写→自绿」下沉执行 subagent（隔离上下文→批次可放大）；每任务质量由**独立对抗审查 subagent**（自读权威原文=任务包/diff/standards/测试，绝不收执行体自评）把关，阻断即回炉、3 轮超界升级。三层防线（deterministic 绿 → 独审语义 top-up → 人工守设计品味）防「AI 判 AI 盖章」。findings F3：独审输入必须权威原文、唯一留人门是无权威原文的设计品味。诚实账：结构重写，主货币=质量升级 + 上下文经济，净缩 −90 为附带、+39 brief 是 ADD。
- **④ 砍除 pr-review + merge-on-push（BRIEF 决策 #24）**（27 文件改 + 删 2 spec ~324 行）：用户拍板路 A——新 develop 内置独立审查后，pr-review 的内容复审全冗余 → 废除 `pr-review` task + `review` discipline（discipline 9→8、task 13→12），develop 提交 PR 后自合并到 master。**治理代价明确接受**（master 写入无第二人工门），仅安全敏感改动（权限/认证/数据隔离）保留 architecture 人工裁决（develop 末端 escape-hatch）。3 缺口安置：安全→escape-hatch、设计保真比对→升进独审 brief 第 6 类、code_reviews[] 留痕→develop 末端写。Fast Mode 一并删（全自动下无快进意义）。`[done]` 退瞬态、终态 `[merged]` 由 develop 自落定。改动遍及 skeleton 01-07 / templates / 下游 specs / guide / BRIEF；全仓 grep 验零悬挂引用（残留均为「记录砍除」的有意表述）。

### 2026-06-20 develop 站：撤销 sub7 家族拆分 — 取回单文件 develop.md，灭掉 core+3 壳，在原基础上重启致密化

> 管线走到 develop 站。用户复盘 sub7（2026-06-19 把 develop 拆成 `develop-core`+3 薄壳）**判为负收益**，拍板「取回 sub7 之前的原文件、灭掉家族、在单文件基础上重新讨论致密化方案」。本轮只做**撤销 + 接线反转**（致密化"展开"留下一轮，先和用户讨论打法）。

- **诊断（数据 wc -l 校正）**：sub7 是 `develop.md`(417) → 家族 519（core 308 + sprint 124 + repair 41 + b 46），**净 +102 / 1→4 文件 / 跨文件步号耦合 / 三倍 intake·handoff 样板**。唯一收益（repair·b 会话少载 ~40 行批量逻辑）远抵不过维护代价。**佐证**：structural 侧当初就以「拆则复制共享判据、反 §2 净收缩」为由**没拆**（保持单契约 79 行），exec 拆分与它自相矛盾——本轮让两侧重新一致。
- **撤销动作**：① `git show 755d04a:specs-execution/develop.md` 还原单文件（417）② 补回 3 个 post-sub7 delta（standards 归位路径 / 测试脊柱 Step5 例子规格 / fb9fa9f 步号 Step7）③ `git rm` 四家族文件 ④ 外科式反转 14 处接线（**非整体 git restore**——这些文件多承载 pipeline-reshape 后续大改，整体还原会抹掉）：structural 契约 / CLAUDE.md 路由+Step1 表 / status.yml+skeleton07 type 枚举 14→12 / skeleton04 catalog+属性+§6 / dispatch-new·gen-it·manual-test·plan-sprint 的 `type: develop` / draft-tech-design·pr-review 执行层指针 / guide 00·03·99。
- **保 delta 纪律（关键，没回退）**：sub7「顺手修 dispatch-new b-queue pre-existing bug」+「status.yml type 补全」+ d83e722 测试脊柱 + e83fb53 standards 归位 + fb9fa9f 重号——全部**保留**。反转规则=「`develop-sprint/repair/b/core → develop`；`b-queue` 保留；`type` 字段保留、值改 `develop`」。
- **验证**：grep 全仓 live 文件零家族残留（仅本 STATUS 历史里程碑保留为日志）；develop.md 零 shell 引用 / 3 delta 在场 / 无 iterations/vN standards 残留。`git diff` 净 −519 家族 + 反转接线、新增 develop.md 417 = 回到 ~原始 + 保留改进。
- **诚实账**：这是**撤销一次结构 reorg**、不是减肥也不是加规则——回到 sub7 前的单文件结构正确性（决策#14 的"task.type 真路由"本就不该靠拆 exec 文件实现：task.type 仍是 dev-frontend/dev-backend，source 是属性）。**真正的致密化（换语气那把刀）留"展开"轮**。

### 2026-06-20 review-briefs/ pattern 推广到 PRD + tech-design — 三个末端审查 brief 全部外置，spec 正文只留派发指针

> 接 plan-sprint 站 brief 外置（建成 `templates/review-briefs/task-package-review.md` + 命名规范）。本轮把同款 pattern 推广到管线另两个末端内容审查：PRD Step 7.5、draft-tech-design Step 5。

- **新建两份自包含 brief**（与 `task-package-review.md` 同结构：HTML 注释头 = 命名规范/派发/独立性 + 「你是独立审查员」+ 【自读输入】+ 【默认假设】+ 【逐类检查】+ 【边界】+ 【输出格式】）：
  - `templates/review-briefs/prd-review.md`：审 `iterations/vN/prd.md`，subagent **自读**定稿 prd.md（+ background.md），三维度（内部一致性 / AC 可验性 / 覆盖完整）。
  - `templates/review-briefs/trd-review.md`：审 `iterations/vN/trd.md`，subagent **自读** trd.md + prd.md（+ ux-flows / prototype），四维度（内部一致性 / AC 真承接 / 字段满足画面 / 覆盖完整）。
- **spec 正文塌缩为派发指针**：draft-prd-vN Step 7.5、draft-tech-design Step 5 各把 ~10 行 inline brief（逐条喂 subagent 的指令）→ 1 行「派全新 subagent 读该 brief、自读输入、输出问题清单」。两份 exec spec 共 **−17 行**。
- **货币（同 plan-sprint brief 外置，诚实账）**：主 context 减负 + 单一来源防漂移，**非净收缩**——内容是「搬」到 brief 文件（subagent 隔离按需读，主线全程不再持有审查维度清单）+ 升固化（subagent 自读权威原文，无主线转手失真）。新增两文件不进主 context。
- **pattern 钉死**：管线三个末端审查 brief（task-package / prd / trd）现全部入 `templates/review-briefs/`，命名 `{被审产物}-review.md`，live 引用、不入项目仓、不改 init-project；审查维度改动改 brief 单一来源、spec 正文不重述。

### 2026-06-20 管线续走 plan-sprint 站：致密化（340→275 / −19%）— Step 3 折叠重抄 + 门卫散文收薄 + 换指令体

> 接 draft-tech-design 站。沿管线往下到 `plan-sprint`（实测最胖 ~340 行）。照「单环节致密化方法」§五 6 步走四象限。**纯致密化、无结构改动**（契约字段/产物/判据未变，只动 exec 正文散文）。

- **`specs-execution/plan-sprint.md` 340→275 行（−65/−19%）**。四象限拆账：
  - **格式→模板/linter（真减肥主力）**：Step 3 原把 `depends_on` 写法 / `reference` 行号要求 / AC 回链格式 / api-contract 平铺规则**逐字重抄**进正文，而这些已在 `templates/queue/task-package.md` 模板注释 + `check-sprint.js` + structural 完成判据**三处**存在。正文停止重抄，只留「模板讲不了的判断与跨文件来源」（数量策略 / AC 例子来源 PRD幕1·TRD幕2 + revise-doc 路由 / reference 前后端同场景名对齐锚点 / api-contract 推导来源 + 确认节点）。
  - **验证→门卫接管**：Step 4.7「不得手改报告、不得跳过」+ Step 5「退出码 0 才签」前置散文删——签字 commit（stage queue/+sprint.md+gates.md）时 pre-commit 门卫按路由跑 `check-sprint.js`、红则拦 commit，「跳过 linter 偷签」机制上做不到（同 PRD Step 7.4/8）。
  - **过程判断→换指令体**：全文教学体→指令体。
- **不可动部分（解释 −19% 弱于 PRD −44%）**：Step 3.5 sub-agent mandate ~36 行 brief 逐条保留（方法 §五 第 4 点：末端 agent 指令必须固化进 brief，否则退化泛扫+盖章）+ 选项菜单/骨架表/交付方式表/sprint.md 格式等功能输出模板是结构非散文。真可压散文集中在 Step 3 + 语言两处。
- **末端 agent 与 AC 链均为既存资产、非本轮 ADD**：Step 3.5 独立对抗审查 = PRD Step 7.5 的同款机制（plan-sprint 早有）；AC 链落点（任务包 `(源：AC-nn)` 回链 → check-sprint 逐条正反向）sub5/sub6 已机械，残量忠实性留 Step 3.5 + 签字人——**本站无 AC 链 bug 可修**。
- **诚实账**：货币 = 致密语言（真净缩，零 sub7）+ 搬运到模板（单一来源防漂移）+ 门卫接管（forcing）。不据某一件宣称总净收缩。
- **后续·brief/格式外置（同站第二刀，用户提的 loop 思想延伸）**：把"用即弃的成品文本"从 spec 正文搬到独立文件、消费时按需读——**货币是主 context 减负（机制 #1）+ 去重，非净收缩（总量是"搬"）**。
  - **抽离三判据**：①是"成品"非"过程散文" ②单点/靠后/条件用（全程驻留是死重）③消费者能按需读（subagent 隔离读=最优 / 主线到那步才读）。判断散文、生成-map、主线逻辑一律留。
  - **#1 Step 3.5 审查 brief（~36 行）→ `templates/review-briefs/task-package-review.md`**（新建目录+类）。brief 改**自包含**（subagent 自读 prd/trd/standards/queue，不再靠主线注入占位符）；主 context 全程不再持有 brief、3.5 时也不再转手喂（消除主+子双份）；固化更强（subagent 读权威原文，无转手失真）。Step 3.5 从 ~50 行塌到 ~22（留引子 + 派发 1 行 + 四类摘要 1 行 + loop 表）。
  - **#2 Step 4 sprint.md 格式 → `templates/sprint.md`**（与 prd.md/trd.md 同级 root）。顺带消掉 exec↔structural 的 sprint.md 重复（structural 改指针）。
  - **命名规范（本次定）**：产物格式模板 `templates/{产物名}.md`（root，镜像 iterations/vN/{产物}）；subagent 审查 brief `templates/review-briefs/{被审产物}-review.md`（live 引用、不入项目仓、不改 init-project）。
  - **plan-sprint exec 275→226（−49）**。**pattern 已立**：PRD Step 7.5 / draft-tech-design Step 5 的 brief 后续按 `prd-review.md` / `trd-review.md` 同规收入 `templates/review-briefs/`（样本跑顺后做）。
- **后续·Step 3 结构化（同站第三刀，用户提议）**：Step 3 那段"写包判断核"（depends_on / acceptance-criteria / reference / relevant-standards / api-contract 五字段的判断与跨文件来源）从 5 个 prose bullet → **逐字段表**（字段 | 怎么填 | **验证归属**）。**货币是理解 + surface「验证归属」模型（谁 check-sprint 机械、谁 Step 3.5/签字人留人）——非减肥，226→231（+5）**。结构化值当**仅因内容天然逐字段并行**（表格主场）+ 验证归属本散在各处、提成一列正好把"质量控制 not 规范控制"画进 spec。AC 行最富（五件事），全表版可读、未撑爆。残留格式重抄（AC tag、例子写法）已推回模板。如实记成"结构改进"不误框净收缩。

### 2026-06-20 单环节续走 draft-tech-design：致密化 + standards 归位 + 步骤重排（三件依次落，沿管线往下走）

> 接「门卫样本建成 + 致密化方法成稿」。用户定调"沿整个开发管线一个个往下走，同时审 AC 链有效性"。管线顺序 draft-prd✅→draft-ux✅(无改)→**draft-tech-design 本轮**→plan-sprint→develop→…。本会话把 draft-tech-design 三件依次做掉，三个独立 commit。

- **件 3·致密化 + Step 5.5 末端内容审查**（commit `b090a2d`）：接口设计段从 cram 单行拆三 bullet（回链承接/幕2精化/字段对画面）；新增独立内容审查（陌生视角 subagent 派发 brief，验 linter 兜不住的内容有效性）。**诚实账**：283→307 净 ADD——§接口设计原为行高效 cram 单行，拆 bullet 增物理行但降阅读密度；Step 5.5 是"验内容"的 ADD 非堆规则。印证方法文档"单看行数会误判"。
- **件 1·standards 归位为项目级活文档**（commit `e83fb53`，18 文件，决策#17 修订）：`standards-{shared,frontend,backend}.md` 从 `iterations/vN/` 移到**项目根**，与 decisions/reusables/design 同级。生命周期从"每期从上期副本重生"→"v1 播种、vN+1 原地增补"的单一真相源。**病根**：standards 是代码库级编码约定、本质跨迭代，per-iteration 重生成产生副本链 + 真相源含糊 + **并行迭代约定漂移**（v2/v3 各持副本可不一致，错的）。`iterations/vN/` 混了真·迭代内容（PRD/TRD/gates/sprint）与错放的项目内容（standards）。历史基线靠 git，per-iteration 冻结快照无活消费者（review 永远用当前）。接线：draft-tech-design Step4 重生→增补 + 双源去重对照现有 standards；plan-sprint/develop-core/pr-review/manual-test/revise-doc/generate-integration-tests 加载路径改项目根；init-project 建三份空桩（与 design.md 同模式）；templates/standards 头注 + skeleton/04 + guide/02 + CLAUDE.md 结构图 + BRIEF #17/#23 同步。
- **件 2·步骤重排 + 整数重编号**（commit `fb9fa9f`）：把 TRD 验证（linter + 内容审查）从"签字前最末端"前移到"写完 TRD 立即"，排在用户确认与 standards 之前——**在最便宜处（机器/陌生视角）先验，用户看到的是已过两关的稿**。门卫在 Step9 签字 commit 复跑 linter 兜结构漂移（早验之所以安全正因门卫兜底）。去小数重编号：1 疑点 / 2 骨架 / 3 写TRD / **4 linter / 5 内容审查 / 6 TRD确认** / 7 维护standards / 8 知识沉淀 / 9 G2 签字。外部引用同步（structural / develop-core Step4→7 / init-project）。
- **AC 链审查结论（draft-tech-design 段）**：链路本身机械化已收口（check-docs 逐条正反向 + 门卫路由 trd→check-docs），无 bug；残量 = 精化忠实 + 载体真承接（固有语义），现由新 Step 5 末端审查 + 签字人 + pr-review 三层兜。本段不是减肥（致密化）就是结构修正（standards/重排），货币各异。

### 2026-06-20 门卫（HOOK）样本建成 + 单环节致密化方法成稿 — PRD 阶段四件机制凑齐，配方可复制

> 接 HOOK/DRY 双 park。用户定调：**HOOK 全局 rollout 仍不划算，但把 PRD 阶段当样本做"全套"再总结方法**。补齐 PRD 样本缺的第 4 件机制（findings §七-3 forcing function，唯一没碰过的），从完整样本抽出可复制配方。

- **门卫建成**：`templates/scripts/pre-commit-hook.sh`——签字 commit 时按 staged 文件路由跑对应 check-\*.js（prd/trd→check-docs、sprint/queue→check-sprint、gates.md 新增 G4/G5→check-gate），红则拦 commit。**四场景实测全过**：红 PRD 拦 / 绿 PRD 放 / 无脚本 no-op 放行（存量仓兼容）/ gate 路由正确抽 `G4 v2`。
- **判官+门卫模型钉死**（findings §八）：linter 是判官（查产物对不对），但"记得跑判官、退0才签"若只写散文仍会在 context 失真；门卫自动跑判官、红拦 commit，那句散文才能整段删——强制它的不再是文字、是闸门。这是本方向**唯一没碰过的第三机制**（地基✓判官✓早就位，缺门卫）。
- **接线**：init-project（Step3 hook 源 tracked 入仓 + Step4.1 git init 后装 `.git/hooks/` + clone 重装一行说明）；删 draft-prd-vN Step7.4 强制散文（降提前自查+门卫兜底）/Step8 签字前置；06-gates §7 加「判官+门卫」段 + 三处「不得手改报告、不得跳过」→门卫接管。
- **暗礁全兑现**：存量无脚本/无 node → no-op 放行（不拦死 hact-app v1-4）；跨平台 Git Bash（POSIX sh 实测）；护栏非密码锁（`--no-verify` 可绕、`.git/hooks` 不随 clone、队友须重装）已明示为**合作者强制出路、非安全边界**（Goodhart 接受）。
- **方法成稿** `_meta/plans/2026-06-20-pipeline-reshape/单环节致密化方法.md`：**四件机制 + 一把语言刀**的职责分工矩阵——格式→linter+门卫｜填写说明→template｜内容有效性→末端 agent｜过程判断→spec 正文（且换指令体）。正文只剩第四象限 → 自然致密。含**诚实账**（各机制货币不同：致密语言=真净收缩主力且零 sub7 陷阱；template/门卫=搬+forcing；末端 agent=ADD 但验内容非堆规则）+ **套下一份 spec 的 6 步**。
- **诚实账**：门卫删的强制散文小（~3-5 行/份），ADD 是脚本（不进 context）；真减肥主力仍是致密语言。四件凑齐才是完整样本，单看行数误判。

### 2026-06-20 HOOK/DRY 量账后双 park + 单环节 loop 试点（PRD 致密化）— 点破「换语气」是最高 ROI 减肥杠杆

> 接乙-1+乙-2。本会话先量 HOOK/DRY 两杠杆的账（防 sub7 陷阱），均判净收缩不划算 park；用户改提「单环节 loop」试点，拿最熟的 PRD 试三思维同走。

- **HOOK 量账后 park**：删 ~15 行强制散文（"退出码0才签/不得手改/不得跳过"散 6 文件）vs 加 ~60-85 行脚本（识别签哪 Gate→跑对应 check-*.js + 无脚本 no-op + 跨平台）。教科书 sub7 账；脚本是 code 不进 context，真货币是 forcing-function（§七-3 唯一没碰的第三机制）但净收缩小。暗礁挖清（存量 no-op/跨平台/护栏非锁）存档待重启。
- **DRY 量账后 park**：subagent 全读 16 份 specs-execution 测绘——全语料仪式 ~520-580 行，**真净收缩上限仅 ~130-155 且 per-session context 几乎不动**；占大头的 #2 会话启动/断点续做 ~240 行是 sub7 陷阱（各 task 实质导航知识伪装成仪式，抽即掏空）。clean top-3=快速通道直修/选项菜单/签字三件套。货币是「单一来源防漂移」非行数 → 用户判性价比不足 park。
- **单环节 loop 试点·PRD（活线）**：思路（用户）= linter+hook 管格式 / 末端独立 agent 审内容 / template 接填写说明 / 语言对 CC 极简化；视觉移交 draft-ux（任务重划非减肥）。`draft-prd-vN.md` **311→175 行（−136/−44%）**：① 极简语言 ~70 ② template 接走 ~50（含变更摘要 33 行→template 注释）③ 视觉移交删 Step5 ~11（draft-ux Step1.3 早拥有 design.md）④ 新 Step 7.5 末端内容审查 +18（陌生视角审一致性/AC可验性/覆盖，"是否用户真要的"归用户守 design §10，与子计划3删的格式冷核橡皮章不冲突）。配套 prd/design template + structural 同步。
- **真发现（写入 memory）**：最大那刀 ~70 行**不是去重/移交、是「换语气」**——spec 大量是给人读的教学体冗余，读者其实是 CC（要指令体）。findings §六「200行仪式」相当部分是给人读的冗余措辞，非仪式重复。**致密化 = 每份可用 / 零 sub7 陷阱（只把同义写短）/ 唯一代价纯人工逐份改+密度微增误读**——绕开 hook/DRY 碰不到的那块。
- **用户验收**：PRD「能接受，直觉还有 10-15% 空间但已 <200，先这样」→ PRD 不再压。

### 2026-06-20 pipeline-reshape 开启 + 测试脊柱前置（乙-1+乙-2）— 流水线从「末端验证瀑布」转「贯穿脊柱」，HOOK 待跨会话续

> 承 loop-layer2 §十四「流水线形状之疑」。第 0 层决策（用户拍板）：**先重定形状**（垂直切片 + 测试脊柱前置），非现形状内打补丁。loop 第二层 / hook / 蒸馏交接 / DRY 降为形状内杠杆。记录见 `_meta/plans/2026-06-20-pipeline-reshape/`（design.md + subB-测试脊柱前置-design.md + task_plan.md）。

- **第一步选乙先行**：甲（竖片演练）因「hact-app 不重要、随时可停」出局；丙（draft-tech-design shared-type-first）经重启纪律量出删不动散文（sub7 同源）且不推进形状本体 → 用户改选乙（测试脊柱前置）。
- **Q3 两幕脊柱**：幕1 AC 行为例子前移 PRD（CC 起草 / 产品验证，坏 AC 最便宜处暴露）+ 幕2 draft-tech-design 精化为技术精确规格。「非技术产品写不了例子」是伪障碍（CC 起草 + 产品验证同性质）。
- **幕2 硬纠正**：原稿「编译成可运行红测试文件」撞 2026-06-16 决策（TRD 无运行代码、预写测试是空中建筑，org-krm v5 联调 15 条全废）→ 改「只精化例子规格，runnable 物化守 develop」。
- **乙-1 立脊柱（11 处）+ 乙-2 末端收口（4 处）** 已落（commit `d83e722` feat + `892be13` docs）。乙-2 摘 manual-test「人在末端逐条手验不可视区正确性」冗余，改脊柱+联调测试结果机械带过；顺修 sub3c 遗留悬挂引用（manual-test structural §7「G3」→ G4/G5 人工兜底）。
- **两次诚实账纠偏**：乙 的货币是**结构收益**（反馈环短 / 坏 AC 早暴露 / 验证归属清晰 / 脊柱给蒸馏一个机器盯得住的锚），**非 spec 净收缩**——主体是「搬」（操作化 TRD→PRD）+ 摘人冗余，非删大段散文。**真净收缩货币在 hook（forcing function）+ DRY 仪式去重，不在脊柱**（findings 地图 §七-九）。
- **乙-3（linter presence）parked**。

### 2026-06-19 sub7：develop 拆分（loop 第二层先 park）— 471 行单 spec → 共享核心 + 3 薄壳，兑现决策 #14

> 接 sub6（结构性审查 AC 链路收口）。会话 9 起点是「开始 loop 第二层」，但读 design §2.5 + findings §二后判定 loop 第二层 ROI 被 sub1-6 摊薄（per-API 拆分是编排 ADD/不删散文；develop 模块级 loop 已被 sub2 删 Step5.5 做掉）→ 用户确认 **park loop 第二层**，火力转 **develop 拆分**（findings §三 #1：471 行 spec 是规范膨胀根本原因，违背决策 #14「task.type 是路由键」）。

- **关键认识**（校正 findings #1）：source 分歧集中在**边缘**（intake 拾取/Gate + handoff 移交/feedback），核心实现流 Step 1–7 **source 无关**；自然分组是 **3 不是 5**（integration/manual-test 组内仅移交文件名差异，bug/optimization 几乎无差异；checklist「完全不同」是 **layer** 驱动非 source，findings #1 略夸大）。
- **方案 A（用户拍板）**：`develop.md`（417 行）→ `develop-core.md`（Step 1–8 实现核心 + 会话收尾共用段，source 无关）+ 3 薄壳 `develop-sprint`（G3 前置 + sprint.md 拾取 + 单/批量会话）/ `develop-repair`（integration·manual-test，queue/，session 移交）/ `develop-b`（bug·optimization，b-queue/，b-tasks.md + 就地分流 notes）。`source` 选壳；`task_type`（dev-frontend/backend）正交不变。
- **诚实净收缩账（≠ §2 净收缩）**：这是**结构重构、不删规则**，总行 **+102**（417→519：core 308 + sprint 124 + repair 41 + b 46）。**未达 design §7 软目标「≤471」**——原 spec line-efficient 恰因它 cram。真收益是**结构正确性**：① 决策 #14 兑现（task.type 真路由，无内部 source 分支）② per-session context 降——repair 会话 349（−68）、b 会话 354（−63）、sprint 432（+15），crammed 进来的两条路径瘦身且各会话不再载别路径逻辑。**CC 曾在 AskUserQuestion 误把方案 A 框成「满足 §2」，已纠正；用户明知 +102 非行数净收缩，仍判定结构收益 > 行数代价，选接受。**（此结构后于 2026-06-20 又被撤销，见上方「撤销 sub7 家族拆分」条）
- **loop 第二层**：正式 park（非删除，地基仍在；若日后要更狠减 generator 规则可重启，前置 TRD shared-type-first）。

### 2026-06-19 sub6：TRD↔PRD AC 覆盖机械化 — 「覆盖映射自检」从「留人」升「机械」（AC 链路三段全机械对账）

> 接 sub5（PRD AC 稳定 id）。sub5 铺好 `AC-nn` id 后，本轮把 draft-tech-design 仍留人的「覆盖映射自检」也升成机械——结构性审查方向的最后一段 AC 对账缺口。

- **关键认识**：sub5 task_plan 担心的「可视/不可视分叉」（前端交互类 AC 无后端接口可挂）**实测不成立**——回链 tag `# 满足 AC：AC-nn` 是**载体无关**的，无论挂在后端接口、前端模块还是 ux-flows 场景都是同一行格式。check-docs 全局扫 `满足 AC` 行抽 `AC-nn` 即可，不必区分载体。残量 = 忠实性（载体真承接 vs 仅 id 在场），与 sub5 同款留人模型。
- **落地**：`check-docs.js`（`checkPRD` 返 `acIds` / `checkTRD` 扫 `acRefs` / `checkCross` 加逐条正向挡悬空 + 逐条反向验覆盖 / 新增 `human` 级别 + 🧑 段，存量退兜底）；`trd.md` 模板（接口块 `# 满足 AC` 行 + 注释、模块段注释）；spec 接线 4 处。
- **净收缩**：删 1 个人工逐条对照步 → 升 linter 机械 FAIL；签字人只兜忠实性。**AC 链路三段（PRD AC-nn → TRD `# 满足 AC` 回链 → 任务包 `(源：PRD AC-nn)` 回链 → 测试）至此全机械对账**。ADD 是 linter 代码（code≠prose）。
- **自测全过**：全覆盖 PASS / 漏覆盖+悬空 2 FAIL / 存量旧 AC1 退人工 / 真 hact-app v4 不崩走兜底 / 仅 PRD 不崩 / raw 模板 parse 不崩。

### 2026-06-19 sub5（sub3c parked 衍生）：PRD AC 稳定 id — 逐条 AC 反向覆盖从「留人」升「机械」

> 接「结构性审查收官」里程碑。本条记四子计划收口后落地的 parked 衍生项（非原四子计划之一）。设计稿 `_meta/plans/2026-06-19-structural-review/sub5-AC-id-机械化-design.md`。

- **背景**：sub3c D3 只做到 AC 反向覆盖的**功能级**机械，**逐条** AC 反向覆盖因「PRD AC 无稳定 id、无法机械匹配任务包 tag 自由文本」而留人。本轮补齐。
- **三决策**（用户拍板/授权）：① id = **全局唯一 `AC-nn`**（跨功能连续，非功能内重号）② **append-only + 允许空号**（增删不复用号，避免编辑打散已落地 tag）③ **删功能级覆盖换纯 id 匹配**（逐条严格强于功能级，check-sprint 净瘦身）。
- **链路串 id**：PRD `AC-01` → TRD `# 满足 AC：AC-nn` → 任务包 `(源：PRD AC-nn)`（可选人读后缀 `·{关键词}`，linter 只读 id）→ check-sprint 精确串匹配。
- **落地**：模板（prd.md AC 槽 `AC1`→`AC-01` + 注释、task-package.md tag 注释）；`check-docs.js` 加 PRD AC id 全局唯一校验；`check-sprint.js` 加逐条正向（id 存在性挡悬空）+ 逐条反向（每条被引用），删功能级覆盖块；spec 接线 6 处。
- **残量切分**：逐条**覆盖**=机械 FAIL；逐条**忠实性**（内容真覆盖而非仅 id 在场）=语义，留 Step 3.5 独审 + 签字人。
- **自测全过**：check-docs 三场景 + check-sprint 五场景 + 真 hact-app v4 存量烟测（不崩、AC 逐条覆盖走 human 兜底，存量冻结边界正确）。

### 2026-06-19 结构性审查收官：子计划 3b/3c/4 完成 + §7 冷核协议整段退场（四子计划全落，本方向收口）

> 接上一条「方法论方向转变」里程碑（sub1/3/2）。本条记 sub3b/3c + 全局验收 + 合并 + sub4 可视区收口。

- **子计划 3b·G4/G5 检查器**（commit `2e6662e`）：新建 `templates/scripts/check-gate.js`（G4 核 source=manual-test 任务全 merged + 验收报告结论；G5 核 feedback 清空 + project.md 无"开发中"）；§7 部分塌缩（G4/G5 迁 check-gate，G3 暂留冷核）；manual-test/wrap-up 冷核步→check-gate。实测发现 G3 被任务包格式漂移阻断 → 拆出 sub3c。
- **子计划 3c·G3 检查器 + 任务包规范化 + §7 整段拔**：三决策——序列化锁定 YAML frontmatter（v4 实况，v1 markdown 段退役）；存量冻结（hact-app v1–v4 不回填，新 sprint 生效）；AC 反向覆盖功能级机械 + 逐条留人（PRD AC 无 id，加 id parked）。新建 `templates/queue/task-package.md`（YAML 全 17 字段）+ `templates/scripts/check-sprint.js`；**§7 冷核协议整段退场**——intro 塌缩成单一模型「所有 Gate = 检查器绿 + 🧑 段语义人签」；新增极简 G3（check-sprint.js）段。悬挂引用大扫除（防静默回退）。
- **净收缩兑现**：design §2.5「散文大头」三关全清（G1/G2 sub3、G4/G5 sub3b、G3 sub3c），§7 从 ~60 行两层模型塌缩成单层；净收缩从「部分兑现」推到「整段拔净」。ADD 全是检查器代码 + 结构化模板（code≠prose）。
- **子计划 4·可视区收口**：frontend 链路其实已基本建好——视觉/交互保真早落 pr-review 第四步 + manual-test + integration（pinchtab），类型对接落 vue-tsc；唯一仍停在旧「11 段逐条挑刺审代码」形态的产物 = `frontend-checklist.md` 本体。重写为**三段式**（一·归 lint/vue-tsc/stylelint｜二·可测逻辑写测试｜三·留人走查视觉/交互/冗余）。**净收缩**：纯 prose 收缩+重组、无新检查器代码——本方向最贴 §2 判据的一块，但 frontend 净收缩 < backend（视觉残量合法大头）。**四子计划全落，本方向收口。**

### 2026-06-19 方法论方向转变：质量模型从"规范遵循"转向"输出可测试性"（结构性审查 + 子计划1·地基）

- **背景**：一轮对整套方法论的结构性审查（含独立 subagent 对抗审查），追问"无休止增加规范来规范 AI 是否可持续"。
- **两个全局结构性错误**（findings §四）：**A · 质量模型方向错**——规范/Gate/冷核都在验"指令是否被遵循"，不是"产物是否真的正确"；真正验输出的只有末端 integration-tests + manual-test。**B · AI 不可靠性被当成规范写作问题**——规则塞进 spec = 塞进 context = 越长越失真，正反馈退化回路。
- **方向定案**（design.md）：正确性维度从"散文/AI 肉眼核"迁成"确定性检查（test+linter+一致性检查器）"，**每迁一条删一条散文**，成功判据 = **spec 净收缩**（非"新增验证"）。分区：火力集中**不可视区**（后端/数据/逻辑），可视区（前端视觉）留人走查。
- **拆解**（design §11）：子计划1 地基（产物结构化）→ 子计划2 不可视区 AC→test → 子计划3 Gate 重定义（删冷核兑现净收缩）。
- **子计划1·地基**：新建 `templates/prd.md` / `templates/trd.md`（结构化模板）+ `templates/scripts/check-docs.js`（纯 Node linter，验结构完备 + 实体↔表交叉一致）。
- **子计划3·Gate 重定义**：`skeleton/06-gates.md` §7「完成判据冷核协议」→「完成判据核对」两层模型——G1/G2 走 linter 退出码 + 人签语义，删 subagent 冷核；G3/G4/G5 沿用 subagent 冷核。
- **子计划2·不可视区迁移**：**AC→可运行测试**成为不可视区正确性验证主轴：draft-tech-design 把不可视区 AC 操作化成 Given/When/Then 例子 → plan-sprint 写进 backend 任务包 → develop 1:1 落成测试 + 跑绿 → pr-review 兜残。**develop Step 5.5 AI 对抗审查整步删除**，真测试套件取代之。backend-checklist 87 行→~55 行测试品类清单。对抗审查整改（2 BLOCKER）：安全覆盖洞补回、测试运行器 owner 确立。
- **loop 概念澄清**：loop=机制、删规则=收益、前向有效性(lint)/正确性(test)=同一 loop 两个验证维度。

### 2026-06-19 方法论调整：draft-ux 整体重构（角色姿态反转）

- **背景**：用户对当前 draft-ux 方法的痛点为「面对 36 条场景文字 + mermaid 流程图 + ASCII 线框时，信息消耗太大、文字→画面转换负担过重」。
- **病根**：旧 draft-ux 把 CC 的工作过程（场景枚举 / 流程图 / 线框图）摊开给用户做判官——用户被迫做"交互工程师的助手"，做大量"文字→画面"的脑内转换。
- **决策（角色姿态反转）**：**CC = 交互工程师；用户 = 客户**。客户只参与上游业务沟通 + 下游设计稿走查，中间过程内部消化、不外露。
- **新主链路**：业务沟通（多轮文字）→ CC 内部消化（不外露）→ 出 HTML 原型 → 用户走查 + 反馈调整。
- **新步骤序列（Step 1–6）**：业务沟通 → CC 内部消化（必走清单，全程不外露）→ 关键决策中间产物对答（按需触发）→ 生成 HTML 原型（落实 design.md）→ 用户走查 + 反馈调整（用户主动说 OK 才转）→ 收尾移交。
- **新红线 6 条**：禁止跳过场景拆解直接出原型 / 禁止只覆盖主路径 / 禁止死路 / 禁止系统内部逻辑混入 / **禁止让用户审查工作过程产物**（新增）/ **禁止视觉创新**（新增）。
- **落盘规则变化**：精简 `ux-flows.md` 至 2 段；旧版「死路检查 / 交互决策 / 交互质量走查记录」三段移除。
- **修改文件**：重写 `specs-execution/draft-ux.md` + `specs-structural/draft-ux.md`；删除 `templates/checklists/ux-checklist.md`。

### 2026-06-18 方法论调整：Gate 签署前完成判据冷核（B 软版）+ draft-ux 回退修复

- **背景**：起于"同事开发时方法论没同步到最新"。推演发现三类根因：① 真·同步滞后 ② 假·同步滞后（拉了、规范也在，但没照做）③ 已落地改动被后续提交悄悄回退。本轮主攻第②类。
- **病根（三层真相）**：CC 执行依据的是上下文里的快照而非"执行那刻的最新文件"，最致命的第③层是"印象执行"——最新判据即便在上下文也按熟悉旧形状填、逐条漏核。
- **意外发现（第③类活体证据）**：`5d53088` 落地的 draft-ux Step 2.5/3.5 冷审，被 16 分钟后 `5cfdedb`（自称"表格格式化内容不变"）实际删除，导致 execution spec 与 structural 契约矛盾。已 `9074062` 增量恢复。
- **落地（B 软版，hook 与上游 linter 延后）**：`skeleton/06-gates.md` 新增 **§7「完成判据冷核协议」**（单一来源，G1–G5 参数化引用）：派全新 subagent 隔离上下文逐条对抗核判据、自写凭证、人驱动项标 `N/A·人工`、🚫 人工抽看凭证兜底。5 份 exec spec + 5 份 structural 接线。
- **明确取舍**：软版无机械防线——待后续上 hook 补硬闸。

### 2026-06-18 方法论调整：draft-ux 交互质量（②造前探选 + ③subagent 冷审 + ①行为化清单）

- **背景**：前一轮 design-fidelity 解决"保真"，本轮解决"设计质量"（设计本身好不好）。
- **病根**：不是"不懂 UX 原则"，是 ① 回归平均（无目标时输出最通用平庸解）+ ② 自评宽松（同上下文自我 review 被锚定、盖章）。
- **落地三招**：① 新建 `templates/checklists/ux-checklist.md`（行为化、靠看就能答的问题，抗盖章）；② Step 2.5 交互方案探选（非平凡画面 2-3 方案 + 取舍 + 选型，治回归平均）；③ Step 3.5 交互质量冷审——**派全新 subagent 陌生视角审**（只喂 prototype.html + ux-checklist + 场景列表，不喂决策理由）。
- **parked**：同模型共享盲区 + 跨项目 UX 参考样例库。

### 2026-06-18 方法论调整：前端设计保真（design.md 必读 + pr-review 保真维度）

- **背景**：用户反映前端产出物经常偏离前置设计。专题研究确认系统性、跨迭代复发：29 条偏离记录，org-krm-v2 硬编码颜色/间距横跨 v3→v5 至少 6 处。
- **病因**：① design.md 在 develop 是"涉及视觉时"条件加载，靠自判；② prototype.html 全程失联；③ develop/pr-review 只对照 standards，无设计保真对账闸口。
- **决策**：**Fix 1** `design.md` 升级为 frontend develop **无条件必读全文**；prototype.html 作实现基准。**Fix 2** pr-review 增设计保真维度（额外加载 design.md + prototype.html，新增打回条件与「设计保真核查」）。

### 2026-06-18 方法论调整（续）：prototype.html 接入链路（fix 3）+ fix 2 口径收口

- **关键认识**：交互保真分两段——sprint/develop「照规格造」原型新鲜；联调/人工「照现实迭代」原型变旧。按阶段收口即可，无需"活规格/漂移维护"制度。
- **口径定案**：`design.md` 视觉对照适用**全部 frontend PR**；`prototype.html` 交互对照**仅 `source=sprint` 的 PR**。
- **落地**：pr-review（4 处）+ structural（1 处）限定 prototype 对照范围；draft-tech-design 必读清单加 prototype.html + 接口设计逐画面对照；generate-integration-tests 前端场景用原型软核对覆盖齐全。

### 2026-06-16 方法论调整：集成测试脚本移至 generate-integration-tests 阶段生成

- **背景**：org-krm v5 联调阶段，前端 pinchtab 脚本（预生成于 draft-tech-design G2 后）暴露系统性假设错误（路由假设错误 / pinchtab 工具行为未知 / 数据假设错误 / 认证注入不完整），15 条场景全部失败、反复 8 轮才稳定。根本原因：TRD 阶段只有接口契约、没有实际运行的前端，脚本是"空中建筑"。
- **决策**：废除 draft-tech-design 阶段的集成测试脚本预生成步骤；改在 generate-integration-tests 阶段（develop 全部合并后）主动生成脚本并立即执行。
- **不变**：draft-tech-design 仍输出 `scripts-vN.md` 索引格式约定，但不再预生成可执行脚本本体。

### 2026-06-08 方法论清理：移除全部 Dynamic Workflow（计费口径对齐）

- 背景：Anthropic 2026-06-15 起将 Agent SDK / `claude -p` headless / GitHub Actions 等程序化 agentic 用量从订阅额度池剥离，改走独立 Agent Credit Pool 按 API 价计费。DW（`Workflow` 工具）是全仓唯一接近"自动化 agentic 用量"的形态，计费口径存在歧义。
- 处置：将仅存的测试产物 DW 及其所有引用彻底删除，方法论全面回归"交互式会话 + `Agent` 工具"（跟随会话走 Max 订阅，不进 Credit Pool）。
- 结果：hact-method 全仓零 DW、零 `claude -p`、零 GitHub Actions、零 Agent SDK。

### 2026-05-31 方法论调整：status.yml 状态契约（hact-app 取数稳定化）

- 背景：hact-app 靠解析 queue/sprint.md/gates.md 等叙述性 markdown 取状态，格式漂移导致持续取错数。
- 方案：新增**项目根 `status.yml`**（机器侧唯一数据源、项目级单文件、YAML 锁死 schema），现有 markdown 降级为「人看的视图」；状态进 YAML、文档正文走 API。项目级而非迭代级：B 类跨迭代、`iteration: null`；多迭代并行靠 `iterations` 按版本分块。
- 落地：新增 `skeleton/07-status-contract.md` 契约 + `templates/status.yml` 模板；10 份 exec spec 插入「做一个填一个」更新步骤。

### 2026-05-31 方法论调整：个人积累与 pull 上提

- 引入"个人积累仓" `hact-notes-{姓名}`（每人独立私有仓）+ `harvest-notes` 上提 task（pull、只读、游标）。
- wrap-up 第二步分流改向个人 notes；B 类 develop 就地分流。draft-tech-design 双源（公共 + 本人 notes `[规范]`）+ vN+1 去重。

### 2026-06-03 方法论调整：新增 draft-ux 交互原型任务

- 痛点：开发完成后频繁出现交互设计缺陷（仅有 happy path、路径分支遗漏、入口不明确），根因是 PRD→TRD 之间缺乏对业务流的显式确认环节。
- 方案：新增可选 task type `draft-ux`，插入 G1（PRD）与 G2（TRD）之间，产出场景列表 + mermaid 流程图 + 自包含 HTML 原型；三层递进：场景枚举 → 流程图 → 原型。
- PRD 联动：每个功能模板新增 `**入口**` 字段和 `**draft-ux**` 字段；完成判据补两条。TRD 联动：会话启动新增 draft-ux 就绪前置检查；接口设计段每个 API 注明服务于哪条流程路径。
- 方法论验证：以 hact-app v1 F3 Sprint 任务看板为对象跑通全流程，7 条场景 → mermaid 流程图 → HTML 原型。

### 2026-05-08 第二阶段完成 + 第三阶段启动

- specs-structural/ 12 份 + specs-execution/ 5 份（主线）完成并推送。
- hact-method 重构为纯方法论仓（projects/ 移除）。
- init-project 执行，hact-app 本地仓创建；PRD 背景文件写入 hact-app/_meta/input/background.md；draft-prd-vN 会话开启。

### 2026-05-07 第一阶段·搭骨架 完成

- 骨架 7 文档全部就位（01-06 + README）；BRIEF.md 决策清单 20 条；骨架自检通过。

### 2026-05-07 仓库初始化

- E:\group-code\hact-method\ 创建，git init；目录结构确定：迭代一等公民切法。
