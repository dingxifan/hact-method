# 存量项目接入与文档任务收口（2026-09-25）

## 目标

在 current-only Core 之前增加一次性、fail-closed 的存量项目接入边界；同时修正文档 Task 终态检查、审查规范重复、历史重复 Task ID 误选与 TRD 非表承载表达。

## 固定基线

- Method commit: `a9bcde43a5ce8b2ee95c63b0fabc1fe0ff563c58`
- Method tree: `620f36f83132c661f5a74cf6ca4c788af67257f8`
- 实施 branch: `hact/legacy-adoption-current-method`
- 不修改或分发任何业务项目，不 push、不部署。

## 设计边界

1. 日常运行仍只接受 current schema；一次性 normalizer 不进入 Core Task lifecycle。
2. 历史 Task、Gate、review 和产品事实只读保留，不补造、不重开。
3. 安装器不得以 Git clean 推断文件无项目定制；Method-owned、merged 与 project-owned 明确区分。
4. 文档 Task 使用 task-specific completion evidence；develop 的 review-chain 不再充当通用终态检查器。
5. 重复 Task ID 先报歧义，禁止 Map 静默覆盖。
6. TRD 技术承载允许 table、artifact、external-system、derived-state 与 runtime-state。

## 实施项

- [x] 安装 manifest v2 与 ownership policy
- [x] 一次性 legacy normalization plan 生成与应用
- [x] 存量接入指南和回滚/停止条件
- [x] 文档 review report 契约与 task completion checker
- [x] state/status/draft-tech-design/review 契约对齐
- [x] TRD review brief 收缩为薄入口
- [x] duplicate Task ID fail-closed
- [x] TRD carrier schema 与 checker/tests
- [x] 全量机械验证
- [x] Fresh Independent Review

## 完成边界

实现、测试与独立审查通过后形成本地候选提交；未经用户另行授权不 push、不向项目仓分发。
