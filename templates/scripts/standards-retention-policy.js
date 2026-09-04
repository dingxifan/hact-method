#!/usr/bin/env node
'use strict';
const fs = require('fs');

function evaluate(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return { decision: 'invalid', reason: 'row must be an object' };
  for (const key of ['zero_use', 'safety_or_data', 'superseded_when_met']) {
    if (typeof row[key] !== 'boolean') return { decision: 'invalid', reason: `${key} must be boolean` };
  }
  if (row.applies_if_possible !== null && typeof row.applies_if_possible !== 'boolean')
    return { decision: 'invalid', reason: 'applies_if_possible must be boolean or null' };
  const validText = value => typeof value === 'string' && value.trim().length >= 4 && !/[<>{}]|待填|TODO|TBD/i.test(value);
  const allowedAuthority = validText(row.migrated_to)
    && /^(Foundation|PRD|TRD|design|check|test|config|type|lint)\b/i.test(row.migrated_to.trim());
  const stableAnchor = validText(row.stronger_anchor)
    && /(?:\.md|check|test|config|lint|type)[^\r\n]*(?:§|#|\bid:|\brule:)/i.test(row.stronger_anchor);
  const migratedStrong = Boolean(allowedAuthority && stableAnchor);
  if (row.safety_or_data && !migratedStrong) return { decision: 'keep', reason: 'safety/data defaults to retain without stronger anchor' };
  if (migratedStrong) return { decision: 'delete-allowed', reason: 'migrated to stronger authority' };
  if (row.superseded_when_met) return { decision: 'delete-allowed', reason: 'superseded-when is satisfied' };
  if (row.applies_if_possible === false) return { decision: 'delete-allowed', reason: 'applies-if can no longer match in this project' };
  return { decision: row.zero_use ? 'review' : 'keep', reason: row.zero_use ? 'zero use alone is not deletion evidence' : 'rule remains active' };
}

function main() {
  const file = process.argv[2];
  if (!file) { console.error('用法: node standards-retention-policy.js <audit.json>'); process.exit(2); }
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) throw new Error('audit.json 须为数组');
  const invalid = [];
  const results = rows.map(row => {
    const result = evaluate(row);
    if (!row.id || !['delete', 'keep', 'review'].includes(row.requested)) invalid.push(`${row.id || '<missing-id>'}: invalid id/requested`);
    else if (result.decision === 'invalid') invalid.push(`${row.id}: ${result.reason}`);
    else if (row.requested === 'delete' && result.decision !== 'delete-allowed') invalid.push(`${row.id}: ${result.reason}`);
    return { id: row.id, ...result };
  });
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  if (invalid.length) { console.error(`禁止删除：${invalid.join('；')}`); process.exit(1); }
}

if (require.main === module) main();
module.exports = { evaluate };
