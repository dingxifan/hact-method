# sub7 design — develop 拆分（findings §三 #1）

> 日期：2026-06-19（会话 9）
> 起点：loop 第二层 park 后，火力转 findings §三 #1「develop 不是一个 task type，是五个」。
> 性质：spec 组织的结构性重构。**判据仍是 design §2 净收缩**——拆分若复制核心则背叛初衷。
> 前序：loop 第二层正式 park（sub1-6 已建 validator，per-API 拆分是编排 ADD、develop 模块级 loop 已被 sub2 做掉）。

---

## 0. 一句话

`develop.md`（471 行）按 `source` 内部分支路由五条路径（sprint / integration / manual-test / bug / optimization），违背决策 #14「task.type 是路由键」。本子计划把**真正发散的路由边缘**提成独立 task type，**共享实现核心**避免复制，让 spec 净收缩而非膨胀。

---

## 1. 病灶（findings §三 #1，实测校正）

findings #1 原话：「develop 不是一个 task type，是五个；source=sprint/integration/manual-test/bug/optimization 五条路径，上下文加载/反馈去向/checklist 完全不同。」

**实读 develop.md 后校正两点**：

1. **checklist 差异是 layer 驱动，不是 source 驱动**——frontend/backend 各一份 checklist（第零步 + 前后端差异表已处理），与 source 无关。findings #1 此处略有夸大。
2. **source 分歧集中在「边缘」（intake + handoff + feedback 路由），核心（Steps 1–7 实现流）是 source 无关的**。

### source 实际分支点（全 spec 仅 5 处）

| 分支点 | 行 | 谁不同 |
|--------|-----|--------|
| 会话启动 G3 前置检查 | 33–37 | **仅 sprint** 要核 G3；其余无 Gate |
| 拾取 + 交付=独立/批量 + 批量会话步骤 | 39–67、312–352 | **仅 sprint**（~100 行）；integration/manual-test/bug/optimization 都是单任务 dispatch 派发，无 sprint.md 拾取、无交付列、无批量 |
| task 包路径 | 72 | A 类 `iterations/vN/queue/` vs B 类 `b-queue/` |
| Step 9 移交 | 280–283 | per-source 追踪文件（sprint 无 / integration·manual-test 写 session / bug·optimization 写 b-tasks.md） |
| Step 10 feedback 去向 | 301–308 | A 类（sprint/integration/manual-test）→ feedback.md + wrap-up 分流；B 类（bug/optimization）→ 就地分流个人 notes |

**核心（source 无关，全员共用）**：第零步 layer 确认、精确加载、Step 1 理解、Step 2 规模评估/拆分、Step 3 复用检查、Step 4 实现、Step 5 自检（写测试+跑绿+偏离）、Step 6 commit、Step 7 推 PR、Subagent 协议、前后端差异、上下文管理。**这是 471 行里的大头。**

---

## 2. 自然分组：不是 5，是 3

source 内部差异塌缩后，真正分歧的是 **3 组**（组内差异只是一个追踪文件名/一行分支，trivial）：

| 组 | 含 source | Gate | intake | 反馈去向 |
|----|-----------|------|--------|---------|
| **A·sprint 主开发** | sprint | G3 前置 | sprint.md 拾取 + 交付独立/批量 + 批量会话（重） | feedback.md + wrap-up |
| **B·A 类派生修复** | integration + manual-test | 无 | 单任务 dispatch（queue/，轻） | feedback.md + wrap-up |
| **C·B 类** | bug + optimization | 无 | 单任务 dispatch（b-queue/，轻） | 就地分流个人 notes |

> integration vs manual-test 的唯一差别 = Step 9 写哪个 session 文件；bug vs optimization 几乎无差别（都 b-queue + b-tasks.md + 就地分流）。把它们各自再拆成独立 type 是过度拆分，复制核心无收益。

---

## 3. 决策张力：#14 路由键 vs §2 净收缩

- **决策 #14**：task.type 是路由键（决定加载哪份 standards / 所属 Gate / 完成判据）。A/B/C 三组的「所属 Gate」（sprint 有 G3、其余无）和「完成判据/反馈去向」确实不同 → 支持提成不同 task.type。
- **§2 净收缩**：核心实现流（Steps 1–7）若被复制 N 份，总散文量暴涨，正好背叛「可持续」。

**化解**：task.type 可以是路由键**而不复制内容**——每个 type 是**薄壳**（intake + handoff + feedback 路由），`@`-include / 引用**同一份实现核心**。hact-method 本就用 `@` 引用（CLAUDE.md / 项目仓 CLAUDE.md 引规范）。薄壳 + 共享核心同时满足 #14 与 §2。

---

## 4. 候选方案

| # | 方案 | task.type 数 | 净收缩判定 |
|---|------|:---:|------|
| **A** | 3 薄壳（develop-sprint / develop-repair / develop-b）+ 1 共享实现核心（develop-core.md，`@` 引用） | 3（+core） | **最佳**：核心写一遍，边缘各自薄。#14 与 §2 兼得 |
| B | 2 类（A 类 / B 类）+ 共享核心 | 2 | 次优：A 类仍把 sprint 重 intake 与 repair 轻 intake 塞一处，sprint 的 ~100 行批量逻辑压到 repair 头上 |
| C | 不拆 type，仅内部重构（顶部 source 路由表 + 抽出核心段，正文减分支） | 1 | 净收缩有限、不满足 #14；但改动面最小、风险最低 |
| D | 全 5 type | 5（×layer 更糟） | **否决**：复制核心 5×，反 §2 |

### 推荐：A（3 薄壳 + 共享核心）

理由：
1. 唯一同时满足 #14（task.type 真路由）与 §2（核心不复制）的方案。
2. 分组与 BRIEF 决策同构——C 组 = B 类（决策 #4–7：无 Gate、恒定 2 会期、b-tasks 总账、就地分流），早已是方法论一等概念，提成独立 type 名正言顺；A 组 = sprint 主开发（G3、批量会话）；B 组 = A 类派生修复（联调/人工失败回写）。
3. 把 sprint 专属的 ~100 行批量/拾取逻辑从核心剥到 develop-sprint 壳里，core 显著变瘦，repair/b 两壳不再背它。

---

## 5. 下游影响面（实施期处理，非本设计稿落地）

拆 task.type 牵动（按改动量排序）：
- **specs-execution**：拆 develop.md → develop-core.md + develop-sprint.md + develop-repair.md + develop-b.md（核心一份，壳三份薄）。
- **specs-structural/develop.md**：对应拆 / 或保留单份按 type 标注完成判据差异（待定，见开放问题）。
- **skeleton/04 任务全谱**：develop 一条 → 三条（disciplines 仍是 dev-frontend/dev-backend，不变；task.type 列增）。
- **dispatch-new**：派任务时写哪个 task.type（integration/manual-test 派 develop-repair；bug/optimization 派 develop-b；plan-sprint 入 queue 的是 develop-sprint）。
- **status.yml schema**（skeleton/07）：tasks[].type 的枚举值从 develop 扩成三个；存量冻结（旧 task 不回填）。
- **plan-sprint / generate-integration-tests / manual-test / pr-review**：凡引用「develop」task 处，按新 type 名校准（多为文字校准，非逻辑改）。

> 此面较大。是否值得为「spec 组织正确性」付这笔重构，是本设计稿要向用户确认的第二个点（方案选定后）。

---

## 6. 开放问题（实施前定）

1. **方案 A/B/C 选哪个**（§4）——决定整体形状。
2. **共享核心的引用机制**：`@`-include（CC 加载时展开）还是「壳里写『加载 develop-core.md 后继续』」的运行时跳转？hact-method 现用 `@`（静态展开）——倾向 `@`。
3. **specs-structural/develop.md 拆不拆**：结构层契约是否也拆三份，还是单份按 type 分节标注完成判据差异。
4. **存量兼容**：hact-app 现有 develop 任务（task.type=develop）如何处置——倾向存量冻结（与 sub3c/sub5 同款，旧迭代不回填，新派任务用新 type）。
5. **是否本轮全做 vs 先做 A 组剥离**：可一次拆三壳，也可先把 sprint 重 intake 剥出（最大净收缩单点）验证形状再续。

---

## 7. 净收缩账（预估，待实施核实）

- **删**：core 里 source 分支判断（5 处 if-source）退场，核心变直线；sprint 专属 ~100 行批量逻辑从核心移出（移动非删除，但让 repair/b 两壳不背它 = 等效核心瘦身）。
- **加**：3 个薄壳 header + intake/handoff/feedback 各自的少量散文（每壳预估 30–60 行）+ task 全谱/status 枚举/dispatch 的 type 名校准。
- **判定**：若薄壳真薄（核心不复制），net = core 减分支 + 三壳薄壳总和，**应 ≤ 原 471 行**，且 #14 路由键兑现。若任一壳开始复制核心 → 立即停，退回方案 C。**这是本子计划的自我背叛红线。**

### 实测结果（会话 9 落地后回填，与预估对账）

- **预估「≤471」未达**：原 417 → 新 519（core 308 + sprint 124 + repair 41 + b 46），**总行数 +102**。
- **根因**：原 develop.md line-efficient **恰因它 cram**（共享 boilerplate + 紧凑 source 表 ~5 行覆盖 5 源）；拆成 4 个可独立加载文件，每文件付 header/framing 开销，开销 > sprint 路径省下的分支。预估当时低估了 framing 开销。
- **硬红线（壳复制核心）未触发**：核心只写一遍，壳真薄（repair 41 / b 46）。
- **per-session context（findings #1 真正要的指标）改善**：repair 会话 core+repair=349（−68），b 会话 354（−63），sprint 会话 432（+15）。crammed 路径瘦身、各会话不再载别路径逻辑、#14 兑现。
- **结论**：sub7 是**结构正确性 reorg**（#14 + per-path 隔离），**不是 raw 行数净收缩**——与前 6 子计划性质不同。「总行数」对 reorg 是错判据。如实记账，不 spin。用户若以 raw 行数为硬约束，可考虑退方案 C（行数中性但不兑现 #14）。

---

## 附：本稿边界

本稿固化**分组认识（3 不是 5）+ 方案候选 + 净收缩红线**，不含具体壳/核心的改写文本。批准 = 方案选定，进入实施。
