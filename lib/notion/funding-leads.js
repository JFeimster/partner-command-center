'use strict';

const crypto = require('crypto');

const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function configured() {
  return Boolean(process.env.NOTION_API_KEY && process.env.NOTION_FUNDING_LEADS_DB_ID);
}

function requiredConfig() {
  const apiKey = clean(process.env.NOTION_API_KEY);
  const databaseId = clean(process.env.NOTION_FUNDING_LEADS_DB_ID);
  if (!apiKey || !databaseId) {
    const error = new Error('Funding Leads Notion storage is not configured.');
    error.code = 'funding_leads_not_configured';
    error.status = 503;
    error.details = {
      missing: [
        ...(!apiKey ? ['NOTION_API_KEY'] : []),
        ...(!databaseId ? ['NOTION_FUNDING_LEADS_DB_ID'] : [])
      ]
    };
    throw error;
  }
  return { apiKey, databaseId };
}

async function notionRequest(path, options) {
  const config = requiredConfig();
  if (typeof fetch !== 'function') {
    const error = new Error('Global fetch is required.');
    error.code = 'runtime_not_supported';
    error.status = 500;
    throw error;
  }

  const response = await fetch(`${NOTION_BASE_URL}${path}`, {
    method: options && options.method ? options.method : 'GET',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    ...(options && options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
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
    const error = new Error(data && data.message ? data.message : 'Notion Funding Leads request failed.');
    error.code = data && data.code ? data.code : 'notion_error';
    error.status = response.status || 502;
    error.details = data;
    throw error;
  }
  return data;
}

function title(value) {
  return { title: [{ text: { content: clean(value).slice(0, 2000) || 'Untitled Funding Lead' } }] };
}

function richText(value) {
  const normalized = clean(value);
  return { rich_text: normalized ? [{ text: { content: normalized.slice(0, 2000) } }] : [] };
}

function email(value) {
  return { email: clean(value).toLowerCase() || null };
}

function phone(value) {
  return { phone_number: clean(value) || null };
}

function number(value) {
  const parsed = Number(value);
  return { number: Number.isFinite(parsed) ? parsed : null };
}

function checkbox(value) {
  return { checkbox: Boolean(value) };
}

function select(value) {
  const normalized = clean(value);
  return { select: normalized ? { name: normalized } : null };
}

function status(value) {
  const normalized = clean(value);
  return { status: normalized ? { name: normalized } : null };
}

function url(value) {
  return { url: clean(value) || null };
}

function date(value) {
  const normalized = clean(value);
  return { date: normalized ? { start: normalized } : null };
}

function extractRichText(property) {
  const values = property && Array.isArray(property.rich_text) ? property.rich_text : [];
  return values.map((item) => item && item.plain_text || '').join('').trim();
}

function extractEmail(property) {
  return clean(property && property.email).toLowerCase();
}

function extractTitle(property) {
  const values = property && Array.isArray(property.title) ? property.title : [];
  return values.map((item) => item && item.plain_text || '').join('').trim();
}

function extractPhone(property) {
  return clean(property && property.phone_number);
}

function extractNumber(property) {
  return property && Number.isFinite(property.number) ? property.number : null;
}

function extractSelect(property) {
  return clean(property && property.select && property.select.name);
}

function extractStatus(property) {
  return clean(property && property.status && property.status.name);
}

function extractDate(property) {
  return clean(property && property.date && property.date.start);
}

function parseJsonRichText(property) {
  const value = extractRichText(property);
  if (!value) return {};
  try { return JSON.parse(value); } catch (_) { return {}; }
}

function emailLeadPageToApplicant(page) {
  const properties = page && page.properties ? page.properties : {};
  const audit = parseJsonRichText(properties['API Payload']);
  const name = extractRichText(properties['Contact Name']) || extractTitle(properties.Name) || extractEmail(properties.Email);
  const lifecycle = extractStatus(properties['Review Status']) || extractStatus(properties['Lead Status']);
  return {
    notion_page_id: page && page.id || null,
    external_event_id: extractRichText(properties['Webhook Event ID']) || clean(audit.source_event_id),
    name,
    email: extractEmail(properties.Email),
    phone: extractPhone(properties.Phone),
    business_name: extractRichText(properties.Company) || extractRichText(properties['Business Name']),
    monthly_revenue: extractNumber(properties['Monthly Revenue']),
    lowest_monthly_revenue: extractNumber(properties['Revenue (Lowest Monthly)']),
    account_type: extractSelect(properties['Account Type']),
    state: extractRichText(properties.State),
    status: clean(audit.status) || lifecycle || 'Unknown',
    route_detected: clean(audit.route_detected) || 'Unknown',
    routing_outcome: '',
    source: 'reconciliation_backfill',
    email_subject: clean(audit.email_subject),
    email_from: clean(audit.email_from),
    email_date: clean(audit.email_date),
    raw_body_preview: ''
  };
}

async function listImportedEmailFundingLeads(options) {
  const config = requiredConfig();
  const limit = Math.max(1, Math.min(Number(options && options.limit) || 250, 500));
  let cursor = clean(options && options.start_cursor) || undefined;
  const pages = [];

  while (pages.length < limit) {
    const pageSize = Math.min(100, limit - pages.length);
    const body = {
      filter: {
        property: 'Submission Method',
        select: { equals: 'Imported Email' }
      },
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
      page_size: pageSize
    };
    if (cursor) body.start_cursor = cursor;
    const result = await notionRequest(`/databases/${config.databaseId}/query`, { method: 'POST', body });
    const batch = result && Array.isArray(result.results) ? result.results : [];
    pages.push(...batch);
    if (!result || !result.has_more || !result.next_cursor || !batch.length) {
      cursor = null;
      break;
    }
    cursor = result.next_cursor;
  }

  return {
    pages,
    has_more: Boolean(cursor),
    next_cursor: cursor || null
  };
}

async function updateEmailFundingLeadReconciliation(pageId, summary) {
  if (!configured() || !clean(pageId)) return { configured: configured(), status: 'skipped' };
  const failures = summary && Array.isArray(summary.failures) ? summary.failures : [];
  const text = failures.length
    ? failures.map((item) => `${item.system}: ${item.message || item.code || 'failed'}`).join(' | ').slice(0, 1900)
    : '';
  const page = await notionRequest(`/pages/${pageId}`, {
    method: 'PATCH',
    body: {
      properties: {
        'Last Sync Time': date(new Date().toISOString()),
        'Sync Error': richText(text)
      }
    }
  });
  return { configured: true, status: 'updated', notion_page_id: page && page.id || pageId };
}

function fundingTier(value) {
  const map = {
    highly_fundable: 'Strong',
    fundable_review: 'Review Ready',
    selective_programs: 'Needs Prep',
    not_ready_fixable: 'Not Ready'
  };
  return map[clean(value)] || 'Unknown';
}

function leadPriority(value) {
  const map = {
    hot: 'Hot',
    warm: 'Warm',
    nurture: 'Nurture',
    education: 'Low',
    manual_review: 'Low'
  };
  return map[clean(value)] || 'Low';
}

function safeAuditEnvelope(request, requestId) {
  return JSON.stringify({
    schema_version: request.schema_version,
    idempotency_key: request.idempotency_key,
    source_system: request.source_system,
    source_event_id: request.source_event_id || null,
    lead_id: request.lead.lead_id,
    request_id: requestId
  });
}

function buildProperties(request, requestId, attribution, options) {
  const lead = request.lead;
  const applicant = lead.applicant;
  const properties = {
    Name: title(`${applicant.business_name} — ${lead.lead_id}`),
    'External Lead ID': richText(lead.lead_id),
    'Business Name': richText(applicant.business_name),
    'Contact Name': richText(`${applicant.first_name} ${applicant.last_name}`),
    Email: email(applicant.email),
    Phone: phone(applicant.phone),
    State: richText(applicant.state),
    'Monthly Revenue': number(lead.answers.monthly_revenue),
    'Funding Readiness Score': number(lead.score_result.score),
    'Funding Readiness Tier': select(fundingTier(lead.score_result.tier && lead.score_result.tier.id)),
    'Lead Priority': select(leadPriority(lead.lead_priority)),
    'Manual Review Recommended': checkbox(lead.manual_review_recommended),
    'Lead Status': status('New'),
    'Partner ID': richText(lead.partner_id),
    'Tracking Link ID': richText(lead.tracking_link_id),
    'Campaign ID': richText(lead.campaign_id),
    'Widget ID': richText(lead.widget_id),
    'Source URL': url(lead.source_url),
    'UTM Source': richText(lead.utm_source),
    'UTM Medium': richText(lead.utm_medium),
    'UTM Campaign': richText(lead.utm_campaign),
    'UTM Term': richText(lead.utm_term),
    'UTM Content': richText(lead.utm_content),
    'Consent Received': checkbox(lead.consent && lead.consent.contact && lead.consent.privacy),
    'Consent Timestamp': date(lead.consent && lead.consent.captured_at),
    'API Payload': richText(safeAuditEnvelope(request, requestId))
  };

  if (attribution && attribution.partnerPageId) {
    properties.Partner = { relation: [{ id: attribution.partnerPageId }] };
    properties['Tracking Link'] = {
      relation: attribution.trackingLinkPageId
        ? [{ id: attribution.trackingLinkPageId }]
        : []
    };
  } else if (options && options.isUpdate && attribution && attribution.status === 'direct') {
    properties.Partner = { relation: [] };
    properties['Tracking Link'] = { relation: [] };
  }

  return properties;
}

async function findByExternalLeadId(leadId) {
  const config = requiredConfig();
  const result = await notionRequest(`/databases/${config.databaseId}/query`, {
    method: 'POST',
    body: {
      filter: {
        property: 'External Lead ID',
        rich_text: { equals: leadId }
      },
      page_size: 1
    }
  });
  return result && result.results && result.results[0] ? result.results[0] : null;
}

function assertNoIdentityConflict(existing, request) {
  if (!existing || !existing.properties) return;
  const existingEmail = extractEmail(existing.properties.Email);
  const existingBusiness = extractRichText(existing.properties['Business Name']).toLowerCase();
  const incomingEmail = clean(request.lead.applicant.email).toLowerCase();
  const incomingBusiness = clean(request.lead.applicant.business_name).toLowerCase();

  if ((existingEmail && existingEmail !== incomingEmail) || (existingBusiness && existingBusiness !== incomingBusiness)) {
    const error = new Error('The lead_id is already associated with a different applicant identity.');
    error.code = 'lead_conflict';
    error.status = 409;
    throw error;
  }
}

function isReplay(existing, request) {
  if (!existing || !existing.properties) return false;
  const audit = extractRichText(existing.properties['API Payload']);
  if (!audit) return false;
  try {
    const parsed = JSON.parse(audit);
    return parsed.idempotency_key === request.idempotency_key;
  } catch (error) {
    return false;
  }
}

async function upsertFundingLead(request, requestId, attribution) {
  if (clean(process.env.LEAD_ROUTER_STORAGE_MODE).toLowerCase() === 'prepare') {
    return {
      result: 'prepared',
      page: null,
      prepared_properties: buildProperties(request, requestId, attribution)
    };
  }

  const config = requiredConfig();
  const existing = await findByExternalLeadId(request.lead.lead_id);
  assertNoIdentityConflict(existing, request);

  if (isReplay(existing, request)) {
    return { result: 'duplicate_replayed', page: existing };
  }

  if (existing && existing.id) {
    const properties = buildProperties(request, requestId, attribution, { isUpdate: true });
    const page = await notionRequest(`/pages/${existing.id}`, {
      method: 'PATCH',
      body: { properties }
    });
    return { result: 'updated', page };
  }

  const properties = buildProperties(request, requestId, attribution);
  const page = await notionRequest('/pages', {
    method: 'POST',
    body: {
      parent: { database_id: config.databaseId },
      properties
    }
  });
  return { result: 'created', page };
}

function stableEmailLeadId(emailAddress) {
  const normalized = clean(emailAddress).toLowerCase();
  if (!normalized) return '';
  return 'maillead_' + crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 24);
}

function numericMoney(value) {
  const raw = clean(value);
  if (!raw) return null;
  if (/[-–—]\s*\$?\s*[\d,.]+/.test(raw)) return null;
  const match = raw.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const parsed = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function validPersonName(value) {
  const normalized = clean(value);
  return Boolean(
    normalized &&
    normalized.length <= 120 &&
    !/@/.test(normalized) &&
    !/(bankbreezy|giggle|submission|subject:|application|funding request|notification)/i.test(normalized)
  );
}

function normalizedAccountType(value) {
  const normalized = clean(value).toLowerCase();
  if (/personal|in your personal name/.test(normalized)) return 'personal';
  if (/business/.test(normalized)) return 'business';
  return '';
}

function initialEmailLifecycle(value) {
  const normalized = clean(value).toLowerCase();
  if (/funded/.test(normalized)) return { lead: 'Won', review: 'Funded' };
  if (/declin|not qualified|closed.?lost|lost/.test(normalized)) return { lead: 'Lost', review: 'Declined' };
  if (/client file closed|closed/.test(normalized)) return { lead: 'Closed', review: 'Closed' };
  if (/application incomplete|missing|waiting/.test(normalized)) return { lead: 'Needs Applicant Action', review: 'Missing Info' };
  if (/under review|in review|underwriting/.test(normalized)) return { lead: 'In Progress', review: 'In Underwriting' };
  return { lead: 'New', review: 'Received' };
}

function safeEmailAuditEnvelope(applicant) {
  return JSON.stringify({
    source_system: 'cloudflare_forwarded_email',
    source_event_id: clean(applicant.external_event_id) || null,
    email: clean(applicant.email).toLowerCase(),
    email_subject: clean(applicant.email_subject) || null,
    email_from: clean(applicant.email_from) || null,
    email_date: clean(applicant.email_date) || null,
    route_detected: clean(applicant.route_detected) || null,
    status: clean(applicant.status) || null
  });
}

function buildEmailFundingLeadProperties(applicant, options) {
  const isUpdate = Boolean(options && options.isUpdate);
  const personName = validPersonName(applicant.name) ? clean(applicant.name) : '';
  const monthlyRevenue = numericMoney(applicant.monthly_revenue);
  const lowestMonthlyRevenue = numericMoney(applicant.lowest_monthly_revenue);
  const accountType = normalizedAccountType(applicant.account_type);
  const properties = {};

  if (!isUpdate) {
    const lifecycle = initialEmailLifecycle(applicant.status);
    properties.Name = title(personName || clean(applicant.email));
    properties['External Lead ID'] = richText(stableEmailLeadId(applicant.email));
    properties['Lead Status'] = status(lifecycle.lead);
    properties['Review Status'] = status(lifecycle.review);
    properties['Intake Channel'] = select('Email');
    properties['Submission Method'] = select('Imported Email');
  } else if (personName) {
    properties.Name = title(personName);
  }

  if (personName) properties['Contact Name'] = richText(personName);
  if (clean(applicant.email)) properties.Email = email(applicant.email);
  if (clean(applicant.phone)) properties.Phone = phone(applicant.phone);
  if (clean(applicant.business_name)) properties.Company = richText(applicant.business_name);
  if (clean(applicant.state)) properties.State = richText(applicant.state);
  if (monthlyRevenue !== null) properties['Monthly Revenue'] = number(monthlyRevenue);
  if (lowestMonthlyRevenue !== null) properties['Revenue (Lowest Monthly)'] = number(lowestMonthlyRevenue);
  if (accountType) properties['Account Type'] = select(accountType);
  if (clean(applicant.external_event_id)) properties['Webhook Event ID'] = richText(applicant.external_event_id);

  properties['Last Sync Time'] = date(new Date().toISOString());
  properties['API Payload'] = richText(safeEmailAuditEnvelope(applicant));
  return properties;
}

function parseEmailEventTimestamp(value) {
  const normalized = clean(value).replace(/\s+at\s+/i, ' ');
  if (!normalized) return null;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function selectEmailFundingLeadMatch(matches, applicant) {
  const pages = Array.isArray(matches) ? matches : [];
  if (pages.length <= 1) return pages[0] || null;

  const incomingEventId = clean(applicant && applicant.external_event_id);
  if (incomingEventId) {
    const exact = pages.filter((page) =>
      extractRichText(page && page.properties && page.properties['Webhook Event ID']) === incomingEventId
    );
    if (exact.length === 1) return exact[0];
  }

  const eventTime = parseEmailEventTimestamp(applicant && applicant.email_date);
  if (eventTime !== null) {
    const scored = pages
      .map((page) => ({
        page,
        diff: Math.abs((Date.parse(clean(page && page.created_time)) || 0) - eventTime)
      }))
      .filter((item) => item.diff > 0 || Date.parse(clean(item.page && item.page.created_time)) === eventTime)
      .sort((a, b) => a.diff - b.diff);

    const closest = scored[0];
    const runnerUp = scored[1];
    const maxDistance = 36 * 60 * 60 * 1000;
    const minimumSeparation = 2 * 60 * 60 * 1000;
    if (
      closest &&
      closest.diff <= maxDistance &&
      (!runnerUp || (runnerUp.diff - closest.diff) >= minimumSeparation)
    ) {
      return closest.page;
    }
  }

  const error = new Error('Multiple Funding Leads records share the same applicant email and no case-safe match was found.');
  error.code = 'email_identity_conflict';
  error.status = 409;
  error.details = {
    email: clean(applicant && applicant.email).toLowerCase(),
    page_ids: pages.map((page) => page.id)
  };
  throw error;
}

async function findEmailFundingLeadByEmail(emailAddress, applicant) {
  const config = requiredConfig();
  const normalized = clean(emailAddress).toLowerCase();
  if (!normalized) return null;

  const result = await notionRequest(`/databases/${config.databaseId}/query`, {
    method: 'POST',
    body: {
      filter: {
        property: 'Email',
        email: { equals: normalized }
      },
      page_size: 10
    }
  });

  const matches = result && Array.isArray(result.results) ? result.results : [];
  return selectEmailFundingLeadMatch(matches, {
    ...(applicant || {}),
    email: normalized
  });
}

function isEmailEventReplay(existing, applicant) {
  if (!existing || !existing.properties) return false;
  const incomingEventId = clean(applicant.external_event_id);
  if (!incomingEventId) return false;
  return extractRichText(existing.properties['Webhook Event ID']) === incomingEventId;
}

async function upsertEmailFundingLead(applicant) {
  if (!clean(applicant && applicant.email)) {
    return { configured: configured(), status: 'skipped', reason: 'missing_email' };
  }
  if (!configured()) return { configured: false, status: 'not_configured' };

  const config = requiredConfig();
  const existing = await findEmailFundingLeadByEmail(applicant.email, applicant);

  if (existing && isEmailEventReplay(existing, applicant)) {
    return {
      configured: true,
      status: 'duplicate_replayed',
      notion_page_id: existing.id,
      external_lead_id: extractRichText(existing.properties['External Lead ID']) || stableEmailLeadId(applicant.email)
    };
  }

  if (existing && existing.id) {
    const page = await notionRequest(`/pages/${existing.id}`, {
      method: 'PATCH',
      body: { properties: buildEmailFundingLeadProperties(applicant, { isUpdate: true }) }
    });
    return {
      configured: true,
      status: 'updated',
      notion_page_id: page.id || existing.id,
      external_lead_id: extractRichText(existing.properties['External Lead ID']) || stableEmailLeadId(applicant.email)
    };
  }

  const page = await notionRequest('/pages', {
    method: 'POST',
    body: {
      parent: { database_id: config.databaseId },
      properties: buildEmailFundingLeadProperties(applicant, { isUpdate: false })
    }
  });

  return {
    configured: true,
    status: 'created',
    notion_page_id: page.id,
    external_lead_id: stableEmailLeadId(applicant.email)
  };
}

module.exports = {
  configured,
  buildProperties,
  findByExternalLeadId,
  upsertFundingLead,
  stableEmailLeadId,
  numericMoney,
  validPersonName,
  normalizedAccountType,
  initialEmailLifecycle,
  buildEmailFundingLeadProperties,
  parseEmailEventTimestamp,
  selectEmailFundingLeadMatch,
  findEmailFundingLeadByEmail,
  upsertEmailFundingLead,
  emailLeadPageToApplicant,
  listImportedEmailFundingLeads,
  updateEmailFundingLeadReconciliation
};
