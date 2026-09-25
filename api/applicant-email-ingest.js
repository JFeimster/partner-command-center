'use strict';

const { parseApplicant, externalId, clean } = require('../lib/email-intake');
const { isAuthorized, parseBody } = require('../lib/action-auth');
const { upsertApplicantContact, upsertApplicantDeal } = require('../lib/hubspot-client');
const { syncApplicant } = require('../lib/google-sheets-sync');
const { validationError, unauthorized, methodNotAllowed, sendJson, created, success, serverError } = require('../lib/response');

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
    monthly_revenue: parsed.revenue,
    desired_funding_amount: parsed.desiredFunding,
    city: parsed.city,
    state: parsed.state,
    status: parsed.status,
    route_detected: parsed.routeDetected,
    source: 'forwarded_email',
    email_subject: clean(body.subject),
    email_from: clean(body.from),
    email_date: clean(body.date),
    raw_body_preview: parsed.raw_text.slice(0, 1200)
  };

  try {
    const hubspotContact = await upsertApplicantContact(applicant);
    const hubspotDeal = await upsertApplicantDeal(applicant, hubspotContact && hubspotContact.contact_id);
    const sheets = await syncApplicant(applicant, {
      hubspot_contact_id: hubspotContact && hubspotContact.contact_id || null,
      hubspot_deal_id: hubspotDeal && hubspotDeal.deal_id || null
    });

    return sendJson(res, created({
      action: 'ingestApplicantEmail',
      result: 'accepted',
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
      persistence: {
        hubspot_contact: hubspotContact,
        hubspot_deal: hubspotDeal,
        google_sheets: sheets,
        notion: {
          status: 'not_written',
          reason: 'raw email notifications do not fabricate a complete Funding Leads record'
        }
      },
      external_event_id: applicant.external_event_id
    }));
  } catch (error) {
    return sendJson(res, serverError('Applicant email ingestion failed.', {
      code: error && error.code,
      status: error && error.status,
      message: error && error.message ? error.message : 'Unknown error'
    }));
  }
};
