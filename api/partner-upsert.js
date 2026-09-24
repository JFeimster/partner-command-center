// GPT Action: upsertPartner
'use strict';

const { findPartnerByPartnerId, findPartnerByEmail, updatePage, createPartnerEvent } = require('../lib/notion-client');
const { title, richText, email, phoneNumber, url, select, status, multiSelect, notionPartnerType, notionStatus, notionOnboardingPath, notionReferralSource, audienceOptions } = require('../lib/partner-mappers');
const { validateEmail, findSensitiveData } = require('../lib/validation');
const { created, success, validationError, unauthorized, methodNotAllowed, notionError, serverError, sendJson } = require('../lib/response');
const { clean, isAuthorized, parseBody } = require('../lib/action-auth');
const partnerSignup = require('./partner-signup');

function firstPlainText(items) { return Array.isArray(items) && items[0] && items[0].plain_text ? items[0].plain_text : ''; }
function propertyText(prop) { if (!prop) return ''; if (prop.title) return firstPlainText(prop.title); if (prop.rich_text) return firstPlainText(prop.rich_text); return ''; }
function partnerIdFromPage(page) { return propertyText(page && page.properties && page.properties['Partner ID']); }

function partialProperties(input) {
  const props = {};
  if (input.name !== undefined || input.full_name !== undefined) props.Name = title(clean(input.name || input.full_name));
  if (input.email !== undefined) props.Email = email(clean(input.email).toLowerCase());
  if (input.phone !== undefined) props.Phone = phoneNumber(input.phone);
  if (input.company !== undefined) props.Company = richText(input.company);
  if (input.website !== undefined) props.Website = url(input.website);
  if (input.partner_type !== undefined || input.partner_type_claimed !== undefined) props['Partner Type'] = select(notionPartnerType(input.partner_type || input.partner_type_claimed));
  if (input.audience !== undefined) props.Audience = multiSelect(audienceOptions(input.audience));
  if (input.referral_source !== undefined || input.source !== undefined) props['Referral Source'] = select(notionReferralSource(input.referral_source || input.source));
  if (input.status !== undefined) props.Status = status(notionStatus(input.status));
  if (input.tier !== undefined) props.Tier = select(input.tier);
  if (input.onboarding_path !== undefined) props['Onboarding Path'] = select(notionOnboardingPath(input.onboarding_path, input.partner_type));
  return props;
}

module.exports = async function partnerUpsert(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try { body = parseBody(req); } catch (error) { return sendJson(res, validationError('Invalid JSON request body.')); }
  const input = body.partner && typeof body.partner === 'object' ? body.partner : body;

  const sensitive = findSensitiveData(input);
  if (sensitive.length) return sendJson(res, validationError('Sensitive data detected in partner payload.', sensitive));

  const partnerId = clean(input.partner_id);
  const emailValue = clean(input.email).toLowerCase();
  if (!partnerId && !emailValue) return sendJson(res, validationError('partner_id or email is required.'));
  if (emailValue) {
    const emailResult = validateEmail(emailValue);
    if (!emailResult.valid) return sendJson(res, validationError('A valid partner email is required.', { field: 'email' }));
  }

  try {
    const existing = partnerId ? await findPartnerByPartnerId(partnerId) : await findPartnerByEmail(emailValue);
    if (!existing) {
      // Reuse the proven submitPartnerSignup implementation for creation semantics.
      req.body = { partner: { ...input, source: input.source || 'gpt_action' } };
      return partnerSignup(req, res);
    }

    const properties = partialProperties(input);
    if (Object.keys(properties).length === 0) {
      return sendJson(res, success({
        action: 'upsertPartner',
        result: 'unchanged',
        partner_id: partnerIdFromPage(existing) || partnerId || null,
        notion_page: { id: existing.id, url: existing.url }
      }));
    }

    const updated = await updatePage(existing.id, { properties });
    const resolvedPartnerId = partnerIdFromPage(updated) || partnerIdFromPage(existing) || partnerId;

    await createPartnerEvent({
      partner_id: resolvedPartnerId,
      event_type: 'partner_updated',
      source: 'gpt_action',
      status: clean(input.status || 'active'),
      summary: 'Partner record updated through upsertPartner Action.',
      metadata: { updated_fields: Object.keys(properties) },
      created_at: new Date().toISOString()
    });

    return sendJson(res, success({
      action: 'upsertPartner',
      result: 'updated',
      partner_id: resolvedPartnerId,
      notion_page: { id: updated.id, url: updated.url }
    }));
  } catch (error) {
    if (error && (error.code === 'notion_error' || error.status)) return sendJson(res, notionError('Notion request failed.', { message: error.message, status: error.status }));
    return sendJson(res, serverError('Partner upsert failed.', { message: error.message }));
  }
};
