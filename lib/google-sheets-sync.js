'use strict';

const crypto = require('crypto');

const DEFAULT_APPLICANT_SHEET = 'Master Applicants';
const DEFAULT_MAX_ROWS = 5000;

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function endpoint() {
  return clean(process.env.GOOGLE_SHEETS_SYNC_WEBHOOK_URL);
}

function serviceAccountJson() {
  const raw = clean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function directConfig() {
  const json = serviceAccountJson();
  return {
    service_account_email: clean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || json.client_email),
    private_key: clean(process.env.GOOGLE_PRIVATE_KEY || json.private_key).replace(/\\n/g, '\n'),
    sheet_id: clean(process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
    sheet_name: clean(process.env.GOOGLE_SHEETS_APPLICANT_TAB) || DEFAULT_APPLICANT_SHEET
  };
}

function isDirectConfigured() {
  const config = directConfig();
  return Boolean(config.service_account_email && config.private_key && config.sheet_id);
}

function isConfigured() {
  return Boolean(endpoint()) || isDirectConfigured();
}

function configurationStatus() {
  const config = directConfig();
  return {
    configured: isConfigured(),
    mode: isDirectConfigured() ? 'direct_google_sheets_api' : (endpoint() ? 'webhook' : 'not_configured'),
    webhook: Boolean(endpoint()),
    direct: isDirectConfigured(),
    direct_requirements: {
      service_account_email: Boolean(config.service_account_email),
      private_key: Boolean(config.private_key),
      sheet_id: Boolean(config.sheet_id)
    },
    sheet_name: config.sheet_name
  };
}

function receiverSummary(data) {
  if (!data || typeof data !== 'object') return null;
  const summary = {};
  [
    'ok',
    'status',
    'action',
    'result',
    'record_id',
    'row',
    'row_number',
    'created',
    'updated',
    'message',
    'error'
  ].forEach((key) => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') summary[key] = data[key];
  });
  return Object.keys(summary).length ? summary : null;
}

async function readResponse(response) {
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }
  return data;
}

async function webhookSync(action, payload) {
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.GOOGLE_SHEETS_SYNC_SECRET ? {
        'X-Sync-Secret': process.env.GOOGLE_SHEETS_SYNC_SECRET
      } : {})
    },
    body: JSON.stringify({ action, ...payload })
  });

  const data = await readResponse(response);
  if (!response.ok) {
    return {
      configured: true,
      mode: 'webhook',
      status: 'failed',
      http_status: response.status,
      receiver: receiverSummary(data),
      response: data
    };
  }

  return {
    configured: true,
    mode: 'webhook',
    status: 'synced',
    http_status: response.status,
    receiver: receiverSummary(data),
    response: data
  };
}

function base64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

let cachedGoogleToken = null;
let cachedGoogleTokenExpiresAt = 0;

async function googleAccessToken() {
  if (cachedGoogleToken && Date.now() < cachedGoogleTokenExpiresAt - 60000) {
    return cachedGoogleToken;
  }

  const config = directConfig();
  if (!isDirectConfigured()) {
    const error = new Error('Google Sheets direct API credentials are not configured.');
    error.code = 'google_sheets_not_configured';
    throw error;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: config.service_account_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  const unsigned = header + '.' + claims;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), config.private_key);
  const assertion = unsigned + '.' + base64Url(signature);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    }).toString()
  });

  const data = await readResponse(response);
  if (!response.ok || !data.access_token) {
    const error = new Error('Google service-account token exchange failed.');
    error.code = 'google_auth_failed';
    error.status = response.status;
    throw error;
  }

  cachedGoogleToken = data.access_token;
  cachedGoogleTokenExpiresAt = Date.now() + (Number(data.expires_in || 3600) * 1000);
  return cachedGoogleToken;
}

function quoteSheetName(name) {
  return "'" + clean(name).replace(/'/g, "''") + "'";
}

async function sheetsRequest(path, options) {
  const token = await googleAccessToken();
  const response = await fetch('https://sheets.googleapis.com/v4/' + path, {
    method: options && options.method || 'GET',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    ...(options && options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
  });
  const data = await readResponse(response);
  if (!response.ok) {
    const error = new Error('Google Sheets API request failed.');
    error.code = 'google_sheets_api_error';
    error.status = response.status;
    error.details = data && data.error && data.error.status ? { status: data.error.status } : null;
    throw error;
  }
  return data;
}

function splitName(name) {
  const parts = clean(name).split(/\s+/).filter(Boolean);
  return {
    first_name: parts.shift() || '',
    last_name: parts.join(' ')
  };
}

function stableApplicantRecordId(email) {
  const normalized = clean(email).toLowerCase();
  if (!normalized) return '';
  return 'MAIL-' + crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16).toUpperCase();
}

function exactMoney(value) {
  const raw = clean(value);
  if (!raw || /[-–—]\s*\$?\s*[\d,]+/.test(raw)) return '';
  const match = raw.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!match) return '';
  const parsed = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : '';
}

function normalizedStatus(value) {
  const status = clean(value);
  const lower = status.toLowerCase();
  if (/funded|closed.?won/.test(lower)) return 'Closed Won';
  if (/declin|closed.?lost|lost|not qualified|withdrawn/.test(lower)) return 'Closed Lost';
  if (/review|underwriting/.test(lower)) return 'Under Review';
  if (/submission started|application started/.test(lower)) return 'Submission Started';
  if (/incomplete|missing|waiting/.test(lower)) return 'Needs Applicant Action';
  return status || 'New';
}

function applicantValues(applicant, context, options) {
  const names = splitName(applicant.name);
  const now = new Date().toISOString();
  const provider = clean(applicant.route_detected) && !/^unknown$/i.test(clean(applicant.route_detected))
    ? clean(applicant.route_detected)
    : 'Email Intake';
  const status = normalizedStatus(applicant.status);
  const notes = [
    clean(applicant.email_subject) ? 'Subject: ' + clean(applicant.email_subject) : '',
    clean(applicant.route_detected) ? 'Route: ' + clean(applicant.route_detected) : '',
    clean(applicant.routing_outcome) ? 'Routing outcome: ' + clean(applicant.routing_outcome) : ''
  ].filter(Boolean).join(' | ');

  const values = {
    C: now,
    D: provider,
    E: 'Forwarded Email',
    F: clean(applicant.external_event_id),
    I: clean(applicant.name),
    J: names.first_name,
    K: names.last_name,
    L: clean(applicant.business_name),
    M: clean(applicant.email).toLowerCase(),
    N: clean(applicant.phone),
    O: clean(applicant.city),
    P: clean(applicant.state),
    U: provider,
    V: exactMoney(applicant.desired_funding_amount),
    W: clean(applicant.status) || status,
    X: clean(applicant.routing_outcome),
    Y: status,
    AM: notes,
    AQ: clean(context && context.hubspot_contact_id),
    AS: clean(context && context.hubspot_deal_id),
    AT: clean(applicant.email).toLowerCase()
  };

  if (/submission started|application started/i.test(clean(applicant.status))) {
    values.AA = clean(applicant.email_date) || now;
  }

  if (options && options.isNew) {
    values.A = stableApplicantRecordId(applicant.email);
    values.B = now;
  }

  Object.keys(values).forEach((key) => {
    if (values[key] === '' || values[key] === null || values[key] === undefined) delete values[key];
  });
  return values;
}

async function getColumnValues(column, sheetName) {
  const config = directConfig();
  const range = quoteSheetName(sheetName) + '!' + column + '2:' + column + DEFAULT_MAX_ROWS;
  const path = 'spreadsheets/' + encodeURIComponent(config.sheet_id) + '/values/' + encodeURIComponent(range);
  const data = await sheetsRequest(path);
  return Array.isArray(data.values) ? data.values : [];
}

async function findApplicantRow(emailAddress) {
  const normalized = clean(emailAddress).toLowerCase();
  if (!normalized) return null;
  const config = directConfig();

  const dedupeValues = await getColumnValues('AT', config.sheet_name);
  for (let i = 0; i < dedupeValues.length; i += 1) {
    if (clean(dedupeValues[i] && dedupeValues[i][0]).toLowerCase() === normalized) return i + 2;
  }

  const emailValues = await getColumnValues('M', config.sheet_name);
  for (let i = 0; i < emailValues.length; i += 1) {
    if (clean(emailValues[i] && emailValues[i][0]).toLowerCase() === normalized) return i + 2;
  }
  return null;
}

async function updateApplicantRow(rowNumber, values) {
  const config = directConfig();
  const data = Object.entries(values).map(([column, value]) => ({
    range: quoteSheetName(config.sheet_name) + '!' + column + rowNumber,
    values: [[value]]
  }));

  if (!data.length) return { updatedCells: 0 };

  return sheetsRequest('spreadsheets/' + encodeURIComponent(config.sheet_id) + '/values:batchUpdate', {
    method: 'POST',
    body: {
      valueInputOption: 'USER_ENTERED',
      data
    }
  });
}

function columnIndex(letter) {
  let value = 0;
  for (const ch of letter) value = value * 26 + (ch.charCodeAt(0) - 64);
  return value - 1;
}

async function appendApplicantRow(values) {
  const config = directConfig();
  const row = new Array(46).fill('');
  Object.entries(values).forEach(([column, value]) => {
    row[columnIndex(column)] = value;
  });
  const range = quoteSheetName(config.sheet_name) + '!A:AT';
  const path = 'spreadsheets/' + encodeURIComponent(config.sheet_id) + '/values/' + encodeURIComponent(range)
    + ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS';
  return sheetsRequest(path, {
    method: 'POST',
    body: { values: [row] }
  });
}

function appendedRowNumber(data) {
  const updatedRange = clean(data && data.updates && data.updates.updatedRange);
  const match = updatedRange.match(/![A-Z]+(\d+):/i) || updatedRange.match(/![A-Z]+(\d+)$/i);
  return match ? Number(match[1]) : null;
}

async function directSyncApplicant(applicant, context) {
  if (!isDirectConfigured()) return { configured: false, status: 'not_configured' };
  const rowNumber = await findApplicantRow(applicant.email);

  if (rowNumber) {
    const values = applicantValues(applicant, context, { isNew: false });
    const response = await updateApplicantRow(rowNumber, values);
    return {
      configured: true,
      mode: 'direct_google_sheets_api',
      status: 'synced',
      action: 'updated',
      row_number: rowNumber,
      record_id: stableApplicantRecordId(applicant.email),
      receiver: {
        action: 'updated',
        row_number: rowNumber,
        updated: true,
        updated_cells: response && response.totalUpdatedCells || null
      }
    };
  }

  const values = applicantValues(applicant, context, { isNew: true });
  const response = await appendApplicantRow(values);
  const createdRow = appendedRowNumber(response);
  return {
    configured: true,
    mode: 'direct_google_sheets_api',
    status: 'synced',
    action: 'created',
    row_number: createdRow,
    record_id: values.A,
    receiver: {
      action: 'created',
      row_number: createdRow,
      created: true,
      updated_cells: response && response.updates && response.updates.updatedCells || null
    }
  };
}

async function syncPartner(partner, context) {
  if (endpoint()) return webhookSync('upsert_partner', { partner, context: context || {} });
  return {
    configured: false,
    status: 'not_configured',
    reason: isDirectConfigured() ? 'direct_google_sheets_mode_is_applicant_only' : 'google_sheets_not_configured'
  };
}

async function syncApplicant(applicant, context) {
  if (isDirectConfigured()) return directSyncApplicant(applicant, context || {});
  if (endpoint()) return webhookSync('upsert_applicant_notification', { applicant, context: context || {} });
  return { configured: false, status: 'not_configured' };
}

module.exports = {
  isConfigured,
  isDirectConfigured,
  serviceAccountJson,
  configurationStatus,
  receiverSummary,
  stableApplicantRecordId,
  exactMoney,
  normalizedStatus,
  applicantValues,
  findApplicantRow,
  syncPartner,
  syncApplicant
};
