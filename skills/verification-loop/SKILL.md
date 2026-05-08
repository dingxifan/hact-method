---
name: verification-loop
description: 代码机械验证——构建、类型检查、lint、测试、安全扫描、diff review。在推 PR 前或联调前调用，确保基础质量门槛全部通过。
---

# Verification Loop Skill

## When to Use

- Before pushing PR
- Before starting integration tests (pre-integration-check)
- After completing a feature or significant code change
- After refactoring

## Verification Phases

### Phase 1: Build Verification
```bash
npm run build 2>&1 | tail -20
```
Build fails → STOP and fix before continuing.

### Phase 2: Type Check
```bash
npx tsc --noEmit 2>&1 | head -30
```
Report all type errors. Fix critical ones before continuing.

### Phase 3: Lint Check
```bash
npm run lint 2>&1 | head -30
```

### Phase 4: Test Suite
```bash
npm run test -- --coverage 2>&1 | tail -50
```
Report: Total / Passed / Failed / Coverage %.
跳过条件：项目无 test script → 跳过，不阻断。

### Phase 5: Security Scan
```bash
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10
```
检查 console.log 遗留、硬编码密钥等明显安全问题。

### Phase 6: Diff Review
```bash
git diff --stat
git diff HEAD~1 --name-only
```
Review each changed file for unintended changes, missing error handling, edge cases.

## Output Format

```
VERIFICATION REPORT
==================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage) / [SKIP - no test script]
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]

Overall:   [READY/NOT READY] for next step

Issues to Fix:
1. ...
```
