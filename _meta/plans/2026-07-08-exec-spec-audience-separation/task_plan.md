# 2026-07-08 · exec spec 受众分离（历史注解清扫 + 写作纪律）

> 来源：`_meta/plans/2026-07-08-method-review/findings.md` 条目【执-2】。用户确认范围：三层全做。
> 实测修正：纯历史注解在 specs-execution 只有 8 处，重灾区在 skeleton/06 §7 与 specs-structural——本轮主产出是 CLAUDE.md 防回潮纪律，清扫本身收益中等。

## 判定原则（入 CLAUDE.md）

保留：做什么 + 必要的一句 why（操作性理由）+ `决策#N` 短指针。
清除：日期出处 / 退役机制对照 / 迁移注记 / 事故代号（v8）/ 内部计划代号（子计划、sub7）。
删前逐条核对 canonical 记录已在 BRIEF / status-history / plans 设计稿——不新建第三份存档。

## 清单

- [x] 1. plan-sprint L98 迁移注记整句删（BRIEF #28 已记）
- [x] 2. draft-tech-design L134 删日期括号（规则留）
- [x] 3. draft-tech-design L232 + templates/standards/frontend.md 删"v8 主色全错根因"×2
- [x] 4. draft-tech-design L302 退役对照段收敛为分工说明 + 存量兜底句
- [x] 5. draft-foundation L4 删"（2026-06-16 铁律）"
- [x] 6. develop L5 删"（2026-06-20 砍除）"；L121 删"守 2026-06-16"；L218 "砍除 pr-review 后"改"合并前唯一保留的"；L226 删"（替代旧 pr-review 写入）"
- [x] 7. skeleton/06 §7：三段"子计划"引言改为「覆盖内容 + 设计沉淀指针」；"活体标本…整段退场"叙事删；操作内容（脚本/语义残量/无需另派 subagent）全保留
- [x] 8. specs-structural/develop.md L25 删"（子计划 3c）…旧布局退役"叙事；L72 删"替代旧 pr-review 写入"
- [x] 9. specs-structural/_template.md L68 删"（方案甲，2026-05-31）"
- [x] 10. CLAUDE.md 增"方法论文件写作纪律（受众分离）"短节
- [x] 11. findings.md 状态表 执-2 → ✅；STATUS 索引 + status-history 记录；commit
