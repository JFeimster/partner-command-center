'use strict';

// Operational event-to-contact projection. All credentials remain server-side.
const { createClient } = require('@supabase/supabase-js');

const WIX_SITE_ID = 'cc61a0cb-edcd-43dc-bdda-42c76443dcd6';
const FIELDS = Object.freeze({
  partnerStatus: 'custom.partner-status-aqgsprsuyxigeupsffng',
  partnerType: 'custom.partner-type-ofupshmfvqlhfypumeytfe',
  partnerApplicationStatus: 'custom.partner-application-status-xjcrhapo',
  contactType: 'custom.contact-type-fthrfdxphfogegdztkapds',
  leadStatus: 'custom.lead-status-eyvsodtqmzhliowvkrkwhlu',
  fundingStage: 'custom.funding-stage-kevpmtfjtluxpcpnhgtzb',
  leadSource: 'custom.lead-source-zcrhbqpohwzdpupzmoogcip',
  externalCrmId: 'custom.external-crm-id-ynriagpsvpziodgatkb'
});
const ALLOWED = Object.freeze({
  partnerStatus: ['pending','active','paused','terminated'],
  partnerType: ['funding_broker','referral_partner','affiliate_partner','center_of_influence',
    'professional_service_provider','community_connector','internal_operator','unknown'],
  partnerApplicationStatus: ['new','needs_review','qualified','onboarding','approved','declined','nurture'],
  leadStatus: ['new','qualified','nurture','referred','won','lost','archived'],
  fundingStage: ['intake_captured','review_requested','documents_pending']
});

class SyncFailure extends Error {
  constructor(code, retryable = false) {
    super(code);
    this.code = code;
    this.retryable = retryable;
  }
}
function normalizedEmail(value) {
  const valueString = String(value || '').trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valueString) ? valueString : null;
}
function isFictional(obj) { return Boolean(obj && (obj.fictional === true || obj.fictional === 'true')); }
function assertAllowed(group, value) {
  if (!ALLOWED[group].includes(value)) throw new SyncFailure('invalid_' + group, false);
  return value;
}
function projection(entityKind, row, related) {
  const fields = {};
  let email;
  if (entityKind === 'partner') {
    if (isFictional(row.metadata)) return null;
    email = normalizedEmail(row.contact_email);
    fields[FIELDS.partnerStatus] = assertAllowed('partnerStatus', row.status);
    fields[FIELDS.partnerType] = assertAllowed('partnerType', row.partner_type);
    fields[FIELDS.contactType] = 'partner';
  } else if (entityKind === 'partner_application') {
    if (isFictional(row.answers)) return null;
    email = normalizedEmail(row.email);
    fields[FIELDS.partnerApplicationStatus] = assertAllowed('partnerApplicationStatus', row.status);
    fields[FIELDS.contactType] = 'partner_applicant';
    if (row.source && String(row.source).length <= 80) fields[FIELDS.leadSource] = row.source;
  } else if (entityKind === 'funding_lead') {
    if (isFictional(row.metadata)) return null;
    email = normalizedEmail(row.email);
    fields[FIELDS.leadStatus] = assertAllowed('leadStatus', row.status);
    fields[FIELDS.contactType] = 'funding_applicant';
    if (row.source && String(row.source).length <= 80) fields[FIELDS.leadSource] = row.source;
  } else if (entityKind === 'funding_deal') {
    if (!related || isFictional(related.metadata)) return null;
    email = normalizedEmail(related.email);
    fields[FIELDS.fundingStage] = assertAllowed('fundingStage', row.pipeline_stage);
    fields[FIELDS.contactType] = 'funding_applicant';
  } else { throw new SyncFailure('unsupported_event_kind'); }
  if (!email) return null;
  return { email, fields };
}
async function lookupSource(db, evt) {
  const table = ({
    partner: 'partners', partner_application: 'partner_applications',
    funding_lead: 'leads', funding_deal: 'brokerflow_deals'
  })[evt.entity_kind];
  if (!table) throw new SyncFailure('unsupported_event_kind');
  const { data, error } = await db.from(table).select('*')
    .eq('id', evt.entity_id).eq('organization_id', evt.organization_id).maybeSingle();
  if (error) throw new SyncFailure('source_lookup_failed', true);
  if (!data) return null;
  if (evt.entity_kind !== 'funding_deal') return projection(evt.entity_kind, data);
  const lead = await db.from('leads').select('email,metadata,organization_id')
    .eq('id', data.lead_id).eq('organization_id', evt.organization_id).maybeSingle();
  if (lead.error) throw new SyncFailure('linked_lead_lookup_failed', true);
  return projection(evt.entity_kind, data, lead.data);
}
async function wixRequest(fetcher, key, method, path, body) {
  let response;
  try {
    response = await fetcher('https://www.wixapis.com' + path, {
      method,
      headers: {
        authorization: key, 'wix-site-id': WIX_SITE_ID,
        'content-type': 'application/json'
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    throw new SyncFailure('wix_network_failure', true);
  }
  if (!response.ok) {
    const status = response.status;
    throw new SyncFailure('wix_http_' + status, status === 408 || status === 409 || status === 429 || status >= 500);
  }
  try { return await response.json(); }
  catch { throw new SyncFailure('wix_invalid_response', true); }
}
function mergeWixFields(existing, incoming) {
  const current = { ...(existing || {}) };
  let changed = false;
  for (const [key, value] of Object.entries(incoming)) {
    // Do not overwrite an identity from an unrelated canonical record.
    if (key === FIELDS.externalCrmId && current[key] && current[key] !== value) continue;
    // Contact Type can describe multiple workflows. Preserve an existing distinct role.
    if (key === FIELDS.contactType && current[key] &&
        current[key] !== value && !(current[key] === 'partner_applicant' && value === 'partner')) continue;
    // Preserve first-touch attribution.
    if (key === FIELDS.leadSource && current[key]) continue;
    if (current[key] !== value) { current[key] = value; changed = true; }
  }
  return { fields: current, changed };
}
async function patchExactContact(fetcher, key, event, resolved) {
  const search = await wixRequest(fetcher, key, 'POST', '/contacts/v5/contacts/query', {
    query: { filter: { 'email.email': { $eq: resolved.email } }, cursorPaging: { limit: 3 } }
  });
  const contacts = search.contacts || [];
  if (contacts.length !== 1 || search.pagingMetadata?.hasNext) {
    throw new SyncFailure(contacts.length === 0 ? 'contact_not_found' : 'ambiguous_contact_match');
  }
  const id = contacts[0].id;
  const read = await wixRequest(fetcher, key, 'GET', '/contacts/v4/contacts/' + encodeURIComponent(id));
  const contact = read.contact;
  if (!contact || contact.id !== id || !Number.isInteger(contact.revision)) {
    throw new SyncFailure('contact_revision_missing', true);
  }
  const emailSet = new Set((contact.info?.emails?.items || []).map(item => normalizedEmail(item.email)).filter(Boolean));
  if (!emailSet.has(resolved.email)) throw new SyncFailure('contact_email_mismatch');
  const oldFields = contact.info?.extendedFields?.items || {};
  const merged = mergeWixFields(oldFields, resolved.fields);
  if (merged.changed) {
    await wixRequest(fetcher, key, 'PATCH', '/contacts/v4/contacts/' + encodeURIComponent(id), {
      revision: contact.revision,
      info: { extendedFields: { items: merged.fields } }
    });
    const verified = await wixRequest(fetcher, key, 'GET', '/contacts/v4/contacts/' + encodeURIComponent(id));
    const actual = verified.contact?.info?.extendedFields?.items || {};
    for (const [k, v] of Object.entries(resolved.fields)) {
      if (k === FIELDS.contactType && oldFields[k] && oldFields[k] !== v &&
          !(oldFields[k] === 'partner_applicant' && v === 'partner')) continue;
      if (k === FIELDS.leadSource && oldFields[k]) continue;
      if (actual[k] !== v) throw new SyncFailure('wix_postwrite_verification_failed', true);
    }
  }
  return id;
}
async function writeResult(db, event, state, code, contactId) {
  const terminal = state === 'retry' && event.attempts >= 6 ? 'failed' : state;
  const delayMs = Math.min(3600000, Math.pow(2, Math.min(event.attempts, 8)) * 30000);
  const values = {
    status: terminal, last_error_code: code || null,
    leased_until: null, updated_at: new Date().toISOString(),
    ...(contactId ? { wix_contact_id: contactId } : {}),
    ...(terminal === 'retry' ? { next_attempt_at: new Date(Date.now() + delayMs).toISOString() } : {})
  };
  const { data, error } = await db.from('wix_contact_sync_outbox').update(values)
    .eq('id', event.id).eq('status', 'processing').select('id');
  if (error || data?.length !== 1) throw new SyncFailure('outbox_write_failed', true);
}
async function runWixSync({ env = process.env, fetcher = globalThis.fetch, db } = {}) {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = env.SUPABASE_SERVICE_ROLE_KEY;
  const wixKey = env.WIX_API_KEY;
  if (!url || !secret || !wixKey) throw new SyncFailure('missing_credentials');
  const client = db || createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const claim = await client.rpc('claim_wix_contact_sync_outbox', { p_limit: 10 });
  if (claim.error) throw new SyncFailure('outbox_claim_failed', true);
  const outcome = { claimed: (claim.data || []).length, synced: 0, ignored: 0, needs_mapping: 0, retried: 0, failed: 0 };
  for (const event of claim.data || []) {
    try {
      const resolved = await lookupSource(client, event);
      if (!resolved) { await writeResult(client, event, 'ignored', 'no_eligible_source'); outcome.ignored++; continue; }
      const contactId = await patchExactContact(fetcher, wixKey, event, resolved);
      await writeResult(client, event, 'synced', null, contactId);
      outcome.synced++;
    } catch (error) {
      const code = error instanceof SyncFailure ? error.code : 'unexpected_processing_error';
      const retryable = !(error instanceof SyncFailure) || error.retryable;
      const state = retryable ? (event.attempts >= 6 ? 'failed' : 'retry')
        : (code === 'contact_not_found' || code === 'ambiguous_contact_match' || code === 'contact_email_mismatch'
          ? 'needs_mapping' : 'failed');
      await writeResult(client, event, state, code);
      outcome[state === 'retry' ? 'retried' : state]++;
    }
  }
  return outcome;
}
module.exports = {
  WIX_SITE_ID, FIELDS, ALLOWED, SyncFailure, normalizedEmail, projection,
  mergeWixFields, patchExactContact, runWixSync
};
