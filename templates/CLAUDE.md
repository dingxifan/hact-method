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

## 跨会话接续规则
每次打开本仓时，按顺序执行：

**Step 0：确认 hact-method 是最新版本**
```bash
cd E:\group-code\hact-method && git fetch && git status
```
- 显示「Your branch is behind」→ 执行 `git pull`，拉取最新规范后再继续
- 已是最新 → 直接继续

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
