'use strict';

const { resolvePartnerId } = require('./bootstrap');
const { getDistributionKit } = require('../../lib/distribution-kit');

function respond(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  return res.end(JSON.stringify(body));
}

module.exports = async function distribution(req, res) {
  try {
    if (!req || req.method !== 'GET') return respond(res, 405, { ok: false, error: { code: 'method_not_allowed' } });
    const identity = resolvePartnerId(req);
    const profile = await getDistributionKit(identity.partnerId);
    return respond(res, 200, { ok: true, profile });
  } catch (error) {
    const status = Number(error && error.status) || 500;
    return respond(res, status, { ok: false, error: { code: error.code || 'distribution_failed', message: status >= 500 ? 'Distribution data could not be loaded.' : error.message } });
  }
};
