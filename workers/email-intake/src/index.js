import PostalMime from 'postal-mime';

const RECEIPT_PREFIX = 'receipts/';
const STATUS_PREFIX = 'receipt-status/';

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value) {
  return toHex(await crypto.subtle.digest('SHA-256', value));
}

function normalizedMessageId(value) {
  return String(value || '').trim().replace(/^<|>$/g, '').toLowerCase();
}

async function receiptIdentity(raw, messageId) {
  const fingerprint = await sha256(raw);
  const normalizedId = normalizedMessageId(messageId);
  const sourceIdentity = normalizedId ? 'message-id:' + normalizedId : 'sha256:' + fingerprint;
  return {
    receipt_id: (await sha256(new TextEncoder().encode(sourceIdentity))).slice(0, 32),
    message_fingerprint: fingerprint,
    message_id: normalizedId ? '<' + normalizedId + '>' : String(messageId || '').trim()
  };
}

function safeDestinationSummary(body) {
  const data = body && body.data ? body.data : body || {};
  const persistence = data.persistence || {};
  return Object.fromEntries(['hubspot_contact', 'hubspot_deal', 'notion', 'google_sheets'].map((name) => {
    const item = persistence[name] || {};
    return [name, {
      status: item.status || 'missing',
      code: item.code || null,
      http_status: item.http_status || null
    }];
  }));
}

function retryableSystemFailures(body) {
  const data = body && body.data ? body.data : body || {};
  const persistence = data.persistence || {};
  return Object.entries(persistence).filter(([, item]) => {
    if (!item || item.status !== 'failed') return false;
    const status = Number(item.http_status);
    return !status || status === 408 || status === 425 || status === 429 || status >= 500;
  }).map(([name]) => name);
}

function headerValue(headers, name) {
  const target = String(name || '').toLowerCase();
  const item = (headers || []).find((header) => String(header.key || '').toLowerCase() === target);
  return item ? item.value : '';
}

function rawMessageId(raw) {
  const bytes = new Uint8Array(raw).slice(0, 65536);
  const headerText = new TextDecoder().decode(bytes).split(/\r?\n\r?\n/, 1)[0].replace(/\r?\n[ \t]+/g, ' ');
  const match = headerText.match(/^message-id:\s*(.+)$/im);
  return match ? match[1].trim() : '';
}

function apiConfig(env) {
  const base = String(env.INTAKE_API_BASE_URL || '').replace(/\/$/, '');
  if (!base || !env.PARTNER_COMMAND_API_KEY) {
    throw new Error('INTAKE_API_BASE_URL and PARTNER_COMMAND_API_KEY are required.');
  }
  return { base, key: env.PARTNER_COMMAND_API_KEY };
}

async function postAuthorized(env, path, payload) {
  const config = apiConfig(env);
  const response = await fetch(config.base + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + config.key
    },
    body: JSON.stringify(payload || {})
  });

  const body = await response.text();
  if (!response.ok) {
    const error = new Error('Partner Command API returned HTTP ' + response.status);
    error.http_status = response.status;
    throw error;
  }
  try { return body ? JSON.parse(body) : {}; }
  catch (_) { return {}; }
}

async function writeReceiptStatus(env, receipt, status) {
  await env.EMAIL_RECEIPTS.put(STATUS_PREFIX + receipt.receipt_id + '.json', JSON.stringify({
    receipt_id: receipt.receipt_id,
    message_fingerprint: receipt.message_fingerprint,
    attempt: receipt.attempt,
    received_at: receipt.received_at,
    updated_at: new Date().toISOString(),
    ...status
  }), { httpMetadata: { contentType: 'application/json' } });
}

async function recoverCapturedReceipts(env) {
  if (!env.EMAIL_RECEIPTS || !env.EMAIL_INTAKE_QUEUE) return { scanned: 0, requeued: 0 };
  const cursorKey = 'metadata/recovery-cursor.json';
  let cursor = null;
  const savedCursor = await env.EMAIL_RECEIPTS.get(cursorKey);
  if (savedCursor) {
    try { cursor = JSON.parse(await savedCursor.text()).cursor || null; }
    catch (_) { cursor = null; }
  }

  const page = await env.EMAIL_RECEIPTS.list({ prefix: STATUS_PREFIX, limit: 1000, ...(cursor ? { cursor } : {}) });
  const receipts = [];
  for (const object of page.objects || []) {
    const stored = await env.EMAIL_RECEIPTS.get(object.key);
    if (!stored) continue;
    let status;
    try { status = JSON.parse(await stored.text()); }
    catch (_) { continue; }
    if (status.outcome === 'captured' && status.object_key && status.receipt_id) {
      receipts.push({
        receipt_id: status.receipt_id,
        message_fingerprint: status.message_fingerprint,
        object_key: status.object_key,
        received_at: status.received_at
      });
    }
  }

  for (let i = 0; i < receipts.length; i += 100) {
    await env.EMAIL_INTAKE_QUEUE.sendBatch(receipts.slice(i, i + 100).map((body) => ({ body })));
  }
  if (page.truncated && page.cursor) {
    await env.EMAIL_RECEIPTS.put(cursorKey, JSON.stringify({ cursor: page.cursor, updated_at: new Date().toISOString() }), {
      httpMetadata: { contentType: 'application/json' }
    });
  } else {
    await env.EMAIL_RECEIPTS.delete(cursorKey);
  }
  return { scanned: (page.objects || []).length, requeued: receipts.length };
}

async function processReceipt(queueMessage, env) {
  const receipt = queueMessage.body || {};
  if (receipt.job === 'reconcile_applicants') {
    const response = await postAuthorized(env, '/api/reconcile-applicants?limit=500', {});
    const data = response && response.data ? response.data : response;
    await writeReceiptStatus(env, { ...receipt, attempt: queueMessage.attempts }, {
      outcome: 'reconciliation_processed',
      http_status: 200,
      summary: data && data.summary ? {
        scanned: data.summary.scanned || 0,
        reconciled: data.summary.reconciled || 0,
        reconciled_with_errors: data.summary.reconciled_with_errors || 0,
        skipped: data.summary.skipped || 0,
        failure_counts_by_system: data.summary.failure_counts_by_system || {},
        failure_counts_by_cause: data.summary.failure_counts_by_cause || {}
      } : null
    });
    queueMessage.ack();
    console.log('[email-intake-reconciliation]', JSON.stringify({
      receipt_id: receipt.receipt_id,
      attempt: queueMessage.attempts,
      outcome: 'reconciliation_processed',
      summary: data && data.summary ? {
        scanned: data.summary.scanned || 0,
        reconciled: data.summary.reconciled || 0,
        reconciled_with_errors: data.summary.reconciled_with_errors || 0,
        skipped: data.summary.skipped || 0,
        failure_counts_by_system: data.summary.failure_counts_by_system || {},
        failure_counts_by_cause: data.summary.failure_counts_by_cause || {}
      } : null
    }));
    return;
  }
  if (!receipt.receipt_id || !receipt.object_key || !env.EMAIL_RECEIPTS) {
    throw new Error('Receipt queue message is missing its durable storage reference.');
  }

  await writeReceiptStatus(env, { ...receipt, attempt: queueMessage.attempts }, { outcome: 'processing' });

  const stored = await env.EMAIL_RECEIPTS.get(receipt.object_key);
  if (!stored) throw new Error('Durable email receipt object is unavailable.');
  const raw = await stored.arrayBuffer();
  const parsed = await PostalMime.parse(raw);
  const from = parsed.from?.address || receipt.envelope_from || '';
  const subject = parsed.subject || '';

  let response;
  let outcome;
  if (String(from).toLowerCase() === 'jasonfeimster@gmail.com' && /^system:\s*reconcile applicants$/i.test(String(subject).trim())) {
    response = await postAuthorized(env, '/api/reconcile-applicants?limit=500', {});
    outcome = 'reconciliation_requested';
  } else if (String(from).toLowerCase() === 'jasonfeimster@gmail.com' && /^system:\s*cleanup failed nikita backfill$/i.test(String(subject).trim())) {
    response = await postAuthorized(env, '/api/cleanup-backfill-artifacts', { cleanup_id: 'nikita-backfill-20261011' });
    outcome = 'cleanup_requested';
  } else {
    const payload = {
      source: 'cloudflare_email_worker',
      receipt_id: receipt.receipt_id,
      message_fingerprint: receipt.message_fingerprint,
      from,
      to: receipt.envelope_to || parsed.to?.map((entry) => entry.address).join(', ') || '',
      subject,
      text: parsed.text || '',
      html: parsed.html || '',
      message_id: parsed.messageId || headerValue(parsed.headers, 'message-id') || receipt.message_id || '',
      date: parsed.date || headerValue(parsed.headers, 'date') || '',
      reply_to: parsed.replyTo?.map((entry) => entry.address).join(', ') || '',
      in_reply_to: headerValue(parsed.headers, 'in-reply-to') || '',
      references: headerValue(parsed.headers, 'references') || '',
      attachments: (parsed.attachments || []).map((item) => ({
        filename: item.filename || '',
        mime_type: item.mimeType || '',
        disposition: item.disposition || '',
        content_id: item.contentId || '',
        size: item.content ? item.content.byteLength || item.content.length || null : null
      }))
    };
    response = await postAuthorized(env, '/api/intake-message', payload);
    const data = response && response.data ? response.data : response;
    const retryable = retryableSystemFailures(response);
    if (retryable.length) {
      const error = new Error('Retryable destination failures: ' + retryable.join(','));
      error.destinations = safeDestinationSummary(response);
      throw error;
    }
    const hasGaps = data && Array.isArray(data.unavailable_systems) && data.unavailable_systems.length;
    const hasPermanentFailures = data && Array.isArray(data.failed_systems) && data.failed_systems.length;
    outcome = data && data.result === 'review_required'
      ? 'review_required'
      : ((hasPermanentFailures || hasGaps || (data && data.result === 'accepted_with_gaps')) ? 'partial_permanent_failure' : 'processed');
    if (hasPermanentFailures || hasGaps || (data && data.result === 'accepted_with_gaps')) {
      await writeReceiptStatus(env, { ...receipt, attempt: queueMessage.attempts }, {
        outcome,
        http_status: 201,
        failed_systems: data.failed_systems || [],
        unavailable_systems: data.unavailable_systems || [],
        destinations: safeDestinationSummary(response)
      });
      queueMessage.ack();
      console.log('[email-intake-receipt]', JSON.stringify({ receipt_id: receipt.receipt_id, attempt: queueMessage.attempts, outcome, destinations: safeDestinationSummary(response) }));
      return;
    }
  }

  const data = response && response.data ? response.data : response;
  await writeReceiptStatus(env, { ...receipt, attempt: queueMessage.attempts }, {
    outcome,
    http_status: 200,
    destinations: safeDestinationSummary(response),
    result: data && data.result || null
  });
  queueMessage.ack();
  console.log('[email-intake-receipt]', JSON.stringify({ receipt_id: receipt.receipt_id, attempt: queueMessage.attempts, outcome, destinations: safeDestinationSummary(response) }));
}

export default {
  async email(message, env) {
    if (!env.EMAIL_RECEIPTS || !env.EMAIL_INTAKE_QUEUE) {
      throw new Error('Durable email receipt storage and intake queue bindings are required.');
    }
    const raw = await new Response(message.raw).arrayBuffer();
    const messageId = rawMessageId(raw);
    const identity = await receiptIdentity(raw, messageId);
    const objectKey = RECEIPT_PREFIX + identity.message_fingerprint + '.eml';
    const receivedAt = new Date().toISOString();

    // R2 capture must succeed before the queue pointer is sent and SMTP is acknowledged.
    await env.EMAIL_RECEIPTS.put(objectKey, raw, {
      httpMetadata: { contentType: 'message/rfc822' },
      customMetadata: { receipt_id: identity.receipt_id, message_fingerprint: identity.message_fingerprint }
    });
    await env.EMAIL_RECEIPTS.put(STATUS_PREFIX + identity.receipt_id + '.json', JSON.stringify({
      receipt_id: identity.receipt_id,
      message_fingerprint: identity.message_fingerprint,
      object_key: objectKey,
      outcome: 'captured',
      attempt: 0,
      received_at: receivedAt,
      updated_at: receivedAt
    }), { httpMetadata: { contentType: 'application/json' } });
    // Queue send is the SMTP acknowledgment boundary. Do not write status after
    // sending: a fast consumer may already have stored a terminal outcome.
    await env.EMAIL_INTAKE_QUEUE.send({
      ...identity,
      object_key: objectKey,
      envelope_from: message.from || '',
      envelope_to: message.to || '',
      received_at: receivedAt
    });
    console.log('[email-intake-receipt]', JSON.stringify({ receipt_id: identity.receipt_id, outcome: 'durably_received', attempt: 0 }));
  },

  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        await processReceipt(message, env);
      } catch (error) {
        const receipt = message.body || {};
        const delaySeconds = Math.min(900, 15 * (2 ** Math.min(Math.max((message.attempts || 1) - 1, 0), 6)));
        if (receipt.receipt_id && env.EMAIL_RECEIPTS) {
          try {
            await writeReceiptStatus(env, { ...receipt, attempt: message.attempts }, {
              outcome: 'retry_scheduled',
              retry_delay_seconds: delaySeconds,
              failed_destinations: error && error.destinations || null,
              error_code: error && error.http_status ? 'api_http_' + error.http_status : 'processing_error'
            });
          } catch (_) { /* Queue retries remain the source of recovery when status logging is unavailable. */ }
        }
        console.error('[email-intake-receipt]', JSON.stringify({
          receipt_id: receipt.receipt_id || null,
          attempt: message.attempts || 1,
          outcome: 'retry_scheduled',
          retry_delay_seconds: delaySeconds,
          error_code: error && error.http_status ? 'api_http_' + error.http_status : 'processing_error'
        }));
        message.retry({ delaySeconds });
      }
    }
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const recovery = await recoverCapturedReceipts(env);
        console.log('[email-intake-recovery]', JSON.stringify(recovery));
      } catch (error) {
        console.error('[email-intake-recovery]', JSON.stringify({ outcome: 'failed', error_code: 'receipt_recovery_error' }));
      }
      if (controller.cron === '15 */6 * * *') {
        await env.EMAIL_INTAKE_QUEUE.send({
          job: 'reconcile_applicants',
          receipt_id: 'scheduled-reconcile-' + String(controller.scheduledTime || Date.now()),
          received_at: new Date().toISOString()
        });
      }
    })());
  }
};

export { receiptIdentity, recoverCapturedReceipts, retryableSystemFailures, safeDestinationSummary };
