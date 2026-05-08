# exec: revise-doc

> CC 加载本文时，当前任务是对一份已签 Gate 的文档（PRD / TRD / standards）做最小化修订，记录原因，判断下游影响。
> 已签 Gate 不撤销，只记录变更；修订范围最小化。

**上下文密度**：低-中。只读目标文档 + backlog，不加载代码。

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

读任务包，确认：
- `target` 字段：`prd` / `trd` / `standards`
- `reason` 字段：修订原因（触发来源 + 具体问题）

---

## Step 1：读原文档，定位问题段落

按 `target` 读对应文件：
- `target=prd` → `iterations/vN/prd.md`
- `target=trd` → `iterations/vN/trd.md`
- `target=standards` → `iterations/vN/standards-{backend|frontend|shared}.md`（由 reason 决定具体文件）

定位 `reason` 所指的具体段落，输出：
```
问题位置：{文件} 第 {章节} 节
问题描述：{一句话说明原文哪里有歧义或缺失}
```

---

## Step 2：修订内容

按 `reason` 所述做**最小化**修订：
- 只改有歧义或缺失的段落
- 不借机重写或扩展范围
- 修订涉及已签 Gate 核心定义（接口 schema 大幅变动等）时 → 在 backlog 标注并上报，等用户确认修订边界后再动手

**输出修订内容摘要**（改了什么 / 原文 vs 修订后），等用户确认。

🚫 等用户确认修订内容

---

## Step 3：记入 backlog

在 `backlog.md` 追加 `[修订]` 条目：

```markdown
- [修订] {YYYY-MM-DD} | {改了什么，一句话} | 原因：{reason 字段内容}
```

---

## Step 4：判断下游影响

| target | 判断逻辑 | 动作 |
|--------|---------|------|
| `prd` | 是否影响 TRD 的接口 / 数据结构？ | 是 → 同时创建 `revise-doc(target=trd)` |
| `trd` | 是否影响已派发的任务包？ | 是 → 更新 queue 中对应任务包，通知相关 develop 重新拾取 |
| `standards` | 是否影响进行中的 develop task？ | 是 → 在对应任务包 `relevant-standards` 字段追加变更说明 |

无下游影响 → 记录「无下游影响」，继续 Step 5。

---

## Step 5：commit

```bash
git add {修订的文件} backlog.md
git commit -m "fix(doc): {修订内容摘要} [{项目名}]"
```

```
✅ revise-doc 完成：{target} 已修订，backlog 已记录，[无下游影响 / 已创建级联修订 revise-doc(target=trd) / 已通知相关 develop 任务]。
```

---

## 上下文管理

本 task 无需复杂断点续做——修订内容少，通常一次会话完成。
如中断，读 `backlog.md` 确认 `[修订]` 条目是否已追加，判断从 Step 3 还是 Step 4 继续。
