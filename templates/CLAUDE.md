# {项目名}

## 项目说明
{一句话描述项目用途}

## 规范加载
本仓使用 hact-method 的执行规范，按当前任务类型引用对应文件：

### A 类主线
- `init-project`              → `@../hact-method/specs-execution/init-project.md`
- `draft-prd-vN`              → `@../hact-method/specs-execution/draft-prd-vN.md`
- `draft-tech-design`         → `@../hact-method/specs-execution/draft-tech-design.md`
- `plan-sprint`               → `@../hact-method/specs-execution/plan-sprint.md`
- `develop`                   → `@../hact-method/specs-execution/develop.md`
- `code-review`               → `@../hact-method/specs-execution/code-review.md`
- `generate-integration-tests`→ `@../hact-method/specs-execution/generate-integration-tests.md`
- `manual-test`               → `@../hact-method/specs-execution/manual-test.md`
- `deploy`                    → `@../hact-method/specs-execution/deploy.md`
- `wrap-up-iteration`         → `@../hact-method/specs-execution/wrap-up-iteration.md`

### B 类 / 辅助
- `dispatch-new`              → `@../hact-method/specs-execution/dispatch-new.md`
- `revise-doc`                → `@../hact-method/specs-execution/revise-doc.md`

## 个人工具（人工触发，不在主线流程）

| 工具 | 调用方式 | 说明 |
|------|---------|------|
| 联调前全面检查 | `/pic` | 四阶段检查：机械验证 → 逐层 checklist → 接口契约对齐 → AI review |
| Gitee 仓库操作 | `/gitee-ops` | 远端为 Gitee 时，创建 PR / 合并 PR / 查询分支，**禁止使用 gh CLI** |
| 浏览器自动化 | `/pinchtab` | 前端场景测试：打开页面、点击操作、填表、截图、导出 PDF；联调阶段 generate-integration-tests 前端脚本使用 |

## 跨会话接续规则
每次打开本仓时，按顺序执行：

**Step 0：代码同步（强制执行，不可跳过）**

对项目仓、hact-method、个人 notes 仓各执行一遍同步：

```bash
# 项目仓
git fetch origin && (git pull 2>/dev/null || echo "当前分支无远端跟踪，已 fetch 同步")

# hact-method
git -C "../hact-method" fetch origin && (git -C "../hact-method" pull 2>/dev/null || echo "当前分支无远端跟踪，已 fetch 同步")

# 个人 notes 仓（约定路径 ../hact-notes-{你的用户名}；不存在则跳过，不阻断）
git -C "../hact-notes-{username}" fetch origin && (git -C "../hact-notes-{username}" pull 2>/dev/null || echo "notes 仓无远端跟踪，已 fetch") \
  || echo "未检测到个人 notes 仓，如需积累请先创建并登记（见 init-project Step 4.5）"
```

完成后，**必须**向人类输出以下声明（格式固定，不可省略）：

```
📋 会话启动·代码同步
- 项目仓（{当前分支}）：{已拉取 N 个 commit / 已是最新 / ⚠️ 有冲突——停止，请人工处理}
- hact-method（master）：{已拉取 N 个 commit / 已是最新}
- 个人 notes（hact-notes-{username}）：{已拉取 N 个 commit / 已是最新 / 未配置}
同步完成，进入 Step 1。
```

⚠️ **项目仓或 hact-method** 出现冲突或 diverged → 停止，不得进入 Step 1，等待人类解决后重新执行 Step 0。个人 notes 仓冲突不阻断（私有，提示后可继续）。

项目仓与 hact-method 同步完即可进入 Step 1（个人 notes 仓未配置不阻断）。

**Step 1：读取项目当前状态，推断当前任务类型**
1. 读取 `project.md` 了解当前产品与技术状态
2. 读取最新迭代目录下的 `gates.md` 确认 Gate 签署状态
3. 读取 `iterations/vN/sprint.md`，从**状态列**和 **PR 列**得出各任务进度（一次读取即可得全貌，无需逐个读 queue 文件）
4. 按下表推断当前任务类型并**明确声明**：

| sprint.md 状态分布 | PR 列 | Gate 状态 | 推断任务类型 |
|-------------------|-------|-----------|-------------|
| 有 `[可取]` | — | G3 已签，G4 未签 | `develop` — 列出可认领任务，等待用户拾取 |
| 有任意 `[taken-by]` | — | — | `develop` — 继续未完成任务包 |
| 全部 `[done]`，PR 列有 `—` | 部分未填 | G3 已签，G4 未签 | `develop` — 仍有任务尚未提 PR |
| 全部 `[done]`，PR 列全部已填 | 全为 `#N` | G3 已签，G4 未签 | `code-review` — 输出任务↔PR 对照表 |
| 全部 `[merged]` | — | G4 未签 | `generate-integration-tests` |
| 全部 `[merged]`，联调报告已存在 | — | G4 未签 | `manual-test` |
| G4 已签，G5 未签 | — | G5 未签 | `wrap-up-iteration` |
| G5 已签 | — | — | 本迭代完结，等待下一指令 |

🚫 **禁止给用户贴角色标签**（如"作为前端程序员"）——执行层（frontend/backend）由 develop spec 第零步在会话内确认，不在启动阶段推断。

5. 加载对应规范，输出当前状态摘要：Gate 进度 + 任务状态分布 + 推断的下一步动作
6. 若 Step 1 结束时处于等待状态（迭代完结、无 gates.md 等），收到用户任务指令后，**必须先加载对应 exec spec，再执行，不得跳过**。
