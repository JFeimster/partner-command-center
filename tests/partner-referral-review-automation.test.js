const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/20261022225244_partner_referral_review_task_automation.sql'), 'utf8');

test('a consented real portal referral creates one scoped internal review task', () => {
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /v_lead_source is distinct from 'partner_portal'/);
  assert.match(migration, /v_lead_consent_at is null/);
  assert.match(migration, /coalesce\(v_partner_metadata->>'fictional', 'false'\) = 'true'/);
  assert.match(migration, /coalesce\(v_lead_metadata->>'fictional', 'false'\) = 'true'/);
  assert.match(migration, /app_private\.is_reserved_wix_contact_email\(v_lead_email\)/);
  assert.match(migration, /v_task_id := md5\('partner-referral-review:' \|\| new\.id::text\)::uuid/);
  assert.match(migration, /new\.organization_id, new\.partner_id,[\s\S]*'Review submitted partner referral'/);
  assert.match(migration, /on conflict \(id\) do nothing/);
  assert.match(migration, /partner_referral_review_v1/);
  assert.match(migration, /partner_task\.created/);
});

test('the automation-owned task closes when a referral leaves submitted and records history', () => {
  assert.match(migration, /old\.status = 'submitted' and new\.status <> 'submitted'/);
  assert.match(migration, /where id = v_task_id[\s\S]*notes = v_task_notes[\s\S]*status = 'open'/);
  assert.match(migration, /partner_task\.completed/);
  assert.match(migration, /create trigger sync_partner_referral_review_task[\s\S]*after insert or update of status on public\.referrals/);
  assert.match(migration, /This migration adds a trigger only; it does not replay data/);
});
