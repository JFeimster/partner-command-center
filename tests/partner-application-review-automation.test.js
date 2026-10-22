const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/20261022221742_partner_application_review_task_automation.sql'), 'utf8');

test('new real partner applications create one organization-scoped internal review task', () => {
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /new\.status in \('new', 'needs_review'\)/);
  assert.match(migration, /nullif\(btrim\(new\.email\), ''\) is not null/);
  assert.match(migration, /coalesce\(new\.answers->>'fictional', 'false'\) <> 'true'/);
  assert.match(migration, /new\.organization_id, new\.id, new\.partner_id/);
  assert.match(migration, /md5\('partner-application-review:' \|\| new\.id::text \|\| ':' \|\| new\.updated_at::text\)::uuid/);
  assert.match(migration, /on conflict do nothing/);
  assert.match(migration, /partner_application_review_v1/);
  assert.match(migration, /partner_task\.created/);
});

test('triage out of review completes only the automation-owned task and records history', () => {
  assert.match(migration, /old\.status in \('new', 'needs_review'\)[\s\S]*new\.status not in \('new', 'needs_review'\)/);
  assert.match(migration, /set status = 'completed'[\s\S]*notes = v_auto_notes[\s\S]*status = 'open'/);
  assert.match(migration, /partner_task\.completed/);
  assert.match(migration, /create trigger sync_partner_application_review_task[\s\S]*after insert or update of status, email, answers, partner_id/);
  assert.match(migration, /This migration adds triggers only; it does not replay existing applications/);
});
