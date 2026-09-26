'use strict';

const { isConfigured: hubspotConfigured } = require('../lib/hubspot-client');
const { isConfigured: sheetsConfigured } = require('../lib/google-sheets-sync');
const { configured: notionConfigured } = require('../lib/notion/funding-leads');
const { methodNotAllowed, sendJson, success } = require('../lib/response');

module.exports = async function intakeHealth(req, res) {
  if (!req || req.method !== 'GET') {
    return sendJson(res, methodNotAllowed(req && req.method, ['GET']));
  }

  const systems = {
    hubspot: Boolean(hubspotConfigured()),
    notion: Boolean(notionConfigured()),
    google_sheets: Boolean(sheetsConfigured())
  };

  return sendJson(res, success({
    service: 'forwarded-email-intake',
    ready: systems.hubspot && systems.notion && systems.google_sheets,
    systems,
    checked_at: new Date().toISOString()
  }));
};
