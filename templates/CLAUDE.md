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

## 跨会话接续规则
每次打开本仓时：
1. 读取 `project.md` 了解当前产品与技术状态
2. 读取 `iterations/` 最新迭代目录下的 `gates.md` 确认当前 Gate 状态
3. 根据当前任务类型加载对应规范后开始工作
