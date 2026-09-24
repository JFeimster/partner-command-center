// GPT Action: syncPartnerRecords
'use strict';

const { findPartnerByPartnerId, findPartnerByEmail, createPartnerEvent } = require('../lib/notion-client');
const { upsertContact } = require('../lib/hubspot-client');
const { syncPartner } = require('../lib/google-sheets-sync');
const { success, validationError, unauthorized, methodNotAllowed, notionError, serverError, sendJson } = require('../lib/response');
const { clean, isAuthorized, parseBody } = require('../lib/action-auth');
const { safePartner } = require('./partner-get')._private;

module.exports = async function partnerSync(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try { body = parseBody(req); } catch (error) { return sendJson(res, validationError('Invalid JSON request body.')); }
  const partnerId = clean(body.partner_id);
  const email = clean(body.email).toLowerCase();
  if (!partnerId && !email) return sendJson(res, validationError('partner_id or email is required.'));

  try {
    const page = partnerId ? await findPartnerByPartnerId(partnerId) : await findPartnerByEmail(email);
    if (!page) return sendJson(res, validationError('Partner not found.'));
    const partner = safePartner(page);

    let hubspot = { status: 'not_attempted' };
    let google_sheets = { status: 'not_attempted' };

    try { hubspot = await upsertContact(partner); } catch (error) { hubspot = { configured: true, status: 'failed', message: error.message }; }
    try { google_sheets = await syncPartner(partner, { source: 'syncPartnerRecords' }); } catch (error) { google_sheets = { configured: true, status: 'failed', message: error.message }; }

    await createPartnerEvent({
      partner_id: partner.partner_id,
      event_type: 'partner_records_synced',
      source: 'api',
      status: 'active',
      summary: 'Partner CRM synchronization executed.',
      metadata: { hubspot, google_sheets },
      created_at: new Date().toISOString()
    });

    return sendJson(res, success({
      action: 'syncPartnerRecords',
      partner_id: partner.partner_id,
      primary_crm: 'notion',
      notion: { status: 'source_record_found', page_id: page.id, url: page.url },
      hubspot,
      google_sheets
    }));
  } catch (error) {
    if (error && (error.code === 'notion_error' || error.status)) return sendJson(res, notionError('Notion request failed.', { message: error.message, status: error.status }));
    return sendJson(res, serverError('Partner record sync failed.', { message: error.message }));
  }
};
