# 归属真空 + feedback 载体分池（A1–A3 落地）

> 2026-07-21。触发：doc-extract v4/v5 两期经验总结（`doc-extract/_meta/reviews/v4-v5-methodology-retrospective.md`）——
> v5 全面独立审查出 8 阻断 + 16 建议，报告归纳出 6 个跨期复现模式并列了 A/B/C 三类候选优化。
> 本轮只做 A1–A3，且三项**全是修既有机制的缺格**，不是新增机制（与 2026-07-08 机制冻结相容）。

---

## 一、报告核对结果（动手前把指控回本仓验了一遍）

| 报告主张 | 核对结论 |
|---|---|
| 元问题：方法论改进的载体（`feedback.md`）随迭代清空、出口在 G4 下游 | **成立，且根因比报告写的更靠上**——是 spec 级缺陷，见下 |
| B2：缺一步「develop 全 merged 后的全局接缝审」 | **槽位不空**。v5 `gates.md` G4 未签、`integration-tests/` 无 `scripts-v5.md`，即 v5 **根本没跑 `generate-integration-tests`**；GIT-API 已于 2026-07-12 改造成"穿透 + 边界"，位置正是 B2 想插的那一格 |
| A3：需要新建「机械级条款 → 落地手段」对照表 | **机制已存在、只是不覆盖 post-V0**。foundation-review 的证据化探针挂在 `draft-foundation`（V0 一次性）；V1+ 新增关注点走 `draft-tech-design` Step 7，那里只写"立应有档"、未继承探针要求 |
| 量化证据「v4 返工包 6 vs v5 返工包 0」 | **账算错**。`iterations/v5/sprint.md` 有 de-v5-015~019 五个修复包（019 直接标 `B1-fe+B8+B3-fe+B6`），只是没算进"14"。真实对比是 **6（G4 后发现）vs 5（G4 前发现）**——检测点前移一个 Gate 是真改善，但"逐包独审在包内已有效"的支撑强度要下调（B5 是包内缺陷，逐包独审看得见却没看见） |

### 元问题的 spec 级根因

`specs-execution/wrap-up-iteration.md` 第二步分流表原有 6 个去向：notes ×4 / `decisions.md` / 删除。
**没有一格是"本项目下期必须做的功能/技术欠账"**，`backlog.md` 不在目的地清单里。
而 `develop.md` 把 A 类超范围发现全部导向 `feedback.md`。

于是"某处声明的约束在代码里没有落地手段""上期有的入口本期没了"这类**项目本地、可执行的欠账**进 feedback 后无合法归宿——
要么被删，要么误塞进 notes（notes 的消费者是 harvest-notes → 公共层，不回流本项目下一期）。
叠加"分流后必须清空 feedback.md" + wrap-up 在 G5，链路闭合成黑洞。

---

## 二、改了什么

### A1 · feedback 分池 + G4 前出口（载体不修，后面写什么都会被倒掉）

建成一条完整链路，每一环都有明确的读端：

```
develop 发现本期代码缺口
   → backlog.md [欠账]                     ← develop.md 反馈去向表分岔
   → manual-test 会话启动读本期 [欠账]      ← G4 前唯一出口，逐条交用户定夺
       ├ 本期补 → Step 3 派修复任务
       └ 留下期 → 留 backlog + 写进验收报告「本期已知欠账」段
   → 下期 draft-prd-vN Step 1 逐条定去向    ← 纳入本期 / 继续留 / 不做（无第三种结局）
```

- `templates/backlog.md`：加 `[欠账]` 条目格式
- `specs-execution/develop.md`：A 类反馈去向表由一行拆两行——**规范该怎么改** → `feedback.md`（原样）；
  **本期代码的具体缺口** → `backlog.md` `[欠账]`，并写明不进 feedback 的理由（出口在 G5、验收前拦不住任何东西）
- `specs-execution/manual-test.md`：会话启动精确读取加 `[欠账]`；Step 2 告知模板加「本期已知欠账」段 + 🚫 逐条定夺
- `specs-execution/draft-prd-vN.md`：Step 1 加 v2+ 欠账过账（⚖️）
- `specs-execution/wrap-up-iteration.md`：分流表补第 6 格（`backlog.md` `[欠账]`）+ 分流播报加计数
- `templates/acceptance-report.md`：加「本期已知欠账」表
- `specs-structural/`：`wrap-up-iteration.md` 产物表 + `manual-test.md` 完成判据同步

### A2 · check-sprint.js 归属真空检查（第 8 项）

判据分三档，只把机械可判的判死：

| 情形 | 处置 |
|---|---|
| 推卸语点名的包 id 不在本期 queue | **FAIL**（推给了不存在的包） |
| 两个包互相声明"这件事不在本包" | **FAIL**（落在交集里，两边都不做） |
| 推卸语未点名任何承接方 | `🧑` 逐条指认（认领方机器认不出，不硬判） |

实现要点：
- 只匹配"移交给别人"的措辞，不匹配普通禁令——`do-not` 里的"不改 X / 不新增 Y"是正常内容。
  `不在本包(?![内中里])` 排除"不在本包内另查 X"这类实现禁令（doc-extract de-v5-006 实测误报，已消除）。
- **punt 扫描走原始行、不用 `parseFrontmatter` 产物**：共用解析器按 YAML 规矩把 ` #` 起的尾串当注释剥掉，
  而任务包正文 `决策 #25` 这类引用很常见，剥完会把同一行后半段吃掉——doc-extract de-v4-009 的推卸语正好在截断点后面，
  用解析产物扫会漏掉报告点名的头号实例。
- 报文截推卸语前后各 30 字，不从行首截（整行常上百字，从行首截看不见命中处）。

同步：`specs-structural/plan-sprint.md` 完成判据加一条【linter】。

### A3 · post-V0 地基增补继承探针纪律

- `specs-execution/draft-tech-design.md` Step 7：声明 ≥机械级时必须二选一——
  **手段已在** → 亲手写违规、跑对应检查、真被挡才算数（探针临时文件跑完即删）；
  **手段本期才建** → 登记「待建·应有档 {档}」，交 `plan-sprint` 拆地基跟进包。
  给不出位置也不派人建 → 只能立人审级。
- `specs-execution/plan-sprint.md` 地基跟进包规则：关注点标 ≥机械级 → 跟进包 AC 必须含反例验证，
  不能只写"接了 lint 规则"。
- `specs-structural/draft-tech-design.md` 产物表同步。

---

## 三、A2 的实测（4 期 + 7 项目全量回归）

doc-extract 逐期：

| 期 | 归属真空命中 | 性质 |
|---|---|---|
| v1 / v2 | 0 | — |
| v3 | 1（🧑）de-v3-007 "nginx MIME/Cache-Control 属 deploy、不在本包" | 真命中，承接方是 deploy 任务，一句话可答 |
| v4 | 1（🧑）de-v4-009 "前端整票入口留后续 polish，不在本包" | **报告点名的导出入口缺位（模式 1 头号实例）** |
| v5 | 1（🧑）de-v5-001 "别名（调用点收口不在本包）" | **B1（DOC_TYPES 收口）的根** |

跨项目全量回归（mail-ai / JHH-Nortion / org-krm-v2 / hact-app / wms-bellwether / loxson-salary-new / ai-driven-fms 全部迭代）：
再多 2 条 🧑（mail-v8-004 / salary-v4-001），**0 条 FAIL 误报**。

v4 报告里那 2 条 FAIL 是既有检查项（de-mt-003 reference 无行号），与本次改动无关。

> **未收口的一点**：mail-v8-004 写的是"属 006，不在本包"——用裸序号而非完整 task-id，
> 故走 `🧑` 而非"已点名"分支。可以把裸三位数也认成 id 后缀，但那会让"已点名"分支更容易被噪音触发、
> 从而**静默放过**真的真空。宁可多问一句：🧑 不阻断，签字人一个词就能答。

---

## 四、本轮明确不做

| 项 | 理由 |
|---|---|
| B2 全局接缝审（新增一步） | 槽位已被 GIT-API 穿透流占着且 v5 没跑过。先让 v5 跑 GIT，看穿透流实际拦下几条，用真实数据决定要不要扩它的进料口 |
| B1 旧假设回查包 | 真·新增机制，撞冻结。建议下一期手工做一次不入规范，跑完再谈 |
| B3/B4/B5（AC 自检 / 后端验收锚 / 豁免双侧实证） | checklist 类增补，等 A1 的载体稳定后再谈——否则写进去也是下次 wrap-up 被清 |
| A4 三道失效末端门 | 不是方法论改动，是 doc-extract 自己的 backlog 债 |
| 逐包独审强度 | 报告 C 类主张"问题只在 scope 不在密度"，但返工包账算错后支撑强度不足（B5 是包内漏网）。不动，但不宣称已闭环 |
