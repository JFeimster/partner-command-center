// Partner Command Center — trusted lead submission + funding router
// Sprint 05: partner-gated lead intake, product-fit routing, and event logging.

'use strict';

const { findPartnerByPartnerId, createPartnerEvent } = require('../lib/notion-client');
const { validateLead } = require('../lib/lead-validation');
const { routeLead } = require('../lib/funding-router');
const { created, validationError, unauthorized, methodNotAllowed, notionError, serverError, sendJson } = require('../lib/response');

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function getHeader(req, name) {
  const headers = req && req.headers ? req.headers : {};
  const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
  const value = key ? headers[key] : '';
  return Array.isArray(value) ? value[0] : value || '';
}

function parseBody(req) {
  if (!req || !req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

function isAuthorized(req) {
  const expected = process.env.PARTNER_COMMAND_API_KEY;
  const provided = getHeader(req, 'x-api-key') || getHeader(req, 'authorization').replace(/^Bearer\s+/i, '');
  return Boolean(expected && provided && provided === expected);
}

function safeLeadSummary(lead) {
  return {
    partner_id: lead.partner_id,
    business_name: lead.business_name,
    contact_name: lead.contact_name,
    email: lead.email,
    phone: lead.phone,
    industry: lead.industry,
    monthly_revenue: lead.monthly_revenue,
    time_in_business: lead.time_in_business,
    funding_need: lead.funding_need,
    use_of_funds: lead.use_of_funds,
    urgency: lead.urgency,
    source: lead.source,
    created_at: lead.created_at
  };
}

module.exports = async function leadRouter(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try {
    body = parseBody(req);
  } catch (error) {
    return sendJson(res, validationError('Invalid JSON request body.'));
  }

  const validation = validateLead(body.lead || body);
  if (!validation.valid) return sendJson(res, validationError('Lead payload failed validation.', validation.errors));

  const lead = validation.lead;
  const partnerId = clean(lead.partner_id);

  try {
    const partner = await findPartnerByPartnerId(partnerId);
    if (!partner) return sendJson(res, validationError('Partner not found.', { partner_id: partnerId }));

    const routing = routeLead(lead);
    const eventMetadata = {
      lead: safeLeadSummary(lead),
      routing: routing,
      source: 'lead_router'
    };

    const eventPage = await createPartnerEvent({
      partner_id: partnerId,
      event_type: 'lead_submitted',
      source: 'api',
      status: routing.flags && routing.flags.length ? 'needs_review' : 'intake_received',
      summary: 'Partner lead submitted and routed for internal funding-fit review.',
      metadata: eventMetadata,
      created_at: new Date().toISOString()
    });

    return sendJson(res, created({
      action: 'submitLeadAndRouteFundingFit',
      partner_id: partnerId,
      lead: safeLeadSummary(lead),
      routing: routing,
      event: eventPage && { id: eventPage.id, url: eventPage.url }
    }));
  } catch (error) {
    if (error && (error.code || error.status)) return sendJson(res, notionError('Notion request failed.', { code: error.code, status: error.status, message: error.message }));
    return sendJson(res, serverError('Lead router failed.', { message: error && error.message ? error.message : 'Unknown error' }));
  }
};
