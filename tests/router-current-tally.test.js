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


test('historical mOe658 replay without Agreement is accepted as legacy needs-review without retroactive contact consent', () => {
  const body = {
    eventId: '85287efe-e838-43c3-8eb1-d680e385f701',
    eventType: 'FORM_RESPONSE',
    createdAt: '2026-08-06T20:32:30.739Z',
    data: {
      responseId: 'VpbGVpg',
      submissionId: 'VpbGVpg',
      formId: 'mOe658',
      formName: 'Join the #1 B2B Funding Platform!',
      createdAt: '2026-08-06T20:32:30.000Z',
      fields: [
        { key: 'question_OX7Yrp', label: 'What’s your name, rockstar?', type: 'INPUT_TEXT', value: 'Marc' },
        { key: 'question_VPzYdE', label: 'Where should we send your onboarding link and resources?', type: 'INPUT_EMAIL', value: 'thinkingcap49@duck.com' },
        {
          key: 'question_ElxDgq',
          label: 'What best describes your current work or hustle?',
          type: 'MULTI_SELECT',
          value: ['9d00647f-f649-442c-8c4f-d77f6543c463'],
          options: [
            { id: 'cde161d1-7a7b-4727-ac17-11852c67f63e', text: 'Affiliate / network marketer' },
            { id: '9d00647f-f649-442c-8c4f-d77f6543c463', text: 'Other (add your own)' }
          ]
        },
        {
          key: 'question_rOoLp5',
          label: 'Q5: Ever worked in sales, finance, or helping business owners before?',
          type: 'MULTIPLE_CHOICE',
          value: ['950357b5-2b0b-4943-8804-38852a8199b9'],
          options: [
            { id: '950357b5-2b0b-4943-8804-38852a8199b9', text: 'Yes' },
            { id: 'a04cfbc5-d083-41a8-981b-bd7e3eed9838', text: 'No' }
          ]
        },
        {
          key: 'question_xDJyoJ',
          label: 'Q8: How would you describe yourself?',
          type: 'MULTIPLE_CHOICE',
          value: ['884487ac-a500-4547-8d9c-eef749178652'],
          options: [
            { id: '884487ac-a500-4547-8d9c-eef749178652', text: 'I’m a mix of these' }
          ]
        },
        {
          key: 'question_RoDYgP',
          label: 'Q9: Want a 1-on-1 strategy call to get started fast?',
          type: 'MULTIPLE_CHOICE',
          value: ['9864c5b3-5bc5-49e3-86c6-dd6d32a12a92'],
          options: [
            { id: '4f8b7350-149b-48a7-889c-f55cbc301ebb', text: 'Yes' },
            { id: '9864c5b3-5bc5-49e3-86c6-dd6d32a12a92', text: 'No' }
          ]
        }
      ]
    }
  };

  const fields = router._private.extractTallyFields(body);
  assert.equal(fields.full_name, 'Marc');
  assert.equal(fields.email, 'thinkingcap49@duck.com');
  assert.equal(fields.current_position, 'Other (add your own)');
  assert.equal(fields.sales_experience, 'Yes');
  assert.equal(fields.self_description, 'I’m a mix of these');
  assert.equal(fields.wants_strategy_call, 'No');
  assert.deepEqual(router._private.validateSignupConsent(fields), ['partner_acknowledgment', 'contact_permission']);
  assert.equal(router._private.isHistoricalTallyReplayWithoutConsent(body, fields), true);

  const normalized = router._private.normalizePartnerFromSignup(body);
  assert.equal(normalized.legacy_without_consent, true);
  assert.equal(normalized.partner.email, 'thinkingcap49@duck.com');
  assert.equal(normalized.partner.name, 'Marc');
  assert.equal(normalized.partner.status, 'needs_review');
  assert.equal(normalized.partner.consent_to_contact, false);
  assert.equal(normalized.partner.legacy_submission_without_consent, true);
});
