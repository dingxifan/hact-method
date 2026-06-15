# task_plan · develop 预加载有效性 / 链路保真度审查

## 目标

回答用户的命题:**hact-method 中 develop 阶段的预加载规则是否足够有效。**
拆成三个子命题:
1. develop 的加载量是否合适(过多→淹没 / 过少→盲区)
2. PRD→UX→TRD→SPRINT 蒸馏链路是否有信息损耗或过载
3. standards / design 等规范是否充分发挥有效性

## 审查对象与边界

- **对象 = 方法本身**:`skeleton/` + `specs-structural/` + `specs-execution/` + `templates/`
- **明确不读** hact-app 或任何项目实例数据 —— 缺口是 spec 的设计属性,纯文本可证;用实例只能证明"这次有没有咬人",是更弱的证据,且会把结论污染成"关于 hact-app 的结论"(用户 2026-06-16 当面纠正)

## 与既有审查的关系

- `_meta/plans/2026-06-06-method-audit/` 是**全量广度**审查(33 条,覆盖路由/状态机/并发/权限/Gate)
- 本次是**聚焦补充**:补它未覆盖的"信息保真度"透镜(加载有效性 = 指针保真度,方法有无保真闸门)
- 交叉引用:既有审查中擦边的条目 = P1"拉取池冷启动上下文"、P1"双源规范无过滤"、P1"queue 任务间依赖无机器可读格式"

## 主线预诊断(待三审查员证伪/确认)

从 spec 读出的三个接缝(本次会话已推):
- (a) **AC 来源漂移**:develop 全程不见 PRD;Step1 复述 + Step5.5 对抗审查只拿任务包 AC,无回溯 source
- (b) **ux-flows→reference 靠手抄**:plan-sprint Step3 手动补行号,无校验,漏抄则 draft-ux 价值蒸发
- (c) **字段自检只查非空不查保真**:plan-sprint.md:125 只验 16 字段非空,不验 reference 有无行号 / AC 是否对得上 PRD

## 阶段

| 阶段 | 状态 | 说明 |
|------|------|------|
| 阶段1:建计划文件 | complete | task_plan / findings / progress |
| 阶段2:派三审查员并行 | complete | 三员均回,对抗假设全部成立,三角交叉命中 X1/X2/X3 |
| 阶段3:合并交叉结论 | complete | findings.md 已写:3 个三角命中(2×P0+1×P1)+ 单角发现 + 交叉引用 |
| 阶段4:落档 + 提修复方向 | complete | findings.md 含 6 条修复方向(治本→治标),待开方法论调整会话逐条议 |

## 核心结论(一句话)

problem 不是"加载太多淹没上下文"(误判),而是反向:develop 可见信息被白名单卡死、上游无保真闸门、且唯一兜底的对抗审查(Step5.5)与开发主线同源贫信息——"网"和"盲区"用同一个洞织成。根因是 AC 验收主线在 PRD→TRD(七段无AC)→plan-sprint(不读PRD)中段被物理切断。

## 三审查员设计

| 审查员 | 对抗假设 | 读什么 | 产出 |
|--------|---------|--------|------|
| ①指针保真 | "方法只是希望指针精确,没强制" | plan-sprint + develop(结构+执行) + standards/design 模板 | 方法靠自觉、无强制校验的点 |
| ②链路损耗 | "信息在接缝处传丢" | draft-prd / draft-ux / draft-tech-design / plan-sprint / develop 交接段 | 每道接缝有无保真机制,漏在哪 |
| ③develop视角 | "只给任务包我做不出对的东西" | develop 执行层加载清单 + 字段规范 | develop 的结构性信息盲区 |
