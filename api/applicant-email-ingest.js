'use strict';

const { parseApplicant, externalId, clean } = require('../lib/email-intake');
const { isAuthorized, parseBody } = require('../lib/action-auth');
const { upsertApplicantContact, upsertApplicantDeal } = require('../lib/hubspot-client');
const { syncApplicant } = require('../lib/google-sheets-sync');
const { upsertEmailFundingLead } = require('../lib/notion/funding-leads');
const { validationError, unauthorized, methodNotAllowed, sendJson, created, success } = require('../lib/response');

function failureResult(error) {
  return {
    status: 'failed',
    code: error && error.code || 'unknown_error',
    http_status: error && error.status || null,
    message: error && error.message ? error.message : 'Unknown error'
  };
}

async function capture(work) {
  try {
    return await work();
  } catch (error) {
    return failureResult(error);
  }
}

function persistenceSummary(value) {
  if (!value) return { status: 'missing' };
  return {
    configured: value.configured === undefined ? null : Boolean(value.configured),
    status: value.status || 'unknown',
    code: value.code || null,
    http_status: value.http_status || null,
    contact_id: value.contact_id || null,
    deal_id: value.deal_id || null,
    notion_page_id: value.notion_page_id || null,
    external_lead_id: value.external_lead_id || null,
    contact_association: value.contact_association || null,
    receiver: value.receiver || null
  };
}

function logPersistence(externalEventId, persistence, failedSystems) {
  const summary = {
    event_id: externalEventId || null,
    result: failedSystems.length ? 'accepted_with_errors' : 'accepted',
    destinations: {
      hubspot_contact: persistenceSummary(persistence.hubspot_contact),
      hubspot_deal: persistenceSummary(persistence.hubspot_deal),
      notion: persistenceSummary(persistence.notion),
      google_sheets: persistenceSummary(persistence.google_sheets)
    },
    failed_systems: failedSystems
  };
  console.log('[applicant-email-ingest]', JSON.stringify(summary));
  return summary;
}

module.exports = async function applicantEmailIngest(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try { body = parseBody(req); }
  catch (_) { return sendJson(res, validationError('Invalid JSON request body.')); }

  const parsed = parseApplicant(body || {});
  if (!parsed.email) {
    return sendJson(res, success({
      action: 'ingestApplicantEmail',
      result: 'review_required',
      reason: 'applicant_email_not_found',
      external_event_id: externalId(body || {}),
      parsed: {
        name: parsed.name || null,
        business_name: parsed.businessName || null,
        status: parsed.status,
        route_detected: parsed.routeDetected
      }
    }));
  }

  const applicant = {
    external_event_id: externalId(body || {}),
    name: parsed.name || parsed.email,
    email: parsed.email.toLowerCase(),
    phone: parsed.phone,
    business_name: parsed.businessName,
    monthly_revenue: parsed.monthlyRevenue || parsed.revenue,
    lowest_monthly_revenue: parsed.lowestMonthlyRevenue,
    desired_funding_amount: parsed.desiredFunding,
    account_type: parsed.bankAccountType,
    city: parsed.city,
    state: parsed.state,
    status: parsed.status,
    route_detected: parsed.routeDetected,
    routing_outcome: parsed.routingOutcome,
    source: 'forwarded_email',
    email_subject: clean(body.subject),
    email_from: clean(body.from),
    email_date: clean(body.date),
    raw_body_preview: parsed.raw_text.slice(0, 1200)
  };

  const [hubspotContact, notion] = await Promise.all([
    capture(() => upsertApplicantContact(applicant)),
    capture(() => upsertEmailFundingLead(applicant))
  ]);

  const hubspotDeal = hubspotContact && hubspotContact.status !== 'failed'
    ? await capture(() => upsertApplicantDeal(applicant, hubspotContact && hubspotContact.contact_id))
    : { status: 'skipped', reason: 'hubspot_contact_failed' };

  const sheets = await capture(() => syncApplicant(applicant, {
    hubspot_contact_id: hubspotContact && hubspotContact.contact_id || null,
    hubspot_deal_id: hubspotDeal && hubspotDeal.deal_id || null,
    notion_page_id: notion && notion.notion_page_id || null,
    notion_external_lead_id: notion && notion.external_lead_id || null
  }));

  const persistence = {
    hubspot_contact: hubspotContact,
    hubspot_deal: hubspotDeal,
    notion,
    google_sheets: sheets
  };
  const failedSystems = Object.entries(persistence)
    .filter(([, value]) => value && value.status === 'failed')
    .map(([key]) => key);

  const persistenceStatus = logPersistence(applicant.external_event_id, persistence, failedSystems);

  return sendJson(res, created({
    action: 'ingestApplicantEmail',
    result: failedSystems.length ? 'accepted_with_errors' : 'accepted',
    applicant: {
      name: applicant.name,
      email: applicant.email,
      business_name: applicant.business_name || null,
      desired_funding_amount: applicant.desired_funding_amount || null,
      city: applicant.city || null,
      state: applicant.state || null,
      status: applicant.status,
      route_detected: applicant.route_detected
    },
    persistence,
    persistence_status: persistenceStatus,
    failed_systems: failedSystems,
    external_event_id: applicant.external_event_id
  }));
};

module.exports._private = { failureResult, capture, persistenceSummary, logPersistence };
