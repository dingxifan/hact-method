# exec: wrap-up-iteration

G4 后的必要收尾与人工 G5 确认保留；不改 A 类 Gate 顺序。可以与已授权 deploy 并行，部署失败不阻断文档收尾，但不能宣称已上线。

## 1. 核对本期真实缺口

读取 status、相关 backlog/feedback、最终 PRD/TRD 与验收证据，只处理本期关联项。

- 偏离涉及用户行为或接口/数据契约：按 revise-doc 完成确认及关联修复，未闭合不签 G5。
- 仅实现取舍且仍影响后续工作：在 decisions 留理由与确认依据；普通细节引用 PR 即可。
- 本期承诺的功能/约束缺口不可转为“经验”后消失；完成修复，或由用户明确调整范围并留下依据。其他跨期欠账给去向与责任，不冒充已完成。
- 核本期 supersedes 非空项：实际下线，或明确保留理由与解除条件；只写“废弃”但实体仍在不算下线。

## 2. 更新事实，不清空作证明

project.md 只更新本期造成的产品/技术事实变化，保留其他迭代内容和未变约束。已上线必须有部署证据；否则写待部署或本期无部署。其他迭代“开发中”不阻断本期。

feedback 可以保留、注明去向或引用已处理结果；仅需经验积累的条目不阻断 G5，不强制誊入私人 notes、不建仓、不收割。历史删除/归档另按实际需要，不以清空文件证明处理完成。方法论改动不从项目收尾授权推定。

## 3. 校验并请求 G5 确认

运行 `node scripts/check-gate.js G5 vN`：检查当前迭代未闭合开发/修订任务及 project.md 存在。脚本不能判断偏离处置正确、用户是否接受范围调整，必须附实际证据交用户确认。

确认 G4 已签、偏离与必要任务已闭合、退役/欠账有明确去向，给出本期最终状态与仍未完成事项，问用户是否签 G5。未获明确确认不签；已有同一范围明确签署指令可引用，不重复问。

用户确认后在 `status.yml iterations.vN.gates.G5` 写 `{ signed: true, date: YYYY-MM-DD }`。签署后、提交前必须立即做一次机械归档：把 `status.yml code_reviews[]` 中 `iteration: vN` 的完整条目块原样搬到 `status-reviews/{key}.yml`（普通迭代 key 即 `vN`；点号迭代把 `.` 换成 `-`，如 `v1.1` → `v1-1`；文件顶层只写 `code_reviews:`），并在 `code_review_archives[]` 追加 `{ iteration: vN, file: status-reviews/{key}.yml, count: 实际条目数 }`。不得改字段、清洗历史 `comment/issues` 或改写内容；不归档 `tasks[]`、`integration_tests[]` 或 Gate。

同次机械动作把主文件中 `iteration: null` 且对应任务已 `merged` 的 B 类审查条目原样搬到 `status-reviews/b.yml`；已有 B 类归档时追加条目并更新原索引的 `count`，不得重复建立 `b` 索引。无可搬 B 类条目时不改 B 类归档。运行 `node scripts/check-sprint.js vN`，只用它核索引路径、文件存在、count 与条目唯一性；检查器不判断“该归的是否都归了”，也不设条数或迭代数阈值。归档文件、索引、G5 状态与本次确有变化的证据文件共同暂存，按已授权分支提交。status-only 签字仍触发 Gate 检查。旧 gates.md 只留历史，不双写。

## 恢复与边界

恢复读 status 的 G4/G5、`code_review_archives[]`、未完成任务、backlog 关联处置和实际 Git/报告；若 G5 已签而本期归档尚未随提交完成，先按上一节机械补完再收尾。不由 feedback 是否为空或 project 是否出现“开发中”推断完成。B 类无 G5，具体缺口在 develop 交付时移交；仅需整理经验时按需另做，不自动创建 cleanup 任务。
