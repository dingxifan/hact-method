# 后端编码规范 · 技术栈子模板（NestJS + TypeORM）

> **栈子模板**：本文件只放 NestJS / TypeORM / class-validator / Node 栈特定的写法与陷阱；栈无关原则在通用模板 `backend.md`。
> 播种时（draft-foundation V0 首播 / draft-tech-design 存量兜底）按 `project.md` 技术层选用本文件，与通用模板**叠加**挑选写入项目根 `standards-backend.md`；项目用其他栈且无对应子模板 → 仅用通用模板，栈特定约定直接写项目根 standards。

---

## 分层与响应格式的本栈落法

- 数据访问统一通过 TypeORM Repository 或 Service，禁止 Controller 直接操作数据库
- 所有成功响应由 `SuccessInterceptor` 统一格式化；所有异常由 `ExceptionFilter` 统一处理，业务代码不直接操作 response 对象

## 入参验证（class-validator）

- 所有 DTO **必须有完整的 class-validator 装饰器**
- 必填字段必须有 `@IsNotEmpty()` 或 `@IsDefined()`
- 字段类型必须有明确声明：`@IsString()`、`@IsNumber()`、`@IsBoolean()` 等
- **plain class 不等于 DTO**：只要 `@Body()` 使用的 class 没有 class-validator 装饰器，`ValidationPipe` 完全失效。非法值会进入 `new Date()` 等转换，产生 `NaN` 或静默错误，下游报错极难排查

## 鉴权守卫

- 需要鉴权的接口必须有 `@UseGuards`，不得遗漏（通用模板「鉴权强制」原则的落点）

---

## TypeORM 规范

### upsert 规范

- **统一使用 TypeORM `save()` + `UNIQUE` 约束实现 upsert，禁止使用 `repo.upsert()`**：`repo.upsert()` 会绕过 TypeORM lifecycle hooks（`@BeforeInsert`、`@BeforeUpdate` 等），导致加密、审计等 hook 失效
- 正确写法：先 `findOne()`，存在则更新字段，不存在则 `create()`，最后统一 `save()`

### 事务规范

- **在 `dataSource.transaction()` 块内禁止使用 `manager.query()` 执行原始 SQL**：是否复用同一事务连接属于实现细节，TypeORM 文档无保证
- 改用 `manager.createQueryBuilder().setLock('pessimistic_write')` 等 QueryBuilder API

### 类型陷阱

- **`BIGINT` 列运行时返回字符串**：TypeORM 将 MySQL `bigint` 映射为 JS `string`，Entity 的 `id` 字段类型必须声明为 `string`，不能用 `number`，否则比较时静默失败
- 有唯一性要求的字段在 Entity 层加 `unique: true`，同时确认数据库层 UNIQUE KEY 实际生效
- N+1 规避的本栈写法：关联数据用 `relations` 或 `QueryBuilder` 一次性加载

---

## NestJS 路由陷阱

### 同一路径不得分散在多个 Controller

NestJS 遇到路由冲突时，静默使用先注册的 Controller，后注册的永远无法触达，且无任何启动警告。新增路由前必须全局搜索路径是否已存在。

---

## Node / JS 日期陷阱

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

---

## 环境配置（dotenv）

- **`.env` 密码值含 `#` 必须加引号**：dotenv 将 `#` 视为注释符，`DB_PASSWORD=#4400MAma#` 会被截断为空。正确写法：`DB_PASSWORD="#4400MAma#"`。在 `.env.example` 中加注释提示。

## 日志

- 禁止遗留 `console.log`（用 NestJS Logger 替代）
