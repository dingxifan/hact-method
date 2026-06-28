# findings.md — 视觉地基包 + token 落地门禁 + 视觉冒烟断言

> 触发：v8 开发包全 [merged] + 绿测试 + 联调 35 场景全绿，人工验收一打开即发现 15 条系统性视觉偏离（主色全错 EP 默认 #409eff vs 设计 #3370ff、16px 视口外溢、侧栏宽 180 vs 208、脚栏带整块没做）。
> 性质：方法论调整。**并入 2026-06-22「前端规范一致性框架」（待议 #17/#18）一起落地**，不另起炉灶。
> 用户原始总结四根因 R1–R4 见对话。

---

## 一、与既有框架的关系（不重复造）

v8 这次的 R1/R4 不是新发现——2026-06-22 框架已识别且 parked 在待议 #17：

| v8 根因 | 对应 2026-06-22 框架 | 状态 |
|---|---|---|
| R1 token 定义了没接线 | 「视觉规则维度 → lint」 | 已想清，未落地 |
| R4 像素无机械门禁 | 「lint + 人工走查兜底」 | 部分 |

**真正的新增量是 R2/R3**：旧框架是「**逐组件复用**（reusables.md）+ **逐规则 lint**（单文件违规）」视角，它假设每个视觉违规都挂在某个组件包里。但 **EP 主题覆盖 / 全局 reset / body margin / 脚栏带这类跨切面公共件不属于任何业务包**——plan-sprint 按页/组件切包时天然漏掉。这是 reusables（管现成组件）与 lint（管单文件）**两道防线之间的结构缝**。「视觉地基包」概念是这次最有价值的产出，旧框架没有这一格。

---

## 二、关键洞察：唯一捕捉网在末端

整条流水线里 **manual-test 是视觉问题的唯一捕捉网，而它在最后一环**。这些错不是「开发时引入的」，是「一直存在、到验收才第一次被人眼看到」。修法 = 把捕捉网从 manual-test 往前移 + 在源头建地基。

---

## 三、三件套的「货币」分账（诚实账）

| 件 | 治 | 性质 | 落点 | 与既有关系 |
|---|---|---|---|---|
| ① 视觉地基包 | R2/R3 | **预防·真新增（ADD）** | plan-sprint 骨架规则 + Step 3.5 维度 + check-sprint 软核 | 旧框架缺的格，核心增量 |
| ② token 落地门禁 | R1 | **预防·concretize 待议#17** | standards-frontend + frontend-checklist + draft-tech-design 播种 stylelint | = 框架「视觉规则→lint」，本就要做 |
| ③ 视觉冒烟断言 | R4 | **侦测·前移捕捉网** | generate-integration-tests 完整档 | 复用既有 pinchtab，小 ADD |

④（design.md 升级为带 AC 锚点）**并进 ③**——锚点本质就是 ③ 要断言的那几条（主色实测、外溢=0、关键容器尺寸），不单列一层制度。

---

## 四、两处类别纠正（用户原稿需修正）

**纠正 1：② 不能写进 check-sprint.js / check-gate.js。**
用户原稿提「token 落地可写进 check-sprint.js / check-gate.js」。但这两个 linter 核的是**markdown 产物 / status.yml**，不是代码库——**G3 时根本还没有代码**（代码在 develop 写）。「裸 hex grep、EP 主题是否被覆盖、全局样式入口是否存在」都是**代码级检查**，必须在 develop 跑（stylelint + lint），由 draft-tech-design 播种规则。强行塞进 check-sprint 是范畴错误。

② 因此**三段拆分到正确的层**：
- 计划保证（地基包在 sprint 里）→ G3 / check-sprint（属任务包集，= 件①的软核）
- 代码保证（无裸 hex、主题被覆盖、全局入口在）→ develop lint / pre-commit（stylelint + 项目侧）
- 运行保证（实测 CSS 变量 == 设计）→ 件③冒烟

**纠正 2：token 的具体规则是技术栈层、不进 hact-method 通用模板。**
按 2026-06-22 findings §十「standards 三层结构」：hact-method 模板只留「结构 + 机制」，具体 stylelint 规则（哪个 UI 库、哪些文件路径）是**技术栈层**，由 draft-tech-design 在项目仓播种 `standards-frontend.md` + stylelint 配置。所以**不在 hact-method 新建通用 `check-visual-tokens.js`**。

---

## 五、明确拒绝的 over-engineering（反 sub7 / 防膨胀）

Explore 调研建议里这些**不做**，理由记此防反复：

| 建议 | 拒绝理由 |
|---|---|
| 像素快照 / visual regression CI | 重基建、跨平台脆、维护成本高；冒烟断言（几条确定值比对）已覆盖 80%，ROI 远高 |
| design-tokens.json 导出工具链 | design.md → variables.scss 是人工一次性映射，加导出管线是伪自动化 |
| 任务包加 `visual-tokens-required: [...]` 字段 | 给所有包加字段噪声，绝大多数任务不需要；地基包用一个 marker 足够 |
| check-gate.js 加视觉完备性 | G4/G5 时视觉已由冒烟+manual-test 覆盖，重复设卡 |
| 通用 check-visual-tokens.js 进 hact-method | 规则是技术栈层（见纠正 2），通用脚本写不准 |

---

## 六、地基包的「触发」怎么定（语义软触发，不硬机械化）

「这是不是视觉基线迭代」是语义判断，难纯机械触发。采用**幂等口径**而非脆弱的版本判断：

> **涉及前端的迭代，若项目尚无视觉地基落地（全局 reset + UI 库主题覆盖 + design.md token 全局接线），则地基包是前端首包，其余前端任务 depends_on 它。** 地基一旦建成（通常 v1），后续迭代不重建、只依赖。

- plan-sprint 里是**骨架规则 + Step 3.5 一个新审查维度**（语义判断留 subagent + 签字人）。
- check-sprint 里是**软核（human 级提示）**：若有 frontend 任务且 sprint 内无地基包标记 → 提示签字人确认「项目已有地基 or 本期需补」。不做硬 FAIL（触发是语义的）。

---

## 七、落点清单（已核对真实文件结构）

| # | 文件 | 改动 |
|---|---|---|
| ① | `specs-execution/plan-sprint.md` | Step 2 骨架规则（地基包首包）+ Step 3.5 新维度 |
| ① | `templates/scripts/check-sprint.js` | 软核：有前端任务且无地基包标记 → human 提示 |
| ① | `templates/queue/task-package.md` | 地基包的轻标记说明（task_type 或 title 约定，不加新字段） |
| ② | `templates/standards/frontend.md` | 补「全局样式入口 + UI 库主题覆盖」两条强制规则（当前只有禁硬编码） |
| ② | `templates/checklists/frontend-checklist.md` | 段一加「主题覆盖存在 + 全局入口存在」机械项 |
| ② | `specs-execution/draft-tech-design.md` | standards 播种时确立 stylelint 禁字面值 + 主题覆盖约定 owner |
| ③④ | `specs-execution/generate-integration-tests.md` | 完整档涉视觉基线迭代时必跑 + 固化 3 条机械视觉断言 |
| ③④ | `templates/design.md` | 加一小段「视觉冒烟锚点」（主色/视口/关键容器，供 ③ 断言取数） |
| — | structural 镜像 | plan-sprint / generate-integration-tests 完成判据同步 |
| — | `_meta/plans/2026-06-22-.../findings.md` + 待议 #17 | 标注「地基包」缺口已补 + 本轮落地 |

---

## 八、未决/待确认（给用户）

1. 地基包触发口径用「幂等·尚无地基则首包」（§六）——是否认可，还是要更硬的「v1 必有 / design.md 变更即触发」。
2. ③ 完整档「涉视觉基线迭代必跑」——基线迭代的判定同 §六口径；非基线迭代维持「按需」。
3. 是否本轮一并把 2026-06-22 框架的**组件复用**部分（reusables.md check）也落，还是只落 v8 暴露的视觉地基三件（建议只落三件，复用部分留 #17 原条目，避免一次摊太大）。
