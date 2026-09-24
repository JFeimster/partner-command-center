// GPT Action: getPartner
'use strict';

const { findPartnerByPartnerId, findPartnerByEmail } = require('../lib/notion-client');
const { success, validationError, unauthorized, methodNotAllowed, notionError, serverError, sendJson } = require('../lib/response');
const { clean, isAuthorized, parseBody } = require('../lib/action-auth');

function plain(items) { return Array.isArray(items) && items[0] && items[0].plain_text ? items[0].plain_text : ''; }
function propText(prop) { if (!prop) return ''; if (prop.title) return plain(prop.title); if (prop.rich_text) return plain(prop.rich_text); return ''; }
function propSelect(prop) { return prop && prop.select && prop.select.name ? prop.select.name : (prop && prop.status && prop.status.name ? prop.status.name : ''); }
function propEmail(prop) { return prop && prop.email ? prop.email : ''; }
function propPhone(prop) { return prop && prop.phone_number ? prop.phone_number : ''; }
function propUrl(prop) { return prop && prop.url ? prop.url : ''; }

function safePartner(page) {
  const p = page && page.properties ? page.properties : {};
  return {
    partner_id: propText(p['Partner ID']),
    name: propText(p.Name),
    email: propEmail(p.Email),
    phone: propPhone(p.Phone),
    company: propText(p.Company),
    website: propUrl(p.Website),
    partner_type: propSelect(p['Partner Type']),
    status: propSelect(p.Status),
    tier: propSelect(p.Tier),
    onboarding_path: propSelect(p['Onboarding Path']),
    notion_page_id: page && page.id,
    notion_url: page && page.url
  };
}

module.exports = async function partnerGet(req, res) {
  if (!req || !['GET','POST'].includes(req.method)) return sendJson(res, methodNotAllowed(req && req.method, ['GET','POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body = {};
  try { body = req.method === 'POST' ? parseBody(req) : (req.query || {}); } catch (error) { return sendJson(res, validationError('Invalid request body.')); }
  const partnerId = clean(body.partner_id || body.partnerId);
  const email = clean(body.email).toLowerCase();
  if (!partnerId && !email) return sendJson(res, validationError('partner_id or email is required.'));

  try {
    const page = partnerId ? await findPartnerByPartnerId(partnerId) : await findPartnerByEmail(email);
    if (!page) return sendJson(res, validationError('Partner not found.', { partner_id: partnerId || null, email: email || null }));
    return sendJson(res, success({ action: 'getPartner', partner: safePartner(page) }));
  } catch (error) {
    if (error && (error.code === 'notion_error' || error.status)) return sendJson(res, notionError('Notion request failed.', { message: error.message, status: error.status }));
    return sendJson(res, serverError('Partner lookup failed.', { message: error.message }));
  }
};

module.exports._private = { safePartner };
