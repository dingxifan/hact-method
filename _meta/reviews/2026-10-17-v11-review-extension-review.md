# V11 review-extension Method 独立审查

- 日期：2026-10-17
- 审查身份：未参与实现的 fresh isolated reviewer；仅审查、验证与写本报告。
- Baseline commit：`46697d81722b5fd2ed6a7aa0faca9ccabf694c7f`
- Candidate immutable tree：`0327fa5a8d130edee9eed3ddb4c027ff17d55ada`
- `git diff --binary <baseline> <candidate>` SHA-256：`4572c718359e22c72d2f417140ceb0198350a430947eb6d42c73ae050aba775e`
- 固定 diff：6 文件，72 insertions / 6 deletions。审查前后以 Git 配置的 checkout filter 核对，六个被审文件均与候选 blob 一致；Windows CRLF checkout 不作为语义漂移。
- 依据：AGENTS、BRIEF、STATUS、current plan、方法论待议中相关裁决、develop §7、review scope、review/authority protocols，以及固定 diff 的实际调用链和正反控。

## 结论

**PASS，无 blocking finding，无需新增 advisory。** 此结论只覆盖这六文件的必要 Method 追加规则与生成器序列化修正；不构成 file-extract V11-005/F004 修复通过、Gate approval、项目采用完成或带阻断合并许可。

默认三次保留。`reviewCodeLimit` 被 generator 与 audit 共用，只有本 Task 的 `decisions.md#<task-id>-review-extension` 能定位到非空决定时才机械返回四。缺文件、空章节、错 Task 指针失败。第五次实质增量在生成器拒绝，在审计器也拒绝，不能靠手写报告绕过正常审计路径。批准追加仍生成 `pending` 草稿，不能把批准转换成 review pass；保留 open blocker 时 `pass` 仍被拒绝。

计数从相邻 reviewed heads 的实际 Git diff 推导，首轮计入；审计器的 full 报告仍核 preflight 全量固定 diff，但累计计数按上一 head 到本 head 的增量，避免 full 累加重复计数。evidence-only 的同 snapshot 不消耗额度；第四次之后仍可合法补一次证据，不能重复补同问题。status/task package/review 目录维持既有治理面排除规则，其他文件不因扩额成为豁免。实现未改旧报告、finding ID、编号连续性、prior-report、fixed-diff、files scope 或最终 blocker closure 校验。

生成器 changed_files 与 target_finding_ids 改为当前 parser 已支持的普通 YAML block 列表，空集合仍 `[]`；positional anchor CLI、task 草稿 CLI、--write 禁覆盖、--spec 限制和 foundation 原有载体实测保持可用。无新 ledger、review 阶段或自动分发机制。

## 独立执行与原始证据

在候选文件保持冻结的情况下自行运行，以下全部 exit 0；测试会在独立临时 Git fixture 产生真实 tree、diff 和 checker 子进程结果。日志/额外探针留在仓库父目录，不进入生产候选。

1. `node templates/scripts/check-sprint.review.test.js`：`../independent-method-extension-review-test.txt`，SHA-256 `1722df8449903d63ab30305906bf700f55634c54b6f7c084e7e5a2141ffa24fe`。覆盖缺授权第四次 generator/audit 拒绝、存在决定第四次允许、第五次两条路径拒绝、evidence-only/重复补证、历史链、固定快照、CLI 和 foundation。实现者提供的 final2 日志 hash 与此次重跑日志一致。
2. 独立补充探针 `../independent-method-extension-probe.js`，SHA-256 `bd1a7634b2991bfa16514f7b2a9b2639a423090a8eaf5f7977ae4815a09128d5`；日志 `../independent-method-extension-probe.txt`，SHA-256 `1ae4458a417ed39faede13c075ff75953a204437e2d4993c637a5856e89492e7`。复用真实 fixture 初始化，另行断言累计恰为四、第四次同 snapshot 草稿为 evidence-only、错 Task authority 在 generator 与 audit 均失败、带 open blocker 不得 pass、实际生成的两种列表由当前 parser 读回并与真实 diff/目标 ID 一致。
3. `check-sprint.foundation-carrier.test.js`：`../independent-method-foundation.txt`，SHA-256 `55b98fa9ce26f1b4854fe56f32b874999089c03851a42b69edfe9ecd30db0ef8`。跨迭代 foundation 与 V0 路由、注册、合并、固定审查绑定及负控通过。
4. `check-sprint.governance-plane.test.js`：`../independent-method-governance.txt`，SHA-256 `96cdc631f17e18ab599722b68fab4429e17021a1b6f022197834eb6f02088a8f`。治理面分离不缩减 full fixed-diff audit。
5. `check-sprint.staged-scope.test.js`：`../independent-method-scope.txt`，SHA-256 `844520493056c6e444e346c3e786c2247e82fb37a377db4b817c2c2e85ecc089`。27 个真实 Git scope 正反夹具通过。

另独立读取实现者七项相关回归原始日志 `../method-extension-regressions.txt`，SHA-256 `a57a0d4f4f471c747b244ef382d307b2af27f2b0e59f7cb12b09a255575bb227` 与 brief 一致。其结果作为补充，不替代上述自行执行。

## Authority 与交付边界

本次审查按派发中转述的用户批准有界 Method 变更开展。规则把用户原话、日期、Task、固定第三次候选及 finding/范围留在既有 decisions.md，Reviewer 必须进行语义核验，属于必要的人判，**检查器只证明非空章节可定位，不能证明内容确为有效批准**。测试中的模拟决定仅证明机械接口，不是任何真实项目授权。

因此本报告不认证 file-extract 中尚未审查的具体 decision 或第四次修复增量；项目 Reviewer 仍须对真实批准与新候选逐项核对。Method PASS 不扩展到其他 Task/项目，不允许清零历史或第五次，不替代 sensitive risk、Git acceptance、Gate、部署/外部效果授权。

本次没有修改生产源、index、STATUS，没有 git add/commit、push、merge、项目分发或其他聊天派发。只新增本报告；额外 probes/logs 均在父目录。
