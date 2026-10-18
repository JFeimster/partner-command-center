#!/usr/bin/env node
'use strict';

// Offline-only, read-only comparison against an operator-exported values JSON.
// No environment credentials, network access or writes to the source workbook.
const fs = require('node:fs');
const {summarize} = require('../lib/crm-dashboard-v2');
function main(args) {
  const pos = args.indexOf('--input');
  const date = args.indexOf('--business-date');
  if (pos < 0 || !args[pos + 1] || date < 0 || !args[date + 1]) {
    throw new Error('CRM_USAGE');
  }
  // Parsed content and paths never appear in stdout/stderr, including failures.
  const input = JSON.parse(fs.readFileSync(args[pos + 1], 'utf8'));
  const report = summarize(input, args[date + 1]);
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}
try {main(process.argv.slice(2));}
catch (e) {
  const permitted = new Set(['CRM_USAGE','CRM_INVALID_INPUT','CRM_HEADER_CONTRACT_MISMATCH','CRM_BUSINESS_DATE_REQUIRED']);
  process.stderr.write((permitted.has(e.code || e.message) ? (e.code || e.message) : 'CRM_REPORT_FAILED') + '\n');
  process.exitCode = 1;
}