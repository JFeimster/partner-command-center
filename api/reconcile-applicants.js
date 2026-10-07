'use strict';

const { getHeader, constantTimeEqual } = require('../lib/action-auth');
const { reconcileImportedEmailApplicants } = require('../lib/reconciliation/applicants');
const { methodNotAllowed, unauthorized, sendJson, success, serverError } = require('../lib/response');

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function authorized(req) {
  const bearer = clean(getHeader(req, 'authorization')).replace(/^Bearer\s+/i, '');
  const apiKey = clean(getHeader(req, 'x-api-key'));
  const cronSecret = clean(process.env.CRON_SECRET);
  const commandKey = clean(process.env.PARTNER_COMMAND_API_KEY);

  if (cronSecret && bearer && constantTimeEqual(bearer, cronSecret)) return true;
  if (commandKey && apiKey && constantTimeEqual(apiKey, commandKey)) return true;
  if (commandKey && bearer && constantTimeEqual(bearer, commandKey)) return true;
  return false;
}

module.exports = async function reconcileApplicants(req, res) {
  if (!req || !['GET', 'POST'].includes(req.method)) {
    return sendJson(res, methodNotAllowed(req && req.method, ['GET', 'POST']));
  }
  if (!authorized(req)) return sendJson(res, unauthorized('Reconciliation authorization is required.'));

  const requested = Number(req.query && req.query.limit || 250);
  const limit = Number.isFinite(requested) ? Math.max(1, Math.min(requested, 500)) : 250;

  try {
    const result = await reconcileImportedEmailApplicants({ limit });
    return sendJson(res, success({
      action: 'reconcileImportedEmailApplicants',
      ...result
    }));
  } catch (error) {
    console.error('[applicant-reconciliation:error]', error && error.stack || error);
    return sendJson(res, serverError('Applicant reconciliation failed.', {
      code: error && error.code || 'unknown_error',
      message: error && error.message || 'Unknown error'
    }));
  }
};

module.exports._private = { authorized };
