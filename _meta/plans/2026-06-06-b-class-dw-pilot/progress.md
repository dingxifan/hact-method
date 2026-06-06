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

## 会话 2（2026-06-06）：阶段 1 设计定稿

D2-D8 全部过完，结论见 findings.md「设计决策」表。

## 会话 3（2026-06-06）：阶段 2+3 完成（方法论落地 + 脚本编写）

### 完成内容

1. **`workflows/` 目录**（hact-method 根目录，与 templates/ 平级）
   - `workflows/README.md`：DW 模式说明 + 触发方式 + 升级情形 + 人工后续动作
   - `workflows/b-class-develop.js`：完整 DW 脚本（5 阶段）

2. **脚本结构**：
   - Phase 1 认领任务：读任务包 → 改 b-queue 状态 → 更新 status.yml → commit
   - Phase 2 Fix-Test Loop：agent-fix + 机械验证 agent，最多 3 轮，失败升级
   - Phase 3 对抗审查：独立 agent，有阻断 → 修复 → 二次审查，二次阻断升级
   - Phase 4 Commit + PR：commit → push → 创建 PR（支持 gitee-ops/gh）
   - Phase 5 状态更新：b-queue [done] + status.yml + b-tasks.md + commit + push

3. **`templates/CLAUDE.md`**：新增「B 类自动修复（Dynamic Workflow）」触发说明

### 关键设计落地

- **D7（只有主脚本写状态文件）**实现方式：主脚本通过专门的 state-update agent（Phase 1 / Phase 5）统一写状态，agent-fix 和 agent-review 只操作代码文件
- **schema**：TASK / VERIFY / REVIEW / DIFF / PR 五个结构化输出 schema
- **升级路径**：机械验证 3 轮失败 / 审查二次阻断 → 任务回 [可取] + return 明确原因

### 待办（阶段 4：接口打通）

- `b-queue/{task-id}.md` 任务包的具体字段格式（status 字段写法）
- `b-tasks.md` 行格式（脚本假设了"task-id 列"能定位到行）
- 上述两点需在 hact-app 有真实 B 类任务时核对，可能需微调 agent prompt

### 下次会话起点

阶段 4：接口打通。在 hact-app 创建一个测试用 B 类任务包，核对 b-queue 格式和 b-tasks.md 格式，按需微调脚本中的 agent prompt；然后进入阶段 5 试跑验证。

## 会话 4（2026-06-06）：脚本全面审查 + 修复

### 外部 review 发现的问题与修复

收到一轮完整 review，按严重程度处理：

**与 exec spec 对齐（必须修，7项）** → 全部修复（commit cf34ef8）：
- TASK_SCHEMA 扩展至 16 字段
- schema-change=true 在 Phase 1 立即升级
- Phase 1 补 b-tasks.md 认领状态更新
- Fix Loop 前补 reusables.md 复用检查（Explore agent）
- 机械验证后补偏离核查（extra_files / unimplemented_acs）
- agent-fix 传入 do-not / escalate-if，违反时回滚并升级
- agent-fix 传入完整上下文（context / standards / reference / known_risks / api_contract）

**质量改进（应该补，2项）** → 修复（同次提交）：
- PR description AC 验证段补具体验证方式；unimplemented_acs 标 [ ]
- 凭据检查补 git diff --cached

**可靠性 review（外部深度分析）**：
- 平台约束澄清：Workflow JS 脚本无 exec()，agent 是唯一出口
- 问题 2（分支/push 一致性）→ 修复：Phase 1 + escalateTask 补 push，提取 rollbackCode() helper（commit 0ea9cb7）
- 问题 3（假勾选）→ 修复：completed=false 触发升级，AC 按 unimplemented_acs 区分 [x]/[ ]
- 问题 4（最小测试）→ 修复：FIX_SCHEMA 加 test_files，agent-fix 写最小单元测试
- 问题 5（脏工作树）→ 修复：Phase 4 commit 前 git checkout -- extra_files
- 零碎（escalate_reason 判断 / 文件名引号 / 凭据漏扫）→ 全部修复

**技术一·闭环验证** → 实现（commit 62e0f8e）：
- rollbackCode()：执行后返回 git status --porcelain 原文，JS 判断是否干净
- verifyPush() helper：agent 只跑读命令返回 sha 原文，JS 做 === 比较
- Phase 1 / escalateTask / Phase 4 / Phase 5 所有 push 均加验证
- 不信 agent 自评，由 JS 通过可观测状态独立判断

**技术二（独立执行/验证 agent）、技术三（幂等 + 进度检查点）**：
- 方向已明确，留待后续会话实现

### 下次会话起点

视用户安排：
- 技术二 + 技术三（脚本可靠性继续提升）
- 阶段 4 接口打通（hact-app 真实任务包格式核对）
- 阶段 5 试跑验证
