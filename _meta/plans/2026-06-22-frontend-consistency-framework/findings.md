# findings.md — 前端规范一致性框架

> 触发来源：JHH-Nortion 组件复用与规范一致性审计（`C:\Users\Administrator\Downloads\JHH-Nortion 组件复用与规范一致性审计.md`）
> 讨论日期：2026-06-22
> 性质：方法论讨论，未落地任何 spec 修改
>
> **2026-06-28 续**：hact-app v8 视觉低级错误（主色全错/视口外溢/侧栏宽错/脚栏带没做）暴露本框架的**结构盲区**——本框架是「逐组件复用 + 逐规则 lint」视角，假设每个违规挂在某业务包里；但 EP 主题覆盖 / 全局 reset / body margin 这类**跨切面公共件不属于任何业务包**（reusables 管现成组件、lint 管单文件，两道防线之间的缝）。补「视觉地基包」一格 + token 落地门禁落 develop lint 层 + 视觉冒烟断言前移到联调，三件已落地，见 `_meta/plans/2026-06-28-visual-baseline-package/`。本框架的组件复用部分（check-reusables / 复用决策字段 / 交互模式规格）仍待。

---

## 一、JHH-Nortion 审计暴露的两个结构性失效

**失效一：规范存在于文档，但执行路径上没有防线**

| 问题 | 规范在哪 | 防线在哪 |
|---|---|---|
| 枚举重声明（A） | display-labels.ts 是权威源 | 无 lint，本地 const 是最小阻力路径 |
| 硬编码色（E） | tailwind.config.ts 有 token | 无 lint，hex 字面量直接写没人拦 |
| 无 Toggle 组件（D） | design.md 有规格 | 无"新元件必须落代码"的强制点 |

**失效二：reusables.md 不可信 → 理性选择变成重写**

C 问题（幽灵资产 StatusSelect、废弃矛盾 RelatedPagesList）是放大器：开发者查表失败一次后失去信任，B 问题（未复用 RelationSelector）是对不可信注册表的理性响应，而非个人疏忽。

---

## 二、三个规范维度

前端开发一致性需要管理三个独立维度：

| 维度 | 内容举例 | 当前问题 |
|---|---|---|
| **视觉规则** | token 使用、间距、字号 | 有规范无 lint，最小阻力路径绕过 |
| **组件复用** | 何时用哪个现成组件 | 注册表不可信，查表不如重写 |
| **交互模式** | 何时用 Modal/浮层/inline；防抖时长；loading/error 态 | 散落各开发者决策，跨期不一致 |

---

## 三、完整框架：三维度 × 四站点

| 维度 | TRD | plan-sprint | develop | wrap-up |
|---|---|---|---|---|
| **视觉规则** | 播种/增补 standards-frontend.md → 转化 lint 规则 | — | lint 自动拦截 | — |
| **组件复用** | 识别本期组件缺口，标记"需新建+登记" | 查 reusables.md，将复用决策写入任务包 | 按任务包执行 | 更新 reusables.md，跑 check-reusables.js |
| **交互模式** | 通用约定进 standards；功能特定的写进接口设计段 | 功能特定决策流入任务包技术要求字段 | 按任务包执行 | 新模式沉淀进 standards |

**TRD 是三件事的同一站点**：规则播种、组件缺口发现、交互模式决策。这三件事都需要在 TRD 阶段输出，才能让任务包在 plan-sprint 时写准。

---

## 四、开发者入口（执行协议）

任何临时上岗的开发者（或 CC 新会话）拿到：

```
任务包（已预解）
  ├── 要做什么（AC + 功能描述）
  ├── 用哪个组件（plan-sprint 已决策，来自 reusables.md）
  ├── 交互模式（TRD → plan-sprint 已决策）
  └── 技术要求（防抖时长、加载态、错误处理方式）

lint（自动运行）
  └── 视觉规则、枚举重声明 → 提交即拦截

design.md（按需查）
  └── 只用于 lint 和任务包都没覆盖的视觉判断
```

执行协议本身应极短：**从任务包出发，lint 兜规则，不确定的视觉问题查 design.md。**

---

## 五、跨迭代飞轮

```
TRD（播种规则 + 发现缺口 + 决策交互模式）
  ↓
plan-sprint（复用决策写入任务包；plan-sprint Step 3.5 验证复用和交互决策的合理性）
  ↓
develop（执行；新建组件时标记待登记）
  ↓
wrap-up（更新 reusables.md + check-reusables.js + 新模式进 standards）
  ↓
下一期 TRD 有更完整的 standards 和 reusables 作为基础
```

**飞轮的三个前提条件**：
1. reusables.md 可信 → check-reusables.js 在 CI 跑
2. lint 规则完整 → TRD 每期认真做 standards 增补
3. 任务包决策字段被认真填 → plan-sprint Step 3.5 独立审查覆盖复用和交互模式维度

---

## 六、决策时机原则

**"判断时机越早，跨期一致性越高"**：
- 视觉规则判断 → TRD 时转化为 lint（develop 时无需判断）
- 复用决策 → plan-sprint 时锁定进任务包（develop 时无需判断）
- 交互模式 → TRD + plan-sprint 时确定（develop 时无需判断）

反之，任何留到 develop 阶段的开放判断，都会随开发者不同、迭代不同而产生漂移。

---

## 七、后端的三维度映射

同样的框架适用于后端，维度对应如下：

| 维度 | 前端 | 后端 |
|---|---|---|
| **规则层** | 视觉 token、枚举单一来源 | 响应格式统一、入参校验位置（DTO 层）、错误抛出方式、权限守卫写法 |
| **复用层** | UI 组件（reusables.md） | 分页 helper、过滤器构建器、通用 DTO、错误类层级、查询工具函数 |
| **模式层** | 交互形态（Modal/浮层/防抖时长） | API 设计约定（软删除方式、批量失败处理、事务边界位置） |

管理结构相同：规则层进 lint，复用层进 reusables.md（后端区块）+ check 脚本，模式层在 TRD 确定后流入任务包。

---

## 八、后端的两处关键差异

**差异一：规则层更容易机械化**

前端有"视觉判断"（颜色对不对、布局是否符合设计），无法完全机械化，design.md 和 manual-test 里有不可避免的人工成分。

后端没有这个问题。响应格式是否一致、入参有没有校验、有没有漏权限守卫——TypeScript strict + ESLint 自定义规则基本全覆盖。**后端规则层的机械化覆盖率比前端高。**

**差异二：后端多一个主力机制——测试**

前端质量底线靠"规范一致性"（lint + 复用 + 人工走查）。后端有一个更强的机制：**AC → 测试 → 自动验证行为正确性**。

```
TRD 把 AC 精化成 Given/When/Then 规格
  → 任务包携带测试要求
  → develop 1:1 写成可跑测试
  → 测试绿 = 行为正确（不是"遵循了规范"，是"输出是对的"）
```

这是后端独有的优势，也是两者质量底线的本质差异：
- 前端质量底线 = 规范一致性，靠 lint + 人工走查兜底
- 后端质量底线 = 行为正确性，靠测试直接验证，lint 和规范是次级防线

---

## 九、后端完整流程

```
TRD
  ├── 播种/增补 standards-backend.md → 进 lint（TypeScript strict + ESLint 自定义规则）
  ├── 识别共享工具缺口（如"需新建通用分页 helper"）→ 标记本期新建+登记
  ├── 精化 AC 为 Given/When/Then 规格（测试脊柱，功能特定）
  └── 功能特定模式决策（软删除方式、事务范围）→ 写进接口设计段

plan-sprint
  ├── 复用决策（用哪个现成 util/helper）→ 写入任务包
  └── 测试要求（来自 TRD Given/When/Then）→ 写入任务包 acceptance-criteria 字段

develop
  ├── 按任务包执行
  ├── lint 自动拦规则违反
  └── 写测试并跑绿（验行为正确性，不是检查规范遵循）

wrap-up
  ├── 更新 reusables.md 后端区块
  └── 新模式沉淀进 standards-backend.md
```

---

## 十、Standards 的三层结构

每个项目的语言、框架、架构不同，因此 standards 应分三层而非两层：

| 层次 | 位置 | 内容 | 跨项目性 |
|---|---|---|---|
| **方法论层** | hact-method `templates/standards/` | Standards 应该有哪些章节、如何播种增补、如何机械执行——**结构和机制，不含具体规则** | 所有项目通用 |
| **技术栈层**（当前缺失） | hact-method `templates/standards/frontend-vue3.md` 等 | 特定技术栈的默认规则（如"NestJS 永远在 DTO 层校验入参"）——同栈多项目可直接继承 | 同技术栈项目通用 |
| **项目层** | 项目仓根 `standards-frontend.md` 等 | 这个项目的具体规则，TRD v1 播种（从技术栈模板或空白模板）、vN+1 增补 | 项目独有 |

**实际影响**：
- hact-method 的模板应保持"结构 + 提示问题"，不写死具体规则内容
- 多个项目共用同一技术栈时，建技术栈子模板可避免每次从零写公共规则
- 技术栈层目前在 hact-method 中缺失，是一个待补充的结构
