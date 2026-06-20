# exec: pr-review

> CC 加载本文时，当前任务是批量审查若干 develop PR：核查 PR description 完整性、对照 standards 给出反馈，决定通过或打回。
> 每个 PR 独立决定——有打回不阻塞其他可通过的 PR。

**上下文密度**：中。逐 PR 精确加载，只读改动文件相关的 standards 章节，不全量加载。

**结构说明**：本规范分两层。
- **外壳（程序式）**：会话启动 / 输出契约（merge + commit）/ 整批收尾 / 上下文管理——涉及副作用、人工确认门、多方协调，顺序和动作不可省略
- **内核（声明式）**：完成判据 / 通过条件 / 打回条件 / 升级条件 / 评估方法——AI 自主评估直到判据满足，路径可自适应

---

## 红线

- **不跳过有 `[阻断]` 问题的 PR**：无论其他 PR 如何，有 `[阻断]` 的必须打回，不得因"问题不大"而放行
- **发现凭据立即处理**：代码或 PR description 中出现凭据，不等 review 结束——立即要求撤销 + 清理 commit history，合并前必须解决
- **反馈必须书面化**：不口头转达，review comment 必须写进 PR，develop 执行人以 PR comment 为准
- **不替 develop 执行人写修复代码**：给问题描述和方向，不直接提交修复（快速通道直修除外，见下方）

---

## 会话启动 〔外壳〕

**批量时机**：优先等同一 sprint 的同层（frontend / backend）全部任务推 PR 后批量审查，减少 review 会话碎片。单任务紧急（urgency=hotfix）时可单独审查。

> **串行依赖链例外**：批量等待仅适用于互不依赖的**并行独立任务**。若同层存在串行依赖链（A 是 B 的 `depends_on`），A 的 PR 必须单独 review 并合并到 master 后 B 才可拾取（`develop.md` 末端 commit 分支规则已在执行层强制此顺序）——不等 B 推 PR 后再批量，应立即对 A 开启 review。

读任务包，确认 `pr-links` 字段。

按 PR 改动文件路径推断总体 layer（`frontend` / `backend` / 混合 / `null`），精确加载对应 standards 章节——不全量加载，只读与本批 PR **直接相关**的部分：
- `layer` 含 `backend` → 项目根 `standards-backend.md` + `standards-shared.md` 相关章节
- `layer` 含 `frontend` → 项目根 `standards-frontend.md` + `standards-shared.md` 相关章节；**额外加载项目根 `design.md` 全文**（视觉保真基准，对全部 frontend PR）；`iterations/vN/prototype.html` 对应交互路径（**仅当被审 PR 对应 develop task `source=sprint` 时加载**，作交互保真基准——联调/人工/B 类派生的修复 PR 原型已可能旧，不加载）
- `layer=null` → 跳过 standards

```
本次待审 PR：
1. {PR 链接} — {PR 标题}
2. ...
共 {N} 个。继续？
```

🚫 等用户确认

---

## 完成判据 〔内核〕

**单个 PR 审查完成** = 以下全部满足：
- 已作出通过或打回决定
- PR comment 已写入（含分级发现 + 最终决定）
- 通过时：已调平台 merge API 实际合并 PR
- status.yml / sprint.md / backlog.md 已更新并 commit

**整批审查完成** = 所有 PR 有明确决定，sprint.md + status.yml 已收尾，feedback 检查已做。

---

## 通过条件 〔内核〕

PR 通过 = 以下全部满足：

1. **description 完整**：task-id / 改动摘要 / AC 验证 / 偏离说明 / 遗留问题 五段齐全，内容有实质性内容（不是空占位）；AC 验证段需逐条列出每条 AC、附验证方式、使用 `[x]` 格式——笼统一句话不满足
2. **偏离 / 遗留已正确处理**：偏离不为"无"时，超出 `files` 清单的文件已纳入审查；遗留不为"无"时，已写入 `backlog.md`
3. **无 standards [阻断] 违反**：对照改动文件相关 standards 章节，无 [阻断] 级别违反（[建议] 不阻断合并）
4. **设计保真（layer 含 frontend）**：
   - **视觉（全部 frontend PR）**：对照 `design.md`，字号/行高/字重、颜色/间距/圆角、控件尺寸用对应 SCSS 变量、与规格无冲突——自造字号或规格已有变量却硬编码为 [阻断]，细微偏差为 [建议]；design.md 不存在则不适用
   - **交互（仅 `source=sprint` 的 PR）**：若存在 `prototype.html`，本 PR 覆盖功能的交互路径与原型一致、无遗漏分支——明显冲突或遗漏交互分支为 [阻断]。被审 PR 对应 task 的 `source≠sprint`（联调/人工/B 类派生修复，原型已可能旧）或 prototype.html 不存在则交互部分不适用
5. **测试保真（layer 含 backend）〔路1 兜残〕**：不可视区 AC 的测试存在、**忠实编码 AC**（测试的 Given/When/Then 与任务包 AC 例子一致，不是测了别的或空跑）、`npm run test` 全绿；测试品类（鉴权/边界/错误路径/契约/数据并发/安全注入·穿越）无缺类。测试缺失 / 不忠实 AC / 红 / 缺品类为 [阻断]。这是保真路 2（测试脊柱：PRD 行为例子 + TRD 技术精化让测试近 1:1）收不干净时的人工兜底

---

## 打回条件 〔内核〕

满足以下任一即打回：
- description 任意段落缺失或为空占位
- 遗留问题不为"无"但未写入 backlog.md
- 存在任意 [阻断] standards 违反
- frontend PR 实现与 `design.md` 视觉规格明显冲突（自造字号 / 规格已有变量却硬编码字面值）
- `source=sprint` 的 frontend PR 遗漏 `prototype.html` 中的交互路径分支，或与之明显不符（`source≠sprint` 不适用此条）
- backend PR 不可视区 AC 无对应测试 / 测试不忠实 AC（测了别的或空跑）/ 测试红 / 缺测试品类

---

## 升级条件（停止，等人介入）〔外壳/内核边界〕

- **安全敏感改动**（权限 / 认证 / 数据隔离相关）且 reviewer 无 `architecture` discipline → 上报，等有 `architecture` discipline 的人介入后再决定，不单独放行
- **同一 [阻断] 反复打回 3 次**仍未解决 → 上报；判断根因是否在 TRD/standards 层，若是则创建 `revise-doc` 任务，再决定如何继续

---

## 输出契约 〔外壳〕

每个 PR 审查完成后必须输出：

**0. 通过时：调平台 merge API 合并 PR**

写完 PR comment 后：

🚫 等用户确认决定（通过 / 打回）再执行

通过 → 调平台 merge API 实际合并 PR；打回 → 在 PR comment 中列出全部 [阻断] 问题（已在 comment 写好），不合并。

**1. PR comment**
```markdown
## pr-review · {task-id}

### [阻断]（必须修复才能合并）
- {问题描述}（`{文件路径}` L{行号}）

### [建议]（可接受，建议下期处理）
- {问题描述}

### 决定：通过 ✅ / 打回 ❌
```
无 [阻断] 时省略该段；无 [建议] 时省略该段。

**2. status.yml 更新**（字段见 `../hact-method/skeleton/07-status-contract.md`）
- task 状态：通过 → `merged`；打回 → `可取`
- code_reviews[] 追加一条：
```yaml
- iteration: {被审任务所属迭代版本，如 v2；review 发生在 v3 审 v2 遗留任务时填 v2}
  task_id: {task-id}
  conclusion: 通过 / 需修订
  comment: {综合评语 或 null}
  issues:
    - { severity: 严重/一般/建议, description: {描述}, location: {文件:行号 或 null} }
```
severity 映射：[阻断] → 严重，酌情 → 一般，[建议] → 建议；无发现则 `issues: []`。

**3. sprint.md 追加**：`CR:通过` 或 `CR:打回（{原因一句话}）`

**4. backlog.md 条目**（有 [建议] 时）：`- [ ] {日期} | [CR-建议] {描述} | {文件路径} | 待联调阶段处理`

**commit 时机**：以上 2–4 项文档改动在 PR 合并后一并 commit（`git add status.yml sprint.md backlog.md && git commit -m "chore(cr): {task-id} review 收尾"`），不分散提交。

---

## 评估方法 〔内核〕

**第一步：description 完整性核查（强制 early-exit）**

任意段落缺失或为空占位 → 立即标 [阻断]，跳过 standards 核查，直接打回；不浪费精力对 standards 做无效审查。

**第二步：确定 layer**（按改动文件路径判断）

| 改动文件特征 | layer |
|---|---|
| 仅 `.vue` / `.tsx` / `.css` / `components/` / `pages/` 等 | `frontend` |
| 仅 `controller` / `service` / `module` / `entity` / `.dto.ts` 等 | `backend` |
| 前后端文件混合 | `[frontend, backend]`，两份 standards 都用 |
| 仅配置 / 文档文件 | `null` |

**第三步：standards 核查**（不全量加载，只读与本 PR 改动模块直接相关的章节）

记录每条违反或有疑问（存疑但未必违反）的条目，标注文件路径和行号，区分 [阻断] / [建议]。

**第四步：设计保真核查（layer 含 frontend 时）**

- **视觉**：抽查 diff 中的样式改动，比对 `design.md` 的字号/行高/字重、颜色/间距/圆角/阴影、控件尺寸——用字面值而非 SCSS 变量（且规格已定义对应变量）、或数值与规格不符 → 记 [阻断]；不影响规格一致性的细微偏差 → 记 [建议]
- **交互（仅 `source=sprint` PR）**：先看被审 PR 对应 develop task 的 `source` 字段——非 `sprint`（联调/人工/B 类派生的修复，原型已可能旧）则跳过交互核查；`source=sprint` 时若 `prototype.html` 存在，比对本 PR 覆盖功能的交互路径——遗漏原型中的分支（取消 / 失败 / 空态等）、入口缺失或路径与原型不符 → 记 [阻断]
- `design.md` 不存在 → 跳过视觉核查；`prototype.html` 不存在或 source≠sprint → 跳过交互核查

**第五步：测试保真核查（layer 含 backend）〔路1 兜残〕**

- 对照任务包 `acceptance-criteria` 的不可视区 AC（Given/When/Then 例子），抽查 diff 中的测试：每条 AC 有对应测试吗？测试的输入/期望与 AC 例子一致吗（不是测了无关分支或断言永真的空跑）？→ 缺失 / 不忠实记 [阻断]
- 测试品类（鉴权/边界/错误路径/契约/数据并发/安全注入·穿越）有无明显缺类 → 缺类记 [阻断]
- 确认 PR 声称的测试确实跑绿（description / CI 输出）；无法确认时要求补证据
- 纯 frontend PR 或 layer=null → 跳过本步

**后续顺序（非强制）**：写 comment → 🚫 等确认 → 执行决定。

**快速通道（直修）**：同时满足以下全部时，可跳过打回流程直接修复：
- 无业务逻辑改动（允许：null 防护、缺失字段补全、类型修复、配置笔误、错误拦截格式、接口字段对齐、硬编码字面值替换为 design.md 既有 SCSS 变量；不允许：条件判断逻辑、数据处理算法、权限规则、接口行为、交互路径改动）
- 原因显而易见，无需上下文讨论

直修步骤：
1. 修改代码
2. 提交前自检（有报错必须修复，不得跳过）
```bash
# 后端有改动时
cd backend && npm run build 2>&1 | tail -5
npx tsc --noEmit 2>&1 | head -10

# 前端有改动时
cd frontend && npm run build 2>&1 | tail -5
npx vue-tsc --noEmit 2>&1 | head -10
```
3. 提交并合并
```bash
git checkout -b fix/cr-{task-id}-{desc}
git add {改动文件}
git commit -m "fix(cr): {描述}"
git push origin fix/cr-{task-id}-{desc}
git checkout master && git merge fix/cr-{task-id}-{desc} && git push origin master
git branch -d fix/cr-{task-id}-{desc}
```
PR comment 注明「已直修」；无需重新 review，直接 merge。

---

## 整批收尾 〔外壳〕

所有 PR 决定完成后：

**feedback 检查**：
- 同一类问题在多个 PR 中反复出现 → standards 有缺口，写入 `feedback.md`（格式：`{日期} | {问题模式} | 建议更新到 {standards 文件哪节}`）
- PR description 缺失段落是共性 → 写入 feedback.md，建议在 develop exec spec 中加强提示
- 无发现 → 跳过

```
✅ pr-review 完成：{N} 个 PR，通过 {X} 个，打回 {Y} 个。[有 feedback / 无 feedback]
→ 下一步：等待打回 PR 修复后重新提交 / 进入 generate-integration-tests（若全部通过）
```

---

## 上下文管理 〔外壳〕

**断点续做**（多 PR 中断后接续）：
1. 读 `iterations/vN/sprint.md`，找已有 `CR:通过` 或 `CR:打回` 结论的行（已审完）
2. 从第一个**无 CR 结论**的 PR 继续，不重审已决定的

**多 PR 上下文过重时**（PR 数量 ≥5 或单 PR diff 很大）：
- 每完成 3 个 PR 后考虑一次 compact
- compact 前确认：已审 PR 的 CR 结论已写入 sprint.md（写入即持久化，compact 不丢失进度）

**多 PR 并行审查**（PR 数量 ≥5 且各 PR layer 独立时）：
- 可派 2 个 Explore subagent 并行读取不同 PR 的 diff + description，各自返回「五段完整性结论 + 改动文件列表 + 疑点摘要」
- 主线汇总后逐 PR 完成 standards 核查和决策（不委托 subagent）
- subagent 失败 → 主线直接读该 PR，不阻断其他 PR 的审查

**打回 PR 二次 review**（同一 PR 修复后重新提交）：
1. 读上次 PR comment 中的 `[阻断]` 清单
2. 只核查 `[阻断]` 是否已修复 + 有无新引入问题
3. 不重跑完整流程

---

## CR 发现根因在文档层时

**`[阻断]` 问题根因在 TRD 或 standards 层**（不是实现问题）：
1. 打回 PR，comment 中说明「根因在文档层，等 revise-doc 完成后重新实现」
2. 同时创建 `revise-doc(target=trd/standards)` 任务包，写入 `iterations/vN/queue/`
3. develop task 保持 [可取] 状态，等 revise-doc 完成后再拾取
