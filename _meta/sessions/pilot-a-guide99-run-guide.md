# Pilot A 执行指南：guide/99-任务速查表.md 补全

> 本文件只服务本次 Pilot A 试跑，跑完记得把结果和评估一起带回 CC 会话。
> 交接包本体见同目录 `pilot-a-guide99-method-change-handoff.md`（Codex 要读的是那份，不是这份）。

## 这次要验证什么

Pilot A 的目标不是"guide/99 有没有被修好"（这个任务本身很小，我自己五分钟就能改完）。
真正要验证的是：**只给 Codex 一份落盘的 handoff + 短卡，它是否能不靠人补口头背景，
自己完成一次范围可控、有验证、诚实报告的方法论修改**。所以下面每一步都围绕"怎么让这次
测试保持干净"来写。

---

## 第 1 步：确认交接包已落盘（已完成，可跳过）

`pilot-a-guide99-method-change-handoff.md` 已经写好在
`_meta/sessions/` 下。**不要在打开 Codex 之前口头跟它补充任何背景**——它需要读的信息都应该
已经在那份文件里，这正是本次要验证的东西。如果你打开文件看完觉得信息不够，回来告诉我，
我们改交接包，而不是等会儿开了 Codex 会话再临场补。

## 第 2 步：在正确的目录打开 Codex CLI

**关键节点，容易踩坑**：本仓有两个 worktree，指向同一个 git 仓库的不同分支：

| Worktree | 路径 | 分支 | 有没有 codex-adapter/ |
|----------|------|------|----------------------|
| hact-method-lab（当前，新方法） | `/home/administrator/group-coding/hact-method-lab`（WSL 原生路径） | `method-lab` | **有** |
| hact-method（旧基线） | `E:\group-code\hact-method`（即 `/mnt/e/group-code/hact-method`） | `master` | **没有** |

`codex-adapter/` 目录和这次要改的 `guide/99-任务速查表.md` 的遗漏，都只存在于
`method-lab` 分支。如果 Codex CLI 在 `E:\group-code\hact-method` 打开，它既读不到交接包，
也读不到当前版本的 guide/99，会直接卡在"handoff 不完整"。

操作：

```bash
cd /home/administrator/group-coding/hact-method-lab
# 确认分支和交接包都在
git branch --show-current   # 应显示 method-lab
ls _meta/sessions/pilot-a-guide99-method-change-handoff.md
```

确认无误后，在**这个目录**里启动 Codex CLI 会话。如果你的 Codex CLI 只能在 Windows
侧跑、访问不到 WSL 原生路径，先告诉我，我们要么把这次试点挪到 Windows 可达的路径，
要么换一种交接方式——不要将就着在错误分支上跑，那样这次试点的结果没有意义。

## 第 3 步：开场指令——只指路，不解释

进入 Codex 会话后，**第一条、也应该是唯一一条背景性指令**，原文照抄，不要改写、
不要加你自己的解释：

```
读取 _meta/sessions/pilot-a-guide99-method-change-handoff.md，
按其中的格式和 codex-adapter/specs/method-change.codex.md 执行。
```

不要补充"这个任务是要修一下速查表漏了两个任务"之类的话——哪怕你觉得这样说更清楚、
更省事。本次试点要观察的恰恰是：**去掉这句好心的口头补充之后，Codex 单靠两份文件
能不能自己搞明白该做什么**。如果它做错了或者卡住了，那是交接包或短卡的问题，
留到评估阶段记录，不要当场用嘴修正它。

## 第 4 步：Codex 执行期间，观察这几个节点

不需要逐字看它输出的每一句话,但下面几个时间点值得停下来看一眼，这些也是
`codex-adapter/specs/method-change.codex.md` 里规定的步骤:

1. **它有没有先读 handoff，再读 skeleton/04，再动手**（对应短卡 Step 1/2），
   还是没读完就开始改文件。
2. **它有没有做"现状扫描"再编辑**（短卡 Step 3）——比如先 `rg` 一下 guide/99
   现有内容和 skeleton/04 的 14 条任务列表做对照，而不是凭感觉直接写。
3. **修改范围有没有越界**——它应该只碰 `guide/99-任务速查表.md`。如果它开始
   顺手改 `skeleton/`、`specs-*`、别的 guide 文件，这是明确的越界信号，记下来。
4. **`draft-foundation` 的 Gate 有没有写对**——handoff 里特意强调要写
   `G2(v0)` 而不是简写成 `G2`。这是一个"细节是否被认真读进去"的试金石,
   如果它写成了普通 G2，说明它没有真正吃透 handoff 第 3 节的决策说明,
   而只是扫了一眼字面任务清单。
5. **它有没有在最后跑验证、诚实报告未运行项**——按短卡 Step 5/6,
   应该输出「修改文件 / 验证 / 范围说明 / 建议下一步」这几块,而不是一句
   "改完了"就结束。

如果 Codex 中途主动问你补充背景、或者表现出"信息不够"的犹豫,**这本身就是一个数据点**,
记下来,但不要顺手就在对话里给它口头解释——先看它自己怎么处理"信息不足"这种情况
（按短卡,它应该停下来报告"handoff 不完整"或列出扩读理由,而不是靠猜）。

## 第 5 步：带回 CC 的东西

Codex 跑完后,把下面这些一起带回来给我（贴文本或截图都行）:

1. Codex 最终输出的完整「Codex method-change 结果」那段（修改文件 / 验证 / 范围说明 /
   建议下一步）。
2. `git diff` 的实际结果（在 Codex 改完之后,在同一个仓库跑 `git diff -- guide/99-任务速查表.md`）。
3. 第 4 步里你观察到的任何异常点（越界、卡住、问你要背景、跳过验证等）。
4. 如果 Codex CLI 界面上能看到本次调用的 token/费用/耗时,一并记下——这是为了填
   `pilots/evaluation-checklist.md` 的「成本对比」栏,不需要精确,量级即可。

我拿到这些之后会做两件事：核对 diff 是否真的达成了第 5 节的四个具体任务、以及
帮你一起把 `codex-adapter/pilots/pilot-plan.md` 的「每次试点后的记录」和
`pilots/evaluation-checklist.md` 填完,再决定要不要按顺序进 Pilot B。

## 不需要你做判断的部分

- 用不用批准 Codex 的文件写入权限、要不要让它跑 shell 命令,按你 Codex CLI 本身的权限提示走
  即可,这次任务只涉及一个 markdown 文件的编辑和几条只读检查命令（`rg` / `git diff`）,
  没有需要人工裁决的安全敏感操作。
- 这次不涉及"是否允许 Codex 写回状态"的问题（那是 develop handoff 才有的字段）,
  method-change handoff 本来就是直接改文件、不涉及任务状态写回。
