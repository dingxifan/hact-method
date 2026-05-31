# task: deploy

**discipline**: `deploy`
**Gate**: —
**属性**: `target`

> 将已验收的代码部署到目标环境，验证服务正常。

---

## 前置条件

- **常规部署（A 类迭代）**：G4 已签（manual-test 通过）
- **B 类独立部署**：无进行中的 A 类迭代时，B 类 [merged] 任务积累到一定程度，由有 `dispatch` discipline 的用户主动触发；无需 G4
- **hotfix 快速通道**：`urgency=hotfix` 的 develop 任务 [merged] 后，可不等 G4，由有 `dispatch` discipline 的用户授权后立即部署
- **文件**：`deployment.config`（服务器地址 / 启动命令 / 健康检查端点等，首次部署时创建）

---

## 字段规范

| 字段 | 类型 | 必填 | 取值 / 说明 |
|------|------|:----:|------------|
| `target` | string | ✅ | 目标环境标识，如 `prod` / `staging` |

---

## 主要产物

| 产物 | 路径 | 格式 |
|------|------|------|
| 部署日志 | `deploy-log.md` | 见下方格式（追加，不覆盖） |
| deployment.config（首次） | `deployment.config` | 键值对配置文件，含四个字段：`server-address` / `build-command` / `health-check-url` / `restart-command` |

**deploy-log.md 追加格式：**

```markdown
## {YYYY-MM-DD HH:MM} · {target} · {部署人}
- 包含内容：{A 类 vN / B 类 {task-id 列表} / hotfix {task-id}}
- 构建结果：成功 / 失败（{原因}）
- 健康检查：通过 / 失败（{现象}）
- 备注：{有则填}
```

---

## 完成判据

- [ ] 本地构建验证通过
- [ ] 服务器构建成功
- [ ] 服务重启成功
- [ ] 健康检查端点返回正常
- [ ] 服务器日志无异常错误
- [ ] 部署日志已追加记录

---

## 接口约定

**输入来自**

| 上游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `manual-test`（常规） | G4 已签 | `gates.md` |
| `develop`（hotfix 快速通道） | hotfix PR [merged]，授权已给 | 任务包 `urgency=hotfix` |

**输出给**

| 下游 task | 交接内容 | 格式 |
|-----------|---------|------|
| `wrap-up-iteration` | 部署完成，G5 可签（与 wrap-up 并行，无强依赖） | 部署日志 |

---

> **工作内容 / 边界场景 / 异常处理见 `specs-execution/deploy.md`（执行层）。** 本契约只定义字段 / 产物 / 完成判据 / 接口；运行时加载的是执行层。
