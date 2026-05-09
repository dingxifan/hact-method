---
name: pre-integration-check
description: 联调前全面检查——在 generate-integration-tests 启动前，对前后端代码做系统性核查，减少联调损耗。人工触发，不在主线方法论流程中。
---

# Pre-Integration Check

## 目的

联调前主动扫一遍，把能在本地发现的问题提前消灭。联调损耗的主要来源：
1. 某一层自身质量有问题（构建报错、类型错误、checklist 未过）
2. 前后端接口契约不对齐（字段名、类型、Auth 要求、分页参数）
3. 代码里有隐藏问题，AI review 能提前发现

---

## 使用方式

在**项目仓根目录**的 CC 会话中，告诉 CC「pre-integration-check」即可启动。
按以下四个 Phase 依次执行，每个 Phase 完成后输出小结，再继续下一个。

---

## Phase 1：机械验证

> 确认前后端各自能构建、类型正确、lint 通过。有报错先修，不带错误进后续步骤。

调用 `verification-loop` skill（`E:\group-code\hact-method\skills\verification-loop\SKILL.md`），对**后端**和**前端**各执行一遍，分别输出 VERIFICATION REPORT。

- 切换到后端目录执行一遍，再切换到前端目录执行一遍
- Overall 为 NOT READY → 先修复，不进入 Phase 2

```
Phase 1 小结：
- 后端：[READY / NOT READY]
- 前端：[READY / NOT READY]
```

🚫 Phase 1 有 NOT READY，不进入 Phase 2

---

## Phase 2：逐层质量核查

> 用 checklist 以"挑刺"视角过一遍本期所有模块。

读取以下文件，对**本期所有后端模块**逐项核查：
`E:\group-code\hact-method\templates\checklists\backend-checklist.md`

读取以下文件，对**本期所有前端模块**逐项核查：
`E:\group-code\hact-method\templates\checklists\frontend-checklist.md`

每项标 ✅ / ❌，❌ 必须修复后重标。

```
Phase 2 小结：
- 后端 checklist: {X}/{Y} 通过，❌ 问题：[列表]
- 前端 checklist: {X}/{Y} 通过，❌ 问题：[列表]
```

🚫 Phase 2 有 ❌ 未修复，不进入 Phase 3

---

## Phase 3：接口契约对齐核查

> 联调前最关键的检查——以 TRD 为基准，逐接口确认前后端实现完全对齐。

**读取材料：**
- `iterations/vN/trd.md`（接口设计章节）
- 后端 controller 文件
- 前端 api/*.ts 文件

**逐接口核查五项：**

| 核查项 | 说明 |
|--------|------|
| 路由 + HTTP 方法 | 前端调用的路径/方法与后端路由注解一致 |
| 请求字段 | 前端传的字段名、类型与后端 DTO 一致（含可选/必填） |
| 响应字段 | 后端返回的字段名与前端类型声明一致，无 `any`，无拼写差异 |
| Auth 要求 | 需要 token 的接口：前端有 Authorization header，后端有 `@UseGuards` |
| 分页/枚举参数 | page 起始值（0 或 1）、枚举值（数字 vs 字符串）前后端一致 |

```
Phase 3 接口契约核查：

✅ /api/xxx (GET) — 全部对齐
⚠️ /api/yyy (POST) — 字段不一致：
    后端 DTO: { userId: number }
    前端传入: { user_id: string }
❌ /api/zzz (DELETE) — 前端缺少 Authorization header

对齐问题：[N 个需处理]
```

🚫 Phase 3 有 ❌ 未修复，不进入 Phase 4

---

## Phase 4：全量 AI Code Review

> 独立视角扫一遍本期全量改动，发现以上步骤遗漏的隐藏问题。

调用 `superpowers:requesting-code-review`，在 reviewer prompt 中要求重点关注：

```
重点审查方向（除常规代码质量外）：
1. 前后端接口字段对齐——TypeScript 类型与实际返回值是否一致
2. 鉴权一致性——需要 token 的接口前后端是否都正确处理
3. 错误处理完整性——异常路径是否都有覆盖，前端是否都有 catch
4. 边界条件——空值、零值、长列表、并发场景
5. 安全敏感点——凭据、权限校验、用户隔离
```

---

## 修复路径

PIC 发现的问题不属于任何 queue 任务包，按以下规则处理：

**快速通道**（同时满足）：
- 无业务逻辑改动（允许：null 防护、缺失字段补全、类型修复、配置笔误、错误拦截格式、接口字段对齐；不允许：条件判断逻辑、数据处理算法、权限规则、接口行为）
- 原因显而易见，无需上下文讨论

**1. 修改代码**

**2. 提交前自检**（有报错必须修复，不得跳过）
```bash
# 后端有改动时
cd backend && npm run build 2>&1 | tail -5
npx tsc --noEmit 2>&1 | head -10

# 前端有改动时
cd frontend && npm run build 2>&1 | tail -5
npx vue-tsc --noEmit 2>&1 | head -10
```
有编译 / 类型错误 → 修复后重新自检，通过后才进入下一步。

**3. 提交并合并**
```bash
git checkout -b fix/pic-{desc}
git add {改动文件}
git commit -m "fix(pic): {描述}"
git push origin fix/pic-{desc}
git checkout master && git merge fix/pic-{desc} && git push origin master
git branch -d fix/pic-{desc}
```

**走 dispatch-new**（不满足快速通道任意一条）：
- 写 develop 任务包（`source=integration`），写入 `iterations/vN/queue/{task-id}.md`
- task-id 命名：`{项目缩写}-pic-{三位序号}`，如 `hact-pic-001`
- 正常走 PR 流程

Phase 1–3 发现的问题通常满足快速通道条件，Phase 4 AI Review 发现的问题需逐条判断。

---

## 最终输出

```
# Pre-Integration Check 报告 · vN · {日期}

## Phase 1 机械验证       [结果]
## Phase 2 质量核查       [结果]
## Phase 3 接口契约对齐   [结果]
## Phase 4 AI Review      [结论]

已发现并修复：{N} 个问题
待确认：{M} 个问题
联调就绪：✅ 可以开始 / ⚠️ 处理完以上问题再联调
```
