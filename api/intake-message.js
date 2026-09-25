'use strict';

const partnerEmailIngest = require('./partner-email-ingest');
const applicantEmailIngest = require('./applicant-email-ingest');
const { classify, clean } = require('../lib/email-intake');
const { isAuthorized, parseBody } = require('../lib/action-auth');
const { validationError, unauthorized, methodNotAllowed, sendJson, success } = require('../lib/response');

module.exports = async function intakeMessage(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try { body = parseBody(req); }
  catch (_) { return sendJson(res, validationError('Invalid JSON request body.')); }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return sendJson(res, validationError('A JSON object is required.'));
  }

  const forcedType = clean(body.type || body.intake_type).toLowerCase();
  const decision = forcedType === 'partner' || forcedType === 'applicant'
    ? { type: forcedType, confidence: 'explicit', reason: 'caller_override' }
    : classify(body);

  if (decision.type === 'unknown') {
    return sendJson(res, success({
      action: 'routeIntakeMessage',
      result: 'review_required',
      classification: decision,
      message_id: clean(body.message_id || body.internet_message_id) || null,
      subject: clean(body.subject) || null
    }));
  }

  req.body = { ...body, intake_classification: decision };
  return decision.type === 'partner'
    ? partnerEmailIngest(req, res)
    : applicantEmailIngest(req, res);
};

module.exports._private = { classify };
