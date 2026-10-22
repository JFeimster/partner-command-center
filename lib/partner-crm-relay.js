'use strict';

const { createHash } = require('crypto');
const CANONICAL_URL = 'https://loaowmappekunngjknnx.supabase.co/functions/v1/partner-crm-ingest';

function partnerCrmCorrelationId(submissionId, formId = 'mOe658') {
  const id = typeof submissionId === 'string' ? submissionId.trim() : '';
  if (!id) return '';
  const prefix = formId === 'mOe658' ? 'tally_mOe658' : 'partner_intake';
  const digest = createHash('sha256').update(id).digest('hex').slice(0, 32);
  return `${prefix}_${digest}`;
}

function configurationStatus(options = {}) {
  const url = options.url === undefined ? process.env.PARTNER_CRM_INGEST_URL : options.url;
  const token = options.token === undefined ? process.env.PARTNER_CRM_INGEST_TOKEN : options.token;
  return {
    configured: Boolean(url && token && url === CANONICAL_URL),
    endpoint_matches_canonical: url === CANONICAL_URL
  };
}

async function relayPartnerApplication(input, options = {}) {
  const url = options.url === undefined ? process.env.PARTNER_CRM_INGEST_URL : options.url;
  const token = options.token === undefined ? process.env.PARTNER_CRM_INGEST_TOKEN : options.token;
  if (!url && !token) return { configured: false };
  if (!url || !token || url !== CANONICAL_URL) throw new Error('Partner CRM ingestion is not configured');
  if (!input.submission_id || !input.email) throw new Error('Partner CRM requires a stable submission identity');
  const formId = input.form_id || 'mOe658';
  const correlationId = partnerCrmCorrelationId(input.submission_id, formId);

  const send = options.fetch || fetch;
  const response = await send(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      source: 'tally',
      submission_id: input.submission_id,
      correlation_id: correlationId,
      email: input.email,
      name: input.name,
      agency_name: input.agency_name || '',
      applicant_type: 'individual',
      form_id: formId,
      answers: input.answers || {}
    }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`Partner CRM ingestion failed (${response.status})`);
  const result = await response.json();
  if (!result || result.ok !== true) throw new Error('Partner CRM ingestion returned an invalid response');
  if (result.correlation_id && result.correlation_id !== correlationId) throw new Error('Partner CRM ingestion correlation ID mismatch');
  return { configured: true, applicationId: result.application_id || null, duplicate: Boolean(result.duplicate), correlationId };
}

module.exports = { relayPartnerApplication, configurationStatus, partnerCrmCorrelationId };
