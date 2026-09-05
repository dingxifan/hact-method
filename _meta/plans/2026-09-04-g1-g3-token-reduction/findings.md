# 独立复审与修复

## 首轮复审

总体 `block`：0×S0、4×S1、4×S2。

| finding | 修复 |
|---|---|
| 两期零引用误删仍有效 Standards | 零引用只进复核；删除须 superseded/applies-if 不可能/更强迁移证据；安全数据默认保留；新增 retention policy 负向夹具 |
| wave 失败恢复死锁、risk 晚升档、分支名冲突 | 有效 risk 前置；`--wave-ready` / `--wave-state`；wave per-task commit；整组恢复与 prefix 拆分协议；分支命令统一 |
| G3 global-summary 重读全部 frontmatter | 新增 `task-review-index/v1` 最小索引生成器；module 只读 PRD/TRD 切片；总核禁止回读 full frontmatter |
| design 已有全局基线但新页面无维护分支 | Step 1.3 双检查；走查后 Step 7 增补页面规格；check-ux 负向夹具 |
| G1 多候选骨架反增 token | 只给推荐方案一份骨架，其他方案只列范围差异 |
| design reference 不闭合 | 新增 `design-reference-format` 条件字段与 check-sprint 正反夹具；存量全文例外显式化 |
| standards_checked 无机械核验 | round schema v2；full 与 relevant-standards 全量对账、targeted 子集；legacy 缺失=unknown；集成负向夹具 |
| G2 每段进度播报残留 | 删除每段报告，正常写作静默 |

待议清单顶部已声明旧 wave 条目的冻结状态失效，避免与现行规范冲突。

## 第二轮复审

总体仍 `block`：0×S0、3×S1、6×S2。新增修复：

- wave split transaction 将 implementation + 审计物一并 per-task commit，prefix worktree 可复验；split 状态先行持久化，新增真实 Git/worktree 夹具。
- `--wave-state` 改读 `wave-progress/v1`，核真实 branch、整组 status、accepted commit/report、祖先关系，不再只看状态文本。
- task package 显式 `package-schema: 2`；新 schema 必填权威 TRD `module` 与 design reference 版本，旧包缺字段兼容。
- design 页面检查只取「八、页面规格」区间，check-ux 使用去“页/页面”后的精确匹配，补同名前缀与全局小节冒充负例。
- Standards retention 校验更强权威类型、稳定锚格式和占位符，补 CLI bogus-anchor 删除负例。
- `review_evidence_version: develop-review-round/v2` 建立迁移边界；未知 round schema fail-closed，legacy 缺失保持 unknown。
- 正式 wave 待议条目已改 `[x]` 并写实际落地/剩余观察。

## 第三轮复审

总体仍 `block`：0×S0、2×S1、1×S2。

- prefix 改用合并前 `--review-chain`，无需伪造终态 `code_reviews[]`；真实 split fixture 生成完整 preflight/profile/round、实际调用 verifier，并真实切换 dirty B 到 individual branch。
- `wave-progress/v1` 改为 status branch 全集双向对账；accepted commit 必须包含 preflight/profile/final report，从 commit blob 核 task/schema/pass/reviewed tree，补漏 C、工作树篡改和缺审计物负例。
- Standards retention 所有证据布尔值严格校验，字符串 `"false"`/数字等返回 invalid，CLI 删除请求 fail-closed。

## 第四轮复审

总体 `pass`：0×S0、0×S1、0×S2。第三轮剩余 wave prefix/恢复与 retention 类型问题均已闭合，未发现新回归。

- prefix 真实 worktree 运行 `--review-chain` 通过，dirty B 实际切换到可解析 individual branch；两工作树 split 状态一致。
- wave-state 双向核 branch 全任务集，并从 accepted commit blob 核 preflight/profile/report、task/schema/pass/reviewed tree；漏任务、工作树篡改和缺证据负例均翻红。
- retention 严格 boolean/null，字符串 `"false"` 与数字伪证据令 CLI 非零。
- 15/15 模板脚本测试、runtime-neutral、paths 与 diff check 通过。

+## 真实项目回归 · 2026-09-05

- awuchi v1.2 的新任务包按模板填写 supersedes: []，check-sprint 却报字段为空。根因是 valEmpty 的合法空数组白名单漏了 supersedes，与结构规范「无则 []」正面冲突。
- awuchi 的页面规格随迭代演进位于「十一、页面规格（v1.2）」，check-sprint / check-ux 只认逐字「八、页面规格」。章节编号是示例布局、不是 schema；解析已收窄为二级标题含「页面规格」并止于下一二级标题，保留同名前缀和全局区冒充负例。
