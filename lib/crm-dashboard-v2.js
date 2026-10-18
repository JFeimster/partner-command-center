'use strict';

// Standalone, read-only projections for the Master Applicants CRM dashboard.
// No network calls, credentials, applicant logs, or Google Sheets writes.
const MASTER_HEADERS = Object.freeze([
  'record_id','created_at','updated_at','source_provider','source_channel',
  'gmail_message_id','gmail_thread_id','gmail_label','applicant_full_name',
  'first_name','last_name','business_name','email','phone','city','state',
  'website','entity_name','entity_type','industry','funding_product',
  'requested_amount','stage','substage','status','priority',
  'application_started_at','application_submitted_at','bank_connection_status',
  'bank_connection_last_checked_at','documents_status','missing_documents',
  'follow_up_status','follow_up_owner','last_follow_up_at','next_follow_up_at',
  'days_open','days_since_last_follow_up','notes','partner_portal_link',
  'resume_link','document_folder_link','hubspot_contact_id',
  'hubspot_company_id','hubspot_deal_id','dedupe_key'
]);

const DATE_EPOCH = Date.UTC(1899, 11, 30);
const SAFE_ROUTES = Object.freeze([
  'DAC','DAC Applet','BankBreezy','Giggle','Tally Funding Intake',
  'Email Intake','HubSpot','Wix'
]);
const TERMINAL = new Set(['closed lost','closed won','funded']);
const VALID_STATES = new Set([
  'new','submission started','incomplete','submitted','under review',
  'bank connection pending','documents requested','closed lost','closed won',
  'funded','received','missing info','offer received','needs applicant action',
  'needs review'
]);

function clean(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}
function canonicalStatus(value) {
  return clean(value).toLowerCase().replace(/\s+/g, ' ');
}
function isValidCalendarDate(yyyy, mm, dd) {
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  return d.getUTCFullYear() === yyyy && d.getUTCMonth() + 1 === mm && d.getUTCDate() === dd;
}
function isoDate(y, m, d) {
  if (!isValidCalendarDate(y, m, d)) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function sheetDate(value) {
  if (value === '' || value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(DATE_EPOCH + Math.floor(value) * 86400000);
    return date.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string') return null;
  const s = value.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/.exec(s);
  if (m) return isoDate(Number(m[1]), Number(m[2]), Number(m[3]));
  // Workbook locale is en_US. Do not guess the locale of other date strings.
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:$|[\s])/.exec(s);
  return m ? isoDate(Number(m[3]), Number(m[1]), Number(m[2])) : null;
}
function lifecycle(status) {
  const v = canonicalStatus(status);
  return !v ? 'Needs status review' : TERMINAL.has(v) ? 'Terminal' : 'Nonterminal';
}
function safeRoute(value) {
  const v = clean(value);
  if (!v) return '(blank)';
  return SAFE_ROUTES.find(s => s.toLowerCase() === v.toLowerCase()) || 'Other / unclassified';
}
function assertMasterHeaders(headers) {
  if (!Array.isArray(headers) || headers.length !== MASTER_HEADERS.length ||
      headers.some((h, i) => h !== MASTER_HEADERS[i])) {
    const err = new Error('CRM_HEADER_CONTRACT_MISMATCH');
    err.code = 'CRM_HEADER_CONTRACT_MISMATCH';
    throw err;
  }
}
function sourceRows(input) {
  if (input && Array.isArray(input.values)) {
    assertMasterHeaders(input.values[0]);
    return input.values.slice(1).map(row => Object.fromEntries(MASTER_HEADERS.map((h, i) => [h, row[i] ?? ''])));
  }
  if (input && Array.isArray(input.rows)) {
    if (input.headers) assertMasterHeaders(input.headers);
    if (input.rows.some(r => !r || Array.isArray(r) || typeof r !== 'object')) {
      const err = new Error('CRM_INVALID_INPUT');err.code='CRM_INVALID_INPUT';throw err;
    }
    return input.rows;
  }
  const err = new Error('CRM_INVALID_INPUT');err.code='CRM_INVALID_INPUT';throw err;
}
function truthyRow(row) {
  return MASTER_HEADERS.some(h => clean(row[h]) !== '');
}
function isTerminal(status) {
  return TERMINAL.has(canonicalStatus(status));
}
function summarize(input, businessDate) {
  const cutoff = sheetDate(businessDate);
  if (!cutoff || cutoff !== businessDate) {
    const err = new Error('CRM_BUSINESS_DATE_REQUIRED');
    err.code = 'CRM_BUSINESS_DATE_REQUIRED';throw err;
  }
  const rows = sourceRows(input).filter(truthyRow);
  const ids = new Map();
  const out = {
    business_date: cutoff, source_row_count: rows.length,
    lifecycle: { closed_lost: 0, recorded_won_or_funded: 0, nonterminal: 0, status_review: 0 },
    operations: {
      follow_up_past_due_nonterminal_or_unclassified: 0,
      follow_up_due_today_nonterminal_or_unclassified: 0,
      terminal_rows_with_follow_up_dates: 0,
      bank_connection_pending_all: 0,
      documents_missing_all: 0,
      documents_requested_all: 0,
      missing_follow_up_owner_all: 0,
      invalid_created_dates: 0,
      invalid_follow_up_dates: 0
    },
    quality: {
      missing_record_id: 0, duplicate_record_id_groups: 0,
      missing_status: 0, unknown_status: 0, stage_status_disagreements: 0
    },
    // Fixed known route labels only. Never echo free text or applicant fields.
    source_route_counts: Object.fromEntries([...SAFE_ROUTES, '(blank)','Other / unclassified'].map(x=>[x,0]))
  };
  for (const row of rows) {
    const id = clean(row.record_id);
    if (id) ids.set(id, (ids.get(id) || 0) + 1);
    else out.quality.missing_record_id++;
    out.source_route_counts[safeRoute(row.source_provider)]++;
    const status = canonicalStatus(row.status);
    if (!status) {out.lifecycle.status_review++;out.quality.missing_status++;}
    else if (status === 'closed lost') out.lifecycle.closed_lost++;
    else if (status === 'closed won' || status === 'funded') out.lifecycle.recorded_won_or_funded++;
    else {out.lifecycle.nonterminal++;if(!VALID_STATES.has(status))out.quality.unknown_status++;}
    if (status && canonicalStatus(row.stage) &&
        ((status === 'closed lost') !== (canonicalStatus(row.stage) === 'closed lost'))) {
      out.quality.stage_status_disagreements++;
    }
    if (!clean(row.follow_up_owner)) out.operations.missing_follow_up_owner_all++;
    if (canonicalStatus(row.bank_connection_status) === 'pending') out.operations.bank_connection_pending_all++;
    if (canonicalStatus(row.documents_status) === 'missing') out.operations.documents_missing_all++;
    if (canonicalStatus(row.documents_status) === 'requested') out.operations.documents_requested_all++;
    if (clean(row.created_at) && !sheetDate(row.created_at)) out.operations.invalid_created_dates++;
    const followDate = sheetDate(row.next_follow_up_at);
    if (clean(row.next_follow_up_at) && !followDate) out.operations.invalid_follow_up_dates++;
    if (followDate) {
      if (isTerminal(row.status)) out.operations.terminal_rows_with_follow_up_dates++;
      else if (followDate < cutoff) out.operations.follow_up_past_due_nonterminal_or_unclassified++;
      else if (followDate === cutoff) out.operations.follow_up_due_today_nonterminal_or_unclassified++;
    }
  }
  out.quality.duplicate_record_id_groups = [...ids.values()].filter(n => n > 1).length;
  return out;
}
module.exports = {MASTER_HEADERS, SAFE_ROUTES, sheetDate, lifecycle, safeRoute, assertMasterHeaders, sourceRows, summarize};