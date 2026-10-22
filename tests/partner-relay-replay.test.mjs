import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const router = require('../api/router');
const { partnerSignupEventId } = router._private;
const CRM_URL = 'https://loaowmappekunngjknnx.supabase.co/functions/v1/partner-crm-ingest';

test('canonical Tally event IDs are stable, unique per submission, and omit applicant information', () => {
  const a = partnerSignupEventId('tally-synthetic-submission-1');
  assert.match(a, /^tally_mOe658_[a-f0-9]{32}$/);
  assert.equal(a, partnerSignupEventId('tally-synthetic-submission-1'));
  assert.notEqual(a, partnerSignupEventId('tally-synthetic-submission-2'));
  assert.equal(partnerSignupEventId(''), '');
  assert.ok(!a.includes('synthetic-submission'));
});

test('canonical Tally exact replay writes only one Notion partner and event', async () => {
  const envKeys = [
    'PARTNER_COMMAND_API_KEY', 'PARTNER_CRM_INGEST_URL', 'PARTNER_CRM_INGEST_TOKEN',
    'NOTION_API_KEY', 'NOTION_PARTNERS_DB_ID', 'NOTION_PARTNER_EVENTS_DB_ID',
    'NOTION_PARTNER_RESOURCES_DB_ID', 'NOTION_TRACKING_LINKS_DB_ID'
  ];
  const before = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const originalInfo = console.info;
  process.env.PARTNER_COMMAND_API_KEY = 'synthetic-unit-test-api-key';
  process.env.PARTNER_CRM_INGEST_URL = CRM_URL;
  process.env.PARTNER_CRM_INGEST_TOKEN = 'synthetic-unit-test-relay-token';
  process.env.NOTION_API_KEY = 'synthetic-unit-test-notion-key';
  process.env.NOTION_PARTNERS_DB_ID = 'partners-test';
  process.env.NOTION_PARTNER_EVENTS_DB_ID = 'events-test';
  process.env.NOTION_PARTNER_RESOURCES_DB_ID = 'resources-test';
  process.env.NOTION_TRACKING_LINKS_DB_ID = 'links-test';

  let partnerCreates = 0;
  let eventCreates = 0;
  let relayCalls = 0;
  let savedEvent = null;
  let savedPartner = null;
  const traceLines = [];
  console.info = (line) => traceLines.push(String(line));
  const reply = (data) => ({ ok: true, status: 200, text: async () => JSON.stringify(data) });
  globalThis.fetch = async (url, init) => {
    const pathname = String(url);
    if (pathname === CRM_URL) {
      relayCalls++;
      const request = JSON.parse(init.body);
      return { ok: true, status: relayCalls === 1 ? 201 : 200, json: async () => ({
        ok: true,
        application_id: 'synthetic-supabase-application-1',
        duplicate: relayCalls > 1,
        correlation_id: request.correlation_id
      }) };
    }
    if (pathname.includes('/databases/events-test/query')) {
      const query = JSON.parse(init.body);
      const found = savedEvent && query.filter?.title?.equals === savedEvent.properties['Event Name'].title[0].text.content;
      return reply({ results: found ? [savedEvent] : [] });
    }
    if (pathname.includes('/databases/partners-test/query')) return reply({ results: [] });
    if (pathname.endsWith('/pages') && init.method === 'POST') {
      const body = JSON.parse(init.body);
      if (body.properties['Event Name']) {
        eventCreates++;
        savedEvent = {
          id: 'synthetic-notion-event-1',
          url: 'https://example.invalid/notion/event/1',
          properties: {
            ...body.properties,
            'Partner ID': { rich_text: [{ plain_text: 'synthetic-partner-1' }] }
          }
        };
        return reply(savedEvent);
      }
      partnerCreates++;
      savedPartner = { id: 'synthetic-notion-partner-1', url: 'https://example.invalid/notion/partner/1', properties: body.properties };
      return reply(savedPartner);
    }
    throw new Error('Unexpected Notion test request: ' + pathname);
  };

  const payload = {
    action: 'receivePartnerSignup',
    data: {
      formId: 'mOe658',
      responseId: 'synthetic-tally-replay-id',
      fields: [
        { label: 'Full Name', value: 'Synthetic Partner' },
        { label: 'Email', value: 'synthetic-partner@example.invalid' },
        { label: 'Agreement', value: 'yes' },
        { label: 'Contact Permission', value: 'yes' }
      ]
    }
  };
  const makeResponse = () => ({
    code: null,
    payload: null,
    status(code) { this.code = code; return this; },
    setHeader() {},
    end(body) { this.payload = JSON.parse(body); }
  });
  try {
    const first = makeResponse();
    await router({ method: 'POST', headers: { 'x-api-key': 'synthetic-unit-test-api-key' }, body: payload }, first);
    assert.equal(first.code, 201, JSON.stringify(first.payload));
    assert.equal(first.payload?.ok, true);

    const second = makeResponse();
    await router({ method: 'POST', headers: { 'x-api-key': 'synthetic-unit-test-api-key' }, body: payload }, second);
    assert.equal(second.code, 200, JSON.stringify(second.payload));
    assert.equal(second.payload?.data?.result, 'duplicate');
    assert.equal(partnerCreates, 1);
    assert.equal(eventCreates, 1);
    assert.equal(relayCalls, 2);
    assert.ok(savedEvent);
    assert.ok(savedPartner);
    const traces = traceLines.map((line) => JSON.parse(line));
    const correlationId = partnerSignupEventId('synthetic-tally-replay-id');
    assert.ok(traces.length >= 4);
    assert.ok(traces.every((trace) => trace.correlation_id === correlationId));
    assert.ok(traces.some((trace) => trace.stage === 'supabase_relay' && trace.outcome === 'accepted' && trace.application_id === 'synthetic-supabase-application-1'));
    assert.ok(traces.some((trace) => trace.stage === 'notion' && trace.outcome === 'created' && trace.notion_correlation_id === correlationId && trace.notion_page_id === 'synthetic-notion-event-1'));
    assert.ok(traces.some((trace) => trace.stage === 'notion' && trace.outcome === 'duplicate' && trace.notion_page_id === 'synthetic-notion-event-1' && trace.supabase_duplicate === true));
    const traceText = JSON.stringify(traces);
    assert.ok(!traceText.includes('synthetic-partner@example.invalid'));
    assert.ok(!traceText.includes('Synthetic Partner'));
    assert.ok(!traceText.includes('synthetic-tally-replay-id'));
  } finally {
    globalThis.fetch = originalFetch;
    console.info = originalInfo;
    for (const key of envKeys) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
});
