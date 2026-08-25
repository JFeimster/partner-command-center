'use strict';

const { findPartnerByPartnerId, updatePage } = require('./notion-client');

const CAPITAL_BASE_URL = 'https://capital.distilledfunding.com';
const LEAD_FORM_BASE_URL = 'https://tally.so/r/dWvEqN';

function clean(value) { return value === undefined || value === null ? '' : String(value).trim(); }
function property(page, name) { return page && page.properties ? page.properties[name] : null; }
function plain(prop) {
  if (!prop) return '';
  if (Array.isArray(prop.title)) return prop.title.map((x) => x.plain_text || x.text && x.text.content || '').join('').trim();
  if (Array.isArray(prop.rich_text)) return prop.rich_text.map((x) => x.plain_text || x.text && x.text.content || '').join('').trim();
  if (prop.select) return clean(prop.select.name);
  if (prop.email !== undefined) return clean(prop.email);
  if (prop.phone_number !== undefined) return clean(prop.phone_number);
  if (prop.url !== undefined) return clean(prop.url);
  return '';
}
function value(page, name, fallback) { return plain(property(page, name)) || fallback || ''; }
function list(page, name) { return value(page, name).split(',').map((x) => x.trim()).filter(Boolean); }

function buildPublicUrl(profile, context) {
  if (!profile.slug) return null;
  const url = new URL('/' + profile.slug, CAPITAL_BASE_URL);
  if (profile.referral_code) url.searchParams.set('ref', profile.referral_code);
  const c = context || {};
  ['campaign', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => { if (clean(c[key])) url.searchParams.set(key, clean(c[key])); });
  return url.toString();
}

function buildLeadFormUrl(profile, context) {
  const url = new URL(LEAD_FORM_BASE_URL);
  if (profile.partner_id) url.searchParams.set('partner_id', profile.partner_id);
  if (profile.referral_code) {
    url.searchParams.set('referral_code', profile.referral_code);
    url.searchParams.set('referral_partner', profile.referral_code);
  }
  const c = context || {};
  url.searchParams.set('source', clean(c.source) || 'partner_distribution_kit');
  url.searchParams.set('utm_source', clean(c.utm_source) || 'partner');
  url.searchParams.set('utm_medium', clean(c.utm_medium) || 'referral');
  url.searchParams.set('utm_campaign', clean(c.utm_campaign) || clean(c.campaign) || 'partner_funding_page');
  if (clean(c.campaign)) url.searchParams.set('campaign', clean(c.campaign));
  if (clean(c.utm_content)) url.searchParams.set('utm_content', clean(c.utm_content));
  if (clean(c.utm_term)) url.searchParams.set('utm_term', clean(c.utm_term));
  return url.toString();
}

function qrUrl(destination, format) {
  if (!destination) return null;
  const url = new URL('https://api.qrserver.com/v1/create-qr-code/');
  url.searchParams.set('size', '1000x1000');
  url.searchParams.set('format', format === 'svg' ? 'svg' : 'png');
  url.searchParams.set('data', destination);
  return url.toString();
}

function completeness(profile) {
  const keys = ['display_name', 'company_name', 'title', 'bio', 'photo_url', 'markets', 'specialties', 'booking_url'];
  const complete = keys.filter((key) => Array.isArray(profile[key]) ? profile[key].length : clean(profile[key])).length;
  return Math.round((complete / keys.length) * 100);
}

function mapPartner(page, partnerId) {
  const profile = {
    partner_id: partnerId,
    referral_code: value(page, 'Referral Code'),
    slug: value(page, 'Slug'),
    display_name: value(page, 'Display Name', value(page, 'Name', 'Funding Agent')),
    full_name: value(page, 'Name', 'Funding Agent'),
    company_name: value(page, 'Company'),
    title: value(page, 'Current Position', 'Funding Advisor'),
    photo_url: value(page, 'Photo URL'),
    logo_url: value(page, 'Logo URL'),
    bio: value(page, 'Bio'),
    city: value(page, 'City'),
    state: value(page, 'State'),
    markets: list(page, 'Markets'),
    specialties: list(page, 'Specialties'),
    industries: list(page, 'Industries'),
    funding_types: list(page, 'Funding Types'),
    booking_url: value(page, 'Booking URL'),
    website_url: value(page, 'Website URL', value(page, 'Website')),
    phone: value(page, 'Phone'),
    email: value(page, 'Email'),
    primary_cta_label: value(page, 'Primary CTA Label', 'Request Funding Review'),
    primary_cta_url: value(page, 'Primary CTA URL'),
    profile_status: value(page, 'Profile Status', 'draft'),
    approval_status: value(page, 'Approval Status', 'needs_review')
  };
  profile.public_url = buildPublicUrl(profile);
  profile.referral_url = profile.public_url;
  profile.lead_form_url = buildLeadFormUrl(profile);
  profile.qr_png_url = qrUrl(profile.referral_url, 'png');
  profile.qr_svg_url = qrUrl(profile.referral_url, 'svg');
  profile.profile_completeness = completeness(profile);
  profile.publication_status = profile.approval_status === 'approved' && profile.profile_status === 'published' ? 'published' : 'not_published';
  return profile;
}

function richText(value) { return { rich_text: clean(value) ? [{ type: 'text', text: { content: clean(value) } }] : [] }; }
function url(value) { return { url: clean(value) || null }; }
function email(value) { return { email: clean(value) || null }; }
function phone(value) { return { phone_number: clean(value) || null }; }

const EDITABLE = {
  display_name: ['Display Name', richText],
  company_name: ['Company', richText],
  title: ['Current Position', richText],
  bio: ['Bio', richText],
  photo_url: ['Photo URL', url],
  logo_url: ['Logo URL', url],
  specialties: ['Specialties', (v) => richText(Array.isArray(v) ? v.join(', ') : v)],
  industries: ['Industries', (v) => richText(Array.isArray(v) ? v.join(', ') : v)],
  funding_types: ['Funding Types', (v) => richText(Array.isArray(v) ? v.join(', ') : v)],
  markets: ['Markets', (v) => richText(Array.isArray(v) ? v.join(', ') : v)],
  booking_url: ['Booking URL', url],
  website_url: ['Website URL', url],
  phone: ['Phone', phone],
  email: ['Email', email],
  primary_cta_label: ['Primary CTA Label', richText],
  primary_cta_url: ['Primary CTA URL', url]
};

async function getDistributionKit(partnerId) {
  const page = await findPartnerByPartnerId(partnerId);
  if (!page) { const error = new Error('Partner not found.'); error.status = 404; error.code = 'partner_not_found'; throw error; }
  return mapPartner(page, partnerId);
}

async function updateEditableProfile(partnerId, changes) {
  const page = await findPartnerByPartnerId(partnerId);
  if (!page) { const error = new Error('Partner not found.'); error.status = 404; error.code = 'partner_not_found'; throw error; }
  const properties = {};
  Object.keys(changes || {}).forEach((key) => {
    if (!EDITABLE[key]) return;
    if (changes[key] === '' || changes[key] === null || changes[key] === undefined) return;
    if (Array.isArray(changes[key]) && changes[key].length === 0) return;
    const [name, mapper] = EDITABLE[key];
    properties[name] = mapper(changes[key]);
  });
  if (!Object.keys(properties).length) { const error = new Error('No editable profile fields supplied.'); error.status = 400; error.code = 'no_editable_fields'; throw error; }
  await updatePage(page.id, { properties });
  return getDistributionKit(partnerId);
}

module.exports = { CAPITAL_BASE_URL, LEAD_FORM_BASE_URL, buildPublicUrl, buildLeadFormUrl, qrUrl, completeness, mapPartner, getDistributionKit, updateEditableProfile, EDITABLE };
