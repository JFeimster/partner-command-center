// GPT Action: createPartnerTask
'use strict';

const { findPartnerByPartnerId, findPartnerByEmail, createPartnerEvent } = require('../lib/notion-client');
const { upsertContact, createTask } = require('../lib/hubspot-client');
const { created, validationError, unauthorized, methodNotAllowed, notionError, serverError, sendJson } = require('../lib/response');
const { clean, isAuthorized, parseBody } = require('../lib/action-auth');
const { safePartner } = require('./partner-get')._private;

module.exports = async function partnerTasks(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try { body = parseBody(req); } catch (error) { return sendJson(res, validationError('Invalid JSON request body.')); }
  const partnerId = clean(body.partner_id);
  const email = clean(body.email).toLowerCase();
  const subject = clean(body.subject);
  if ((!partnerId && !email) || !subject) return sendJson(res, validationError('partner_id or email, plus subject, are required.'));

  try {
    const page = partnerId ? await findPartnerByPartnerId(partnerId) : await findPartnerByEmail(email);
    if (!page) return sendJson(res, validationError('Partner not found.'));
    const partner = safePartner(page);

    const contact = await upsertContact(partner);
    const result = await createTask({
      subject,
      body: body.body || body.notes,
      due_at: body.due_at,
      priority: body.priority,
      type: body.type,
      status: body.status
    }, contact && contact.contact_id);

    await createPartnerEvent({
      partner_id: partner.partner_id,
      event_type: 'partner_task_created',
      source: 'api',
      status: result.status,
      summary: subject,
      metadata: { hubspot_task: result },
      created_at: new Date().toISOString()
    });

    return sendJson(res, created({
      action: 'createPartnerTask',
      partner_id: partner.partner_id,
      task: result
    }));
  } catch (error) {
    if (error && error.code === 'hubspot_not_configured') return sendJson(res, validationError('HubSpot task creation is not configured.', { env: 'HUBSPOT_PRIVATE_APP_TOKEN' }));
    if (error && (error.code === 'notion_error' || error.status)) return sendJson(res, notionError('Partner lookup/event write failed.', { message: error.message, status: error.status }));
    return sendJson(res, serverError('Partner task creation failed.', { message: error.message }));
  }
};
