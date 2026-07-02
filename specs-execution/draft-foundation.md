# exec: draft-foundation

> CC 加载本文时，当前任务是为新项目做 **V0 地基设计**：定栈、把 `foundation.md` 每块关注点选定具体形式并验"实际档 ≥ 应有档"、首期播种 standards、定走骨架范围与标杆切片，签 G2(v0)。
> **只产文档（设计），不产代码。** 公共形式的代码（瓶颈管道 / 作用域 repo / 外壳 / 主题框架 / 错误信封）由下游 `develop(source=foundation)` 物化——设计预写代码 = 空中建筑（2026-06-16 铁律）。

**上下文密度**：中。读 `foundation.md` + 背景 + project.md；输出更新 foundation.md + 三份 standards + `iterations/v0/foundation-design.md`。

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

**前置检查：foundation.md 已播种**

读项目根 `foundation.md`：
- 不存在 / 「一、领域地图」核心实体为空 → 阻断：「⚠️ 地基蓝图未播种，请先完成 init-project 的 Step 6 项目共识讨论再做地基设计。」
- 已播种 → 继续

> V0 是项目第一份设计，**无 PRD、无 G1**。地基设计据 foundation.md（领域+关注点+应有档）展开，不读 prd.md（尚不存在）。

**建 V0 迭代目录**（不存在则建）：
```bash
mkdir -p "iterations/v0"
[ -f iterations/v0/gates.md ] || printf '# Gates · v0（走骨架）\n\n- [ ] G2：地基设计已确认 —\n' > iterations/v0/gates.md
```

**必读文件**（用 Explore subagent 并行读，默认指定 `model: "haiku"`，不占主线）：
- 项目根 `foundation.md`（核心输入：领域地图 + 关注点登记 + 应有档）
- `_meta/input/` 背景材料
- 项目根 `project.md` / `decisions.md` / `reusables.md`
- `../hact-method-lab/templates/standards/backend.md` / `frontend.md`

**首次定栈**（V0 必为首期）：询问用户技术栈偏好（语言 / 框架 / 数据库 / UI 库），确认后写入项目根 `project.md` 技术层，后续迭代复用、不再问。

开场说：「我将做 V0 地基设计：先按地基蓝图定栈和跨切面架构轮廓，再逐块选定形式并验强制边达标，播种 standards，最后定走骨架范围和标杆切片、签 G2。**这步只出设计，骨架代码在下一步 develop 建。**」

🚫 等用户确认技术栈偏好

---

## 第一层：架构轮廓

### Step 1：跨切面架构轮廓

按 `foundation.md`「二、地基关注点登记」逐行，结合已定栈，给每块选一个**具体形式/实现**——**每项只写一行**，不展开：

```markdown
## V0 架构轮廓

### 后端瓶颈管道（穿过它）
- 鉴权卫士：{框架机制，如全局 Guard}
- 作用域注入：{中间件，注入 foundation「一」的贯穿作用域}
- 入参校验：{校验管道}
- 错误信封：{全局异常 filter，统一返回形态}
- 响应包装：{成功拦截器}

### 数据层（穿过它）
- 作用域 base repo：{基类/查询层，把作用域焊进查询——数据隔离的构造级载体}

### 前端
- 外壳（住进它）：{AppLayout / 路由外壳}
- 环境基线（被它笼罩）：{全局样式入口 + UI 库主题覆盖 + token 接线}
- 状态四态（往里填）：{数据页脚手架}
- HTTP 单例（穿过它）：{api client + 拦截器注入 token/作用域}
```

🚫 等用户确认架构轮廓（每块形式选型）

---

## 第二层：落实地基 + 走骨架设计

### Step 2：填 foundation.md「实际形式·档」+ 强制边诊断（核心）

逐行回填 `foundation.md`「二」表的「实际形式·档」列：一列内同时写**具体形式 + 实际档**，格式 `{具体形式}（{档级}）`——如 `NestJS 全局 Guard + APP_GUARD 注册（构造级）`、`作用域 base repo 焊死 where（构造级）`、`stylelint 禁裸值规则（机械级）`。只写形式漏档级、或只写档级漏形式都不合格。逐行对照「应有档」：

- 实际档 ≥ 应有档 → 通过。
- ⚠️ **安全敏感项（数据隔离 / 鉴权 / 越权）实际档未到构造级 → 不通过**：重选形式（如把"手写 where"改成"作用域 base repo 焊死"），到构造级为止；确实无法构造级 → 列疑点向用户明示风险，不静默放过。
- 命门自检：逐行问"**一个图省事的人在这顺手写，会合规吗？**"——答否说明形式没顶到位。

原地更新项目根 `foundation.md`（活文档），不另存副本。

🚫 等用户确认每块实际档达标（尤其安全项构造级）

---

### Step 3：写走骨架设计 `iterations/v0/foundation-design.md`

把 Step 1 架构 + 各块契约落成可供 develop 建造的设计（**薄**——地基件多是已知样板，重点在契约与连接，不堆细节）：

```markdown
## 走骨架设计 · v0

### 一、地基件清单（develop 要建的承重墙）
逐件：名称 / 形式 / 关键契约（如错误信封 schema、作用域 repo 方法签名、主题 token 接线方式）

### 二、贯穿作用域的构造级落地
{作用域 base repo 怎么让"不带作用域就查不了"——数据隔离构造级的具体机制}

### 三、标杆穿透切片
选一根**最小真实业务切片**（取自 foundation「一」核心实体的最简单一个），端到端走通 前端→API→DB，证明架构闭环。
- 切片：{选哪个实体的什么最小操作}
- 端到端路径：{前端外壳内一页 → http 单例 → 管道 → 作用域 repo → DB}
- **它同时是标杆模块**：按范本质量建，develop 末端登记进 reusables.md 供后续照抄。
```

> **纪律：只立承重墙、不装修。** 一根穿透切片证明架构即可，不建投机的完整框架；地基件保持最小可用，vN+1 增补。

---

## 第三层：Standards + 收尾

### Step 4：维护项目 Standards（首期播种）

三份 `standards-{shared,frontend,backend}.md` 是**项目根跨迭代活文档**，V0 **首期播种**（此后各迭代原地增补）。TRD 确认后启动 **2 个并行 subagent** 处理 frontend / backend，主线处理 shared。

**来源规则（双源）**：从 `../hact-method-lab/templates/standards/{layer}.md` 挑本项目相关项写入（不全量复制）+ 并入执行人个人 notes（`../hact-notes-{name}/notes.md`）`[规范]` 标签条目（并入前对照公共模板去重）。notes 不存在 / 无 `[规范]` → 仅用公共模板。与公共模板某条冲突 → 以本项目决策为准，记 `decisions.md`。

**测试基建约定（不可省）**：`standards-backend.md` 必含「测试框架约定」一节——框架选型 + `npm run test`（或等价）命令 + 测试文件位置。这是后续 develop 把不可视区 AC 落成可运行测试的前提；没有它 develop 的测试步无处落地。在此确立框架，并写入 `project.md` 技术层。

**视觉地基约定（含前端时不可省）**：`standards-frontend.md` 必含三条强制（模板 `templates/standards/frontend.md` §设计系统已带，播种取全）——① stylelint 禁硬编码字面值（颜色/间距/字号）② UI 库主题覆盖（设计主色映射进 `--el-color-primary` 等、禁库默认主色）③ 单一全局样式入口。这是 V0 develop 建「视觉地基件」、frontend-checklist 机械核、视觉冒烟断言三处的共同 owner。具体 stylelint 规则属技术栈层，按本项目 UI 库写实。

> **本步只搬不改**：standards 暂按公共模板形态播种，「每条标执行者（构造/机械/人审）」的诚实化是后续单独议题，V0 不做。

三份汇总后检查无重复 / 无矛盾 / 覆盖架构轮廓所有关键约束。Subagent 返回空 / 跑偏 / 超时 → 主线接管该份，记原因。

---

### Step 5：知识沉淀

- 更新项目根 `decisions.md`：追加本期关键架构决策（栈选型理由 / 各地基件形式选择 / 安全项构造级机制；格式：决策 / 原因 / 日期）。
- 更新项目根 `project.md` 技术层：栈 / 数据库 / 模块划分 / 测试框架。

---

### Step 6：G2(v0) 签字

> **签字前置**：foundation.md「实际档」逐行 ≥ 应有档（安全项构造级）+ foundation-design.md 含地基件清单与标杆切片 + 三份 standards 已播种 + 栈写入 project.md。

```
✅ V0 地基设计完成：栈 = {…}；地基件 [N] 件，安全项均构造级；标杆切片 = {…}；standards 三份已播种。
要签 G2(v0) 吗？
```

🚫 等用户确认

用户确认 → 写 `iterations/v0/gates.md`：
```markdown
- [x] G2：地基设计已确认 — {YYYY-MM-DD}
```

**更新项目根 `status.yml`**（字段见 `../hact-method-lab/skeleton/07-status-contract.md`）：建 `iterations.v0` 块、`gates.G2 = { signed: true, date: {YYYY-MM-DD} }`（文件不存在则先从 `../hact-method-lab/templates/status.yml` 补建）。

执行 `git add foundation.md standards-shared.md standards-frontend.md standards-backend.md iterations/v0/foundation-design.md iterations/v0/gates.md project.md decisions.md status.yml && git commit -m "feat(foundation): v0 地基设计完成，G2 签署 [{项目名}]" && git push`

移交：「V0 地基设计完成，下一步建走骨架 —— `develop(source=foundation)` 按 `iterations/v0/foundation-design.md` 建地基件 + 标杆切片，骨架端到端跑通后才进 V1 `draft-prd-vN`。」

---

## 红线

- **禁止产代码**：本步只出设计文档；瓶颈管道 / base repo / 主题框架等公共代码归 V0 `develop(source=foundation)`。
- **禁止安全项停在弱边**：数据隔离 / 鉴权 / 越权的实际档未到构造级，不签 G2（重选形式或列疑点）。
- **禁止厚走骨架**：只立承重墙、一根穿透切片证明架构，不建投机完整框架。

---

## Subagent 使用

| 触发点 | Subagent 任务 | 失败处理 |
|--------|-------------|---------|
| 会话启动 | Explore 并行读输入文件（foundation.md / background / project.md / 模板 standards；纯读取+摘要，指定 `model: "haiku"`） | 读取失败则主线单独读，不阻断 |
| Step 4 standards 播种 | 2 个并行 subagent 各处理一份（frontend / backend 首期播种） | 失败则主线接管该份，记原因 |

---

## 上下文管理 / 断点续做

- Step 1（架构轮廓确认后）可做一次 compact，compact 前在 `_meta/sessions/draft-foundation-progress.md` 记录：栈选型 + 架构轮廓（各块形式选型）。
- **断点续做**：读 `foundation.md`「实际形式·档」列判断填到哪、读 `iterations/v0/foundation-design.md` 判断写到哪、读 `iterations/v0/gates.md` 判断 G2 是否已签；以工作区实际为准，从未完成处继续。
