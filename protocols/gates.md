# Gate Protocol

Gate 表示 A 类迭代的成熟度和 Human Authority checkpoint。Gate 不是独立 Task。

## 1. G1–G5

- **G1 — Product Contract Ready**：产品需求已达到可作为后续设计输入的状态。
- **G2 — Technical Contract Ready**：技术设计、关键接口/数据承接和验证入口已经就绪；V0 可由 Foundation 路径承担。
- **G3 — Development Ready**：开发拆分、依赖、任务包和必要共享资产已经准备完成。
- **G4 — Accepted Result**：实现、集成验证和真实用户验收已经完成。
- **G5 — Iteration Closed**：真实结果、偏离、feedback、长期事实和必要欠账已完成对账与闭合。

## 2. Gate readiness

Gate readiness 是关联 Task、deterministic checks、required review 等事实的聚合结果，不维护一套重复工作流状态。

除 approval record 外，未开始 / 进行中 / 阻塞 / 待签等可视状态应从底层事实计算。

## 3. Approval

Gate approval 是独立 Human Authority Event。

- Task `merged`：工作本身完成。
- Gate approved：用户允许项目把该结果作为阶段性承诺继续前进。

两者正交，避免循环依赖。

## 4. Snapshot-bound approval

重要 Gate approval 应绑定明确 Accepted Project Truth snapshot，至少可记录：
- signed / approved
- approved_by
- approved_at
- approved_snapshot

批准的是某一个明确世界，不是脱离版本的布尔值。

## 5. Single authority event

同一语义决定不重复确认。

例如用户对最终 PRD 明确批准即可构成 G1；用户在 manual-test 明确验收通过即可构成 G4。

## 6. Deterministic 与 Semantic

Gate readiness 同时依赖：
- deterministic：artifact、字段、AC 覆盖、task 状态、checker/test 等；
- semantic / human：产品范围、真实体验、欠账/偏离处置等。

模型不能用“分析后认为可以”冒充 Human Authority。

## 7. Gate history

已批准 Gate 是历史事实，不因后续 `revise-doc` 自动撤销；revision 是新事件。

## 8. G5 与 Deploy

G5 表示迭代事实闭合，不把部署成功本身作为绝对必要条件。可以存在：
- G5 approved
- deployment pending / failed / not-applicable

项目事实必须准确反映真实 deployment 状态。

## 9. B class

B 类 bug / optimization 不运行 G1–G5。
