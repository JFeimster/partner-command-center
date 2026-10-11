'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { _private } = require('../api/cleanup-backfill-artifacts');

test('repeated cleanup treats an already archived or absent artifact as complete', async () => {
  const missing = Object.assign(new Error('Not found'), { status: 404 });
  const first = await _private.capture('notion_page_example', async () => { throw missing; });
  const second = await _private.capture('notion_page_example', async () => { throw missing; });
  assert.equal(first.ok, true);
  assert.deepEqual(first.result, { status: 'already_absent' });
  assert.equal(second.ok, true);
  assert.deepEqual(second.result, { status: 'already_absent' });
});
