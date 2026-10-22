'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FIELDS, projection, mergeWixFields, normalizedEmail, patchExactContact, runWixSync
} = require('../lib/wix-contact-sync-worker');

test('rejects malformed emails and synthetic partners', () => {
  assert.equal(normalizedEmail(' INVALID '), null);
  assert.equal(normalizedEmail(' A@B.COM '), 'a@b.com');
  assert.equal(projection('partner', {
    contact_email: 'test@example.com', status: 'active', partner_type: 'funding_broker',
    metadata: { fictional: true }
  }), null);
});

test('partner operational status is separate from applicant and deal status', () => {
  const partner = projection('partner', {
    contact_email: 'person@example.com', status: 'active',
    partner_type: 'referral_partner', metadata: {}
  });
  assert.equal(partner.fields[FIELDS.partnerStatus], 'active');
  assert.equal(partner.fields[FIELDS.partnerType], 'referral_partner');
  assert.equal(partner.fields[FIELDS.partnerApplicationStatus], undefined);
  const application = projection('partner_application', {
    email: 'person@example.com', status: 'needs_review', source: 'wix_form',
    answers: {}
  });
  assert.equal(application.fields[FIELDS.partnerApplicationStatus], 'needs_review');
  assert.equal(application.fields[FIELDS.partnerStatus], undefined);
  const deal = projection('funding_deal',
    { pipeline_stage: 'documents_pending' },
    { email: 'borrower@example.com', metadata: {} });
  assert.equal(deal.fields[FIELDS.fundingStage], 'documents_pending');
  assert.equal(deal.fields[FIELDS.partnerStatus], undefined);
});

test('invalid enum values fail closed', () => {
  assert.throws(() => projection('partner', {
    contact_email: 'x@example.com', status: 'approved', partner_type: 'funding_broker', metadata: {}
  }), /invalid_partnerStatus/);
  assert.throws(() => projection('funding_deal',
    { pipeline_stage: 'funded_and_approved' },
    { email: 'borrower@example.com', metadata: {} }), /invalid_fundingStage/);
});

test('merges custom fields, keeps existing source and unrelated role', () => {
  const base = { other_field: 17, [FIELDS.contactType]: 'funding_applicant', [FIELDS.leadSource]: 'web' };
  const added = mergeWixFields(base, {
    [FIELDS.contactType]: 'partner', [FIELDS.leadSource]: 'referral',
    [FIELDS.partnerStatus]: 'pending'
  });
  assert.equal(added.changed, true);
  assert.equal(added.fields.other_field, 17);
  assert.equal(added.fields[FIELDS.contactType], 'funding_applicant');
  assert.equal(added.fields[FIELDS.leadSource], 'web');
  assert.equal(added.fields[FIELDS.partnerStatus], 'pending');
  assert.equal(base[FIELDS.partnerStatus], undefined);
});

test('single-match contact gets revisioned patch then read-back verification', async () => {
  const id = 'bc81bc81-bc81-4cb1-8bc1-bc81bc81bc81';
  let fields = { 'custom.untouched': 'keep' };
  let revision = 4;
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    const path = new URL(url).pathname;
    if (path.endsWith('/query')) return { ok: true, json: async () => ({
      contacts: [{ id }], pagingMetadata: { hasNext: false }
    }) };
    if (options.method === 'PATCH') {
      const payload = JSON.parse(options.body);
      assert.equal(payload.revision, 4);
      assert.equal(payload.info.extendedFields.items['custom.untouched'], 'keep');
      fields = payload.info.extendedFields.items;
      revision++;
      return { ok: true, json: async () => ({ contact: { id, revision } }) };
    }
    return { ok: true, json: async () => ({ contact: {
      id, revision,
      info: { emails: { items: [{ email: 'partner@example.com' }] },
        extendedFields: { items: fields } }
    } }) };
  };
  const contact = await patchExactContact(fetcher, 'fake-key', {},
    { email: 'partner@example.com', fields: { [FIELDS.partnerStatus]: 'paused' } });
  assert.equal(contact, id);
  assert.equal(fields[FIELDS.partnerStatus], 'paused');
  assert.equal(calls.filter(x => x.options.method === 'PATCH').length, 1);
  assert.ok(calls.every(x => x.options.headers['wix-site-id']));
});

test('ambiguous matches stop without patching', async () => {
  const fetcher = async () => ({
    ok: true, json: async () => ({
      contacts: [{ id: 'x' }, { id: 'y' }], pagingMetadata: { hasNext: false }
    })
  });
  await assert.rejects(patchExactContact(fetcher, 'fake-key', {},
    { email: 'partner@example.com', fields: {} }), /ambiguous_contact_match/);
});

test('worker refuses missing authentication and can return an empty summary', async () => {
  await assert.rejects(runWixSync({ env: {} }), /missing_credentials/);
  const db = { rpc: async () => ({ data: [], error: null }) };
  const result = await runWixSync({
    env: { SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'stub', WIX_API_KEY: 'stub' }, db
  });
  assert.equal(result.claimed, 0);
  assert.equal(result.synced, 0);
});


test('partner projection uses only verified portal and accepted submitted referral metrics', () => {
  const result = projection('partner', {
    contact_email: 'broker@example.com', status: 'active',
    partner_type: 'funding_broker', metadata: {}
  }, {
    portal_status: 'not_provisioned',
    referrals_90d: 0,
    last_referral_date: null
  });
  assert.equal(result.fields[FIELDS.portalStatus], 'not_provisioned');
  assert.equal(result.fields[FIELDS.referrals90d], 0);
  assert.equal(result.fields[FIELDS.lastReferralDate], undefined);

  const active = projection('partner', {
    contact_email: 'broker@example.com', status: 'active',
    partner_type: 'funding_broker', metadata: {}
  }, {
    portal_status: 'active',
    referrals_90d: 2,
    last_referral_date: '2026-10-22'
  });
  assert.equal(active.fields[FIELDS.referrals90d], 2);
  assert.equal(active.fields[FIELDS.lastReferralDate], '2026-10-22');
  assert.throws(() => projection('partner', {
    contact_email: 'broker@example.com', status: 'active',
    partner_type: 'funding_broker', metadata: {}
  }, {
    portal_status: 'approved', referrals_90d: -1, last_referral_date: null
  }), /invalid_portalStatus/);
});

test('activation-test intake is not mirrored into Wix', () => {
  assert.equal(projection('partner_application', {
    email: 'test@example.com',
    status: 'new',
    source: 'activation_test',
    answers: {}
  }), null);
});


test('scheduled worker refreshes rolling referral windows before claiming events', async () => {
  const calls = [];
  const db = {
    rpc: async (fn) => {
      calls.push(fn);
      return fn === 'enqueue_wix_daily_partner_metric_refresh'
        ? { data: 1, error: null }
        : { data: [], error: null };
    }
  };
  const result = await runWixSync({
    env: { SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'stub', WIX_API_KEY: 'stub' },
    db
  });
  assert.equal(result.dailyRefreshQueued, 1);
  assert.deepEqual(calls, [
    'enqueue_wix_daily_partner_metric_refresh',
    'claim_wix_contact_sync_outbox'
  ]);
});
