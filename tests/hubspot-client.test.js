'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { safeApplicantContactUpdateProperties } = require('../lib/hubspot-client');

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
