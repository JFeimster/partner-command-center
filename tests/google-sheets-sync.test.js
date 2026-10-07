'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  stableApplicantRecordId,
  exactMoney,
  normalizedStatus,
  applicantValues,
  safeApplicantUpdateValues,
  selectApplicantCaseCandidate
} = require('../lib/google-sheets-sync');

test('stable applicant record IDs converge by normalized email', () => {
  assert.equal(
    stableApplicantRecordId(' Jane@Example.com '),
    stableApplicantRecordId('jane@example.com')
  );
  assert.match(stableApplicantRecordId('jane@example.com'), /^MAIL-[A-F0-9]{16}$/);
});

test('exact money refuses to invent a number from a range', () => {
  assert.equal(exactMoney('$5,000'), 5000);
  assert.equal(exactMoney('$10,000 - $25,000'), '');
  assert.equal(exactMoney('$0 – $25,000'), '');
});

test('status normalization prioritizes terminal funding states', () => {
  assert.equal(normalizedStatus('Declined - Time in business was too short'), 'Closed Lost');
  assert.equal(normalizedStatus('Funded'), 'Closed Won');
  assert.equal(normalizedStatus('Submission started'), 'Submission Started');
});

test('applicant row mapping targets the existing Master Applicants CRM schema', () => {
  const values = applicantValues({
    external_event_id: '<message@example.com>',
    name: 'Linda Johnson',
    email: 'northga70@gmail.com',
    phone: '(678) 978-0362',
    business_name: 'Admin Northn LLC',
    monthly_revenue: '3000',
    lowest_monthly_revenue: '3000',
    desired_funding_amount: '$0 - $25,000',
    city: 'Atlanta',
    state: 'GA',
    status: 'Submission started',
    route_detected: 'BankBreezy',
    routing_outcome: 'Advanced to Giggle Finance',
    email_subject: 'BankBreezy Submission Started for Linda Johnson',
    email_date: '2026-10-07T07:16:59.000Z'
  }, {
    hubspot_contact_id: '123',
    hubspot_deal_id: '456'
  }, { isNew: true });

  assert.equal(values.D, 'BankBreezy');
  assert.equal(values.E, 'Forwarded Email');
  assert.equal(values.I, 'Linda Johnson');
  assert.equal(values.J, 'Linda');
  assert.equal(values.K, 'Johnson');
  assert.equal(values.M, 'northga70@gmail.com');
  assert.equal(values.U, 'BankBreezy');
  assert.equal(values.V, undefined);
  assert.equal(values.Y, 'Submission Started');
  assert.equal(values.AQ, '123');
  assert.equal(values.AS, '456');
  assert.equal(values.AT, 'northga70@gmail.com');
  assert.match(values.A, /^MAIL-/);
});


test('service account JSON can supply direct credentials without split env vars', () => {
  const previous = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const previousEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const previousKey = process.env.GOOGLE_PRIVATE_KEY;
  try {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      client_email: 'partner-command-center@example.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n'
    });
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_PRIVATE_KEY;
    const mod = require('../lib/google-sheets-sync');
    const parsed = mod.serviceAccountJson();
    assert.equal(parsed.client_email, 'partner-command-center@example.iam.gserviceaccount.com');
    assert.match(parsed.private_key, /BEGIN PRIVATE KEY/);
  } finally {
    if (previous === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    else process.env.GOOGLE_SERVICE_ACCOUNT_KEY = previous;
    if (previousEmail === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    else process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = previousEmail;
    if (previousKey === undefined) delete process.env.GOOGLE_PRIVATE_KEY;
    else process.env.GOOGLE_PRIVATE_KEY = previousKey;
  }
});


test('existing applicant updates preserve lifecycle and notes from stale forwards', () => {
  const existing = new Array(46).fill('');
  const index = (column) => {
    let value = 0;
    for (const ch of column) value = value * 26 + (ch.charCodeAt(0) - 64);
    return value - 1;
  };
  existing[index('M')] = 'amanda@example.com';
  existing[index('Y')] = 'Under Review';
  existing[index('AM')] = 'Operator notes that must survive old email replay';

  const values = safeApplicantUpdateValues({
    external_event_id: '<old-message@example.com>',
    name: 'Amanda Rhodes',
    email: 'amanda@example.com',
    phone: '2025550101',
    status: 'Submission started',
    route_detected: 'BankBreezy',
    routing_outcome: 'Advanced to Giggle Finance',
    email_subject: 'Old BankBreezy notification'
  }, {
    hubspot_contact_id: '123',
    hubspot_deal_id: '456'
  }, existing);

  assert.equal('Y' in values, false);
  assert.equal('AM' in values, false);
  assert.equal(values.F, '<old-message@example.com>');
  assert.equal(values.AQ, '123');
  assert.equal(values.AS, '456');
  assert.equal(values.N, '2025550101');
});


test('case-aware sheet matching prefers the application closest to the original provider event', () => {
  const index = (column) => {
    let value = 0;
    for (const ch of column) value = value * 26 + (ch.charCodeAt(0) - 64);
    return value - 1;
  };
  const older = new Array(46).fill('');
  older[index('B')] = '2026-04-20T20:24:26.000Z';
  older[index('F')] = '<older@example.com>';
  older[index('AS')] = 'deal-old';

  const matching = new Array(46).fill('');
  matching[index('B')] = '2026-04-21T20:46:09.000Z';
  matching[index('F')] = '<matching@example.com>';
  matching[index('AS')] = 'deal-matching';

  const selected = selectApplicantCaseCandidate([
    { row_number: 152, row: older },
    { row_number: 155, row: matching }
  ], {
    email: 'clar80837@gmail.com',
    email_date: '2026-04-21T20:46:00.000Z',
    external_event_id: '<new-forward@example.com>'
  });

  assert.equal(selected.row_number, 155);
  assert.equal(selected.match_strategy, 'event_time');
});
