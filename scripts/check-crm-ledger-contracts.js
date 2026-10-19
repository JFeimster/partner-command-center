'use strict';
const a=require('node:assert/strict');
const x=require('../lib/crm-operational-ledgers');
a.equal(x.SUBMISSION_HEADERS.length,20);
a.equal(x.OUTREACH_HEADERS.length,17);
a.equal(x.submissions([]).submission_count,0);
a.equal(x.outreach([]).event_count,0);
process.stdout.write('CRM ledger checks passed\n');
