'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  stableApplicantRecordId,
  exactMoney,
  normalizedStatus,
  applicantValues
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
