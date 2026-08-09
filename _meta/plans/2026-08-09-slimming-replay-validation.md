# 方法论瘦身 · 四类案例静态回放

> 目的：验证新控制流在不降低真实缺陷发现能力的前提下，停止把文档/示例/scope 问题统一送入代码整改。

| 案例 | 新入口 | 分类与 action | 是否改代码 | 复审范围 | 结果 |
|---|---|---|:---:|---|:---:|
| doc-extract V0：合法状态边可绕 service，但 DB 已保证真实不变式 | `foundation-review.md` | `claim-failure / unreachable / downgrade-claim` | 否 | 只复核声明、DB mechanism 与真实覆盖 | 通过 |
| doc-extract V0：`@Public` 别名可绕鉴权检查且路由可达 | `foundation-review.md` | `invariant-failure / current / fix-mechanism` | 是 | 修机制后重跑别名反例 + 鉴权回归 | 通过 |
| file-extract `fe-v3-010`：example 42 与 oracle 只能算出 40 | `task-package-review.md` | `example-error / fix-package` | 否 | 写代码前只复算该 AC，改 42→40 或取消 golden | 通过 |
| doc-extract V5：各包都写“不在本包”，组合后入口/选项无人认领 | `global-seam-review.md` | `scope-gap / global-gap-review` | 新任务处理 | 原包不打回；补缝任务独立审查，完成后重跑 seam | 通过 |

## 质量守恒核对

- 安全/数据不变式仍要求可达反例；`@Public` 别名、裸 SQL、stale dist 等探针未删除。
- `supersedes` 与退役账未删除；global seam 额外核“零调用方但仍注册/测试”的假退役。
- 普通 example 降权后，intent/oracle 仍须 runnable test；只有预复算的 golden 才承担字面 1:1。
- standard task 的 blocking finding 必须给 reachability/evidence/impact；sensitive/Foundation 的证据不足可阻断推进，但走 `evidence-gap → request-evidence`，不伪装成代码 bug。

## 回放结论

四类历史案例均进入预期控制流：两类零代码修订不再触发完整代码重审，两类真实质量问题仍被阻断并保留针对性反例验证。
