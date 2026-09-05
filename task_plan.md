# 任务计划：方法论瘦身与 develop 审查路由重构

## 目标
在已完成的实证诊断基础上，依据 `_meta/plans/2026-08-09-methodology-slimming-revision-basis.md` 对正式方法论持续瘦身：已完成 Standards/AC/freshness/finding/global seam 与 B 类复审基线 P0；本阶段按 task type/layer/risk 与 fixed changed surface 自动裁剪不适用审查维度，在不削弱 core、sensitive 与 Foundation 探针的前提下减少 N/A 注意力成本。

## 当前阶段
阶段 13（已完成）

## 各阶段

### 阶段 1：建立对照基线
- [x] 读取讨论文档与方法论仓库说明
- [x] 定位两个项目及其工作树、历史与关键产物
- [x] 记录初始假设与约束
- **状态：** complete

### 阶段 2：抽取项目证据
- [x] 对照 standard、V0、AC、实现与独审反馈
- [x] 识别语言差异、真实缺陷、流程性误报和返工链条
- [x] 比较 doc-extract 与 file-extract 的共同模式及差异
- **状态：** complete

### 阶段 3：因果诊断
- [x] 判断开发减速的主要机制
- [x] 区分必要演化与过度约束
- [x] 检验用户关于“代码问题可能不大”的假设
- **状态：** complete

### 阶段 4：形成改进方案
- [x] 提出 standard、V0、AC 与独审规则的调整建议
- [x] 给出保留、修改、移除项及优先级
- [x] 使用具体项目例子验证建议
- **状态：** complete

### 阶段 5：交付
- [x] 检查证据链与结论边界
- [x] 更新规划记录
- [x] 向用户交付诊断与下一步建议
- **状态：** complete

### 阶段 6：正式方法论审计
- [x] 定位 Standards、task package、develop、review brief 与 sprint 接缝审入口
- [x] 建立底稿六项建议到正式文件的映射
- [x] 标出重复规则、冲突措辞与可复用 schema
- **状态：** complete

### 阶段 7：首轮瘦身实施
- [x] 写入 Standards 新定义、对象边界与准入门槛
- [x] 建立 standards 条目迁移审计模板/工作表
- [x] 将 AC 拆为 intent/oracle/example 并定义 golden 规则
- [x] 给 develop review finding 增 type/reachability/impact/action 并收窄“存疑即阻断”
- [x] 在任务拾取阶段加入 freshness preflight
- [x] 定义 global seam review 与 per-task review 边界
- **状态：** complete

### 阶段 8：一致性与回放验证
- [x] 运行仓库现有结构/文本检查
- [x] 检索旧措辞是否仍制造单一整改 loop
- [x] 静态回放 claim failure、真实 behavior bug、example-error、scope-gap 四类案例
- [x] 检查 diff，确认未误删探针、退役账、可达性与干净环境验证
- **状态：** complete

### 阶段 9：交付
- [x] 更新 findings/progress 与变更摘要
- [x] 说明首轮已落地内容、暂缓项与下一轮试点建议
- **状态：** complete

### 阶段 10：运行中 B 类任务自然实验
- [x] 分页读取目标 task 截至当前的完整可见轮次，不干预运行；最终审查结论待该 task 自行完成
- [x] 提取每轮 finding、证据、修改面、审查耗时与重复工作
- [x] 用新 action 路由做反事实重放，区分保留收益与可省成本
- [x] 检查新方法论是否还存在 B 类适配缺口
- [x] 形成当前态验证结论与下一批试点指标
- **状态：** complete

### 阶段 11：B 类效率 P0 补口
- [x] 统一 B 类执行入口或为手动路径增加写代码前 freshness preflight
- [x] 定义 full/targeted review report、稳定 finding id、Git 基线与升降级条件
- [x] 增加 implementation/review/spec 墙钟字段及兼容校验
- [x] 同步执行规范、结构契约、skill、status 模板与 linter
- [x] 用新旧 status/review fixture 验证兼容性和失败路径
- **状态：** complete

### 阶段 12：按 task type/layer 自动裁剪审查维度
- [x] 盘点 develop 独审的现有维度、task type/layer 信号与模板/契约入口
- [x] 定义可解释的适用性矩阵、保底维度与敏感任务升档规则
- [x] 在任务执行与独审输入中生成裁剪后的 review profile，并保留审计记录
- [x] 同步结构契约、模板、用户指引与机械校验
- [x] 用代表性 task type/layer fixture 验证裁剪、保底和升档路径
- [x] 复核 diff、更新记录并交付
- **状态：** complete

### 阶段 13：复盘 fe-b-010 长对话
- [x] 只读取得目标 task 的完整轮次结构、用户节点与墙钟
- [x] 重建实现、复审、escape-hatch、全量验证与交付时间线
- [x] 对照“运行时旧文件”与当前 P0/P1 方法论，分离版本差异和执行不合理
- [x] 给出可操作的保留项、问题、优化建议与预期收益
- **状态：** complete

## 关键问题
1. 哪些独审后错误是真实代码缺陷，哪些只是自然语言、示例和实现之间的表述不一致？
2. standard、V0、AC 是否在重复规定同一件事，却使用了不同抽象层级或词汇？
3. 最近一个月的方法论变化中，哪些改善了质量，哪些把验证成本推迟到独审之后？
4. doc-extract、file-extract 如何具体影响了方法论，影响是否被过度泛化？

## 已做决策
| 决策 | 理由 |
|------|------|
| 仅做只读诊断，不改业务代码或方法论文件 | 用户当前请求是阅读、参照与分析，而非实施修改 |
| 以项目实际产物和提交历史验证讨论文档 | 避免只在方法论文案内部循环论证 |
| 新请求视为正式方法论首轮实施授权 | 用户明确要“据此对这个方法论做瘦身”；范围采用底稿第十一节六项，不扩展到批量重写项目 standards |
| canonical execution plane 为 Windows 工作树 `E:\projects\hact-method-lab` | 唯一 worktree；无运行服务或浏览器；本次仅编辑 Markdown 并用本仓检查工具验证 |
| 阶段 10 采用只读自然实验 | 目标 task 正用旧方法运行；不注入新提示，避免污染对照。WSL task 是被观察执行面，Windows 方法论仓是分析与记录面 |
| 阶段 11 直接补三项 P0 | 用户明确授权；只改 Windows 方法论仓，不改被观察的 WSL 业务项目或运行中 task |
| 阶段 12 以 Windows 方法论仓为唯一执行面 | 本仓无相关运行服务或浏览器 URL；现有 WSL/Node 进程属于其他项目，编辑与测试均在 `E:\projects\hact-method-lab` 完成 |
| 自动裁剪只关闭明显不适用维度，不关闭通用正确性与敏感探针 | 用户指定 P1；目标是减少无关审查成本，而非弱化真实缺陷发现能力 |
| 用确定性脚本生成 project-relative JSON review profile | 让选择结果可复现、可留痕、可在终态审计；避免执行者或审查员凭感觉自行删维度 |
| profile 以 task metadata + 固定 changed files 为输入，缺信号时 fail-safe 扩大 | task type/layer 决定技术面，source/risk/任务包内容补充语义，实际 changed surface 防止只看计划漏掉扩张 |
| 阶段 13 只读审阅目标 Codex task，不向其发送消息或改业务仓 | 用户要求检查对话质量；目标 task 已完成，当前只需证据审计与方法论归因 |

## 遇到的错误
| 错误 | 尝试次数 | 解决方案 |
|------|---------|---------|
| PowerShell standards 历史汇总命令出现空管道元素 | 1 | 先把对象累积到数组，再输出格式化 |
| `develop.md` 大补丁锚点未匹配（空格差异） | 1 | 已重核唯一 Windows worktree；改用短标题/精确原句拆分补丁，不重复原补丁 |
| status freshness 组合补丁 hunk 格式错误 | 1 | 文件未改；删除空 hunk 标记后拆成合法上下文块 |
| 组合读取命令中 `rg` 无匹配返回 exit 1 | 1 | 已确认只是 structural dispatch 无旧 AC 关键词；不重跑同命令，继续处理 TRD 命中项 |
| global seam brief 路径补丁锚点未匹配 | 1 | 重核 Windows 单一执行面并按实际整句定位；已改为项目运行时可达的 `../hact-method-lab/...` 路径 |
| 最终无参运行两个项目校验器只返回用法 | 1 | 不是语法/逻辑失败；脚本要求外部项目参数。保留此前最小 fixture 的 10/10、4/4 功能结果，最终另跑 `node --check` 与静态一致性检查 |
| 阶段 11 规划记录补丁两次锚点不匹配 | 2 | 源码未改；重新确认 Windows 工作树并按文件末尾的准确局部锚点拆分更新 |
| Windows `guide/02*` 通配搜索返回路径语法错误 | 1 | 其余搜索结果有效；后续改为对 `guide` 目录搜索 |
| 临时 fixture 空目录递归清理被环境策略拒绝 | 1 | fixture 文件已由 `apply_patch` 删除；不重试破坏性操作，空目录不进入 Git |
| review profile 单测未识别 `user.repository.ts` 的 query surface | 2 | 第一次确认需支持文件名 token；第二次发现 `repositories?` 不匹配单数 `repository`，改为显式枚举单复数，不再靠可选 `s` 推导 |
| review profile 修复组合补丁 hunk 格式错误 | 1 | 文件未改；重新确认 Windows canonical 工作树后，删除多余 hunk 标记并按稳定 ASCII 正则行重提 |
| review profile 缺元数据 fixture 少选 sensitive-boundaries | 1 | 查询场景已通过；该失败揭示 fail-safe 与实现不一致，改为 metadata incomplete 时也强制选中敏感边界 |
| P1 字段初接入会把完整 P0 审计误判 partial FAIL | 1 | 将旧墙钟/report 字段与新 profile version 分层；迭代扫描保留 P0 链校验并提示缺 profile，显式终态仍硬失败 |
| profile 集成测试误以为成功输出展开单项 pass 文本 | 1 | 审计实际已通过；改按公开契约断言退出码 0 + “失败 0 项”，保留篡改 profile 的反向断言 |
| profile 加固组合补丁含空 hunk 标记 | 1 | 文件未改；重核 Windows canonical 工作树与 UTF-8 后拆为脚本/文档两组稳定锚点补丁 |
| profile 初版指纹未绑定完整任务 frontmatter，Foundation sentinel 未限 task id | 1 | 指纹加入规范输入全文 hash；checker 重算 metadata/signals，并限制 sentinel 仅 `task_id=foundation` |
| profile 指纹若含任务包 `status` 会在终态流转后误判过期 | 1 | 改绑定 normative frontmatter，仅排除顶层运行状态 `status`；新增“规范变化失效 / status 变化不失效”双向断言 |
| planning skill 收尾脚本对中文阶段格式显示 0/0 | 1 | 脚本退出 0 但未识别既有 `### 阶段` 标题；以阶段 12 六项全勾选 + `状态: complete` 为准并记录兼容提示 |
| Windows `rg --files` 结果使用反斜杠，首个只匹配 `/` 的筛选无命中 | 1 | 改为不依赖路径分隔符的关键词筛选，已取得目标规范文件清单 |
| 目标 WSL 环境未安装 `rg` | 1 | 对只读报告清单改用 `find`，正文读取改用 Windows UNC + 显式 UTF-8；未改变目标执行面 |

## 备注
- 用户指定文档当前未被 Git 跟踪，必须保持原样。
- 做重大判断前重新读取本计划与 findings.md。
