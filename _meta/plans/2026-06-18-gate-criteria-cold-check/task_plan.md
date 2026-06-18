# 方法论调整专题：Gate 签署前冷核完成判据

> 创建：2026-06-18 ｜ 工作区：hact-method（方法论心态）｜ discipline：management（决策 #20，发散性方法论调整）

## 目标

为 Gate 签署设一道**上下文隔离的完成判据冷核**闸口：签 Gate 前，派一个**全新 subagent**，只喂「本 task 产物 + 该 task 完成判据」（不喂生成对话/决策理由），逐条核对判据是否**真的满足**，输出 pass/fail + 证据。把"已生效规范没被完整执行"这类缺陷挡在 Gate 之前，而不是拖到联调/验收/下游 task 才暴露。

## 病根（详见 findings.md）

"方法论没同步到最新"这一**感受**底下是两个不同根因：
1. **真·同步滞后**——本地 hact-method 落后 remote。归 Step 0 / git 改造（另一条线，本专题不处理）。
2. **假·同步滞后 = 已生效规范没被完整执行**——规范早在本地、判据白纸黑字，但起草时被静默跳过。git 修不了它。**本专题只打第 2 类。**

触发实例：hact-app V4 PRD 的 F1–F6 全缺 `入口` + `draft-ux` 字段。该要求 `6b39b49`(2026-06-03) 就进了 `draft-prd-vN` 完成判据(第 59–60 行)，本地早有，06-16~06-18 的 commit 根本没碰这份 spec → 纯执行疏漏，非同步。

## 设计方向（已定，待细化）

- **不新增判据**：完成判据已存在于各 `specs-structural/*.md`。本专题加的是**强制核对闸口**，不是新规则。
- **冷核 = 上下文隔离**：复用 2026-06-18 draft-ux「Step 3.5 派全新 subagent 冷审」的成熟范式——陌生视角、只喂产物+判据、不喂生成对话(治"同上下文自评盖章")。
- **冷核只扛"可检查的遗漏/不一致"**：判据里机械可查的(字段在不在、段落空不空、标记有没有)交冷核硬卡；品味/价值判断仍交人的 🚫 兜底。
- **挂在 Gate 上**：G1(draft-prd-vN) / G2(draft-tech-design) / G3(plan-sprint) / G4(manual-test) / G5(wrap-up-iteration)。每个 Gate 对应 task 都有完成判据块。

## 方案与决策

完整三层方案见 `design.md`。**2026-06-18 决策：本轮只做 Layer B 软版（冷核步骤 + 凭证 + 完成判据补项 + 人工抽看）；hook 与 Layer A 延后。** 详见 design.md §五。

## 阶段

- [x] **阶段 0：起专题 + 推演 + 方案定稿**（complete）
  - findings F1–F7（两类根因 / 三层真相 / 六种伪造 pass / 现成范式复用）+ design.md 完整方案 + 用户拍板 B 软版
- [x] **阶段 0.5：修 draft-ux 回退**（complete）
  - 发现 `5cfdedb` 静默删除 5d53088 的 Step2.5/3.5；`9074062` 从 5d53088 增量恢复并提交
- [x] **阶段 1：落地 B 软版改 spec**（complete）
  - `skeleton/06-gates.md` §7「完成判据冷核协议」单一来源（G1–G5 参数化）
  - 5 份 `specs-execution` 插短步骤引用 §7（Step7.5/5.5/4.7 + manual-test/wrap-up 签字前）+ 签字前置 + 凭证纳入 commit；draft-tech-design/plan-sprint Subagent 表补行；draft-prd Subagent「无」改写
  - 5 份 `specs-structural` 完成判据补「判据已冷核」
  - 与 draft-ux/plan-sprint Step 3.5 互补不合并（已在 §7 + plan-sprint Step4.7 注明）
- [x] **阶段 2：自检 + 收尾**（complete）
  - 机械核对：exec 5/5 + structural 5/5 落地、skeleton §7 在、spec 无 `.gate-checks` 残留、plan 文档路径统一为 `gate-checks/`
  - STATUS.md 里程碑已加

## 延后（记账，不在本轮）

- **B3 hook 闸门**：团队引入 / 需机械硬保证时上（设计已在 design.md §二 B3）
- **Layer A1 模板空槽**：几乎零成本、最防患，建议下一优先
- **Layer A2 机械 linter**：可与待议 `check-status.js` 同栈合并设计
- 真·同步滞后（第 1 类）的 Step 0 改造：另起线（去 `2>/dev/null`、校验 master、真实前后对比）

## 决策记录

- 2026-06-18：本轮范围 = Layer B 软版；hook 不加、Layer A 延后（用户拍板）。
