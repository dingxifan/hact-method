# 前端模块自检清单

> 每个前端模块完成后对照此清单逐项检查，输出【前端自检报告】。
> 目标：以"挑刺"视角找出尽可能多的潜在 bug，而不只是确认功能完整。
> 每条标 ✅（通过）/ ❌（有问题，必须修复）/ N/A（本次改动不涉及，直接跳过）。

---

## 一、接口对接

- [ ] API 函数的返回类型与后端 ResponseDTO 一致，无 `any`
- [ ] 接口有多种返回结构时（如成功/失败返回不同字段），前端声明了 union 类型
- [ ] 接口字段名与后端一致，无拼写错误导致静默 undefined
- [ ] 列表接口的分页参数传递正确（page 从 1 还是 0 开始？）

## 二、状态管理

- [ ] 需要跨页面保留的状态已持久化到 localStorage
- [ ] 退出登录调用了所有业务 store 的 `reset()`，无脏数据残留
- [ ] 多账户场景下，切换账户后数据刷新正确，不展示上一个账户的数据

## 三、加载与错误状态

- [ ] 所有异步操作有 loading 状态，防止重复点击
- [ ] loading 在 `finally` 中重置，不会因异常永远 loading
- [ ] catch 块透传后端错误文案：`ElMessage.error((err as Error).message || '操作失败')`
- [ ] 请求失败不会导致页面白屏或无响应

## 四、空状态与边界

- [ ] 列表为空时有空状态提示，不展示空白区域
- [ ] 数据加载中不展示空状态（用 `v-else-if="!loading && list.length === 0"`）
- [ ] 长文本有截断处理，不撑破布局
- [ ] 数字为 0 时正常显示，不被 `v-if="count"` 之类的判断误过滤

## 五、表单与操作

- [ ] 表单提交前有 `await formRef.value.validate()`
- [ ] 提交按钮有 `submitting` 状态防重复提交
- [ ] 删除操作经过确认弹窗
- [ ] 操作成功后列表数据刷新，不需要手动刷页面

## 六、事件监听

- [ ] `onMounted` 中添加的 `window.addEventListener` 在 `onUnmounted` 中对应移除
- [ ] 监听函数是具名函数（不是匿名箭头函数），确保 `removeEventListener` 能正确移除

## 七、响应式与移动端

- [ ] 所有弹窗移动端宽度 `95vw`，抽屉 `100%`
- [ ] 输入框移动端 `font-size ≥ 16px`（低于 16px iOS 会放大页面）
- [ ] 表格有 `overflow-x: auto` wrapper，移动端不横向溢出
- [ ] Flex/Grid 多列布局有移动端单列降级
- [ ] 按钮点击区域 `≥ 44px × 44px`

## 八、Element Plus 禁忌

- [ ] 未在 El Plus 组件 tag 上用 inline style 控制宽度
- [ ] 未用 CSS class/媒体查询控制 El Plus 组件显隐（用 v-if/v-show）
- [ ] `el-dialog` 的 `title` prop 不是空字符串
- [ ] `el-select` option 的 value 不是空字符串

## 九、代码整洁

- [ ] 无 `console.log`
- [ ] 无未使用的 import
- [ ] 无注释掉的废弃代码
- [ ] 跨组件复用的类型已提取到 `api/*.ts` 或 `types/enums.ts`，组件内无重复定义

## 十、冗余检查

- [ ] 无与已有 composable / store action 重复的实现，已直接复用
- [ ] 跨组件复用的逻辑已提取为 composable，无粘贴复制
- [ ] 无可用计算属性代替的重复表达式或冗余中间变量

## 十一、设计保真（对照 design.md / 原型）

> 对照项目根 `design.md`；有 `iterations/vN/prototype.html` 时一并对照交互路径。

- [ ] 字号 / 行高 / 字重与 `design.md` 字体系统一致，未自造字号
- [ ] 颜色 / 间距 / 圆角 / 阴影 / 过渡用 `design.md` 定义的 SCSS 变量，无硬编码字面值（变量已存在却写字面值属违反）
- [ ] 控件尺寸（按钮高度 / 输入框宽度）符合 design.md 控件规范
- [ ] （若有 prototype.html）实现的交互路径与原型一致，happy path 之外的分支（取消 / 失败 / 空态）未遗漏，入口明确
- [ ] 新增视觉元素若 design.md 未覆盖，已暂停向用户确认而非自行决定

---

## 输出格式

```
【前端自检报告 · <模块名>】

✅ 通过项：XX / XX（N/A：XX）
❌ 发现问题：
  1. [接口对接] EmailList.vue 的 email.inboxCardType 无类型声明
  2. [事件监听] resize 监听未在 onUnmounted 移除
  ...

已修复：[列出修复内容]
待确认：[需要用户决策的项]
```
