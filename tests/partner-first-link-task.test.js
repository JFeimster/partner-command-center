const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/20261022230216_partner_first_tracking_link_task.sql'), 'utf8');

test('first-link automation requires a verified active partner account and ignores existing links', () => {
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /new\.is_active is distinct from true/);
  assert.match(migration, /prior\.is_active = true[\s\S]*prior\.id <> new\.id/);
  assert.match(migration, /v_partner_status is distinct from 'active'/);
  assert.match(migration, /coalesce\(v_partner_metadata->>'fictional', 'false'\) = 'true'/);
  assert.match(migration, /a\.created_by = a\.user_id[\s\S]*a\.status = 'active'/);
  assert.match(migration, /md5\('partner-first-tracking-link-review:' \|\| new\.partner_id::text\)::uuid/);
  assert.match(migration, /on conflict \(id\) do nothing/);
  assert.match(migration, /partner_first_tracking_link_v1/);
});

test('the automation is private, auditable, and does not replay old links', () => {
  assert.match(migration, /revoke all on function app_private\.create_partner_first_link_task\(\) from public, anon, authenticated/);
  assert.match(migration, /after insert or update of is_active, created_by, partner_id on public\.tracking_links/);
  assert.match(migration, /Existing links are not backfilled/);
  assert.doesNotMatch(migration, /send[_ ]?(email|sms|message)|fetch\(/i);
});
