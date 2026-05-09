# {项目名}

## 项目说明
{一句话描述项目用途}

## 规范加载
本仓使用 hact-method 的执行规范，按当前任务类型引用对应文件：

### A 类主线
- `init-project`              → `@../../hact-method/specs-execution/init-project.md`
- `draft-prd-vN`              → `@../../hact-method/specs-execution/draft-prd-vN.md`
- `draft-tech-design`         → `@../../hact-method/specs-execution/draft-tech-design.md`
- `plan-sprint`               → `@../../hact-method/specs-execution/plan-sprint.md`
- `develop`                   → `@../../hact-method/specs-execution/develop.md`
- `code-review`               → `@../../hact-method/specs-execution/code-review.md`
- `generate-integration-tests`→ `@../../hact-method/specs-execution/generate-integration-tests.md`
- `manual-test`               → `@../../hact-method/specs-execution/manual-test.md`
- `deploy`                    → `@../../hact-method/specs-execution/deploy.md`
- `wrap-up-iteration`         → `@../../hact-method/specs-execution/wrap-up-iteration.md`

### B 类 / 辅助
- `dispatch-new`              → `@../../hact-method/specs-execution/dispatch-new.md`
- `revise-doc`                → `@../../hact-method/specs-execution/revise-doc.md`

## 个人工具（人工触发，不在主线流程）

| 工具 | 调用方式 | 说明 |
|------|---------|------|
| 联调前全面检查 | `/pic` | 四阶段检查：机械验证 → 逐层 checklist → 接口契约对齐 → AI review |
| Gitee 仓库操作 | `/gitee-ops` | 远端为 Gitee 时，创建 PR / 合并 PR / 查询分支，**禁止使用 gh CLI** |
| 浏览器自动化 | `/pinchtab` | 前端场景测试：打开页面、点击操作、填表、截图、导出 PDF；联调阶段 generate-integration-tests 前端脚本使用 |

## 跨会话接续规则
每次打开本仓时，按顺序执行：

**Step 0：代码同步（强制执行，不可跳过）**

对项目仓和 hact-method 各执行一遍 `git pull`：

```bash
# 项目仓
git pull

# hact-method
cd ../../hact-method && git pull && cd -
```

完成后，**必须**向人类输出以下声明（格式固定，不可省略）：

```
📋 会话启动·代码同步
- 项目仓（{当前分支}）：{已拉取 N 个 commit / 已是最新 / ⚠️ 有冲突——停止，请人工处理}
- hact-method（master）：{已拉取 N 个 commit / 已是最新}
同步完成，进入 Step 1。
```

⚠️ 任意仓出现冲突或 diverged → 停止，不得进入 Step 1，等待人类解决后重新执行 Step 0。

两个仓均同步完才进入 Step 1。

**Step 1：读取项目当前状态，推断当前任务类型**
1. 读取 `project.md` 了解当前产品与技术状态
2. 读取最新迭代目录下的 `gates.md` 确认 Gate 签署状态
3. 读取 `queue/` 目录下所有任务文件，统计各 `status` 分布（todo / in-progress / done / merged）
4. 按下表推断当前任务类型并**明确声明**：

| queue/ 任务状态 | Gate 状态 | 推断任务类型 |
|----------------|-----------|-------------|
| 有任意 `in-progress` | — | `develop` — 继续未完成任务包 |
| 全部 `done`，G3 已签，G4 未签 | G4 未签 | `code-review` 或 `generate-integration-tests`（视是否有 PR 流程） |
| 全部 `merged`，G4 未签 | G4 未签 | `generate-integration-tests` |
| 全部 `merged`，联调报告已存在，G4 未签 | G4 未签 | `manual-test` |
| G4 已签，G5 未签 | G5 未签 | `wrap-up-iteration` |
| G5 已签 | — | 本迭代完结，等待下一指令 |

5. 加载对应规范，输出当前状态摘要：Gate 进度 + 任务状态分布 + 推断的下一步动作
