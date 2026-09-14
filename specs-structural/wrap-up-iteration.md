# task: wrap-up-iteration

**discipline**: `management`（知识分类）
**Gate**: G5
**属性**: version

## 前置与产物

本期 G4 已签，验收结论及必要修复可查。产物是本期真实变化的 project.md、必要偏离/欠账处置、`status.yml iterations.vN.gates.G5` 的用户确认记录，以及签署后机械生成的 `status-reviews/{key}.yml` / `code_review_archives[]` 索引（有已 merged B 类条目时同步维护 `status-reviews/b.yml`）；无需私人 notes、反馈清空或重复 gates.md。

## 完成判据

- 必要的 revise-doc/开发修复闭合；重要偏离有确认依据，不将本期承诺悄悄转成跨期待办。
- 本期 supersedes 有实际下线或保留理由/解除条件；遗留问题可追溯。
- project.md 反映事实，未部署不标已上线，不覆盖其他迭代。
- check-gate.js G5 通过，并由用户确认脚本不能判断的语义残量；明确签 G5 后提交状态及实际变化的证据。
- G5 签署后把本期 `code_reviews[]` 完整条目块原样搬到 `status-reviews/{key}.yml` 并登记索引/count（点号迭代的文件 key 把 `.` 换成 `-`）；已 merged 的 B 类条目按同一机械纪律归入唯一的 `status-reviews/b.yml`。不改条目字段或内容，不归档 `tasks[]`，不按数量设阈值。
- 个人积累、反馈归档、成本计时不是完成前置。

操作与恢复见 `specs-execution/wrap-up-iteration.md`。
