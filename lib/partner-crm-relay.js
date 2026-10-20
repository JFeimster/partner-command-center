'use strict';

const CANONICAL_URL = 'https://loaowmappekunngjknnx.supabase.co/functions/v1/partner-crm-ingest';

async function relayPartnerApplication(input, options = {}) {
  const url = options.url === undefined ? process.env.PARTNER_CRM_INGEST_URL : options.url;
  const token = options.token === undefined ? process.env.PARTNER_CRM_INGEST_TOKEN : options.token;
  if (!url && !token) return { configured: false };
  if (!url || !token || url !== CANONICAL_URL) throw new Error('Partner CRM ingestion is not configured');
  if (!input.submission_id || !input.email) throw new Error('Partner CRM requires a stable submission identity');

  const send = options.fetch || fetch;
  const response = await send(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      source: 'tally',
      submission_id: input.submission_id,
      email: input.email,
      name: input.name,
      agency_name: input.agency_name || '',
      applicant_type: 'individual',
      form_id: input.form_id || 'mOe658',
      answers: input.answers || {}
    }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`Partner CRM ingestion failed (${response.status})`);
  const result = await response.json();
  if (!result || result.ok !== true) throw new Error('Partner CRM ingestion returned an invalid response');
  return { configured: true, applicationId: result.application_id || null, duplicate: Boolean(result.duplicate) };
}

module.exports = { relayPartnerApplication };
