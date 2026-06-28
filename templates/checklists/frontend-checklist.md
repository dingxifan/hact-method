# 前端自检清单

> 前端模块完成后，对照本清单确认**机械项已交给 lint/type-check、可测逻辑已写测试、视觉/交互残量已走查**，输出【前端自检报告】。
> 与 backend 的分区差异：可视区**人能当 validator**（看原型 / 看真应用），渲染行为另有 develop 内置独立审查（设计保真比对）+ integration（pinchtab）+ manual-test 三重兜底——所以前端**不强制"测试品类"**，但纯逻辑能机械验的不该留给肉眼。
> 目标不是"逐条肉眼审代码挑刺"，是"确定性的交给工具、看不见的逻辑写测试、看得见的品味留人走查"。

---

## 一、归 lint / type-check（机械，由工具管，不逐条人审）

下列项确定性可查，靠 `npm run lint` / `npm run type-check`（`vue-tsc --noEmit`）/ `stylelint` 一把过，报错即修，不重复人工核：

- **类型**：API 函数返回类型与后端 `api-contract` / ResponseDTO 对齐，无 `any`；成功/失败返回不同结构时声明 union——`vue-tsc`/`tsc` 报错即类型漂移。
- **代码整洁**：无 `console.log`；无未使用 import；无注释掉的废弃代码块（eslint）。
- **事件监听配对**：`onMounted` 的 `addEventListener` 在 `onUnmounted` 对应 `removeEventListener`，监听函数具名（非匿名箭头）——`eslint-plugin-vue` 相关规则。
- **Element Plus 模板禁忌**：未在 El Plus 组件 tag 上用 inline style 控宽；`el-dialog` `title` / `el-select` option `value` 非空字符串（模板 lint）。
- **硬编码设计字面值**：颜色 / 间距 / 圆角 / 阴影 / 字号写字面值而非 `design.md` 定义的 SCSS 变量（变量已存在却写字面值属违反）——`stylelint` 禁字面值规则。**这是把"设计保真"里可机械的一半从人眼移到工具，直击跨迭代复发的硬编码偏离。**
- **全局样式入口存在**（视觉地基包 PR 必核，后续前端 PR 默认已满足）：`main.ts` 引入了全局 reset + `variables.scss`，且无业务组件各写 `body`/全局样式——grep `main.ts` 引入语句 + grep 各 `.vue` 是否含 `body {`/`html {`。缺失 = body margin、视口外溢无人兜底。
- **UI 库主题被覆盖**（同上，地基包 PR 必核）：存在 design 主色对 UI 库主题变量的覆盖声明（如 `--el-color-primary`），未沿用库默认主色——grep 主题覆盖文件/变量。缺失 = 全站主色仍是库默认。

> **诚实前提（同 backend）**：上述靠**项目真配了对应 eslint/stylelint/vue-tsc 规则**才查得出（通用 lint 默认查不出"硬编码颜色 vs 变量"、事件监听配对、模板禁忌）。项目**未配该规则的项，落到下方「三、留人走查」**，不得当作已被 lint 兜住。

## 二、可测逻辑（接口对接 / 状态 / 表单——可单测的写测试，不强制每类）

纯逻辑（store action / composable / 守卫 / 纯函数）能单测的写测试且跑绿；本次不涉及标 N/A。**渲染行为**（loading 态、刷新、白屏、动效）由 integration（pinchtab）+ manual-test 兜，**不在此硬卡**：

- **状态**：退出登录调用所有业务 store 的 `reset()`、无脏数据残留；多账户切换后数据刷新正确（可对 store 写测试）；需跨页面保留的状态已持久化到 localStorage。
- **边界逻辑**：列表分页参数起始页正确（page 从 1 还是 0）；数字为 `0` 正常显示、不被 `v-if="count"` 误过滤；加载中不闪空态（`v-else-if="!loading && list.length === 0"` 守卫）。
- **表单**：提交前 `await formRef.value.validate()`；提交按钮 `submitting` 防重复提交。

## 三、留人走查（视觉品味 / 交互保真 / 冗余——测·lint 测不动，逐项给结论）

可视区合法的人工大头——人看原型/真应用即真陌生视角：

- **视觉**：字号 / 行高 / 字重观感与 `design.md` 字体系统一致、未自造字号；控件尺寸（按钮高度 / 输入框宽度）符 design.md；列表空态/长文本截断的视觉表现（不撑破布局、不空白区域）。
- **响应式移动端**：弹窗 `95vw`/抽屉 `100%`、输入框 `font-size ≥ 16px`（iOS 放大）、表格 `overflow-x` wrapper、Flex/Grid 多列移动端单列降级、点击区 `≥ 44px`——真机视觉判断（固定阈值如 `font-size ≥ 16px` 若项目配了 stylelint 可上移到「一、lint」）。
- **交互保真**：删除等破坏性操作有二次确认；失败 / 取消 / 空态分支可走通、入口明确、操作成功后列表刷新；与 `prototype.html` 一致（`source=sprint` 由 develop 内置独立审查的设计保真比对 + manual-test 兜）。
- **新增视觉元素** `design.md` 未覆盖时，已暂停向用户确认而非自行决定（🚫）。
- **冗余复用**：无与已有 composable / store action 重复的实现，已直接复用；跨组件复用逻辑已提为 composable；跨组件类型已提取到 `api/*.ts` / `types/enums.ts`，无组件内重复定义或冗余中间变量（品味）。

---

## 输出格式

```
【前端自检报告 · <模块名>】

机械（lint/type-check）：
  npm run lint ✅ / vue-tsc --noEmit ✅ / stylelint ✅（XX 问题已修）
  项目未配规则、落留人的项：[列出，如 stylelint 未配 → 硬编码字面值转走查]

可测逻辑：
  状态 ✅(N 测试) / 边界逻辑 ✅(N) / 表单 ✅(N)；npm run test 全绿（XX passed）
  N/A：[本次不涉及的 + 原因]

留人走查：
  视觉 ✅ / 响应式 ✅ / 交互保真 ✅ / 冗余 ✅
  发现问题 + 处理：[...]
  待确认（视觉/新增元素需用户决策）：[...]
```
