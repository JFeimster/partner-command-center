import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../supabase/migrations/20261103000100_frictionless_partner_onboarding.sql', import.meta.url), 'utf8');
const ingest = fs.readFileSync(new URL('../supabase/functions/partner-crm-ingest/index.ts', import.meta.url), 'utf8');
const callback = fs.readFileSync(new URL('../app/auth/callback/route.ts', import.meta.url), 'utf8');
const noAccess = fs.readFileSync(new URL('../app/auth/no-access/page.tsx', import.meta.url), 'utf8');
const launch = fs.readFileSync(new URL('../app/dashboard/launch/page.tsx', import.meta.url), 'utf8');
const router = fs.readFileSync(new URL('../api/router.js', import.meta.url), 'utf8');
const profileMigration = fs.readFileSync(new URL('../supabase/migrations/20261103000200_partner_profile_editor_fields.sql', import.meta.url), 'utf8');

test('trusted Join intake is form-scoped, consent-gated, and idempotent', () => {
  assert.match(migration, /v_form_id not in \('rjM6do', 'mOe658'\)/);
  assert.match(migration, /v_answers @> '\{"consent_to_contact": true\}'::jsonb/);
  assert.match(migration, /on conflict \(organization_id, source, external_submission_id\) do nothing/);
  assert.match(migration, /status = 'active'/);
  assert.match(migration, /'affiliate_partner'/);
  assert.match(migration, /status in \('paused', 'terminated'\)/);
  assert.match(migration, /application_auto_approved/);
  assert.match(migration, /public_microsite_enabled.*false/);
  assert.match(ingest, /unsupported_partner_join_form/);
  assert.match(ingest, /consent_required/);
  assert.match(router, /\['rjM6do', 'mOe658'\]\.includes/);
  assert.match(profileMigration, /update_partner_portal_profile_details/);
  assert.match(profileMigration, /funding_specialties/);
});

test('verified-email callback invokes the canonical scoped claim RPC', () => {
  assert.match(callback, /supabase\.rpc\("claim_partner_portal_access"\)/);
  assert.match(callback, /\/dashboard\/onboarding/);
  assert.doesNotMatch(noAccess, /claimPartnerPortalAccess/);
});

test('agency launch remains optional and uses the existing Tally form', () => {
  assert.match(launch, /https:\/\/tally\.so\/r\/A7edqy/);
  assert.match(launch, /does not publish a profile or change referral eligibility/);
});
