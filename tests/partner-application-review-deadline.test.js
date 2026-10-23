const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/20261023120000_partner_application_review_deadline.sql'), 'utf8');

test('new automatic application review tasks receive a two-day deadline', () => {
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /new\.status = 'open'[\s\S]*new\.application_id is not null/);
  assert.match(migration, /new\.title = 'Review new partner application'/);
  assert.match(migration, /new\.notes = 'Auto-created from a partner application event/);
  assert.match(migration, /new\.due_at := coalesce\(new\.created_at, now\(\)\) \+ interval '2 days'/);
  assert.match(migration, /before insert on public\.partner_follow_up_tasks/);
});

test('deadline trigger is restricted and does not update existing task records', () => {
  assert.match(migration, /revoke all on function app_private\.set_partner_application_review_task_deadline\(\)[\s\S]*from public, anon, authenticated/);
  assert.doesNotMatch(migration, /update public\.partner_follow_up_tasks/i);
  assert.match(migration, /drop trigger if exists set_partner_application_review_task_deadline/);
});
