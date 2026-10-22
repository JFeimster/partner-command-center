'use strict';

const { getHeader, constantTimeEqual } = require('../lib/action-auth');
const { runWixSync } = require('../lib/wix-contact-sync-worker');

module.exports = async function wixSyncHandler(req, res) {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, code: 'method_not_allowed' }));
  }
  const cronSecret = process.env.CRON_SECRET || '';
  // A missing secret must not create an unauthenticated route.
  if (!cronSecret || !process.env.WIX_API_KEY ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false, code: 'integration_not_configured' }));
  }
  const provided = getHeader(req, 'authorization').replace(/^Bearer\s+/i, '');
  if (!provided || !constantTimeEqual(cronSecret, provided)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ ok: false, code: 'unauthorized' }));
  }
  try {
    const summary = await runWixSync();
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true, summary }));
  } catch (error) {
    console.error('[wix-contact-sync]', error && error.code || 'worker_failure');
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false, code: 'worker_unavailable' }));
  }
};
