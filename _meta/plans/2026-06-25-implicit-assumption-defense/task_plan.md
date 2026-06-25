# task_plan · 隐性假设防线

> 设计见 design.md（§0 本轮决议 / §2 穷举原则 / §5 余项），事实约束 + 两轮审查发现见 findings.md，类7 验证见 sub-B。
> **状态（2026-06-25，第二轮·第一刀已执行）**：类7 穷举表（建议级）已写入 live brief + skill；AC 组合涌现砍除；keystone 推迟。

## 当前位置

- ✅ 设计落盘（design.md §0 决议 / findings.md / 本文件）
- ✅ 两轮独立审查 + 我方复核，结论折进 design §2–§4
- ✅ 类7 穷举表 sub-B 真实样本验证（mail-ai/JHH，2 真 finding / 0 误报 / small-N）
- ✅ **本轮执行（决议 B）**：develop-review.md 加类7 + adversarial-review skill 同步 + 轻量仪表
- ⏭️ 后续：第二批 honor 半机械链 + §5.3/§5.4 + 文档层（见下）
- ⛔ 未 commit / 未 push；`_meta/.current_plan` 不动

## 本轮执行清单（决议 B，✅ 已完成）

- [x] `templates/review-briefs/develop-review.md` 加「7. 用户输入去向追踪（穷举式 / 方向 B，仅 backend）」——①穷举表 + ②具体结果义务 + ④覆盖率自证 + 噪声纪律 + 完整双分支判级（阻断分支休眠）
- [x] `develop-review.md`【输出格式】类别列表加「用户输入去向追踪」（= 轻量仪表标签）
- [x] `skills/adversarial-review/SKILL.md` 加 类6 + 返回格式 `[去向追踪]` 前缀（仪表标签）+ 允许读 DTO/service 源码
- [x] AC 组合涌现：从落地清单**移除**（决议 A，未写任何 prd-review 改动）

## 后续开放项

### 选型疑问（可讨论清，下一轮）
- [ ] §5.1 keystone：(a)解析HTML / (b)退subagent / (c)生成时结构化 / **(d)数标签覆盖下限**。我方倾向 (d)+(c)。**本轮推迟**。
- [ ] §5.2 余项：③角色镜头 / ⑤台账是否再加；AC忠实性 / 测试品类是否同款改穷举表（sub-B §5）。
- [ ] §5.4 honor 半机械链是否仍要 prototype↔TRD 跨源。

### 第二批 honor 半机械化（命中率证明值得后）
- [ ] keystone 按 §5.1 选定方案落地
- [ ] TRD `# owner:` 注解——join key 用**稳定 id FIELD-01**（F4）
- [ ] check-docs 跨源对账 + reply-bug fixture 自测须 FAIL
- [ ] develop-review / skill 阻断分支自动激活（已写好，等 owner 声明输入）+ 自读输入加 owner 注解
- [ ] **完整观察门**（F6）：precision 落点 schema / disposition 真假字段 / 阈值 / sunset（本轮只做了"采集搭现成 durable 记录 + 标签"，统计门未做）

### 证据疑问（只能攒，挂观察门）
- [ ] §5.3 类别表扩不扩 / 并发·排序纳不纳入——凭跨项目复发挣席位

### draft-ux AC 回补（独立小项）
- [ ] prototype-review.md「归属权回补」——**先实读核 prototype-review 是否缺 prd.md 输入**（F4.6），缺则补输入

### 文档层（正交，随手落方法论防绕回）
- [ ] 穷举边界（并发/排序，design §2.5）/ honor-affordance 诚实范围（§3）/ ②>④ 定性（§2.3）——是否提炼进 BRIEF 或 skeleton

## 关键决策记录（防绕回）

- **抗盲区本质是穷举，不是机械化**：机械化是穷举有外部锚的特例（design §2，纠正旧 §1）。
- **类别僵化 / 实例放开**：机制只加在"必须列全"，判断放开（design §2.2）。
- **②>④**：从代码倒逼具体结果治盲区（判断失败）；覆盖率机械化治盖章（覆盖失败）。别把④当主梁（findings D1）。
- **穷举有边界**：只对可枚举载体类别（字段/接口）成立；并发/排序排除（design §2.5）。
- **task.type 路由防穷举膨胀**：复用决策 #14（design §2.6）。
- **范围只解 honor 半**：affordance 半 + 通用隐性假设 + 不可枚举类别都不在内、不声称解决（design §3）。
- **不动 `_meta/.current_plan`**：它指向 pipeline-reshape 主线；本议题独立 deposit。
