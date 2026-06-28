# exec: generate-integration-tests

> CC 加载本文时，当前任务是在所有 sprint develop 任务合并后，先跑后端 smoke test；smoke test 有结论后，决定是否加跑前端 pinchtab（非视觉基线迭代由用户决定；**涉视觉基线迭代完整档必跑**）。
> 两档制：**轻量档（默认）** = 后端 curl smoke test → **完整档** = 轻量档 + 前端 pinchtab + 视觉冒烟断言（**涉视觉基线迭代必跑**；纯后端/无视觉基线变更迭代按需）

**上下文密度**：轻量档低。只需读 TRD 接口设计段 + PRD AC；完整档按需追加 ux-flows.md + prototype.html。

---

## 红线

- **跑测试前必须后端环境可达**：Step 3 前确认后端服务 + 数据库就绪
- **不测已有功能的回归**：只测本期新功能端到端路径和跨模块集成点
- **完整档前端场景上限 15 条**：超出时优先保留主流程 + 跨模块集成点，边界场景降级 `[不阻断]` 记入 backlog
- **[阻断] 失败必须走 develop 修复**：不在联调会话中直接改业务逻辑，走 dispatch

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
- **不存在** → 直接进入 Step 2，不等用户确认
- **存在** → 输出已有脚本概览（后端 N 条 / 前端 M 条），询问是否重新生成或直接跑

🚫 脚本已存在时等用户选择

---

## 第一层：准备

### Step 1：核对测试环境

快速复核：
- [ ] 后端服务可达（curl 健康检查端点返回正常）
- [ ] 数据库指向测试库（非生产库）

```
✅ 测试环境核对完成：后端 {地址}，数据库为测试库。
→ 下一步：生成后端脚本
继续？
```

---

### Step 2：生成后端脚本

派 Explore subagent 读取 PRD AC + TRD 接口设计段，生成：
1. 按接口逐条写 `.http` / `curl` 脚本，覆盖正常路径 + 鉴权边界 + 错误码 + 跨模块集成点；保存到 `integration-tests/backend/v{N}-run-all.sh`
2. 写脚本索引 `integration-tests/scripts-v{N}.md`（后端部分），字段：序号 / 场景描述 / 覆盖 AC
3. `git add integration-tests/ && git commit -m "test(it): v{N} 后端集成脚本生成" && git push`

**脚本已存在** → 读所有已合并 PR 的「偏离说明」段落：无偏离则直接可用；有字段名 / 路径 / 格式变化 → 定向修正对应脚本，不重写整条场景。

```
✅ 后端脚本生成完成：{N} 条场景。
→ 下一步：跑后端测试
继续？
```

---

## 第二层：执行

### Step 3：跑后端测试

读 `integration-tests/scripts-v{N}.md`，提取模块列表，**按模块并行派 subagent**：
- 每个 subagent 执行该模块下所有 `.http` / `curl` 脚本
- 返回：每条场景结果（✅/❌）+ HTTP 状态码 + response body 关键字段摘要 + 失败现象及复现步骤

全部返回后，汇总写入 `integration-tests/result-{日期}.md`，**同步写 `status.yml` 的 `integration_tests[]`**（每条场景一项）：
```yaml
- { iteration: vN, index: {序号}, description: {场景描述}, status: {通过/失败}, failure_reason: {失败现象 或 null} }
```

---

### Step 4：处理后端失败

逐条处理 ❌ 条目：

**`[阻断]`**（影响主流程）：

满足快速通道条件（同时满足：无业务逻辑改动 + 原因显而易见）→ 快速通道：

1. 修改代码
2. 自检（有报错必须修复，不得跳过）：`cd backend && npm run build 2>&1 | tail -5 && npx tsc --noEmit 2>&1 | head -10`
3. 提交并合并：
```bash
git checkout -b fix/it-{desc}
git add {改动文件}
git commit -m "fix(it): {描述}"
git push origin fix/it-{desc}
git checkout master && git merge fix/it-{desc} && git push origin master
git branch -d fix/it-{desc}
```

不满足 → 写 develop 任务包（`source=integration`，urgency 按影响程度），写入 `iterations/vN/queue/{task-id}.md`；同步追加 `status.yml` 的 `tasks[]`；更新 `_meta/sessions/generate-integration-tests-progress.md`

**`[不阻断]`**：评估规模写 backlog 或建 B 类任务；不派 source=integration 修复任务

**同一 `[阻断]` 修复后仍失败超过 2 轮** → 判断根因是否在 TRD 设计，若是则创建 `revise-doc(target=trd)` 任务；该场景暂停复测，revise-doc 完成后重新进入 Step 3

---

### Step 4.5：完整档决策

后端测试全部有结论后，判定档位：

- **涉视觉基线迭代**（本期含 frontend 任务且 `design.md` 定义了视觉基线）→ **完整档必跑**，不询问，直接进入下方完整档步骤。视觉冒烟断言是「唯一捕捉网从 manual-test 末端前移」的关键，不可跳过。
- **非视觉基线迭代**（纯后端，或前端本期无视觉基线变更）→ 输出下方询问，按需：

```
后端 smoke test 结果：{N} 条通过，{M} 条已修复，{K} 条记入 backlog。
是否继续跑前端 pinchtab 场景？（输入「是」继续，或直接进入 manual-test）
```

🚫 等用户回应（仅非视觉基线迭代）；选「否」/ 进入 manual-test → 跳转 Step 5（收尾）

**完整档步骤**（必跑迭代或用户选「是」）：

1. 确认前端页面可打开
2. 派 Explore subagent 读 ux-flows.md + prototype.html（若存在），生成前端场景（上限 15 条，优先主流程 + 跨模块集成点）：调用 `Skill(pinchtab)` 生成脚本，保存到 `integration-tests/frontend/v{N}-run-all.sh`；prototype.html 存在时软核对场景覆盖是否齐全（不设硬闸口，超 15 条按上限降级 backlog）
3. 更新脚本索引，追加前端部分；commit + push
4. 按模块并行派 subagent 执行 pinchtab 场景，汇总结果追加至 `result-{日期}.md`，更新 `status.yml`
5. **视觉冒烟断言**（涉视觉基线迭代必做，≤3 条固定、不计入 15 条上限）：在关键页面加载后用 pinchtab/JS 实测以下确定值，取数源 = `design.md`「〇、视觉冒烟锚点」段，不符即 `[阻断]`：
   - **主色覆盖**：`getComputedStyle(document.documentElement).getPropertyValue('--el-color-primary').trim()`（按本项目 UI 库主色变量名调整）== design.md 主色 token —— 抓「token 定义了没覆盖库主题」
   - **视口无外溢**：目标视口宽下 `document.documentElement.scrollWidth - window.innerWidth <= 0` —— 抓「视口外溢」
   - **关键容器尺寸**：侧栏宽 / 顶栏高等的实测 `offsetWidth`/`offsetHeight` == design.md 布局 token —— 抓「侧栏宽错」
6. 处理前端失败（同 Step 4 逻辑）；视觉冒烟断言失败按 `[阻断]` 走 develop 修复，根因常在视觉地基包（主题未覆盖 / 全局 reset 缺失）

---

## 第三层：收尾

### Step 5：复测

develop(source=integration) 全部 [merged] 后，重跑**所有**已生成的测试脚本（后端必跑，完整档含前端）。

更新 `result-{日期}.md`，**同步更新 `status.yml` 的 `integration_tests[]`**（按复测结果改各项 status，通过项 failure_reason 置 null）。

---

### Step 6：三条件确认

- [ ] 所有已生成测试场景均有明确结论（无"未测"条目）
- [ ] 主流程无 `[阻断]` 失败（已修复且复测通过）
- [ ] `[不阻断]` 问题已记入 backlog 且已分级

**若运行了完整档**，额外确认：前端 pinchtab 场景已控制在 ≤15 条；**涉视觉基线迭代**的视觉冒烟断言（主色 / 视口外溢 / 关键容器）全部通过或失败已走 develop 修复并复测通过

三条件全满足：
```
✅ generate-integration-tests 完成：{N} 条场景全有结论，主流程无阻断，backlog 已分级。
→ 下一步：manual-test（人工验收）
```

未全满足 → 回到 Step 4 继续处理。

---

### Step 7：feedback 检查

- 多个 `[阻断]` 根因相同 → 写入 项目根 `feedback.md`（`{日期} | {发现} | 建议更新到 {standards/trd 哪节}`）
- 完整档 pinchtab 无法覆盖的场景比预期多 → 记录，供下期调整策略（如改用直接导航替代 UI 点击链）
- 无发现 → 跳过

---

## Subagent 使用

| 触发点 | Subagent 任务 | Prompt 要点 | 失败处理 |
|--------|-------------|------------|---------|
| Step 2（后端脚本生成） | Explore 读 PRD AC + TRD 接口，生成 backend curl 脚本 | 读 prd AC + trd 接口设计段；生成 backend/v{N}-run-all.sh；写脚本索引后端部分；返回场景数 | 失败则主线手动生成 |
| Step 3（按模块并行） | 每模块一个 subagent，执行后端 curl 脚本 | 传入：模块名、.http 脚本列表、后端地址；执行 curl；返回每条结果（✅/❌）+ 状态码 + body 摘要；部分失败仍返回其余结果 | 失败则主线逐条执行 |
| Step 4.5（完整档·前端） | Explore 读 ux-flows + prototype 生成 pinchtab 脚本；执行 subagent 跑前端场景 | 调用 Skill(pinchtab)；上限 15 条；prototype 软核对覆盖；返回每条结果 | 失败则主线手动生成 / 逐条执行 |

---

## 上下文管理

**断点续做**：
1. 读 `_meta/sessions/generate-integration-tests-progress.md`：确认已跑场景 + 已派修复 task-id + 当前档位（轻量/完整）
2. 读 `integration-tests/result-{最新日期}.md`：确认已有测试结论
3. 读 `queue/`：找 source=integration 任务包，确认修复状态
4. 从第一个无结论的场景继续，或等修复 [merged] 后复测

`_meta/sessions/generate-integration-tests-progress.md` 结构：
```markdown
## generate-integration-tests 进度 · vN

### 档位
轻量档 / 完整档

### 修复任务
- {task-id}：{场景#N} {问题描述}（当前状态：[可取]/[merged]）
```

**上下文过重时**（场景数 ≥20）：每完成 10 个场景后考虑一次 compact；compact 前确认结论已写入 result md。
