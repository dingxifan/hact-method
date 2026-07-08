# 2026-07-08 · 技术栈剥离 + 确认点分级

> 来源：全局方法论评审（本仓 CC 会话）→ 用户确认执行两条建议。
> 决策：draft-prd 逐功能确认引入「继承类批量」分级（用户拍板：引入）；checklist 栈拆分本轮不做（记待议）。

## 方案一：技术栈剥离（BRIEF 决策 #27）

原则：骨架/specs 栈无关；栈特定写法住 `templates/standards/` 栈子模板；按 `project.md` 技术层路由。

- [x] 1. 新建 `templates/standards/frontend-vue3.md`（迁出：Vue 组件规范 / SCSS @use / Element Plus 使用+陷阱 / Pinia / Vite ESM / 具体宽度值）
- [x] 2. `templates/standards/frontend.md` 瘦身为栈无关原则 + 头部注明子模板关系
- [x] 3. 新建 `templates/standards/backend-nestjs.md`（迁出：TypeORM 细则 / class-validator 细则 / NestJS 路由陷阱 / dotenv 细节）
- [x] 4. `templates/standards/backend.md` 瘦身为栈无关原则 + 头部注明
- [x] 5. `skeleton/03-disciplines.md` 去栈措辞（dev-frontend / dev-backend / integration-testing / deploy）
- [x] 6. `specs-execution/draft-tech-design.md`：视觉地基三条抽象化 + Step 7 播种源改三源（通用模板 + 栈子模板 + 个人 notes）
- [x] 7. `specs-execution/draft-foundation.md`：Step 4 来源改三源 + 视觉地基抽象化
- [x] 8. `specs-execution/plan-sprint.md`：EP → UI 库、变量名抽象
- [x] 9. `specs-execution/manual-test.md`：vue-tsc 命令抽象
- [x] 10. `specs-execution/develop.md` L312：checklist 工具名抽象

不动：skeleton/07 CRDrawer.vue（描述看板应用事实）；generate-integration-tests / templates/design.md（已带"按项目 UI 库调整"）；Gitee/pinchtab 工具依赖层；checklist 两份（记待议）。

## 方案二：确认点分级（BRIEF 决策 #28）

原则：🚫 只留人拍板项；可推导判定改 ⚖️（默认判定 + 理由 + 直接继续 + 可推翻）；非 🚫 步骤不再问"继续？"。

- [x] 11. 步骤协议行统一升级（12 份 exec spec；deploy 已 auto-run 不动、develop 无此行）
- [x] 12. 会话启动选项列表松绑 ×4（plan-sprint / draft-tech-design / manual-test / wrap-up-iteration）：用户开场已明确主线意图 → 跳过列表
- [x] 13. plan-sprint：Step 2.5 取消，交付判定（规则不变）并入 Step 2，Step 2 一次 🚫 覆盖；更新 L133 脚注 + templates/sprint.md L4 引用
- [x] 14. draft-prd：[v2+] mkdir 阻断删除（可逆，播报即建）；Step 4 加「继承/继承·微调 批量确认，新增/重构/简化 逐个」
- [x] 15. develop 第零步：仅一层有 [可取] → 自动定层播报；两层都有才 🚫 问

不动：疑点清单 / 骨架方向 / TRD 内容确认 / 五个 Gate 签字 / 前端设计门 / manual-test 验收循环 / draft-ux 全部 / init-project 信息收集类等待。

## 收尾

- [x] 16. BRIEF.md 追加决策 #27 / #28
- [x] 17. 待议清单：2026-06-22 后端条目⑤ 标注部分落地；新增 checklist 栈拆分待议；#8 条目 Step2.5 引用补注
- [x] 18. STATUS.md 索引行 + _meta/status-history.md 完整记录
- [x] 19. 更新 _meta/.current_plan
- [x] 20. commit
