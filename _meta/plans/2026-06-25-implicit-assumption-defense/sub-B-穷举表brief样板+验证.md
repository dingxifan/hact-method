# sub-B · 穷举表 brief 样板 + 真实样本验证

> 目标:把 develop-review 的「用户输入去向追踪」从"检查项"重写成 **①穷举枚举表 + ②具体结果义务 + ④覆盖率机械化**,做成**可推广到其他类别**的样板,并在 mail-ai / JHH-Nortion 真实代码上验证「僵不僵、噪声大不大」。
> 状态:草案 + 验证完成,**未写入 live brief**(待用户拍板)。

---

## 0. 验证用真实样本(已读码,file:line 为证)

| 样本 | 仓 | 位置 | 类型 |
|---|---|---|---|
| ReplyEmailDto · reply 路径 | mail-ai | `send-mail.service.ts:156-178` | **阳性(真 bug)**:`cc` 硬编码 `[]`(L164) |
| ForwardEmailDto · forward | mail-ai | `send-mail.service.ts:193-214` | **阳性(真 bug)**:`cc` 硬编码 `[]`(L207) |
| SaveDraftDto | mail-ai | `drafts.service.ts:21-64` | **干净**:7 字段全消费 |
| CreateRuleDto | mail-ai | `automation-rules.service.ts:113-138` | **噪声**:审计字段 isEnabled/sortOrder 服务端设 |
| UpsertFilterDefaultDto | JHH | `filter-defaults.service.ts:40-64` | **噪声**:条件消费 + user_id/updated_at 注入 |
| ActivityQuickCreateDto | JHH | `ai.service.ts:150+` | **噪声**:1 字段 → 11 副作用 + AI 生成字段 |
| CalendarEventDto · 更新 | JHH | `feishu.service.ts:445-476` | **边界(异类 bug)**:3 字段全消费,但 title 部分更新语义错(所见非所得的另一种) |

> reply `to` bug 已修(`L162` 抛 400),但 `cc`/`bcc` 同类盲区原地复发——§1 论点的活体证据。

---

## 1. 可推广样板:穷举枚举类(category-agnostic skeleton)

任何"靠注意力发现盲区"失败的审查类别,都可套这个骨架。**僵化只加在"必须列全"上,判断完全放开**:

```
类 · {类别名}（穷举式）

【全集定义】{从哪个权威原文/类型定义,数出本类别要枚举的全集}。
            —— 必须是可机械数出的封闭集合(如 DTO 字段、AC 条目、update 字段),不是"你觉得相关的"。

【枚举义务】对全集中的【每一个】成员产出一行,不得跳过、不得抽样、不得合并"其余同上"。
            盲区靠"让某个成员显得平平无奇可跳过"藏身——穷举即消灭隐形:
            你不需要事先知道哪个成员特殊,只需被逼着给每个都填一行,填到那个埋雷的成员时它自己浮出来。

【每行必答】（用读到的原文/代码填,file:line 为证,禁止凭印象）：
   - 成员标识
   - {判定列 1（该类别特有）}
   - {判定列 2}
   - 结论：正常 / finding（+ 一句具体描述）

【②具体结果义务】结论非"显然正常"的行,必须写出一条具体追踪/例子(不是抽象判断)：
   "{具体输入} → 跟踪 → 落点 file:line → {具体结局}"。
   抽象散文里盲区活着;你被迫写出具体结局时它就死了。

【④覆盖率自证（机械可核）】枚举完成后声明：全集来源(文件/类型) + 全集大小 N + 本表行数。
   行数 < N → 审查未完成(机械可核:脚本数全集大小 vs 表行数)。
   —— 把"AI 跳过了不起眼的那个"这一失败模式变成可机械挡的覆盖缺口。
   （④的可机械化程度随类别变:DTO 字段数=易;HTML 控件可编辑=难。难的退"自证+人抽核"。）

【判级 / 噪声纪律】{该类别的 finding 判级 + 明确写出"什么不算 finding",压假阳性}
```

**为何不僵化**:骨架固定,但【全集定义】【判定列】【判级】per-类别。换一个类别 = 换三样、骨架不动。类别本身少数、缓增、证据门准入(harvest-notes 喂),实例无穷——**在"问句类别"高度僵化,在"实例"高度开放**。

---

## 2. 实例化:类 7「用户输入去向追踪」(替换设计稿 §4.1 的散文版)

```
类 7 · 用户输入去向追踪（穷举式 / 方向 B）

【全集定义】本任务涉及的每个请求 DTO / 请求体,其中【前端可提交的每个字段】。
            全集 = DTO class 的属性(带 @Is*/@IsOptional 等装饰的字段),从 dto 文件数出。
            ⚠️ 全集是「DTO 可提交字段」,不是实体/表字段。

【枚举义务】对每个 DTO 的每个可提交字段产出一行,不得跳过。

【每行必答】（读 DTO + service 代码填,file:line 为证）：
   - 字段名
   - service 在哪消费：file:line（或「从不读取」）
   - 是否被覆盖：否 / 被「{覆盖来源}」覆盖（覆盖来源:认证态/时间戳/服务端生成id/从别记录重建/硬编码常量）
   - 结论：正常 / finding

【②具体结果义务】结论=finding 或"消费方式可疑"的行,写一条具体追踪：
   例:"前端提交 cc=[x@y.com] → service.ts:164 sentEmail.ccAddresses=[] 硬编码 → x@y.com 被丢弃,邮件无抄送"。

【④覆盖率自证】声明:DTO 文件 + class 名 + 字段数 N + 本表行数。行数<N=未完成(脚本可核 N)。

【判级】
   - 字段在 DTO、service 从不读、无注释说明为何丢弃 → finding：
       · 任务包/TRD 未声明该字段归属权 → 建议（"字段 X 可提交但 service 未消费,确认应使用还是从接口移除"）
       · 任务包/TRD 已声明 user-owned 而 service 忽略 → 阻断
   - service 用「非用户提交、非系统上下文」的值覆盖一个用户提交字段(所见非所得) → finding（同上分级）

【噪声纪律 —— 以下不算 finding】
   - 服务端设置一个**不在 DTO 里**的字段(user_id from JWT / isEnabled / sortOrder / updated_at) → 正常服务端职责,不枚举、不报。
   - 条件消费(`if ('x' in dto)` / `dto.x ?? 默认`)= 已消费,正常。
   - service 有显式注释/逻辑说明为何重建或忽略(reply-all 不传则从原邮件重建)= 有授权,正常。
   - 字段名前后端不同但语义对应且确被消费(title→summary)= 正常。
```

---

## 3. 验证:逐样本跑这个类(穷举表 + 噪声纪律)

### 阳性 1 — ReplyEmailDto reply 路径(全集 7 字段)

| 字段 | service 消费 | 覆盖 | 结论 |
|---|---|---|---|
| bodyHtml | L173 + sendViaSMTP html | 否 | 正常 |
| replyAll | L125 控制分支 | 否 | 正常 |
| to | L162 校验 + L163 使用 | 否 | 正常(已修) |
| **cc** | **从不读取** | **硬编码 `[]`(L164)** | **🔴 finding(建议)** |
| bcc | L165 `dto.bcc ?? []` | 否 | 正常 |
| attachments | L176 resolveAttachments | 否 | 正常 |
| accountId | resolve account | 否 | 正常 |

覆盖率自证:reply-email.dto.ts / ReplyEmailDto / N=7 / 7 行。✓
**结果:抓到 cc bug。** 且**不需要审查员"知道 cc 特殊"**——穷举逼出 cc 那一行,诚实填"从不读取 + 硬编码[]"就产出 finding。穷举消灭隐形,成立。`to` 已修不误报。✓

### 阳性 2 — Forward `cc`(L207):同上,抓到。✓

### 干净 — SaveDraftDto(7 字段全消费):每行正常 → **0 finding**。✓ 无假阳性。

### 噪声 1 — CreateRuleDto:全集=DTO 4 字段(name/conditions/disposition/tag_name),全消费 → 0 finding。审计字段 isEnabled/isSystemDefault/sortOrder **不在 DTO 全集**,噪声纪律第 1 条直接排除 → **不误报**。✓

### 噪声 2 — UpsertFilterDefaultDto:4 字段条件消费 = 正常;user_id/view_type/updated_at 非 DTO 字段不枚举 → **0 finding**。✓

### 噪声 3 — ActivityQuickCreateDto:全集=1 字段(description),已消费 → 1 行正常。**11 个副作用 / AI 生成字段都不在 DTO 全集,不枚举** → **0 finding**。✓
> Explorer 凭"追踪所有路径"估假阳性 10-15%;**穷举"DTO 字段"而非"所有路径"把它压到 0**——1→11 扇出与本类无关。范围纪律是噪声控制的关键。

### 边界 — CalendarEventDto 更新(title/startTime/endTime 全消费):本类每行正常 → **0 finding,漏掉 Bug #1**。
> Bug #1(前端只改时间却总带 title,后端无法区分"有意改标题"vs"只想改时间",可能用旧 title 覆盖)**不是"字段被忽略",是"字段被消费但用户没打算改它"**——属**另一个类别**(部分更新/脏字段语义)。
> **这不是失败,是边界的诚实证据**:本类抓"忽略/覆盖",对"消费-但-非本意"诚实地盲。它motivate 一个新枚举类别(「update DTO 每个字段,后端能否区分'用户改了'vs'用户没动'」),换列不换骨架——证明样板可推广、不僵化。

---

## 4. 裁决

**僵不僵?** 不僵。骨架固定(穷举+自证),全集/列/判级 per-类别。Bug #1 用同骨架换列即成新类别 → 样板真可推广。

**噪声大不大?** 低——**前提是噪声纪律入 brief**。6 个真实样本里精确产出 2 个 finding(reply cc / forward cc),全真,干净/噪声样本 0 误报。关键是三条范围纪律:①全集=DTO 可提交字段(非实体字段)②条件消费=消费 ③反向规则只在"覆盖了 DTO 里用户提交的字段"时开火。去掉这三条,服务端注入字段会爆假阳性。

**命中?** 抓到 reply+forward 的 cc bug——而且是在**审查员不预知 cc 特殊**的前提下抓到的,正是 §1 想要的"不靠注意力"。

**④ 可机械化程度随类别变(诚实)**:本类的覆盖率自证可机械核(脚本数 DTO class 属性 vs 表行数,比 L4 的 HTML 控件解析容易得多)。HTML 可编辑性那类难,退"自证+人抽核"。所以"覆盖率机械化"不是均匀可得,是 per-类别评估。

**剩余天花板**:本类只覆盖"忽略/覆盖"。Bug #1(部分更新)、并发谁赢、null vs 缺省等是别的类别,各需自己的枚举义务。每个漏到生产的新盲区→升格成下一个枚举类别(harvest-notes 闭环)。不声称解决了通用隐性假设。

---

## 5. 推广评估(develop-review 现有 6 类哪些适合同款改造)

| 现有类 | 适合穷举表? | 全集 |
|---|---|---|
| 1 AC 忠实性 | ✅ 很适合 | 任务包 acceptance-criteria 每条 |
| 4 测试品类空缺 | ✅ 适合 | 该层应有测试品类清单(鉴权/边界/错误/契约/并发/安全) |
| 6 设计保真 | 🟡 部分 | design.md 每个视觉 token / prototype 每条交互路径 |
| 2 do-not 越界 | ❌ | do-not 是边界判断,非枚举 |
| 3 标准合规 | ❌ | 开放集 |
| 5 留人判项 | ❌ | 本就是判断 |

→ 建议:类 7 先上(本验证);AC 忠实性、测试品类后续可同款改(它们的"漏"也是覆盖缺口型)。**不要全 brief 推平**——do-not/标准/留人本质是判断,套穷举表反而僵化。
