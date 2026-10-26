# 历史兼容收敛：独立定向审查 round 1

- 日期：2026-10-26。
- 独立审查代理：review_upgrade_f001；主线仅记录其返回结论。
- Base commit：`0244f61103a7154094c135e94dde3daf94598d10`。
- Candidate tree：`8226827aca0f620b4b4287220f32cbb6446e9bb5`。
- 结论：REVISE。

## UPGRADE-COMPAT-F001 — P1 / blocking / open

Guide 08 仅要求当前 Task/依赖身份歧义时暂停，normalizer 已将历史重复降为诊断；但 ready、wave-ready、staged 仍对整个 status.yml 查重，任意重复即失败。独立夹具的唯一 new-work 无依赖，原退出 0；仅添加两条无关已 merged 的 old-history，变为退出 1。要求将检查限定到实际使用的身份，保留真正歧义的阻断，避免全表 Map 静默覆盖。

## 其他已验证与边界

独立合成 BASELINE、QUOTED_TARGET、HISTORICAL_SCOPE_REPAIRED、SYNTHETIC_COMBINED 均退出 0；原合成 7 项失效机制已修复。review、governance-plane、current-entry、normalizer 四项固定源码测试 PASS，最终越界/伪造历史 diff/开放 finding 负例仍被拒绝。

原始输出位于本机系统临时目录 `hact-f001-rereview-xR3F2w` 的 `independent-combined-raw.txt`、`historical-identity-results.jsonl` 和 `review-test-results.jsonl`。这是 Method 层独审，不关闭原远端项目 METHOD-UPGRADE-F001；项目固定对象尚不可得。未改仓库/index/refs。
