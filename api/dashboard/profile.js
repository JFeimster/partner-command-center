'use strict';

const { resolvePartnerId } = require('./bootstrap');
const { updateEditableProfile } = require('../../lib/distribution-kit');

function respond(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  return res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function profile(req, res) {
  try {
    if (!req || req.method !== 'PATCH') return respond(res, 405, { ok: false, error: { code: 'method_not_allowed' } });
    const identity = resolvePartnerId(req);
    const changes = await readBody(req);
    const updated = await updateEditableProfile(identity.partnerId, changes);
    return respond(res, 200, { ok: true, profile: updated });
  } catch (error) {
    const status = Number(error && error.status) || 500;
    return respond(res, status, { ok: false, error: { code: error.code || 'profile_update_failed', message: status >= 500 ? 'Profile update could not be completed.' : error.message } });
  }
};
