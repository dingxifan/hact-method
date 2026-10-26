# 方法论检查器大差异局部独立审查

结论：**pass**。无新增 blocking finding；METHOD-LARGE-DIFF-F001 的源级局部根因已核验解决。此结论限于官方方法论固定候选，不代替项目重新采用同源官方版本后的 METHOD-UPGRADE-F001 后续复审。

- Method / base：`86651739e57ebdf3aede81689dc5d050f1e9fb42`
- Candidate tree：`62d3ff81b41151981b4d97b5352abb02ea3b185b`
- 范围：base→candidate 五个文件；仅 checker 的 Git 输出容量、错误回退、新增定向测试及该任务原始证据。正式代码读取使用 `git diff base tree` / `git show tree:path`；执行使用 candidate archive 的临时隔离副本。
- 依据：base `protocols/review.md` §3/5/6/8/9/14、`runtime/codex.md` §7、`AGENTS.md`；candidate `_meta/plans/2026-10-26-checker-large-diff/{task_plan.md,before.json,validation.json}`。
- 接续材料：外部 `latest-independent-review.md` round 3 的 METHOD-UPGRADE-F001。该项目报告保持原貌及轮次；本报告是不同仓库源级局部修复的独审，不新建或清零项目 round。

## METHOD-LARGE-DIFF-F001 — blocking / verified-closed（源级局部根因）

**原问题及影响：** 默认 execFileSync 约 1 MiB 容量不足以读取实际累计 binary diff；空 stderr Buffer 的真值又吞掉 ENOBUFS 错误，导致后续读取缺失 names 并崩溃。原项目 report 指向累计差异 1,442,902 bytes，此修复直接覆盖该路径。

**固定代码证据：** `templates/scripts/check-sprint.js:412–438` 为 Git 输出显式设置 `64 * 1024 * 1024` 有限容量；二进制 diff 仍使用 encoding=null 的完整 Buffer 直接 SHA-256，names 仍独立来自 `git diff --name-only -z`，分隔、归一化、排序和返回格式未变。catch 先将 stderr 转字符串去空白，再回退 error.message/error，避免空 Buffer 隐藏错误。reviewAuditErrors 的 fixed/increment/cumulative 错误分支先判断非空 error，再读取 names；其他调用方的错误关闭逻辑未变。未改审查规则、历史、权限或状态。

**独立执行证据（2026-10-26）：** 从固定 candidate archive 导出至 `/var/folders/fl/_hpr__7d45z8x3gtwzbgdz800000gn/T/independent-large-diff-rzn59q14` 后执行：

| 实际入口 | 结果 |
| --- | --- |
| `node templates/scripts/check-sprint.large-diff.test.js` | exit 0；真实随机 2 MiB 二进制 Git diff 超过 1 MiB；独立原始完整字节 SHA-256 与 names 相等；不存在对象返回非空 error；空 stderr ENOBUFS 保留错误且无 names |
| `node templates/scripts/check-sprint.review.test.js` | exit 0；fixed snapshots、findings、targeted recovery、foundation 通过 |
| `node templates/scripts/check-sprint.governance-plane.test.js` | exit 0；完整 fixed-diff audit 通过 |
| `node templates/scripts/check-sprint.js --review-chain bonus-archive-test-window /Users/winniema/.codex/worktrees/method-official-upgrade/loxson-salary-new --in-progress` | exit 0；通过 1 项 / 失败 0 项；stderr 空 |

另在独立临时 Git 库生成真实随机 52 MiB 二进制文件，以 100 MiB 容量独立取得完整 diff，实际为 **70,276,178 bytes**，超过 64 MiB（67,108,864 bytes）。对同一 base/head 调用候选 fixedDiffEvidence，返回恰为 `{error: "spawnSync git ENOBUFS"}`，无 hash/names；探针断言通过。这是实际进程容量故障，补足新增回归中模拟 ENOBUFS 的证明边界；没有截断后假通过。

**测试与证据判断：** 新增测试在临时真实 Git 库构造对象，并以单独 git 命令获取完整原始 diff 作为 oracle，不以被测函数自身输出生成期望 hash。capacity 配置虽由同进程 mock 断言，但真实超限探针另行验证了该行为。candidate before.json 中旧实现对同一新增回归失败（hash undefined），validation.json 记录十组相关回归及真实链通过；本审查独立复跑上述受影响入口，其余日志作为原始执行证据读取，未冒称全部重跑。

**动作：** 源级局部修复无需进一步整改，可按授权提交官方 PR。项目 METHOD-UPGRADE-F001 在其自身报告链继续保持 open；须待官方接受、项目固定新的同源采用候选并完成对应复验，再由后续 targeted fresh review 判定关闭。

## 写集与专项判断

真实 diff 仅两行功能变更与 WHY 注释、新增 59 行定向回归及本任务三份证据；无审查语义或历史改写。命中专项为有界大输出、完整证据身份、错误失败关闭及历史链读取兼容性。未触及业务金额、数据权限、数据库、异步任务或前端，无失效依据扩审这些范围。审查只写本报告，未改源码、索引、Gate/status；未运行项目启动、同步或认领。
