# 进度日志：G1–G3 低风险上下文减法

## 2026-09-04

- 用户确认实施第一批五项低风险减法。
- 从已提交的 G4 wave / design 切片 / Standards 消耗审计继续，不改项目仓。
- 四份主规范改为机械步骤静默；G1 合并方向/骨架确认并引入条件分组。
- draft-ux 完整 PRD 走缺口扫描，本地生成默认；外部简报正文移到按需 companion，默认规范净减约 2KB。
- G2 改为 standards-candidate 路由：0 candidate 不读模板/正文、不派生成单元；有候选只开命中 layer；cleanup 显式触发。
- G3 默认一次联合独审全部任务包；超过无 compact 预算才按业务模块切，并以 `global-summary` 兜跨批次 AC/共享资产/依赖。
- 运行时中立检查与全部 10 组模板脚本正反夹具通过。
- 独立复审结论 block（4×S1、4×S2），逐项修复见 findings.md。
- 新增 wave-ready/wave-state、design reference、design 页面覆盖、task-review-index、Standards retention 与 standards_checked v2 负向夹具；现有 + 新增共 14 组模板测试全绿，运行时中立与 diff check 通过。
- 第二轮独立复审仍 block（3×S1、6×S2）；继续补真实 Git split transaction、可恢复性检查、package/review schema 迁移边界、权威 module、精确页面匹配、强锚删除门与正式待议结项。
- 第二轮修复后现有 + 新增共 15 组模板测试全绿，运行时中立与 diff check 通过；等待第三轮同口径复审。
- 第三轮独立复审仍 block（2×S1、1×S2）：prefix verifier/真实 individual branch、wave-state commit 内证据与完整任务集、retention 伪布尔仍有缺口。
- 已补 `--review-chain`、真实 prefix 审计与 B branch 事务、commit blob 证据核验/漏任务负例、严格布尔 schema；等待第四轮同口径复审。
- 第四轮独立复审 `pass`（0×S0、0×S1、0×S2）；15/15 模板测试、runtime-neutral、paths 与 diff check 全绿。
