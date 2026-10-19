'use strict';

const at = minute => `2026-10-19T15:${String(minute).padStart(2, '0')}:00Z`;
function submission(event_id, submission_id, provider_id, product_id, status, minute, extra = {}) {
  return {
    event_id, submission_id, record_id: 'CASE-1', provider_id, product_id,
    notion_provider_page_id: 'notion-' + provider_id,
    notion_product_page_id: 'notion-' + product_id,
    event_type: status, status, occurred_at: at(minute),
    idempotency_key: 'idem-' + event_id, source_system: 'synthetic-provider',
    ...extra
  };
}
function communication(event_id, status, minute, extra = {}) {
  return {
    event_id, record_id: 'CASE-1', channel: 'email', direction: 'outbound', status,
    workflow_id: 'follow-up-1', occurred_at: at(minute),
    idempotency_key: 'idem-' + event_id, source_system: 'synthetic-mail',
    ...extra
  };
}
const submissionEvents = [
  submission('sub-1', 'S-1', 'P-1', 'PR-1', 'submitted', 0, { external_submission_id: 'EXT-1' }),
  submission('sub-2', 'S-2', 'P-2', 'PR-2', 'submitted', 1, { external_submission_id: 'EXT-2' }),
  submission('sub-3', 'S-1', 'P-1', 'PR-1', 'under_review', 2),
  submission('sub-4', 'S-1', 'P-1', 'PR-1', 'offered', 3, { offer_id: 'OFF-1', offer_amount: '1200.00', source_event_id: 'E-OFFER-1' }),
  submission('sub-5', 'S-1', 'P-1', 'PR-1', 'funded', 4, { funded_amount: '1100.00', source_event_id: 'E-FUND-1' }),
  submission('sub-6', 'S-2', 'P-2', 'PR-2', 'declined', 5),
  submission('sub-7', 'S-3', 'P-1', 'PR-1', 'submitted', 6, { external_submission_id: 'EXT-3' }),
  submission('sub-8', 'S-3', 'P-1', 'PR-1', 'withdrawn', 7)
];
const communicationEvents = [
  communication('mail-1', 'queued', 0, { consent_basis: 'documented-opt-in' }),
  communication('mail-2', 'attempted', 1, { consent_basis: 'documented-opt-in' }),
  communication('mail-3', 'sent', 2, { consent_basis: 'documented-opt-in', external_message_id: 'M-1' }),
  communication('mail-4', 'delivered', 3, { consent_basis: 'documented-opt-in', external_message_id: 'M-1' }),
  communication('mail-5', 'failed', 4),
  communication('mail-6', 'canceled', 5),
  communication('mail-7', 'queued', 6, { consent_basis: 'documented-opt-in' }),
  communication('mail-8', 'replied', 7, { direction: 'inbound', external_message_id: 'R-1' }),
  communication('mail-9', 'suppressed', 8, { suppression_reason: 'opt-out' })
];
module.exports = { submission, communication, submissionEvents, communicationEvents };
