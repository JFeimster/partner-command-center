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

  const tallyFunding = intake.classify({
    to: 'intake@myfunding.site',
    from: 'jason@example.com',
    subject: 'Fwd: New Tally Form Submission for Funding for ANY Reason',
    text: 'Desired amount of funding?\n$0 - $25,000\nWhat is your first name?\nAlexander\nPrimary email\narhodges892@gmail.com'
  });
  assert.strictEqual(tallyFunding.type, 'applicant');

  const tallyParsed = intake.parseApplicant({
    subject: 'Fwd: New Tally Form Submission for Funding for ANY Reason',
    text: [
      'Desired amount of funding?',
      '$0 - $25,000',
      'What is your first name?',
      'Alexander',
      'What is your last name?',
      'Hodges',
      'Phone number',
      '[+12108107187](tel:(210)%20810-7187)',
      'Primary email',
      'arhodges892@gmail.com',
      'City',
      'San Antonio',
      'State',
      'TX'
    ].join('\n')
  });
  assert.strictEqual(tallyParsed.name, 'Alexander Hodges');
  assert.strictEqual(tallyParsed.email, 'arhodges892@gmail.com');
  assert.strictEqual(tallyParsed.phone, '+12108107187');
  assert.strictEqual(tallyParsed.desiredFunding, '$0 - $25,000');
  assert.strictEqual(tallyParsed.city, 'San Antonio');
  assert.strictEqual(tallyParsed.state, 'TX');
  assert.strictEqual(tallyParsed.routeDetected, 'Tally Funding Intake');

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

  const bankBreezy = intake.parseApplicant({
    subject: 'Fwd: BankBreezy Submission Started for Vincent Tellone',
    text: [
      'Owner Email: vtellone@aol.com',
      'Owner Phone: (224) 389-1784',
      'They stated their lowest monthly revenue in the last 3 months was: $5,000',
      'They indicated the bank account is In Your Personal Name'
    ].join('\n')
  });
  assert.strictEqual(bankBreezy.name, 'Vincent Tellone');
  assert.strictEqual(bankBreezy.lowestMonthlyRevenue, '5000');
  assert.strictEqual(bankBreezy.bankAccountType, 'personal');

  const declined = intake.parseApplicant({
    subject: 'Fwd: BankBreezy Submission Started for EARL WOODMAN',
    text: [
      'Based on their answers they were declined - Revenue was too low',
      'Name: EARL WOODMAN',
      'Owner Email: earljwoodman5@gmail.com'
    ].join('\n')
  });
  assert.strictEqual(declined.status, 'Declined');
  assert.strictEqual(declined.routingOutcome, 'Declined - revenue too low');

  const hubspotForm = intake.classify({
    subject: 'Fwd: You\'ve got a new submission on the HubSpot Form "Pre-Qualification Form"',
    text: 'Funding Requested\n$100,000 - $150,000\nFirst name\nIndia\nLast name\nMackie\nEmail\nthreadtheroys@simplecgllc.com'
  });
  assert.strictEqual(hubspotForm.type, 'applicant');

  const hubspotParsed = intake.parseApplicant({
    subject: 'Fwd: You\'ve got a new submission on the HubSpot Form "Pre-Qualification Form"',
    text: [
      'CONTACT',
      'India Mackie',
      'Funding Requested',
      '$100,000 - $150,000',
      'First name',
      'India',
      'Last name',
      'Mackie',
      'Phone number',
      '9547322924',
      'Email',
      'threadtheroys@simplecgllc.com',
      'City',
      'Hollywood',
      'State/Region',
      'FL'
    ].join('\n')
  });
  assert.strictEqual(hubspotParsed.name, 'India Mackie');
  assert.strictEqual(hubspotParsed.email, 'threadtheroys@simplecgllc.com');
  assert.strictEqual(hubspotParsed.phone, '9547322924');
  assert.strictEqual(hubspotParsed.desiredFunding, '$100,000 - $150,000');
  assert.strictEqual(hubspotParsed.city, 'Hollywood');
  assert.strictEqual(hubspotParsed.state, 'FL');
  assert.strictEqual(hubspotParsed.routeDetected, 'HubSpot Form');
  assert.strictEqual(hubspotParsed.status, 'Submission received');

  console.log('email-intake tests passed');
})();
