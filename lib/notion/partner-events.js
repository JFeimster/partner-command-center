'use strict';

const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function configured() {
  return Boolean(process.env.NOTION_API_KEY && process.env.NOTION_PARTNER_EVENTS_DB_ID);
}

function config() {
  const apiKey = clean(process.env.NOTION_API_KEY);
  const databaseId = clean(process.env.NOTION_PARTNER_EVENTS_DB_ID);
  if (!apiKey || !databaseId) return null;
  return { apiKey, databaseId };
}

async function createPartnerLeadEvent(input) {
  if (clean(process.env.LEAD_ROUTER_STORAGE_MODE).toLowerCase() === 'prepare') {
    return { result: 'prepared', page: null };
  }

  const settings = config();
  if (!settings) return { result: 'not_configured', page: null };
  if (typeof fetch !== 'function') throw new Error('Global fetch is required.');

  const lead = input.request.lead;
  const occurredAt = input.receivedAt;
  const needsReview = Boolean(lead.manual_review_recommended || lead.review_status === 'queued_for_review');
  const nextAction = lead.next_steps && lead.next_steps[0] ? lead.next_steps[0].label : 'Review the funding-readiness lead.';
  const metadata = {
    event_type: 'lead.routing.completed',
    lead_id: lead.lead_id,
    partner_id: input.attribution.partner_id,
    tracking_link_id: input.attribution.tracking_link_id,
    campaign_id: lead.campaign_id,
    widget_id: lead.widget_id,
    source_system: input.request.source_system,
    review_status: lead.review_status,
    persistence_result: input.persistenceResult,
    request_id: input.requestId
  };

  const properties = {
    'Event Name': { title: [{ text: { content: `Lead Received: ${lead.lead_id}` } }] },
    'Event Type': { select: { name: needsReview ? 'Manual Review Requested' : 'Status Updated' } },
    'Partner ID': { rich_text: input.attribution.partner_id ? [{ text: { content: input.attribution.partner_id } }] : [] },
    Source: { select: { name: input.request.source_system === 'gpt_action' ? 'gpt_action' : 'API' } },
    Status: { select: { name: needsReview ? 'needs_review' : 'intake_received' } },
    Summary: { rich_text: [{ text: { content: 'Funding-readiness lead accepted for internal review.' } }] },
    'Event Summary': { rich_text: [{ text: { content: `Lead ${lead.lead_id} was validated, attributed, and persisted without exposing applicant details.` } }] },
    'Metadata JSON': { rich_text: [{ text: { content: JSON.stringify(metadata) } }] },
    'Occurred At': { date: { start: occurredAt } },
    Actor: { rich_text: [{ text: { content: input.request.source_system } }] },
    'Next Action': { rich_text: [{ text: { content: clean(nextAction).slice(0, 2000) } }] },
    'Payload / Raw Data': { rich_text: [] }
  };

  if (input.partnerPageId) {
    properties.Partner = { relation: [{ id: input.partnerPageId }] };
  }

  const response = await fetch(`${NOTION_BASE_URL}/pages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: { database_id: settings.databaseId },
      properties
    })
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
    const error = new Error(data && data.message ? data.message : 'Notion Partner Event request failed.');
    error.code = data && data.code ? data.code : 'partner_event_failed';
    error.status = response.status || 502;
    error.details = data;
    throw error;
  }
  return { result: 'created', page: data };
}

module.exports = {
  configured,
  createPartnerLeadEvent
};
