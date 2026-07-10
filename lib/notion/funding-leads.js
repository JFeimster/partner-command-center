'use strict';

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

function buildProperties(request, requestId) {
  const lead = request.lead;
  const applicant = lead.applicant;
  return {
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

async function upsertFundingLead(request, requestId) {
  if (clean(process.env.LEAD_ROUTER_STORAGE_MODE).toLowerCase() === 'prepare') {
    return {
      result: 'prepared',
      page: null,
      prepared_properties: buildProperties(request, requestId)
    };
  }

  const config = requiredConfig();
  const existing = await findByExternalLeadId(request.lead.lead_id);
  assertNoIdentityConflict(existing, request);

  if (isReplay(existing, request)) {
    return { result: 'duplicate_replayed', page: existing };
  }

  const properties = buildProperties(request, requestId);
  if (existing && existing.id) {
    const page = await notionRequest(`/pages/${existing.id}`, {
      method: 'PATCH',
      body: { properties }
    });
    return { result: 'updated', page };
  }

  const page = await notionRequest('/pages', {
    method: 'POST',
    body: {
      parent: { database_id: config.databaseId },
      properties
    }
  });
  return { result: 'created', page };
}

module.exports = {
  configured,
  buildProperties,
  findByExternalLeadId,
  upsertFundingLead
};
