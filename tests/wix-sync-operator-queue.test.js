const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20261022222416_wix_contact_sync_operator_exceptions.sql'), 'utf8');
const page = fs.readFileSync(path.join(root, 'app/operator/integrations/wix/page.tsx'), 'utf8');
const actions = fs.readFileSync(path.join(root, 'lib/actions.ts'), 'utf8');
const component = fs.readFileSync(path.join(root, 'components/wix-sync-exceptions.tsx'), 'utf8');

test('Wix operator exception projection is organization-scoped and omits contact data', () => {
  assert.match(migration, /returns table \([\s\S]*entity_kind text[\s\S]*last_error_code text[\s\S]*\)/i);
  assert.match(migration, /o\.organization_id = p_organization_id[\s\S]*app_private\.is_partner_portal_operator\(p_organization_id\)/);
  assert.match(migration, /o\.status in \('retry', 'needs_mapping', 'failed'\)/);
  assert.doesNotMatch(migration, /contact_email|email_address|raw_payload|payload jsonb/i);
  assert.match(migration, /grant execute on function public\.list_wix_contact_sync_exceptions\(uuid\) to authenticated/);
});

test('Wix retries require an operator and exclude identity-mapping exceptions', () => {
  assert.match(migration, /app_private\.is_partner_portal_operator\(p_organization_id\)/);
  assert.match(migration, /v_event\.status not in \('retry', 'failed'\)/);
  assert.match(migration, /status = 'pending', attempts = 0, next_attempt_at = now\(\)/);
  assert.match(migration, /wix_contact_sync\.retry_requested/);
  const action = actions.slice(actions.indexOf('export async function retryWixContactSyncEvent'));
  assert.match(action, /requireOperatorSession\(\)/);
  assert.match(action, /WIX_API_KEY[\s\S]*SUPABASE_SERVICE_ROLE_KEY[\s\S]*CRON_SECRET/);
  assert.match(action, /retry_wix_contact_sync_event/);
  assert.match(component, /item\.status === "needs_mapping"[\s\S]*Resolve the source contact match before retrying/);
});

test('Wix operator page displays only credential presence and a bounded exception projection', () => {
  assert.match(page, /requireOperatorSession\(\)/);
  assert.match(page, /list_wix_contact_sync_exceptions/);
  assert.match(page, /Boolean\(process\.env\.WIX_API_KEY\)/);
  assert.match(page, /Boolean\(process\.env\.SUPABASE_SERVICE_ROLE_KEY\)/);
  assert.match(page, /Boolean\(process\.env\.CRON_SECRET\)/);
  assert.match(page, /Hourly/);
});
