// Partner Command Center Notion client
// Sprint 01: server-side, fetch-based helper layer. No packages. No browser usage.

'use strict';

const { requireServerSide } = require('./validation');
const { createPartnerPagePayload, updatePartnerPagePayload, createPartnerEventPayload, createPartnerResourcePayload, createTrackingLinkPayload } = require('./partner-mappers');

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

async function createPartner(partner) {
  const config = getNotionConfig();
  const payload = createPartnerPagePayload(partner, config.partnersDbId);
  return createPage(payload);
}

async function updatePartner(pageId, partner) {
  const payload = updatePartnerPagePayload(partner);
  return updatePage(pageId, payload);
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
  createPartner,
  updatePartner,
  upsertPartner,
  createPartnerEvent,
  createPartnerResource,
  createTrackingLink,
  listPartnerResources,
  listTrackingLinks,
  logPartnerEvent
};
