'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const partnerGet = require('../api/partner-get');
const { contactProperties } = (() => {
  const hubspot = require('../lib/hubspot-client');
  // Keep test independent of network by exercising exported helpers only when available.
  return { contactProperties: hubspot.contactProperties || null };
})();

test('getPartner safe projection excludes raw Notion properties', () => {
  const page = {
    id: 'page_1',
    url: 'https://notion.so/page_1',
    properties: {
      'Partner ID': { rich_text: [{ plain_text: 'MS-P-1' }] },
      Name: { title: [{ plain_text: 'Ada Partner' }] },
      Email: { email: 'ada@example.com' },
      Phone: { phone_number: '2025550111' },
      Company: { rich_text: [{ plain_text: 'Ada Co' }] },
      Website: { url: 'https://example.com' },
      'Partner Type': { select: { name: 'Affiliate / Content' } },
      Status: { status: { name: 'Active Partner' } },
      Tier: { select: { name: 'tier_3' } },
      'Onboarding Path': { select: { name: 'Beginner' } }
    }
  };

  const result = partnerGet._private.safePartner(page);
  assert.equal(result.partner_id, 'MS-P-1');
  assert.equal(result.email, 'ada@example.com');
  assert.equal(result.notion_page_id, 'page_1');
  assert.equal('properties' in result, false);
});

test('operations Action modules load without runtime network calls', () => {
  [
    '../api/partner-upsert',
    '../api/partner-sync',
    '../api/partner-tasks',
    '../api/partner-events-log',
    '../api/partner-resources',
    '../api/partner-links'
  ].forEach((path) => assert.equal(typeof require(path), 'function'));
});
