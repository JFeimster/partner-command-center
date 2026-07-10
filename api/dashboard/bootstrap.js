'use strict';

const crypto = require('crypto');
const { buildDashboardBootstrap } = require('../../lib/dashboard-bootstrap');

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function header(req, name) {
  const headers = req && req.headers ? req.headers : {};
  const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
  const value = key ? headers[key] : '';
  return Array.isArray(value) ? value[0] : value || '';
}

function query(req, name) {
  if (req && req.query && req.query[name] !== undefined) return Array.isArray(req.query[name]) ? req.query[name][0] : req.query[name];
  try {
    const url = new URL(req.url || '/', 'https://partner-command-center.local');
    return url.searchParams.get(name);
  } catch (_) {
    return null;
  }
}

function timingSafeEqual(left, right) {
  const a = Buffer.from(clean(left));
  const b = Buffer.from(clean(right));
  return Boolean(a.length && a.length === b.length && crypto.timingSafeEqual(a, b));
}

function parseCookies(req) {
  return clean(header(req, 'cookie')).split(';').reduce((output, pair) => {
    const index = pair.indexOf('=');
    if (index < 0) return output;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) output[key] = decodeURIComponent(value);
    return output;
  }, {});
}

function base64urlDecode(value) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function verifySessionToken(token) {
  const secret = clean(process.env.DASHBOARD_SESSION_SECRET);
  if (!secret || !clean(token)) return null;
  const parts = clean(token).split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', secret).update(parts[0]).digest('base64url');
  if (!timingSafeEqual(expected, parts[1])) return null;
  try {
    const payload = JSON.parse(base64urlDecode(parts[0]));
    if (!clean(payload.partner_id)) return null;
    if (!Number.isFinite(Number(payload.exp)) || Number(payload.exp) * 1000 <= Date.now()) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

function resolvePartnerId(req) {
  const expectedApiKey = clean(process.env.PARTNER_COMMAND_API_KEY);
  const providedApiKey = clean(header(req, 'x-api-key')) || clean(header(req, 'authorization')).replace(/^ApiKey\s+/i, '');
  if (expectedApiKey && timingSafeEqual(expectedApiKey, providedApiKey)) {
    const partnerId = clean(header(req, 'x-partner-id')) || clean(query(req, 'partner_id'));
    if (!partnerId) {
      const error = new Error('A trusted request must include x-partner-id or partner_id.');
      error.status = 400;
      error.code = 'partner_id_required';
      throw error;
    }
    return { partnerId, authMode: 'trusted_api_key' };
  }

  const bearer = clean(header(req, 'authorization')).replace(/^Bearer\s+/i, '');
  const cookies = parseCookies(req);
  const session = verifySessionToken(bearer || cookies.pcc_partner_session || clean(query(req, 'dashboard_token')));
  if (session) return { partnerId: clean(session.partner_id), authMode: 'signed_session' };

  const allowUnsigned = clean(process.env.DASHBOARD_ALLOW_UNSIGNED_PARTNER_ID).toLowerCase() === 'true';
  if (allowUnsigned && clean(process.env.VERCEL_ENV).toLowerCase() !== 'production') {
    const partnerId = clean(query(req, 'partner_id'));
    if (partnerId) return { partnerId, authMode: 'preview_unsigned' };
  }

  const error = new Error('A valid partner dashboard session is required.');
  error.status = 401;
  error.code = 'dashboard_session_required';
  throw error;
}

function respond(res, status, body, headers) {
  res.statusCode = status;
  Object.entries(headers || {}).forEach(([key, value]) => res.setHeader(key, value));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  return res.end(JSON.stringify(body));
}

module.exports = async function dashboardBootstrap(req, res) {
  const requestId = clean(header(req, 'x-request-id')) || `req_${crypto.randomUUID()}`;
  try {
    if (!req || req.method !== 'GET') {
      return respond(res, 405, { ok: false, error: { code: 'method_not_allowed', message: 'Only GET is allowed.', request_id: requestId } }, { Allow: 'GET' });
    }
    const identity = resolvePartnerId(req);
    const data = await buildDashboardBootstrap(identity.partnerId, { limit: query(req, 'limit') });
    return respond(res, 200, data, {
      'X-Dashboard-Mode': 'live',
      'X-Dashboard-Auth': identity.authMode,
      'X-Request-Id': requestId
    });
  } catch (error) {
    const status = Number(error && error.status) || 500;
    return respond(res, status, {
      ok: false,
      error: {
        code: clean(error && error.code) || 'dashboard_bootstrap_failed',
        message: status >= 500 ? 'The dashboard data service could not complete the request.' : error.message,
        request_id: requestId
      }
    });
  }
};

module.exports.verifySessionToken = verifySessionToken;
module.exports.resolvePartnerId = resolvePartnerId;
