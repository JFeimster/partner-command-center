import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import worker, { receiptIdentity } from '../workers/email-intake/src/index.js';

const mime = [
  'From: lender@example.com',
  'To: intake@myfunding.site',
  'Message-ID: <Request-1@example.com>',
  'Date: Sun, 11 Oct 2026 08:00:00 +0000',
  'Subject: Application Incomplete - BankBreezy',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'Applicant: Jane Smith\nEmail: jane@example.com'
].join('\r\n');

function memoryBucket() {
  const values = new Map();
  return {
    values,
    async put(key, value) { values.set(key, value); },
    async get(key) {
      if (!values.has(key)) return null;
      const value = values.get(key);
      return { async arrayBuffer() {
        if (typeof value === 'string') return new TextEncoder().encode(value).buffer;
        return value.slice(0);
      }, async text() {
        return typeof value === 'string' ? value : new TextDecoder().decode(value);
      } };
    },
    async list({ prefix = '' } = {}) {
      return { objects: Array.from(values.keys()).filter((key) => key.startsWith(prefix)).map((key) => ({ key })), truncated: false };
    },
    async delete(key) { values.delete(key); }
  };
}

test('email receipt is durably stored and queued before SMTP handler returns', async () => {
  const bucket = memoryBucket();
  const sent = [];
  const env = {
    EMAIL_RECEIPTS: bucket,
    EMAIL_INTAKE_QUEUE: { async send(value) { sent.push(value); } }
  };

  await worker.email({ from: 'lender@example.com', to: 'intake@myfunding.site', raw: mime }, env);

  assert.equal(sent.length, 1);
  assert.equal(bucket.values.has(sent[0].object_key), true);
  assert.equal(bucket.values.has('receipt-status/' + sent[0].receipt_id + '.json'), true);
  assert.match(sent[0].object_key, /^receipts\/[a-f0-9]{64}\.eml$/);
  assert.equal(sent[0].message_id, '<request-1@example.com>');
});

test('failed durable receipt write prevents queue submission and SMTP acknowledgment', async () => {
  let queueCalled = false;
  await assert.rejects(worker.email({ from: 'a@example.com', to: 'intake@myfunding.site', raw: mime }, {
    EMAIL_RECEIPTS: { async put() { throw new Error('storage unavailable'); } },
    EMAIL_INTAKE_QUEUE: { async send() { queueCalled = true; } }
  }), /storage unavailable/);
  assert.equal(queueCalled, false);
});

test('scheduled recovery requeues captured receipts left behind by a queue outage', async () => {
  const bucket = memoryBucket();
  const sent = [];
  const receipt = { receipt_id: 'r1', message_fingerprint: 'f1', object_key: 'receipts/f1.eml', received_at: '2026-10-11T08:00:00Z' };
  await bucket.put('receipt-status/r1.json', JSON.stringify({ ...receipt, outcome: 'captured' }));
  await bucket.put('receipt-status/r2.json', JSON.stringify({ receipt_id: 'r2', outcome: 'processed' }));
  const result = await (await import('../workers/email-intake/src/index.js')).recoverCapturedReceipts({
    EMAIL_RECEIPTS: bucket,
    EMAIL_INTAKE_QUEUE: { async sendBatch(messages) { sent.push(...messages); } }
  });
  assert.deepEqual(result, { scanned: 2, requeued: 1 });
  assert.deepEqual(sent, [{ body: receipt }]);
});

test('scheduled reconciliation runs through the serialized intake queue', async () => {
  const bucket = memoryBucket();
  const sent = [];
  const pending = [];
  const env = {
    EMAIL_RECEIPTS: bucket,
    EMAIL_INTAKE_QUEUE: {
      async send(value) { sent.push(value); },
      async sendBatch(values) { sent.push(...values.map((value) => value.body)); }
    }
  };
  worker.scheduled({ cron: '15 */6 * * *', scheduledTime: 1791706535000 }, env, {
    waitUntil(promise) { pending.push(promise); }
  });
  await Promise.all(pending);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].job, 'reconcile_applicants');
  assert.match(sent[0].receipt_id, /^scheduled-reconcile-/);
});

test('queued reconciliation stores destination diagnostics without applicant records', async () => {
  const bucket = memoryBucket();
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ data: {
    summary: {
      scanned: 27,
      reconciled: 4,
      reconciled_with_errors: 23,
      skipped: 0,
      failure_counts_by_system: { google_sheets: 23 },
      failure_counts_by_cause: { 'google_sheets:503': 23 }
    },
    results: [{ email: 'must-not-be-logged@example.com' }]
  } }), { status: 200 });
  let acknowledged = false;
  try {
    await worker.queue({ messages: [{
      body: { job: 'reconcile_applicants', receipt_id: 'scheduled-reconcile-test' },
      attempts: 1,
      ack() { acknowledged = true; },
      retry() { throw new Error('unexpected retry'); }
    }] }, {
      EMAIL_RECEIPTS: bucket,
      INTAKE_API_BASE_URL: 'https://example.test',
      PARTNER_COMMAND_API_KEY: 'key'
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
  assert.equal(acknowledged, true);
  const status = JSON.parse(bucket.values.get('receipt-status/scheduled-reconcile-test.json'));
  assert.equal(status.summary.scanned, 27);
  assert.equal(status.summary.reconciled_with_errors, 23);
  assert.deepEqual(status.summary.failure_counts_by_cause, { 'google_sheets:503': 23 });
  assert.equal(JSON.stringify(status).includes('must-not-be-logged'), false);
});

test('temporary destination failure retries from the durable receipt and preserves idempotency', async () => {
  const bucket = memoryBucket();
  const sent = [];
  const receipt = {
    ...(await receiptIdentity(new TextEncoder().encode(mime).buffer, '<Request-1@example.com>')),
    object_key: 'receipts/test.eml',
    received_at: '2026-10-11T08:00:00.000Z'
  };
  await bucket.put(receipt.object_key, new TextEncoder().encode(mime).buffer);
  const apiRequests = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    apiRequests.push(JSON.parse(options.body));
    const failed = apiRequests.length === 1;
    return new Response(JSON.stringify({ data: {
      result: failed ? 'accepted_with_errors' : 'accepted',
      failed_systems: failed ? ['google_sheets'] : [],
      persistence: {
        hubspot_contact: { status: 'updated' },
        hubspot_deal: { status: 'updated' },
        notion: { status: 'updated' },
        google_sheets: failed ? { status: 'failed', http_status: 503 } : { status: 'synced' }
      }
    } }), { status: 201 });
  };
  const env = { EMAIL_RECEIPTS: bucket, INTAKE_API_BASE_URL: 'https://example.test', PARTNER_COMMAND_API_KEY: 'key' };

  await worker.queue({ messages: [{ body: receipt, attempts: 1, ack() { throw new Error('must retry'); }, retry(options) { sent.push(options); } }] }, env);
  assert.deepEqual(sent, [{ delaySeconds: 15 }]);
  assert.equal(apiRequests.length, 1);

  let acknowledged = false;
  await worker.queue({ messages: [{ body: receipt, attempts: 2, ack() { acknowledged = true; }, retry() { throw new Error('must ack'); } }] }, env);
  assert.equal(acknowledged, true);
  assert.equal(apiRequests.length, 2);
  assert.equal(apiRequests[0].receipt_id, apiRequests[1].receipt_id);
  assert.equal(apiRequests[0].message_fingerprint, apiRequests[1].message_fingerprint);
  const status = JSON.parse(bucket.values.get('receipt-status/' + receipt.receipt_id + '.json'));
  assert.equal(status.outcome, 'processed');
  assert.equal(status.attempt, 2);
  globalThis.fetch = previousFetch;
});

test('same-applicant queue deliveries are serialized and use bounded queue concurrency', async () => {
  const bucket = memoryBucket();
  const previousFetch = globalThis.fetch;
  let active = 0;
  let maxActive = 0;
  let acknowledged = 0;
  globalThis.fetch = async () => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return new Response(JSON.stringify({ data: {
      result: 'accepted',
      failed_systems: [],
      persistence: {
        hubspot_contact: { status: 'updated' },
        hubspot_deal: { status: 'updated' },
        notion: { status: 'updated' },
        google_sheets: { status: 'synced' }
      }
    } }), { status: 201 });
  };
  const receipt = {
    receipt_id: 'same-applicant-receipt',
    message_fingerprint: 'same-fingerprint',
    object_key: 'receipts/same.eml',
    received_at: '2026-10-11T08:00:00.000Z'
  };
  await bucket.put(receipt.object_key, new TextEncoder().encode(mime).buffer);
  try {
    await worker.queue({ messages: [1, 2].map((attempt) => ({
      body: receipt,
      attempts: attempt,
      ack() { acknowledged += 1; },
      retry() { throw new Error('unexpected retry'); }
    })) }, {
      EMAIL_RECEIPTS: bucket,
      INTAKE_API_BASE_URL: 'https://example.test',
      PARTNER_COMMAND_API_KEY: 'key'
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
  const wranglerConfig = fs.readFileSync(path.join(process.cwd(), 'workers/email-intake/wrangler.jsonc'), 'utf8');
  assert.match(wranglerConfig, /"max_concurrency":\s*1/);
  assert.equal(maxActive, 1);
  assert.equal(acknowledged, 2);
});

test('message ID and MIME fingerprint give repeat deliveries a stable receipt identity', async () => {
  const first = await receiptIdentity(new TextEncoder().encode(mime).buffer, '<Request-1@example.com>');
  const repeated = await receiptIdentity(new TextEncoder().encode(mime).buffer, '<request-1@EXAMPLE.com>');
  assert.equal(first.receipt_id, repeated.receipt_id);
  assert.equal(first.message_fingerprint, repeated.message_fingerprint);
});
