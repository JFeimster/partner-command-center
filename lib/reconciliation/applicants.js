'use strict';

const {
  listImportedEmailFundingLeads,
  emailLeadPageToApplicant,
  updateEmailFundingLeadReconciliation
} = require('../notion/funding-leads');
const { upsertApplicantContact, upsertApplicantDeal } = require('../hubspot-client');
const { syncApplicant } = require('../google-sheets-sync');

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function failure(system, error) {
  return {
    system,
    code: error && error.code || 'unknown_error',
    status: error && error.status || null,
    message: error && error.message ? error.message : 'Unknown error'
  };
}

async function capture(system, work) {
  try {
    return { ok: true, system, value: await work() };
  } catch (error) {
    return { ok: false, system, error: failure(system, error) };
  }
}

function destinationStatus(result) {
  if (!result) return 'missing';
  if (result.ok === false) return 'failed';
  const value = result.value || {};
  return value.action || value.status || 'ok';
}

async function reconcileApplicantPage(page) {
  const applicant = emailLeadPageToApplicant(page);
  if (!clean(applicant.email)) {
    return {
      status: 'skipped',
      reason: 'missing_email',
      notion_page_id: page && page.id || null
    };
  }

  const hubspotContact = await capture('hubspot_contact', () => upsertApplicantContact(applicant));
  const contactId = hubspotContact.ok && hubspotContact.value ? hubspotContact.value.contact_id : null;

  const hubspotDeal = contactId
    ? await capture('hubspot_deal', () => upsertApplicantDeal(applicant, contactId))
    : { ok: false, system: 'hubspot_deal', error: { system: 'hubspot_deal', code: 'contact_unavailable', message: 'HubSpot contact was unavailable.' } };

  const dealId = hubspotDeal.ok && hubspotDeal.value ? hubspotDeal.value.deal_id : null;
  const sheets = await capture('google_sheets', () => syncApplicant(applicant, {
    hubspot_contact_id: contactId,
    hubspot_deal_id: dealId,
    notion_page_id: applicant.notion_page_id
  }));

  const failures = [hubspotContact, hubspotDeal, sheets]
    .filter((item) => item && item.ok === false)
    .map((item) => item.error);

  await updateEmailFundingLeadReconciliation(applicant.notion_page_id, { failures });

  return {
    status: failures.length ? 'reconciled_with_errors' : 'reconciled',
    email: applicant.email,
    name: applicant.name,
    notion_page_id: applicant.notion_page_id,
    status_source: applicant.status,
    route_detected: applicant.route_detected,
    destinations: {
      hubspot_contact: destinationStatus(hubspotContact),
      hubspot_deal: destinationStatus(hubspotDeal),
      google_sheets: destinationStatus(sheets)
    },
    hubspot_contact_id: contactId,
    hubspot_deal_id: dealId,
    sheet_row: sheets.ok && sheets.value ? sheets.value.row_number || null : null,
    failures
  };
}

async function reconcileImportedEmailApplicants(options) {
  const startedAt = new Date().toISOString();
  const listed = await listImportedEmailFundingLeads({ limit: options && options.limit || 250 });
  const results = [];
  const concurrency = Math.max(1, Math.min(Number(options && options.concurrency) || 5, 10));

  for (let i = 0; i < listed.pages.length; i += concurrency) {
    const batch = listed.pages.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((page) => reconcileApplicantPage(page)));
    results.push(...batchResults);
  }

  const summary = {
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    scanned: listed.pages.length,
    reconciled: results.filter((r) => r.status === 'reconciled').length,
    reconciled_with_errors: results.filter((r) => r.status === 'reconciled_with_errors').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    hubspot_contacts_created: results.filter((r) => r.destinations && r.destinations.hubspot_contact === 'created').length,
    hubspot_contacts_updated: results.filter((r) => r.destinations && r.destinations.hubspot_contact === 'updated').length,
    hubspot_contacts_preserved: results.filter((r) => r.destinations && r.destinations.hubspot_contact === 'preserved').length,
    hubspot_deals_created: results.filter((r) => r.destinations && r.destinations.hubspot_deal === 'created').length,
    hubspot_deals_updated: results.filter((r) => r.destinations && r.destinations.hubspot_deal === 'updated').length,
    sheet_rows_created: results.filter((r) => r.destinations && r.destinations.google_sheets === 'created').length,
    sheet_rows_updated: results.filter((r) => r.destinations && r.destinations.google_sheets === 'updated').length,
    has_more: listed.has_more,
    next_cursor: listed.next_cursor
  };

  console.log('[applicant-reconciliation]', JSON.stringify(summary));
  return { summary, results };
}

module.exports = {
  failure,
  capture,
  destinationStatus,
  reconcileApplicantPage,
  reconcileImportedEmailApplicants
};
