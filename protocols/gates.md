# Gate Protocol

Gate 表示 A 类迭代的成熟度与 Human Authority checkpoint。Gate 不是独立 Task，也不扩展四态状态机。

## 1. G1–G5

- **G1 — Product Contract Ready**：产品需求已达到可作为后续设计输入的状态。
- **G2 — Technical Contract Ready**：技术设计、关键接口/数据承接和验证入口已经就绪；V0 可由 Foundation 路径承担。
- **G3 — Development Ready**：开发拆分、依赖、任务包和必要共享资产已经准备完成。
- **G4 — Accepted Result**：实现、集成验证和真实用户验收已经完成。
- **G5 — Iteration Closed**：真实结果、偏离、feedback、长期事实和必要欠账已完成对账与闭合。

## 2. Gate readiness

Gate readiness 是关联 Task、deterministic checks、required review 与必要事实的聚合结果，不维护第二套工作流状态。

未开始 / 进行中 / 阻塞 / 待签等可视状态应从底层事实计算；不要把它们写成新的 Gate enum。

## 3. Approval

Gate approval 是独立 Human Authority Event。

- Task `merged`：工作本身完成并进入 Accepted Project Truth。
- Gate approved：用户允许项目基于该成熟度结果继续前进。

两者正交，避免把 Task lifecycle 和阶段授权绑成同一状态机。

## 4. Snapshot-bound approval

用户批准的必须是一个明确、可重新读取的 fixed snapshot，而不是聊天中的模糊“当前版本”。

Gate 只使用当前 `status.yml` serialization：

```yaml
Gx: { signed: true, date: YYYY-MM-DD }
```

不为 snapshot binding 额外增加 `approved_by` / `approved_at` / `approved_snapshot` 字段。

持久化 Gate approval 时：

1. approval 前先固定并验证被批准的 candidate / Accepted planning snapshot；
2. approval 后只允许增加 Gate authority metadata，不能顺手修改被批准内容的语义；
3. 包含 approval record 的 Accepted Git commit 是 durable approval truth；Git history 与固定 candidate 共同提供 snapshot binding；
4. 若 approval 后出现任何其他语义变化，原 approval 不自动覆盖新世界，必须重新判断是否需要新的 Authority Event。

## 5. Single authority event

同一语义决定不重复确认。

例如用户对最终 PRD 明确批准即可构成 G1；用户在 manual-test 明确验收通过即可构成 G4。持久化 approval record 是记录该决定，不是再向用户询问一次。

## 6. Deterministic 与 Semantic

Gate readiness 同时依赖：

- deterministic：artifact、字段、AC 覆盖、task 状态、checker/test 等；
- semantic / human：产品范围、真实体验、欠账/偏离处置等。

模型不能用“分析后认为可以”冒充 Human Authority。

## 7. G3 与 Task registration

G3 需要在用户批准前完成 planning 的 deterministic / semantic readiness。

当前 `status.yml` 与 `check-sprint.js` 规则为：

- `plan-sprint` 可以在 G3 approval 前，把已经完成的 sprint develop Task 正式登记到 Accepted Project Truth，初始 `status: 可取`；
- `可取` 只表示“已登记、未认领”，不代表认领前置已经满足；
- queue ↔ sprint ↔ status 的机械一致性因此可以在 G3 approval 前完整验证；
- G3 未 approved 时，`source=sprint` 的 develop Task 不得从 `可取` 进入 `taken-by`；
- G3 approval 只写入 Gate authority record，不再新增/重写 Task Package 或 status task 内容。

这样 G3 批准的是已经通过 checker / review 的规划世界，而不是“先批准、再改状态、再看看 checker 是否通过”。

## 8. Gate history

已批准 Gate 是历史事实，不因后续 `revise-doc` 自动撤销；revision 是新事件。若 revision 使后续成熟度前提失效，用新的 Task / Gate readiness 事实表达，不改写历史批准记录。

## 9. G5 与 Deploy

G5 表示迭代事实闭合，不把部署成功本身作为绝对必要条件。可以存在：

- G5 approved
- deployment pending / failed / not-applicable

项目事实必须准确反映真实 deployment 状态。

## 10. B class

B 类 bug / optimization 不运行 G1–G5。
