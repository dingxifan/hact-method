# Method Change Handoff：CC → Codex

> 本模板用于 Claude Code 将 hact-method 方法论仓的局部修改交给 Codex。
> 目标是让 Codex 做边界清晰、可验证的文档或脚本改动，而不是重新讨论方法论方向。

## 使用前提

适合交给 Codex 的方法论修改：

- 修改目标已经由 CC / 人类确认。
- 影响文件范围可以列出。
- 不需要长时间发散讨论。
- 可以用 `rg`、diff、脚本或清单验证。

不适合交给 Codex 的方法论修改：

- 尚未确定要改什么。
- 涉及多条核心决策的方向重构。
- 需要跨项目研究、访谈或大量历史追溯。
- 用户还在探索多个方案。

## 交接包格式

```markdown
# Codex Method Change Handoff

## 1. 基本信息

- repository: E:\Group-code-lab\hact-method-lab
- change-id:
- title:
- owner:
- date:

## 2. 修改目标

用 3-5 句话说明本次要解决什么问题。

## 3. 已确认决策

- 决策 1：
- 决策 2：
- 决策 3：

## 4. 修改范围

### 允许修改

- `{path}` — `{原因}`

### 禁止修改

- `{path}` — `{原因}`

### 只读参考

- `{path}` — `{用途}`

## 5. 具体任务

- [ ] `{任务 1}`
- [ ] `{任务 2}`
- [ ] `{任务 3}`

## 6. 一致性要求

- 术语：
- task type：
- 路径：
- Gate / status：
- 模板字段：

## 7. 验证方式

- `rg "{旧术语或旧路径}"`
- `node --check {script}`
- `git diff --check`
- 手工核对 `{file}`

## 8. 输出要求

Codex 完成后必须说明：

- 修改了哪些文件。
- 每个文件为什么改。
- 跑了哪些验证。
- 哪些验证未运行及原因。
- 是否发现超出 handoff 的问题。
```

## 执行纪律

### 1. 不扩大方向

Codex 只执行 handoff 中已确认的修改。发现更大的方法论问题时，记录为建议，不直接改。

### 2. 尊重旁路边界

若任务声明“不改主体方法论”，Codex 只能改指定实验目录，例如 `codex-adapter/`。

若任务允许回填主体方法论，也必须按 handoff 的允许范围修改。

### 3. 保护历史记录

`STATUS.md`、`_meta/plans/`、历史里程碑可能记录过去事实。除非 handoff 明确要求，不把历史记录里的旧名称或旧流程当成必须替换的“残留”。

### 4. 先扫再改

改动前先用 `rg` 或文件阅读确认现状。不要凭记忆替换。

### 5. 修改后回扫

改动后必须至少做一类回扫：

- 旧术语残留
- 新术语拼写
- 悬挂路径
- task type 枚举一致性
- 脚本语法

## 最小示例

```markdown
# Codex Method Change Handoff

## 1. 基本信息

- repository: E:\Group-code-lab\hact-method-lab
- change-id: codex-adapter-phase-1
- title: 新增 Codex 旁路适配层
- owner: CC
- date: 2026-07-01

## 2. 修改目标

新增 `codex-adapter/` 目录，记录 CC + Codex 混合运行的试点规范。
本次不修改现有方法论主体目录。

## 4. 修改范围

### 允许修改

- `codex-adapter/**`

### 禁止修改

- `skeleton/**`
- `specs-execution/**`
- `specs-structural/**`
- `templates/**`
- `guide/**`

## 7. 验证方式

- `Get-ChildItem -Recurse codex-adapter`
- `git status --short`
```

## 交接失败的常见形态

| 失败形态 | 处理 |
|----------|------|
| 只说“优化一下方法论” | 退回 CC，先收敛目标 |
| 没有允许修改范围 | 退回 CC，补范围 |
| 要求 Codex 自己决定方法论方向 | 退回 CC / 人类讨论 |
| 历史记录和当前规范混在一起 | 要求 handoff 标明是否改历史 |
| 验证方式为空 | 至少补 `rg` 或人工核对清单 |
