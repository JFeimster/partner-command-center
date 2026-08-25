'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildProperties } = require('../lib/notion/funding-leads');

function request() {
  return {
    schema_version: '1.0.0',
    idempotency_key: 'lead_relation_test:create',
    source_system: 'embed_widget',
    source_event_id: null,
    lead: {
      lead_id: 'lead_relation_test',
      applicant: {
        first_name: 'Jane',
        last_name: 'Smith',
        business_name: 'Smith Logistics LLC',
        email: 'jane@example.com',
        phone: '2025550100',
        state: 'DC'
      },
      answers: { monthly_revenue: 42000 },
      score_result: { score: 82, tier: { id: 'highly_fundable' } },
      lead_priority: 'hot',
      manual_review_recommended: false,
      partner_id: null,
      tracking_link_id: null,
      campaign_id: null,
      widget_id: null,
      source_url: 'https://example.com',
      source_asset: 'embed_widget',
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      consent: { contact: true, privacy: true, captured_at: '2026-08-25T00:00:00Z' }
    }
  };
}

test('writes both validated attribution relations', () => {
  const properties = buildProperties(request(), 'req_test', {
    partnerPageId: 'partner-a',
    trackingLinkPageId: 'tracking-a'
  });

  assert.deepEqual(properties.Partner, { relation: [{ id: 'partner-a' }] });
  assert.deepEqual(properties['Tracking Link'], { relation: [{ id: 'tracking-a' }] });
});

test('clears tracking relation when validated partner has no tracking link', () => {
  const properties = buildProperties(request(), 'req_test', {
    partnerPageId: 'partner-b',
    trackingLinkPageId: null
  });

  assert.deepEqual(properties.Partner, { relation: [{ id: 'partner-b' }] });
  assert.deepEqual(properties['Tracking Link'], { relation: [] });
});

test('leaves direct leads without attribution relations', () => {
  const properties = buildProperties(request(), 'req_test', null);

  assert.equal('Partner' in properties, false);
  assert.equal('Tracking Link' in properties, false);
});

test('clears both attribution relations on an existing direct lead update', () => {
  const properties = buildProperties(request(), 'req_test', {
    status: 'direct',
    partnerPageId: null,
    trackingLinkPageId: null
  }, { isUpdate: true });

  assert.deepEqual(properties.Partner, { relation: [] });
  assert.deepEqual(properties['Tracking Link'], { relation: [] });
});