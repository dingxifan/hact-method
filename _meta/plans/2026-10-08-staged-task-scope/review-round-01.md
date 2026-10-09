# Method staged scope 独立审查 · round 01

- Reviewer：fresh-isolated hact-sensitive-reviewer `/root/method_scope_review`。
- Base：`d17a3a8a6fb08d878be1330d6c6dc4cc4d8f41b6`。
- Candidate：`e9baf5640616b9f04d4671dfa75d46604a3384b6`。
- 结论：BLOCK。主线仅持久化 reviewer 返回结果，不改写其结论。

| ID | 优先级 | 状态 | 发现与修复要求 |
|---|---|---|---|
| METHOD-SCOPE-F001 | P2 blocking | open | 未变 legacy 包在 HEAD 仍为可取；新 schema 2 包无依赖同写文件，staged 返回 0。checkedPackages 跳过该包且共享检查仍按 strictSchema 筛选，遗漏未完成任务的共享写边界。须保留受影响全局关系检查，不重认证已完成历史。 |
| METHOD-SCOPE-F002 | P2 blocking | open | Git R079 重命名 current schema 包并将唯一 AC-01 覆盖改为 AC-99，同步 sprint/status 后仍返回 0。name-only 丢旧路径导致缺原覆盖前像。须读取重命名前后路径，回归覆盖丢失及合法改名。 |
| METHOD-SCOPE-F003 | P2 blocking | open | 新 frontend 依赖未改 current schema backend，后者原无消费者且缺 api-contract，仍返回 0。条件必填检查被 checkedPackages 过滤。须按新增/变化依赖检查受影响接口边界，保留 plan-sprint §5.9。 |

独立验证：从固定 candidate 解出后，九组 check-sprint 测试全部通过；以上三个额外真实 Git 反例均错误放行。反例脚本曾位于本机临时目录 method-review-E1wY56/templates/scripts 下的 review-extra.test.js、review-fe.test.js；临时路径不是长期交付依赖，修复应将反例纳入版本化回归。

未修改业务/Gate/status，未 push/merge。check-gate 测试及真实完整任务 hook 尚无通过结论。新候选须使用相同 finding ID 定向复审。
