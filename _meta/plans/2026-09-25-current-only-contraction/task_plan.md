# 当前版收敛计划（2026-09-25）

## 目标

在不降低质量门槛的前提下，把 HACT 收敛为当前唯一运行模型：减少过程状态、重复比对和跨窗口交接，让 ChatGPT → Codex 的工作尽可能在一个执行窗口内做到有结论、有证据、可验收。

## 固定基线

- commit: `84dd7fb9e6c540d24d7ef04ca77b30d50a91a171`
- tree: `bb8074971d7de9c1a7cd4b56cf787e2263e170b8`
- 不考虑旧版本兼容；旧版本项目必须整体采用当前方法，不能混跑。

## 当前模型

1. `tasks/` 是唯一任务执行契约；不再保留 structural/execution 双层规范。
2. 默认保持运行时亲和，一个用户动作最多产生一次对外执行交接。
3. 过程状态不进入 HACT Truth；只持久化可恢复结论和质量证据。
4. 普通失败在当前执行窗口内继续修正并验证；机械错误走快速修正路径。
5. 独立审查仍使用固定候选；系统级问题必须通过新的候选关闭。
6. 非幂等、高影响或结果不确定的外部动作，必须留下可核验的 external-effect receipt。
7. 安装只支持当前版；覆盖 Method-owned 文件，并安全清理上一清单中已退役且未漂移的文件。

## 本轮实施

- 退役 runtime crossing、watcher、discussion persistence、legacy migration、review projection 和双层 specs。
- 简化 status、Gate、系统审查、联调结果与安装协议。
- 增加 external-effect 最小协议及真实 Git 收据校验。
- 更新 BRIEF、STATUS、当前计划和指南，使启动入口只描述当前模型。

## 质量要求

- 所有剩余检查器测试通过。
- 路径与内部引用检查通过。
- 固定候选接受 Fresh Independent Review；所有 blocking finding 必须由后续候选关闭。
- 至少一次真实项目试行后，才可宣称运行流畅度已获实证。

## 当前状态

实现已完成，正在进行最终完整验证和独立复审。未获用户另行批准，不 commit、不 push、不分发到项目仓。
