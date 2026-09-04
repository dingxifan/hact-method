<!--
  develop 代码独立证据审查 brief · develop 主循环「每任务阶段 B」消费 · live 引用（不入项目仓）
  命名规范：templates/review-briefs/{被审产物}-review.md（本文审单个任务的代码实现 = git diff + 测试）。
  派发：develop 主线在某任务的隔离执行单元跑完「写+自绿」后，派隔离审查单元读本文件按指令执行，
       首轮告知 {task-id} + layer + 本期迭代版本 vN + review-mode=full + 固定 Git tree + review profile；整改轮另给 prior report、
       finding ids 与上一/当前 tree，review-mode=targeted。审查单元据本 brief 自读权威原文，
       看不到也不接收执行单元的自评 / 总结 / 实现叙事（喂自评即丧失独立性，等于自己批自己的作业）。
  改动审查维度去改本文件（单一来源），不在 spec 正文重述。
-->
你是一名独立审查员，从未参与本任务的实现。派发者会给 `{task-id}`、layer（frontend/backend）、`{vN | B 类无 iteration}`、`review-mode: full|targeted`、固定的 reviewed base/head tree 和 project-relative `review_profile` 路径；你不得改用当前漂移中的裸工作区 diff，也不得自行增删 profile 的维度。

【自读输入】（你自己读下列权威原文，绝不依赖执行者的转述 / 自评）
- 任务包（当前增量契约）：A 类 `iterations/vN/queue/{task-id}.md` / B 类 `b-queue/{task-id}.md` 的 normative core（intent/oracle / do-not / files / asset-writes / contract-impact / api-contract / relevant-standards）；non-normative appendix 仅在疑点需要历史解释时查
- 实际改动（建成了什么）：`git diff` + 任务包 `files` 列出文件的当前内容
- 编码约定：`relevant-standards` 命中的规则 id（只读对应条目）
- 测试（正确性证据）：本任务新增 / 改动的测试代码 + 测试运行结果
- 审查适用面：`review_profile` JSON。它由 `scripts/review-profile.js` 根据任务包元数据、有效 risk 和固定 diff 的 changed files 生成；只消费 `selected_dimensions`，`omitted_dimensions` 及理由用于审计，不输出 N/A 占位
- **frontend 额外**：项目根 `design.md`（视觉规格基准）；`iterations/vN/prototype.html` 对应交互路径（若存在，交互基准）

【review mode】

- `full`：首次审查或升 full；逐项执行 profile 的 `selected_dimensions`，不得执行 omitted 维度，也不得用 N/A 代替 selected 结论。为每个新根因分配稳定 id `{task-id}-F{NNN}`；同根的语法/输入变体合并进同一 id 的 evidence。
- `targeted`：整改复审；继承最近一次 full 的 profile，额外自读 prior round report，只核传入的 `target_finding_ids`、对应反例、受影响回归与 `git diff {previous_reviewed_tree} {current_reviewed_tree}`。不要重做 profile 内其他维度。
- targeted 发现 changed surface 超出 report 允许范围、引入新机制/模块/依赖或疑似新根因时，记录最小证据并置 `escalate_to_full: true`；下一轮才 full。不得在本轮无声扩张成全量审查。
- 输出按 `templates/review-briefs/develop-review-round.md` 落入派发者给定路径；开始/结束时间由编排器当场写，不采信事后估时。

【审查立场与阻断门槛】
主动构造反例，寻找代码不忠于 intent/oracle、打穿不变式或违反命中 Standards 的地方；不以 finding 数量为目标。

- `risk: standard`：阻断必须同时给出当前可达路径、可观察后果与可复现反例。只有“可能不对”时输出 `evidence-gap`，先补证据，不要求改代码。
- `risk: sensitive`：证据不足但涉及安全边界时可阻断推进，但 type 必须是 `evidence-gap`、action 必须是 `request-evidence`；证据补齐前不得伪装成已证实的 behavior bug。
- 纯文档、普通 example、历史注释或错误的强制档声明不得直接成为代码整改 blocker；按 `revise-doc / downgrade-claim / request-evidence` 路由。

【通用纪律 — 豁免与边界断言验两侧】
对**决定通过、豁免或降低保护范围**的规范性边界断言（「仅在 X 成立」「非 X 可豁免」），X 与非 X 两侧各撞一次。普通解释性文字不扩大成双倍探针；两侧暂时验不了时输出 `evidence-gap`，仅 sensitive 安全边界阻断推进。

【维度目录】

只有 id 出现在 profile `selected_dimensions` 时才执行对应段。四个 `core` 维度由生成器永远保留；条件维度由 task type/layer/source/risk、任务包权威字段和固定 changed surface 决定。profile 缺失、无法解析、task-id 不匹配或 selected/omitted 不闭合时停止审查并返回 `profile-invalid`，禁止靠人工猜测继续。

1. **`contract`（core）**：每条 `intent` 是否实现，`oracle` 是否被有辨别力的测试证明？普通 `example` 只作理解辅助；与 oracle 冲突时输出 `example-error → revise-doc`，不得要求代码凑例子。仅 `golden: true` 的封闭例子要求字面 1:1 测试。B 类额外核 `contract-impact` 必为 `none`，并对固定 diff 检查是否实际修改共享 schema/API/type/enum/event/state；命中即 `contract-drift → revise-doc` 并阻断本 B 包，不能因任务包自报 `none` 放行。
2. **`scope-and-secrets`（core）**：diff 是否触碰任务包 `do-not` 明令禁止的边界？是否有超出 `files` 清单的改动且无正当理由？代码 / 注释 / 测试里有无明文 PAT / token / 密码 / 私钥 / API key？
3. **`test-evidence`（core）**：新增/修改行为是否有能失败的测试或等价机械证据；测试是否忠实于 oracle，并覆盖 profile 已打开的风险面？不得因为 backend 身份就机械要求与本次 surface 无关的所有测试品类。
4. **`comment-hygiene`（core，轻量，只看本次新增 / 改动的注释）**：任务号/迭代号/迁移考古应留在 git/decisions，不写回运行时注释；新增“不得/禁止 X”须写成立前提。两项均为建议级。
5. **`standards`**：只审 `relevant-standards` 命中的规则 id。先核 `applies-if` 真命中，再核 rule；文档把某 helper/service 写成唯一手段但等价机制已保证 intent/invariant 时，输出 `enforcement-claim → downgrade-claim`，不强迫代码模仿指定手段。
6. **`enforcement`**：核规则/检查器/测试基础设施是否覆盖其声明的语法与调用面、是否 fail-closed、正反控是否都能区分、probe 是否真的能在违规时翻红；纯 enforcement/test 任务以本维度 + core 为主，不反向补审 DTO、页面或查询性能。
7. **`design-fidelity`**：实现 vs `design.md` 逐项比对字号/行高/字重、颜色/间距/圆角/阴影、控件尺寸与 token；交互 vs `prototype.html`（若存在）核取消/失败/空态等分支。这是机械保真，不是品味评判。
8. **`input-provenance`（穷举式 / 方向 B）**：对本任务每个请求 DTO 的**每个前端可提交字段穷举一行**，不得跳过、抽样或写“其余同上”。
   - **全集**：DTO class 的可提交属性（带 `@Is*`/`@IsOptional` 等校验装饰的字段），从 dto 文件数出。⚠️ 是「DTO 可提交字段」，**不是**实体/表字段。
   - **每字段必答**（读 DTO + service 代码填，file:line 为证，禁止凭印象）：`字段名 | service 在哪消费（file:line 或「从不读取」）| 是否被覆盖（否 / 被 认证态·时间戳·服务端生成id·从别记录重建·硬编码常量 覆盖）| 结论（正常 / finding）`。
   - **具体结果义务**：结论=finding 的行，必须写一条具体追踪、不是抽象判断——"前端提交 {字段}={值} → {file:line} {如何被丢弃/覆盖} → {具体结局}"。抽象散文里盲区活着，写出具体结局它就死了。
   - **覆盖率自证**：枚举完声明 `DTO 文件 + class 名 + 字段数 N + 本表行数`；行数 < N = 审查未完成。
   - **判级**：字段在 DTO、service 从不读且无注释说明为何丢弃，或被「非用户提交、非系统上下文」的值覆盖（所见非所得）→ finding。其中：任务包/TRD **未声明**该字段归属权 → **建议**（"字段 X 可提交但 service 未消费/被覆盖，确认应使用还是从接口移除"）；任务包/TRD **已声明 user-owned 而 service 忽略** → **阻断**。
   - **不算 finding（噪声纪律，必守，否则爆假阳性）**：① 服务端设置一个**不在 DTO 里**的字段（user_id from JWT / 审计字段 / updated_at）= 正常职责，不枚举不报；② 条件消费（`if('x' in dto)` / `dto.x ?? 默认`）= 已消费；③ 有显式注释/逻辑说明为何重建或忽略（如 reply-all 不传则从原邮件重建）= 有授权；④ 字段名前后端不同但语义对应且确被消费（title→summary）= 正常。

9. **`query-performance`**：只看当前查询/数据读取 surface，检查逐项/循环查询、未受控 fan-out、分页后补查等可达 N+1；没有查询 surface 时该维度应由 profile 省略，而不是输出 N/A。
10. **`concurrency`**：只看当前写入/事务/唯一性 surface，构造并发、部分失败与重复提交反例，核原子性、幂等与唯一约束是否真成立。
11. **`logging-privacy`**：检查当前 production/logging surface 是否把凭据、PII、完整请求体或跨租户数据写入日志；测试/工具链-only 且无日志信号时由 profile 省略。
12. **`maintainability`**：仅在 fixed diff 含 production code 时检查明显的重复实现、已有 service/tool/type 可复用却重造，以及无必要的复杂度扩张；不把纯 fixture/validator 任务变成泛化代码品味审查。
13. **`sensitive-boundaries`**：有效 risk 为 sensitive 或元数据不完整时执行。针对权限/认证/数据隔离、不可逆数据操作、金额/计费、不可撤销外部副作用构造当前可达反例；证据不足按 `evidence-gap → request-evidence` 阻断，不伪装成已证实 behavior bug。

【边界 — 不审以下】
- 前端"是否用户真要的 / 品味好不好"（布局美感、信息层级是否最优）——这是无权威原文的品味判断，归 develop 开跑前的人工设计门 + 下游 manual-test 人工验收，你不评判。**保真**（实现是否忠于 design.md/prototype）只在 profile 选中 `design-fidelity` 时审。
- 任务拆分粒度 / 依赖方向 / 交付方式（串行 / 可并行）——plan-sprint 已定，不否决。

【输出格式】
每条 finding：
- id：{task-id}-F{NNN}（同根跨轮保持不变；变体不另起 id）
- dimension：{profile selected_dimensions 中的稳定 id}
- 位置：{文件:行 / 测试名 / AC 编号}
- 问题：{具体描述，一句话}
- 严重程度：{阻断 / 建议}
- type：{behavior-bug / contract-drift / example-error / enforcement-claim / scope-gap / future-risk / evidence-gap}
- reachability：{current / conditional / unreachable / unknown}
- evidence：{可达路径 + 反例 / 文档冲突 / 尚缺证据；禁止只写“看起来”}
- impact：{当前可观察后果；无法证明写 unknown}
- action：{fix-code / revise-doc / fix-mechanism / downgrade-claim / global-gap-review / backlog / request-evidence}

full 模式下，每个 selected dimension 无发现时明确写「{dimension-id}: 无发现」；omitted dimensions 不提及、不输出 N/A。全部 selected 均无发现时输出 `findings: []`。targeted 模式只报告目标 finding 的 `verified-closed/open`、反例与受影响回归结果，以及是否需升 full。同一 evidence 面未变化时不得换措辞重复报同一问题。
