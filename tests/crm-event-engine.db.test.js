'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../lib/crm-event-engine');
const { submission, communication, submissionEvents, communicationEvents } = require('./fixtures/crm-events.synthetic');

const connectionString = process.env.CRM_EVENT_TEST_DATABASE_URL;
test('PostgreSQL event store integration and concurrency', { skip: !connectionString && 'CRM_EVENT_TEST_DATABASE_URL is not configured' }, async t => {
  const pool = engine.createPool(connectionString);
  try {
    const migration = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', '202610190001_crm_event_engine.sql'), 'utf8');
    await pool.query(migration);
    await pool.query(`INSERT INTO crm_event_engine.case_refs(record_id,source_reference,verified_at) VALUES
      ('CASE-1','Master Applicants row 2',now()),('CASE-2','Master Applicants row 3',now())`);
    await pool.query(`INSERT INTO crm_event_engine.provider_refs(provider_id,notion_page_id,verified_at) VALUES
      ('P-1','notion-P-1',now()),('P-2','notion-P-2',now())`);
    await pool.query(`INSERT INTO crm_event_engine.product_refs(provider_id,product_id,notion_page_id,verified_at) VALUES
      ('P-1','PR-1','notion-PR-1',now()),('P-2','PR-2','notion-PR-2',now())`);
    await pool.query(`INSERT INTO crm_event_engine.verified_evidence
      (evidence_id,record_id,provider_id,product_id,evidence_kind,external_reference,verified_at) VALUES
      ('E-OFFER-1','CASE-1','P-1','PR-1','offer','provider-offer-1',now()),
      ('E-FUND-1','CASE-1','P-1','PR-1','funding','provider-funding-1',now())`);

    await t.test('all submission statuses retain their history and independent provider state', async () => {
      for (const e of submissionEvents) assert.equal((await engine.ingest(pool, 'submission', e, { enabled: true })).status, 'recorded');
      const current = await engine.currentSubmissions(pool, 'CASE-1');
      assert.deepEqual(current.map(s => [s.submission_id, s.status]), [['S-1', 'funded'], ['S-2', 'declined'], ['S-3', 'withdrawn']]);
      assert.equal(current[0].offer_amount, '1200.00');
      assert.equal(current[0].funded_amount, '1100.00');
      assert.equal((await pool.query("SELECT count(*) FROM crm_event_engine.events WHERE event_kind='submission'")).rows[0].count, '8');
      const rows = await engine.reportingRows(pool, 'submission', 'CASE-1');
      assert.equal(rows.length, 8);
      assert.equal(rows[0].length, 20);
      assert.equal(rows[0][0], 'sub-1');
      assert.equal(rows[0][1], 'S-1');
      const firstPage = await engine.reportingPage(pool, 'submission', { recordId: 'CASE-1', limit: 2 });
      assert.equal(firstPage.headers.length, 20);
      assert.equal(firstPage.rows.length, 2);
      const secondPage = await engine.reportingPage(pool, 'submission', { recordId: 'CASE-1', after: firstPage.next_after, limit: 2 });
      assert.equal(secondPage.rows[0][0], 'sub-3');
    });
    await t.test('duplicate key replay creates no row; conflicting payload fails closed', async () => {
      assert.equal((await engine.ingest(pool, 'submission', submissionEvents[0], { enabled: true })).status, 'replayed');
      assert.equal((await engine.ingest(pool, 'submission', { ...submissionEvents[0], event_id: 'sub-1-retry' }, { enabled: true })).status, 'replayed');
      await assert.rejects(engine.ingest(pool, 'submission', { ...submissionEvents[0], provider_id: 'P-2', product_id: 'PR-2', notion_provider_page_id: 'notion-P-2', notion_product_page_id: 'notion-PR-2' }, { enabled: true }), /IDEMPOTENCY_CONFLICT/);
      assert.equal((await pool.query("SELECT count(*) FROM crm_event_engine.events WHERE event_kind='submission'")).rows[0].count, '8');
      assert.equal((await pool.query("SELECT count(*) FROM crm_event_engine.integration_errors WHERE error_code='IDEMPOTENCY_CONFLICT'")).rows[0].count, '1');
    });
    await t.test('unknown references and unverified funding are rejected', async () => {
      await assert.rejects(engine.ingest(pool, 'submission', submission('bad-case','S-X','P-1','PR-1','submitted',10,{record_id:'CASE-UNKNOWN',external_submission_id:'EXT-X'}), { enabled: true }), /UNKNOWN_REFERENCE/);
      await assert.rejects(engine.ingest(pool, 'submission', submission('bad-provider','S-Y','P-UNKNOWN','PR-1','submitted',10,{external_submission_id:'EXT-Y'}), { enabled: true }), /UNKNOWN_REFERENCE/);
      await assert.rejects(engine.ingest(pool, 'submission', submission('bad-product','S-Z','P-1','PR-UNKNOWN','submitted',10,{external_submission_id:'EXT-Z'}), { enabled: true }), /UNKNOWN_REFERENCE/);
      await assert.rejects(engine.ingest(pool, 'submission', submission('bad-funding','S-1','P-1','PR-1','funded',10,{funded_amount:'100',source_event_id:'unverified'}), { enabled: true }), /EVIDENCE_REQUIRED/);
      assert.equal((await pool.query("SELECT count(*) FROM crm_event_engine.events WHERE event_id LIKE 'bad-%'")).rows[0].count, '0');
    });
    await t.test('outreach history remains immutable; reply and suppression stop eligibility', async () => {
      for (const e of communicationEvents.slice(0, 8)) await engine.ingest(pool, 'communication', e, { enabled: true });
      let state = (await engine.communicationState(pool, 'CASE-1'))[0];
      assert.equal(state.reply_paused, true);
      assert.equal(state.pending_follow_up, true);
      assert.equal(state.eligible_send, false);
      await assert.rejects(engine.ingest(pool, 'communication', communication('mail-after-reply','queued',9,{consent_basis:'documented-opt-in'}), { enabled: true }), /REPLY_PAUSED/);
      await engine.ingest(pool, 'communication', communicationEvents[8], { enabled: true });
      state = (await engine.communicationState(pool, 'CASE-1'))[0];
      assert.equal(state.suppressed, true);
      assert.equal(state.eligible_send, false);
      await assert.rejects(engine.ingest(pool, 'communication', communication('mail-after-opt-out','queued',10,{consent_basis:'documented-opt-in'}), { enabled: true }), /SEND_SUPPRESSED/);
      const rows = await engine.reportingRows(pool, 'communication', 'CASE-1');
      assert.equal(rows.length, 9);
      assert.equal(rows[0].length, 17);
      await assert.rejects(pool.query("DELETE FROM crm_event_engine.events WHERE event_id='mail-1'"), /immutable/);
    });
    await t.test('concurrent identical delivery records exactly once', async () => {
      const event = { ...submission('race-1','S-RACE','P-1','PR-1','submitted',12,{record_id:'CASE-2',external_submission_id:'EXT-RACE'}) };
      const results = await Promise.all(Array.from({ length: 8 }, () => engine.ingest(pool, 'submission', event, { enabled: true })));
      assert.equal(results.filter(r => r.status === 'recorded').length, 1);
      assert.equal(results.filter(r => r.status === 'replayed').length, 7);
      assert.equal((await pool.query("SELECT count(*) FROM crm_event_engine.events WHERE aggregate_id='S-RACE'")).rows[0].count, '1');
    });
    await t.test('concurrent conflicting idempotency keys cannot both commit', async () => {
      const first = submission('race-key-1','S-RACE-A','P-1','PR-1','submitted',13,{record_id:'CASE-2',external_submission_id:'EXT-A',idempotency_key:'shared-key'});
      const second = submission('race-key-2','S-RACE-B','P-1','PR-1','submitted',13,{record_id:'CASE-2',external_submission_id:'EXT-B',idempotency_key:'shared-key'});
      const results = await Promise.allSettled([engine.ingest(pool, 'submission', first, { enabled: true }),engine.ingest(pool, 'submission', second, { enabled: true })]);
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(results.filter(r => r.status === 'rejected').length, 1);
      assert.equal((await pool.query("SELECT count(*) FROM crm_event_engine.events WHERE idempotency_key='shared-key'")).rows[0].count, '1');
    });
    await t.test('case-wide suppression blocks another workflow and reporter cannot write', async () => {
      await engine.ingest(pool, 'communication', communication('other-workflow','queued',14,{record_id:'CASE-2',workflow_id:'different',consent_basis:'documented-opt-in'}), { enabled: true });
      await engine.ingest(pool, 'communication', communication('global-opt-out','suppressed',15,{record_id:'CASE-2',workflow_id:'',suppression_reason:'case_opt_out'}), { enabled: true });
      const state = (await engine.communicationState(pool, 'CASE-2')).find(s => s.workflow_id === 'different');
      assert.equal(state.suppressed, true);
      assert.equal(state.eligible_send, false);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SET LOCAL ROLE crm_event_report');
        assert.equal((await client.query("SELECT count(*) FROM crm_event_engine.current_submissions")).rows[0].count, '5');
        await assert.rejects(client.query("DELETE FROM crm_event_engine.events WHERE event_id='sub-1'"), /permission denied/);
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    });
    await t.test('dedicated ingestion role can append through the guarded adapter', async () => {
      const client = await pool.connect();
      try {
        await client.query('SET ROLE crm_event_ingest');
        const scopedPool = {
          connect: async () => ({ query: (...args) => client.query(...args), release: () => {} }),
          query: (...args) => client.query(...args)
        };
        const result = await engine.ingest(scopedPool, 'communication',
          communication('ingest-role-failure','failed',16,{record_id:'CASE-2'}), { enabled: true });
        assert.equal(result.status, 'recorded');
      } finally {
        await client.query('RESET ROLE');
        client.release();
      }
    });
  } finally { await pool.end(); }
});
