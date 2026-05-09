# 后端模块自检清单

> 每个后端模块完成后对照此清单逐项检查，输出【后端自检报告】。
> 目标：以"挑刺"视角找出尽可能多的潜在 bug，而不只是确认功能完整。
> 每条标 ✅（通过）/ ❌（有问题，必须修复）/ N/A（本次改动不涉及，直接跳过）。

---

## 一、接口契约

- [ ] 所有 Controller 方法都有对应的 ResponseDTO，字段与前端实际使用的一致
- [ ] 列表接口返回的字段，前端 api/*.ts 里有完整的 union 类型声明（无 any）
- [ ] 新增 endpoint 已注册到正确的 Module，Module 已注册到 AppModule
- [ ] 路由前缀、HTTP 方法与 TRD 定义一致

## 二、认证与授权

- [ ] 需要登录的接口有 `@UseGuards(JwtAuthGuard)`，无遗漏
- [ ] 使用 `req.user.sub`，未使用 `req.user.id`
- [ ] 涉及资源归属的接口（如附件、草稿），校验了资源属于当前用户
- [ ] 使用了 JwtAuthGuard 的模块，imports 里包含了 AuthModule

## 三、DTO 与入参

- [ ] 所有 DTO 字段有 class-validator 装饰器
- [ ] 可选字段加了 `@IsOptional()`，必填字段加了 `@IsNotEmpty()`
- [ ] Query DTO 的数字字段加了 `@Type(() => Number)`（Query string 默认是字符串）
- [ ] 白名单过滤：`whitelist: true` 已在全局 ValidationPipe 开启，新字段不会被静默丢弃

## 四、数据库与并发

- [ ] 有唯一性约束的操作做了 `try/catch ER_DUP_ENTRY`，而非先查后写（TOCTOU）
- [ ] 关联数据用 `relations` 或 QueryBuilder 一次加载，无 N+1
- [ ] 批量操作用事务包裹，单条失败不会导致部分写入
- [ ] upsert 操作确认数据库层 UNIQUE KEY 实际存在

## 五、异常路径与边界

- [ ] 资源不存在时返回 404，不返回空对象或 null
- [ ] 操作超出限制返回 409，带明确错误文案
- [ ] 第三方 API 调用失败时，错误信息透传给前端，不吞掉
- [ ] 所有 catch 块有 logger.error 记录，不静默失败
- [ ] 空数组、零值、undefined 等边界值的处理逻辑验证过

## 六、并发安全

- [ ] 有状态的操作（同步、队列任务）有防重入机制（Set、Redis 锁、状态字段）
- [ ] token 刷新等并发场景有单飞（singleflight）保护
- [ ] 定时任务/队列处理器：同一资源不会被并发处理

## 七、安全

- [ ] 无硬编码密钥、密码、API Key
- [ ] 响应数据不包含 password、secret、token 等敏感字段
- [ ] 文件路径类参数用 `path.basename()` 防路径穿越
- [ ] 日志不打印邮件正文、密码、用户隐私数据

## 八、代码整洁

- [ ] 无 `console.log`（用 NestJS Logger 替代）
- [ ] 无未使用的 import
- [ ] 无注释掉的废弃代码块
- [ ] 无 `// TODO` / `// FIXME`

## 九、冗余检查

- [ ] 无与已有 Service / Repository 方法重复的实现，已直接复用
- [ ] 工具函数 / 类型已提取到公共位置，无跨文件重复定义
- [ ] 无可合并的冗余中间变量或可链式调用的操作

---

## 输出格式

```
【后端自检报告 · <模块名>】

✅ 通过项：XX / XX（N/A：XX）
❌ 发现问题：
  1. [认证] POST /xxx 缺少 @UseGuards
  2. [并发] createAccount 未处理 ER_DUP_ENTRY
  ...

已修复：[列出修复内容]
待确认：[需要用户决策的项]
```
