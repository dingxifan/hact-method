# draft-ux 外部设计会话路径（按需 companion）

> 仅当用户明确要求把 HTML 原型交给外部/独立设计会话生成时，由 `draft-ux.md` 加载本文。默认本地生成不读本文。

## 生成设计简报

把已完成的内部消化结果写入 `iterations/vN/design-brief.md`：

| 章节 | 来源 | 说明 |
|---|---|---|
| 任务背景 | PRD + 已确认补充 | 一句话说清产品定位与本轮目标 |
| 视觉规范 | `design.md` | 摘全局基线与本期页面规格，不改写 |
| 场景列表 | draft-ux 内部场景拆解 | S1/S2/… + 覆盖 AC |
| 流程图 | draft-ux 内部流程穿线 | 完整包含分叉、空态与错误路径 |
| 画面清单 | draft-ux 内部画面构思 | 名称 / 触发条件 / 核心信息 / 交互要点 / 边界状态 |
| 关键决策 | 已确认的 Step 3 结论 | 写定论，不让外部会话重新讨论 |
| AC 范围 | AC→Sx 映射 | 前端 AC 与排除 AC；锚点由外部会话写入 prototype-map |

固定红线：单文件 HTML、CSS/JS 内联、无外部 CDN；多画面用 vanilla JS 切换；服从 design 变量；每个点击元素有语义化 id 与明确目标；必须覆盖 hover/disabled/空态/错误态。

外部会话同时输出：

- `iterations/vN/prototype.html`
- `iterations/vN/prototype-map.md`，含「前端 AC 覆盖」和「排除 AC」两张表；覆盖表列为 `AC | 场景 | HTML 锚点`

主线告知用户把两份文件带回后说“设计稿已就位”，随后挂起。文件带回后回 `draft-ux.md` Step 5；路径断裂或死锚点由原设计会话修复，避免双来源修改同一原型。
