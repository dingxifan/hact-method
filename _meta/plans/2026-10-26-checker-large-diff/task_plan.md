# 审查检查器大差异读取修复

2026-10-26 用户同意修复方法论检查器、补回归、独审及提交官方 PR；原目标为薪资项目采用官方最新版。基线 86651739e57ebdf3aede81689dc5d050f1e9fb42，分支 codex/checker-large-diff-20261026。

仅修改 templates/scripts/check-sprint.js 的 Git 输出有界容量及非空错误回退，新增定向回归。完整 binary diff 字节、SHA-256、文件集合和失败关闭语义保持一致；不改审查规则、历史报告、产品或项目权限，不分发其他项目。

验证：真实临时 Git 大于 1 MiB 的二进制差异全量独立 hash/names 比对；不存在对象失败；空 stderr / ENOBUFS 保留非空错误且不返回 names。运行既有 review/governance/staged/ready 等相关回归及真实薪资 bonus-archive-test-window 同源链。原 Method finding METHOD-UPGRADE-F001 按新固定候选定向复审，源级局部问题标识 METHOD-LARGE-DIFF-F001。64 MiB 仍是有限边界，超限须失败，不能截断或假通过。

正常 source branch → PR；没有官方仓写权限时尝试合法 fork PR，不能冒称官方已接受。修复被官方接受后，薪资项目另按已授权升级流程验证并采用。
