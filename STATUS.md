# STATUS.md — hact-method

## 当前状态
- 当前阶段：**第三阶段·开发 hact-app**（进行中）
- 上次更新：2026-05-31

## 各阶段完成情况

| 阶段 | 状态 | 完成日期 |
|------|------|---------|
| 第一阶段·搭骨架 | ✅ 完成 | 2026-05-07 |
| 第二阶段·写结构层规范 + 主线执行规范 | ✅ 完成 | 2026-05-08 |
| 第三阶段·开发 hact-app | 🔄 进行中 | — |
| 第四阶段·写执行层规范（剩余7份）| ⏸️ 边用边补 | — |
| 第五阶段·团队引入 | ⏸️ 未开始 | — |

## 本阶段进展（第二阶段，2026-05-08 完成）

- **specs-structural/**：13 份任务契约全部完成（develop / code-review / draft-prd-vN / draft-tech-design / plan-sprint / revise-doc / dispatch-new / generate-integration-tests / manual-test / deploy / wrap-up-iteration / init-project / harvest-notes）
- **specs-execution/**：13 份执行规范全部完成（init-project / draft-prd-vN / draft-tech-design / plan-sprint / develop / code-review / manual-test / deploy / wrap-up-iteration / dispatch-new / generate-integration-tests / revise-doc / harvest-notes）；经评审修复 + 业务流程一致性检查
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

| 仓库 | 路径 | 用途 | 远端 |
|------|------|------|------|
| hact-method | `E:\group-code\hact-method\` | 纯方法论（skeleton + specs + templates） | gitee.com/dingxifan/hact-method |
| hact-app | `E:\group-code\hact-app\` | hact-app 代码 + 协调文件 | 用户自行推送 |
| human-ai-col | `E:\group-code\human-ai-col\` | v1 方法论（冻结） | gitee.com/dingxifan/human-ai-col |

## 已知风险

| 风险 | 可能性 | 影响 | 应对 |
|------|--------|------|------|
| hact-app 开发中发现骨架/规范有结构性缺陷 | 中 | 高 | hact-app 即压力测试，发现问题即修规范 |
| exec spec 覆盖不完整（仅写了主线5份） | ✅ 已解决 | — | 13/13 全部完成，已通过评审和一致性检查 |

## 历史里程碑

### 2026-05-31 方法论调整：个人积累与 pull 上提
- 引入"个人积累仓" `hact-notes-{姓名}`（每人独立私有仓）+ `harvest-notes` 上提 task（pull、只读、游标）
- wrap-up 第二步分流改向个人 notes；B 类 develop 就地分流（补 B 类无 wrap-up 盲点）
- draft-tech-design 双源（公共 + 本人 notes `[规范]`）+ vN+1 去重
- 骨架（01 权限例外 / 02 三工作区 / 03 management 边界 / 04 注册 harvest-notes）+ init-project Step4.5 成员 notes 登记 + CLAUDE.md Step0 同步 notes 仓 + 删除空模板 retrospectives.md
- 计划与发现：`_meta/plans/2026-05-31-personal-notes-accumulation/`

### 2026-05-08 第二阶段完成 + 第三阶段启动
- specs-structural/ 12 份 + specs-execution/ 5 份（主线）完成并推送
- hact-method 重构为纯方法论仓（projects/ 移除）
- init-project 执行，hact-app 本地仓创建
- PRD 背景文件写入 hact-app/_meta/input/background.md
- draft-prd-vN 会话开启

### 2026-05-07 第一阶段·搭骨架 完成
- 骨架 7 文档全部就位（01-06 + README）
- BRIEF.md 决策清单 20 条
- 骨架自检通过

### 2026-05-07 仓库初始化
- E:\group-code\hact-method\ 创建，git init
- 目录结构确定：迭代一等公民切法
