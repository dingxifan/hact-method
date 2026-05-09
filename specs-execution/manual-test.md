# exec: manual-test

> CC 加载本文时，当前任务是提供测试环境、引导用户自主验收、收集反馈派修复任务、用户明确通过后签 G4。
> 本 task 以用户为主导，CC 负责记录、派发和跟踪，不替用户判断通过与否。

**上下文密度**：低（等待用户交互为主）。不加载代码，只读 PRD 和联调测试结果。

---

## 红线

- **不替用户判断验收通过**：「验收通过」必须由用户明确说出，CC 不得自行宣布通过
- **超出本期 PRD 范围的问题不派修复**：记入 backlog，告知用户留下期处理
- **G4 签字后提出的新问题走 B 类**：G4 已签后的问题通过 `dispatch-new` 处理，不回退验收状态
- **测试环境必须指向测试库**：不在生产数据库上做验收操作

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

**前置检查**：读 `integration-tests/result-{最新日期}.md`，确认联调三条件已满足：
- [ ] 所有测试场景均有结论
- [ ] 主流程无 `[阻断]` 失败
- [ ] `[不阻断]` 问题已记入 backlog 并分级

三条件未满足 → 阻断：
```
generate-integration-tests 尚未完成（{未满足条件}），无法开始人工验收。
请完成联调后重新开始。
```

**选项列表**（前置已满足，确认要做什么）：

```
{项目名} · 联调三条件已满足

可做的任务：
[1] manual-test — 提供测试环境，开始人工验收 ← 主线

其他可做（输入「展开」/ 自由描述）：
- revise-doc(target=prd) — 若发现 PRD acceptance criteria 有模糊之处，先修再验收

请选 [1]，或输入「展开」，或直接说你要做什么。
```

🚫 等用户选择后再继续

用户选 [1] → 继续下方（精确读取 prd.md + standards-shared.md）
用户选其他 → 按用户描述判断，加载对应 exec spec 执行

三条件满足 → 精确读取：
- `iterations/vN/prd.md`（acceptance criteria 段落）
- `iterations/vN/standards-shared.md`（测试环境约定段落）

---

## Step 1：确认测试环境

逐项核对：
- [ ] 后端服务可达（健康检查端点返回正常）
- [ ] 数据库指向测试库（非生产库）
- [ ] 前端页面可打开

**任一未就绪** → 引导用户逐步建立（参照 `iterations/vN/standards-shared.md` 测试环境约定段落），就绪后继续。

```
✅ 测试环境确认：{服务地址} 可访问，数据库为测试库。
→ 下一步：告知用户验收信息
继续？
```

---

## Step 2：告知用户验收信息

```
测试环境：{地址}

本期验收范围（来自 PRD acceptance criteria）：
- {AC 1}
- {AC 2}
...

联调测试结论：{N} 个场景通过 / 有 {X} 个 [不阻断] 问题已记入 backlog。

请自主探索，发现问题随时告知，不需要按特定顺序操作。所有问题确认处理完毕后，请明确说「验收通过」。
```

🚫 进入反馈循环——持续执行 Step 3–4，直到用户说「验收通过」

---

## Step 3：收集反馈 + 派修复任务

用户每反馈一个问题，执行以下流程：

**① 判断是否在本期 PRD 范围内**：
- 在范围内 → 继续②
- 超出范围 → 告知「该问题不在本期范围，已记入 backlog 留下期处理」，写入 `backlog.md`，不派修复，等待下一条反馈

**① 补充：特殊反馈分支处理**

| 反馈类型 | 处理方式 |
|---------|---------|
| 问题无法复现 | 在验收报告记录「用户反馈，无法复现」，标 `[待观察]`；不派修复任务；不阻断验收通过 |
| 根因是 PRD 定义歧义 | 创建 `revise-doc(target=prd)` 任务；修订完成后再继续该功能的验收；不跳过 |
| 用户要求加新功能才算通过 | 告知「该需求属于下期功能，不在本期验收范围」；记入 `backlog.md`；继续当前验收 |

**② 记录问题**（不替用户判断严重性）：
- 现象描述 + 复现步骤
- 追加至 `iterations/vN/acceptance-report.md` 问题记录区（文件不存在则先建，见 Step 5 格式，初始结论写「进行中」）

**③ 判断 urgency**：

| 条件 | urgency |
|------|---------|
| 影响核心功能且用户无法绕过 | `hotfix` |
| 其余 | `normal` |

**④ 判断修复路径**：

先判断是否满足**快速通道**条件（同时满足）：
- 无业务逻辑改动（允许：null 防护、缺失字段补全、类型修复、配置笔误、错误拦截格式、接口字段对齐；不允许：条件判断逻辑、数据处理算法、权限规则、接口行为）
- 原因显而易见，无需上下文讨论

**满足 → 快速通道**：

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
git checkout -b fix/mt-{desc}
git add {改动文件}
git commit -m "fix(mt): {描述}"
git push origin fix/mt-{desc}
git checkout master && git merge fix/mt-{desc} && git push origin master
git branch -d fix/mt-{desc}
```
在验收报告对应条目备注「已直修」，通知用户复测。

**不满足 → 写 develop 任务包**：
- `source=manual-test`
- `task-id` 命名：`{项目缩写}-mt-{三位序号}`，如 `hact-mt-001`
- 写入 `queue/{task-id}.md`，状态 `[可取]`

**⑤ 通知用户并记录**：
```
已处理修复：
- {task-id 或「已直修」}：{问题描述}（{urgency}）
本轮修复完成后通知你复测。
```
追加处理记录到 `_meta/sessions/manual-test-progress.md`。

---

## Step 4：等待复测

**本轮**派发的所有 develop(source=manual-test) 任务全部 [merged] 后，通知用户：
```
本轮修复已全部合并，请复测：
- {task-id}：{修复了什么}
```

> 「本轮」= 上次复测通知后新派发的任务。用户复测一次、新报一批问题、我们派一批修复——这批就是「本轮」。

🚫 等用户复测反馈

收到复测反馈后：
- 有新问题 → 回到 Step 3
- 「验收通过」 → 进入 Step 5
- 问题仍未解决 → 确认是同一任务还是新问题，同一问题超过 2 轮未修好则上报，判断是否需要 `revise-doc`

---

## Step 5：写验收报告 + 签 G4

用户明确说「验收通过」后，完善验收报告 `iterations/vN/acceptance-report.md`：

```markdown
# 验收报告 · vN · {项目名}

## 验收结论
通过

## Acceptance Criteria 验证
| AC | 描述 | 状态 |
|----|------|------|
| AC-1 | {描述} | ✅ 通过 |
| AC-2 | {描述} | ✅ 通过（修复后通过） |

## 问题记录
| # | 现象 | 复现步骤 | 处理结果 |
|---|------|---------|---------|
| 1 | {描述} | {步骤} | 已修复（{task-id}） |
| 2 | {描述} | {步骤} | 记入 backlog |

## 验收通过日期
{YYYY-MM-DD}
```

询问签 G4：
```
验收已通过，要签 G4 吗？
```

🚫 等用户确认

用户确认后，写入 `iterations/vN/gates.md`，执行：
```bash
git add iterations/vN/gates.md iterations/vN/acceptance-report.md
git commit -m "chore: 验收通过，G4 签署 [{项目名}]"
git push
```

---

## Step 6：feedback 检查

回顾本次验收：
- 反复出现的问题类型 → 说明 standards 或 TRD 有缺口，写入 `feedback.md`（格式：`{日期} | {发现} | 建议更新到 {文件哪节}`）
- 联调通过但验收仍发现的问题 → 说明联调场景覆盖不足，写入 `feedback.md`，供下次 generate-integration-tests 参考
- 无发现 → 跳过

```
✅ manual-test 完成：G4 已签，验收通过。[有 feedback / 无 feedback]
→ 下一步：deploy 和 wrap-up-iteration 可并行启动
```

---

## 上下文管理

**断点续做**（会话中断后重新开启）：
1. 读 `iterations/vN/gates.md`：G4 已签 → 任务完成
2. 读 `_meta/sessions/manual-test-progress.md`：确认本轮已派修复任务清单和当前状态
3. 读 `queue/`：找 source=manual-test 的任务包，核实各自状态
4. 读 `iterations/vN/acceptance-report.md`：确认已记录的问题列表
5. 从上次停在的节点继续

`_meta/sessions/manual-test-progress.md` 内容结构：
```markdown
## manual-test 进度 · vN

### 本轮派发任务（上次复测通知后新增）
- {task-id}：{问题描述}（状态：[可取] / [taken-by] / [merged]）

### 历史轮次（已复测确认）
- 第 1 轮：{task-id 列表} → 已复测通过

### 当前状态
{等待用户首次反馈 / 等待修复合并 / 等待用户复测 / 验收通过待签 G4}
```
