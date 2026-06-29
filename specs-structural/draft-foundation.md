# task: draft-foundation

**discipline**: `architecture`
**Gate**: G2（v0 地基设计验收）
**属性**: —

> V0 地基设计：据项目根 `foundation.md`（地基蓝图）定栈、给每块跨切面关注点选定具体形式并验"实际档 ≥ 应有档"、首期播种 standards、定走骨架范围与标杆切片，签 G2(v0)。**只产设计文档，不产代码**（公共代码归 V0 `develop(source=foundation)`）。

---

## 前置条件

- **触发**：init-project 完成且 `foundation.md` 已播种（A 类项目的 V0，先于 V1 PRD）
- **前置 Gate**：无——V0 无 PRD、无 G1，是 A 类流程在 init 之后、V1 之前的走骨架阶段
- **需确认**：技术栈偏好（语言 / 框架 / 数据库 / UI 库）
- **执行位置**：项目仓 `E:\Group-code-lab\{name}\`

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| 迭代 | const | ✅ | 固定 `v0`（走骨架）；产物入 `iterations/v0/` |

---

## 主要产物

| 产物 | 路径 | 内容 |
|------|------|------|
| foundation.md（更新） | `{name}/foundation.md` | 「二」表「实际形式·档」列逐行回填；实际档 ≥ 应有档，安全项=构造级（项目根活文档，原地更新） |
| foundation-design.md | `{name}/iterations/v0/foundation-design.md` | 走骨架设计：地基件清单 + 作用域构造级落地机制 + 标杆穿透切片（供 develop 建造的薄设计） |
| standards-{shared,frontend,backend}.md | `{name}/standards-*.md` | **首期播种**（含测试基建约定 + 视觉地基约定）；项目根跨迭代活文档，此后原地增补 |
| project.md（技术层） | `{name}/project.md` | 栈 / 数据库 / 模块划分 / 测试框架 |
| decisions.md | `{name}/decisions.md` | 关键架构决策（栈理由 / 各地基件形式 / 安全项构造级机制） |
| gates.md | `{name}/iterations/v0/gates.md` | G2 签署 |
| status.yml | `{name}/status.yml` | `iterations.v0` 块 + `gates.G2` |

---

## 完成判据（= G2(v0) 判据）

- [ ] 技术栈已定并写入 `project.md` 技术层
- [ ] `foundation.md` 每个关注点都有「实际形式」，且**实际档 ≥ 应有档**（数据隔离 / 鉴权等安全敏感项 = 构造级）
- [ ] `iterations/v0/foundation-design.md` 含地基件清单 + 作用域构造级落地 + 标杆穿透切片
- [ ] 三份 standards 已首期播种（**含**测试基建约定 + 视觉地基约定）
- [ ] G2 已签，`status.yml` 已更新
- [ ] 未产任何代码（公共代码归 V0 develop）
- [ ] 完成判据已核对

---

## 接口约定

**输入来自**

| 上游 | 交接内容 | 格式 |
|------|---------|------|
| `init-project` | 项目仓就位 + `foundation.md` 已播种 | 项目根 |
| 用户 | 技术栈偏好 | 对话 |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `develop`(source=foundation) | 走骨架设计 + 地基蓝图 + standards → 建地基件与标杆切片 | `{name}/iterations/v0/foundation-design.md` + `foundation.md` |

---

> **工作内容 / 步骤 / 红线 / 异常见 `specs-execution/draft-foundation.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
