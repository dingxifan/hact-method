# exec: init-project

> CC 加载本文时，当前任务是为新项目创建独立仓库（代码 + 协调文件合并）。

**上下文密度**：低。机械化操作为主（Step 1–5、7），单次会话可完整完成；唯 Step 6「项目共识讨论」是发散环节（读背景、摸全貌、填地基蓝图），骑在本 task 内、不另起 task（决策#20）。
**执行位置**：hact-method 工作区；创建目标在 `E:\Group-code-lab\{name}\`。

---

> **步骤协议**：每步完成后输出 `✅ [步骤名] 完成：[2–3 句结论] → 下一步：[步骤名] — [一句说明] 继续？`；🚫 处必须等用户明确回应才继续。

---

## 会话启动

开场说：「我将为新项目创建独立仓库（`E:\Group-code-lab\{name}\`），代码和协调文件合并存放。请确认项目名称（英文或拼音，kebab-case）——名称确认后不再更改。」

🚫 等用户给出项目名称

---

## 执行步骤

### Step 1：名称校验

检查 `E:\Group-code-lab\` 下是否已有同名目录。

- 有冲突 → 告知用户，请求重新命名，回到 🚫
- 无冲突 → 继续

```
✅ 名称校验通过：`E:\Group-code-lab\{name}\` 不存在冲突。
→ 下一步：创建目录结构
继续？
```

🚫 等用户确认

---

### Step 2：创建目录结构

```bash
mkdir -p "E:/Group-code-lab/{name}/iterations/v1/queue/done"
mkdir -p "E:/Group-code-lab/{name}/b-queue"
mkdir -p "E:/Group-code-lab/{name}/_meta/input"
mkdir -p "E:/Group-code-lab/{name}/_meta/sessions"
mkdir -p "E:/Group-code-lab/{name}/scripts"
```

> `_meta/input/`：背景材料、上下文文档（非交付物，供任务会话加载）；`_meta/sessions/`：各任务跨会话接续文件（`{task-type}-progress.md`）；`b-queue/`：B 类任务包（项目级，跨迭代，不依赖活跃迭代）。

Git 不跟踪空目录，必须写入占位文件：

```bash
echo "" > "E:/Group-code-lab/{name}/iterations/v1/queue/done/.gitkeep"
echo "" > "E:/Group-code-lab/{name}/b-queue/.gitkeep"
```

---

### Step 3：写入占位文件

**复制自 `E:\Group-code-lab\hact-method-lab\templates\{产物名}.md`**，把文件内 `{项目名}` 替换为实际项目名，写完确认非空（templates/ 是格式单一真相源，structural §主要产物 只列指针）：

- 项目根 `project.md` / 项目根 `reusables.md` / 项目根 `b-tasks.md` / 项目根 `decisions.md` / 项目根 `backlog.md` / 项目根 `feedback.md`
- 项目根 `design.md`：复制自 `templates\design.md`（空模板——色值 / 字号 / 间距等槽位留空，`draft-ux` Step 1.3 首次 UX 时填变量；是非空模板文件，非空文件）
- 项目根 `foundation.md`：复制自 `templates\foundation.md`（**地基蓝图**空模板——领域地图 / 关注点登记槽位留空，本 spec **Step 6 共识讨论**时填；技术内生清单与安全项「应有档=构造级」已预置。下游 V0 走骨架据此建骨架）
- `status.yml`：复制自 `templates\status.yml`（机器侧状态契约，看板应用取数源，项目级单文件，建一次永远存在；字段见 `../hact-method-lab/skeleton/07-status-contract.md`）

**特殊桩（不走 templates/）**：
- 项目根三份 Standards：建空桩；V0 `draft-foundation` 按 `templates/standards/schema.md` 首播当前稳定默认规则（存量由 draft-tech-design 兜底），后续只更新当前真值

同时写入以下文件：
- `CLAUDE.md`：内容复制自 `E:\Group-code-lab\hact-method-lab\templates\CLAUDE.md`，将 `{项目名}` 替换为实际项目名，`{一句话描述}` 留空待用户补充
- `.claude/commands/gitee-ops.md`：内容复制自 `E:\Group-code-lab\hact-method-lab\templates\.claude\commands\gitee-ops.md`（slash command，输入 `/gitee-ops` 执行 Gitee 仓库操作）
- `scripts/check-docs.js`：内容复制自 `E:\Group-code-lab\hact-method-lab\templates\scripts\check-docs.js`（产物结构 linter，纯 Node 无外部依赖；`draft-prd-vN` Step 7.4 / `draft-tech-design` Step 4 自检 PRD/TRD 结构与交叉一致性时调用）
- `scripts/check-gate.js`：内容复制自 `E:\Group-code-lab\hact-method-lab\templates\scripts\check-gate.js`（Gate 完成判据薄检查器，纯 Node 无外部依赖；`manual-test` 签 G4 前 / `wrap-up-iteration` 签 G5 前核对状态与文件可查判据时调用）
- `scripts/check-sprint.js`：内容复制自 `E:\Group-code-lab\hact-method-lab\templates\scripts\check-sprint.js`（G3 任务包 linter，纯 Node 无外部依赖；`plan-sprint` Step 4.7 签 G3 前核对任务包字段完备 / AC 回链 / queue↔sprint↔status 三方一致时调用）
- `scripts/check-ux.js`：内容复制自 `E:\Group-code-lab\hact-method-lab\templates\scripts\check-ux.js`（draft-ux 产物结构 linter，纯 Node 无外部依赖；`draft-ux` Step 7 签字 commit 时门卫自动核 ux-flows.md 两段结构 + prototype-map.md AC 覆盖表 + prototype.html 存在）
- `scripts/check-reusables.js`：内容复制自 `E:\Group-code-lab\hact-method-lab\templates\scripts\check-reusables.js`（`reusables.md` 登记表 linter，纯 Node 无外部依赖；门卫在「改了 reusables.md」或「本次 commit 有文件删除/改名」时自动核登记路径是否还在——该表被 `draft-tech-design`/`plan-sprint`/`draft-prd-vN` 当权威源读，失真则那些检查静默放行）
- `scripts/pre-commit-hook.sh`：内容复制自 `E:\Group-code-lab\hact-method-lab\templates\scripts\pre-commit-hook.sh`（**门卫**——commit 时按 staged 文件路由跑对应 check-\*.js，红则拦 commit；脚本/node 缺失 no-op 放行。作为 tracked 文件入仓使其随 clone 存活；实际生效需装进 `.git/hooks/`，见 Step 4.1）
- `iterations/.task-package-template.md`（可选参考）：任务包结构模板见 `E:\Group-code-lab\hact-method-lab\templates\queue\task-package.md`，`plan-sprint` 写任务包时套用（YAML frontmatter 序列化）
- `.gitattributes`：写入一行 `*.sh text eol=lf`（**必须**——Windows `core.autocrlf=true` 下 .sh 会被 checkout 成 CRLF，门卫脚本 `#!/bin/sh\r` 在 POSIX sh / git hook 下报 bad interpreter；锁 LF 才能跨平台跑）

---

### Step 4：Git 初始化 + 远端绑定

**4.1 本地初始化 + 装门卫：**
```bash
cd "E:/Group-code-lab/{name}"
git init
# 装 pre-commit 门卫（.git/hooks 不随 clone 走，故源文件已 tracked 在 scripts/，此处装进生效位）
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
git add .
git commit -m "feat: 初始化项目 {name}"
```
> **门卫随 clone 的兜底**：`.git/hooks/` 是本地态、不入版本控制。队友 clone 本仓后须跑一次 `cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit` 才有门卫。未装 = 退回 honor-system（linter 仍可手动跑），与 `--no-verify` 同属"护栏非密码锁"——是合作者的强制出路，非安全边界。

**4.2 强制获取 Gitee 远端地址：**

```
请提供项目的 Gitee 远端仓库地址（格式：https://gitee.com/{user}/{repo}.git）。
远端仓库需在 Gitee 上提前创建好（空仓库即可）。
```

🚫 等用户提供远端地址，**不得跳过**

**4.3 绑定远端并完成首次推送：**
```bash
git remote add origin {gitee-url}
git push -u origin master
```

推送成功后确认：
```
✅ 首次推送完成：{gitee-url}
```

推送失败（如仓库不存在或无权限）→ 提示用户先在 Gitee 创建仓库并确认权限，修复后重试。

**4.4 添加团队成员：**

```
请提供需要加入此项目的团队成员 Gitee 用户名（逗号分隔，如：zhangsan,lisi）。
无需添加成员则直接回车跳过。
```

🚫 等用户回应（可跳过）

有成员需要添加时，还需要 Gitee Personal Access Token 以调用 API：
```
请提供你的 Gitee Personal Access Token（在 Gitee → 设置 → 私人令牌 中生成，需有 projects 权限）。
Token 仅本次使用，不会写入任何文件。
```

从 `{gitee-url}` 中解析出 `{owner}` 和 `{repo}`，逐个添加成员（permission 默认 `push`）：

```bash
curl -X PUT "https://gitee.com/api/v5/repos/{owner}/{repo}/collaborators/{username}" \
  -d "access_token={token}&permission=push"
```

每个成员添加后确认响应状态，失败时报告原因（用户名不存在 / token 无权限等）。

```
✅ 成员添加完成：{zhangsan ✅ / lisi ✅ / ...}
```

**4.5 创建并登记成员个人积累仓（hact-notes）：**

个人 notes 仓**跟人、跨项目**——每人一个，建在**团队 Gitee 命名空间**下，不随项目重复创建。

先确认命名空间：从 `E:\Group-code-lab\hact-method-lab\_meta\hact-config.md`「全局配置」读取 `notes-org`（当前值 `dingxifan`）；缺失则向用户询问一次并补写入配置。

> ⚠️ **`dingxifan` 是 Gitee 企业版（enterprise）不是组织（org）**：建仓必须用 `POST /enterprises/{notes-org}/repos`，用 `/orgs/...` 会 404。

对每个成员（含项目发起人自己）：

1. 查 hact-config.md「成员个人积累仓登记表」是否已有该成员
   - 已登记 → 跳过（已有 notes 仓）
   - 未登记 → 继续
2. 未登记成员，复用 Step4.4 的 Gitee token（需对企业 `{notes-org}` 有建仓权限），用 API 在企业下创建私有仓并只加本人为 push 协作者：

   ```bash
   # 在企业下创建私有仓（auto_init 便于后续直接写 notes.md）
   # 注意：企业版用 /enterprises/ 接口（不是 /orgs/），且私有用 public=0（不认 private=true）
   curl -X POST "https://gitee.com/api/v5/enterprises/{notes-org}/repos" \
     -d "access_token={token}&name=hact-notes-{username}&path=hact-notes-{username}&public=0&auto_init=true"

   # 只加本人为 push 协作者：其他开发者不加 → 无读权限；管理者作为企业 admin 天然只读
   curl -X PUT "https://gitee.com/api/v5/repos/{notes-org}/hact-notes-{username}/collaborators/{username}" \
     -d "access_token={token}&permission=push"
   ```

   建好后用 `templates/hact-notes/notes.md` 初始化该仓 `notes.md`（clone → 写入 → push），并提示成员 clone 到本地 `E:\group-code\hact-notes-{username}\`
3. 把成员写入 hact-config.md「成员个人积累仓登记表」（仓地址 `gitee.com/{notes-org}/hact-notes-{username}`）+「收割游标」表（游标初始"尚未收割"）

> 权限模型：仓私有；只本人是 push 协作者 → 其他开发者无权限；管理者作为企业 admin 对所有 notes 仓天然只读 → 正好用于 `harvest-notes` 收割。已存在的成员直接跳过创建，只确保已登记。
> 完整操作手册（含中途加人、初始化、验证、排错、成员离开）见 `guide/05-个人积累仓管理.md`。

```
✅ 成员 notes 仓登记完成：{新登记 X 名 / 已存在 Y 名}
```

---

### Step 5：注册到看板应用 + 配置 Gitee Webhook

**5.1 读取配置：**

从 `E:\Group-code-lab\hact-method-lab\_meta\hact-config.md` 读取以下值，**无需向用户询问**：

- `{看板应用-url}`：看板应用部署地址
- `{cc-token}`：CC_TOKEN

🚫 等用户提供（可跳过整个 Step 5，跳过则在移交信息中注明"看板应用注册待手动完成"）

**5.2 生成 webhook_secret：**

```bash
# 生成 32 位随机十六进制串
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

记录生成的值为 `{webhook_secret}`。

**5.3 在看板应用注册项目：**

从 `{gitee-url}` 中解析出 `{owner}` 和 `{repo}`，构造标准化 URL（去掉 `.git` 后缀）。复用 Step 4.4 的 Gitee token（若未收集则此处**必须**补收）：

> ⚠️ `gitee_token` 为必填项。看板应用需要用它在服务器端 clone 仓库，缺失则 `local_path` 永远为 null，cron 和 webhook 均无法同步，项目状态永远无法更新。

```bash
curl -s -X POST "{看板应用-url}/api/cc/projects" \
  -H "Authorization: Bearer {cc-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{name}",
    "gitee_repo_url": "https://gitee.com/{owner}/{repo}",
    "webhook_secret": "{webhook_secret}",
    "gitee_token": "{gitee-token}",
    "cc_project_id": "{name}"
  }'
```

- 返回 `201` / 含 `id` 字段 → 注册成功，记录 `project_id`；服务器后台开始 clone 仓库，`local_path` 将在 clone 完成后自动写入
- 返回 `409`（`code: 3002`）→ 项目已存在，跳过，不报错
- 其他错误 → 报告给用户，此步骤标记为待手动完成

**5.4 在 Gitee 配置 Webhook：**

复用 Step 4.4 的 Gitee token（若未收集则此处补收）：

```bash
curl -s -X POST "https://gitee.com/api/v5/repos/{owner}/{repo}/hooks" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "{gitee-token}",
    "url": "{看板应用-url}/api/webhooks/gitee",
    "push_events": true,
    "token": "{webhook_secret}"
  }'
```

- 返回含 `id` 字段 → Webhook 配置成功
- 失败 → 报告原因（token 无权限 / 仓库不存在等）

**5.5 验证 Webhook 链路（必须执行）：**

**5.5.1 等待服务器 clone 完成**

注册后服务器在后台 clone（通常 10–120 秒）。**必须**先确认 clone 完成再验证 webhook，否则 webhook 到达时 `local_path` 仍为 null、sync 被跳过。

判断方式：等约 30 秒后直接做 5.5.2；用以下查询看 sync_event——

```bash
curl -s "{看板应用-url}/api/cc/projects/{project_id}/sync-events?limit=1" \
  -H "Authorization: Bearer {cc-token}"
```

- `status=skipped` 且 `error_message` 含 `no local_path` → clone 未完成，再等 30 秒重试
- `status=failed` 且含 `clone failed` → clone 失败，检查 `gitee_token` 权限后联系管理员

**5.5.2 推送空 commit 验证 Webhook**

向仓库推送一个空 commit：

```bash
git commit --allow-empty -m "chore: 验证 webhook 链路"
git push
```

等待约 10 秒，查询 sync_event：

```bash
curl -s "{看板应用-url}/api/cc/projects/{project_id}/sync-events?limit=1" \
  -H "Authorization: Bearer {cc-token}"
```

- 返回记录且 `status=success` → 链路正常，数据已同步
- 返回记录且 `status=failed` → 报告 `error_message` 给用户
- 无记录 → webhook token 未打通，检查 Gitee webhook 配置中 `password` 字段是否与 `{webhook_secret}` 一致

> 此步是强制验证，不可跳过。token 不匹配会导致 webhook 永远被 401 拒绝，项目状态永远不同步，且没有任何明显报错。

```
✅ 看板应用注册完成：project_id={project_id}，服务器已 clone，Webhook 已配置并验证。
→ 下一步：移交
继续？
```

🚫 等用户确认

---

### Step 6：项目共识讨论 → 填地基蓝图（发散）

> 本步是 init 里唯一的发散环节：在 PRD **之前**先把项目地基立住，让后面所有开发都在它上面累加。**只摸全貌与领域模型，不列功能**（列功能就变 PRD 了）。产物落入 Step 3 已铺的空 `foundation.md`。

**6.1 确认背景材料：** 检查 `_meta/input/` 是否有背景材料。无 → 请用户提供（粘贴或放文件），不得跳过空谈。

**6.2 共识讨论：** 围绕背景，与用户多轮文字沟通，摸清三件事（**不外露过程、不列功能**）：
- 这个应用是什么、解决什么问题、全貌大概长什么样；
- **贯穿全局**的核心实体 / 主数据有哪几个（功能都挂它上面）；
- 是否有**贯穿全局的作用域**（租户/组织/用户/项目）和关键业务不变式。

**6.3 填 `foundation.md`：**
- **「一、领域地图」**：填核心实体表 + 作用域 + 不变式（无则写"无"）。
- **「二、地基关注点登记 + 强制边」**：技术内生清单逐行勾选/删减；从「一」补**领域涌现**行（尤其那个贯穿全局作用域 → 必有一行"数据隔离/作用域"）。
- **立应有档（init 的核心价值）**：逐行确认「应有档」。⚠️ **安全敏感项（数据隔离/鉴权/越权）= 构造级，不可议价**——向用户点明：bar 不在这立，下游再好的人也会滑到手写弱边、漏一行就泄数据（mail-ai/JHH 实证）。「实际形式·档」留空，V0 选栈后填。

> **尺寸纪律**：中小型项目这步是一场短讨论 + 半页 foundation.md，别滚成分析瘫痪。完成判据 = "地基播了种、各方认了"，不是"全貌全想透"；含糊项留空，等开发中 escape 提拔。

**6.4 决定要不要走 V0 走骨架**（A 类项目）：默认**走**——把跨切面地基（瓶颈管道 / 作用域 repo / 外壳 / 主题框架）在 V1 之前一次性建对。**微型项目可声明跳过**（如几页的小工具，多一整轮设计+build 不划算，与 `draft-ux: 需要/不需要` 对称）：
- **走 V0**（默认）→ `draft-foundation` 建 `iterations/v0/`，走 V0 流程。
- **跳过 V0** → **不建 `iterations/v0/`**，直接进 V1；地基代码在 V1 内随功能组织、standards 等首期簇由 `draft-tech-design` 兜底（**等同存量路径**）。**代价**：放弃 V0「强制边在 build 前焊死」的保证，靠 plan-sprint 视觉地基包 + develop 兜——仅微型 / 低风险项目适用。

> `iterations/v0/` 是否存在 = V0 路径的机器信号（跨会话推断据此判，见项目仓 `CLAUDE.md` Step 1）；跳过则该目录不存在、推断自然落到 V1。

🚫 等用户拍板走 / 跳

**6.5 提交：**
```bash
cd "E:/Group-code-lab/{name}"
git add foundation.md && git commit -m "docs: 地基蓝图 v1 播种" && git push
```

```
✅ 地基蓝图就位：foundation.md 已播种（领域地图 + N 个地基关注点，安全项应有档=构造级）。
→ 下一步：移交
继续？
```

🚫 等用户确认地基蓝图无误才继续

---

### Step 7：移交

```
✅ init-project 完成：
- 本地仓库：E:\Group-code-lab\{name}\
- 远端：{gitee-url}
- 地基蓝图：foundation.md（已播种）
- 看板应用：project_id={project_id}（或"待手动完成"）
→ 下一步（按 Step 6.4 的 V0 决定）：
- **走 V0**：`draft-foundation`（V0 地基设计，依 foundation.md 选形式、定栈）→ 签 G2(v0) → `develop(source=foundation)` 建骨架 → V0 端到端跑通后进 V1 `draft-prd-vN`。
- **跳过 V0**（微型项目）：直接 V1 `draft-prd-vN`（地基随功能在 V1 内建，存量兜底路径）。
- B 类需求：直接用 `dispatch-new`。
```

---

## 边界与异常

| 场景 | 处理 |
|------|------|
| 用户只有 B 类需求（无 A 类计划） | 照常初始化，`iterations/` 保留但为空；B 类直接用 `dispatch-new` |
| 项目仓已存在部分文件（历史遗留） | 不覆盖已有文件，仅补缺失的文件和目录 |
| 项目名中途要改 | 需手动 rename 目录，代价较高；务必在 Step 1 确认后再创建，确认后不更改 |
| git init 失败（Step 4.1） | 检查目录权限，修复后重新执行，不跳过 git 初始化 |

---

## Subagent 使用

无。全程使用 Write / Bash 工具直接执行。

---

## 断点续做

检查 `E:\Group-code-lab\{name}\` 目录是否存在及哪些文件已创建；从未完成的步骤继续。
