'use strict';

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function endpoint() {
  return clean(process.env.GOOGLE_SHEETS_SYNC_WEBHOOK_URL);
}

function isConfigured() {
  return Boolean(endpoint());
}

async function syncPartner(partner, context) {
  if (!isConfigured()) return { configured: false, status: 'not_configured' };

  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.GOOGLE_SHEETS_SYNC_SECRET ? {
        'X-Sync-Secret': process.env.GOOGLE_SHEETS_SYNC_SECRET
      } : {})
    },
    body: JSON.stringify({
      action: 'upsert_partner',
      partner,
      context: context || {}
    })
  });

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (error) { data = { raw: text }; }

  if (!response.ok) {
    return {
      configured: true,
      status: 'failed',
      http_status: response.status,
      response: data
    };
  }

  return {
    configured: true,
    status: 'synced',
    response: data
  };
}


async function syncApplicant(applicant, context) {
  if (!isConfigured()) return { configured: false, status: 'not_configured' };

  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.GOOGLE_SHEETS_SYNC_SECRET ? {
        'X-Sync-Secret': process.env.GOOGLE_SHEETS_SYNC_SECRET
      } : {})
    },
    body: JSON.stringify({
      action: 'upsert_applicant_notification',
      applicant,
      context: context || {}
    })
  });

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (error) { data = { raw: text }; }

  if (!response.ok) {
    return { configured: true, status: 'failed', http_status: response.status, response: data };
  }

  return { configured: true, status: 'synced', response: data };
}

module.exports = { isConfigured, syncPartner, syncApplicant };
