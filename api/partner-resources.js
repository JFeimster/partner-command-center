// GPT Action: assignPartnerResource
'use strict';

const { findPartnerByPartnerId, createPartnerResource, createPartnerEvent } = require('../lib/notion-client');
const { created, validationError, unauthorized, methodNotAllowed, notionError, serverError, sendJson } = require('../lib/response');
const { clean, isAuthorized, parseBody } = require('../lib/action-auth');

module.exports = async function partnerResources(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));
  let body;
  try { body = parseBody(req); } catch (error) { return sendJson(res, validationError('Invalid JSON request body.')); }

  const partnerId = clean(body.partner_id);
  const title = clean(body.resource_title || body.title);
  if (!partnerId || !title) return sendJson(res, validationError('partner_id and resource_title are required.'));

  try {
    const partner = await findPartnerByPartnerId(partnerId);
    if (!partner) return sendJson(res, validationError('Partner not found.'));

    const assignment = {
      partner_id: partnerId,
      resource_title: title,
      resource_type: clean(body.resource_type || 'guide'),
      resource_url: clean(body.resource_url || body.url),
      partner_type: clean(body.partner_type || 'affiliate_partner'),
      onboarding_path: clean(body.onboarding_path || 'affiliate_launch_path'),
      priority: Number(body.priority || 1),
      status: clean(body.status || 'assigned'),
      reason: clean(body.reason || 'Assigned by Partner Command Action.'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const page = await createPartnerResource(assignment);
    await createPartnerEvent({
      partner_id: partnerId,
      event_type: 'resource_assigned',
      source: 'gpt_action',
      status: 'active',
      summary: 'Partner resource assigned: ' + title,
      metadata: { resource_title: title, resource_url: assignment.resource_url },
      created_at: new Date().toISOString()
    });

    return sendJson(res, created({
      action: 'assignPartnerResource',
      partner_id: partnerId,
      resource: assignment,
      notion_resource_page: { id: page.id, url: page.url }
    }));
  } catch (error) {
    if (error && (error.code === 'notion_error' || error.status)) return sendJson(res, notionError('Notion request failed.', { message: error.message, status: error.status }));
    return sendJson(res, serverError('Partner resource assignment failed.', { message: error.message }));
  }
};
