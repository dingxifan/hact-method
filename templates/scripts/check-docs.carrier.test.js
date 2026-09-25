#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

const checker = path.resolve(__dirname, 'check-docs.js');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-doc-carrier-'));
const prd = path.join(temp, 'prd.md');
const trd = path.join(temp, 'trd.md');
const run = () => childProcess.spawnSync(process.execPath, [checker, prd, trd], { encoding: 'utf8' });

fs.writeFileSync(prd, `# PRD
<!-- ac-format: intent-oracle-v1 -->
## 产品目标
目标
## 目标用户
用户
## 核心功能
### 功能：导出
**入口**：按钮
**draft-ux**：不需要
**涉及实体**：导出清单
**场景描述**：导出
**Acceptance Criteria**：
- AC-01：
  - intent：可下载
  - oracle：文件存在
**明确排除**：无
## 用户故事
- 用户下载
## MVP 边界
只导出
## 开放问题
`);
fs.writeFileSync(trd, `# TRD
## 技术选型变更
无
## 数据库设计
### 承载：导出清单
- 类型：artifact
- 位置：exports/{id}/manifest.json
## 接口设计
### 接口：GET /exports/:id
- 请求体：id
- 响应体：file
- 错误码：NOT_FOUND
- 服务流程：生成下载
# 满足 AC：AC-01
## 测试环境约定
后端 localhost；前端 localhost；数据库 test；禁止生产副作用。
## 交互技术方案
无
## 模块拆分
ExportModule
## 共享组件建议
无
`);
let result = run();
assert.strictEqual(result.status, 0, result.stdout + result.stderr);

fs.writeFileSync(trd, fs.readFileSync(trd, 'utf8').replace('类型：artifact', '类型：database-ish'));
result = run();
assert.notStrictEqual(result.status, 0);
assert.match(result.stdout, /TRD承载类型/);

fs.writeFileSync(trd, fs.readFileSync(trd, 'utf8').replace('### 承载：导出清单', '### 承载：别的实体').replace('类型：database-ish', '类型：artifact'));
result = run();
assert.notStrictEqual(result.status, 0);
assert.match(result.stdout, /实体有技术承载/);

if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temp escaped');
fs.rmSync(temp, { recursive: true, force: true });
console.log('✅ non-table TRD carrier fixtures passed');
