// Partner Command Center — lead validation helpers
// Sprint 05: validate partner-submitted business lead payloads before routing.

'use strict';

const RESTRICTED_PATTERNS = [
  { code: 'possible_ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
  { code: 'possible_full_tax_id', pattern: /\b\d{2}-\d{7}\b/ },
  { code: 'bank_credentials', pattern: /\b(password|passcode|bank login|online banking|routing number|account number)\b/i },
  { code: 'private_document', pattern: /\b(bank statement|tax return|driver license|passport|voided check|private document)\b/i },
  { code: 'guarantee_language', pattern: /\b(guaranteed approval|guaranteed funding|everyone qualifies|no one gets declined|sure approval)\b/i }
];

const REQUIRED_FIELDS = ['partner_id', 'business_name', 'contact_name', 'email', 'monthly_revenue', 'funding_need', 'use_of_funds'];

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function numberValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = clean(value).replace(/[$,]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function emailIsValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value));
}

function flattenStrings(value, output) {
  const list = output || [];
  if (value === null || value === undefined) return list;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    list.push(String(value));
    return list;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => flattenStrings(item, list));
    return list;
  }
  if (typeof value === 'object') {
    Object.keys(value).forEach((key) => flattenStrings(value[key], list));
  }
  return list;
}

function findRestrictedContent(payload) {
  const haystack = flattenStrings(payload || {}).join('\n');
  return RESTRICTED_PATTERNS.filter((rule) => rule.pattern.test(haystack)).map((rule) => rule.code);
}

function normalizeLead(input) {
  const source = input || {};
  const monthlyRevenue = numberValue(source.monthly_revenue || source.monthlyRevenue);
  const fundingNeed = numberValue(source.funding_need || source.fundingNeed);

  return {
    partner_id: clean(source.partner_id || source.partnerId),
    business_name: clean(source.business_name || source.businessName),
    contact_name: clean(source.contact_name || source.contactName),
    email: clean(source.email).toLowerCase(),
    phone: clean(source.phone),
    industry: clean(source.industry),
    monthly_revenue: monthlyRevenue,
    time_in_business: clean(source.time_in_business || source.timeInBusiness),
    funding_need: fundingNeed,
    use_of_funds: clean(source.use_of_funds || source.useOfFunds),
    urgency: clean(source.urgency),
    source: clean(source.source || 'partner_dashboard'),
    notes: clean(source.notes),
    created_at: source.created_at || source.createdAt || new Date().toISOString()
  };
}

function validateLead(input) {
  const lead = normalizeLead(input || {});
  const errors = [];

  REQUIRED_FIELDS.forEach((field) => {
    if (field === 'monthly_revenue' || field === 'funding_need') {
      if (Number(lead[field]) <= 0) errors.push({ field, message: field + ' must be greater than 0.' });
      return;
    }
    if (!lead[field]) errors.push({ field, message: field + ' is required.' });
  });

  if (lead.email && !emailIsValid(lead.email)) errors.push({ field: 'email', message: 'email must be valid.' });
  if (lead.funding_need > 5000000) errors.push({ field: 'funding_need', message: 'funding_need exceeds the Sprint 05 review threshold.' });

  const restricted = findRestrictedContent(input || {});
  restricted.forEach((code) => errors.push({ field: 'payload', code, message: 'Restricted or sensitive content detected.' }));

  return {
    valid: errors.length === 0,
    errors,
    lead
  };
}

module.exports = {
  REQUIRED_FIELDS,
  RESTRICTED_PATTERNS,
  clean,
  numberValue,
  normalizeLead,
  validateLead,
  findRestrictedContent
};
