# progress · 代码质量流水线重设计 · 2026-06-06

## 第一次会话已完成（2026-06-06）

见 findings.md（变更清单 + 设计原则）。
所有改动均已写入文件，未提交 git。

---

## 第二次会话已完成（2026-06-06）

### 缺口 2：generate-integration-tests 并行扇出 ✅

- **generate-integration-tests.md Step 3**：从"逐条执行"改为"按模块并行派 subagent，每模块端到端执行后端 curl + 前端 pinchtab"；结果表新增模块列
- **generate-integration-tests.md Subagent 表**：Step 3 条目改为"每模块一个 subagent"
- **draft-tech-design.md**：scripts-vN.md 格式改为按 `## {模块名}` 分段，模块划分与 TRD 接口分组一致（供 Step 3 解析模块列表）

### 战略探索：程序式 → 声明式 ✅（pr-review 示范改写）

完整走了一遍声明式重构实验，核心结论：

**两层模型**：exec spec 应分外壳（程序式：副作用、人工确认门、commit）和内核（声明式：完成判据、通过/打回条件、评估方法）。

**声明式的系统性陷阱**（改写时必查）：
1. 副作用天然消失（merge/commit 动作会被遗漏）
2. 强制短路降级为建议（early-exit 的中止语义消失）
3. 方法精度被吞掉（"逐条 [x] 格式"降为"非空"）

**pr-review.md 改写结果**：经两轮修复（layer 映射表、合并动作、short-circuit、AC 格式、severity 三级、iteration 归属、commit 时机），最终标注了 〔外壳〕/〔内核〕 章节标记。

**适用范围判断**：
- 内层循环任务（纯评估/修复 loop）→ 声明式最干净
- 协调层（PRD/Gate）→ 程序式，不改
- 混合任务（pr-review/develop）→ 两层模型

**不做 skill，改做 instinct**：写入 `~/.claude/homunculus/instincts/personal/exec-spec-two-layer-model.yaml`，confidence 0.6，待更多规范验证后提升。

---

## 下次会话起点

**缺口 1：B 类 loop 化**（未动手）

目标：发现 bug → loop { AI修 → AI跑测试 → 全过? → 结束 } → 人只看结果

需要读的文件：
- `specs-execution/develop.md`（B 类 develop 会期部分）
- `specs-structural/` 中 B 类相关契约

设计问题：
- loop 的停止条件是什么？（测试全过 + build 无报错）
- 升级给人的条件是什么？（同一 bug 修复超 N 轮 / 根因在 TRD 设计）
- B 类 exec spec 改哪部分？是在现有 develop.md 加 B 类 loop 段，还是拆成独立文件？

**缺口 3：harvest-notes pipeline 化**（未动手）

**git commit**：本轮所有改动（develop/pr-review/draft-tech-design/generate-integration-tests/init-project/guide/templates 等）仍未提交，下次会话前或会话中提交。
