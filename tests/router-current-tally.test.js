'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const router = require('../api/router');

test('current mOe658 Tally form maps identity, profile, and one Agreement checkbox into both consent gates', () => {
  const body = {
    data: {
      id: 'submission-test',
      createdAt: '2026-10-07T14:00:00.000Z',
      fields: [
        { label: 'Full name', value: 'Marc Lampert' },
        { label: 'Best email for your partner account', value: 'marc@example.com' },
        { label: 'Mobile phone', value: '2025550100' },
        { label: 'Business or agency name', value: 'Thinking Cap Capital' },
        { label: 'City', value: 'Alexandria' },
        { label: 'State', value: 'VA' },
        { label: 'What best describes your current work or business?', value: 'Business owner' },
        { label: 'Do you have experience in sales, finance, or working with business owners?', value: 'Yes' },
        { label: 'Tell us briefly about that experience', value: 'Business funding referrals' },
        { label: 'How soon would you like to get started?', value: 'This week' },
        { label: 'What are you hoping to build through Moonshine Capital?', value: 'A referral business' },
        { label: 'Tell prospective clients a little about yourself', value: 'I help owners access capital.' },
        { label: 'Website or booking link', value: 'https://example.com' },
        { label: 'Who do you primarily work with?', value: ['Local small businesses', 'Real estate investors / professionals'] },
        { label: 'Which best describes how you tend to operate?', value: "I'm a mix of these" },
        { label: 'Would you like a 1-on-1 strategy call to get started?', value: 'No' },
        { label: 'Agreement', value: ['I agree'] }
      ]
    }
  };

  const fields = router._private.extractTallyFields(body);
  assert.equal(fields.full_name, 'Marc Lampert');
  assert.equal(fields.email, 'marc@example.com');
  assert.equal(fields.company, 'Thinking Cap Capital');
  assert.equal(fields.city, 'Alexandria');
  assert.equal(fields.state, 'VA');
  assert.equal(fields.partner_acknowledgment, 'I agree');
  assert.equal(fields.contact_permission, 'I agree');
  assert.deepEqual(router._private.validateSignupConsent(fields), []);

  const normalized = router._private.normalizePartnerFromSignup(body);
  assert.equal(normalized.partner.name, 'Marc Lampert');
  assert.equal(normalized.partner.email, 'marc@example.com');
  assert.equal(normalized.partner.company, 'Thinking Cap Capital');
  assert.equal(normalized.partner.consent_to_contact, true);
  assert.equal(normalized.partner.source_form, 'mOe658');
  assert.equal(normalized.partner.sales_experience, 'Yes');
  assert.equal(normalized.partner.preferred_start, 'This week');
  assert.equal(normalized.partner.wants_strategy_call, 'No');
});
