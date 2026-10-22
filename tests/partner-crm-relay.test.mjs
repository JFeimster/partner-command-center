import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { relayPartnerApplication, configurationStatus, partnerCrmCorrelationId } = require('../lib/partner-crm-relay');
const { isCanonicalPartnerJoin } = require('../api/router')._private;
const url = 'https://loaowmappekunngjknnx.supabase.co/functions/v1/partner-crm-ingest';
const input = { submission_id: 'tally-123', email: 'synthetic@example.invalid', name: 'Synthetic Partner', agency_name: 'Synthetic Agency', form_id: 'mOe658', answers: { consent: 'yes' } };

test('only the partner join form enters canonical partner intake', () => {
  assert.equal(isCanonicalPartnerJoin({ data: { formId: 'mOe658' } }), true);
  assert.equal(isCanonicalPartnerJoin({ data: { formId: 'funding-applicant' } }), false);
  assert.equal(isCanonicalPartnerJoin({ action: 'receivePartnerSignup' }), false);
});

test('CRM relay leaves the legacy path operational when no secrets exist', async () => {
  assert.deepEqual(await relayPartnerApplication(input, { url: '', token: '' }), { configured: false });
});

test('CRM relay sends only normalized Tally intake to the canonical server endpoint', async () => {
  let sent;
  const correlationId = partnerCrmCorrelationId(input.submission_id, input.form_id);
  const result = await relayPartnerApplication(input, { url, token: 'test-only-token', fetch: async (destination, init) => {
    sent = { destination, init };
    return { ok: true, json: async () => ({ ok: true, application_id: 'app-123', correlation_id: correlationId }) };
  } });
  assert.equal(result.applicationId, 'app-123');
  assert.equal(result.correlationId, correlationId);
  assert.equal(sent.destination, url);
  assert.equal(sent.init.headers.authorization, 'Bearer test-only-token');
  assert.deepEqual(JSON.parse(sent.init.body), { source: 'tally', ...input, correlation_id: correlationId, applicant_type: 'individual' });
  assert.match(correlationId, /^tally_mOe658_[a-f0-9]{32}$/);
});

test('CRM relay fails closed for partial config and upstream failures', async () => {
  await assert.rejects(relayPartnerApplication(input, { url, token: '' }), /not configured/);
  await assert.rejects(relayPartnerApplication(input, { url: 'https://example.com/ingest', token: 'test-only-token' }), /not configured/);
  await assert.rejects(relayPartnerApplication({ ...input, submission_id: '' }, { url, token: 'test-only-token' }), /stable submission/);
  await assert.rejects(relayPartnerApplication(input, { url, token: 'test-only-token', fetch: async () => ({ ok: false, status: 503 }) }), /503/);
  await assert.rejects(relayPartnerApplication(input, { url, token: 'test-only-token', fetch: async () => ({ ok: true, json: async () => ({ ok: true, correlation_id: 'wrong-correlation-id' }) }) }), /correlation ID mismatch/);
});


test('partner CRM health exposes only secret-free configuration state', () => {
  assert.deepEqual(configurationStatus({ url, token: 'test-only-token' }), {
    configured: true,
    endpoint_matches_canonical: true
  });
  assert.deepEqual(configurationStatus({ url, token: '' }), {
    configured: false,
    endpoint_matches_canonical: true
  });
  assert.deepEqual(configurationStatus({ url: 'https://example.com/ingest', token: 'test-only-token' }), {
    configured: false,
    endpoint_matches_canonical: false
  });
  assert.equal(JSON.stringify(configurationStatus({ url, token: 'test-only-token' })).includes('test-only-token'), false);
});
