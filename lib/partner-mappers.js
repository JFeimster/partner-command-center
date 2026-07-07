// Partner Command Center Notion payload mappers
// Sprint 01: transform normalized Partner Command Center objects into Notion API payloads.

'use strict';

const { requireServerSide } = require('./validation');

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
    'Partner Type': select(partner.partner_type),
    'Audience': richText(partner.audience),
    'Referral Source': richText(partner.referral_source),
    'Traffic Source': richText(partner.traffic_source),
    'Status': select(partner.status),
    'Tier': select(partner.tier),
    'Onboarding Path': select(partner.onboarding_path),
    'Resource Recommendations': multiSelect(partner.resource_recommendations),
    'Campaign Recommendations': multiSelect(partner.campaign_recommendations),
    'Tally Submission ID': richText(partner.tally_submission_id),
    'Created At': date(partner.created_at),
    'Updated At': date(partner.updated_at)
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
  nowIso,
  cleanString,
  compactArray,
  title,
  richText,
  email,
  phoneNumber,
  url,
  select,
  multiSelect,
  number,
  date,
  safeJson,
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
