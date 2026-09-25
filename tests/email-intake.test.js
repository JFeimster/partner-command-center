'use strict';

const assert = require('assert');
const intake = require('../lib/email-intake');

(function run() {
  const partner = intake.classify({
    to: 'intake@example.com',
    subject: "You've enrolled a DAC Broker",
    text: 'Name: Alex Rivera\nEmail: alex@example.com\nPhone: 202-555-0101'
  });
  assert.strictEqual(partner.type, 'partner');

  const applicant = intake.classify({
    to: 'intake@example.com',
    subject: 'Application Incomplete - BankBreezy',
    text: 'Applicant: Jamie Doe\nEmail: jamie@example.com'
  });
  assert.strictEqual(applicant.type, 'applicant');

  const explicitUnknown = intake.classify({
    subject: 'Hello',
    text: 'No known intake signal here.'
  });
  assert.strictEqual(explicitUnknown.type, 'unknown');

  const parsed = intake.parseApplicant({
    subject: 'Submission Started - Giggle',
    text: 'Applicant: Jamie Doe\nEmail: jamie@example.com\nPhone: 202-555-0102\nBusiness Name: Demo LLC'
  });
  assert.strictEqual(parsed.email, 'jamie@example.com');
  assert.strictEqual(parsed.routeDetected, 'Giggle Finance');
  assert.strictEqual(parsed.status, 'Submission started');

  console.log('email-intake tests passed');
})();
