# task: dispatch-new

**discipline**: `dispatch`（知识分类）
**Gate**: —
**属性**: `target-source: bug | optimization`

## 前置与产物

由 bug 报告或局部优化需求触发，无迭代/Gate 前置。允许先只读诊断实际代码；是否 B 类按意图、兼容性与实际影响判断，详见执行层。

产物只有 `b-queue/{task-id}.md` 的短契约与 `status.yml tasks[]` 的一条状态记录。任务状态只由 status 维护，不再新增 b-tasks.md 总账。

## 完成判据

- 问题、预期、可验证条件及原始依据明确；不把猜测当复现，不自行决定新业务承诺。
- 短包包含执行层所列字段；可省 A 类 module/sprint 等规划元数据，AC 不凑条数。
- `none` 不夹带契约改动；`governed` 有确认依据、受影响资产与兼容性验证，仍不能顺手修订已签规格、迁移数据或破坏调用方。
- `check-b-task.js` 通过，状态已登记并在授权分支提交。
- 有开发授权则继续 develop；仅诊断/派发请求不扩大成开发/发布授权。

字段语义沿用 `specs-structural/develop.md`；B 类字段子集及操作见 `specs-execution/dispatch-new.md`。
