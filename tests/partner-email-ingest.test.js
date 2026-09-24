'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const emailIngest = require('../api/partner-email-ingest');

const { parsePartnerNotification, providerFromEmail } = emailIngest._private;

test('detects DAC provider and extracts labeled identity fields', () => {
  const parsed = parsePartnerNotification({
    from: 'support@davidallencapital.com',
    subject: "You've enrolled a DAC Broker",
    text: 'Name: Jane Broker\nEmail: jane@example.com\nPhone: (202) 555-0112'
  });

  assert.equal(parsed.provider, 'david_allen_capital');
  assert.equal(parsed.partner.name, 'Jane Broker');
  assert.equal(parsed.partner.email, 'jane@example.com');
  assert.match(parsed.partner.phone, /202/);
});

test('generic notifications still extract first email and phone', () => {
  const parsed = parsePartnerNotification({
    from: 'notifications@example.com',
    subject: 'New affiliate',
    text: 'Please onboard Alex. alex@example.com 202-555-0109'
  });
  assert.equal(parsed.partner.email, 'alex@example.com');
  assert.match(parsed.partner.phone, /202/);
});

test('provider detection recognizes Tally notifications', () => {
  assert.equal(providerFromEmail('notify@tally.so', 'New submission', ''), 'tally');
});
