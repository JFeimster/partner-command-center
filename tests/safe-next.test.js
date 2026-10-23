const test = require('node:test');
const assert = require('node:assert/strict');
const { safeNextPath } = require('../lib/safe-next');

test('safe internal return paths preserve useful route context', () => {
  assert.equal(safeNextPath('/dashboard/links?program=abc-123'), '/dashboard/links?program=abc-123');
  assert.equal(safeNextPath('/dashboard/referrals?submitted=1#history'), '/dashboard/referrals?submitted=1#history');
});

test('external and malformed return paths fall back to the partner dashboard', () => {
  for (const value of [
    'https://example.com/account',
    '//example.com/account',
    '/\\\\example.com/account',
    '/%0d%0aLocation:https://example.com',
    'dashboard/links',
    null
  ]) {
    assert.equal(safeNextPath(value), '/dashboard');
  }
});
