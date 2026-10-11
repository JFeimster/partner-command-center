'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { safeApplicantContactUpdateProperties, parseDealEventTimestamp } = require('../lib/hubspot-client');

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
