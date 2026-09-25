// Partner Command Center — universal partner event ingestion Action.
// Accepts trusted partner/affiliate lifecycle signals from GPT, forwarded email,
// Tally adapters, provider notifications, CRM automations, and operator workflows.

'use strict';

const crypto = require('crypto');
const {
  upsertPartner,
  createPartnerEvent,
  findPartnerByPartnerId,
  findPartnerByEmail,
  findPartnerEventByEventId
} = require('../lib/notion-client');
const {
  findSensitiveData,
  validateEmail,
  validatePartnerForNotion,
  PARTNER_TYPES,
  ONBOARDING_PATHS,
  TIERS
} = require('../lib/validation');
const {
  success,
  created,
  validationError,
  unauthorized,
  methodNotAllowed,
  notionError,
  serverError,
  sendJson
} = require('../lib/response');

const ALLOWED_SOURCES = new Set([
  'email',
  'tally',
  'gpt_action',
  'api',
  'manual',
  'provider_notification',
  'hubspot',
  'notion',
  'google_sheets',
  'automation'
]);

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
  if (!req || req.body === undefined || req.body === null || req.body === '') return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      const parseError = new Error('Invalid JSON request body.');
      parseError.code = 'invalid_json';
      throw parseError;
    }
  }
  return req.body;
}

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function isAuthorized(req) {
  const expected = process.env.PARTNER_COMMAND_API_KEY;
  const provided = getHeader(req, 'x-api-key') || getHeader(req, 'authorization').replace(/^Bearer\s+/i, '');
  return Boolean(expected && provided && constantTimeEqual(provided, expected));
}

function buildEventId(source, externalEventId, suppliedEventId) {
  if (clean(suppliedEventId)) return clean(suppliedEventId).slice(0, 160);
  if (clean(externalEventId)) {
    const digest = crypto
      .createHash('sha256')
      .update(clean(source) + ':' + clean(externalEventId))
      .digest('hex')
      .slice(0, 20);
    return 'evt_' + digest;
  }
  return 'evt_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
}

function generatePartnerId(seedInput) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const seed = JSON.stringify(seedInput || {}) + ':' + Date.now();
  const hash = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8).toUpperCase();
  return `MS-P-${stamp}-${hash}`;
}

function firstPlainText(items) {
  return Array.isArray(items) && items[0] && items[0].plain_text ? items[0].plain_text : '';
}

function propertyText(prop) {
  if (!prop) return '';
  if (prop.title) return firstPlainText(prop.title);
  if (prop.rich_text) return firstPlainText(prop.rich_text);
  return '';
}

function extractPartnerIdFromPage(page) {
  const props = page && page.properties ? page.properties : {};
  return clean(propertyText(props['Partner ID']));
}

function safePageSummary(page) {
  return page ? { id: page.id, url: page.url } : null;
}

function normalizeSource(value) {
  const source = clean(value || 'api').toLowerCase();
  return ALLOWED_SOURCES.has(source) ? source : '';
}

function normalizePartnerCandidate(input, source, provider) {
  const now = new Date().toISOString();
  const claimedType = clean(input.partner_type || input.partner_type_claimed).toLowerCase();
  const partnerType = PARTNER_TYPES.includes(claimedType) ? claimedType : 'affiliate_partner';
  const claimedPath = clean(input.onboarding_path).toLowerCase();
  const onboardingPath = ONBOARDING_PATHS.includes(claimedPath) ? claimedPath : 'affiliate_launch_path';
  const claimedTier = clean(input.tier).toLowerCase();
  const tier = TIERS.includes(claimedTier) ? claimedTier : 'tier_3';

  return {
    partner_id: clean(input.partner_id) || generatePartnerId({
      email: clean(input.email).toLowerCase(),
      provider: clean(provider),
      source
    }),
    name: clean(input.name || input.full_name) ||
      [clean(input.first_name), clean(input.last_name)].filter(Boolean).join(' ') ||
      clean(input.company) ||
      clean(input.email),
    email: clean(input.email).toLowerCase(),
    phone: clean(input.phone),
    company: clean(input.company),
    website: clean(input.website),
    partner_type: partnerType,
    audience: clean(input.audience || 'Funding Brokers'),
    referral_source: source,
    traffic_source: clean(provider || input.traffic_source || source),
    status: clean(input.status || 'intake_received'),
    tier,
    onboarding_path: onboardingPath,
    resource_recommendations: Array.isArray(input.resource_recommendations) ? input.resource_recommendations : [],
    campaign_recommendations: Array.isArray(input.campaign_recommendations) ? input.campaign_recommendations : [],
    current_position: clean(input.current_position),
    sales_experience: clean(input.sales_experience),
    self_description: clean(input.self_description),
    wants_strategy_call: clean(input.wants_strategy_call),
    interest_reason: clean(input.interest_reason),
    preferred_start: clean(input.preferred_start),
    source_form: clean(input.source_form),
    notes: clean(input.notes),
    created_at: clean(input.created_at) || now,
    updated_at: now
  };
}

async function resolveExistingPartner(partnerInput) {
  const partnerId = clean(partnerInput && partnerInput.partner_id);
  if (partnerId) {
    const byId = await findPartnerByPartnerId(partnerId);
    if (byId) return byId;
  }

  const emailResult = validateEmail(partnerInput && partnerInput.email);
  if (emailResult.valid) {
    return findPartnerByEmail(emailResult.normalized);
  }

  return null;
}

module.exports = async function partnerEvents(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try {
    body = parseBody(req);
  } catch (error) {
    return sendJson(res, validationError('Invalid JSON request body.'));
  }

  const eventType = clean(body.event_type);
  const source = normalizeSource(body.source);
  const provider = clean(body.provider);
  const externalEventId = clean(body.external_event_id || body.source_event_id);
  const eventId = buildEventId(source || 'api', externalEventId, body.event_id);
  const partnerInput = body.partner && typeof body.partner === 'object' && !Array.isArray(body.partner)
    ? body.partner
    : {};

  if (!eventType) return sendJson(res, validationError('event_type is required.'));
  if (!source) return sendJson(res, validationError('source is invalid.', { allowed_sources: Array.from(ALLOWED_SOURCES) }));
  if (!clean(partnerInput.partner_id) && !clean(partnerInput.email)) {
    return sendJson(res, validationError('partner.partner_id or partner.email is required.'));
  }

  const sensitiveMatches = findSensitiveData({ partner: partnerInput, metadata: body.metadata || {} });
  if (sensitiveMatches.length > 0) {
    return sendJson(res, validationError('Sensitive data detected in partner event payload.', sensitiveMatches));
  }

  try {
    const replay = await findPartnerEventByEventId(eventId);
    if (replay) {
      return sendJson(res, success({
        action: 'ingestPartnerEvent',
        result: 'duplicate_replayed',
        event_id: eventId,
        notion_event_page: safePageSummary(replay)
      }));
    }

    let existingPage = await resolveExistingPartner(partnerInput);
    let partnerId = existingPage ? extractPartnerIdFromPage(existingPage) : clean(partnerInput.partner_id);
    let storageAction = 'unchanged';
    let partnerPage = existingPage;

    if (!existingPage) {
      const candidate = normalizePartnerCandidate(partnerInput, source, provider);
      const emailResult = validateEmail(candidate.email);
      if (!emailResult.valid) {
        return sendJson(res, validationError('A valid partner email is required when creating a new partner.', {
          field: 'partner.email',
          reason: emailResult.reason
        }));
      }

      candidate.email = emailResult.normalized;
      const validation = validatePartnerForNotion(candidate);
      if (!validation.valid) {
        return sendJson(res, validationError('Partner event could not create a valid partner record.', validation.errors));
      }

      const result = await upsertPartner(candidate);
      storageAction = result.action;
      partnerPage = result.page;
      partnerId = candidate.partner_id;
    } else if (!partnerId && clean(partnerInput.partner_id)) {
      partnerId = clean(partnerInput.partner_id);
    }

    if (!partnerId) {
      return sendJson(res, validationError('Resolved partner record has no Partner ID.', {
        remediation: 'Repair the Partner ID in the primary CRM before retrying this event.'
      }));
    }

    const eventPage = await createPartnerEvent({
      event_id: eventId,
      partner_id: partnerId,
      event_type: eventType,
      source,
      status: clean(body.status || 'received'),
      summary: clean(body.summary) || `Partner event ingested from ${provider || source}.`,
      metadata: {
        provider: provider || null,
        external_event_id: externalEventId || null,
        ingestion_source: source,
        ...(body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {})
      },
      created_at: clean(body.occurred_at || body.created_at) || new Date().toISOString()
    });

    return sendJson(res, created({
      action: 'ingestPartnerEvent',
      result: 'accepted',
      event_id: eventId,
      partner_id: partnerId,
      partner_storage_action: storageAction,
      partner_created: storageAction === 'created',
      notion_partner_page: safePageSummary(partnerPage),
      notion_event_page: safePageSummary(eventPage)
    }));
  } catch (error) {
    if (error && error.code === 'missing_env') {
      return sendJson(res, serverError('Missing required server environment variable.', { field: error.field }));
    }
    if (error && (error.code === 'notion_error' || error.status)) {
      return sendJson(res, notionError('Notion request failed.', {
        code: error.code,
        status: error.status,
        message: error.message
      }));
    }
    return sendJson(res, serverError('Partner event ingestion failed.', {
      message: error && error.message ? error.message : 'Unknown error'
    }));
  }
};

module.exports._private = {
  ALLOWED_SOURCES,
  parseBody,
  isAuthorized,
  buildEventId,
  generatePartnerId,
  normalizeSource,
  normalizePartnerCandidate,
  extractPartnerIdFromPage
};
