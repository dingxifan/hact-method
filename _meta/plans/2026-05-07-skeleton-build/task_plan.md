# 任务计划 · hact-method 骨架搭建

## 阶段目标
在 `skeleton/` 下完成 hact-method 方法论骨架，形成可作为第二阶段（结构层规范）输入的成品文档集。

## 完成标志
1. `01-identity.md`：用户唯一身份模型 + 跨工作区身份打通 + users.role 权限标记
2. `02-workspaces.md`：项目根 / dispatch / group-code 父级 三种工作心态的边界、文件读写权限
3. `03-disciplines.md`：discipline 作为知识聚类的定义（清单由 04 涌现）；每个 discipline 的范围/边界/典型工作
4. `04-task-catalog.md`：所有 task.type 清单 + 字段（归属 Gate / 加载规范 / 产物 / 完成判据 / urgency / layer / disciplines）
5. `05-state-machine.md`：状态枚举 + 流转规则 + 软锁 + 双向暂停 + 召回
6. `06-gates.md`：5 Gate 内涵 + 子状态聚合 + A 类 5 Gate vs B 类无 Gate
7. `README.md`：入口导读
8. 骨架自检通过（覆盖度 + 互引一致性）

## 任务列表

| # | 任务 | 状态 |
|---|------|------|
| 0 | 骨架文档清单（含两轮调整：03 改为 disciplines 知识聚类 + 03/04 合并写） | ✅ |
| 1 | 写 `01-identity.md`（含 Section 3 权限模型重写） | ✅ |
| 2 | 写 `02-workspaces.md` | ✅ |
| 3 | 写 `03-disciplines.md` + `04-task-catalog.md`（合并写：step 1+2 任务全谱定稿 ✅ 12 task / 9 discipline / 路径 X；step 3 ⏳ 写 03 定义；step 4 写 04） | ⏳ 进行中 |
| 4 | 写 `05-state-machine.md` | ⏸️ |
| 5 | 写 `06-gates.md` | ⏸️ |
| 6 | 写 `README.md`（入口导读） | ⏸️ |
| 7 | 骨架自检（覆盖度 + 互引一致性） | ⏸️ |

写作顺序：01 → 02 → (03+04 合并) → 05 → 06 → README → 自检。

## 关键决策（继承自 BRIEF.md，不要绕回）

见 `BRIEF.md` "关键设计决策" 段（16 条）。本 plan 在写作过程中如对其中任何一条产生疑问，先在 progress.md 记下，不擅自推翻。

## 下一步起点

任务 1 ✅ 完成
任务 2 ✅ 完成
任务 3 ⏳ 进行中：
  - step 1+2 ✅ 任务全谱定稿——12 task / 9 discipline / 路径 X (task→discipline 1:N)
  - step 3 ⏸️ 下一步：写 `03-disciplines.md`（9 discipline 完整定义）
  - step 4 ⏸️ 之后：写 `04-task-catalog.md`（12 task 含 discipline 字段）

## 仍 park 的项

来自旧仓重构讨论的小细节，落地阶段补即可，无阻断：
- a 迭代废弃流程
- b B 类任务包修订
- d 机制层兜底（Stop hook）
- e method-pending 并发
- f deployment.config 时机
