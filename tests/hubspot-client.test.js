'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  safeApplicantContactUpdateProperties,
  parseDealEventTimestamp,
  upsertApplicantContact,
  upsertApplicantDeal
} = require('../lib/hubspot-client');

test('stale applicant emails only fill blank HubSpot contact fields', () => {
  const existing = {
    properties: {
      firstname: 'Amanda',
      lastname: 'Rhodes',
      phone: '9995550000',
      company: '',
      city: 'Mobile',
      state: 'AL'
    }
  };
  const safe = safeApplicantContactUpdateProperties(existing, {
    email: 'amanda@example.com',
    firstname: 'Amanda',
    lastname: 'Rhodes',
    phone: '2516101033',
    company: 'Rhodes LLC',
    city: 'Pensacola',
    state: 'FL'
  });

  assert.deepEqual(safe, { company: 'Rhodes LLC' });
});

test('HubSpot deal source dates are parseable for historical case matching', () => {
  const ts = parseDealEventTimestamp({
    properties: {
      description: [
        'Original email subject: BankBreezy Submission Started for Repeat Applicant',
        'Original email date: 2026-03-15T12:00:00.000Z',
        'Applicant email: repeat@example.com'
      ].join('\n')
    }
  });
  assert.equal(ts, Date.parse('2026-03-15T12:00:00.000Z'));
});


test('deal event timestamps support same-event stage correction', () => {
  const existing = {
    properties: {
      description: 'Original email date: Tue, 07 Mar 2023 21:23:29 +0000'
    }
  };
  assert.equal(
    parseDealEventTimestamp(existing),
    Date.parse('Tue, 07 Mar 2023 21:23:29 +0000')
  );
});

test('HubSpot contact create 409 re-queries and safely updates the raced contact', async () => {
  const previousToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  const previousFetch = global.fetch;
  process.env.HUBSPOT_PRIVATE_APP_TOKEN = 'test-token';
  const calls = [];
  const responses = [
    { status: 200, body: { results: [] } },
    { status: 409, body: { message: 'Contact already exists' } },
    { status: 200, body: { results: [{ id: 'contact-1', properties: { firstname: 'Jane', company: '' } }] } },
    { status: 200, body: { id: 'contact-1' } }
  ];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET', body: options.body && JSON.parse(options.body) });
    const next = responses.shift();
    return new Response(JSON.stringify(next.body), { status: next.status });
  };
  try {
    const result = await upsertApplicantContact({ email: 'jane@example.com', name: 'Jane Smith', business_name: 'Smith LLC' });
    assert.equal(result.status, 'updated_after_conflict');
    assert.equal(result.contact_id, 'contact-1');
    assert.equal(calls.filter((call) => call.url.endsWith('/crm/v3/objects/contacts')).length, 1);
    assert.deepEqual(calls.at(-1).body.properties, { lastname: 'Smith', company: 'Smith LLC' });
  } finally {
    global.fetch = previousFetch;
    if (previousToken === undefined) delete process.env.HUBSPOT_PRIVATE_APP_TOKEN;
    else process.env.HUBSPOT_PRIVATE_APP_TOKEN = previousToken;
  }
});

test('HubSpot deal create 409 reuses the deal matching the source event', async () => {
  const previousToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  const previousFetch = global.fetch;
  process.env.HUBSPOT_PRIVATE_APP_TOKEN = 'test-token';
  const eventId = '<request-1@example.com>';
  const calls = [];
  const responses = [
    { status: 200, body: { results: [] } },
    { status: 409, body: { message: 'Conflict' } },
    { status: 200, body: { results: [{ id: 'deal-1', properties: { description: 'External event ID: ' + eventId } }] } },
    { status: 200, body: { id: 'deal-1' } }
  ];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    const next = responses.shift();
    return new Response(JSON.stringify(next.body), { status: next.status });
  };
  try {
    const result = await upsertApplicantDeal({ email: 'jane@example.com', name: 'Jane Smith', external_event_id: eventId }, null);
    assert.equal(result.status, 'updated_after_conflict');
    assert.equal(result.deal_id, 'deal-1');
    assert.equal(calls.filter((call) => call.method === 'POST' && call.url.endsWith('/crm/v3/objects/deals')).length, 1);
  } finally {
    global.fetch = previousFetch;
    if (previousToken === undefined) delete process.env.HUBSPOT_PRIVATE_APP_TOKEN;
    else process.env.HUBSPOT_PRIVATE_APP_TOKEN = previousToken;
  }
});

test('HubSpot does not create or guess a deal when applicant email matches multiple cases', async () => {
  const previousToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  const previousFetch = global.fetch;
  process.env.HUBSPOT_PRIVATE_APP_TOKEN = 'test-token';
  let createCalled = false;
  global.fetch = async (url, options = {}) => {
    if (options.method === 'POST' && String(url).endsWith('/crm/v3/objects/deals')) createCalled = true;
    return new Response(JSON.stringify({ results: [
      { id: 'deal-a', properties: { description: 'Applicant email: jane@example.com\nExternal event ID: old-a' } },
      { id: 'deal-b', properties: { description: 'Applicant email: jane@example.com\nExternal event ID: old-b' } }
    ] }), { status: 200 });
  };
  try {
    await assert.rejects(
      upsertApplicantDeal({ email: 'jane@example.com', name: 'Jane Smith', external_event_id: 'new-event' }, null),
      { code: 'hubspot_applicant_deal_ambiguous', status: 409 }
    );
    assert.equal(createCalled, false);
  } finally {
    global.fetch = previousFetch;
    if (previousToken === undefined) delete process.env.HUBSPOT_PRIVATE_APP_TOKEN;
    else process.env.HUBSPOT_PRIVATE_APP_TOKEN = previousToken;
  }
});
