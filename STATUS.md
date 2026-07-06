# STATUS.md — hact-method

## 当前状态
- 当前阶段：**第三阶段·开发看板应用**（进行中）
- 上次更新：2026-07-06

## 各阶段完成情况

| 阶段 | 状态 | 完成日期 |
|------|------|---------|
| 第一阶段·搭骨架 | ✅ 完成 | 2026-05-07 |
| 第二阶段·写结构层规范 + 主线执行规范 | ✅ 完成 | 2026-05-08 |
| 第三阶段·开发看板应用 | 🔄 进行中 | — |
| 第四阶段·写执行层规范（剩余7份）| ⏸️ 边用边补 | — |
| 第五阶段·团队引入 | ⏸️ 未开始 | — |

## 本阶段进展（第二阶段，2026-05-08 完成）

- **specs-structural/**：13 份任务契约全部完成（develop / pr-review / draft-prd-vN / draft-tech-design / plan-sprint / revise-doc / dispatch-new / generate-integration-tests / manual-test / deploy / wrap-up-iteration / init-project / harvest-notes）
- **specs-execution/**：13 份执行规范全部完成（init-project / draft-prd-vN / draft-tech-design / plan-sprint / develop / pr-review / manual-test / deploy / wrap-up-iteration / dispatch-new / generate-integration-tests / revise-doc / harvest-notes）；经评审修复 + 业务流程一致性检查
- **templates/**：初始化完成（standards/backend.md + standards/frontend.md + design.md + reusables.md + feedback.md + retrospectives.md）
- **重构**：hact-method 改为纯方法论仓（移除 projects/ 目录）；项目协调文件合并进各自项目仓
- **CLAUDE.md 更新**：补充工作区使用指南（何时在 hact-method 开会话 / 何时在项目仓开会话）
- **Gitee 推送**：https://gitee.com/dingxifan/hact-method

## 第三阶段当前进展（2026-05-08）

- `init-project` 已执行：`E:\group-code\hact-app\` 创建完成，_meta/input/background.md 已放入
- `draft-prd-vN` 进行中：已在 hact-app 工作区开启 PRD 会话

## 下一个起点

在 `E:\group-code\hact-app\` 工作区继续 `draft-prd-vN`（PRD 未完成）。

## 仓库拓扑

`hact-method-lab` 自 2026-07-06 起是**独立 git 仓库**（`gitee.com/dingxifan/hact-method-lab`），不再与 `hact-method` 共享对象库。此前两者是同一仓库（`gitee.com/dingxifan/hact-method`）的两个 worktree，检出不同分支，用于新旧方法并行对比测试；对比阶段结束、新方法（`method-lab` 分支的全部演进）确认为主线后，独立成仓：

| 仓库 | 路径 | 分支 | 角色 |
|------|------|------|------|
| **hact-method-lab**（本仓，独立） | `/home/administrator/group-coding/hact-method-lab`（WSL 原生路径） | `master` | 当前唯一在用的方法论主线，独立仓库、独立历史 |
| hact-method（旧版基线，未受影响） | `E:\group-code\hact-method\`（挂载于 WSL `/mnt/e/group-code/hact-method`） | `master` | **旧方法**对照基线，原样冻结保留，仓库本身未删除、未改动 |
| hact-app | `E:\group-code\hact-app\` | — | hact-app 代码 + 协调文件（用户自行推送） |
| human-ai-col | `E:\group-code\human-ai-col\` | — | v1 方法论（冻结，gitee.com/dingxifan/human-ai-col，与上面两者是不同世代） |

> 迁移记录（2026-07-06）：把 `method-lab` 分支（含继承自旧 `hact-method` master 的全部历史 + 之后的全部独立演进，共 261 commit，tip `15971c3`）完整推送到新建的空仓 `gitee.com/dingxifan/hact-method-lab` 的 `master` 分支。随后把本地 `hact-method-lab` 目录从旧仓库的 linked worktree 转成该新仓库的独立 clone（原 worktree 目录整体重命名为 `hact-method-lab.oldworktree` 暂留几天做安全网，未提交的 `_meta/sessions/` 已手动搬入新目录），并清理了旧仓库 `.git/worktrees/` 里失效的 worktree 登记。旧仓库 `hact-method` 里的 `method-lab` 分支未删除（历史遗留，无害，不再更新）。
>
> 历史备注（迁移前，供追溯）：`method-lab` 曾完整包含旧 master 的 51 个 commit（领先 17）；reset 前的本地 master tip `8304136` 曾用 tag `master-pre-reset-8304136` 钉住。`hact-method-lab` worktree 曾于 2026-07-05 从 `E:\Group-code-lab\hact-method-lab\` 迁到 WSL 原生路径——这次（2026-07-06）是在那次路径迁移基础上做的仓库独立化，两次是不同性质的操作（前者只挪路径，后者切断了与旧仓库的对象库依赖）。

## 已知风险

| 风险 | 可能性 | 影响 | 应对 |
|------|--------|------|------|
| 看板应用开发中发现骨架/规范有结构性缺陷 | 中 | 高 | 看板应用即压力测试，发现问题即修规范 |
| exec spec 覆盖不完整（仅写了主线5份） | ✅ 已解决 | — | 13/13 全部完成，已通过评审和一致性检查 |

## 历史里程碑（索引，全文见 [`_meta/status-history.md`](_meta/status-history.md)）

> 本节以下不再保留全文——新增里程碑的完整记录直接写入 `_meta/status-history.md`，本文件只加一行索引。

- 2026-07-06 hact-method-lab 独立成仓 — 从 hact-method 的 worktree 切断为独立 Gitee 仓库，完整历史带过，旧基线原样保留
- 2026-07-02 Codex 适配层成本立论修订 — 立论改为"控成本"而非"上下文更小"+ 补合并权归属说明/长短卡同步检查/人工交接操作细节
- 2026-07-01 新建 codex-adapter/ 实验区 — CC+Codex 混合执行草案，不改动正式方法论
- 2026-06-29 地基层 + V0 走骨架（主管线重构，决策#25）— 两轮独审收敛，已推送 origin/method-lab
- 2026-06-29 hact-app 概念脱钩（方法独立性）+ WIP 归档 — 3 commit 已推送
- 2026-06-28 视觉地基三件套 — 补「跨切面地基」结构盲区，并入前端一致性框架
- 2026-06-20 develop 站「展开」四连改 — 执行模型翻转（独立审查 loop）+ 砍除 pr-review（merge-on-push）
- 2026-06-20 develop 站：撤销 sub7 家族拆分 — 单文件 develop.md 复位
- 2026-06-20 review-briefs/ pattern 推广到 PRD + tech-design — 三个末端审查 brief 全部外置
- 2026-06-20 plan-sprint 站致密化（340→275/−19%）— Step3 折叠 + 门卫散文收薄
- 2026-06-20 draft-tech-design 致密化 + standards 归位 + 步骤重排
- 2026-06-20 门卫（HOOK）样本建成 + 单环节致密化方法成稿
- 2026-06-20 HOOK/DRY 量账后双 park + 单环节 loop 试点（PRD 致密化）
- 2026-06-20 pipeline-reshape 开启 + 测试脊柱前置（乙-1+乙-2）
- 2026-06-19 sub7：develop 拆分（loop 第二层 park）— 471 行 → core+3 壳（后于 2026-06-20 撤销）
- 2026-06-19 sub6：TRD↔PRD AC 覆盖机械化
- 2026-06-19 sub5：PRD AC 稳定 id
- 2026-06-19 结构性审查收官：子计划 3b/3c/4 完成 + §7 冷核协议整段退场
- 2026-06-19 方法论方向转变：质量模型从"规范遵循"转向"输出可测试性"
- 2026-06-19 draft-ux 整体重构（角色姿态反转）
- 2026-06-18 Gate 签署前完成判据冷核（B 软版）+ draft-ux 回退修复
- 2026-06-18 draft-ux 交互质量（②造前探选 + ③subagent 冷审 + ①行为化清单）
- 2026-06-18 前端设计保真（design.md 必读 + pr-review 保真维度）
- 2026-06-18（续）prototype.html 接入链路（fix 3）+ fix 2 口径收口
- 2026-06-16 集成测试脚本移至 generate-integration-tests 阶段生成
- 2026-06-08 移除全部 Dynamic Workflow（计费口径对齐）
- 2026-05-31 status.yml 状态契约（hact-app 取数稳定化）
- 2026-05-31 个人积累与 pull 上提
- 2026-06-03 新增 draft-ux 交互原型任务
- 2026-05-08 第二阶段完成 + 第三阶段启动
- 2026-05-07 第一阶段·搭骨架 完成
- 2026-05-07 仓库初始化
