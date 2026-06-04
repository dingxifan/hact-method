# STATUS.md — hact-method

## 当前状态
- 当前阶段：**第三阶段·开发 hact-app**（进行中）
- 上次更新：2026-06-03

## 各阶段完成情况

| 阶段 | 状态 | 完成日期 |
|------|------|---------|
| 第一阶段·搭骨架 | ✅ 完成 | 2026-05-07 |
| 第二阶段·写结构层规范 + 主线执行规范 | ✅ 完成 | 2026-05-08 |
| 第三阶段·开发 hact-app | 🔄 进行中 | — |
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

### 2026-05-31 方法论调整：status.yml 状态契约（hact-app 取数稳定化）
- 背景：hact-app 靠解析 queue/sprint.md/gates.md 等叙述性 markdown 取状态，格式漂移导致持续取错数
- 方案：新增**项目根 `status.yml`**（机器侧唯一数据源、项目级单文件、YAML 锁死 schema），现有 markdown 降级为「人看的视图」一字不动；状态进 YAML、文档正文走 API
- 项目级而非迭代级：B 类（bug/optimization）跨迭代、`iteration: null`，两迭代之间无活跃迭代时照样有家；多迭代并行靠 `iterations` 按版本分块 + task 带 `iteration` 字段
- 落地：新增 `skeleton/07-status-contract.md` 契约 + `templates/status.yml` 模板；10 份 exec spec 插入「做一个填一个」更新步骤（init-project 建文件；draft-prd-vN/draft-tech-design/plan-sprint/manual-test/wrap-up-iteration 签 Gate；develop 认领+done；pr-review merged+CR；generate-integration-tests/manual-test/dispatch-new 各自派任务追加 tasks[]）
- 总规则：凡往 queue/ 写任务包处同步追加 tasks[]（带 source/iteration），状态流转按 task-id 改
- 本轮只改 hact-method，不动 hact-app（其 sync 改读 YAML + 文档走 API 留待 hact-app 自身迭代）；CC 启动接续逻辑暂不改
- 计划与设计：`_meta/plans/2026-05-31-status-contract/design.md`

### 2026-05-31 方法论调整：个人积累与 pull 上提
- 引入"个人积累仓" `hact-notes-{姓名}`（每人独立私有仓）+ `harvest-notes` 上提 task（pull、只读、游标）
- wrap-up 第二步分流改向个人 notes；B 类 develop 就地分流（补 B 类无 wrap-up 盲点）
- draft-tech-design 双源（公共 + 本人 notes `[规范]`）+ vN+1 去重
- 骨架（01 权限例外 / 02 三工作区 / 03 management 边界 / 04 注册 harvest-notes）+ init-project Step4.5 成员 notes 登记 + CLAUDE.md Step0 同步 notes 仓 + 删除空模板 retrospectives.md
- 计划与发现：`_meta/plans/2026-05-31-personal-notes-accumulation/`

### 2026-06-03 方法论调整：新增 draft-ux 交互原型任务
- 痛点：开发完成后频繁出现交互设计缺陷（仅有 happy path、路径分支遗漏、入口不明确），根因是 PRD→TRD 之间缺乏对业务流的显式确认环节
- 方案：新增可选 task type `draft-ux`，插入 G1（PRD）与 G2（TRD）之间，产出场景列表 + mermaid 流程图 + 自包含 HTML 原型；三层递进：场景枚举（用户视角业务流） → 流程图（分支可视化） → 原型（路径可走通）
- PRD 联动：每个功能模板新增 `**入口**` 字段（触发来源）和 `**draft-ux**` 字段（需要/不需要）；完成判据补两条；G1 签署前明确触发决策
- TRD 联动：会话启动新增 draft-ux 就绪前置检查；必读文件加 `ux-flows.md`；接口设计段每个 API 注明服务于哪条流程路径（`# 服务流程：{场景名}`）
- 跳过条件：PRD 中全部功能标记 `draft-ux: 不需要` 时，TRD 前置检查自动通过，无需运行本 task
- 落地文件：`specs-structural/draft-ux.md` + `specs-execution/draft-ux.md`（新增）；`specs-structural/draft-prd-vN.md` + `specs-execution/draft-prd-vN.md` + `specs-structural/draft-tech-design.md` + `specs-execution/draft-tech-design.md`（修改）
- 方法论验证：以 hact-app v1 F3 Sprint 任务看板为对象跑通全流程，7 条场景 → mermaid 流程图 → HTML 原型，原型存 `hact-app/iterations/v1/prototype.html`

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
