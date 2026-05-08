# 后端编码规范（通用模板）

> 项目启动时由 draft-tech-design 挑选本期相关项，写入 `iterations/vN/standards-backend.md`。
> 通用规则在此维护；项目特有规则写在项目 standards-backend.md 末尾，不要改这里。

---

## 分层规范（强制）

- Controller 只做路由接收和参数传递，**禁止在 Controller 层写业务逻辑判断**
- 业务逻辑全部在 Service 层
- **禁止 Controller 直接操作数据库**，必须通过 TypeORM Repository 或 Service
- 禁止在 Service 层直接操作 response 对象，统一由拦截器处理

## 响应格式规范（强制）

- Controller 直接 return 数据，**禁止手动包装 `{ code, msg, data }`**
- 所有成功响应由 `SuccessInterceptor` 统一格式化
- 所有异常由 `ExceptionFilter` 统一处理，业务代码不直接操作 response 对象

## 入参验证（强制）

- 所有 DTO **必须有完整的 class-validator 装饰器**
- 必填字段必须有 `@IsNotEmpty()` 或 `@IsDefined()`
- 字段类型必须有明确声明：`@IsString()`、`@IsNumber()`、`@IsBoolean()` 等
- 禁止用隐式类型转换替代显式验证
- 外部 API 返回值（第三方 SDK）必须检查关键字段是否为 null/undefined，不能直接解构
- **plain class 不等于 DTO**：只要 `@Body()` 使用的 class 没有 class-validator 装饰器，`ValidationPipe` 完全失效。非法值会进入 `new Date()` 等转换，产生 `NaN` 或静默错误，下游报错极难排查

## 安全规范（强制）

- 禁止硬编码密钥、密码、API Key，统一通过环境变量注入
- 禁止明文存储任何凭证类数据，加密方案在项目 standards-backend.md 中指定
- 响应数据中禁止出现 `password`、`secret`、`token` 等敏感字段明文
- 需要鉴权的接口必须有 `@UseGuards`，不得遗漏
- 附件/文件下载接口必须校验资源归属用户，防止越权访问

## 日志规范

- 禁止在日志中打印用户隐私数据（邮件正文、密码、token 等）
- 禁止在日志中记录用户输入内容（尤其是 AI 相关日志）
- 错误日志必须记录具体原因，不能只 `catch` 不记录

## 数据库规范

- 禁止 N+1 查询：关联数据用 `relations` 或 `QueryBuilder` 一次性加载
- 有唯一性要求的字段在 Entity 层加 `unique: true`，同时确认数据库层 UNIQUE KEY 实际生效
- upsert 操作需验证唯一约束实际有效

### upsert 规范

- **统一使用 TypeORM `save()` + `UNIQUE` 约束实现 upsert，禁止使用 `repo.upsert()`**：`repo.upsert()` 会绕过 TypeORM lifecycle hooks（`@BeforeInsert`、`@BeforeUpdate` 等），导致加密、审计等 hook 失效
- 正确写法：先 `findOne()`，存在则更新字段，不存在则 `create()`，最后统一 `save()`

### JSON 字段类型守卫（强制）

- **数据库中的 JSON 字段，运行时类型为 `any`，必须在读取后立即用类型守卫验证，不得依赖 TypeScript 编译时类型**
- 格式异常的 JSON 字段若不守卫，会静默进入下游逻辑，可能导致数据腐蚀
- 示例：
  ```ts
  function isRecurrenceRule(v: unknown): v is RecurrenceRule {
    return !!v && typeof (v as any).type === 'string' && typeof (v as any).interval === 'number'
  }
  if (!isRecurrenceRule(record.recurrenceRule)) continue
  ```

### TypeORM 事务规范

- **在 `dataSource.transaction()` 块内禁止使用 `manager.query()` 执行原始 SQL**：是否复用同一事务连接属于实现细节，TypeORM 文档无保证
- 改用 `manager.createQueryBuilder().setLock('pessimistic_write')` 等 QueryBuilder API

## 定时任务规范

### Cron 任务日期比较必须明确时区

- **禁止在 Cron 任务中混用 `toISOString()` 和 `getHours()`**：`toISOString()` 永远返回 UTC，`getHours()` 返回服务器本地时，混用会导致「当天」比较在某些时区窗口完全失效
- 统一偏移到目标时区再读取：
  ```ts
  const nowLocal = new Date(Date.now() + offsetMs)
  const todayStr = nowLocal.toISOString().slice(0, 10)
  const hours = nowLocal.getUTCHours()
  ```

### `setMonth()` 月末溢出必须修正

JavaScript 的 `setMonth()` 会静默规范化溢出日期（1月31日 +1月 → 3月3日而非2月底），无任何报错：
```ts
const next = new Date(baseDate)
const originalDay = next.getDate()
next.setMonth(next.getMonth() + interval)
if (next.getDate() !== originalDay) {
  next.setDate(0)  // 回退到目标月最后一天
}
```

### 同一路径不得分散在多个 Controller

NestJS 遇到路由冲突时，静默使用先注册的 Controller，后注册的永远无法触达，且无任何启动警告。新增路由前必须全局搜索路径是否已存在。

## 部署规范

### 双层防火墙均须开放

服务器通常有两层防火墙：云控制台安全组 + 服务器 UFW。两层都会拦截流量，任意一层未开放都会导致 502 / connection refused。

新端口上线前，必须同时确认：
1. 云控制台安全组中已添加该端口
2. 服务器执行 `sudo ufw allow <port>/tcp` 并 `sudo ufw reload`

## 环境配置

- **`.env` 密码值含 `#` 必须加引号**：dotenv 将 `#` 视为注释符，`DB_PASSWORD=#4400MAma#` 会被截断为空。正确写法：`DB_PASSWORD="#4400MAma#"`。在 `.env.example` 中加注释提示。

## TypeORM 类型陷阱补充

- **`BIGINT` 列运行时返回字符串**：TypeORM 将 MySQL `bigint` 映射为 JS `string`，Entity 的 `id` 字段类型必须声明为 `string`，不能用 `number`，否则比较时静默失败。

## 代码整洁

- 禁止提交含 `// TODO`、`// FIXME` 的未完成代码
- 禁止遗留 `console.log`（用 NestJS Logger 替代）
- 禁止提交注释掉的废弃代码块
- 禁止未使用的 import
