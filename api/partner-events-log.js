// GPT Action: logPartnerEvent
'use strict';

const { createPartnerEvent, findPartnerByPartnerId } = require('../lib/notion-client');
const { created, validationError, unauthorized, methodNotAllowed, notionError, serverError, sendJson } = require('../lib/response');
const { clean, isAuthorized, parseBody } = require('../lib/action-auth');

module.exports = async function partnerEventLog(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));
  let body;
  try { body = parseBody(req); } catch (error) { return sendJson(res, validationError('Invalid JSON request body.')); }

  const partnerId = clean(body.partner_id);
  const eventType = clean(body.event_type);
  if (!partnerId || !eventType) return sendJson(res, validationError('partner_id and event_type are required.'));

  try {
    const partner = await findPartnerByPartnerId(partnerId);
    if (!partner) return sendJson(res, validationError('Partner not found.'));
    const page = await createPartnerEvent({
      event_id: body.event_id,
      partner_id: partnerId,
      event_type: eventType,
      source: clean(body.source || 'gpt_action'),
      status: clean(body.status || 'active'),
      summary: clean(body.summary),
      metadata: body.metadata || {},
      created_at: clean(body.created_at) || new Date().toISOString()
    });
    return sendJson(res, created({
      action: 'logPartnerEvent',
      partner_id: partnerId,
      notion_event_page: { id: page.id, url: page.url }
    }));
  } catch (error) {
    if (error && (error.code === 'notion_error' || error.status)) return sendJson(res, notionError('Notion request failed.', { message: error.message, status: error.status }));
    return sendJson(res, serverError('Partner event logging failed.', { message: error.message }));
  }
};
