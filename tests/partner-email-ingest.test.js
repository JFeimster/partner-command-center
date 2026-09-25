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


test('extracts DAC broker identity from forwarded Gmail body instead of provider headers', () => {
  const parsed = parsePartnerNotification({
    from: 'jasonfeimster@gmail.com',
    subject: "Fwd: Jason, You've enrolled a DAC Broker-or they requested we resend their welcome email!",
    text: [
      '---------- Forwarded message ---------',
      'From: David Allen Capital, Inc. <support@davidallencapital.com>',
      "Subject: Jason, You've enrolled a DAC Broker-or they requested we resend their welcome email!",
      'Congratulations! You have a new Independent Broker!',
      'Broker Name: Eunice Bajoie',
      'Broker Phone: (504) 451-5774',
      'Broker E-mail: ehowebajoie@gmail.com'
    ].join('\n')
  });

  assert.equal(parsed.provider, 'david_allen_capital');
  assert.equal(parsed.partner.name, 'Eunice Bajoie');
  assert.equal(parsed.partner.email, 'ehowebajoie@gmail.com');
  assert.equal(parsed.partner.phone, '(504) 451-5774');
});

test('extracts adjacent DAC labels when markup or forwarding flattens fields', () => {
  const parsed = parsePartnerNotification({
    from: 'jasonfeimster@gmail.com',
    subject: 'Fwd: DAC broker enrollment',
    html: '<div>From: David Allen Capital &lt;support@davidallencapital.com&gt;</div><div>Broker Name: Eunice Bajoie Broker Phone: (504) 451-5774 Broker E-mail: ehowebajoie@gmail.com</div>'
  });

  assert.equal(parsed.partner.name, 'Eunice Bajoie');
  assert.equal(parsed.partner.email, 'ehowebajoie@gmail.com');
  assert.equal(parsed.partner.phone, '(504) 451-5774');
});

test('stripHtml preserves structural line boundaries', () => {
  const { stripHtml } = emailIngest._private;
  assert.equal(
    stripHtml('<div>Broker Name: Eunice Bajoie</div><div>Broker Phone: (504) 451-5774</div>'),
    'Broker Name: Eunice Bajoie\nBroker Phone: (504) 451-5774'
  );
});
