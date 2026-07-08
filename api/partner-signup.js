// Partner Command Center — GPT Action partner signup endpoint
// Creates/updates partners only. Not for borrower funding applications or underwriting intake.

'use strict';

const crypto = require('crypto');
const { upsertPartner, createPartnerEvent, findPartnerByEmail } = require('../lib/notion-client');
const {
  findSensitiveData,
  validateEmail,
  validatePartnerForNotion,
  PARTNER_TYPES,
  ONBOARDING_PATHS
} = require('../lib/validation');
const {
  created,
  validationError,
  unauthorized,
  methodNotAllowed,
  notionError,
  serverError,
  sendJson
} = require('../lib/response');

const BORROWER_APPLICATION_FIELDS = [
  'requested_amount',
  'requested_amount_range',
  'monthly_revenue',
  'monthly_revenue_range',
  'time_in_business',
  'funding_purpose',
  'credit_score',
  'bank_statements',
  'tax_returns',
  'ssn',
  'ein',
  'bank_login',
  'routing_number',
  'account_number',
  'loan_application'
];

const PARTNER_INPUT_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'company',
  'website',
  'partner_type_claimed',
  'audience',
  'industry',
  'location',
  'funding_experience',
  'current_tools',
  'traffic_or_network_size',
  'referral_volume_estimate',
  'desired_partner_role',
  'notes',
  'source'
];

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function compact(values) {
  return values.map(clean).filter(Boolean);
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

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
}

function generatePartnerId(seedInput) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const seed = stableStringify(seedInput || {}) + ':' + Date.now();
  const hash = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8).toUpperCase();
  return `MS-P-${stamp}-${hash}`;
}

function normalizeKey(key) {
  return clean(key).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function collectDisallowedFields(value, path, matches) {
  const currentPath = path || '$';
  const results = matches || [];
  if (!value || typeof value !== 'object') return results;

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectDisallowedFields(item, `${currentPath}[${index}]`, results));
    return results;
  }

  Object.keys(value).forEach((key) => {
    const normalized = normalizeKey(key);
    if (BORROWER_APPLICATION_FIELDS.includes(normalized)) {
      results.push({ path: `${currentPath}.${key}`, field: normalized });
    }
    collectDisallowedFields(value[key], `${currentPath}.${key}`, results);
  });

  return results;
}

function extractPartnerInput(body) {
  const input = body && body.partner && typeof body.partner === 'object' && !Array.isArray(body.partner)
    ? body.partner
    : body;

  const partner = {};
  PARTNER_INPUT_FIELDS.forEach((field) => {
    if (input && input[field] !== undefined && input[field] !== null) {
      partner[field] = input[field];
    }
  });

  return partner;
}

function buildName(input) {
  const directName = clean(input.name || input.full_name);
  if (directName) return directName;
  return compact([input.first_name, input.last_name]).join(' ');
}

function partnerText(input) {
  return compact([
    input.partner_type_claimed,
    input.desired_partner_role,
    input.audience,
    input.industry,
    input.funding_experience,
    input.current_tools,
    input.traffic_or_network_size,
    input.referral_volume_estimate,
    input.notes
  ]).join(' ').toLowerCase();
}

function classifyPartner(input) {
  const claimed = clean(input.partner_type || input.partner_type_claimed).toLowerCase();
  if (PARTNER_TYPES.includes(claimed)) return claimed;

  const text = partnerText(input);
  if (/internal|operator|admin|moonshine/.test(text)) return 'internal_operator';
  if (/\b(iso|broker|funding advisor|commercial finance|business funding|loan broker|capital advisor|funding broker)\b/.test(text)) return 'funding_broker';
  if (/\b(affiliate|creator|influencer|publisher|newsletter|youtube|podcast|substack|media|content)\b/.test(text)) return 'affiliate_partner';
  if (/\b(cpa|bookkeeper|attorney|lawyer|business broker|accountant|advisor|tax professional|financial professional)\b/.test(text)) return 'center_of_influence';
  if (/\b(consultant|agency|service provider|marketing|ecommerce|e-commerce|real estate|contractor|vendor|strategic partner)\b/.test(text)) return 'professional_service_provider';
  if (/\b(community|veteran|chamber|association|network|connector|local group|facebook group|discord|membership)\b/.test(text)) return 'community_connector';
  if (/\b(refer|referral|clients|warm intro|introductions?|network)\b/.test(text)) return 'referral_partner';
  return 'unknown';
}

function hasComplianceRisk(input) {
  const text = partnerText(input);
  return /guaranteed|everyone qualifies|credit repair|robocall|auto[-\s]?dial|scraped|bought leads|no consent|spam|blast/i.test(text);
}

function numberHints(text) {
  return (String(text || '').match(/\d+/g) || []).map((value) => Number(value)).filter((value) => Number.isFinite(value));
}

function estimateTier(input, partnerType, sensitiveMatches) {
  if (sensitiveMatches && sensitiveMatches.length > 0) return 'manual_review';
  if (partnerType === 'unknown') return 'manual_review';
  if (hasComplianceRisk(input)) return 'watchlist';

  const text = partnerText(input);
  const referralNumbers = numberHints(input.referral_volume_estimate);
  const networkNumbers = numberHints(input.traffic_or_network_size);
  const maxReferralVolume = referralNumbers.length ? Math.max.apply(null, referralNumbers) : 0;
  const maxNetworkSize = networkNumbers.length ? Math.max.apply(null, networkNumbers) : 0;
  const urgentLaunch = /immediately|this week|this month|ready to launch|asap|now|actively|regularly/.test(text);

  if (partnerType === 'funding_broker') {
    if (maxReferralVolume >= 10 || urgentLaunch || /daily|weekly|active pipeline|deal flow/.test(text)) return 'tier_1';
    if (maxReferralVolume >= 3 || /some experience|occasionally|monthly|warm referrals?/.test(text)) return 'tier_2';
    return 'tier_3';
  }

  if (partnerType === 'affiliate_partner' || partnerType === 'center_of_influence' || partnerType === 'community_connector') {
    if (maxNetworkSize >= 5000 || maxReferralVolume >= 5) return 'tier_2';
    return 'tier_2';
  }

  if (partnerType === 'referral_partner' || partnerType === 'professional_service_provider') return 'tier_3';
  return 'manual_review';
}

function assignOnboardingPathForPartner(partnerType, tier) {
  if (tier === 'manual_review' || tier === 'watchlist' || tier === 'reject' || partnerType === 'unknown') return 'manual_review_path';
  if (partnerType === 'funding_broker') return 'broker_fast_start';
  if (partnerType === 'affiliate_partner') return 'affiliate_launch_path';
  if (partnerType === 'center_of_influence' || partnerType === 'community_connector') return 'coi_relationship_path';
  if (partnerType === 'referral_partner' || partnerType === 'professional_service_provider') return 'referral_partner_path';
  return ONBOARDING_PATHS.includes(partnerType) ? partnerType : 'manual_review_path';
}

function recommendResourcesForPartner(partner) {
  const base = ['Partner Program Overview', 'Compliance-Safe Referral Rules'];
  if (partner.onboarding_path === 'broker_fast_start') return base.concat(['Broker Fast Start Checklist', 'Deal Handoff Playbook', 'Partner Link Setup Guide']);
  if (partner.onboarding_path === 'affiliate_launch_path') return base.concat(['Affiliate Launch Kit', 'Campaign Swipe File', 'Tracking Link Setup Guide']);
  if (partner.onboarding_path === 'coi_relationship_path') return base.concat(['COI Referral Intro Script', 'Relationship-Based Referral Guide']);
  if (partner.onboarding_path === 'referral_partner_path') return base.concat(['Referral Partner Quickstart', 'Warm Intro Script']);
  return ['Partner Program Overview', 'Manual Review Next Steps', 'Compliance-Safe Referral Rules'];
}

function recommendCampaignsForPartner(partner) {
  if (partner.onboarding_path === 'broker_fast_start') return ['Broker Deal Flow Reactivation'];
  if (partner.onboarding_path === 'affiliate_launch_path') return ['Affiliate Partner Launch Campaign'];
  if (partner.onboarding_path === 'coi_relationship_path') return ['Trusted Advisor Intro Campaign'];
  if (partner.onboarding_path === 'referral_partner_path') return ['Warm Referral Starter Campaign'];
  return ['Manual Review Follow-Up'];
}

function normalizePartnerSignup(input) {
  const now = new Date().toISOString();
  const sensitiveMatches = findSensitiveData(input);
  const partnerType = classifyPartner(input);
  const tier = estimateTier(input, partnerType, sensitiveMatches);
  const onboardingPath = assignOnboardingPathForPartner(partnerType, tier);
  const source = clean(input.source || 'gpt_action');
  const name = buildName(input) || clean(input.company) || clean(input.email);

  const partner = {
    partner_id: generatePartnerId({ email: clean(input.email).toLowerCase(), company: input.company, source }),
    name,
    email: clean(input.email).toLowerCase(),
    phone: clean(input.phone),
    company: clean(input.company),
    website: clean(input.website),
    partner_type: partnerType,
    audience: clean(input.audience || input.industry || input.desired_partner_role || 'Unknown audience'),
    referral_source: source,
    traffic_source: clean(input.current_tools || input.traffic_or_network_size || source),
    status: tier === 'manual_review' || tier === 'watchlist' ? 'needs_review' : 'intake_received',
    tier,
    onboarding_path: onboardingPath,
    resource_recommendations: [],
    campaign_recommendations: [],
    created_at: now,
    updated_at: now
  };

  partner.resource_recommendations = recommendResourcesForPartner(partner);
  partner.campaign_recommendations = recommendCampaignsForPartner(partner);

  return { partner, sensitive_matches: sensitiveMatches, input_source: source };
}

function safePageSummary(page) {
  return page ? { id: page.id, url: page.url } : null;
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

function safePartnerResponse(partner) {
  return {
    partner_id: partner.partner_id,
    name: partner.name,
    email: partner.email,
    company: partner.company,
    partner_type: partner.partner_type,
    audience: partner.audience,
    status: partner.status,
    tier: partner.tier,
    onboarding_path: partner.onboarding_path,
    resource_recommendations: partner.resource_recommendations || [],
    campaign_recommendations: partner.campaign_recommendations || []
  };
}

module.exports = async function partnerSignup(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try {
    body = parseBody(req);
  } catch (error) {
    return sendJson(res, validationError('Invalid JSON request body.'));
  }

  const disallowedFields = collectDisallowedFields(body);
  if (disallowedFields.length > 0) {
    return sendJson(res, validationError('Borrower funding application fields are not accepted by the partner signup action.', {
      fields: disallowedFields,
      use_instead: '/api/lead-router after partner activation'
    }));
  }

  const input = extractPartnerInput(body);
  const emailResult = validateEmail(input.email);
  if (!emailResult.valid) return sendJson(res, validationError('A valid partner email is required.', { field: 'email', reason: emailResult.reason }));
  input.email = emailResult.normalized;

  const normalized = normalizePartnerSignup(input);
  if (normalized.sensitive_matches.length > 0) {
    return sendJson(res, validationError('Sensitive data detected in partner signup payload.', normalized.sensitive_matches));
  }

  const partnerValidation = validatePartnerForNotion(normalized.partner);
  if (!partnerValidation.valid) return sendJson(res, validationError('Partner signup payload failed validation.', partnerValidation.errors));

  try {
    const existingPage = await findPartnerByEmail(normalized.partner.email);
    const existingPartnerId = extractPartnerIdFromPage(existingPage);
    if (existingPartnerId) normalized.partner.partner_id = existingPartnerId;

    const result = await upsertPartner(normalized.partner);
    const eventType = result.action === 'updated' ? 'partner_signup_updated' : 'partner_signup_created';

    await createPartnerEvent({
      partner_id: normalized.partner.partner_id,
      event_type: eventType,
      source: 'gpt_action',
      status: normalized.partner.status,
      summary: 'Partner signup received from GPT Action, normalized, classified, and stored.',
      metadata: {
        partner_type: normalized.partner.partner_type,
        tier: normalized.partner.tier,
        onboarding_path: normalized.partner.onboarding_path,
        input_source: normalized.input_source
      },
      created_at: new Date().toISOString()
    });

    return sendJson(res, created({
      action: 'submitPartnerSignup',
      result: 'created_or_updated',
      storage_action: result.action,
      partner_id: normalized.partner.partner_id,
      partner: safePartnerResponse(normalized.partner),
      notion_page: safePageSummary(result.page)
    }));
  } catch (error) {
    if (error && error.code === 'missing_env') return sendJson(res, serverError('Missing required server environment variable.', { field: error.field }));
    if (error && (error.code === 'notion_error' || error.status)) return sendJson(res, notionError('Notion request failed.', { code: error.code, status: error.status, message: error.message }));
    return sendJson(res, serverError('Partner signup failed.', { message: error && error.message ? error.message : 'Unknown error' }));
  }
};

module.exports._private = {
  BORROWER_APPLICATION_FIELDS,
  PARTNER_INPUT_FIELDS,
  parseBody,
  isAuthorized,
  collectDisallowedFields,
  extractPartnerInput,
  generatePartnerId,
  classifyPartner,
  estimateTier,
  assignOnboardingPathForPartner,
  normalizePartnerSignup,
  extractPartnerIdFromPage,
  safePartnerResponse
};
