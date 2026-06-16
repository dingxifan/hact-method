# progress · 两审查统一调整方案

## 会话 1（2026-06-16）

### 缘起
用户要求把 `2026-06-06-method-audit`（广度 33 条）与 `2026-06-16-develop-loading-audit`（AC 保真深度）两份审查**统一制订调整方案，再落实**。

### 已做
- 读完两审查全部文件，去重聚成 8 主题，按「现在咬人 / 团队期 / 决策层」分类
- 用户选定本轮范围 = **主题 1-4（现在咬人）**，不动 BRIEF.md 决策
- 通读在范围 spec（develop/plan-sprint/draft-tech-design/draft-prd-vN 执行+结构、skeleton 07/01、CLAUDE.md、standards/shared、draft-ux）
- 产出逐条可落实的 `task_plan.md`（含受影响 ~10 文件、本轮不做清单）

### 方法（用户 2026-06-16 定）
逐条闭环：先落文件（task_plan 清单）→ 每条派独立 agent 审查前校验（①问题真实②拟改法正确完整③跨档冲突④替代方案）→ 人机二次讨论定稿 → 落实该条 spec → 下一条。全程不自动 push。

### 进度
- **1.1 AC 可追溯回链**：✅ 定稿（替代 A：文本引用回链，不引入 id、不动 hact-app）+ 落实（6 文件 7 处编辑）。延后稳定 id / status.yml prd_ac_refs。
- **1.2 对抗审查回注 PRD AC**：❌ 撤销（走 X）。校验指出回注会掺杂 Step5.5 焦点纯粹性；用户提出更优思路——把独立审查移到源头 plan-sprint。
- **1.2′ 任务包独立对抗审查**（plan-sprint Step3.5）：✅ 定稿 + 落实。两轮 agent 校验 + 多轮二次讨论敲定：内联实现（不复用 adversarial-review skill）、时机 plan-sprint Step3 后、3 类检查（AC忠实性/完备性/api-contract）、files 行号不审（物理做不到）、机械保真留自检层、loop 3 次→revise-doc(trd)、按包分批。
- **1.2″ revise-doc 中途漂移兜底**：✅ 落实（revise-doc Step5 加 AC 对账重跑）。
- **关键决策记录**：独立性分两层——①对实现意图致盲（Step5.5 核心）②审查焦点纯粹性；回注 PRD 不破①但破②，故移源头。时机论证：任务包=终态工单，plan-sprint 是最后便宜闸 + 任务包 vs PRD 直接比对可透传抓 PRD→TRD、TRD→任务包双漂移。

- **1.3 字段自检升级保真**：✅ 定稿（替代 A）+ 落实。校验拆穿"伪机械判据"——真机械（reference 行号、前端必链 ux-flows）留自检；语义（relevant-standards 覆盖）进 Step3.5 第④类；files 行号不卡（物理矛盾）；映射表（替代 B）记待议。

- **1.4 全局横切 standards 必读锚点**：❌ 不做。校验指出与 1.3 Step3.5 第④类冗余、破坏 develop 精确加载哲学；失明已在源头治。分页属项目级、事务后端专属。

- **1.5 后端分支路径**：✅ 定稿（替代 a）+ 落实。校验纠偏——病灶是后端 reference 没链 TRD 错误码/服务流程（非红线排除后端）。不新增字段，后端 reference 对称硬卡链 TRD，复用 1.3 保真机制 + 场景名对齐锚点。用户选 A（不强制进 AC）。

- **1.6 escalate-if 对"平滑做错"敏感**：❌ 不做（选 B）。已被 Step3.5 上游治；develop 自检受自指悖论无效；原拟改法冲突 + 误报 B 类。

- **1.7 跨任务全局不变量**：✅ 定稿（替代 a）+ 落实。校验纠偏——真正的洞是既有 P1（depends_on 脱节）。落地 depends_on 进 17 字段、消费方反查、不塞 known-risks。全仓"16字段"→"17字段"。团队期完备性检查 + decisions 选读延后（记待议）。

### 主题 1 收口（AC 保真链路）
- 1.1 AC 文本回链 ✅｜1.2 撤销→1.2′ plan-sprint 独立审查 ✅ + 1.2″ revise-doc 兜底 ✅｜1.3 字段保真分级 ✅｜1.4 全局横切 ❌不做｜1.5 后端 reference 链 TRD ✅｜1.6 escalate ❌不做｜1.7 depends_on 落地 ✅

### 主题 2（status.yml 健壮性）
- 2.1 写入校验 ⏸️ + 2.2 接续核查 ⏸️：用户"新老方法并行阶段"原则——status.yml 当下只写没人读（hact-app sync 仍读 markdown），写入硬化价值要等 hact-app 切读才兑现，捆该迭代做（记待议）
- 2.3 compact 原子性：✅ reframe——校验判定原方案打错靶（compact 不威胁已落盘文件），改为 CLAUDE.md 加「断点续做对账原则：以工作区为准核对 progress.md」

## 本轮收口（2026-06-16，用户定：做完 2.3 结束）
- **实改 7 条**：1.1 / 1.2′ / 1.2″ / 1.3 / 1.5 / 1.7 / 2.3
- **校验否决 3 条**：1.2 / 1.4 / 1.6
- **延后下期**：2.1 / 2.2 / 主题 3 / 主题 4 / 团队期项 / 决策层项（详见 task_plan「本轮收口」+ 方法论待议.md）
- 受影响文件 11 份 spec/skeleton/template/guide + 待议清单
- **未 commit / 未 push**——待用户确认（master 分支不自行 push）
