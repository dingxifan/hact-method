# 前端编码规范 · 技术栈子模板（Vue 3 + Element Plus + Pinia + Vite）

> **栈子模板**：本文件只放 Vue 3 / Element Plus / Pinia / Vite / SCSS 栈特定的写法与陷阱；栈无关原则在通用模板 `frontend.md`。
> 本文件是栈特定候选规则库。播种时按 `project.md` 技术层选用，与通用模板叠加后按 `schema.md` 准入并改写为规则条目；禁止整节复制。项目用其他栈且无对应子模板时，仅从通用候选与已确认的长期栈约束生成。

---

## Vue 组件规范

### 文件结构顺序（强制）

```
<template> → <script setup lang="ts"> → <style scoped lang="scss">
```

### 文件命名（强制）

- 统一 PascalCase，如 `TaskDetail.vue`
- 禁止 kebab-case 命名（如 `task-detail.vue`）
- **router/index.ts 中的组件路径必须与文件名大小写完全一致（PascalCase）**：Windows 文件系统大小写不敏感，错误大小写在本地 Vite dev 不报错，但在 Linux 生产环境会崩溃

### 类型共享规则

- 只在单个组件内用 → 可以定义在组件内
- 跨两个及以上组件使用 → 提取到对应的 `@/api/*.ts` 文件顶部并 export
- 全局通用的枚举 / 常量 → 放入 `@/types/enums.ts`
- 禁止在组件内重复定义已在 store / api / enums 中导出的类型

---

## SCSS 规范

### 引入方式（强制）

```scss
@use '@/styles/variables.scss' as *;   // 正确
@import '@/styles/variables.scss';      // 错误，已废弃
```

- 禁止混用 `@use` 和 `@import`
- 所有 `<style lang="scss">` 块（含 scoped）必须在块内独立声明 `@use`，不继承父级

---

## 异步请求 / 表单验证的栈写法

通用模板「异步请求必须有失败反馈」原则的本栈落法：

```ts
try {
  const res = await getSomething(id)
  data.value = res.data
} catch {
  ElMessage.error('加载失败，请重试')
} finally {
  loading.value = false
}
```

表单验证统一 Promise 式，禁止回调式：

```ts
// Promise 式（正确）
try {
  await formRef.value.validate()
  submitting.value = true
} catch {
  // validate 失败自动走这里
} finally {
  submitting.value = false
}

// 禁止回调式
// formRef.value.validate(async (valid) => { ... })
```

- catch 块透传后端错误信息：`ElMessage.error((err as Error).message || '操作失败')`

---

## Element Plus 使用规范

- **UI 库主题覆盖的本栈变量**：设计主色映射进 `--el-color-primary` 等 EP 主题变量，禁库默认主色（通用模板「UI 库主题覆盖」原则的落点）
- 详情抽屉宽度：`500–520px`，移动端 `width: 100%`
- 编辑表单弹窗宽度：`420–500px`，移动端 `width: 95vw`
- 所有 `el-dialog` 必须加 `align-center`（移动端默认贴顶，体验差）
- 简单确认用 `ElMessageBox.confirm`，type `'warning'`
- 删除操作：必须经过 `ElMessageBox.confirm`
- 表单 `label-width`：主表单 `90px`，简单表单 `80px`
- 日期选择器、下拉框：统一加 `style="width: 100%"`
- 禁止引入新的第三方 UI 库（统一用 Element Plus）

### Element Plus 已知陷阱（禁止重犯）

- **禁止**在 El Plus 组件 tag 上用 inline `style` 或 CSS class 直接控制宽度（用 `div wrapper + :deep(.el-select) { width: 100% !important }` 代替）
- **禁止**用 CSS class / 媒体查询控制 El Plus 组件显隐（用 `v-if` / `v-show` 代替）
- **禁止**用 `el-dropdown` 作为纯图标触发器（会附加视觉样式；改用 `el-popover` 的 `#reference` slot）
- **禁止**将 `el-dialog` 的 `title` prop 设为空字符串（会破坏宽度计算；保留非空值，用 `.el-dialog__title { display: none }` 隐藏文字）
- **禁止** el-select option 的 `value` 使用空字符串（El Plus 视 `''` 为"未选择"，会显示 placeholder；改用 `'all'` 等有意义字符串）

---

## Pinia Store 规范（强制）

- **跨页面刷新的状态必须持久化**：需要在刷新后保留的 store 字段，初始化时从 `localStorage` 读取作为初始值，写入时同步更新 `localStorage`
- **退出登录必须重置所有业务 store**：`logout()` 除清除 auth store 外，必须调用所有业务 store 的 `reset()`，防止脏数据在下次登录时残留

---

## Vite ESM 模块规范（强制）

- **禁止在 Vite ESM 项目中使用 `require()`**：Vite ESM 环境下 `require` 未定义，运行时抛出 `ReferenceError`
