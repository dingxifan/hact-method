# exec: generate-integration-tests

> CC 加载本文时，当前任务是在所有 sprint develop 任务合并后，生成测试脚本、执行测试、处理失败，三条件满足后移交 manual-test。
> 三层顺序：**准备**（脚本生成 + 环境核查）→ **执行**（跑测试 + 处理失败）→ **收尾**（复测 + 三条件确认）

**上下文密度**：中高。脚本在本阶段生成，需读 PRD AC + TRD 接口设计段 + ux-flows.md + prototype.html（若存在）；脚本稳定后只需读脚本索引 + 执行测试。

---

## 红线

- **跑测试前必须环境可达**：Step 3 执行脚本前确认后端 / 前端 / 数据库全部就绪；脚本对齐（Step 2）不依赖环境，可提前进行
- **不测已有功能的回归**：只测本期新功能端到端路径和跨模块集成点，回归属于 B 类范畴
- **前端 pinchtab 场景上限 15 条**：超出时优先保留主流程 + 跨模块集成点，边界场景降级为 `[不阻断]` 记入 backlog；后端 `.http` / `curl` 场景不设硬性上限
- **[阻断] 失败必须走 develop 修复**：不在联调会话中直接改代码，不口头转达，走 dispatch

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

**前置检查**：读 `iterations/vN/sprint.md`，确认所有 `source=sprint` 的 develop 任务状态全部为 [merged]。

有未合并任务 → 阻断：
```
以下 develop 任务尚未 [merged]，无法开始联调：
- {task-id}：{标题}（当前状态：{状态}）
请完成后重新开始。
```

检查 `integration-tests/scripts-v{N}.md` 是否存在：

- **存在** → 读脚本索引，输出选项列表
- **不存在（主线）** → 直接进入 Step 2 生成脚本，不等用户确认

**选项列表**（脚本已存在时输出）：

```
{项目名} · 所有 sprint 任务已 [merged]
已找到 integration-tests/scripts-v{N}.md：{N} 条后端场景，{M} 条前端场景

可做的任务：
[1] generate-integration-tests — 跑联调脚本 ← 主线

其他可做（输入「展开」/ 自由描述）：
- revise-doc(target=trd) — 若发现 TRD 接口定义有歧义，先修再联调

请选 [1]，或输入「展开」，或直接说你要做什么。
```

🚫 等用户选择后再继续

用户选 [1] → 继续下方步骤
用户选其他 → 按用户描述判断，加载对应 exec spec 执行

---

## 第一层：准备（脚本就绪 + 环境核查）

### Step 1：核对测试环境

G3 签署时已确认环境可达，此处快速复核：
- [ ] 后端服务可达（curl 健康检查端点返回正常）
- [ ] 数据库指向测试库（非生产库）
- [ ] 前端页面可打开

**任一未就绪** → 提示用户重启对应服务，就绪后继续；不影响脚本对齐（Step 2）同步进行。

```
✅ 测试环境核对完成：后端 {地址}，数据库为测试库，前端 {地址} 可访问。
→ 下一步：处理 CR [建议]
继续？
```

---

### Step 1.5：处理 CR [建议] 清单

读 `backlog.md`，找出所有标记 `[CR-建议]` 的条目：

- **无条目** → 跳过此步
- **有条目** → 逐条判断：
  - 改动 ≤5 行且原因显而易见 → 直接修复，commit，标记 `[x]`
  - 较复杂或影响范围不确定 → 评估规模：≤3 文件且改动独立 → 建议走 B 类快速通道；否则移除 `[CR-建议]` 标记，改为普通 backlog 条目（留待下期处理）

```
✅ CR [建议] 处理完成：直接修复 {N} 条，降级为普通 backlog {M} 条。
→ 下一步：脚本对齐核查
继续？
```

---

### Step 2：生成 / 对齐脚本

检查 `integration-tests/scripts-v{N}.md` 是否存在：

**脚本不存在（主线路径）** → 派 Explore subagent 读取 PRD AC + TRD 接口设计 + ux-flows.md + `prototype.html`（若存在），生成：
1. 后端场景：按接口逐条写 `.http` / `curl` 脚本，覆盖正常路径 + 鉴权边界 + 错误码 + 跨模块集成点；保存到 `integration-tests/backend/v{N}-run-all.sh`
2. 前端场景（上限 15 条，优先覆盖主流程 + 跨模块集成点）：调用 `Skill(pinchtab)` 生成 pinchtab 脚本；保存到 `integration-tests/frontend/v{N}-run-all.sh`。`prototype.html` 存在时，用它**核对前端场景覆盖是否齐全**——每条原型交互分支应对应一条场景或显式标注豁免（软覆盖核对，不设硬闸口；超 15 条仍按上限规则降级 backlog）
3. 写脚本索引 `integration-tests/scripts-v{N}.md`：按功能模块分段（`## {模块名}`），每段一张表（字段：序号 / 场景描述 / 覆盖 AC）
4. `git add integration-tests/ && git commit -m "test(it): v{N} 集成测试脚本生成" && git push`

> **为什么在这里而不是 draft-tech-design 阶段生成**：
> 前端 pinchtab 脚本依赖实际运行的应用（路由结构、元素可访问性、工具 API 行为、DB 数据状态）。
> 这些在 develop 合并前无法验证，预生成等于"空中建筑"——会引入大量错误假设，联调时需要多轮修正。
> 后端 curl 脚本相对稳定（只依赖 API 契约），但也可能因实现偏离 TRD 而需要修正，统一在此阶段生成更易维护。

**脚本存在** → 读所有已合并 PR description 的「偏离说明」段落：
- 无偏离 → 脚本直接可用，跳过校准
- 有接口偏离（字段名 / 路径 / 格式变化）→ 定向修正对应脚本，不重写整条场景

```
✅ 脚本生成/对齐完成：{N} 条后端场景，{M} 条前端场景，校准 {K} 条（或：新生成）。
→ 下一步：跑测试
继续？
```

---

## 第二层：执行（跑测试 + 处理失败）

### Step 3：跑测试

读 `integration-tests/scripts-v{N}.md`，提取模块列表（每个 `## {模块名}` 段为一个模块）。

**按模块并行派 subagent**，每个 subagent 负责该模块的端到端执行：
- 后端：执行该模块下所有 `.http` / `curl` 脚本
- 前端：调用 `Skill(pinchtab)` 执行该模块的 pinchtab 场景
- 返回：每条场景的结果（✅/❌）+ HTTP 状态码 + response body 关键字段摘要 + 失败现象及复现步骤

全部 subagent 返回后，汇总写入 `integration-tests/result-{日期}.md`：

```markdown
# 联调测试结果 · vN · {日期}

| # | 模块 | 场景描述 | 结果 | 现象（失败时填写） | 级别 |
|---|------|---------|------|-----------------|------|
| 1 | {模块名} | {场景描述} | ✅ | — | — |
| 2 | {模块名} | {场景描述} | ❌ | {具体现象 + 复现步骤} | [阻断] |
| 3 | {模块名} | {场景描述} | ❌ | {现象} | [不阻断] |
```

结果写入 `integration-tests/result-{日期}.md`。

**同步写项目根 `status.yml` 的 `integration_tests[]`**（机器侧契约，见 `../hact-method/skeleton/07-status-contract.md`；hact-app 直接取数驱动 F6 联调清单）：每条场景一项
```yaml
- { iteration: vN, index: {序号}, description: {场景描述}, status: {待执行/执行中/通过/失败}, failure_reason: {失败现象 或 null} }
```
结果表的 ✅ → `通过`，❌ → `失败`（failure_reason 填现象），未跑 → `待执行`。result-{日期}.md 是人看的视图，status.yml 是机器取数源；现象/复现步骤等正文留在 result md，不进 YAML。

---

### Step 4：处理失败

逐条处理 ❌ 条目：

**`[阻断]`**（影响主流程，必须修复）：

先判断是否满足**快速通道**条件（同时满足）：
- 无业务逻辑改动（允许：null 防护、缺失字段补全、类型修复、配置笔误、错误拦截格式、接口字段对齐；不允许：条件判断逻辑、数据处理算法、权限规则、接口行为）
- 原因显而易见，无需上下文讨论

满足 → 快速通道：

**1. 修改代码**

**2. 提交前自检**（有报错必须修复，不得跳过）
```bash
# 后端有改动时
cd backend && npm run build 2>&1 | tail -5
npx tsc --noEmit 2>&1 | head -10

# 前端有改动时
cd frontend && npm run build 2>&1 | tail -5
npx vue-tsc --noEmit 2>&1 | head -10
```
有编译 / 类型错误 → 修复后重新自检，通过后才进入下一步。

**3. 提交并合并**
```bash
git checkout -b fix/it-{desc}
git add {改动文件}
git commit -m "fix(it): {描述}"
git push origin fix/it-{desc}
git checkout master && git merge fix/it-{desc} && git push origin master
git branch -d fix/it-{desc}
```
在结果表对应条目备注「已直修」，继续复测。

不满足 → 写 develop 任务包（`source=integration`，urgency 按影响程度），写入 `iterations/vN/queue/{task-id}.md`
  - task-id 命名：`{项目缩写}-it-{三位序号}`，如 `hact-it-001`
  - **同步往项目根 `status.yml` 的 `tasks[]` 追加一条**（`source: integration`、`type: develop`、`iteration: vN`、`sprint: null`、`status: 可取`，字段见 `../hact-method/skeleton/07-status-contract.md`），git add 含 `status.yml`
  - 更新 `_meta/sessions/generate-integration-tests-progress.md`，记录已派修复的 task-id

**`[不阻断]`**（边界或视觉问题）：
- 评估规模：≤3 文件且原因明确 → 建议走 B 类快速通道（`dispatch-new`）；否则写入 `backlog.md`，格式：`- [ ] {日期} | [不阻断] {描述} | 联调发现`
- 不派 source=integration 修复任务（B 类走独立通道）

**同一 `[阻断]` 修复后仍失败超过 2 轮** → 上报；判断根因是否在 TRD 设计，若是则创建 `revise-doc(target=trd)` 任务。

```
✅ 失败处理完成：[阻断] {N} 条已派修复，[不阻断] {M} 条已记入 backlog。
→ 下一步：等待修复合并后复测
继续？
```

**[阻断] 修复超 2 轮仍失败且已创建 revise-doc 任务时**：
- 暂停该场景的复测，在 `_meta/sessions/generate-integration-tests-progress.md` 标注「等待 revise-doc 完成」
- 继续其他可测场景的复测
- revise-doc 完成后，从暂停的场景重新开始 Step 3（跑测试）

---

## 第三层：收尾（复测 + 三条件确认）

### Step 5：复测

develop(source=integration) 全部 [merged] 后，重跑**所有**测试脚本（不只跑修复相关场景）。

更新 `integration-tests/result-{日期}.md`，在原条目后追加复测结论。**同步更新 `status.yml` 的 `integration_tests[]`**：按复测结果改各项 `status`（通过项 failure_reason 置 null）。

---

### Step 6：三条件确认

逐条核查：

- [ ] 所有测试场景均有明确结论（无"未测"条目），其中前端 pinchtab 场景已控制在 ≤15 条
- [ ] 主流程无 `[阻断]` 失败（已修复且复测通过）
- [ ] `[不阻断]` 问题已记入 backlog 且已分级

三条件全满足：
```
✅ generate-integration-tests 完成：{N} 条场景全有结论，主流程无阻断，backlog 已分级。
→ 下一步：manual-test（人工验收）
```

未全满足 → 回到 Step 4 继续处理。

---

### Step 7：feedback 检查

回顾本次联调：
- 多个 `[阻断]` 根因相同（如同一接口错误码未覆盖）→ 写入 `feedback.md`（格式：`{日期} | {发现} | 建议更新到 {standards/trd 哪节}`）
- pinchtab 无法覆盖的场景比预期多 → 记录，供下期脚本生成时调整策略（如改用直接导航替代 UI 点击）
- 无发现 → 跳过

---

## Subagent 使用

| 触发点 | Subagent 任务 | Prompt 要点 | 失败处理 |
|--------|-------------|------------|---------|
| Step 2（脚本生成，主线） | Explore 读取 PRD AC + TRD 接口 + ux-flows + prototype.html，生成后端 curl + 前端 pinchtab 脚本 | 读 prd/trd/ux-flows/prototype 目标段落；生成 backend/v{N}-run-all.sh + 调用 `Skill(pinchtab)` 生成 frontend/v{N}-run-all.sh；前端用 prototype 软核对场景覆盖齐全；写脚本索引；返回生成文件列表 | 失败则主线手动生成 |
| Step 3（按模块并行） | 每模块一个 subagent，端到端执行该模块后端 curl + 前端 pinchtab | 传入：模块名、该模块 .http 脚本列表、pinchtab 场景列表、后端地址、前端地址；执行后端 curl 脚本 + 调用 `Skill(pinchtab)` 执行前端场景；返回：每条场景的结果（✅/❌）+ HTTP 状态码 + response body 关键字段摘要 + 失败现象；部分场景失败时仍返回其余场景结果，不中断 | 失败则降级：该模块主线逐条执行 |

---

## 上下文管理

**断点续做**：
1. 读 `_meta/sessions/generate-integration-tests-progress.md`：确认已跑场景 + 已派修复 task-id
2. 读 `integration-tests/result-{最新日期}.md`：确认已有测试结论
3. 读 `queue/`：找 source=integration 任务包，确认修复状态
4. 从第一个无结论的场景继续，或等修复 [merged] 后复测

`_meta/sessions/generate-integration-tests-progress.md` 内容结构：
```markdown
## generate-integration-tests 进度 · vN

### 修复任务
- {task-id}：{场景#N} {问题描述}（当前状态：[可取]/[merged]）
```

**上下文过重时**（场景数 ≥20）：
- 每完成 10 个场景后考虑一次 compact
- compact 前确认：已跑场景的结论已写入 result-{日期}.md（写入即持久化，compact 不丢失进度）
