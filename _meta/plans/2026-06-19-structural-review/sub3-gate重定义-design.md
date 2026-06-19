# sub3 design — 子计划 3 · Gate 重定义（linter 接闸 + 删冷核）

> 日期：2026-06-19
> 上游：本目录 `design.md` §7、§11.3；子计划 1 已交付 `templates/scripts/check-docs.js`（覆盖 PRD/TRD ①结构完备 ②PRD↔TRD 交叉一致）
> 性质：子计划 3 实施设计稿。把"完成判据冷核"在**有 linter 的 G1/G2 两关**重定义为"检查器全绿 + 人签语义"，兑现子计划 1 埋下的删除点。

---

## 0. 本轮范围（用户两项定调）

- **Gate 覆盖**：只 **G1 / G2**（linter 现仅覆盖 PRD/TRD）。G3/G4/G5 无 linter，冷核协议**暂留**，待后续增量建检查器再迁。
- **机械硬闸 hook**：**本轮不做**。①② 变 linter 退出码后"假装做"空间已大减；hook（PreToolUse 拦签字 + 指纹）跨项目仓部署成本高，留作后续硬化。当前仍靠 spec 被遵循 + 人在签字现场把关。

---

## 1. 为什么是 G1/G2 而非全 5 关

冷核 subagent 实际干三种活（design §8 演练三）：①结构完备 ②交叉一致 ③语义。①② 正是 `check-docs.js` 的确定性活，但它**只 parse PRD/TRD**：

| Gate | 有无 linter | 本轮处置 |
|------|:---:|------|
| G1 PRD | ✅ check-docs（结构 6 段 + 功能槽 + AC + draft-ux 枚举） | ①② → linter；③ → 产品（用户逐功能确认）。**删 subagent 冷核** |
| G2 TRD | ✅ check-docs（结构 7 段 + 表/接口块 + PRD↔TRD 交叉） | ①② → linter；③（接口满足画面/AC 映射）→ Step 3 AC 覆盖映射自检（已人确认）+ pr-review 技术保真。**删 subagent 冷核** |
| G3 sprint | ❌ | 冷核暂留 |
| G4 acceptance | ❌（人驱动为主） | 冷核暂留 |
| G5 wrap | ❌（判据 grep 可测，但未建） | 冷核暂留 |

G1 干净（design §10 钉死 PRD 正确性归人，逐步确认已是最合适模型）。G2 的 ③语义残量是真·不可视区缺口——本轮**不假装用另一个 AI 兜**，明确落到既有的 Step 3 AC 自检 + pr-review 路 1，真正补强留给子计划 2（AC→test）。这与 design 主旨一致：删掉"病的活体标本"（AI 核 AI 盖章）本身就是赢，即便语义洞要等子计划 2 才填实——因为冷核本就是橡皮章（design §3），删它不使现状更差。

---

## 2. 具体改动

### 2.1 `skeleton/06-gates.md` §7 — 两层重定义

§7 标题改「完成判据冷核协议」→「完成判据核对」。结构：

- **总述**：完成判据两类机制——【linter】判据由 `check-docs.js` 确定性机械核（结构 + 交叉一致），语义判据由对应职能的人签字时确认。
- **G1/G2 段（有结构 linter）**：跑 linter 退出码 0 = 全部【linter】判据过；语义残项由签字人确认；**不派 subagent 冷核**（linter 取代原协议 ①②，语义归人——原"派 AI 核 AI 盖章"在此两关退场）。存量项目无 `check-docs.js` → 退回下方 subagent 冷核兜底 + 提示补铺。
- **G3/G4/G5 段（暂无 linter）**：沿用原 subagent 冷核协议（步骤 1–5 原文保留，仅冠以适用范围）。
- 「与既有审查关系」段保留。

净收缩在 specs，§7 因保留 G3-5 协议略增——可接受（design §2：货币是"删了多少 AI-肉眼步骤"，本轮删 2 个）。

### 2.2 `specs-execution/draft-prd-vN.md`

- **Step 7.4** 升格：从"冷核之前先跑（机械先行）"→「【linter】判据的最终判定」。退出码 0 → 语义判据由产品确认后**直进 Step 8 签字**（不再"进 7.5 冷核"）。注脚改：语义判据由你逐功能把关，签字复核；无脚本 → 退回 §7 subagent 冷核兜底。
- **Step 7.5** 冷核：**整步删除**。
- **Step 8** 签字前置：改为「Step 7.4 linter 退出码 0 + 语义判据你已确认」。
- git commit：移除 `iterations/vN/gate-checks/G1.md`。
- **Subagent 使用**：改为「PRD 纯对话，无需 subagent；仅存量项目未铺 check-docs.js 时退回 §7 subagent 冷核兜底」。

### 2.3 `specs-execution/draft-tech-design.md`

- **Step 5.4** 升格（含交叉对账兑现）。退出码 0 → **直进 Step 6 签字**。注脚改：语义判据由 Step 3 AC 覆盖映射自检 + pr-review 技术保真把关；无脚本 → 退回 §7 兜底。
- **Step 5.5** 冷核：**整步删除**。
- **Step 6** 签字前置改；git commit 移除 `gate-checks/G2.md`。
- **Subagent 表**：删 Step 5.5 冷核行（保留启动 Explore / standards 生成两行）。

### 2.4 两份 structural 契约

- 删【linter】删除埋点括注（draft-prd-vN 56 行 / draft-tech-design 58 行），原说明行去掉"仍留冷核"措辞。
- 「完成判据已冷核」行改为：「【linter】判据 check-docs.js 全绿 + 语义判据签字人已确认（见 §7；存量项目无 linter 退回 subagent 冷核兜底）」。

---

## 3. 不触

G3/G4/G5 三关：`plan-sprint` / `manual-test` / `wrap-up-iteration` 的 exec（Step 4.7 / 签 G4 前 / 签 G5 前）+ 其 structural「完成判据已冷核」行 + Subagent 表冷核行——**全部不动**，继续走 §7 G3-5 段的 subagent 冷核。`init-project` 铺 check-docs.js 不动。`gate-checks/` 目录概念保留（G3-5 仍写凭证）。

---

## 4. 净收缩账

- 实时路径删除 **2 个 subagent 冷核步骤**（G1 Step 7.5、G2 Step 5.5）+ draft-prd-vN 的"唯一 subagent 例外"消失（PRD 全程零 subagent）。
- structural 删 2 行删除埋点括注。
- §7 略增（保留 G3-5 协议 + 加 G1/G2 两层框架）。
- 全 5 关的彻底删除（连 §7 主体）待 G3/G4/G5 建检查器后的后续增量兑现。

---

## 5. 兼容存量项目（解 design §10#5）

新项目 `init-project` 铺好 check-docs.js → 走 linter 路；存量项目（hact-app / org-krm-v2 未铺）→ §7 G1/G2 段的"无脚本退回 subagent 冷核兜底"接住，不阻断、不报错。存量项目可后续重跑 init-project Step 3 补铺脚本即自动切到 linter 路。
