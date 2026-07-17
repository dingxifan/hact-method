# Kimi Code + Kimi3 1M 适配分析

> 日期：2026-07-17
> 来源：基于 hact-method-lab 现状、mail-ai / jhh-noriton 真实项目落地数据、Kimi Code 官方文档（https://www.kimi.com/code/docs/en/）的分析
> 状态：分析结论，待验证

---

## 一、分析背景与修正说明

本分析回答：如果 hact-method 在 Kimi Code + Kimi3 1M 的组合下运行，能否跑通、需要哪些变化、可能产生哪些不足、可能带来哪些提高。

**重要修正**：最初分析基于过时信息，认为 Claude 上下文窗口为 200k，因此得出"Kimi3 1M 有 5 倍上下文优势"的错误结论。实际 Claude Sonnet 4.5 和 Opus 4.8 均已支持 1M tokens（2025-09-29 发布，beta 特性，tier 4 可用）。因此 **上下文窗口不再是 Kimi Code 与 Claude Code 的差异化变量**，核心差异在于工具生态、子 Agent 机制、成本模式、模型行为。

---

## 二、核心结论

**能跑，但需要一次"引擎移植"**。

hact-method 的核心骨架（任务驱动、Gate、状态契约、质量防线、A/B 类分离、V0 走骨架）与 Kimi Code 的能力完全兼容。但执行层需要做适配变化，且部分假设需要重新校准。

---

## 三、关键差异对比

| 维度 | Kimi Code + Kimi3 1M | Claude Code + Claude Sonnet 4.5/Opus 1M |
|---|---|---|
| **子 Agent 机制** | `coder`/`explore`/`plan`，主 Agent 自动调度，支持 `AgentSwarm` | 显式 spawn Explore/general-purpose/coder subagent |
| **推理风格** | deep thinking 默认启用，reasoning effort 可配 | Claude extended thinking，可控性更强 |
| **成本模式** | 会员配额 + 5 小时滚动速率限制（300–1200 请求/5h，最多 30 并发） | 按 token 计费 |
| **生态成熟度** | 较新，工具链依赖需要验证 | 更成熟，hact-method 当前生态围绕 Claude Code 构建 |
| **特殊功能** | Goal 模式、AgentSwarm、`/import-from-cc-codex` | 原生 MCP、更成熟的 subagent 隔离 |
| **上下文窗口** | 1M tokens（Allegretto 以上可用） | 1M tokens（beta，tier 4 可用） |

---

## 四、需要做的变化

### 1. 子 Agent 调用层重写

hact-method 的 `specs-execution/develop.md` 等文件中大量出现 `spawn subagent` 的表述，必须映射到 Kimi Code 的 `Agent`/`AgentSwarm` 工具：

| hact-method 原表述 | Kimi Code 映射 |
|---|---|
| Explore subagent（只读探索）| `Agent(subagent_type="explore")` |
| 执行 subagent（写代码）| `Agent(subagent_type="coder")` |
| 独立审查 subagent | `Agent(subagent_type="coder")` + 隔离 prompt |
| 批量并行探索/审查 | `AgentSwarm` |

特别是 develop.md 中的 **per-task 执行 → 独立审查 → 回炉 loop**，需要重写调用格式和返回处理。

### 2. 项目级指令文件迁移

- 把所有 `CLAUDE.md` 重命名为/复制为 `AGENTS.md`（`.kimi-code/AGENTS.md` 或项目根 `AGENTS.md`）
- 验证 `@../hact-method-lab/specs-execution/xxx.md` 的引用方式在 Kimi Code 下是否生效；如果不支持 `@` 语法，需要改成显式 `Read` 指令

### 3. Skill 和 MCP 配置迁移

- Skills：从 Claude Code skill 格式迁移到 Kimi Code Skill 格式（YAML frontmatter + Markdown body），放在 `.kimi-code/skills/` 或 `.agents/skills/`
- MCP：从 Claude Code 的 MCP 配置迁移到 `.kimi-code/mcp.json`
- 可利用 Kimi Code 的 `/import-from-cc-codex` 命令导入 Claude Code 的指令、skills、MCP 设置，降低初始迁移成本

### 4. 上下文策略重估

既然两者都有 1M，hact-method 的"精确加载"原则不再需要对抗窗口限制，而是对抗**信息质量**：

- **允许全量读入的场景扩大**：多迭代依赖分析、跨迭代偏离对账、大规模 backlog 清理
- **保留 subagent 隔离的场景**：per-task 独立审查（避免主会话锚定）、大批量重复性任务（`generate-integration-tests`）
- **明确禁止**："因为窗口大就全塞进去"——1M 只是降低压缩频率，不降低失真风险

### 5. 成本/配额模型调整

- "降档模型省 token"的策略基本不适用（Kimi Code 没有 haiku/sonnet 档位）
- 成本控制应转向：**减少请求次数**、**减少 subagent 层级**、**避免 1M 窗口的浪费**
- 需要关注 5 小时滚动速率限制，避免批量任务触发限流
- 1M 上下文的单次请求输入 tokens 更多，可能更快消耗配额

### 6. 检查器和门卫脚本验证

`check-docs.js`、`check-sprint.js`、`check-gate.js`、`pre-commit-hook.sh` 等脚本需要验证在 Kimi Code + Windows Git Bash 环境下的行为。迁移时应优先补上 `check-status.js` + 门卫（真实项目中已暴露 status.yml 结构错位问题）。

### 7. 对抗审查 brief 重新校准

Kimi3 的 deep thinking 默认启用，可能在审查风格上有差异。需要：
- 用真实 develop 任务跑对比测试
- 调整 brief 的指令风格
- 验证"默认假设实现有问题，存疑即判阻断"的对抗风格在 Kimi3 下是否同样有效

---

## 五、可能产生不足的方面

### 1. 生态成熟度差距

这是迁移的主要风险。hact-method 依赖的工具链（superpowers、pinchtab、simplify、pic、gitee-ops、SSH MCP）需要逐一验证在 Kimi Code 下的可用性。第三方 skill 市场更小，与 Gitee、浏览器自动化等集成的稳定性未知。

### 2. 子 Agent 自动调度风险

Kimi Code 的 subagent 是主 Agent 自动调度的，这可能破坏 hact-method 对"隔离对抗审查"的严格假设。需要在规范中显式要求调用 `Agent` 工具，不能依赖自动调度。

### 3. 成本控制工具缺失

Kimi Code 没有 haiku/sonnet 档位，无法像 hact-method 决策#26 那样按任务性质降档。只能依赖"减少调用次数"和"降低单请求复杂度"。

### 4. 模型推理风格差异

Kimi3 的 deep thinking 默认启用，可能在审查任务上过度思考或产生与 Claude 不同的审查风格。需要重新校准所有 review brief。

### 5. 5 小时滚动速率限制

会员配额制下的 5 小时滚动限制（300–1200 请求/5h）可能比 Claude 的按 token 计费更限制批量任务的节奏。

---

## 六、可能提高的方面

### 1. AgentSwarm 批量并行能力

这是 Kimi Code 独有的优势。`generate-integration-tests` 的按模块并行、多任务包独立审查等场景，可以用 `AgentSwarm` 显式批量派发，可能比 Claude Code 的串行 spawn 更高效。

### 2. Goal 模式可能简化任务管理

Kimi Code 的 `/goal` 功能可以自动推进任务到完成或阻塞。这与 hact-method 的"任务驱动"模型可能有协同效应——例如把"完成当前 develop 任务集"设为目标，让 Kimi Code 自动推进。

### 3. 迁移便利性

`/import-from-cc-codex` 可以直接导入 Claude Code 的指令、skills、MCP 设置，降低初始迁移成本。

### 4. 长上下文协同（同等能力下的不同实现）

两者都能处理 1M，但 Claude 的 1M 是 beta 特性，可能需要 tier 4；Kimi3 的 1M 在 Allegretto 以上可用。如果 Claude 的 1M 在目标用户环境中不可用，Kimi3 可能提供更稳定的 1M 访问。

### 5. 减少 subagent 调用频次（修正后的表述）

不是"独有优势"，而是两者都具备的 1M 能力带来的共同收益：可以更大胆地全量读入文件，减少不必要的 Explore subagent 调用。

---

## 七、关键建议

1. **不要假设 Kimi3 1M 有上下文优势**——两者都有 1M，重点是验证模型能力和工具兼容性。

2. **先做能力对比测试，再做迁移决定**——用几个真实 develop 任务同时跑 Claude 和 Kimi，对比：
   - 独立审查的阻断发现率/误报率
   - 代码生成质量
   - 单任务配额/成本消耗
   - 长规范遵循能力

3. **优先验证工具链**——superpowers、pinchtab、gitee-ops、SSH MCP 在 Kimi Code 下的可用性比模型能力更影响迁移可行性。

4. **用 AgentSwarm 替代串行 subagent**——这是 Kimi Code 可能带来的真实效率提升。

5. **重新设计成本策略**——从"模型档位优化"转向"请求次数优化"和"速率限制规避"。

6. **先做最小可行迁移**——用 `/import-from-cc-codex` 导入配置，把 `CLAUDE.md` 复制为 `AGENTS.md`，验证 `init-project` 能在 Kimi Code 下跑通。

7. **保持"精确加载"原则**——1M 只是降低压缩频率，不降低失真风险。只有真正需要跨文件关联理解的场景才开放全量读入。

---

## 八、落盘结论

hact-method 在 Kimi Code + Kimi3 1M 下**可以跑通**，核心骨架完全适用；但需要重写 subagent 调用层、验证工具链兼容性、重新校准模型行为，并针对 Kimi Code 的配额制重新设计成本策略。潜在收益主要来自 AgentSwarm 批量并行和 Goal 模式，潜在风险主要是生态成熟度不足和成本控制工具缺失。

迁移决策不应基于"1M 上下文"（两者都有），而应基于**实际对比测试**和**工具链适配成本**。

---

## 附：本次分析引用的关键文档

- Kimi Code Overview: https://www.kimi.com/code/docs/en/
- Kimi Code Agents and Sub-Agents: https://www.kimi.com/code/docs/en/kimi-code-cli/customization/agents.html
- Kimi Code MCP: https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp.html
- Kimi Code Skills: https://www.kimi.com/code/docs/en/kimi-code-cli/customization/skills.html
- Kimi Code Tools: https://www.kimi.com/code/docs/en/kimi-code-cli/reference/tools.html
- Kimi Code Membership: https://www.kimi.com/code/docs/en/kimi-code/membership.html
- Claude Code + Kimi API 配置: https://www.kimi.com/code/docs/en/third-party-tools/other-coding-agents.html
