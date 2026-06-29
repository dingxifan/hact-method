# progress — 地基层 + V0 走骨架

## 会话 1 · 2026-06-29（设计沉淀）

**从哪来**：接昨天（2026-06-28）视觉地基三件套。用户问"视觉地基是不是提高前端一致性/复用性的一部分"。

**讨论链路（一路收敛）**：
1. 概念层 #1：复用/地基/lint 边界 = 按"东西的家住哪"分（每行/多包/全局根）；盲区只在"全局根"繁殖。引出五种形式 + 强制边三档。
2. 用户确认别的项目也被咬（同源交互各模块不一 / 空数据各页报错降级兜底不一）。
3. 两层楼：决策层 vs 落地层；AC 线/独立审查是落地层、对决策缺席失明。
4. #3 后端同构验证：后端全是跨切面决策（错误形态/分页/空结果/序列化/鉴权）；缺的是同一个 forcing-function（切包前把决策做掉）。
5. 压决策 #20：发散的决策内容不 task 化（骑既有任务），只新增"清扫 check" → 不撞 #20。
6. 用户掀桌重定形状：不要"一样内容一篇文章"（规则堆积=被忽略的信号），要"先搭地基+建筑规范、之后累加、跳出了再砌"。= scaffold-first/standards 归位/blueprint-layer 的同根。
7. 收敛成地基层：准入门槛（已证明跨切面+稳定）+ 强制边自巡逻，挡住"规则膨胀"和"地基砌歪"双悬崖。
8. 用户缩小：退掉"蓝图"名（太大，给超大项目），中小型用"地基"；补出两进料口（技术内生 + 领域涌现，后者从早期探讨摸）。
9. 落点定 init-project、PRD 之前；校正"init 砌的是蓝图文档不是代码框架"。
10. 拿 mail-ai + JHH 两成熟项目实测捞例子（见 findings §四），逮到"最重要地基守最弱边"的活标本。
11. 用户提"生成任务包让 developer 真建出地基级骨架，V1 前完成" → 升级为**完整重构 + V0 走骨架**。

**本会话产物**：
- 派两个 Explore 实测 mail-ai / JHH 地基代码（findings §四）。
- 核实 mail-ai/JHH 数据隔离是人审级（手写 where，逮到 remove 漏 accountId）。
- 建本计划目录 + 三件套，切 `.current_plan`。

**锁定决策**：D1 完整重构 / D2 V0 走骨架（见 task_plan）。

**git**：本地 method-lab，仅新增 `_meta/plans/2026-06-29-...`，尚未 commit。规范文件未动。

**下一步**：阶段 1 — 和用户敲 Q1（地基设计落点：新 task vs draft-tech-design V0 模式）+ Q2（V0 要不要 G0 Gate）。这两个定了才动主管线。其余 Q3–Q6 随阶段推进定。

## 会话 2 续 · 2026-06-29（阶段 2 落地 + 命门 + 阶段 3 设计）

- **阶段 2 落地**：新建 `templates/foundation.md`（两段合一表 + 技术内生 11 行 + 安全项应有档=构造级 + 命门头部度量）；init-project exec 加 Step 6 共识讨论 + Step 7 移交指向 V0；init-project structural 同步。
- **命门一段（用户输入）**：① 代码生成整条删（CC 即生成器，findings §八）；A 命门=foundation.md 度量✅；B 标杆切片→阶段4；C foundation-review 必问→阶段4；③ 标杆模块因删①升主防线。
- **阶段 3 设计 + Q1 翻案**：读 draft-tech-design 真本子 → 它全程 PRD/AC 驱动、V0 无 PRD → "V0 模式"=丑 if/else。**Q1 由 B 改投 A**（新建 `draft-foundation`，抬首期簇）。Q2 整个首期簇搬 V0；Q3 同 G2 槽两套判据（A 让其干净）；Q4 设计定切片/develop 建+登记。用户确认 A。
- **即将 commit 阶段 2 + 计划**（本地 method-lab，**不 push**），工作区清干净再进阶段 3。

## 会话 3 · 2026-06-29（第三轮检查 + JHH 补 V0 实战实验 + 收获落地）

**第三轮检查（V0 对下游影响 + 措施落地）**：派三 agent 审建立侧/消费侧/接线层 → 全健全、无断链、计数自洽（13 task/8 discipline）。亲自裁决掉 agent 多条"高危"误报（测试框架约定在 draft-foundation:122、decisions 栈选型在 :134、task 13v14 是 draft-ux 存量约定与 V0 无关）。落 3 小缝（commit `5e4975e`）。

**JHH-Nortion 补 V0 实战实验（本会话核心）**：
- 选 JHH（已指向 hact-method-lab、零配置）。倒推 foundation.md + draft-foundation 诊断 + 独立 foundation-review 审真代码。
- **关键转折**：初判"数据隔离守人审弱边"（手写 .eq、逮到 goals:76-81 漏 user_id），**被用户一句"后台接 Supabase、可能靠 RLS"掀翻**——查实：RLS policy `user_id=auth.uid()` 真实启用、前端 anon-key 直连走 RLS 构造级、后端 service_role 是受治理豁免、漏 user_id 的子查询被上游归属闸挡（反例不可达）。**三个审查 agent 一致误判 = 单层 pattern-match 判档的系统盲点。**
- **诚实修正**：JHH 数据隔离实为构造级（主路径 RLS），初判误报；"走到底"建 ScopedSupabaseService 前提不成立、未做。
- **重构视角（用户提的 greenfield 模拟）**：站 V0 列地基清单 + 对比 JHH v7 真实状态——安全维度 V0 不改变（成熟团队 RLS/守卫已对），真价值=抗一致性漂移（响应/分页/序列化/四态/token 等 6 块停人审、7 迭代已漂）。
- **口径校正（用户）**：安全 = 开发质量的结构性保证（非数据安全专用）；强制边/命门是通用质量机制；规模下复利失控的是质量档位松动，临界点=第五阶段真人进来。
- **5 块构造级机制讲透**：RLS@DB / APP_GUARD / 全局 ValidationPipe / (main) 路由组 / api-client 单例；前 4 平台焊死(真构造级)、第 5 单通道强约定(缺 lint 可绕)。规律=真构造级靠平台瓶颈禁止违规，非"记得用 helper"。

**收获落地（commit `a08ec1b`）**：A 多层强制边规则 + B 反例可达 → foundation-review 判档核心；C 数据隔离形式加 DB 层 RLS + 口径（安全=质量/真构造级判据）→ foundation.md 模板命门段；E draft-tech-design Step7 存量守卫。JHH 实验产物已清、未污染。

**仍开**：F draft-ux 13/14 计数（存量、与 V0 无关、低优先）。本地 method-lab 12 commit 未推，push 待人类。

## 待办指针
- [x] 阶段 1：Q1=A（翻案）/ Gate=B / Q2 扩 / Q4 定
- [x] 阶段 2：foundation.md 模板 + init-project 共识步 + 命门 A（待 commit）
- [ ] 阶段 3：draft-tech-design 劈两半
- [ ] 阶段 4：V0 表示 + develop source=foundation + foundation-review brief
- [ ] 阶段 5：plan-sprint 收编视觉地基包 + draft-prd/draft-ux 接线
- [ ] 阶段 6：skeleton/status/BRIEF/STATUS 同步 + grep 验
- [ ] 阶段 7：收编 parked blueprint-layer + 验收
