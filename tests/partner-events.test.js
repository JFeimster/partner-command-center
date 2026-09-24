'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const partnerEvents = require('../api/partner-events');

const {
  buildEventId,
  normalizeSource,
  normalizePartnerCandidate
} = partnerEvents._private;

test('external event ids produce deterministic ingestion ids', () => {
  const first = buildEventId('email', 'message-123', '');
  const second = buildEventId('email', 'message-123', '');
  assert.equal(first, second);
  assert.match(first, /^evt_[a-f0-9]{20}$/);
});

test('source allowlist rejects unknown adapters', () => {
  assert.equal(normalizeSource('email'), 'email');
  assert.equal(normalizeSource('unknown_vendor'), '');
});

test('new partner candidates default to affiliate semantics', () => {
  const partner = normalizePartnerCandidate({
    name: 'Example Broker',
    email: 'BROKER@example.com'
  }, 'email', 'david_allen_capital');

  assert.equal(partner.email, 'broker@example.com');
  assert.equal(partner.partner_type, 'affiliate_partner');
  assert.equal(partner.onboarding_path, 'affiliate_launch_path');
  assert.equal(partner.tier, 'tier_3');
  assert.equal(partner.referral_source, 'email');
  assert.equal(partner.traffic_source, 'david_allen_capital');
});
