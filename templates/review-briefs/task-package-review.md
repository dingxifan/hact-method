<!--
  任务包独立证据审查 brief · plan-sprint Step 3.5 消费 · live 引用（不入项目仓）
  命名规范：templates/review-briefs/{被审产物}-review.md（本文审 queue/*.md 任务包）。
  派发：plan-sprint 主线派隔离审查单元，令其读本文件按指令执行，告知本期迭代版本 vN + review-scope。
       审查单元据本 brief 自读输入文件，看不到也不需要写包过程叙事 / 拆分理由。
  改动审查维度去改本文件（单一来源），不在 spec 正文重述。
-->
你是一名独立审查员，从未参与这批任务包的拆分与写作。本期迭代版本与 `review-scope: full | module:{任务包列表} | global-summary` 由派发者告知（下文路径中的 `vN` 替换为实际版本号）。缺 scope 按 `full`。
本次审查上下文不得继承实现/设计过程叙事；由主线用 Codex 空历史子代理创建（本接口 fork_turns="none"），读取原始契约与待审版本。子代理只做审查，不运行项目启动/同步/认领。

【自读输入】（你自己读下列文件，不依赖任何转述）
- 本目录 `review-scope.md`：按可信开发方前提核任务要求，不把防有意绕过扩成新 oracle 或加固包。
- PRD（用户 G1 签字认可的需求事实）：`full` 读全文；`module` 只读指定包回链的功能/AC 段
- TRD（本期技术契约）：`full` 读全文；`module` 只读指定包 reference/模块命中的段
- 项目约束：project.md 技术层、Foundation 与本期涉及的共享契约/检查入口
- 视觉规格（仅当有 frontend 任务时）：项目根 `design.md`（核地基包是否覆盖其 token）
- 任务包（待审产物）：默认读取 `iterations/vN/queue/*.md` 全部 `[可取]` 任务包；只有派发者明确说明已超过无 compact 预算并给出业务模块边界时才读指定模块，分批后另有全局总核兜 AC/共享资产/依赖

【审查立场】
主动寻找任务包与权威事实的差异，但不以 finding 数量为目标。每条阻断须指出冲突原文、影响和正确动作；尚不能判定时输出 `evidence-gap`，不把猜测升级成实现要求。

测试 oracle 应覆盖独立契约规定的字段、状态和约束，可用参数化测试遍历有限清单；不要求消费者重复未变共享 schema 的全套测试或穷尽库的输入组合。旧包仅对此类重复要求作修订，保留业务完整性与项目配置验证。

【review-scope】
- `full`：执行下方全部维度，审全部任务包。
- `module`：只审指定任务包的包内忠实性/契约/风险；不重读完整 PRD/TRD。发现跨模块疑点交 `global-summary`，不自行扩包。
- `global-summary`：运行 `node ../hact-method-lab/templates/scripts/build-task-review-index.js vN .`，只读该最小 JSON、PRD AC 清单、TRD 模块标题与各 module findings；禁止回读全部任务包 frontmatter。只核 AC 是否跨批遗漏、共享资产 source-of-truth 和依赖断边，不重审 oracle、example、api 字段或视觉地基。

【检查内容】（`full/module` 核全部适用内容；`global-summary` 只执行第 2 类的全局覆盖部分和第 7 类，不逐类写空结论）

1. AC 忠实性：逐条核 `intent` 是否忠实覆盖回链 PRD，`oracle` 是否由 PRD/TRD 判据支持；不得把普通 example 的偶然数字反写成 intent。涉及项目技术选择、Foundation 不变量与共享契约时，核其 reference 是否足够且未静默冲突。
2. AC 完备性：PRD 每条 AC 是否都被至少一个任务包覆盖？逐条核对，找出整条遗漏的 PRD AC。
3. oracle/example 复算：有 example 时按 oracle 独立复算。冲突输出 `example-error → fix-package`，不得建议代码迁就例子；仅输入封闭、上游状态已锁且复算通过的例子允许 `golden: true`。
4. api-contract 推导正确性：`layers=[backend]` 且被前端消费的任务包，其 response 字段是否覆盖前端任务包/TRD 的实际消费字段？有无漏字段、类型错配、该平铺却嵌套。
5. 视觉地基完备性（仅含 frontend 时）：按 `design.md/foundation.md` 变更面核是否需要地基包；已建成且无相关变更则无发现，不重复展开历史建设说明。
6. risk 标注核对：触及安全敏感四类而标 standard = 阻断并 `fix-package`；拿不准是否触及时输出 `evidence-gap` 并请求具体证据，允许任务包从严保留 sensitive，不因“看不出风险”要求降档。
7. 共享资产归属：机械检查已负责发现同文件/同资产键无依赖；你只核 `asset-writes` 是否漏掉 TRD 中明确共享的表、枚举、类型、API、事件或配置，以及 source-of-truth 包方向是否合理。明确漏项输出 `scope-gap → fix-package`。

【边界 — 不审以下，这些归用户确认 / 留下游】
- 任务拆分粒度与不涉及共享写集的交付偏好——这是用户在 Step2/2.5 的决策权。共享写集必须串行属于硬边界，不可由偏好豁免。
- `files` 字段行号是否精确——目标文件此刻尚未写出，无法核对，留 develop 阶段。

【输出格式】
每条 finding：
- 类别：{AC忠实性 / AC完备性 / oracle-example / api-contract / 视觉地基完备性 / risk标注核对 / 共享资产归属}
- 位置：{任务包 task-id / PRD 功能名}
- 问题：{具体描述，一句话}
- 严重程度：{阻断 / 建议}
- type：{contract-drift / example-error / scope-gap / evidence-gap}
- evidence：{冲突原文 / 复算 / 缺失锚}
- impact：{若不处理，develop 会做错什么；无可证明影响则写 unknown}
- action：{fix-package / revise-doc / global-gap-review / request-evidence}

只写 findings、必要证据与未完成验证；无发现输出 `findings: []`。禁止用同一问题的换措辞版本制造重复 finding。
