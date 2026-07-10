'use strict';

const assert = require('assert');
const crypto = require('crypto');
const dashboard = require('../lib/dashboard-bootstrap');
const bootstrapHandler = require('../api/dashboard/bootstrap');

function richText(value) {
  return { rich_text: value ? [{ plain_text: value }] : [] };
}

function title(value) {
  return { title: value ? [{ plain_text: value }] : [] };
}

function select(value) {
  return { select: value ? { name: value } : null };
}

function number(value) {
  return { number: value };
}

function relation(ids) {
  return { relation: ids.map((id) => ({ id })) };
}

function page(properties) {
  return {
    id: 'page_123',
    created_time: '2026-07-10T12:00:00.000Z',
    last_edited_time: '2026-07-10T13:00:00.000Z',
    properties
  };
}

assert.strictEqual(dashboard.normalizePartnerStatus('Approved'), 'active');
assert.strictEqual(dashboard.normalizePartnerStatus('On Hold'), 'paused');
assert.strictEqual(dashboard.normalizeLeadStatus('Awaiting Documents'), 'awaiting_documents');
assert.strictEqual(dashboard.normalizeLeadStatus('In Human Review'), 'in_review');
assert.strictEqual(dashboard.amountBand(75000), '$50K–$99K');

const partnerPage = page({
  Name: title('North Star Advisors'),
  Company: richText('North Star Advisors LLC'),
  Status: select('Active'),
  Tier: select('Growth'),
  'Partner ID': richText('MS-P-1001'),
  'Consent to Contact': { checkbox: true },
  'Community Joined': { checkbox: true },
  'First Deal Submitted': { checkbox: false }
});
const mappedPartner = dashboard.mapPartner(partnerPage, 'MS-P-1001');
assert.strictEqual(mappedPartner.partner_id, 'MS-P-1001');
assert.strictEqual(mappedPartner.status, 'active');
assert.ok(mappedPartner.onboarding_completion_percent >= 60);

const leadPage = page({
  Name: title('Acme Logistics — lead_1001'),
  'External Lead ID': richText('lead_1001'),
  'Business Name': richText('Acme Logistics'),
  'Lead Status': { status: { name: 'Awaiting Documents' } },
  'Desired Funding Amount': number(100000),
  'Funding Readiness Score': number(72),
  'Funding Readiness Tier': select('Review Ready'),
  'Lead Priority': select('Warm'),
  'Partner ID': richText('MS-P-1001'),
  'API Payload': richText(JSON.stringify({ source_system: 'embed_widget' }))
});
const mappedLead = dashboard.mapFundingLead(leadPage, 0.02);
assert.strictEqual(mappedLead.lead_id, 'lead_1001');
assert.strictEqual(mappedLead.public_status, 'awaiting_documents');
assert.strictEqual(mappedLead.estimated_commission.amount, 2000);
assert.strictEqual(mappedLead.source_system, 'embed_widget');
assert.strictEqual(Object.prototype.hasOwnProperty.call(mappedLead, 'email'), false);

assert.strictEqual(dashboard.matchesPartner(page({ Partner: relation(['partner-page']) }), 'MS-P-1001', 'partner-page'), true);
assert.strictEqual(dashboard.matchesPartner(page({ 'Partner ID': richText('OTHER') }), 'MS-P-1001', 'partner-page'), false);

process.env.DASHBOARD_SESSION_SECRET = 'test-secret';
const payload = Buffer.from(JSON.stringify({ partner_id: 'MS-P-1001', exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url');
const signature = crypto.createHmac('sha256', process.env.DASHBOARD_SESSION_SECRET).update(payload).digest('base64url');
const verified = bootstrapHandler.verifySessionToken(`${payload}.${signature}`);
assert.strictEqual(verified.partner_id, 'MS-P-1001');
assert.strictEqual(bootstrapHandler.verifySessionToken(`${payload}.invalid`), null);

process.env.PARTNER_COMMAND_API_KEY = 'trusted-test-key';
const identity = bootstrapHandler.resolvePartnerId({
  headers: { 'x-api-key': 'trusted-test-key', 'x-partner-id': 'MS-P-1001' },
  query: {},
  url: '/api/dashboard/bootstrap'
});
assert.deepStrictEqual(identity, { partnerId: 'MS-P-1001', authMode: 'trusted_api_key' });

console.log('dashboard-data-mode tests passed');
