// Partner Command Center — trusted partner tracking link API
// Sprint 04 support file. This keeps browser secrets out of client code.

'use strict';

const { createTrackingLink, createPartnerEvent, findPartnerByPartnerId } = require('../lib/notion-client');
const { created, validationError, unauthorized, methodNotAllowed, notionError, serverError, sendJson } = require('../lib/response');

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
  if (!req || !req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

function isAuthorized(req) {
  const expected = process.env.PARTNER_COMMAND_API_KEY;
  const provided = getHeader(req, 'x-api-key') || getHeader(req, 'authorization').replace(/^Bearer\s+/i, '');
  return Boolean(expected && provided && provided === expected);
}

function baseUrl() {
  return process.env.PARTNER_COMMAND_BASE_URL || 'https://distilledfunding.com';
}

function normalizeUrl(value) {
  try {
    return new URL(clean(value || './index.html'), baseUrl()).toString();
  } catch (error) {
    return '';
  }
}

function linkId(partnerId) {
  return 'link_' + clean(partnerId).replace(/[^a-zA-Z0-9_-]/g, '') + '_' + Date.now();
}

module.exports = async function partnerLinks(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try {
    body = parseBody(req);
  } catch (error) {
    return sendJson(res, validationError('Invalid JSON request body.'));
  }

  const partnerId = clean(body.partner_id || body.partnerId);
  if (!partnerId) return sendJson(res, validationError('partner_id is required.'));

  try {
    const partner = await findPartnerByPartnerId(partnerId);
    if (!partner) return sendJson(res, validationError('Partner not found.', { partner_id: partnerId }));

    const now = new Date().toISOString();
    const link = {
      tracking_link_id: clean(body.tracking_link_id) || linkId(partnerId),
      partner_id: partnerId,
      destination_url: normalizeUrl(body.destination_url || body.destinationUrl || body.destination),
      tracking_url: normalizeUrl(body.tracking_url || body.trackingUrl || body.destination_url || body.destination),
      source: clean(body.source || body.utm_source || 'dashboard'),
      campaign: clean(body.campaign || body.utm_campaign || ''),
      medium: clean(body.medium || body.utm_medium || 'partner_dashboard'),
      utm_source: clean(body.utm_source || body.source || 'dashboard'),
      utm_medium: clean(body.utm_medium || body.medium || 'partner_dashboard'),
      utm_campaign: clean(body.utm_campaign || body.campaign || ''),
      status: clean(body.status || 'active'),
      created_at: body.created_at || now,
      updated_at: body.updated_at || now
    };

    if (!link.destination_url || !link.tracking_url) return sendJson(res, validationError('Valid destination and tracking URLs are required.'));

    const page = await createTrackingLink(link);
    await createPartnerEvent({
      partner_id: partnerId,
      event_type: 'tracking_link_created',
      source: 'api',
      status: 'active',
      summary: 'Partner tracking link created through trusted API.',
      metadata: { tracking_link_id: link.tracking_link_id, source: link.source, campaign: link.campaign },
      created_at: now
    });

    return sendJson(res, created({ action: 'createPartnerTrackingLink', partner_id: partnerId, tracking_link: link, notion_page: page && { id: page.id, url: page.url } }));
  } catch (error) {
    if (error && (error.code || error.status)) return sendJson(res, notionError('Notion request failed.', { code: error.code, status: error.status, message: error.message }));
    return sendJson(res, serverError('Partner link creation failed.', { message: error && error.message ? error.message : 'Unknown error' }));
  }
};
