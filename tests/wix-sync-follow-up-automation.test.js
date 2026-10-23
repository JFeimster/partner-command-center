const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/20261023130000_wix_sync_exception_follow_up_tasks.sql'), 'utf8');

test('only real partner and partner-application Wix sync exceptions create operator tasks', () => {
  assert.match(migration, /new\.entity_kind not in \('partner', 'partner_application'\)/);
  assert.match(migration, /new\.status in \('failed', 'needs_mapping'\)/);
  assert.match(migration, /coalesce\(p\.metadata->>'fictional', 'false'\) <> 'true'/);
  assert.match(migration, /app_private\.is_reserved_wix_contact_email\(p\.contact_email\)/);
  assert.match(migration, /coalesce\(a\.answers->>'fictional', 'false'\) <> 'true'/);
  assert.match(migration, /not in \('activation_test', 'synthetic', 'qa'\)/);
  assert.match(migration, /app_private\.is_reserved_wix_contact_email\(a\.email\)/);
  assert.match(migration, /p\.organization_id = new\.organization_id[\s\S]*coalesce\(p\.metadata->>'fictional', 'false'\) <> 'true'/);
  assert.match(migration, /md5\('wix-contact-sync-exception:' \|\| new\.id::text\)::uuid/);
});

test('delivery exception tasks are replay-safe, actionable, organization-scoped, and audited', () => {
  assert.match(migration, /on conflict \(id\) do nothing/);
  assert.match(migration, /status in \('completed', 'cancelled'\)[\s\S]*partner_task\.reopened/);
  assert.match(migration, /now\(\) \+ interval '1 day'/);
  assert.match(migration, /t\.organization_id = new\.organization_id/);
  assert.match(migration, /partner_task\.created/);
  assert.match(migration, /partner_task\.completed/);
  assert.match(migration, /'wix_contact_sync_exception_v1'/);
  assert.match(migration, /'outbox_event_id', new\.id/);
});

test('retry states preserve open tasks and only synced or ignored deliveries resolve them', () => {
  assert.match(migration, /elsif new\.status in \('synced', 'ignored'\)/);
  assert.match(migration, /new\.status in \('failed', 'needs_mapping'\)[\s\S]*elsif new\.status in \('synced', 'ignored'\)/);
  assert.doesNotMatch(migration, /new\.status in \([^)]*'retry'[^)]*\)[\s\S]*set status = 'completed'/);
  assert.match(migration, /after insert or update of status on public\.wix_contact_sync_outbox/);
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /revoke all on function app_private\.sync_wix_contact_sync_follow_up_task\(\)[\s\S]*from public, anon, authenticated/);
});
