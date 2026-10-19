'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../lib/crm-event-engine');
const fixtures = require('./fixtures/crm-events.synthetic');

test('synthetic submission fixture covers every supported status and two providers per applicant', () => {
  assert.deepEqual(new Set(fixtures.submissionEvents.map(e => e.status)),
    new Set(['submitted', 'under_review', 'offered', 'funded', 'declined', 'withdrawn']));
  assert.equal(new Set(fixtures.submissionEvents.map(e => e.provider_id)).size, 2);
  assert.equal(new Set(fixtures.submissionEvents.map(e => e.record_id)).size, 1);
  fixtures.submissionEvents.forEach(e => assert.equal(engine.normalize('submission', e).event_id, e.event_id));
});
test('synthetic outreach fixture covers every status', () => {
  assert.deepEqual(new Set(fixtures.communicationEvents.map(e => e.status)),
    new Set(['queued', 'attempted', 'sent', 'delivered', 'failed', 'canceled', 'replied', 'suppressed']));
  fixtures.communicationEvents.forEach(e => assert.equal(engine.normalize('communication', e).event_id, e.event_id));
});
test('unknown columns and personal data cannot enter the event store', () => {
  for (const kind of ['submission', 'communication']) {
    const event = kind === 'submission' ? fixtures.submissionEvents[0] : fixtures.communicationEvents[0];
    assert.throws(() => engine.normalize(kind, { ...event, applicant_email: 'private@example.com' }), /INVALID_EVENT/);
    assert.throws(() => engine.normalize(kind, { ...event, message_body: 'private' }), /INVALID_EVENT/);
  }
  assert.throws(() => engine.normalize('submission', { ...fixtures.submissionEvents[0], internal_reference: 'applicant private note' }), /INVALID_EVENT/);
  assert.throws(() => engine.normalize('communication', { ...fixtures.communicationEvents[8], suppression_reason: 'applicant private note' }), /INVALID_EVENT/);
});
test('offer and funding require source evidence identifiers', () => {
  assert.throws(() => engine.normalize('submission', { ...fixtures.submissionEvents[3], source_event_id: '' }), /INVALID_EVENT/);
  assert.throws(() => engine.normalize('submission', { ...fixtures.submissionEvents[4], source_event_id: '' }), /INVALID_EVENT/);
});
test('outbound queued work requires documented consent', () => {
  assert.throws(() => engine.normalize('communication', { ...fixtures.communicationEvents[0], consent_basis: '' }), /SEND_SUPPRESSED/);
});
test('ingestion is feature flagged before database access', async () => {
  await assert.rejects(engine.ingest(null, 'submission', fixtures.submissionEvents[0]), /DISABLED/);
});
