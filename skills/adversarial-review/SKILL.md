---
name: adversarial-review
description: B 类已有手动 diff 的兼容证据审查。先核 freshness preflight，再复用 develop-review 的 full/targeted report 与 finding 路由；新 B 任务默认走 develop。
---

# Independent Evidence Review Skill

## 定位与触发

- 新 B 任务**不从本 skill 开始**：加载 `specs-execution/develop.md`，按 `source=bug/optimization` 走完整 develop。
- 仅用户明确要求接管已有手动 diff 时，在 **git commit 之前**调用本兼容入口。
- diff 涉及代码文件（非纯状态文件），且改动 ≥ 15 行
- **跳过条件**（满足任意一条则不调用）：
  - 所有改动仅限 `b-queue/`、`status.yml`、`b-tasks.md`、`backlog.md`
  - `git diff --stat` 总行数 < 15
  - commit message 明确含 `chore` / `dispatch` / `状态`（纯管理提交）

## 步骤

### Step 0：freshness preflight 记录（独审前硬前置）

权威检查表只引用 `../hact-method-lab/specs-execution/develop.md` 的「freshness preflight」，不在本 skill 复制第二份。记录写入 `b-reviews/{task-id}/preflight.md`，格式见 `templates/review-briefs/develop-preflight-record.md`。

- **尚未改代码**：先完成 preflight，记录 `timing: before-code`、当前 `base_ref` 与 `base_tree`，结果为 `pass/revised` 后才可实现。
- **已有 diff 但无记录**：必须标 `timing: retroactive` 并补做。若发现 reference/机制/do-not/oracle/scope 漂移，先按 action 修任务包、改实现计划或 blocked；关闭前不得启动昂贵独审。
- 禁止补一张假 `before-code` 记录来掩盖顺序错误。preflight 是纠偏门，不是审计贴纸。

### Step 1：获取 AC

```bash
# 从参数或 b-tasks.md 找当前 B 类任务
# 优先用用户传入的 task-id，否则找 b-tasks.md 中最近 [done]/[taken-by] 行
```

读取 `b-queue/{task-id}.md` 的 YAML frontmatter，使用 `acceptance-criteria` 的 intent/oracle、risk、files、do-not 与 relevant-standards。找不到任务包时停止审查并补任务包；不以临时口述替代权威输入。

### Step 2：建立可复审的 Git 检查点

```bash
# 仅在确认工作区没有本任务外改动后，按 changed-files 精确暂存
git add -- {changed-files}
git write-tree     # reviewed_tree；preflight 记录中的 base_tree 是任务起点
git diff {base_tree} {reviewed_tree}
```

把 `base_tree/reviewed_tree/diff_sha256/changed-files` 写进 round report。若已有本地提交，则可直接用两个 commit SHA；不得用会变化的 `HEAD~1` 文字替代固定 SHA。发现本任务外改动时停止，让用户先分离工作树，不把它们顺手暂存进审查对象。

### Step 3：启动独立审查 agent

先按 develop 的有效 risk 规则只升不降；再用固定 `base_tree → reviewed_tree` 的完整 changed-files 生成本轮 full profile：

```bash
node scripts/review-profile.js b-queue/{task-id}.md \
  --risk {standard|sensitive} \
  --output b-reviews/{task-id}/profile-round-{NN}.json \
  --changed-files {fixed changed-files...}
```

输出已存在、生成失败、task-id 不匹配或 selected/omitted 不闭合时停止，不靠人工自选维度继续。用独立 agent 读取 `../hact-method-lab/templates/review-briefs/develop-review.md` 并按其原文执行。首次告知 task-id、layer、“B 类无 iteration”、`review-mode: full`、base/reviewed tree 与 project-relative `review_profile`；agent 自读任务包、diff、命中 Standards、测试和必要源码，只执行 profile selected dimensions，不接收开发者自评/实现叙事。

报告写入 `b-reviews/{task-id}/round-{NN}.md`，格式见 `templates/review-briefs/develop-review-round.md`。每个新根因分配稳定 id `{task-id}-F{NNN}`；同根语法变体合并在同一 id 的 evidence 下，不按变体数量制造 blocker。

### Step 4：处理结果

按 finding `action` 处理：

- `fix-code/fix-mechanism` 且 blocking：修对应行为；下一轮传 `review-mode: targeted`、prior report、finding ids、上一/当前 reviewed tree，只复审这些根因、反例与受影响回归；
- `revise-doc/downgrade-claim`：代码文件数为 0，只复核文档/声明；
- `request-evidence`：证据面未变化前不改代码；
- `global-gap-review/backlog`：新开 owner 或写 backlog，不打回本次独立合规改动；
- `findings: []` 或仅 advisory：继续 commit。

targeted 继承最近一次 full 的 `review_profile`。发现 changed surface 超出上轮允许范围、引入新机制/模块/依赖或出现新根因时，报告写 `escalate_to_full: true`；下一轮基于 preflight base→当前 head 的完整 diff 生成新 profile 后才升 full，不在 targeted 轮偷偷扩成全量审查。同一 evidence 未变化时不得换措辞重复 finding；三轮代码复审仍阻断才上报用户。

每轮开始/结束时间由编排器立即记入 report，`elapsed_minutes` 向上取整；禁止事后凭感觉估时。最终把 implementation/review/spec 聚合分钟、report 目录与 `review_profile_version: develop-review-profile/v1` 写入 `status.yml code_reviews[]`，并在提交前运行 `node scripts/check-sprint.js --review {task-id}`；未通过不得提交终态。
