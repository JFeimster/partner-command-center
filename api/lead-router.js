// Partner Command Center — canonical downstream funding-lead intake.
// Partner signup remains isolated on /api/router and /api/partner-signup.

'use strict';

const crypto = require('crypto');
const { findPartnerByPartnerId, queryDatabase } = require('../lib/notion-client');
const { upsertFundingLead } = require('../lib/notion/funding-leads');
const { createPartnerLeadEvent } = require('../lib/notion/partner-events');

const SOURCE_SYSTEMS = new Set([
  'am_i_fundable',
  'fundstack_ai',
  'vertical_funnel',
  'embed_widget',
  'partner_landing_page',
  'gpt_action',
  'operator_entry',
  'legacy_partner_dashboard'
]);

const REVIEW_STATUSES = new Set([
  'new',
  'scored',
  'queued_for_review',
  'awaiting_documents',
  'in_human_review',
  'reviewed',
  'nurture',
  'closed',
  'rejected_invalid'
]);

const REQUIRED_LEAD_FIELDS = [
  'lead_id',
  'applicant',
  'answers',
  'score_result',
  'lead_priority',
  'primary_funding_family',
  'secondary_funding_families',
  'risks',
  'strengths',
  'recommended_documents',
  'next_steps',
  'manual_review_recommended',
  'source_url',
  'source_asset',
  'consent',
  'review_status',
  'created_at',
  'updated_at'
];

const REQUIRED_NULLABLE_LEAD_FIELDS = [
  'partner_id',
  'tracking_link_id',
  'campaign_id',
  'widget_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content'
];

class RouterError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function getHeader(req, name) {
  const headers = req && req.headers ? req.headers : {};
  const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
  const value = key ? headers[key] : '';
  return Array.isArray(value) ? value[0] : value || '';
}

function respond(res, status, body) {
  if (!res) return { status, body };
  res.statusCode = status;
  if (typeof res.setHeader === 'function') res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (typeof res.end === 'function') return res.end(JSON.stringify(body));
  if (typeof res.json === 'function') return res.status(status).json(body);
  return { status, body };
}

function parseBody(req) {
  if (!req || req.body === undefined || req.body === null || req.body === '') {
    throw new RouterError(400, 'invalid_json', 'A JSON request body is required.');
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      throw new RouterError(400, 'invalid_json', 'The request body is not valid JSON.');
    }
  }
  if (typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new RouterError(400, 'invalid_json', 'The request body must be a JSON object.');
  }
  return req.body;
}

function authorize(req) {
  const expected = clean(process.env.PARTNER_COMMAND_API_KEY);
  const provided = clean(getHeader(req, 'x-api-key')) || clean(getHeader(req, 'authorization')).replace(/^Bearer\s+/i, '');
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (!expected || !provided || expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new RouterError(401, 'unauthorized', 'A valid trusted API key is required.');
  }
}

function isDateTime(value) {
  return Boolean(clean(value) && !Number.isNaN(Date.parse(value)));
}

function validateRequired(request) {
  const errors = [];
  if (request.schema_version !== '1.0.0') errors.push({ field: 'schema_version', message: 'schema_version must be 1.0.0.' });
  if (clean(request.idempotency_key).length < 8) errors.push({ field: 'idempotency_key', message: 'idempotency_key must contain at least 8 characters.' });
  if (!SOURCE_SYSTEMS.has(request.source_system)) errors.push({ field: 'source_system', message: 'source_system is not supported.' });
  if (!isDateTime(request.submitted_at)) errors.push({ field: 'submitted_at', message: 'submitted_at must be an ISO date-time.' });

  const lead = request.lead;
  if (!lead || typeof lead !== 'object' || Array.isArray(lead)) {
    errors.push({ field: 'lead', message: 'lead must be an object.' });
    return errors;
  }

  REQUIRED_LEAD_FIELDS.forEach((field) => {
    if (lead[field] === undefined || lead[field] === null || (typeof lead[field] === 'string' && !clean(lead[field]))) {
      errors.push({ field: `lead.${field}`, message: `${field} is required.` });
    }
  });

  REQUIRED_NULLABLE_LEAD_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(lead, field)) {
      errors.push({ field: `lead.${field}`, message: `${field} must be present and may be null.` });
    }
  });

  const applicant = lead.applicant || {};
  ['first_name', 'last_name', 'business_name', 'email', 'phone', 'state'].forEach((field) => {
    if (!clean(applicant[field])) errors.push({ field: `lead.applicant.${field}`, message: `${field} is required.` });
  });
  if (applicant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(applicant.email))) {
    errors.push({ field: 'lead.applicant.email', message: 'email must be valid.' });
  }

  const answers = lead.answers || {};
  ['business_persona', 'monthly_revenue', 'time_in_business_months', 'credit_score', 'bank_status', 'business_structure', 'funding_purpose', 'desired_funding_amount', 'red_flags'].forEach((field) => {
    if (answers[field] === undefined || answers[field] === null) errors.push({ field: `lead.answers.${field}`, message: `${field} is required.` });
  });
  if (!Number.isFinite(Number(answers.monthly_revenue)) || Number(answers.monthly_revenue) < 0) errors.push({ field: 'lead.answers.monthly_revenue', message: 'monthly_revenue must be zero or greater.' });
  if (!Number.isInteger(Number(answers.time_in_business_months)) || Number(answers.time_in_business_months) < 0) errors.push({ field: 'lead.answers.time_in_business_months', message: 'time_in_business_months must be a non-negative integer.' });
  if (!Number.isInteger(Number(answers.credit_score)) || Number(answers.credit_score) < 0 || Number(answers.credit_score) > 850) errors.push({ field: 'lead.answers.credit_score', message: 'credit_score must be between 0 and 850.' });
  if (!Array.isArray(answers.red_flags) || answers.red_flags.length === 0) errors.push({ field: 'lead.answers.red_flags', message: 'red_flags must contain at least one value.' });

  const scoreResult = lead.score_result || {};
  if (!Number.isInteger(Number(scoreResult.score)) || Number(scoreResult.score) < 0 || Number(scoreResult.score) > 100) errors.push({ field: 'lead.score_result.score', message: 'score must be an integer from 0 to 100.' });
  if (!scoreResult.tier || !clean(scoreResult.tier.id)) errors.push({ field: 'lead.score_result.tier.id', message: 'tier.id is required.' });
  if (!isDateTime(scoreResult.calculated_at)) errors.push({ field: 'lead.score_result.calculated_at', message: 'calculated_at must be an ISO date-time.' });
  if (!clean(scoreResult.engine_version)) errors.push({ field: 'lead.score_result.engine_version', message: 'engine_version is required.' });

  ['secondary_funding_families', 'risks', 'strengths', 'recommended_documents', 'next_steps'].forEach((field) => {
    if (!Array.isArray(lead[field])) errors.push({ field: `lead.${field}`, message: `${field} must be an array.` });
  });
  if (typeof lead.manual_review_recommended !== 'boolean') errors.push({ field: 'lead.manual_review_recommended', message: 'manual_review_recommended must be boolean.' });
  if (!REVIEW_STATUSES.has(lead.review_status)) errors.push({ field: 'lead.review_status', message: 'review_status is not supported.' });
  if (!/^lead_[A-Za-z0-9_-]+$/.test(clean(lead.lead_id))) errors.push({ field: 'lead.lead_id', message: 'lead_id must begin with lead_.' });
  if (!/^https?:\/\//i.test(clean(lead.source_url))) errors.push({ field: 'lead.source_url', message: 'source_url must be an absolute HTTP(S) URL.' });
  if (!isDateTime(lead.created_at)) errors.push({ field: 'lead.created_at', message: 'created_at must be an ISO date-time.' });
  if (!isDateTime(lead.updated_at)) errors.push({ field: 'lead.updated_at', message: 'updated_at must be an ISO date-time.' });
  if (!lead.consent || lead.consent.contact !== true || lead.consent.privacy !== true || !isDateTime(lead.consent.captured_at) || !clean(lead.consent.text_version)) {
    errors.push({ field: 'lead.consent', message: 'contact and privacy consent, timestamp, and text version are required.' });
  }
  return errors;
}

const SENSITIVE_KEY = /(^|_)(ssn|social_security|tax_id|ein|routing_number|account_number|bank_account|password|passcode|bank_login|document_content|document_base64|uploaded_document|driver_license|passport)(_|$)/i;
const SENSITIVE_VALUE = /\b\d{3}-\d{2}-\d{4}\b|\b\d{2}-\d{7}\b|\b(?:bank\s+login|online\s+banking\s+password|routing\s+number|account\s+number)\b|^data:.*;base64,/i;

function findSensitiveData(value, path, findings) {
  const currentPath = path || '$';
  const output = findings || [];
  if (value === null || value === undefined) return output;
  if (Array.isArray(value)) {
    value.forEach((item, index) => findSensitiveData(item, `${currentPath}[${index}]`, output));
    return output;
  }
  if (typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      const nextPath = `${currentPath}.${key}`;
      if (SENSITIVE_KEY.test(key)) output.push({ field: nextPath, code: 'restricted_field' });
      findSensitiveData(value[key], nextPath, output);
    });
    return output;
  }
  if (typeof value === 'string' && SENSITIVE_VALUE.test(value)) output.push({ field: currentPath, code: 'restricted_value' });
  return output;
}

function propertyValue(page, name, type) {
  const property = page && page.properties ? page.properties[name] : null;
  if (!property) return null;
  if (type === 'select') return property.select && property.select.name || null;
  if (type === 'relation') return Array.isArray(property.relation) ? property.relation.map((item) => item.id) : [];
  return null;
}

async function resolveAttribution(lead) {
  const partnerId = clean(lead.partner_id) || null;
  const trackingLinkId = clean(lead.tracking_link_id) || null;
  if (!partnerId && !trackingLinkId) {
    return { status: 'direct', partner_id: null, tracking_link_id: null, partnerPageId: null, trackingLinkPageId: null };
  }
  if (!partnerId && trackingLinkId) {
    throw new RouterError(422, 'tracking_link_partner_mismatch', 'tracking_link_id requires partner_id.');
  }

  const partner = await findPartnerByPartnerId(partnerId);
  if (!partner) throw new RouterError(422, 'partner_not_found', 'The supplied partner_id was not found.', { partner_id: partnerId });

  let trackingLink = null;
  if (trackingLinkId) {
    const trackingDb = clean(process.env.NOTION_TRACKING_LINKS_DB_ID);
    if (!trackingDb) throw new RouterError(503, 'tracking_links_not_configured', 'Tracking-link validation is not configured.');
    const result = await queryDatabase(trackingDb, {
      filter: { property: 'Referral Token', rich_text: { equals: trackingLinkId } },
      page_size: 1
    });
    trackingLink = result && result.results && result.results[0] ? result.results[0] : null;
    if (!trackingLink) throw new RouterError(422, 'tracking_link_not_found', 'The supplied tracking_link_id was not found.', { tracking_link_id: trackingLinkId });
    const linkStatus = clean(propertyValue(trackingLink, 'Status', 'select')).toLowerCase();
    if (linkStatus && linkStatus !== 'active') throw new RouterError(422, 'tracking_link_inactive', 'The supplied tracking link is not active.');
    const linkedPartnerIds = propertyValue(trackingLink, 'Partner', 'relation') || [];
    if (linkedPartnerIds.length && !linkedPartnerIds.includes(partner.id)) {
      throw new RouterError(422, 'tracking_link_partner_mismatch', 'The tracking link does not belong to the supplied partner.');
    }
  }

  return {
    status: 'validated',
    partner_id: partnerId,
    tracking_link_id: trackingLinkId,
    partnerPageId: partner.id,
    trackingLinkPageId: trackingLink && trackingLink.id || null
  };
}

function safeRouting(lead) {
  const primary = lead.primary_funding_family || {};
  const secondary = Array.isArray(lead.secondary_funding_families) ? lead.secondary_funding_families : [];
  const nextAction = lead.next_steps && lead.next_steps[0] ? lead.next_steps[0].label : 'Review the funding-readiness result.';
  return {
    primary_funding_family: clean(primary.id),
    secondary_funding_family_ids: secondary.map((item) => clean(item && item.id)).filter(Boolean),
    next_action: nextAction,
    disclaimer: 'This is an internal readiness route, not an approval, offer, quote, or commitment.'
  };
}

function errorResponse(error, requestId) {
  const status = Number(error && error.status) || 500;
  const code = clean(error && error.code) || 'server_error';
  const message = status >= 500 ? (error && error.message || 'The lead router could not complete the request.') : error.message;
  return {
    status,
    body: {
      ok: false,
      error: {
        code,
        message,
        request_id: requestId,
        ...(error && error.details ? { details: error.details } : {})
      }
    }
  };
}

module.exports = async function leadRouter(req, res) {
  const requestId = clean(getHeader(req, 'x-request-id')) || `req_${crypto.randomUUID()}`;
  const receivedAt = new Date().toISOString();

  try {
    if (!req || req.method !== 'POST') throw new RouterError(405, 'method_not_allowed', 'Only POST is allowed.', { allowed_methods: ['POST'] });
    authorize(req);
    const request = parseBody(req);
    const headerIdempotencyKey = clean(getHeader(req, 'idempotency-key'));
    if (headerIdempotencyKey && headerIdempotencyKey !== clean(request.idempotency_key)) {
      throw new RouterError(409, 'idempotency_key_mismatch', 'Idempotency-Key header must match body.idempotency_key.');
    }
    const validationErrors = validateRequired(request);
    if (validationErrors.length) throw new RouterError(400, 'schema_validation_error', 'The partner-attributed lead payload failed validation.', { fields: validationErrors });

    const sensitiveFindings = findSensitiveData(request);
    if (sensitiveFindings.length) {
      throw new RouterError(400, 'restricted_data_detected', 'Sensitive applicant data must not be sent to this endpoint.', { fields: sensitiveFindings });
    }

    const attribution = await resolveAttribution(request.lead);
    const fundingLead = await upsertFundingLead(request, requestId);
    const warnings = [];
    let partnerEvent = { result: 'not_attempted', page: null };

    try {
      partnerEvent = await createPartnerLeadEvent({
        request,
        requestId,
        receivedAt,
        partnerPageId: attribution.partnerPageId,
        attribution,
        persistenceResult: fundingLead.result
      });
      if (partnerEvent.result === 'not_configured') warnings.push('partner_event_not_configured');
    } catch (eventError) {
      warnings.push('partner_event_write_failed');
    }

    const result = fundingLead.result;
    const status = result === 'created' ? 201 : 200;
    return respond(res, status, {
      ok: true,
      data: {
        action: 'submitPartnerAttributedLead',
        result,
        lead_id: request.lead.lead_id,
        review_status: request.lead.review_status,
        lead_priority: request.lead.lead_priority,
        manual_review_recommended: request.lead.manual_review_recommended,
        attribution: {
          status: attribution.status,
          partner_id: attribution.partner_id,
          tracking_link_id: attribution.tracking_link_id,
          campaign_id: request.lead.campaign_id || null,
          widget_id: request.lead.widget_id || null
        },
        routing: safeRouting(request.lead),
        persistence: {
          funding_lead: fundingLead.result,
          partner_event: partnerEvent.result
        },
        warnings
      },
      meta: {
        request_id: requestId,
        idempotency_key: request.idempotency_key,
        schema_version: request.schema_version,
        received_at: receivedAt
      }
    });
  } catch (error) {
    const response = errorResponse(error, requestId);
    return respond(res, response.status, response.body);
  }
};
