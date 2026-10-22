const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/20261022225806_complete_claim_task_on_portal_claim.sql'), 'utf8');

test('only a verified self-claim for the active canonical partner closes claim instructions', () => {
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /new\.status is distinct from 'active'/);
  assert.match(migration, /new\.created_by is distinct from new\.user_id/);
  assert.match(migration, /join auth\.users u on u\.id = new\.user_id/);
  assert.match(migration, /v_partner_email is distinct from v_user_email/);
  assert.match(migration, /v_email_confirmed_at is null/);
  assert.match(migration, /a\.partner_id = new\.partner_id[\s\S]*a\.status = 'approved'/);
  assert.match(migration, /t\.title = 'Send partner portal claim instructions'[\s\S]*t\.status = 'open'/);
  assert.match(migration, /partner_claim_task_v1/);
  assert.match(migration, /partner_task\.completed/);
});

test('claim task automation is a private after-insert/update trigger and sends no messages', () => {
  assert.match(migration, /revoke all on function app_private\.complete_partner_claim_tasks\(\) from public, anon, authenticated/);
  assert.match(migration, /after insert or update of status, created_by, user_id, partner_id on public\.partner_portal_accounts/);
  assert.doesNotMatch(migration, /send[_ ]?(email|sms|message)|fetch\(/i);
});
