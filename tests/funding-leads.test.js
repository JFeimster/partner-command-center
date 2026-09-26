'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  buildProperties,
  stableEmailLeadId,
  numericMoney,
  normalizedAccountType,
  buildEmailFundingLeadProperties
} = require('../lib/notion/funding-leads');

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

test('forwarded-email lead IDs are stable by normalized email', () => {
  assert.equal(stableEmailLeadId(' Jane@Example.com '), stableEmailLeadId('jane@example.com'));
  assert.match(stableEmailLeadId('jane@example.com'), /^maillead_[a-f0-9]{24}$/);
});

test('money parser does not turn a funding range into a fake exact amount', () => {
  assert.equal(numericMoney('$5,000'), 5000);
  assert.equal(numericMoney('$10,000 - $25,000'), null);
  assert.equal(numericMoney(''), null);
});

test('email property mapper writes a tight create projection', () => {
  const props = buildEmailFundingLeadProperties({
    external_event_id: '<message-1@example.com>',
    name: 'Vincent Tellone',
    email: 'VTellone@AOL.com',
    phone: '(224) 389-1784',
    business_name: 'Tellone Services LLC',
    monthly_revenue: '7000',
    lowest_monthly_revenue: '$5,000',
    account_type: 'In Your Personal Name',
    state: 'IL',
    route_detected: 'BankBreezy',
    status: 'Submission started',
    email_subject: 'BankBreezy Submission Started for Vincent Tellone',
    email_from: 'alerts@bankbreezy.com'
  });

  assert.equal(props.Name.title[0].text.content, 'Vincent Tellone');
  assert.equal(props['Contact Name'].rich_text[0].text.content, 'Vincent Tellone');
  assert.equal(props.Email.email, 'vtellone@aol.com');
  assert.equal(props.Company.rich_text[0].text.content, 'Tellone Services LLC');
  assert.equal(props['Monthly Revenue'].number, 7000);
  assert.equal(props['Revenue (Lowest Monthly)'].number, 5000);
  assert.equal(props['Account Type'].select.name, 'personal');
  assert.equal(props['Intake Channel'].select.name, 'Email');
  assert.equal(props['Submission Method'].select.name, 'Imported Email');
  assert.equal(props['Lead Status'].status.name, 'New');
  assert.equal(props['Review Status'].status.name, 'Received');
});

test('email update projection preserves lifecycle fields and keeps identity fields tight', () => {
  const props = buildEmailFundingLeadProperties({
    external_event_id: 'event-2',
    name: 'BankBreezy Submission Started for Vincent Tellone',
    email: 'vtellone@aol.com',
    phone: '2243891784',
    account_type: 'business'
  }, { isUpdate: true });

  assert.equal('Lead Status' in props, false);
  assert.equal('Review Status' in props, false);
  assert.equal('External Lead ID' in props, false);
  assert.equal('Name' in props, false);
  assert.equal(props['Account Type'].select.name, 'business');
  assert.equal(normalizedAccountType('business account'), 'business');
});
