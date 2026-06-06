# progress · B 类 Dynamic Workflow 试点

## 会话 1（2026-06-06）：项目立项

### 背景还原

本项目来自「代码质量流水线重设计」计划（`2026-06-06-code-quality-pipeline`）记录的「缺口 1：B 类 loop 化」。
当时未展开，只记了标题。

### 本次会话讨论结论

1. **「B 类 loop」指的是 B 类流程（dispatch-new 起）的 loop 化**，不是 AI 自动修复的单会话内部循环。

2. **DW 范围确认**：
   - 仅 develop 阶段（fix-test 循环）做成 DW
   - pr-review 保持人工
   - dispatch-new 保持现有流程

3. **两种路径的关键区别已厘清**：
   - 改 exec spec = 伪循环（单会话，上下文污染，AI 审自己代码）
   - DW 脚本 = 真循环（多 agent，程序化 while，独立上下文）
   - 结论：走 DW 脚本路径

4. **方法论影响已识别**：引入 DW 是一次模式扩展，需要新的存放位置和 spec 类型，具体待阶段 1 讨论结束后落地。

### 下次会话起点

继续阶段 1 设计讨论，逐一过 task_plan.md 中 D2-D8 待决问题。
