'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { emailLeadPageToApplicant } = require('../lib/notion/funding-leads');
const { failureDiagnostics } = require('../lib/reconciliation/applicants');

function rich(value) {
  return { rich_text: value ? [{ plain_text: value }] : [] };
}

test('maps an imported Notion Funding Lead back into an applicant for reconciliation', () => {
  const page = {
    id: 'page-irish',
    properties: {
      Name: { title: [{ plain_text: 'Irish Mae De Asis' }] },
      'Contact Name': rich('Irish Mae De Asis'),
      Email: { email: 'irishda46@outlook.com' },
      Phone: { phone_number: '(862) 340-9636' },
      Company: rich(''),
      State: rich('NJ'),
      'Monthly Revenue': { number: 3000 },
      'Revenue (Lowest Monthly)': { number: 3000 },
      'Account Type': { select: { name: 'personal' } },
      'Webhook Event ID': rich('<message@example.com>'),
      'Review Status': { status: { name: 'Received' } },
      'Lead Status': { status: { name: 'New' } },
      'API Payload': rich(JSON.stringify({
        source_event_id: '<message@example.com>',
        email_subject: 'Fwd: BankBreezy Submission Started for Irish Mae De Asis',
        email_from: 'jason@example.com',
        email_date: '2026-10-07T07:16:31.000Z',
        route_detected: 'BankBreezy',
        status: 'Submission started'
      }))
    }
  };

  const applicant = emailLeadPageToApplicant(page);
  assert.equal(applicant.notion_page_id, 'page-irish');
  assert.equal(applicant.name, 'Irish Mae De Asis');
  assert.equal(applicant.email, 'irishda46@outlook.com');
  assert.equal(applicant.phone, '(862) 340-9636');
  assert.equal(applicant.monthly_revenue, 3000);
  assert.equal(applicant.account_type, 'personal');
  assert.equal(applicant.route_detected, 'BankBreezy');
  assert.equal(applicant.status, 'Submission started');
  assert.equal(applicant.source, 'reconciliation_backfill');
});

test('reconciliation diagnostics group failures by destination and retry cause', () => {
  const diagnostics = failureDiagnostics([
    { failures: [
      { system: 'hubspot_contact', code: 'hubspot_error', status: 409 },
      { system: 'google_sheets', code: 'google_sheets_error', status: 503 }
    ] },
    { failures: [{ system: 'notion_reconciliation', code: 'notion_error', status: 429 }] }
  ]);
  assert.deepEqual(diagnostics.failure_counts_by_system, {
    hubspot_contact: 1,
    google_sheets: 1,
    notion_reconciliation: 1
  });
  assert.deepEqual(diagnostics.failure_counts_by_cause, {
    'hubspot_contact:409': 1,
    'google_sheets:503': 1,
    'notion_reconciliation:429': 1
  });
  assert.equal(diagnostics.retryable_failures, 2);
});
