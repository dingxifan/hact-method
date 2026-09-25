#!/bin/sh
# hact-method-lab 自身的 pre-commit 门卫
# ------------------------------------------------------------------
# 本仓此前没有任何机械防线——绝对路径漂移因此累积到 71 处无人察觉，
# 且一次"修复"只是把一个写死路径换成另一个写死路径，同样无人拦下。
#
# 安装：cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
# ⚠️ 先查 `git config --get core.hooksPath`：有值则 .git/hooks/ 被忽略，
#    须改为把本脚本调用追加进该 hooksPath 下的 pre-commit。装完必须真触发一次验证。
#
# 当前 Method 要求 Node 与 checker 已安装；缺失即 FAIL。
# ------------------------------------------------------------------
set -u

command -v node >/dev/null 2>&1 || { echo "❌ pre-commit: 未找到 node" >&2; exit 1; }

# core.quotepath 默认为 true：非 ASCII 文件名会被转义并加引号输出（"guide/99-ä»..."），
# 前导引号会让 ^ 锚定的路由正则全部落空。本仓 guide/ 下全是中文名，不关它整条路由形同虚设。
staged=$(git -c core.quotepath=false diff --cached --name-only)
[ -z "$staged" ] && exit 0

fail=0

# --- 运行时文本的绝对路径（check-paths.js）---
# 触发口：staged 里有运行时目录/文件下的 .md/.js/.sh/.yml。
# 历史档（_meta/）与 STATUS.md 不在范围内——它们记录既成事实，写具体路径是对的。
if echo "$staged" | grep -qE '^(skeleton|guide|templates|tasks|protocols|runtime|utilities|legacy-migration)/.*\.(md|js|cjs|sh|yml)$|^(AGENTS|BRIEF)\.md$'; then
  if [ -f scripts/check-paths.js ]; then
    echo "▶ pre-commit: node scripts/check-paths.js" >&2
    node scripts/check-paths.js || fail=1
  fi
fi

if [ "$fail" -ne 0 ]; then
  echo "" >&2
  echo "❌ pre-commit 门卫：检查未通过，已拦截本次 commit。" >&2
  echo "   按上方报告改成相对路径；确需绕过用 git commit --no-verify（留痕自负）。" >&2
  exit 1
fi
exit 0
