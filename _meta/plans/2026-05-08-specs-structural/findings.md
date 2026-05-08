# 材料整理 · 可复用资产清单

## 来源一：E:\group-code\human-ai-col（v1 方法论仓）

### 高价值材料

| 文件 | 覆盖 task type | 关键内容 |
|------|---|---|
| `roles/product-manager.md` | draft-prd-vN | 6步流程 + PRD 输出结构（7段）+ Gate 1 条件 |
| `roles/architect.md` | draft-tech-design | 4步流程 + TRD 完整结构 + 禁止假设规则 |
| `roles/devmgr.md` | plan-sprint, dispatch-new, code-review | Sprint 启动6步 + 派发循环 + 联调规范 + 验收规范 |
| `roles/developer-frontend.md` / `developer-backend.md` | develop | 7步开发流程 + 复用检查 + 视觉决策暂停 |
| `roles/tech-director.md` | wrap-up-iteration, init-project | Gate 5三步（偏离对账/feedback分流/project.md合并）+ 初始化脚本 |
| `templates/task-package/feature-task.md` / `bug-task.md` | dispatch-new | 任务包结构 + 凭据红线 |
| `templates/standards/backend.md` / `frontend.md` | plan-sprint | 规范模板内容 |
| `docs/git-workflow-complete.md` | 全部 | 各 Gate 完整操作流程（可作为各 spec 的"历史参考"） |
| `projects/login-demo/` | init-project, plan-sprint | sprint.md 格式范例 + iteration_vN.md 格式 |

### 空白点
- `checklist/backend-checklist.md` / `responsive-checklist.md`：框架存在但**内容为空**
- 无独立 TRD / PRD 模板文件
- 无 `standards-shared.md` 模板

---

## 来源二：E:\aicoder（CC 开发工作区，v1 实践最新版）

### 高价值材料

| 文件 | 覆盖 task type | 关键内容 |
|------|---|---|
| `roles/product.md` | draft-prd-vN | 与 human-ai-col 同源但更精练；场景还原 + 三角筛的具体提示 |
| `roles/tech.md` | draft-tech-design | 疑点清单机制 + TRD 输出结构 + 知识沉淀步骤 |
| `roles/devmgr.md` | plan-sprint, dispatch-new | **最详细版本**：并行生成 standards + sprint；dispatch 七字段全谱 |
| `roles/developer.md` | develop, code-review | **五大协议**：开发启动/任务启动/模块完成自检/会话结束/上下文重置 |
| `skills/dispatch.md` | dispatch-new | dispatch 12字段协议 + 质量自检规则 + pending/done 文件格式 |
| `skills/backend-checklist.md` | code-review, develop | **已填充**：DB Schema/API错误码/权限校验/并发安全/静默失败 |
| `skills/responsive-checklist.md` | code-review, develop | **已填充**：断点适配/触控尺寸/事件兼容 |
| `projects/JHH-Nortion/reusables.md` | init-project, plan-sprint | reusables.md 初始模板（两表结构） |
| `projects/hact/v1-gate5-collation.md` | wrap-up-iteration | Gate 5 feedback 分流实例（25条分流过程，8个目的地） |
| `plans/2026-05-03-devmgr-workflow-redesign/spec.md` | plan-sprint | devmgr 角色设计文档（最详细的 Sprint 启动流程文档） |

### 与 v2 的结构差异（需适配）

| aicoder v1 | hact-method v2 | 说明 |
|---|---|---|
| 4工作区（product/tech/devmgr/developer） | 3工作心态（项目根/dispatch/父级） | 工作区概念不同，但工作内容可复用 |
| Gate 2.5（开发包就绪） | Gate 3（plan-sprint 签字） | 关卡编号不同，内容一致 |
| `pending-{layer}.md` 文件式 dispatch | dispatch 工作区（文件式/web式） | 实现形态不同，协议可复用 |
| discipline 未定义（角色驱动） | 9 discipline（任务驱动） | v2 去掉了角色概念，用 discipline 替代 |

---

## 结论：12 个 task type 的材料充裕度

| task type | 材料充裕度 | 最佳来源 |
|---|---|---|
| `develop` | ★★★★★ | aicoder/roles/developer.md 五大协议 |
| `dispatch-new` | ★★★★★ | aicoder/skills/dispatch.md 12字段协议 |
| `plan-sprint` | ★★★★★ | aicoder/roles/devmgr.md + devmgr-workflow-redesign/spec.md |
| `code-review` | ★★★★☆ | aicoder/skills/backend-checklist + responsive-checklist |
| `draft-prd-vN` | ★★★★☆ | aicoder/roles/product.md + JHH-Nortion/prd_v1.md |
| `draft-tech-design` | ★★★★☆ | aicoder/roles/tech.md + JHH-Nortion/trd_v1.md |
| `wrap-up-iteration` | ★★★★☆ | human-ai-col/tech-director.md + aicoder/v1-gate5-collation.md |
| `init-project` | ★★★★☆ | 两者的初始化脚本 + aicoder CLAUDE.md |
| `generate-integration-tests` | ★★★☆☆ | aicoder/roles/devmgr.md §联调阶段 |
| `manual-test` | ★★★☆☆ | aicoder/roles/devmgr.md §人工验收阶段 |
| `deploy` | ★★★☆☆ | aicoder/skills/deploy-to-server（框架）+ devmgr §部署 |
| `revise-doc` | ★★★☆☆ | 散落在各角色收尾步骤中，需整合 |
