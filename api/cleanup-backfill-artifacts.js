'use strict';

const { isAuthorized, parseBody } = require('../lib/action-auth');
const { archiveCrmObject, hubspotRequest } = require('../lib/hubspot-client');
const { archiveFundingLeadPage } = require('../lib/notion/funding-leads');
const { unauthorized, methodNotAllowed, sendJson, success, validationError } = require('../lib/response');

const CLEANUP_ID = 'nikita-backfill-20261011';
const HUBSPOT_DEALS = ['65873828672', '65851576142'];
const HUBSPOT_CONTACT = '66735563661';
const NOTION_PAGES = [
  '3f64bc1b-d63c-817b-b606-e4b7b3a441c9',
  '3f64bc1b-d63c-81eb-8f48-e2266e6424b2',
  '3f64bc1b-d63c-81ca-b5fd-e53bebe80e75',
  '3f64bc1b-d63c-8149-8902-e9268d71f42a'
];
const BAD_ASSOCIATIONS = [
  { deal_id: '65879331230', contact_id: '217027135619' }
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
  if (!req || !['GET', 'POST'].includes(req.method)) return sendJson(res, methodNotAllowed(req && req.method, ['GET', 'POST']));

  let body = {};
  if (req.method === 'POST') {
    if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));
    try { body = parseBody(req); }
    catch (_) { return sendJson(res, validationError('Invalid JSON request body.')); }
  } else {
    body.cleanup_id = req.query && req.query.cleanup_id;
  }

  if (!body || body.cleanup_id !== CLEANUP_ID) {
    return sendJson(res, validationError('Known cleanup_id is required.'));
  }

  const results = [];
  for (const dealId of HUBSPOT_DEALS) {
    results.push(await capture('hubspot_deal_' + dealId, () => archiveCrmObject('deals', dealId)));
  }
  results.push(await capture('hubspot_contact_' + HUBSPOT_CONTACT, () => archiveCrmObject('contacts', HUBSPOT_CONTACT)));
  for (const association of BAD_ASSOCIATIONS) {
    results.push(await capture(
      'hubspot_association_' + association.deal_id + '_' + association.contact_id,
      async () => {
        await hubspotRequest(
          '/crm/v4/objects/deals/' + association.deal_id + '/associations/contacts/' + association.contact_id,
          { method: 'DELETE' }
        );
        return { status: 'removed', ...association };
      }
    ));
  }
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

module.exports._private = { CLEANUP_ID, HUBSPOT_DEALS, HUBSPOT_CONTACT, NOTION_PAGES, BAD_ASSOCIATIONS, capture };
