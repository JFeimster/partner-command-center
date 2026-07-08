// Partner Command Center Notion payload mappers
// Sprint 01: transform normalized Partner Command Center objects into Notion API payloads.

'use strict';

const { requireServerSide } = require('./validation');

const AUDIENCE_OPTIONS = [
  'Small Business Owners',
  'Funding Brokers',
  'CPAs / Bookkeepers',
  'Real Estate Pros',
  'Ecommerce Sellers',
  'Creators / Influencers',
  'Consultants / Coaches',
  'Veteran / Community Connectors',
  'Strategic Partners'
];

function nowIso() {
  return new Date().toISOString();
}

function cleanString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function compactArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

function normalizedKey(value) {
  return cleanString(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function containsAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function audienceOptions(value) {
  const text = cleanString(value).toLowerCase();
  const options = [];

  if (containsAny(text, [/small business|smb|business owner|startup|founder|operator|local business/])) options.push('Small Business Owners');
  if (containsAny(text, [/broker|iso|funding advisor|commercial finance/])) options.push('Funding Brokers');
  if (containsAny(text, [/cpa|bookkeeper|accountant|tax/])) options.push('CPAs / Bookkeepers');
  if (containsAny(text, [/real estate|realtor|investor|fix and flip/])) options.push('Real Estate Pros');
  if (containsAny(text, [/ecommerce|e-commerce|shopify|amazon seller|online seller/])) options.push('Ecommerce Sellers');
  if (containsAny(text, [/creator|influencer|youtube|newsletter|substack|podcast|media|content/])) options.push('Creators / Influencers');
  if (containsAny(text, [/consultant|coach|agency|advisor|service provider/])) options.push('Consultants / Coaches');
  if (containsAny(text, [/veteran|community|chamber|association|connector|discord|facebook group|membership/])) options.push('Veteran / Community Connectors');
  if (containsAny(text, [/strategic|vendor|channel partner|integration|enterprise/])) options.push('Strategic Partners');

  if (options.length === 0 && text) options.push('Small Business Owners');
  return Array.from(new Set(options.filter((option) => AUDIENCE_OPTIONS.includes(option))));
}

function title(content) {
  return {
    title: [{ text: { content: cleanString(content) || 'Untitled' } }]
  };
}

function richText(content) {
  const normalized = cleanString(content);
  return {
    rich_text: normalized ? [{ text: { content: normalized } }] : []
  };
}

function email(value) {
  const normalized = cleanString(value).toLowerCase();
  return { email: normalized || null };
}

function phoneNumber(value) {
  const normalized = cleanString(value);
  return { phone_number: normalized || null };
}

function url(value) {
  const normalized = cleanString(value);
  return { url: normalized || null };
}

function select(value) {
  const normalized = cleanString(value);
  return { select: normalized ? { name: normalized } : null };
}

function status(value) {
  const normalized = cleanString(value);
  return { status: normalized ? { name: normalized } : null };
}

function multiSelect(values) {
  return {
    multi_select: compactArray(values).map((name) => ({ name }))
  };
}

function number(value) {
  const parsed = Number(value);
  return { number: Number.isFinite(parsed) ? parsed : null };
}

function date(value) {
  const normalized = cleanString(value) || nowIso();
  return { date: { start: normalized } };
}

function safeJson(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch (error) {
    return JSON.stringify({ serialization_error: true });
  }
}

function listText(values) {
  return compactArray(values).join('\n');
}

function notionPartnerType(value) {
  const key = normalizedKey(value);
  if (key === 'funding_broker' || key === 'broker' || key === 'iso') return 'Broker / Closer';
  if (key === 'affiliate_partner' || key === 'creator_affiliate' || key === 'creator_influencer' || key === 'center_of_influence') return 'Affiliate / Content';
  if (key === 'professional_service_provider' || key === 'business_consultant' || key === 'community_connector' || key === 'agency_team_lead') return 'Agency / Team Lead';
  if (key === 'lender_funding_source') return 'Lender / Funding Source';
  return 'Other';
}

function notionStatus(value) {
  const key = normalizedKey(value);
  if (key === 'active' || key === 'approved' || key === 'active_partner') return 'Active Partner';
  return 'New Lead';
}

function notionOnboardingPath(value, partnerType) {
  const pathKey = normalizedKey(value);
  const typeKey = normalizedKey(partnerType);

  if (pathKey === 'broker_fast_start' || typeKey === 'funding_broker') return 'Advanced';
  if (pathKey === 'affiliate_launch_path' || typeKey === 'affiliate_partner') return 'Beginner';
  if (pathKey === 'coi_relationship_path') return 'Referral';
  if (pathKey === 'referral_partner_path' || typeKey === 'referral_partner') return 'Referral';
  if (pathKey === 'manual_review_path') return 'General';
  if (['general', 'dac', 'moonshine_only', 'referral', 'advanced', 'beginner'].includes(pathKey)) {
    return pathKey.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('-').replace('Moonshine-Only', 'Moonshine-only');
  }
  return 'General';
}

function notionReferralSource(value) {
  const key = normalizedKey(value);
  if (key === 'tally' || key === 'tally_partner_signup' || key === 'tally_form') return 'Tally Form';
  if (key === 'referral') return 'Referral';
  if (key === 'email' || key === 'inbound_email') return 'Inbound Email';
  if (key === 'social_dm' || key === 'social' || key === 'dm') return 'Social / DM';
  return 'Other';
}

function normalizePartner(input) {
  const createdAt = input.created_at || nowIso();
  const updatedAt = input.updated_at || nowIso();

  return {
    partner_id: cleanString(input.partner_id),
    name: cleanString(input.name),
    email: cleanString(input.email).toLowerCase(),
    phone: cleanString(input.phone),
    company: cleanString(input.company),
    website: cleanString(input.website),
    partner_type: cleanString(input.partner_type || 'unknown'),
    audience: cleanString(input.audience),
    referral_source: cleanString(input.referral_source),
    traffic_source: cleanString(input.traffic_source),
    status: cleanString(input.status || 'intake_received'),
    tier: cleanString(input.tier || 'manual_review'),
    onboarding_path: cleanString(input.onboarding_path || 'manual_review_path'),
    resource_recommendations: compactArray(input.resource_recommendations),
    campaign_recommendations: compactArray(input.campaign_recommendations),
    tally_submission_id: cleanString(input.tally_submission_id),
    created_at: createdAt,
    updated_at: updatedAt
  };
}

function partnerToNotionProperties(partnerInput) {
  requireServerSide();
  const partner = normalizePartner(partnerInput);

  return {
    'Name': title(partner.name || partner.company || partner.email),
    'Partner ID': richText(partner.partner_id),
    'Email': email(partner.email),
    'Phone': phoneNumber(partner.phone),
    'Company': richText(partner.company),
    'Website': url(partner.website),
    'Partner Type': select(notionPartnerType(partner.partner_type)),
    'Audience': multiSelect(audienceOptions(partner.audience)),
    'Referral Source': select(notionReferralSource(partner.referral_source)),
    'Status': status(notionStatus(partner.status)),
    'Tier': select(partner.tier),
    'Onboarding Path': select(notionOnboardingPath(partner.onboarding_path, partner.partner_type)),
    'Resource Recommendations': richText(listText(partner.resource_recommendations)),
    'Campaign Recommendations': richText(listText(partner.campaign_recommendations)),
    'Tally Submission ID': richText(partner.tally_submission_id)
  };
}

function createPartnerPagePayload(partner, databaseId) {
  requireServerSide();
  return {
    parent: { database_id: databaseId },
    properties: partnerToNotionProperties(partner)
  };
}

function updatePartnerPagePayload(partner) {
  requireServerSide();
  return {
    properties: {
      ...partnerToNotionProperties({
        ...partner,
        updated_at: partner.updated_at || nowIso()
      })
    }
  };
}

function partnerEventToNotionProperties(eventInput) {
  requireServerSide();
  const createdAt = eventInput.created_at || nowIso();
  const eventId = cleanString(eventInput.event_id) || `event_${cleanString(eventInput.partner_id)}_${cleanString(eventInput.event_type || 'event')}_${Date.now()}`;

  return {
    'Event ID': title(eventId),
    'Partner ID': richText(eventInput.partner_id),
    'Event Type': select(eventInput.event_type || 'partner_updated'),
    'Source': select(eventInput.source || 'system'),
    'Status': eventInput.status ? select(eventInput.status) : select(''),
    'Summary': richText(eventInput.summary),
    'Metadata JSON': richText(safeJson(eventInput.metadata)),
    'Created At': date(createdAt)
  };
}

function createPartnerEventPayload(event, databaseId) {
  requireServerSide();
  return {
    parent: { database_id: databaseId },
    properties: partnerEventToNotionProperties(event)
  };
}

function partnerResourceToNotionProperties(resourceInput) {
  requireServerSide();
  const createdAt = resourceInput.created_at || nowIso();
  const updatedAt = resourceInput.updated_at || nowIso();
  const assignmentId = cleanString(resourceInput.assignment_id) || `resource_${cleanString(resourceInput.partner_id)}_${Date.now()}`;

  return {
    'Assignment ID': title(assignmentId),
    'Partner ID': richText(resourceInput.partner_id),
    'Resource Title': richText(resourceInput.resource_title || resourceInput.title),
    'Resource Type': select(resourceInput.resource_type || 'guide'),
    'Resource URL': url(resourceInput.resource_url || resourceInput.url),
    'Partner Type': select(resourceInput.partner_type),
    'Onboarding Path': select(resourceInput.onboarding_path),
    'Priority': number(resourceInput.priority),
    'Status': select(resourceInput.status || 'assigned'),
    'Reason': richText(resourceInput.reason),
    'Created At': date(createdAt),
    'Updated At': date(updatedAt)
  };
}

function createPartnerResourcePayload(resource, databaseId) {
  requireServerSide();
  return {
    parent: { database_id: databaseId },
    properties: partnerResourceToNotionProperties(resource)
  };
}

function trackingLinkToNotionProperties(linkInput) {
  requireServerSide();
  const createdAt = linkInput.created_at || nowIso();
  const updatedAt = linkInput.updated_at || nowIso();
  const trackingLinkId = cleanString(linkInput.tracking_link_id) || `link_${cleanString(linkInput.partner_id)}_${Date.now()}`;

  return {
    'Tracking Link ID': title(trackingLinkId),
    'Partner ID': richText(linkInput.partner_id),
    'Destination URL': url(linkInput.destination_url),
    'Tracking URL': url(linkInput.tracking_url),
    'Source': richText(linkInput.source),
    'Campaign': richText(linkInput.campaign),
    'Medium': richText(linkInput.medium),
    'UTM Source': richText(linkInput.utm_source),
    'UTM Medium': richText(linkInput.utm_medium),
    'UTM Campaign': richText(linkInput.utm_campaign),
    'Status': select(linkInput.status || 'active'),
    'Created At': date(createdAt),
    'Updated At': date(updatedAt)
  };
}

function createTrackingLinkPayload(link, databaseId) {
  requireServerSide();
  return {
    parent: { database_id: databaseId },
    properties: trackingLinkToNotionProperties(link)
  };
}

module.exports = {
  AUDIENCE_OPTIONS,
  nowIso,
  cleanString,
  compactArray,
  normalizedKey,
  audienceOptions,
  title,
  richText,
  email,
  phoneNumber,
  url,
  select,
  status,
  multiSelect,
  number,
  date,
  safeJson,
  notionPartnerType,
  notionStatus,
  notionOnboardingPath,
  notionReferralSource,
  normalizePartner,
  partnerToNotionProperties,
  createPartnerPagePayload,
  updatePartnerPagePayload,
  partnerEventToNotionProperties,
  createPartnerEventPayload,
  partnerResourceToNotionProperties,
  createPartnerResourcePayload,
  trackingLinkToNotionProperties,
  createTrackingLinkPayload
};
