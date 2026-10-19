'use strict';

// Server-only PostgreSQL adapter. No HTTP route, Sheets write, submission, or send action.
const assert = require('node:assert/strict');
const { SUBMISSION_HEADERS, OUTREACH_HEADERS } = require('./crm-operational-ledgers');

const transitions = {
  submitted: ['submitted', 'under_review', 'offered', 'declined', 'withdrawn'],
  under_review: ['under_review', 'offered', 'declined', 'withdrawn'],
  offered: ['offered', 'funded', 'declined', 'withdrawn'],
  funded: ['funded'], declined: ['declined'], withdrawn: ['withdrawn']
};
const outreachStates = new Set('queued attempted sent delivered failed replied canceled suppressed'.split(' '));
const retryCodes = new Set(['40001', '40P01', '55P03']);
const idPattern = /^[A-Za-z0-9][A-Za-z0-9.:_-]{0,127}$/;
const safeErrorCodes = new Set([
  'INVALID_EVENT', 'INVALID_REFERENCE', 'UNKNOWN_REFERENCE', 'INVALID_TRANSITION',
  'IDENTITY_CONFLICT', 'EVENT_CONFLICT', 'IDEMPOTENCY_CONFLICT', 'EVIDENCE_REQUIRED',
  'SEND_SUPPRESSED', 'REPLY_PAUSED', 'RETRY_EXHAUSTED'
]);

function error(code) {
  const e = new Error('CRM_EVENT_' + code);
  e.code = code;
  return e;
}
function fail(code) { throw error(code); }
const clean = value => value == null ? '' : String(value).trim();
function identifier(value) { const v = clean(value); if (!idPattern.test(v)) fail('INVALID_EVENT'); return v; }
function timestamp(value) {
  const v = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(v) || !Number.isFinite(Date.parse(v))) fail('INVALID_EVENT');
  return v;
}
function amount(value) {
  const v = clean(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(v) || Number(v) <= 0 || !Number.isFinite(Number(v))) fail('INVALID_EVENT');
}
function normalize(kind, input) {
  const headers = kind === 'submission' ? SUBMISSION_HEADERS : kind === 'communication' ? OUTREACH_HEADERS : null;
  if (!headers || !input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !headers.includes(k))) fail('INVALID_EVENT');
  const row = Object.fromEntries(headers.map(h => [h, clean(input[h])]));
  for (const h of ['event_id', 'idempotency_key', 'record_id']) identifier(row[h]);
  identifier(row.source_system);
  if (kind === 'submission') {
    for (const h of ['submission_id', 'provider_id', 'product_id', 'notion_provider_page_id', 'notion_product_page_id']) identifier(row[h]);
    for (const h of ['source_event_id', 'external_submission_id', 'offer_id', 'internal_reference']) if (row[h]) identifier(row[h]);
    if (row.currency && !/^[A-Z]{3}$/.test(row.currency)) fail('INVALID_EVENT');
    timestamp(row.occurred_at);
    if (!transitions[row.status] || ![row.status, 'status_changed'].includes(row.event_type)) fail('INVALID_EVENT');
    if (row.status === 'submitted') identifier(row.external_submission_id);
    if (row.status === 'offered') {
      amount(row.offer_amount);
      identifier(row.offer_id);
      identifier(row.source_event_id);
    }
    if (row.status === 'funded') { amount(row.funded_amount); identifier(row.source_event_id); }
  } else {
    for (const h of ['template_id', 'workflow_id', 'external_message_id', 'source_event_id', 'consent_basis', 'suppression_reason']) if (row[h]) identifier(row[h]);
    if (!outreachStates.has(row.status) || !['email', 'sms', 'phone', 'other'].includes(row.channel) || !['inbound', 'outbound'].includes(row.direction)) fail('INVALID_EVENT');
    if (row.occurred_at) timestamp(row.occurred_at);
    if (row.scheduled_at) timestamp(row.scheduled_at);
    if (['sent', 'delivered', 'replied'].includes(row.status) && (!row.external_message_id || !row.occurred_at)) fail('EVIDENCE_REQUIRED');
    if (row.status === 'replied' && row.direction !== 'inbound') fail('INVALID_EVENT');
    if (row.status === 'suppressed' && !row.suppression_reason) fail('INVALID_EVENT');
    if (row.direction === 'outbound' && ['queued', 'attempted', 'sent', 'delivered'].includes(row.status) && !row.consent_basis) fail('SEND_SUPPRESSED');
    if (row.attempt_number && (!/^\d+$/.test(row.attempt_number) || Number(row.attempt_number) < 1)) fail('INVALID_EVENT');
  }
  return row;
}
function storedPayload(row) {
  const { event_id, idempotency_key, ingested_at, ...payload } = row;
  return payload;
}
function aggregate(kind, row) { return kind === 'submission' ? row.submission_id : row.record_id; }
function eventRow(kind, row, stored) {
  return { ...stored.payload, event_id: stored.event_id, idempotency_key: stored.idempotency_key, ingested_at: new Date(stored.ingested_at).toISOString() };
}

async function transaction(pool, callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) { /* preserve original failure */ }
    throw e;
  } finally { client.release(); }
}

async function verifyReferences(client, kind, row) {
  const cases = await client.query('SELECT 1 FROM crm_event_engine.case_refs WHERE record_id = $1 AND active', [row.record_id]);
  if (!cases.rowCount) fail('UNKNOWN_REFERENCE');
  if (kind === 'submission') {
    const refs = await client.query(`SELECT 1 FROM crm_event_engine.product_refs p
      JOIN crm_event_engine.provider_refs v ON v.provider_id = p.provider_id
      WHERE p.provider_id = $1 AND p.product_id = $2 AND p.notion_page_id = $3
        AND v.notion_page_id = $4 AND p.active AND v.active`, [
      row.provider_id, row.product_id, row.notion_product_page_id, row.notion_provider_page_id
    ]);
    if (!refs.rowCount) fail('UNKNOWN_REFERENCE');
  }
}
async function verifyEvidence(client, row) {
  if (!['offered', 'funded'].includes(row.status)) return;
  const kind = row.status === 'offered' ? 'offer' : 'funding';
  const evidence = await client.query(`SELECT 1 FROM crm_event_engine.verified_evidence
    WHERE evidence_id = $1 AND record_id = $2 AND provider_id = $3
      AND product_id = $4 AND evidence_kind = $5`, [
    row.source_event_id, row.record_id, row.provider_id, row.product_id, kind
  ]);
  if (!evidence.rowCount) fail('EVIDENCE_REQUIRED');
}
async function verifyTransition(client, kind, row) {
  if (kind === 'submission') {
    const prior = await client.query(`SELECT record_id, provider_id, product_id, occurred_at, payload->>'status' AS status
      FROM crm_event_engine.events WHERE event_kind = 'submission' AND aggregate_id = $1
      ORDER BY sequence DESC LIMIT 1`, [row.submission_id]);
    if (!prior.rowCount && row.status !== 'submitted') fail('INVALID_TRANSITION');
    if (prior.rowCount) {
      const p = prior.rows[0];
      if (p.record_id !== row.record_id || p.provider_id !== row.provider_id || p.product_id !== row.product_id) fail('IDENTITY_CONFLICT');
      if (!transitions[p.status]?.includes(row.status)) fail('INVALID_TRANSITION');
      if (Date.parse(row.occurred_at) < new Date(p.occurred_at).getTime()) fail('INVALID_TRANSITION');
    }
    await verifyEvidence(client, row);
  } else if (row.direction === 'outbound' && ['queued', 'attempted', 'sent', 'delivered'].includes(row.status)) {
    const state = await client.query(`SELECT suppressed, reply_paused FROM crm_event_engine.applicant_communication_state
      WHERE record_id = $1 AND workflow_id = $2`, [row.record_id, row.workflow_id]);
    if (state.rows[0]?.suppressed) fail('SEND_SUPPRESSED');
    if (state.rows[0]?.reply_paused) fail('REPLY_PAUSED');
  }
}

async function appendOnce(pool, kind, row) {
  return transaction(pool, async client => {
    // Serializes decisions for one stream; unique indexes also arbitrate cross-stream key races.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [kind + ':' + aggregate(kind, row)]);
    const payload = storedPayload(row);
    const prior = await client.query(`SELECT event_id, idempotency_key, event_kind, record_id,
      aggregate_id, payload = $3::jsonb AS same_payload
      FROM crm_event_engine.events WHERE event_id = $1 OR idempotency_key = $2`, [
      row.event_id, row.idempotency_key, JSON.stringify(payload)
    ]);
    if (prior.rowCount) {
      if (prior.rowCount !== 1) fail('EVENT_CONFLICT');
      const p = prior.rows[0];
      if (p.event_id === row.event_id && p.idempotency_key !== row.idempotency_key) fail('EVENT_CONFLICT');
      if (!p.same_payload || p.event_kind !== kind || p.record_id !== row.record_id || p.aggregate_id !== aggregate(kind, row)) fail('IDEMPOTENCY_CONFLICT');
      return { status: 'replayed', event_id: p.event_id };
    }
    await verifyReferences(client, kind, row);
    await verifyTransition(client, kind, row);
    const insert = await client.query(`INSERT INTO crm_event_engine.events
      (event_id, idempotency_key, event_kind, record_id, aggregate_id,
       provider_id, product_id, payload, occurred_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) ON CONFLICT DO NOTHING RETURNING event_id`, [
      row.event_id, row.idempotency_key, kind, row.record_id, aggregate(kind, row),
      kind === 'submission' ? row.provider_id : null,
      kind === 'submission' ? row.product_id : null,
      JSON.stringify(payload), row.occurred_at || null
    ]);
    if (!insert.rowCount) {
      // Another stream won the unique key race. Retry the transaction to inspect its committed row.
      const e = error('RETRY_EXHAUSTED'); e.code = '40001'; throw e;
    }
    return { status: 'recorded', event_id: row.event_id };
  });
}

async function recordError(pool, kind, row, code, retryable) {
  if (!safeErrorCodes.has(code) || !idPattern.test(clean(row?.event_id))) return;
  await pool.query(`INSERT INTO crm_event_engine.integration_errors
    (event_id, event_kind, error_code, retryable, state, next_retry_at)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (event_id, error_code) DO UPDATE SET
      attempts = crm_event_engine.integration_errors.attempts + 1,
      updated_at = now()`, [
    row.event_id, kind, code, retryable, retryable ? 'pending' : 'dead',
    retryable ? new Date(Date.now() + 60000) : null
  ]);
}
async function ingest(pool, kind, input, options = {}) {
  if (options.enabled !== true) fail('DISABLED');
  const row = normalize(kind, input);
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await appendOnce(pool, kind, row); }
    catch (e) {
      if (retryCodes.has(e.code) && attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 25));
        continue;
      }
      const code = retryCodes.has(e.code) ? 'RETRY_EXHAUSTED' : e.code;
      if (safeErrorCodes.has(code)) {
        try { await recordError(pool, kind, row, code, code === 'RETRY_EXHAUSTED'); } catch (_) { /* original error remains authoritative */ }
      }
      throw e;
    }
  }
}
function createPool(connectionString = process.env.CRM_EVENT_DATABASE_URL) {
  if (!connectionString) fail('DATABASE_NOT_CONFIGURED');
  const { Pool } = require('pg');
  return new Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000 });
}
async function ingestConfigured(pool, kind, input) {
  return ingest(pool, kind, input, { enabled: process.env.CRM_EVENT_INGEST_ENABLED === 'true' });
}
async function currentSubmissions(pool, recordId) {
  identifier(recordId);
  const result = await pool.query('SELECT * FROM crm_event_engine.current_submissions WHERE record_id = $1 ORDER BY submission_id', [recordId]);
  return result.rows;
}
async function communicationState(pool, recordId) {
  identifier(recordId);
  const result = await pool.query('SELECT * FROM crm_event_engine.applicant_communication_state WHERE record_id = $1 ORDER BY workflow_id', [recordId]);
  return result.rows;
}
async function reportingRows(pool, kind, recordId) {
  identifier(recordId);
  const headers = kind === 'submission' ? SUBMISSION_HEADERS : kind === 'communication' ? OUTREACH_HEADERS : null;
  if (!headers) fail('INVALID_EVENT');
  const result = await pool.query(`SELECT event_id, idempotency_key, payload, ingested_at
    FROM crm_event_engine.events WHERE event_kind = $1 AND record_id = $2 ORDER BY sequence`, [kind, recordId]);
  return result.rows.map(stored => {
    const row = eventRow(kind, null, stored);
    assert(Object.keys(row).every(k => headers.includes(k)));
    return headers.map(h => row[h] || '');
  });
}
async function reportingPage(pool, kind, { recordId = null, after = '0', limit = 500 } = {}) {
  const headers = kind === 'submission' ? SUBMISSION_HEADERS : kind === 'communication' ? OUTREACH_HEADERS : null;
  if (!headers || (recordId !== null && !idPattern.test(recordId)) ||
      !/^\d{1,19}$/.test(String(after)) || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) fail('INVALID_EVENT');
  const result = await pool.query(`SELECT sequence, event_id, idempotency_key, payload, ingested_at
    FROM crm_event_engine.events
    WHERE event_kind = $1 AND sequence > $2 AND ($3::text IS NULL OR record_id = $3)
    ORDER BY sequence LIMIT $4`, [kind, after, recordId, limit]);
  return {
    headers: [...headers],
    rows: result.rows.map(stored => {
      const row = eventRow(kind, null, stored);
      return headers.map(h => row[h] || '');
    }),
    next_after: result.rows.length ? String(result.rows[result.rows.length - 1].sequence) : null
  };
}

module.exports = { normalize, createPool, ingest, ingestConfigured, currentSubmissions, communicationState, reportingRows, reportingPage };
