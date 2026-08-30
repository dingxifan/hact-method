# STATUS.md — hact-method

## 当前状态
- 当前阶段：**第三阶段·写执行层规范**（边用边补）+ **第四阶段·团队引入**（进行中）
- 上次更新：2026-08-30

## 各阶段完成情况

| 阶段 | 状态 | 完成日期 |
|------|------|---------|
| 第一阶段·搭骨架 | ✅ 完成 | 2026-05-07 |
| 第二阶段·写结构层规范 + 主线执行规范 | ✅ 完成 | 2026-05-08 |
| 第三阶段·写执行层规范 | 🔄 边用边补 | — |
| 第四阶段·团队引入 | 🔄 进行中 | — |

> 阶段编号变更（2026-08-30）：原第三阶段「开发看板应用」**已取消**——配套看板应用停更（最后提交 2026-06-03）、CC_TOKEN 与 webhook 链路失效，相关机制已从方法论全面移除。其后阶段编号顺延（原第四→第三、原第五→第四）。**本文件「历史里程碑」及 `_meta/status-history.md` 中出现的"第三/四/五阶段"沿用旧编号**，不回改。

## 本阶段进展

- **第三阶段（执行层规范）**：不再由单一项目驱动。执行规范由真实项目边用边补——mail-ai / doc-extract / file-extract / JHH-Nortion / org-krm-v2 / awuchi 等仓均按本方法运行，每轮收关把发现回灌 `_meta/plans/方法论待议.md` 与本仓规范。
- **第四阶段（团队引入）**：8 名成员已获 `hact-method-lab` 开发者权限（2026-07-11，见决策#21 权限口径调整），master 为保护分支、贡献走 PR。完成标志＝至少一名开发者独立完成一个 task 全流程（拉包 → develop → 独立审查 → 合并）。

## 下一个起点

按待议清单（`_meta/plans/方法论待议.md`）推进；连接层的存量仓分发（`check-conn.js` + `connections.yml`）等用户通知后统一做。

## 仓库拓扑

`hact-method-lab` 自 2026-07-06 起是**独立 git 仓库**（`gitee.com/dingxifan/hact-method-lab`），不再与 `hact-method` 共享对象库。此前两者是同一仓库（`gitee.com/dingxifan/hact-method`）的两个 worktree，检出不同分支，用于新旧方法并行对比测试；对比阶段结束、新方法（`method-lab` 分支的全部演进）确认为主线后，独立成仓：

| 仓库 | 路径 | 分支 | 角色 |
|------|------|------|------|
| **hact-method-lab**（本仓，独立） | `{工作区根}/hact-method-lab/` | `master` | 当前唯一在用的方法论主线，独立仓库、独立历史 |
| hact-method（旧版基线，未受影响） | 工作区外的独立检出（本机在 `E:\group-code\hact-method\`） | `master` | **旧方法**对照基线，原样冻结保留，仓库本身未删除、未改动 |
| 各项目仓 | `{工作区根}/{项目名}/` | `master` | 按本方法运行的真实项目（mail-ai / doc-extract / file-extract / JHH-Nortion / org-krm-v2 / awuchi），远端均在 `gitee.com/dingxifan/` |
| hact-notes-{姓名} | `{工作区根}/hact-notes-{姓名}/` | `master` | 成员个人积累仓（私有，决策#21） |
| human-ai-col | 本机已无本地检出（远端 `gitee.com/dingxifan/human-ai-col`） | — | v1 方法论（冻结，与上面两者是不同世代）。CLAUDE.md / BRIEF.md 里指向 `../human-ai-col/` 的设计依据链接因此是悬空指针，需要时重新 clone |

> 迁移记录（2026-07-06）：把 `method-lab` 分支（含继承自旧 `hact-method` master 的全部历史 + 之后的全部独立演进，共 261 commit，tip `15971c3`）完整推送到新建的空仓 `gitee.com/dingxifan/hact-method-lab` 的 `master` 分支。随后把本地 `hact-method-lab` 目录从旧仓库的 linked worktree 转成该新仓库的独立 clone（原 worktree 目录整体重命名为 `hact-method-lab.oldworktree` 暂留几天做安全网，未提交的 `_meta/sessions/` 已手动搬入新目录），并清理了旧仓库 `.git/worktrees/` 里失效的 worktree 登记。旧仓库 `hact-method` 里的 `method-lab` 分支未删除（历史遗留，无害，不再更新）。
>
> 历史备注（迁移前，供追溯）：`method-lab` 曾完整包含旧 master 的 51 个 commit（领先 17）；reset 前的本地 master tip `8304136` 曾用 tag `master-pre-reset-8304136` 钉住。`hact-method-lab` worktree 曾于 2026-07-05 从 `E:\Group-code-lab\hact-method-lab\` 迁到 WSL 原生路径——这次（2026-07-06）是在那次路径迁移基础上做的仓库独立化，两次是不同性质的操作（前者只挪路径，后者切断了与旧仓库的对象库依赖）。此后本仓又从 WSL 原生路径搬回 Windows 侧 `E:\projects\hact-method-lab\`（当前位置，2026-08-30 核实；该次搬迁此前未记录）。

## 已知风险

| 风险 | 可能性 | 影响 | 应对 |
|------|--------|------|------|
| 真实项目跑动中发现骨架/规范有结构性缺陷 | 中 | 高 | 在跑的 8 个项目即持续压力测试，每轮收关把发现回灌待议清单与规范 |
| 连接层（`check-conn.js` + `connections.yml`）尚未分发到存量仓 | 高 | 中 | 已知且刻意押后（并发项目在跑，动门卫有中断风险）；待用户通知后与门卫分发同批做 |
| exec spec 覆盖不完整（仅写了主线5份） | ✅ 已解决 | — | 13/13 全部完成，已通过评审和一致性检查 |

## 历史里程碑（索引，全文见 [`_meta/status-history.md`](_meta/status-history.md)）

> 本节以下不再保留全文——新增里程碑的完整记录直接写入 `_meta/status-history.md`，本文件只加一行索引。

- 2026-08-30 hact-app（看板应用）全面退场 + 路径漂移治理 + 阶段表压缩 — 三问炸出三件事：CC_TOKEN 查清即判死（hact-app 仓本机已不存在、最后提交 2026-06-03），看板机制从 init-project Step 5 起全面移除（109 行整段删、Step 重编号、明文 CC_TOKEN 出库、status.yml 消费者改判为 check-*.js）；`E:\Group-code-lab\` **这个目录根本不存在**，31 处硬编码全是死路径，活文档 62 处全量校正（human-ai-col 亦无本地检出，设计依据指针悬空已标注）；阶段表压缩为四阶段（原第三阶段「开发看板应用」取消、编号顺延），团队引入由「未开始」改判「进行中」。顺带修掉 hact-conn 自身的 handle 撞名缺口（mail-ai 与 org-krm-v2 同名 DB_PASSWORD 会静默覆盖，实证反例）。盘出两条实况：**SSH MCP 在本机从未配过**（规范列为必备、deploy 一直靠 ssh CLI）；file-extract 的 deployment.config 自己写过「本文件进 git，不放任何密钥」——独立发明了同一条规则。纯减法，冻结相容
- 2026-08-29 连接与凭据统一寻址（hact-conn）— 补一个从未有过单一真相源的层：Gitee PAT / SSH / DB / 第三方 key 散在五处，其中**项目↔SSH alias 的映射根本无处登记**、换机不可复现。按机密性劈两层（`connections.yml` 入库零机密 + `~/.hact/secrets.env` 机器本地永不入库），`deployment.config` 并存分工保留命令侧。载体＝`skills/hact-conn` + `templates/scripts/check-conn.js`，随 init-project 铺进项目仓、接进 pre-commit 门卫；三条 FAIL + 两条 🧑（含 MCP alias 在场性——换机唯一不随凭据文件走的东西）。解析链认历史 `GITEE_ACCESS_TOKEN`，零打断迁移。13 组用例以负向为主全部亲手撞过，门卫三态实测。看板 CC_TOKEN 明文入库本版未纳入；存量仓待分发。判与机制冻结相容（无新 task type / Gate / discipline / subagent）
- 2026-08-03 扇出条按数据关闭 + 审计留痕机械化 + 门卫首次真部署 — file-extract v2 首批 `rounds` 数据驱动：扇出条按它自己写死的判据（3:3，不满足"绝大多数 rounds=1"）**降级为不做**；同时撞出**仪器装了没响**——`rounds` 07-30 落地、v2 十一包全在其后合并却 0/11 记录、两包连 `code_reviews[]` 条目都没有、无任何机械检查发现。落地＝`check-sprint.js` 第 9 项审计留痕完备性（9 仓 dry-run 18 条砍到 8 条真命中，撞出两处解析缺陷）+ 级联抑制（一个格式代差曾放大成 ~50 条假漂移）+ 反向上游 `isExplicitNone`。**最大发现是门卫本身没在跑**：8 仓中 4 仓无 hook、`check-reusables` 零仓接入；已给 file-extract / doc-extract / JHH-Nortion / mail-ai 四仓真部署并做真触发测试（一放行一拦下）。wave 批量提案判否（回退决策#24），拆出的两条成立项另记待议。清单 29→32 条。全部改动冻结相容
- 2026-07-30 file-extract V1 收关复核：待议清单全量重判 + 四处落地 — 第二个完整 V0→V1 项目收关驱动：28 条未结全过一遍，减法 28→23（#13「质量模型转向可测试性」判为已实质落地、#14「develop 拆分」判为不做、两条 GIT 条目取数窗口用完即关、hact-app 三条合一）；四处落地＝v1 就地收割（`rounds` 仪器 / PRD 核 as-built / `risk-note`）、GIT 三处措辞 +「全绿也要契约对账」可达性闸、`check-reusables.js`（6 仓扫描 0 误报 1 真命中）、#29 三条 checklist。**穿透流的产出主类型判明为契约漂移而非缺陷**（两栈两阶段一致，code bug 各 0）。两处原判经核实推翻并记档。全部改动冻结相容；#30 押后至 file-extract v2；harvest 专项（317 条）本期未做
- 2026-07-28 减法纪律跨过项目边界（注释受众分离 + 退役账）— doc-extract v1–v6 代码审查驱动（源码 4.2x / 测试 11.7x / 注释率 40% / lint 877 行零退役 / 旧引擎零路由仍注册）：诊断修正为「减法纪律只停在本仓边界内」，把「注释受众分离」（本仓 CLAUDE.md 已对自己立过）与「退役账」（`supersedes` → PR 逐条结账 → G5 核对）推给项目侧；顺带清掉「任务包 18 字段」这个 8 文件 11 处的脆性计数；4 条挂在 doc-extract 上的待议重启条件重挂（两条取数窗口＝v6 联调，一次性）；地基关注点自洽复核留设计稿待新项目验证。均属扩面、冻结相容
- 2026-07-21 归属真空检查 + feedback 载体分池（A1–A3）— doc-extract v4/v5 经验总结驱动：`check-sprint.js` 加第 8 项归属真空（点名不存在的包/两包互推=FAIL，未点名=🧑；4 期实测抓到报告点名的两个头号实例、7 项目回归 0 误报）+ feedback 分池建成 `develop → backlog [欠账] → manual-test G4 前定夺 → 下期 PRD 过账` 链路 + post-V0 地基增补继承 foundation-review 探针纪律；核对中修正报告三处（B2 槽位不空/GIT 未跑、返工包账算错）；三项均修既有机制缺格、非新增，冻结相容
- 2026-07-18 codex-adapter 草案实验区从 master 移除 — CC+Codex 混合执行草案（2026-07-01 建）不再在 master 维护；Codex runtime-adaptation 战略仍在独立分支，本次不涉及。方法论 master 回归纯 CC 运行时
- 2026-07-17 Kimi Code + Kimi3 1M 适配分析落盘 — 评估 hact-method 在 Kimi Code + Kimi3 1M 下的可行性：核心骨架适用但需"引擎移植"（subagent 调用层/工具链/成本模型重估）；关键修正：Claude 已支持 1M，上下文非差异化变量；落盘 `_meta/plans/2026-07-17-kimi-code-kimi3-1m-adaptation-analysis.md`
- 2026-07-14 独立审查 subagent 降档目标 haiku → Sonnet 5（决策#26 参数回调）— doc-extract 实测 haiku 独审系统性误报、返工成本抵消降档收益：仅审查/一致性核对类升 sonnet（develop 独审 standard 档 + 4 个 review-brief 派发点），Explore 读文件与 GIT 执行 subagent 仍留 haiku；sensitive/foundation 档不变；非新增机制、冻结相容
- 2026-07-12 GIT-API 改造 land（穿透 + 边界，替场景矩阵）— doc-extract v1 GIT 31/31 全绿 0 命中 + harvest 2/118 实证"瞄错靶"：穿透流替按接口枚举（每终态一条·禁 fixture 抄近路·撞 de-v1-004 类接缝）+ 失败 ⚖️ 双路由 + 边界闸 opt-in（桩点即边界·🚫 真调）；改造非新增、下次 GIT 运行即自验证；web 侧不动
- 2026-07-12 foundation-review 证据化收紧（G1 探针通用化 + G2 自绿复现化）— doc-extract V0 二轮独审实证驱动：构造级/机械级声明须以亲手撞过的反例为证、自绿须干净环境复现；证 brief 严苛度 > 模型大小；G3（机械级接自动门）记待议、收紧非新增机制（冻结相容）
- 2026-07-08 实证回收（empirical harvest）— 回收 mail-ai v5–v8 + JHH v7 全量实测记录判定复杂度收益：已部署机制死重极少（独审 ≈70 阻断/安全裁决 2 触发/manual-test ≈19 拦截），疑点集中在未部署库存（#25–#29）→ 冻结新增至库存过一轮真实迭代；加投方向收窄为「真实外部边界冒烟 + 生产静默失败告警」
- 2026-07-08 安全敏感判定多层化（决策#29）— risk 不信自报、只升不降：五层防线堵"漏标 sensitive → haiku 审 → 自动合并"链（check-sprint 启发词 + Step3.5 第⑥类 + develop 有效 risk + 末端 diff 独立预检）
- 2026-07-08 exec spec 受众分离 — 运行时文本历史注解清扫（exec/skeleton06§7/structural 三层）+ CLAUDE.md 写作纪律防回潮；全局评审落盘 `_meta/plans/2026-07-08-method-review/findings.md`
- 2026-07-08 技术栈剥离 + 确认点分级（决策#27/#28）— standards 栈子模板层建成（frontend-vue3 / backend-nestjs）+ 播种三源；步骤协议引入 ⚖️ 默认判定档，准备段硬阻断收敛
- 2026-07-06 hact-method-lab 独立成仓 — 从 hact-method 的 worktree 切断为独立 Gitee 仓库，完整历史带过，旧基线原样保留
- 2026-07-02 Codex 适配层成本立论修订 — 立论改为"控成本"而非"上下文更小"+ 补合并权归属说明/长短卡同步检查/人工交接操作细节
- 2026-07-01 新建 codex-adapter/ 实验区 — CC+Codex 混合执行草案，不改动正式方法论
- 2026-06-29 地基层 + V0 走骨架（主管线重构，决策#25）— 两轮独审收敛，已推送 origin/method-lab
- 2026-06-29 hact-app 概念脱钩（方法独立性）+ WIP 归档 — 3 commit 已推送
- 2026-06-28 视觉地基三件套 — 补「跨切面地基」结构盲区，并入前端一致性框架
- 2026-06-20 develop 站「展开」四连改 — 执行模型翻转（独立审查 loop）+ 砍除 pr-review（merge-on-push）
- 2026-06-20 develop 站：撤销 sub7 家族拆分 — 单文件 develop.md 复位
- 2026-06-20 review-briefs/ pattern 推广到 PRD + tech-design — 三个末端审查 brief 全部外置
- 2026-06-20 plan-sprint 站致密化（340→275/−19%）— Step3 折叠 + 门卫散文收薄
- 2026-06-20 draft-tech-design 致密化 + standards 归位 + 步骤重排
- 2026-06-20 门卫（HOOK）样本建成 + 单环节致密化方法成稿
- 2026-06-20 HOOK/DRY 量账后双 park + 单环节 loop 试点（PRD 致密化）
- 2026-06-20 pipeline-reshape 开启 + 测试脊柱前置（乙-1+乙-2）
- 2026-06-19 sub7：develop 拆分（loop 第二层 park）— 471 行 → core+3 壳（后于 2026-06-20 撤销）
- 2026-06-19 sub6：TRD↔PRD AC 覆盖机械化
- 2026-06-19 sub5：PRD AC 稳定 id
- 2026-06-19 结构性审查收官：子计划 3b/3c/4 完成 + §7 冷核协议整段退场
- 2026-06-19 方法论方向转变：质量模型从"规范遵循"转向"输出可测试性"
- 2026-06-19 draft-ux 整体重构（角色姿态反转）
- 2026-06-18 Gate 签署前完成判据冷核（B 软版）+ draft-ux 回退修复
- 2026-06-18 draft-ux 交互质量（②造前探选 + ③subagent 冷审 + ①行为化清单）
- 2026-06-18 前端设计保真（design.md 必读 + pr-review 保真维度）
- 2026-06-18（续）prototype.html 接入链路（fix 3）+ fix 2 口径收口
- 2026-06-16 集成测试脚本移至 generate-integration-tests 阶段生成
- 2026-06-08 移除全部 Dynamic Workflow（计费口径对齐）
- 2026-05-31 status.yml 状态契约（hact-app 取数稳定化）
- 2026-05-31 个人积累与 pull 上提
- 2026-06-03 新增 draft-ux 交互原型任务
- 2026-05-08 第二阶段完成 + 第三阶段启动
- 2026-05-07 第一阶段·搭骨架 完成
- 2026-05-07 仓库初始化
