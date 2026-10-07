// Partner Command Center Notion client
// Sprint 01: server-side, fetch-based helper layer. No packages. No browser usage.

'use strict';

const { requireServerSide } = require('./validation');
const {
  createPartnerPagePayload,
  updatePartnerPagePayload,
  createPartnerEventPayload,
  createPartnerResourcePayload,
  createTrackingLinkPayload,
  richText,
  phoneNumber,
  url,
  select,
  notionSalesExperience,
  notionSelfDescription,
  notionPreferredStart,
  notionWantsStrategyCall
} = require('./partner-mappers');

const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

function getEnv(name) {
  requireServerSide();
  return process && process.env ? process.env[name] : undefined;
}

function requireEnv(name) {
  const value = getEnv(name);
  if (!value) {
    const error = new Error(`Missing required server environment variable: ${name}`);
    error.code = 'missing_env';
    error.field = name;
    throw error;
  }
  return value;
}

function getNotionConfig() {
  requireServerSide();

  return {
    apiKey: requireEnv('NOTION_API_KEY'),
    partnersDbId: requireEnv('NOTION_PARTNERS_DB_ID'),
    partnerEventsDbId: requireEnv('NOTION_PARTNER_EVENTS_DB_ID'),
    partnerResourcesDbId: requireEnv('NOTION_PARTNER_RESOURCES_DB_ID'),
    trackingLinksDbId: requireEnv('NOTION_TRACKING_LINKS_DB_ID')
  };
}

function getFetch() {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is required in this runtime. Use Node 18+ or a runtime that provides fetch.');
  }
  return fetch;
}

async function notionRequest(path, options) {
  requireServerSide();

  const config = getNotionConfig();
  const requestFetch = getFetch();
  const method = options && options.method ? options.method : 'GET';
  const body = options && options.body !== undefined ? options.body : undefined;
  const authHeader = ['Bearer', config.apiKey].join(' ');

  const response = await requestFetch(`${NOTION_BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': authHeader,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data && data.message ? data.message : 'Notion request failed.');
    error.code = data && data.code ? data.code : 'notion_error';
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

function notionEqualsFilter(property, value) {
  return {
    property,
    rich_text: {
      equals: value
    }
  };
}

function notionEmailFilter(property, value) {
  return {
    property,
    email: {
      equals: value
    }
  };
}

async function queryDatabase(databaseId, body) {
  return notionRequest(`/databases/${databaseId}/query`, {
    method: 'POST',
    body: body || {}
  });
}

async function createPage(payload) {
  return notionRequest('/pages', {
    method: 'POST',
    body: payload
  });
}

async function updatePage(pageId, payload) {
  return notionRequest(`/pages/${pageId}`, {
    method: 'PATCH',
    body: payload
  });
}

async function findPartnerByPartnerId(partnerId) {
  if (!partnerId) return null;

  const config = getNotionConfig();
  const result = await queryDatabase(config.partnersDbId, {
    filter: notionEqualsFilter('Partner ID', partnerId),
    page_size: 1
  });

  return result && result.results && result.results[0] ? result.results[0] : null;
}

async function findPartnerByEmail(email) {
  const config = getNotionConfig();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) return null;

  const result = await queryDatabase(config.partnersDbId, {
    filter: notionEmailFilter('Email', normalizedEmail),
    page_size: 1
  });

  return result && result.results && result.results[0] ? result.results[0] : null;
}

async function findPartnerEventByEventId(eventId) {
  if (!eventId) return null;

  const config = getNotionConfig();
  const result = await queryDatabase(config.partnerEventsDbId, {
    filter: {
      property: 'Event Name',
      title: {
        equals: String(eventId).trim()
      }
    },
    page_size: 1
  });

  return result && result.results && result.results[0] ? result.results[0] : null;
}

async function createPartner(partner) {
  const config = getNotionConfig();
  const payload = createPartnerPagePayload(partner, config.partnersDbId);
  return createPage(payload);
}

async function updatePartner(pageId, partner) {
  const payload = updatePartnerPagePayload(partner);
  return updatePage(pageId, payload);
}

function propertyHasValue(property) {
  if (!property) return false;
  if (Array.isArray(property.title)) return property.title.some((item) => String(item && item.plain_text || '').trim());
  if (Array.isArray(property.rich_text)) return property.rich_text.some((item) => String(item && item.plain_text || '').trim());
  if (property.email !== undefined) return Boolean(String(property.email || '').trim());
  if (property.phone_number !== undefined) return Boolean(String(property.phone_number || '').trim());
  if (property.url !== undefined) return Boolean(String(property.url || '').trim());
  if (property.select !== undefined) return Boolean(property.select && String(property.select.name || '').trim());
  if (Array.isArray(property.multi_select)) return property.multi_select.length > 0;
  return false;
}

function buildMissingPartnerProperties(existingPage, partner) {
  const existing = existingPage && existingPage.properties ? existingPage.properties : {};
  const incoming = partner && typeof partner === 'object' ? partner : {};
  const properties = {};

  const addIfBlank = (propertyName, value, mapper) => {
    const normalized = String(value === undefined || value === null ? '' : value).trim();
    if (!normalized || propertyHasValue(existing[propertyName])) return;
    properties[propertyName] = mapper(normalized);
  };

  addIfBlank('Phone', incoming.phone, phoneNumber);
  addIfBlank('Company', incoming.company, richText);
  addIfBlank('Website', incoming.website, url);
  addIfBlank('City', incoming.city, richText);
  addIfBlank('State', incoming.state, richText);
  addIfBlank('Current Position', incoming.current_position, richText);
  addIfBlank('Previous Experience', incoming.previous_experience || incoming.funding_experience, richText);
  addIfBlank('Interest Reason', incoming.interest_reason, richText);
  addIfBlank('Bio', incoming.bio, richText);
  addIfBlank('Source Form', incoming.source_form, richText);

  addIfBlank('Sales Experience', notionSalesExperience(incoming.sales_experience), select);
  addIfBlank('Self Description', notionSelfDescription(incoming.self_description), select);
  addIfBlank('Wants Strategy Call', notionWantsStrategyCall(incoming.wants_strategy_call), select);
  addIfBlank('Preferred Start', notionPreferredStart(incoming.preferred_start), select);

  return properties;
}

async function updatePartnerMissingFields(existingPage, partner) {
  if (!existingPage || !existingPage.id) return { action: 'unchanged', page: existingPage || null, updated_fields: [] };
  const properties = buildMissingPartnerProperties(existingPage, partner);
  const updatedFields = Object.keys(properties);
  if (!updatedFields.length) return { action: 'unchanged', page: existingPage, updated_fields: [] };

  const page = await updatePage(existingPage.id, { properties });
  return {
    action: 'enriched',
    page,
    existing_page_id: existingPage.id,
    updated_fields: updatedFields
  };
}

async function upsertPartner(partner) {
  const normalizedEmail = String(partner && partner.email || '').trim().toLowerCase();
  let existing = null;
  let matchStrategy = null;

  if (partner && partner.partner_id) {
    existing = await findPartnerByPartnerId(partner.partner_id);
    if (existing && existing.id) {
      matchStrategy = 'partner_id';
    }
  }

  if (!existing && normalizedEmail) {
    existing = await findPartnerByEmail(normalizedEmail);
    if (existing && existing.id) {
      matchStrategy = 'email';
    }
  }

  const normalizedPartner = {
    ...partner,
    email: normalizedEmail || partner.email
  };

  if (existing && existing.id) {
    return {
      action: 'updated',
      match_strategy: matchStrategy || 'unknown',
      page: await updatePartner(existing.id, normalizedPartner),
      existing_page_id: existing.id
    };
  }

  return {
    action: 'created',
    match_strategy: 'none',
    page: await createPartner(normalizedPartner)
  };
}

async function createPartnerEvent(event) {
  const config = getNotionConfig();
  const payload = createPartnerEventPayload(event, config.partnerEventsDbId);
  return createPage(payload);
}

async function createPartnerResource(resource) {
  const config = getNotionConfig();
  const payload = createPartnerResourcePayload(resource, config.partnerResourcesDbId);
  return createPage(payload);
}

async function createTrackingLink(link) {
  const config = getNotionConfig();
  const payload = createTrackingLinkPayload(link, config.trackingLinksDbId);
  return createPage(payload);
}

async function listPartnerResources(partnerId) {
  const config = getNotionConfig();
  return queryDatabase(config.partnerResourcesDbId, {
    filter: notionEqualsFilter('Partner ID', partnerId)
  });
}

async function listTrackingLinks(partnerId) {
  const config = getNotionConfig();
  return queryDatabase(config.trackingLinksDbId, {
    filter: notionEqualsFilter('Partner ID', partnerId)
  });
}

async function logPartnerEvent(partnerId, eventType, summary, metadata) {
  return createPartnerEvent({
    partner_id: partnerId,
    event_type: eventType,
    source: 'system',
    summary,
    metadata,
    created_at: new Date().toISOString()
  });
}

module.exports = {
  NOTION_API_VERSION,
  NOTION_BASE_URL,
  getEnv,
  requireEnv,
  getNotionConfig,
  notionRequest,
  queryDatabase,
  createPage,
  updatePage,
  notionEqualsFilter,
  notionEmailFilter,
  findPartnerByPartnerId,
  findPartnerByEmail,
  findPartnerEventByEventId,
  createPartner,
  updatePartner,
  propertyHasValue,
  buildMissingPartnerProperties,
  updatePartnerMissingFields,
  upsertPartner,
  createPartnerEvent,
  createPartnerResource,
  createTrackingLink,
  listPartnerResources,
  listTrackingLinks,
  logPartnerEvent
};
