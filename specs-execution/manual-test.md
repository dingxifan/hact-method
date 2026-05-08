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

## 步骤追踪协议

每步完成后输出：
```
✅ [步骤名] 完成：[2–3 句结论]
→ 下一步：[步骤名] — [一句说明]
继续？
```
🚫 标记处必须等用户明确回应后才继续。

---

## 会话启动

精确读取：
- `iterations/vN/prd.md`（acceptance criteria 段落）
- `integration-tests/result-{最新日期}.md`（联调三条件结论）

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

请自主探索，发现问题随时告知，不需要按特定顺序操作。
```

🚫 等用户反馈（不催促，不预设结论）

---

## Step 3：收集反馈 + 派修复任务

用户每反馈一个问题：

1. **判断是否在本期 PRD 范围内**：
   - 在范围内 → 继续步骤 2–4
   - 超出范围 → 告知「该问题不在本期范围，已记入 backlog 留下期处理」，写入 `backlog.md`，不派修复

2. **记录问题**（不替用户判断严重性）：
   - 现象描述
   - 复现步骤
   - 追加至验收报告问题记录（见 Step 5 格式）

3. **写 develop 任务包**：`source=manual-test`，urgency 按用户描述的严重程度判断，写入 `queue/{task-id}.md`

4. **通知用户**：
   ```
   已派发修复：
   - {task-id}：{问题描述}
   修复合并后通知你复测。
   ```

5. **记录到 `_meta/sessions/manual-test-progress.md`**：追加派发的 task-id 和问题描述（用于断点续做）

---

## Step 4：等待复测

develop(source=manual-test) 全部 [merged] 后，通知用户：
```
以下问题已修复合并，请复测：
- {task-id}：{修复了什么}
```

🚫 等用户复测反馈（不催促）

重复 Step 3–4，直到用户明确说「验收通过」。

**同一问题修复后反复出现超过 2 次** → 上报；判断根因是否在设计层，若是则创建 `revise-doc` 任务，等修订完成后复测。

---

## Step 5：写验收报告 + 签 G4

用户明确说「验收通过」后，写验收报告 `iterations/vN/acceptance-report.md`：

```markdown
# 验收报告 · vN · {项目名}

## 验收结论
通过

## 问题记录
| # | 现象 | 复现步骤 | 处理结果 |
|---|------|---------|---------|
| 1 | {描述} | {步骤} | 已修复 / 记入 backlog |

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
```

```
✅ manual-test 完成：G4 已签，验收通过。
→ 下一步：deploy（部署）和 wrap-up-iteration（收尾）可并行启动
```

---

## 上下文管理

**断点续做**（用户长时间未回复后重新开会话）：
1. 读 `_meta/sessions/manual-test-progress.md`：确认已派修复任务清单
2. 读 `queue/`：找 source=manual-test 的任务包，核实 [merged] / [可取] / [taken-by] 状态
3. 读 `iterations/vN/acceptance-report.md`：确认问题记录和当前状态
4. 读 `iterations/vN/gates.md`：G4 已签 → 任务完成
5. 从上次停在的节点继续，不重复已完成操作

`_meta/sessions/manual-test-progress.md` 内容结构：
```markdown
## manual-test 进度 · vN

### 已派修复任务
- {task-id}：{问题描述}（状态：[可取]/[merged]）

### 当前状态
等待用户复测 / 等待修复合并 / 验收通过待签 G4
```
