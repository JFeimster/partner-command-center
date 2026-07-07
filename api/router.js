// Partner Command Center unified API router
// Sprint 02: Tally partner signup -> validation/classification -> Notion Partner CRM.

'use strict';

const crypto = require('crypto');
const {
  upsertPartner,
  findPartnerByPartnerId,
  findPartnerByEmail,
  createPartnerEvent,
  createPartnerResource,
  logPartnerEvent
} = require('../lib/notion-client');
const {
  validatePartnerForNotion,
  validateEmail,
  findSensitiveData,
  PARTNER_TYPES,
  ONBOARDING_PATHS
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

const ROUTER_ACTIONS = [
  'receivePartnerSignup',
  'createPartner',
  'getPartner',
  'classifyPartner',
  'assignOnboardingPath',
  'assignPartnerResources',
  'logPartnerEvent'
];

const TALLY_FIELD_MAP = {
  'first name': 'first_name',
  'last name': 'last_name',
  'email': 'email',
  'phone': 'phone',
  'company / brand': 'company',
  'company': 'company',
  'website or profile url': 'website',
  'website': 'website',
  'which best describes you?': 'partner_type_claimed',
  'are you applying as an individual, company, or organization?': 'applicant_entity_type',
  'who do you serve?': 'audience',
  'what industries do you usually work with?': 'industry',
  'approximate audience, client, or network size': 'traffic_or_network_size',
  'do you currently refer business funding deals?': 'currently_refers_funding',
  'describe your funding, finance, or referral experience': 'funding_experience',
  'estimated monthly referral volume': 'referral_volume_estimate',
  'how do you currently send or manage referrals?': 'referral_process',
  'what tools do you currently use?': 'current_tools',
  'if you selected other tools, list them here': 'current_tools_other',
  'what partner role are you most interested in?': 'desired_partner_role',
  'what would make this partnership successful for you?': 'success_goal',
  'how quickly are you hoping to launch?': 'launch_timeline',
  'anything else we should know?': 'notes',
  'best next step': 'preferred_next_step',
  'partner acknowledgment': 'partner_acknowledgment',
  'contact permission': 'contact_permission'
};

function normalizeHeaderValue(value) {
  if (Array.isArray(value)) return value[0];
  return value || '';
}

function getHeader(req, name) {
  const headers = req && req.headers ? req.headers : {};
  const lowerName = name.toLowerCase();
  const foundKey = Object.keys(headers).find((key) => key.toLowerCase() === lowerName);
  return foundKey ? normalizeHeaderValue(headers[foundKey]) : '';
}

function attachRawBody(parsed, rawBody) {
  if (parsed && typeof parsed === 'object' && rawBody) {
    Object.defineProperty(parsed, '__rawBody', {
      value: rawBody,
      enumerable: false,
      configurable: false,
      writable: false
    });
  }
  return parsed;
}

function parseBody(req) {
  if (!req || req.body === undefined || req.body === null) return {};
  if (typeof req.body === 'string') {
    try {
      return attachRawBody(JSON.parse(req.body), req.body);
    } catch (error) {
      const parseError = new Error('Invalid JSON request body.');
      parseError.code = 'invalid_json';
      throw parseError;
    }
  }
  return attachRawBody(req.body, req.rawBody || req.bodyRaw || req.raw_body);
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(value).sort().filter((key) => key !== '__rawBody').map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
}

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function getTallyWebhookSecret() {
  return process.env.MOONSHINE_TALLY_WEBHOOK_SECRET || process.env.TALLY_WEBHOOK_SECRET;
}

function getRawBodyForSignature(req, body) {
  const rawBody = body && body.__rawBody ? body.__rawBody : req && (req.rawBody || req.bodyRaw || req.raw_body);
  if (Buffer.isBuffer(rawBody)) return rawBody;
  if (rawBody) return String(rawBody);
  if (req && typeof req.body === 'string') return req.body;
  return JSON.stringify(body || {});
}

function hmacForBody(secret, body, req) {
  return crypto.createHmac('sha256', secret).update(getRawBodyForSignature(req, body)).digest('base64');
}

function hmacHexForBody(secret, body, req) {
  return crypto.createHmac('sha256', secret).update(getRawBodyForSignature(req, body)).digest('hex');
}

function stripSignaturePrefix(signature) {
  return String(signature || '').replace(/^sha256=/i, '').trim();
}

function isValidTallySecret(req, body) {
  const secret = getTallyWebhookSecret();
  if (!secret) return false;

  const directSecret = getHeader(req, 'x-tally-webhook-secret') || getHeader(req, 'x-webhook-secret');
  if (directSecret && constantTimeEqual(directSecret, secret)) return true;

  const signature = getHeader(req, 'x-tally-signature') || getHeader(req, 'tally-signature') || getHeader(req, 'x-webhook-signature');
  if (!signature) return false;

  const received = stripSignaturePrefix(signature);
  const expectedBase64 = hmacForBody(secret, body, req);
  const expectedHex = hmacHexForBody(secret, body, req);

  return constantTimeEqual(received, expectedBase64) || constantTimeEqual(received, expectedHex);
}

function isValidApiKey(req) {
  const expected = process.env.PARTNER_COMMAND_API_KEY;
  if (!expected) return false;
  const provided = getHeader(req, 'x-api-key') || getHeader(req, 'authorization').replace(/^Bearer\s+/i, '');
  return provided ? constantTimeEqual(provided, expected) : false;
}

function isTallyPayload(body) {
  return Boolean(
    body &&
    (
      body.eventType === 'FORM_RESPONSE' ||
      body.event_type === 'FORM_RESPONSE' ||
      body.type === 'FORM_RESPONSE' ||
      body.data ||
      body.form_response
    )
  );
}

function resolveAction(body) {
  if (body && body.action) return body.action;
  if (isTallyPayload(body)) return 'receivePartnerSignup';
  return '';
}

function cleanString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizeKey(value) {
  return cleanString(value).toLowerCase().replace(/\s+/g, ' ');
}

function getOptionValue(option) {
  if (!option || typeof option !== 'object') return '';
  return cleanString(option.id || option.value || option.key || option.uuid || option._id);
}

function getOptionLabel(option) {
  if (!option || typeof option !== 'object') return '';
  return cleanString(option.label || option.text || option.title || option.name || option.value);
}

function resolveTallyOptionLabel(field, rawValue) {
  const value = cleanString(rawValue);
  const options = field && Array.isArray(field.options) ? field.options : [];
  if (!value || options.length === 0) return '';

  const match = options.find((option) => getOptionValue(option) === value || getOptionLabel(option) === value);
  return match ? getOptionLabel(match) : '';
}

function tallyValueToString(value, field) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map((item) => tallyValueToString(item, field)).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    if (value.label) return cleanString(value.label);
    if (value.name) return cleanString(value.name);
    if (value.text) return cleanString(value.text);
    if (value.value) return tallyValueToString(value.value, field);
    if (value.id) return resolveTallyOptionLabel(field, value.id) || cleanString(value.id);
    return cleanString(JSON.stringify(value));
  }

  const primitiveValue = cleanString(value);
  return resolveTallyOptionLabel(field, primitiveValue) || primitiveValue;
}

function getTallyData(body) {
  return body.form_response || body.data || body;
}

function getTallyFields(body) {
  const data = getTallyData(body);
  if (Array.isArray(data.fields)) return data.fields;
  if (Array.isArray(data.answers)) return data.answers;
  if (Array.isArray(body.fields)) return body.fields;
  return [];
}

function extractTallyFields(body) {
  const fields = getTallyFields(body);
  const normalized = {};

  fields.forEach((field) => {
    const label = field.label || field.question || field.title || field.key || field.name || '';
    const internalKey = TALLY_FIELD_MAP[normalizeKey(label)] || TALLY_FIELD_MAP[normalizeKey(field.key)] || field.key;
    if (!internalKey) return;
    normalized[internalKey] = tallyValueToString(field.value !== undefined ? field.value : field.answer, field);
  });

  const data = getTallyData(body);
  const direct = data.values || data.fieldsByKey || data.answersByKey || {};
  Object.keys(direct).forEach((key) => {
    const internalKey = TALLY_FIELD_MAP[normalizeKey(key)] || key;
    normalized[internalKey] = tallyValueToString(direct[key]);
  });

  return normalized;
}

function getTallySubmissionId(body) {
  const data = getTallyData(body);
  return cleanString(
    body.submissionId ||
    body.submission_id ||
    body.responseId ||
    body.response_id ||
    data.submissionId ||
    data.submission_id ||
    data.responseId ||
    data.response_id ||
    data.id ||
    ''
  );
}

function buildName(fields) {
  const name = cleanString(fields.name || fields.full_name);
  if (name) return name;
  return [fields.first_name, fields.last_name].map(cleanString).filter(Boolean).join(' ');
}

function generatePartnerId(seedInput) {
  const seed = stableStringify(seedInput || {}) + ':' + Date.now();
  const hash = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8).toUpperCase();
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `MS-P-${stamp}-${hash}`;
}

function classifyPartner(input) {
  const text = [
    input.partner_type_claimed,
    input.desired_partner_role,
    input.audience,
    input.industry,
    input.funding_experience,
    input.notes
  ].map(cleanString).join(' ').toLowerCase();

  if (/internal|operator|admin|moonshine/.test(text)) return 'internal_operator';
  if (/broker|iso|funding advisor|commercial finance|business funding/.test(text)) return 'funding_broker';
  if (/affiliate|creator|influencer|publisher|newsletter|youtube|podcast|media/.test(text)) return 'affiliate_partner';
  if (/cpa|bookkeeper|attorney|lawyer|business broker|accountant|advisor/.test(text)) return 'center_of_influence';
  if (/consultant|agency|service provider|marketing|ecommerce|real estate|contractor/.test(text)) return 'professional_service_provider';
  if (/community|veteran|chamber|association|network|connector/.test(text)) return 'community_connector';
  if (/refer|referral|clients|network/.test(text)) return 'referral_partner';
  return 'unknown';
}

function estimateTier(input, partnerType, sensitiveMatches) {
  const text = [input.audience, input.funding_experience, input.referral_volume_estimate, input.launch_timeline, input.notes].map(cleanString).join(' ').toLowerCase();
  if (sensitiveMatches && sensitiveMatches.length > 0) return 'manual_review';
  if (partnerType === 'unknown') return 'manual_review';
  if (/guaranteed|everyone qualifies|credit repair|robocall|scraped|bought leads/.test(text)) return 'watchlist';
  if (/26\+|11-25|10,001\+|immediately|this week|regularly/.test(text) && partnerType === 'funding_broker') return 'tier_1';
  if (/6-10|3-5|2,501|this month|sometimes/.test(text)) return 'tier_2';
  if (partnerType === 'affiliate_partner' || partnerType === 'center_of_influence') return 'tier_2';
  return 'tier_3';
}

function assignOnboardingPathForPartner(partnerType, tier) {
  if (tier === 'manual_review' || tier === 'watchlist' || tier === 'reject' || partnerType === 'unknown') return 'manual_review_path';
  if (partnerType === 'funding_broker') return 'broker_fast_start';
  if (partnerType === 'affiliate_partner') return 'affiliate_launch_path';
  if (partnerType === 'center_of_influence' || partnerType === 'community_connector') return 'coi_relationship_path';
  return 'referral_partner_path';
}

function recommendResourcesForPartner(partner) {
  const base = ['Partner Program Overview', 'Compliance-Safe Referral Rules'];
  const path = partner.onboarding_path;

  if (path === 'broker_fast_start') return [...base, 'Broker Fast Start Checklist', 'Deal Handoff Playbook', 'Partner Link Setup Guide'];
  if (path === 'affiliate_launch_path') return [...base, 'Affiliate Launch Kit', 'Campaign Swipe File', 'Tracking Link Setup Guide'];
  if (path === 'coi_relationship_path') return [...base, 'COI Referral Intro Script', 'Relationship-Based Referral Guide'];
  if (path === 'referral_partner_path') return [...base, 'Referral Partner Quickstart', 'Warm Intro Script'];
  return ['Partner Program Overview', 'Manual Review Next Steps', 'Compliance-Safe Referral Rules'];
}

function recommendCampaignsForPartner(partner) {
  if (partner.onboarding_path === 'broker_fast_start') return ['Broker Deal Flow Reactivation'];
  if (partner.onboarding_path === 'affiliate_launch_path') return ['Affiliate Partner Launch Campaign'];
  if (partner.onboarding_path === 'coi_relationship_path') return ['Trusted Advisor Intro Campaign'];
  if (partner.onboarding_path === 'referral_partner_path') return ['Warm Referral Starter Campaign'];
  return ['Manual Review Follow-Up'];
}

function isAcceptedConsent(value) {
  const normalized = cleanString(value).toLowerCase();
  if (!normalized) return false;
  if (/^(false|no|0|unchecked|decline|declined|not accepted|not agreed)$/i.test(normalized)) return false;
  return true;
}

function validateSignupConsent(fields) {
  const missing = [];

  if (!isAcceptedConsent(fields.partner_acknowledgment)) {
    missing.push('partner_acknowledgment');
  }

  if (!isAcceptedConsent(fields.contact_permission)) {
    missing.push('contact_permission');
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

function normalizePartnerFromSignup(body) {
  const fields = extractTallyFields(body);
  const submittedAt = cleanString(getTallyData(body).createdAt || getTallyData(body).submittedAt || body.createdAt) || new Date().toISOString();
  const sensitiveMatches = findSensitiveData(fields);
  const partnerType = PARTNER_TYPES.includes(fields.partner_type) ? fields.partner_type : classifyPartner(fields);
  const tier = estimateTier(fields, partnerType, sensitiveMatches);
  const onboardingPath = ONBOARDING_PATHS.includes(fields.onboarding_path) ? fields.onboarding_path : assignOnboardingPathForPartner(partnerType, tier);
  const status = tier === 'manual_review' || tier === 'watchlist' ? 'needs_review' : 'intake_received';
  const consent = validateSignupConsent(fields);

  const partner = {
    partner_id: cleanString(fields.partner_id) || generatePartnerId({ email: fields.email, submission: getTallySubmissionId(body) }),
    name: buildName(fields) || cleanString(fields.company) || cleanString(fields.email),
    email: cleanString(fields.email).toLowerCase(),
    phone: cleanString(fields.phone),
    company: cleanString(fields.company),
    website: cleanString(fields.website),
    partner_type: partnerType,
    audience: cleanString(fields.audience || fields.industry || 'Unknown audience'),
    referral_source: cleanString(fields.referral_source || 'tally_partner_signup'),
    traffic_source: cleanString(fields.traffic_source || fields.source || 'tally'),
    status,
    tier,
    onboarding_path: onboardingPath,
    resource_recommendations: [],
    campaign_recommendations: [],
    tally_submission_id: getTallySubmissionId(body),
    created_at: submittedAt,
    updated_at: new Date().toISOString()
  };

  partner.resource_recommendations = recommendResourcesForPartner(partner);
  partner.campaign_recommendations = recommendCampaignsForPartner(partner);

  return { partner, raw_fields: fields, sensitive_matches: sensitiveMatches, consent };
}

function safePageSummary(page) {
  if (!page) return null;
  return {
    id: page.id,
    url: page.url,
    created_time: page.created_time,
    last_edited_time: page.last_edited_time
  };
}

function assertAuthorized(req, body, action) {
  if (action === 'receivePartnerSignup' && isValidTallySecret(req, body)) return { ok: true, mode: 'tally_webhook' };
  if (isValidApiKey(req)) return { ok: true, mode: 'api_key' };
  return { ok: false };
}

async function handleReceivePartnerSignup(body) {
  const normalized = normalizePartnerFromSignup(body);

  if (!normalized.consent.valid) {
    return validationError('Partner acknowledgment and contact permission are required before storing signup.', {
      missing: normalized.consent.missing
    });
  }

  if (normalized.sensitive_matches.length > 0) {
    return validationError('Sensitive data detected in partner signup payload.', normalized.sensitive_matches);
  }

  const validation = validatePartnerForNotion(normalized.partner);
  if (!validation.valid) {
    return validationError('Partner signup payload failed validation.', validation.errors);
  }

  const result = await upsertPartner(normalized.partner);

  await createPartnerEvent({
    partner_id: normalized.partner.partner_id,
    event_type: result.action === 'created' ? 'partner_created' : 'partner_updated',
    source: 'tally',
    status: normalized.partner.status,
    summary: 'Partner signup received, normalized, classified, and stored in Notion.',
    metadata: {
      tally_submission_id: normalized.partner.tally_submission_id,
      partner_type: normalized.partner.partner_type,
      tier: normalized.partner.tier,
      onboarding_path: normalized.partner.onboarding_path,
      match_strategy: result.match_strategy
    },
    created_at: new Date().toISOString()
  });

  return created({
    action: 'receivePartnerSignup',
    result: result.action,
    partner_id: normalized.partner.partner_id,
    partner: normalized.partner,
    notion_page: safePageSummary(result.page)
  });
}

async function handleCreatePartner(body) {
  const input = body.partner || body;
  const partner = {
    ...input,
    partner_id: cleanString(input.partner_id) || generatePartnerId(input),
    created_at: input.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (!partner.resource_recommendations) partner.resource_recommendations = recommendResourcesForPartner(partner);
  if (!partner.campaign_recommendations) partner.campaign_recommendations = recommendCampaignsForPartner(partner);

  const sensitiveMatches = findSensitiveData(partner);
  if (sensitiveMatches.length > 0) {
    return validationError('Sensitive data detected in partner payload.', sensitiveMatches);
  }

  const validation = validatePartnerForNotion(partner);
  if (!validation.valid) return validationError('Partner payload failed validation.', validation.errors);

  const result = await upsertPartner(partner);
  await logPartnerEvent(partner.partner_id, result.action === 'created' ? 'partner_created' : 'partner_updated', 'Partner record created or updated through API router.', { action: 'createPartner' });

  return created({
    action: 'createPartner',
    result: result.action,
    partner_id: partner.partner_id,
    partner,
    notion_page: safePageSummary(result.page)
  });
}

async function handleGetPartner(body) {
  const partnerId = cleanString(body.partner_id);
  const email = cleanString(body.email).toLowerCase();
  if (!partnerId && !email) return validationError('Provide partner_id or email.');

  const page = partnerId ? await findPartnerByPartnerId(partnerId) : await findPartnerByEmail(email);
  if (!page) return validationError('Partner not found.', { partner_id: partnerId || null, email: email || null });

  return success({ action: 'getPartner', partner_id: partnerId || null, notion_page: safePageSummary(page), raw_page: page });
}

async function handleClassifyPartner(body) {
  const input = body.partner || body;
  const sensitiveMatches = findSensitiveData(input);
  const partnerType = classifyPartner(input);
  const tier = estimateTier(input, partnerType, sensitiveMatches);

  return success({
    action: 'classifyPartner',
    partner_type: partnerType,
    tier,
    manual_review_required: tier === 'manual_review' || tier === 'watchlist',
    sensitive_matches: sensitiveMatches
  });
}

async function handleAssignOnboardingPath(body) {
  const input = body.partner || body;
  const partnerType = cleanString(input.partner_type || classifyPartner(input));
  const tier = cleanString(input.tier || estimateTier(input, partnerType, findSensitiveData(input)));
  const onboardingPath = assignOnboardingPathForPartner(partnerType, tier);
  return success({ action: 'assignOnboardingPath', partner_type: partnerType, tier, onboarding_path: onboardingPath });
}

async function handleAssignPartnerResources(body) {
  const partner = body.partner || body;
  if (!partner.partner_id) return validationError('partner_id is required to assign resources.');

  const resources = recommendResourcesForPartner(partner).map((title, index) => ({
    partner_id: partner.partner_id,
    resource_title: title,
    resource_type: index === 0 ? 'guide' : 'checklist',
    partner_type: partner.partner_type || 'unknown',
    onboarding_path: partner.onboarding_path || 'manual_review_path',
    priority: index + 1,
    status: 'assigned',
    reason: 'Assigned by Sprint 02 partner resource rules.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const createdResources = [];
  for (const resource of resources) {
    createdResources.push(await createPartnerResource(resource));
  }

  await logPartnerEvent(partner.partner_id, 'resources_assigned', 'Partner resources assigned through API router.', { count: resources.length });

  return created({ action: 'assignPartnerResources', partner_id: partner.partner_id, resources, notion_pages: createdResources.map(safePageSummary) });
}

async function handleLogPartnerEvent(body) {
  const event = body.event || body;
  if (!event.partner_id || !event.event_type) return validationError('partner_id and event_type are required.');

  const page = await createPartnerEvent({
    partner_id: event.partner_id,
    event_type: event.event_type,
    source: event.source || 'api',
    status: event.status,
    summary: event.summary,
    metadata: event.metadata,
    created_at: event.created_at || new Date().toISOString()
  });

  return created({ action: 'logPartnerEvent', partner_id: event.partner_id, notion_page: safePageSummary(page) });
}

async function dispatch(action, body) {
  if (action === 'receivePartnerSignup') return handleReceivePartnerSignup(body);
  if (action === 'createPartner') return handleCreatePartner(body);
  if (action === 'getPartner') return handleGetPartner(body);
  if (action === 'classifyPartner') return handleClassifyPartner(body);
  if (action === 'assignOnboardingPath') return handleAssignOnboardingPath(body);
  if (action === 'assignPartnerResources') return handleAssignPartnerResources(body);
  if (action === 'logPartnerEvent') return handleLogPartnerEvent(body);
  return validationError('Unsupported router action.', { action, supported_actions: ROUTER_ACTIONS });
}

module.exports = async function router(req, res) {
  if (!req || req.method !== 'POST') {
    return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  }

  let body;
  try {
    body = parseBody(req);
  } catch (error) {
    return sendJson(res, validationError('Invalid JSON request body.'));
  }

  const action = resolveAction(body);
  if (!action) {
    return sendJson(res, validationError('Missing router action.', { supported_actions: ROUTER_ACTIONS }));
  }

  const auth = assertAuthorized(req, body, action);
  if (!auth.ok) {
    return sendJson(res, unauthorized('Valid Tally webhook secret/signature or X-API-Key is required.'));
  }

  try {
    const response = await dispatch(action, body);
    return sendJson(res, response);
  } catch (error) {
    if (error && error.code === 'missing_env') {
      return sendJson(res, serverError('Missing required server environment variable.', { field: error.field }));
    }
    if (error && (error.code === 'notion_error' || error.status)) {
      return sendJson(res, notionError('Notion request failed.', { code: error.code, status: error.status, message: error.message }));
    }
    return sendJson(res, serverError('Router action failed.', { message: error && error.message ? error.message : 'Unknown error' }));
  }
};

module.exports._private = {
  ROUTER_ACTIONS,
  TALLY_FIELD_MAP,
  parseBody,
  stableStringify,
  hmacForBody,
  isValidTallySecret,
  isValidApiKey,
  extractTallyFields,
  normalizePartnerFromSignup,
  generatePartnerId,
  classifyPartner,
  assignOnboardingPathForPartner,
  recommendResourcesForPartner,
  recommendCampaignsForPartner,
  validateSignupConsent
};
