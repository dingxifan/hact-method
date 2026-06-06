# findings · 代码质量流水线重设计 · 2026-06-06

## 背景与起点

触发点：Boris Cherny 的 Dynamic Workflows 文章（agent/parallel/pipeline API）引发讨论。
用户痛点：代码质量不如预期 + 联调阶段过重（一套流程至少跑一天）。

分析路径：全量读取 develop / pr-review / generate-integration-tests / manual-test / pre-integration-check 五份规范，诊断质量检查链，发现三个结构性问题：

1. **checklist 双跑**：develop Step 5 和 pr-review Step 4 各跑一次，两次都不独立
2. **pr-review mandate 中立**："对照 standards 给出反馈"，AI 默认理解而非质疑
3. **无对抗性独立审查**：从 develop 到 G4 全程没有一个独立视角

---

## 决策与设计原则

### 对抗审查的上下文隔离
sub-agent 只传 AC + diff，禁止传实现思路、拆分计划、自检结论。
条件性例外：diff 含 api/*.ts 或 controller/DTO 时，额外传 TRD 相关接口段（规范文档不算"实现意图"）。

### 直修条件统一（三处一致）
允许：null 防护、缺失字段补全、类型修复、配置笔误、错误拦截格式、接口字段对齐。
不允许：条件判断逻辑、数据处理算法、权限规则、接口行为。

### 脚本生成前移
联调脚本的重量在"写"不在"跑"。TRD 确认后立即生成（draft-tech-design subagent），联调会话只做对齐 + 执行。

### generate-integration-tests 的真实定位
不是质量门，是**劳动力替代**——自动化"发现→报告→派活→复测"链条，替代人工测试员的沟通协调角色。

---

## 变更清单

### develop.md
- Step 5：删除 checklist 核查，保留机械验证（build/lint/type）
- **Step 5.5 新增**：对抗审查 loop
  - 传入：AC + diff（+ 条件性 TRD 接口段）
  - mandate：6 类检查（AC覆盖 / 边界情况 / 错误处理 / 安全性 / 逻辑正确性 / 接口契约对齐）
  - 接口契约对齐：仅当 diff 含 api/*.ts 或 controller/DTO 时触发
  - loop：findings:[] 退出；[建议] 写 backlog.md（[CR-建议]）；[阻断] 修复重跑；同一阻断 3 次 → 上报
- 批量会话表：新增"批量 Step 5.5 对抗审查"行

### pr-review.md
- header：改为"核查 PR description 完整性、对照 standards 给出反馈"
- 删除 Step 4（过 checklist）
- 安全敏感升级规则从 Step 4 迁入 Step 3
- Step 2 表格："两份 checklist 都用" → "两份 standards 都用"
- 步骤重编号：原 Step 5-8 → Step 4-7；内部引用同步修正

### draft-tech-design.md
- Step 6（G2 签完后）新增 subagent 调用：
  - 传入：TRD 接口段 + 测试环境约定 + PRD AC + ux-flows.md（若存在）
  - 产出：`integration-tests/backend/*.http` + `integration-tests/frontend/*.pinchtab` + `integration-tests/scripts-vN.md`
  - 自行 commit + push；失败记录到 progress.md，不阻断当前会话

### generate-integration-tests.md（完整重写）
- 旧结构：场景设计 → 写脚本 → 跑测试 → 处理失败 → 复测 → 收尾
- **新结构**：脚本就绪核查 → 跑测试 → 处理失败 → 复测 → 收尾
- 删除 Step 2（设计测试场景）
- 删除 Step 3（写测试脚本）
- 新增 Step 2（脚本对齐核查）：读 PR 偏离说明，定向校准脚本，不重写
- 上下文密度：高 → 中（不再全量加载 PRD/TRD）
- 会话启动：Explore subagent 读 PRD/TRD 段落 → 改为读 scripts-vN.md 索引
- Subagent 表：移除 pinchtab 行（已移至 draft-tech-design）

### /pic skill 全面删除
| Phase | 处理方式 |
|-------|---------|
| Phase 1 机械验证 | develop Step 5 已覆盖，删除 |
| Phase 2 checklist | 与已删除 checklist 的决策矛盾，删除 |
| Phase 3 接口契约对齐（前端 api 层） | 合并进 develop Step 5.5 第 6 类检查 |
| Phase 4 全量 AI review | 可直接调 `superpowers:requesting-code-review`，无需包装，删除 |

清理范围：`skills/pre-integration-check/`（目录）、`templates/.claude/commands/pic.md`、`generate-integration-tests.md` /pic 引用、`init-project.md` pic 创建步骤、`templates/CLAUDE.md` 工具表 pic 行、`guide/01-启动新项目.md` 目录结构 pic 行。

---

## 新质量流水线全貌

```
develop Step 5      机械验证（build/lint/type，单任务）
develop Step 5.5    对抗审查 loop（AC + diff + 条件性 TRD，独立 sub-agent，6 类）
                    ↓ findings:[] 才推 PR
pr-review Step 3    standards 合规 + 安全升级
pr-review Step 5    合并 / 打回

draft-tech-design Step 6（G2 后）
                    subagent 预生成集成测试脚本

generate-integration-tests Step 2   脚本对齐核查（按 PR 偏离说明校准）
generate-integration-tests Step 3   跑测试（后端 curl subagent + 前端 pinchtab）
generate-integration-tests Step 4   处理失败（直修 or 派 queue 任务）
generate-integration-tests Step 5   复测
```
