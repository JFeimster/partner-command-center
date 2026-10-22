const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20261022220953_operator_follow_up_task_create.sql'), 'utf8');
const actions = fs.readFileSync(path.join(root, 'lib/actions.ts'), 'utf8');

test('operator task creation is organization-scoped, audited, and replay-safe', () => {
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /app_private\.is_partner_portal_operator\(p_organization_id\)/);
  assert.match(migration, /where a\.id = p_application_id and a\.organization_id = p_organization_id/);
  assert.match(migration, /where p\.id = v_partner_id and p\.organization_id = p_organization_id/);
  assert.match(migration, /on conflict \(id\) do nothing returning id into v_inserted_id/);
  assert.match(migration, /'partner_task\.created'/);
  assert.match(migration, /revoke all on function public\.create_partner_follow_up_task[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.create_partner_follow_up_task[\s\S]*to authenticated/);
});

test('task server action derives the organization from the operator session', () => {
  const action = actions.slice(actions.indexOf('export async function createPartnerFollowUpTask'));
  assert.match(action, /partnerTaskSchema\.safeParse/);
  assert.match(action, /requireOperatorSession\(\)/);
  assert.match(action, /p_organization_id: session\.organizationId/);
  assert.match(action, /create_partner_follow_up_task/);
});
