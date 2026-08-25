'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPublicUrl, buildLeadFormUrl, qrUrl, completeness, EDITABLE } = require('../lib/distribution-kit');

const profile = { partner_id: 'partner_123', referral_code: 'REF123', slug: 'jane-smith' };

test('canonical public URL uses slug and immutable referral code', () => {
  assert.equal(buildPublicUrl(profile), 'https://capital.distilledfunding.com/jane-smith?ref=REF123');
});

test('campaign context layers onto the public URL without changing identity', () => {
  const url = new URL(buildPublicUrl(profile, { campaign: 'q3', utm_source: 'linkedin', utm_medium: 'social' }));
  assert.equal(url.searchParams.get('ref'), 'REF123');
  assert.equal(url.searchParams.get('campaign'), 'q3');
  assert.equal(url.searchParams.get('utm_source'), 'linkedin');
});

test('lead form is automatically partner attributed', () => {
  const url = new URL(buildLeadFormUrl(profile, { campaign: 'business_cards' }));
  assert.equal(url.origin + url.pathname, 'https://tally.so/r/dWvEqN');
  assert.equal(url.searchParams.get('partner_id'), 'partner_123');
  assert.equal(url.searchParams.get('referral_code'), 'REF123');
  assert.equal(url.searchParams.get('referral_partner'), 'REF123');
  assert.equal(url.searchParams.get('campaign'), 'business_cards');
});

test('QR points to the stable canonical referral destination', () => {
  const destination = buildPublicUrl(profile);
  const qr = new URL(qrUrl(destination, 'svg'));
  assert.equal(qr.searchParams.get('format'), 'svg');
  assert.equal(qr.searchParams.get('data'), destination);
});

test('identity and publication fields are not partner editable', () => {
  ['partner_id', 'referral_code', 'slug', 'approval_status', 'profile_status'].forEach((key) => assert.equal(EDITABLE[key], undefined));
  assert.ok(EDITABLE.display_name);
  assert.ok(EDITABLE.bio);
  assert.ok(EDITABLE.booking_url);
});

test('minimal and enriched profile completeness stays bounded', () => {
  assert.equal(completeness({}), 0);
  assert.equal(completeness({ display_name:'Jane', company_name:'Capital Co', title:'Advisor', bio:'Bio', photo_url:'x', markets:['VA'], specialties:['LOC'], booking_url:'https://example.com' }), 100);
});
