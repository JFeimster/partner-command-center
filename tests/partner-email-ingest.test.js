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


test('does not treat forwarded DAC support identity as the broker', () => {
  const parsed = parsePartnerNotification({
    from: 'jasonfeimster@gmail.com',
    subject: "Fwd: Jason, You've enrolled a DAC Broker-or they requested we resend their welcome email!",
    text: 'From: David Allen Capital <support@davidallencapital.com>\nContact applicant at realbroker@example.com'
  });

  assert.equal(parsed.partner.name, '');
  assert.equal(parsed.partner.email, 'realbroker@example.com');
});


test('extracts Tally question and answer profile fields', () => {
  const parsed = parsePartnerNotification({
    from: 'notifications@tally.so',
    subject: 'New Tally Form Submission',
    text: [
      "What's your name?",
      'Sample Partner',
      'Where should we send your onboarding link and resources?',
      'sample.partner@example.com',
      'What best describes your current work or hustle?',
      'Other',
      'Q5: Ever worked in sales, finance, or helping business owners before?',
      'Yes',
      'Q8: How would you describe yourself?',
      "I'm a mix of these",
      'Q9: Want a 1-on-1 strategy call to get started fast?',
      'No'
    ].join('\n')
  });

  assert.equal(parsed.provider, 'tally');
  assert.equal(parsed.partner.name, 'Sample Partner');
  assert.equal(parsed.partner.email, 'sample.partner@example.com');
  assert.equal(parsed.profile.current_work, 'Other');
  assert.equal(parsed.profile.sales_experience, 'Yes');
  assert.equal(parsed.profile.self_description, "I'm a mix of these");
  assert.equal(parsed.profile.wants_strategy_call, 'No');
  assert.equal(parsed.question_answers.length, 5);
});

test('gmailSearchUrl creates an RFC message-id search link', () => {
  const { gmailSearchUrl } = emailIngest._private;
  const url = gmailSearchUrl('<abc123@example.com>');
  assert.match(url, /^https:\/\/mail\.google\.com\/mail\/u\/0\/#search\/rfc822msgid%3A/);
});

test('externalId is stable across repeated forwards of the same parsed notification', () => {
  const { externalId } = emailIngest._private;
  const parsed = parsePartnerNotification({
    from: 'sender@example.com',
    subject: 'Fwd: Partner enrollment',
    text: 'Broker Name: Sample Partner\nBroker Phone: (202) 555-0112\nBroker E-mail: sample.partner@example.com'
  });
  const one = externalId({ message_id: '<outer-one@example.com>', subject: 'Fwd: Partner enrollment' }, parsed);
  const two = externalId({ message_id: '<outer-two@example.com>', subject: 'Fwd: Partner enrollment' }, parsed);
  assert.equal(one, two);
});
