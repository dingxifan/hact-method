# 多迭代执行边界

Gate 的定义、readiness、批准与修订关系只由 [Gate Protocol](../protocols/gates.md) 定义，Task 特有前置及完成条件见对应 `tasks/` 契约。

本页保留原有多迭代限制，不重新定义 Gate：

- vN+1 的 dispatch 阶段不早于 vN 的 G4 完成；准备段 G1–G3 可在上一期开发循环期间提前进行。
- 推荐准备段并行、开发段串行；跨迭代依赖仍须明确，不能因各期目录隔离就认为没有共享写冲突。
- B 类不受 A 类上述迭代限制，但实施与部署各自仍需满足既有 Contract 和 Authority。
