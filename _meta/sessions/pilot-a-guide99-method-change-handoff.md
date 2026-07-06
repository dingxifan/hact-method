# Codex Method Change Handoff

## 1. 基本信息

- repository: /home/administrator/group-coding/hact-method-lab
- change-id: pilot-a-guide99-fix
- title: 补全 guide/99-任务速查表.md 遗漏的 draft-ux / draft-foundation 任务类型
- owner: dingxifan
- date: 2026-07-05

## 2. 修改目标

`guide/99-任务速查表.md` 开头声明"13 种任务类型一览"，但权威来源 `skeleton/04-task-catalog.md`
目前收录 **14 个** task type（标题即为"14 task 完整定义"），其中 `draft-ux`（第 3 条）和
`draft-foundation`（第 14 条）两个任务类型在 guide/99 的三张任务表（A 类主线 / B 类 / 支线）里
完全缺失。这会导致新用户按这张速查表找不到这两个任务的入口，且开头计数与实际不符。
本次任务只是把 guide/99 这份**索引/摘要**文档与 skeleton/04 这份**权威全谱**对齐，不改变、
不讨论任何任务定义本身。

## 3. 已确认决策

- 决策 1：`skeleton/04-task-catalog.md` 是任务全谱的权威来源，`guide/` 下文件只是面向新用户的
  索引/摘要性质文档，非规范本身（见 `CLAUDE.md` 「文件规范」一节对 guide/ 的定位）；二者不一致时
  以 skeleton/04 为准。
- 决策 2：`draft-ux` 是 A 类主线任务，discipline 为 `product`，无独立 Gate，可选前置于 G2
  （若 PRD 标记某功能"draft-ux: 需要"，则 `draft-tech-design` 对 G2 强制阻断，直到本任务产出
  `prototype.html`）。定义见 skeleton/04 第 3 条。
- 决策 3：`draft-foundation` 是决策#25（地基层 + V0 走骨架）新增的任务，discipline 为
  `architecture`，只在 V0 迭代出现，先于 `draft-prd-vN`，关联 Gate 是 **G2(v0)**（与
  `draft-tech-design` 的 G2 同槽但不同期，不能简化写成普通"G2"，否则会和 draft-tech-design
  的 G2 混淆）。定义见 skeleton/04 第 14 条。

## 4. 修改范围

### 允许修改

- `guide/99-任务速查表.md` — 补充两个任务类型的行，修正开头任务计数

### 禁止修改

- `skeleton/**`、`specs-structural/**`、`specs-execution/**`、`templates/**`、`codex-adapter/**`
  — 本次任务不重新定义任何任务，只是让索引追上权威来源
- `guide/` 目录下其他文件 — 如果发现同类遗漏，记录为建议，不擅自扩大修改范围

### 只读参考

- `skeleton/04-task-catalog.md` — 任务全谱权威来源，重点看第 3 条（draft-ux）和第 14 条
  （draft-foundation）的完整定义
- `CLAUDE.md` — 确认 `guide/` 的定位（索引/摘要，非规范本身）

## 5. 具体任务

- [ ] 在 guide/99 的「A 类主线任务（有 Gate）」表里补 `draft-ux` 一行（建议位置：
      `draft-prd-vN` 之后、`draft-tech-design` 之前；Gate 列填"无独立 Gate（可选前置于 G2）"）
- [ ] 补 `draft-foundation` 一行（V0 专属任务；Gate 列填 `G2(v0)`；需要清楚标注这是 V0 迭代
      专属环节，不要让读者误以为每期迭代都要做）
- [ ] 修正文档开头"13 种任务类型一览"为准确计数
- [ ] 检查文档最上方「按场景找任务」表是否也需要为这两个任务补一行场景描述

## 6. 一致性要求

- 术语：task type 名称须与 skeleton/04 完全一致：`draft-ux`、`draft-foundation`
- task type：guide/99 出现的全部 task type 必须是 skeleton/04 里已定义的 14 个之一，不得新造
  或改写既有任务的名称
- 路径：不涉及路径改动
- Gate / status：`draft-ux` 必须写"无独立 Gate，可选前置于 G2"；`draft-foundation` 必须写
  `G2(v0)`，不得简写为 `G2`
- 模板字段：无

## 7. 验证方式

- `rg "draft-ux" guide/99-任务速查表.md` — 应命中
- `rg "draft-foundation" guide/99-任务速查表.md` — 应命中
- 人工核对：guide/99 中出现的每一个 task type 名称，都能在
  `rg "^### [0-9]+\. \`" skeleton/04-task-catalog.md` 的结果里找到对应条目（即 14 个全覆盖，
  不多不少）
- 人工核对：`draft-ux` 和 `draft-foundation` 两行的 Gate 描述与 skeleton/04 对应条目的
  "关联 Gate" 字段语义一致
- `git diff --check`

## 8. 输出要求

Codex 完成后必须说明：

- 修改了哪些文件
- 每处改动对应第 5 节里的哪个具体任务
- 跑了哪些验证，结果如何
- 哪些验证未运行及原因
- 是否发现超出本 handoff 范围的问题（例如：guide/ 下是否还有其他文件同样遗漏了
  `draft-ux` / `draft-foundation`；skeleton/04 与其他权威文件之间是否还有别的任务计数不一致）
