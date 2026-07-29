# 跨层通用规范（shared）

> 由 draft-tech-design 基于 TRD 播种到**项目根** `standards-shared.md`（跨迭代活文档，vN+1 原地增补）。
> 本模板提供骨架和常见约定，项目启动时按实际填写。
> 不重复 standards-frontend.md / standards-backend.md 中已有的单层约束。

---

## 命名规范

| 对象 | 规范 | 示例 |
|------|------|------|
| 文件名（后端模块） | kebab-case | `user-profile.service.ts` |
| 文件名（前端组件） | PascalCase | `UserProfile.vue` |
| 变量 / 函数 | camelCase | `getUserById` |
| 类 / 接口 / 枚举 | PascalCase | `UserProfile`、`ApiResponse` |
| 常量 | UPPER_SNAKE_CASE | `TOKEN_KEY`、`MAX_RETRY` |
| 数据库表名 | snake_case | `user_profiles` |
| 数据库字段名 | snake_case | `created_at` |
| Git 分支 | `feature/{task-id}-{brief-desc}` | `feature/auth-v1-001-login` |

---

## 代码注释（受众分离，强制）

注释的读者是**下一个改这段代码的人**、以及**无上下文的独立审查 subagent**——不是本次改动的过程记录。

**写进注释**：

- 这段代码做什么 + 一句操作性理由（为什么非这样不可）
- 约束来源的短指针：`决策#N` / standards 章节名 / 不变式编号
- **带前提的禁令必须写明前提**——`// 在 X 不可回退的前提下，不得改用 Y`。前提消失时无人知道该复审，一条方向写反的禁令比没有禁令更坏：它会让下一个人主动把口径改回错的那边

**不写进注释**（canonical 记录在 git commit / `decisions.md` / 任务包，运行时文本不复述）：

- 任务号与迭代号（`{task-id}` / 「v4 起」）
- 迁移与退役注记（「原 X 已并入」/「砍除 Y 后」/「此前走的是 Z」）
- 事故代号、讨论稿代号

**判据**：把注释里的专名删掉后，下一个人是否仍能据它做出正确改动？能 → 该专名是考古，删；不能 → 它承载语义，改写成不依赖历史的说法再留。

---

## API 响应格式（强制）

所有接口统一返回：

```ts
{ code: number, msg: string, data?: any }
```

| 字段 | 说明 |
|------|------|
| `code` | `0` = 成功；非 0 = 业务错误；HTTP 4xx/5xx 另行处理 |
| `msg` | 成功时为 `'success'`；失败时为可读错误描述 |
| `data` | 成功时的返回数据；失败时可省略 |

- 禁止在 Controller 手动包装此结构，统一由 `SuccessInterceptor` 处理
- 禁止将业务错误伪装成 HTTP 200 + code 非 0（影响前端 catch 逻辑）

---

## 错误码约定

> 按项目实际分配，在此处统一登记。

| 错误码 | 含义 |
|--------|------|
| `0` | 成功 |
| `1001` | 参数校验失败 |
| `1002` | 未登录 / token 失效 |
| `1003` | 无权限 |
| `1004` | 资源不存在 |
| `1005` | 操作冲突（如重复提交） |
| `5000` | 服务器内部错误 |
| （按需补充）| |

---

## 权限模型

> 按项目实际填写，在此处说明鉴权机制和权限分层。

```
鉴权方式：JWT Bearer Token
Token 存储：{localStorage key}
刷新策略：{过期时间} / {自动刷新 / 跳登录页}

权限分层：
- 公开接口：无需 Token
- 登录接口：需要有效 Token（@UseGuards(JwtAuthGuard)）
- 管理员接口：需要 admin 角色（@UseGuards(AdminGuard)）
```

---

## 测试环境约定

> 由 draft-tech-design 在 TRD 中明确，此处为格式参考。

| 项 | 值 |
|----|-----|
| 后端地址 | `http://localhost:{port}` |
| 前端地址 | `http://localhost:{port}` |
| 数据库 | `{db_name}_test`（测试专用库，禁止指向生产库） |
| 禁止在联调中触发的操作 | {如：发送真实通知、扣费、写生产数据等} |

---

## 跨层安全规范（强制）

- 禁止在代码、PR description、完成报告中明文出现 PAT / access token / 密码 / 私钥 / API key
- 禁止硬编码密钥，统一通过环境变量注入
- 禁止 `console.log` / Logger 打印用户输入内容、密码、token 等敏感数据
