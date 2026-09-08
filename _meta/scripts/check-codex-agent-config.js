#!/usr/bin/env node
'use strict';
const path = require('path');
const { validate } = require('../../templates/scripts/check-codex-project.js');
const errors = validate(path.resolve(__dirname, '../../templates'));
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('✅ Codex 项目模板入口与角色配置形状通过');
