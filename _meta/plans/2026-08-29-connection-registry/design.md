# 连接与凭据统一寻址（hact-conn）· 设计稿

2026-08-29。驱动：用户提出「每个项目要连 Gitee、SSH 服务器等，缺一个相对统一的方法来发布、调用、存储这些信息」。

## 一、盘出来的现状（改前）

连接信息散在五处，互相不知道对方存在：

| 信息 | 改前住哪 | 毛病 |
|---|---|---|
| Gitee PAT | 环境变量 `GITEE_ACCESS_TOKEN`，取不到回退读项目 `backend/.env` | 把**个人凭据**塞进**应用运行时配置**，语义错位、易随 `.env` 误提交；`gitee-ops` 里同一行读取逻辑复制了 6 遍 |
| Gitee PAT（另一条路） | `init-project` Step 4.4 / 5.3 / 5.4 三处交互式索要，声明"仅本次使用，不写入任何文件" | 同一个 token 一次立项问多遍；不落盘 = 每次立项都要人重新去 Gitee 翻 |
| 看板 base-url + CC_TOKEN | `_meta/hact-config.md`，**明文已入库** | 共享密钥在 git 历史里 |
| 服务器地址 / 构建 / 重启 / 健康检查 | 项目仓 `deployment.config`，**首次 deploy 才创建** | 只服务 deploy 一站；且**没有"怎么连上去"**那一段 |
| SSH 连接 | Claude Code 的 MCP server alias，纯机器本地 | **项目 ↔ alias 的映射无处登记**。`guide/02`、`guide/03` 只写"通过 SSH MCP 连接服务器"，哪个 alias 全靠口口相传；换机不可复现 |
| DB / 第三方 API key | 无任何约定 | — |

真正缺的不是"一个文件"，是三件事：**命名（怎么称呼一个连接）/ 分层（机密与非机密分别住哪）/ 调用（各 spec 统一从哪取，而不是各写各的回退）**。

## 二、方案

按**机密性**劈两层，用 handle 相连：

```
{项目仓根}/connections.yml     入库、零机密。坐标 + ${secret:NAME} 引用。跟项目走。
~/.hact/secrets.env            永不入库、chmod 600。NAME=值。跟机器走，全项目共用。
{项目仓根}/deployment.config   原职不变：构建 / 重启 / 健康检查命令。
```

- **点分寻址**：`gitee.token` / `ssh.prod.host` / `ssh.prod.app-dir` / `db.prod.password` / `api.<服务>.key`
- **handle 命名**：`HACT_` 前缀 + 全大写下划线 → shell 安全，`secrets.env` 可直接 `source`
- **解析顺序**：进程环境变量 → `~/.hact/secrets.env` → 历史别名（`HACT_GITEE_TOKEN` 认 `GITEE_ACCESS_TOKEN`）

最后一条是**零打断迁移**的关键：现有机器已配的 `GITEE_ACCESS_TOKEN` 环境变量直接被认（本机实测确认），不改任何东西也能继续跑。

## 三、为什么是 skill + 脚本，不是纯规范

失效形态早有先例——本仓 2026-08-03 刚撞过"门卫装了没响、无人发现"，2026-07-30 撞过"`reusables.md` 零机器校验、读它的地方越来越多"。连接配置属于同一类：**写在散文里的约定，谁都以为别人在守**。

所以核心是一个可执行的 `check`，把三件事变成机械事实：
1. **零机密**（FAIL）——已知 token 形态 + 机密语义字段的裸串。这是本方案唯一的致命失效，一旦 commit 出去只能靠轮换补救
2. **引用完备**（FAIL）——每个 `${secret:NAME}` 都解析得到值，并直接说缺哪个、往哪补
3. **凭据落位安全**（FAIL）——`~/.hact` 不在任何 git 工作树内

加两条 🧑（判不死、只提醒）：POSIX 权限位（Windows 跳过）、**MCP alias 在本机 MCP 配置中是否找得到**——后者正对着"换机"这个场景，它是唯一不随 `secrets.env` 走的东西。

`--live` 才发外部请求（Gitee `/user` + SSH `BatchMode`），默认不打，门卫也不打——离线 / 慢网不能 brick 提交。

## 四、决策记录

| 岔口 | 选择 | 理由 |
|---|---|---|
| 机密存哪 | `~/.hact/secrets.env` 单文件 | 用户明确要**换机可直接拷贝复用**。代价是明文落盘，用 chmod 600 + git 工作树检测兜；Windows 凭据管理器方案被否是因团队跨 WSL/Win，取值命令不统一 |
| 与 `deployment.config` | **并存分工**，不吸收 | 用户选。分工按**性质**切：连接坐标归 `connections.yml`，构建/重启命令留 `deployment.config`。`server-address` 因此归前者，存量文件里的旧值降为**兼容读**（两处都有以 `connections.yml` 为准），不强制迁移 |
| 覆盖范围 | Gitee + SSH + DB/第三方 API key | 用户选。**看板 CC_TOKEN 明确不纳入本版**——它入库明文的问题仍在 `_meta/hact-config.md`，收敛它需要轮换一次 token，另起 |
| 载体 | skill + 脚本，脚本住 `templates/scripts/` | 脚本随 `init-project` 铺进项目仓 `scripts/`，与既有 5 个 `check-*.js` 同渠道，门卫才路由得到；skill 只是**用法契约**，无第二份脚本副本。播种内容的真相源是 `templates/connections.yml`，脚本在本仓内直接读它，被拷进项目仓后才退回内嵌副本 |

## 五、验证（负向为主）

按 2026-07-12 立的证据化规矩，每条机械声明都亲手撞了反例：

| 用例 | 结果 |
|---|---|
| 全配齐 | exit 0，5 项通过 |
| 含 `#` 的密码经 `get` 取回 | 未被当行内注释截断 |
| 明文 Gitee PAT（32 hex）/ OpenAI 形态 key 入 `connections.yml` | 双双 FAIL |
| 非硬形态裸密码（`password:` 下 23 位串） | 启发式 FAIL |
| `~/.ssh/id_hact` 路径值 | 未误报（路径豁免） |
| `${secret:X}` 无对应值 | FAIL 并指名补哪一行 |
| `secrets.env` 落在 git 工作树内 | FAIL |
| `connections.yml` 缺失 | FAIL 并给 init 指令 |
| 仅有历史 `GITEE_ACCESS_TOKEN` | 正常解析（来源标注为环境变量） |
| `init` 播种 → 立即 `check` | 往返绿；本仓内播种内容与 `templates/connections.yml` 逐字节相同（无副本漂移） |
| **门卫**：提交明文凭据 | **拦下**，未产生 commit |
| **门卫**：改成 `${secret:}` 后重提 | 放行 |
| **门卫**：不碰 `connections.yml` 的提交 | 不触发（按 staged 路由正确） |

## 五之二、交付后当场发现并修掉的一个缺口（handle 撞名）

用户追问「如果某个项目所需信息与其他项目不一致会如何」，盘本机实况时撞出：`connections.yml` 是每项目一份、天然吃得下不一致，但 `~/.hact/secrets.env` 是**全机共用的扁平命名空间**，而初版模板给的项目资源类示例是 `HACT_DB_PROD_PASSWORD`——**项目无关的命名**。

**反例是现成的**：`mail-ai` 与 `org-krm-v2` 都有 `DB_PASSWORD`、都部署在 `47.110.94.114`、连的是不同的库。两边照模板填 → 后填的**静默覆盖**先填的，无任何报错。

修法——handle 分两类，写进模板 / skill / guide，并补一条机械检查：

| 类 | 跟谁走 | 命名 |
|---|---|---|
| 身份类 | 人（跨项目共用一份是**对的**，轮换只改一处） | `HACT_GITEE_TOKEN` / `HACT_SSH_<别名>_PASSPHRASE` |
| 项目资源类 | 项目（**必须带项目前缀**） | `HACT_<项目名大写>_DB_PROD_PASSWORD` / `HACT_<项目名大写>_API_<服务>_KEY` |

`check` 对 `db.*` / `api.*` 下未带项目前缀的 handle 报 🧑（不判 FAIL——多项目合法共用同一个库或同一个第三方账号确实存在）。项目 token 由 `git remote get-url origin` 的仓名推导，无 origin 时退回目录名。实测（remote=`mail-ai`）：`HACT_DB_PROD_PASSWORD` 被点名并给出改名建议，`HACT_MAIL_AI_API_QWEN_KEY` 通过，`gitee`/`ssh` 段的身份类 handle 不受影响。

**值得记的是发现路径**：这个缺口不是审查发现的，是用户问"不一致会怎样"时盘真实项目数据撞出来的——9 个仓的实况（4 个挤同一台服务器、两个各有 `DB_PASSWORD`）在纸面设计时不在视野里。

## 五之三、首次真实落地当场撞出的凭据泄露缺陷（2026-08-30）

六个项目仓落地后第一次跑 `check --live`，报告里出现：

```
[连通:gitee] 未能发起请求（Command failed: curl -s -o /dev/null -w %{http_code}
             https://gitee.com/api/v5/user?access_token=fffbef…）
```

**这个检查器的全部意义是不让凭据外泄，而它自己把 token 打进了标准输出。** 成因是两层叠加：

1. token 放在 `curl` 的 **argv** 里（URL 查询参数）——于是它同时出现在进程列表（`ps`）和 `execFileSync` 抛错时的 `e.message` 里；
2. 异常消息被原样拼进 `human()` 的文案打印出来。

**为什么会被触发**：`-o /dev/null` 在 Windows 上必失败——Git Bash 会翻译 `/dev/null`，但 node 直接拉起的 `C:\Windows\System32\curl.exe` 不认，于是 curl 非零退出、`execFileSync` 抛错、错误消息（含 token）进报告。**平台 bug 把安全 bug 引爆了**；在 POSIX 上 curl 正常返回，这条路径可能很久都不会有人踩到。

**两道修**（不是只修打印）：

- **第一道·token 不进 argv**：改用 `curl -K -`，把 URL 经 **stdin** 送进 curl 配置。凭据既不进命令行，也就不会进进程列表、不会进任何异常消息。
- **第二道·输出兜底擦除**：`resolveSecret` 解析出的每个值登记进 `SEEN`，`redact()` 在 4 个输出点（fails / passes / humans / 顶层 catch）把它们替换成 `***`。第一道防的是已知路径，第二道防的是以后新增的未知路径。

顺带把 `-o /dev/null` 改为按平台取空设备（`win32` → `NUL`），并把 gitee 探测的返回码分级：`200` pass / `401` FAIL（凭据问题）/ 其他 🧑（网络或代理问题，不是凭据问题）——原实现把网络故障一律判成 FAIL，是会制造假阳性的。

**已实测**：修后 `--live` 首次真正打通（`GET /user` 返回 200），六仓输出逐个用 `grep -F "$GITEE_ACCESS_TOKEN"` 验过，均无明文。

**留痕价值**：这条缺陷不是审查发现的，也不是设计时想到的，是**第一次真跑**撞出来的——与本仓反复记过的那类失效同源（写了、没验、于是不发生 / 装了、没触发、于是没人知道它坏）。工具自身的安全属性同样需要一次真实触发才算数。

## 五之四、第二个真实使用撞出的缺陷：层级静默塌陷（2026-08-30）

给 `mail-ai` 补登记第二台主机（`112.124.32.216`，ONLYOFFICE 容器所在机）时，`check --live` 只探到一台，且路径显示成 `ssh` 而不是 `ssh.onlyoffice`。解析结果：

```
ssh.prod = # 应用主机（后端 + 前端）     ← 本该是块起始，被当成了叶子
ssh.host = 112.124.32.216               ← prod 与 onlyoffice 的字段全被压平到 ssh 下，互相覆盖
```

**根因**：键值正则 `^(\s*)([A-Za-z0-9_.\-]+)\s*:\s*(.*)# 连接与凭据统一寻址（hact-conn）· 设计稿

2026-08-29。驱动：用户提出「每个项目要连 Gitee、SSH 服务器等，缺一个相对统一的方法来发布、调用、存储这些信息」。

## 一、盘出来的现状（改前）

连接信息散在五处，互相不知道对方存在：

| 信息 | 改前住哪 | 毛病 |
|---|---|---|
| Gitee PAT | 环境变量 `GITEE_ACCESS_TOKEN`，取不到回退读项目 `backend/.env` | 把**个人凭据**塞进**应用运行时配置**，语义错位、易随 `.env` 误提交；`gitee-ops` 里同一行读取逻辑复制了 6 遍 |
| Gitee PAT（另一条路） | `init-project` Step 4.4 / 5.3 / 5.4 三处交互式索要，声明"仅本次使用，不写入任何文件" | 同一个 token 一次立项问多遍；不落盘 = 每次立项都要人重新去 Gitee 翻 |
| 看板 base-url + CC_TOKEN | `_meta/hact-config.md`，**明文已入库** | 共享密钥在 git 历史里 |
| 服务器地址 / 构建 / 重启 / 健康检查 | 项目仓 `deployment.config`，**首次 deploy 才创建** | 只服务 deploy 一站；且**没有"怎么连上去"**那一段 |
| SSH 连接 | Claude Code 的 MCP server alias，纯机器本地 | **项目 ↔ alias 的映射无处登记**。`guide/02`、`guide/03` 只写"通过 SSH MCP 连接服务器"，哪个 alias 全靠口口相传；换机不可复现 |
| DB / 第三方 API key | 无任何约定 | — |

真正缺的不是"一个文件"，是三件事：**命名（怎么称呼一个连接）/ 分层（机密与非机密分别住哪）/ 调用（各 spec 统一从哪取，而不是各写各的回退）**。

## 二、方案

按**机密性**劈两层，用 handle 相连：

```
{项目仓根}/connections.yml     入库、零机密。坐标 + ${secret:NAME} 引用。跟项目走。
~/.hact/secrets.env            永不入库、chmod 600。NAME=值。跟机器走，全项目共用。
{项目仓根}/deployment.config   原职不变：构建 / 重启 / 健康检查命令。
```

- **点分寻址**：`gitee.token` / `ssh.prod.host` / `ssh.prod.app-dir` / `db.prod.password` / `api.<服务>.key`
- **handle 命名**：`HACT_` 前缀 + 全大写下划线 → shell 安全，`secrets.env` 可直接 `source`
- **解析顺序**：进程环境变量 → `~/.hact/secrets.env` → 历史别名（`HACT_GITEE_TOKEN` 认 `GITEE_ACCESS_TOKEN`）

最后一条是**零打断迁移**的关键：现有机器已配的 `GITEE_ACCESS_TOKEN` 环境变量直接被认（本机实测确认），不改任何东西也能继续跑。

## 三、为什么是 skill + 脚本，不是纯规范

失效形态早有先例——本仓 2026-08-03 刚撞过"门卫装了没响、无人发现"，2026-07-30 撞过"`reusables.md` 零机器校验、读它的地方越来越多"。连接配置属于同一类：**写在散文里的约定，谁都以为别人在守**。

所以核心是一个可执行的 `check`，把三件事变成机械事实：
1. **零机密**（FAIL）——已知 token 形态 + 机密语义字段的裸串。这是本方案唯一的致命失效，一旦 commit 出去只能靠轮换补救
2. **引用完备**（FAIL）——每个 `${secret:NAME}` 都解析得到值，并直接说缺哪个、往哪补
3. **凭据落位安全**（FAIL）——`~/.hact` 不在任何 git 工作树内

加两条 🧑（判不死、只提醒）：POSIX 权限位（Windows 跳过）、**MCP alias 在本机 MCP 配置中是否找得到**——后者正对着"换机"这个场景，它是唯一不随 `secrets.env` 走的东西。

`--live` 才发外部请求（Gitee `/user` + SSH `BatchMode`），默认不打，门卫也不打——离线 / 慢网不能 brick 提交。

## 四、决策记录

| 岔口 | 选择 | 理由 |
|---|---|---|
| 机密存哪 | `~/.hact/secrets.env` 单文件 | 用户明确要**换机可直接拷贝复用**。代价是明文落盘，用 chmod 600 + git 工作树检测兜；Windows 凭据管理器方案被否是因团队跨 WSL/Win，取值命令不统一 |
| 与 `deployment.config` | **并存分工**，不吸收 | 用户选。分工按**性质**切：连接坐标归 `connections.yml`，构建/重启命令留 `deployment.config`。`server-address` 因此归前者，存量文件里的旧值降为**兼容读**（两处都有以 `connections.yml` 为准），不强制迁移 |
| 覆盖范围 | Gitee + SSH + DB/第三方 API key | 用户选。**看板 CC_TOKEN 明确不纳入本版**——它入库明文的问题仍在 `_meta/hact-config.md`，收敛它需要轮换一次 token，另起 |
| 载体 | skill + 脚本，脚本住 `templates/scripts/` | 脚本随 `init-project` 铺进项目仓 `scripts/`，与既有 5 个 `check-*.js` 同渠道，门卫才路由得到；skill 只是**用法契约**，无第二份脚本副本。播种内容的真相源是 `templates/connections.yml`，脚本在本仓内直接读它，被拷进项目仓后才退回内嵌副本 |

## 五、验证（负向为主）

按 2026-07-12 立的证据化规矩，每条机械声明都亲手撞了反例：

| 用例 | 结果 |
|---|---|
| 全配齐 | exit 0，5 项通过 |
| 含 `#` 的密码经 `get` 取回 | 未被当行内注释截断 |
| 明文 Gitee PAT（32 hex）/ OpenAI 形态 key 入 `connections.yml` | 双双 FAIL |
| 非硬形态裸密码（`password:` 下 23 位串） | 启发式 FAIL |
| `~/.ssh/id_hact` 路径值 | 未误报（路径豁免） |
| `${secret:X}` 无对应值 | FAIL 并指名补哪一行 |
| `secrets.env` 落在 git 工作树内 | FAIL |
| `connections.yml` 缺失 | FAIL 并给 init 指令 |
| 仅有历史 `GITEE_ACCESS_TOKEN` | 正常解析（来源标注为环境变量） |
| `init` 播种 → 立即 `check` | 往返绿；本仓内播种内容与 `templates/connections.yml` 逐字节相同（无副本漂移） |
| **门卫**：提交明文凭据 | **拦下**，未产生 commit |
| **门卫**：改成 `${secret:}` 后重提 | 放行 |
| **门卫**：不碰 `connections.yml` 的提交 | 不触发（按 staged 路由正确） |

## 五之二、交付后当场发现并修掉的一个缺口（handle 撞名）

用户追问「如果某个项目所需信息与其他项目不一致会如何」，盘本机实况时撞出：`connections.yml` 是每项目一份、天然吃得下不一致，但 `~/.hact/secrets.env` 是**全机共用的扁平命名空间**，而初版模板给的项目资源类示例是 `HACT_DB_PROD_PASSWORD`——**项目无关的命名**。

**反例是现成的**：`mail-ai` 与 `org-krm-v2` 都有 `DB_PASSWORD`、都部署在 `47.110.94.114`、连的是不同的库。两边照模板填 → 后填的**静默覆盖**先填的，无任何报错。

修法——handle 分两类，写进模板 / skill / guide，并补一条机械检查：

| 类 | 跟谁走 | 命名 |
|---|---|---|
| 身份类 | 人（跨项目共用一份是**对的**，轮换只改一处） | `HACT_GITEE_TOKEN` / `HACT_SSH_<别名>_PASSPHRASE` |
| 项目资源类 | 项目（**必须带项目前缀**） | `HACT_<项目名大写>_DB_PROD_PASSWORD` / `HACT_<项目名大写>_API_<服务>_KEY` |

`check` 对 `db.*` / `api.*` 下未带项目前缀的 handle 报 🧑（不判 FAIL——多项目合法共用同一个库或同一个第三方账号确实存在）。项目 token 由 `git remote get-url origin` 的仓名推导，无 origin 时退回目录名。实测（remote=`mail-ai`）：`HACT_DB_PROD_PASSWORD` 被点名并给出改名建议，`HACT_MAIL_AI_API_QWEN_KEY` 通过，`gitee`/`ssh` 段的身份类 handle 不受影响。

**值得记的是发现路径**：这个缺口不是审查发现的，是用户问"不一致会怎样"时盘真实项目数据撞出来的——9 个仓的实况（4 个挤同一台服务器、两个各有 `DB_PASSWORD`）在纸面设计时不在视野里。

## 五之三、首次真实落地当场撞出的凭据泄露缺陷（2026-08-30）

六个项目仓落地后第一次跑 `check --live`，报告里出现：

```
[连通:gitee] 未能发起请求（Command failed: curl -s -o /dev/null -w %{http_code}
             https://gitee.com/api/v5/user?access_token=fffbef…）
```

**这个检查器的全部意义是不让凭据外泄，而它自己把 token 打进了标准输出。** 成因是两层叠加：

1. token 放在 `curl` 的 **argv** 里（URL 查询参数）——于是它同时出现在进程列表（`ps`）和 `execFileSync` 抛错时的 `e.message` 里；
2. 异常消息被原样拼进 `human()` 的文案打印出来。

**为什么会被触发**：`-o /dev/null` 在 Windows 上必失败——Git Bash 会翻译 `/dev/null`，但 node 直接拉起的 `C:\Windows\System32\curl.exe` 不认，于是 curl 非零退出、`execFileSync` 抛错、错误消息（含 token）进报告。**平台 bug 把安全 bug 引爆了**；在 POSIX 上 curl 正常返回，这条路径可能很久都不会有人踩到。

**两道修**（不是只修打印）：

- **第一道·token 不进 argv**：改用 `curl -K -`，把 URL 经 **stdin** 送进 curl 配置。凭据既不进命令行，也就不会进进程列表、不会进任何异常消息。
- **第二道·输出兜底擦除**：`resolveSecret` 解析出的每个值登记进 `SEEN`，`redact()` 在 4 个输出点（fails / passes / humans / 顶层 catch）把它们替换成 `***`。第一道防的是已知路径，第二道防的是以后新增的未知路径。

顺带把 `-o /dev/null` 改为按平台取空设备（`win32` → `NUL`），并把 gitee 探测的返回码分级：`200` pass / `401` FAIL（凭据问题）/ 其他 🧑（网络或代理问题，不是凭据问题）——原实现把网络故障一律判成 FAIL，是会制造假阳性的。

**已实测**：修后 `--live` 首次真正打通（`GET /user` 返回 200），六仓输出逐个用 `grep -F "$GITEE_ACCESS_TOKEN"` 验过，均无明文。

**留痕价值**：这条缺陷不是审查发现的，也不是设计时想到的，是**第一次真跑**撞出来的——与本仓反复记过的那类失效同源（写了、没验、于是不发生 / 装了、没触发、于是没人知道它坏）。工具自身的安全属性同样需要一次真实触发才算数。

 里的 `\s*:\s*` 已经吃掉了冒号后的空白，于是「只有行尾注释、没有值」的块起始键（`prod:   # 说明`）传给剥注释的那一步时是**纯 `#...`、前面没有空白**，而剥注释用的是 `/\s+#.*$/`——要求 `#` 前有空白，剥不掉。值非空 → 块起始被判成叶子 → 其下整块塌陷到上一层。

**最危险的地方不是塌陷本身，是它不报错**：字段照样解析出 44 个，`check` 照样输出「通过 22 项 / 失败 0 项」。人看 YAML 是对的，机器读到的是另一棵树，而两者之间没有任何信号。同一族的失效本仓记过多次（写了没验 / 装了没触发），这次是**读错了却宣称读对了**。

**两处修**：

1. 剥注释改为 `/(^|\s)#.*$/`，兼容行首 `#`；
2. **加一条确定性检测：同一点分路径被写两次即 FAIL**。塌陷的必然后果就是路径重复（`ssh.prod.host` 与 `ssh.onlyoffice.host` 一起塌成两个 `ssh.host`），后者静默覆盖前者——这是唯一能机械抓住它的信号，且对人为重复键同样有效。

**已实测**：① 构造重复路径 → FAIL 并指出两处行号 + 提示查缩进；② 原塌陷形态现在正确解析出 `ssh.prod.host` 与 `ssh.onlyoffice.host`；③ 六仓复验全绿，`mail-ai` 的 SSH 探测由 1 台变为 **2 台**。

**方法论含义**：这两个缺陷（本节与五之三）都不是审查或设计发现的，都是**第一次拿真实数据跑**撞出来的，且都属于「工具自称正常、实则错了」。这正是本仓 `foundation-review` 2026-07-12 立下的规矩——机械级声明必须以亲手撞过的反例为证——在工具自身上的又一次兑现。

## 六、与机制冻结（2026-07-08）的关系

**判为相容**。冻结的对象是**流程机制**（新 task type / 新 Gate / 新审查层 / 新 subagent 派发点），本次一个都没加：无新 task type、无新 discipline、无新 Gate、无新 subagent。改动全部落在**工具依赖层与既有门卫的一条路由**上，性质与 2026-07-30 的 `check-reusables.js`、2026-08-03 的 `check-sprint.js` 第 9 项同类——给**已在运行的动作**补机械防线，不是新增动作。

## 七、落地实况（2026-08-30）与留给下一轮

**已落地六仓**（用户圈定）：`file-extract` / `document-extraction` / `mail-ai` / `jhh-noriton` / `org-krm-v2` / `awuchi`。每仓＝`connections.yml` 播种 + `scripts/check-conn.js` 分发 + `scripts/pre-commit-hook.sh` 更新 + **门卫装进 `.git/hooks/`**。六仓 `check --live` 全绿、零泄露；门卫在 `awuchi` 做过真触发测试（明文 PAT 拦下、改成 `${secret:}` 放行、不碰该文件不触发、工作区还原）。

**顺带发现的一件事**：本轮开始前 **8/9 仓的门卫都是失效的**——2026-08-29 各仓被重新克隆到 `E:\projects\`，而 `.git/hooks/` 不随 clone 走。方法论自己在 `init-project` 里写过这条兜底（"队友 clone 后须跑一次 cp"），但重建后无人执行，也无任何机械信号会报出来。这是「门卫装了没响」（2026-08-03）的**第三种形态**：装过、响过、然后被一次仓库搬迁静默清零。

**SSH 打通后补齐（2026-08-30 同日）**：用户在自己终端里跑 `ssh-copy-id` 加公钥（本会话内跑不通——`!` 起的进程 stdin 不是真 tty，交互式密码提示读到空），`47.110.94.114` 随即通了（`47.96.22.19` 仍拒，那台只服务本轮范围外的 `loxson-salary-new`）。据此完成：

- **补上两个哪儿都没记的 `app-dir`**：`mail-ai` = `/var/www/mail-ai`，`org-krm-v2` = `/www/org-krm`（**不在 `/var/www` 下**，与同机其余项目都不同——这正是"项目间不一致是常态"的又一实例）。两者此前只能靠登服务器看 `pm2 jlist` 的 `pm_cwd` 才能得到。
- **28 条凭据收进 `~/.hact/secrets.env`**，全部带项目前缀；坐标（DB host/port/name/user、OSS region/bucket、SMTP host/port/from、各 API base-url 与 model、飞书 app-id、Supabase URL、pm2 进程名、端口）写进各仓 `connections.yml`。收集时值只经 stdin 流过，不落任何临时文件、不打印。
- **`doc-extract` 的例外已登记**：它的服务器 env 不在 `.env` 里，而在 `/root/ecosystem.config.cjs` 的 `env` 段（裸 `pm2 restart` 会丢，`deployment.config` 早写过这个坑）。`connections.yml` 里记了 `pm2-config` 指针。
- **撞名检查当场发挥了作用**：`SUPABASE_SERVICE_ROLE_KEY` 在 jhh 的 `backend/.env` 与 `.env.local` 各有一份，收集时后者覆盖前者——用 sha256 比对确认两处同值、覆盖无害。若不同值，这就是一次静默数据丢失。
- **终检**：六仓 `check --live` 全绿（gitee 200 + SSH 免密可达，awuchi 无 ssh 段），撞名风险 0；并用 `grep -F` 拿 28 条真值逐个反查全部 `connections.yml`，**无一命中**——零机密约束在真实数据上成立，不只是在构造用例上。
- **「供查询」用例实证**：`get ssh.prod.app-dir` / `get db.prod.name` / `get storage.oss.bucket` / `get api.smtp.host` 直接返回坐标；`get db.prod.password` / `get api.qwen.key` 正常解析出机密。

**服务器上的意外发现**：`hact-app-backend` 进程**仍在运行**（`cwd=/var/www/hact-app/backend`）。仓库已弃、方法论已全面移除，但线上服务没停——已知会状态，处置由用户定。

**其余留给下一轮**：

- **看板 CC_TOKEN 已随 hact-app 退场整体删除**（2026-08-30），本条了结
- `check --live` 的 SSH 探测走 `ssh` CLI；走 MCP alias 部署的项目会落 🧑 而非 pass——脚本查不到 harness 侧的 MCP 会话状态，只能查配置文件里 alias 名在不在。本机实测：**MCP servers 一个都没配**，即规范里列为必备的 SSH MCP 从未存在
- `loxson-salary-new` / `loxson-ry` / `hact-notes-dingxifan` 本轮未纳入（用户圈定范围外）
