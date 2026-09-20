<!--
  Runtime Integration Verification 结果模板 · integration-verify 产物 · 存 integration-tests/result-{日期}.md · live 引用（不入项目仓）
  人看的视图（机器侧状态以项目根 status.yml 的 integration_tests[] 为准，见 skeleton/07）。
  填写：每条场景一行；结果 ✅/❌/未运行。已执行场景必须把证据放入 `integration-tests/evidence/vN/{场景-id}/` 并在「证据」列写项目相对路径；未运行必须写原因。
  ❌ 时「现象」填具体现象 + 复现步骤，「级别」填 [阻断]/[不阻断]。
  复测时在原条目「复测」列追加结论（通过 / 仍失败）。现象/复现步骤等正文留本文件、不进 YAML。
-->
---
schema: integration-result/v2
iteration: vN
candidate_head: <40-char commit SHA>
system_review_dir: iterations/vN/system-review
current_system_review: iterations/vN/system-review/review-001.md
revalidation_of: []
runtime_scope: []
result_status: satisfied | blocked
evidence_state: sufficient | insufficient
created_at: <ISO-8601>
---

# 联调测试结果 · v{N} · {日期}

组合核对：{基线 commit；相关契约/包间实现的证据锚或既有证据引用；结论及未完成项}。有问题时在此列证据、影响、修复/补缝任务或裁决与复核结论；无问题只写一段摘要，不另制覆盖表。静态核对不冒充场景执行通过。

| # | 模块 | 场景描述 | 结果 | 证据（项目相对路径） | 未运行原因 | 现象（失败时填写） | 级别 | 复测 |
|---|------|---------|------|----------------------|-----------|-----------------|------|------|
| 1 | {模块名} | {场景描述} | ✅ | `integration-tests/evidence/vN/S-01/screenshot.png` | — | — | — | — |
| 2 | {模块名} | {场景描述} | ❌ | `integration-tests/evidence/vN/S-02/trace.zip` | — | {具体现象 + 复现步骤} | [阻断] | {复测结论} |
| 3 | {模块名} | {场景描述} | 未运行 | — | {缺浏览器能力/凭据/环境，移交对象} | — | [阻断]/[不阻断] | — |

证据路径是共同契约，不按运行时另建目录。截图、录屏、trace、HAR、导出物或文本日志均可；只写“已目视通过”或运行时本地临时路径不算证据。
