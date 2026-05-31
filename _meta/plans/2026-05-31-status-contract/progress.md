# progress · status.yml 状态契约

## 状态：实现完成（项目级版），待 commit（2026-05-31）

## 背景
hact-app 靠解析 queue/sprint.md/gates.md 等叙述性 markdown 取状态，格式漂移导致持续取错数。本轮在 hact-method 侧新增机器友好的 `status.yml` 作为 hact-app 取数的唯一来源，状态与文件分离。详见同目录 `design.md`。

## 关键转向：项目级单文件（非迭代级）
初版做成 `iterations/vN/status.yml`（迭代级），用户两点反馈推翻：
1. 创建时机太晚（签 G1 才建）——应在项目初始化/迭代生成时就有
2. B 类怎么办——B 类跨迭代，两个迭代之间无活跃迭代时无处安放

查证：dispatch-new 把 B 类任务包写进 `iterations/vN/queue/`，但 B 类总账 `b-tasks.md` 在项目根、本质项目级。且 integration/manual-test 修复任务同样绕过 plan-sprint 直接写 queue，初版 wiring 全漏。

定案：**项目根单文件 `status.yml`**，init-project 建一次。`iterations` 按版本分块，task 带 `iteration`/`source` 字段，B 类 `iteration: null`。

## 已完成改动

**新增/调整文件**
- `skeleton/07-status-contract.md` — 项目级契约（字段/枚举/写入协议）
- `templates/status.yml` — 项目根模板（旧 `templates/iterations/status.yml` 已删）

**改 10 份 exec spec**
- `init-project.md` — Step 3 创建项目根 status.yml（含 iterations.v1.gates 全未签 + 空 tasks）
- `draft-prd-vN.md` — 签 G1：确保 iterations.vN.gates 块（v2+ 新建）+ gates.G1
- `draft-tech-design.md` — iterations.vN.gates.G2
- `plan-sprint.md` — Step 4.5 灌 sprint 任务（source=sprint,iteration=vN）；Step 5 gates.G3
- `develop.md` — 认领（独立/批量）→ taken-by+assigned_to；Step 8/批量 → done+pr
- `code-review.md` — Step 6 merged/可取；Step 7 code_reviews[]（含 iteration + severity 映射）
- `generate-integration-tests.md` — Step 4 integration_tests[]（带 iteration）；Step 5 派 integration 修复任务追加 tasks[]；Step 6 复测更新
- `manual-test.md` — Step 3 派 manual-test 修复任务追加 tasks[]；Step 5 gates.G4
- `dispatch-new.md` — Step 4 派 B 类追加 tasks[]（source=bug/optimization,iteration=null）
- `wrap-up-iteration.md` — gates.G5

**索引/文档**
- `skeleton/README.md` — 阅读顺序加 07（项目根）
- `STATUS.md` — 加 2026-05-31 里程碑
- `CLAUDE.md` — 项目仓结构 status.yml 移到项目根

## 总规则
凡往 iterations/vN/queue/ 写任务包处，同步往 tasks[] 追加一条（带 source/iteration）；状态流转按 task-id 改，对所有 source 一视同仁。

## 已确认决策
- 项目级单文件（B 类边界推翻迭代级）
- CR issue 内联 YAML（仓库无 CR 文档文件，前端 CRDrawer 已就绪只缺数据源）
- integration_tests 归 generate-integration-tests；manual-test 只签 G4

## 不在本轮范围
- 不改 hact-app（sync 改读 YAML + 文档走 API 留待 hact-app 自身迭代）
- 不改 CC 启动接续逻辑
- 不做 sprint.md 自动派生

## 下一步
- 用户复审 + commit（本轮不 push，遵守推送前确认）
