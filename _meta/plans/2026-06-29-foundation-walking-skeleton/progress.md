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

## 待办指针
- [x] 阶段 1：Q1=A（翻案）/ Gate=B / Q2 扩 / Q4 定
- [x] 阶段 2：foundation.md 模板 + init-project 共识步 + 命门 A（待 commit）
- [ ] 阶段 3：draft-tech-design 劈两半
- [ ] 阶段 4：V0 表示 + develop source=foundation + foundation-review brief
- [ ] 阶段 5：plan-sprint 收编视觉地基包 + draft-prd/draft-ux 接线
- [ ] 阶段 6：skeleton/status/BRIEF/STATUS 同步 + grep 验
- [ ] 阶段 7：收编 parked blueprint-layer + 验收
