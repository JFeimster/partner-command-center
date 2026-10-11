'use strict';

const { isAuthorized, parseBody } = require('../lib/action-auth');
const { archiveCrmObject } = require('../lib/hubspot-client');
const { archiveFundingLeadPage } = require('../lib/notion/funding-leads');
const { unauthorized, methodNotAllowed, sendJson, success, validationError } = require('../lib/response');

const CLEANUP_ID = 'nikita-backfill-20261011';
const HUBSPOT_DEALS = ['65873828672', '65851576142'];
const HUBSPOT_CONTACT = '66735563661';
const NOTION_PAGES = [
  '3f64bc1b-d63c-817b-b606-e4b7b3a441c9',
  '3f64bc1b-d63c-81eb-8f48-e2266e6424b2'
];

async function capture(label, work) {
  try {
    return { label, ok: true, result: await work() };
  } catch (error) {
    if (error && error.status === 404) {
      return { label, ok: true, result: { status: 'already_absent' } };
    }
    return {
      label,
      ok: false,
      error: {
        code: error && error.code || 'unknown_error',
        status: error && error.status || null,
        message: error && error.message || 'Unknown error'
      }
    };
  }
}

module.exports = async function cleanupBackfillArtifacts(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try { body = parseBody(req); }
  catch (_) { return sendJson(res, validationError('Invalid JSON request body.')); }

  if (!body || body.cleanup_id !== CLEANUP_ID) {
    return sendJson(res, validationError('Known cleanup_id is required.'));
  }

  const results = [];
  for (const dealId of HUBSPOT_DEALS) {
    results.push(await capture('hubspot_deal_' + dealId, () => archiveCrmObject('deals', dealId)));
  }
  results.push(await capture('hubspot_contact_' + HUBSPOT_CONTACT, () => archiveCrmObject('contacts', HUBSPOT_CONTACT)));
  for (const pageId of NOTION_PAGES) {
    results.push(await capture('notion_page_' + pageId, () => archiveFundingLeadPage(pageId)));
  }

  const failed = results.filter((item) => !item.ok);
  console.log('[backfill-cleanup]', JSON.stringify({ cleanup_id: CLEANUP_ID, failed: failed.length, results }));
  return sendJson(res, success({
    action: 'cleanupBackfillArtifacts',
    cleanup_id: CLEANUP_ID,
    result: failed.length ? 'completed_with_errors' : 'completed',
    results
  }));
};

module.exports._private = { CLEANUP_ID, HUBSPOT_DEALS, HUBSPOT_CONTACT, NOTION_PAGES };
