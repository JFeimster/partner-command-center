// Partner Command Center validation helpers
// Sprint 01: required-field and sensitive-data checks for future server-side routes.

'use strict';

const REQUIRED_PARTNER_FIELDS = [
  'partner_id',
  'name',
  'email',
  'partner_type',
  'audience',
  'status',
  'tier',
  'onboarding_path',
  'created_at',
  'updated_at'
];

const PARTNER_STATUSES = [
  'new',
  'intake_received',
  'needs_review',
  'approved',
  'active',
  'paused',
  'rejected',
  'archived'
];

const PARTNER_TYPES = [
  'funding_broker',
  'referral_partner',
  'affiliate_partner',
  'center_of_influence',
  'professional_service_provider',
  'community_connector',
  'internal_operator',
  'unknown'
];

const ONBOARDING_PATHS = [
  'broker_fast_start',
  'affiliate_launch_path',
  'referral_partner_path',
  'coi_relationship_path',
  'manual_review_path'
];

const TIERS = [
  'tier_1',
  'tier_2',
  'tier_3',
  'tier_4',
  'manual_review',
  'watchlist',
  'reject',
  'unknown'
];

const SENSITIVE_PATTERNS = [
  {
    code: 'possible_ssn',
    label: 'Possible SSN',
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/i
  },
  {
    code: 'possible_full_tax_id',
    label: 'Possible full tax ID or EIN',
    pattern: /\b\d{2}[-\s]?\d{7}\b/i
  },
  {
    code: 'bank_credentials',
    label: 'Possible bank credentials',
    pattern: /\b(password|passcode|login|username|routing\s*number|account\s*number|bank\s*login|plaid\s*credentials?)\b/i
  },
  {
    code: 'private_document',
    label: 'Possible private document request or upload',
    pattern: /\b(bank\s*statement|tax\s*return|driver'?s\s*license|passport|voided\s*check|private\s*document)\b/i
  },
  {
    code: 'underwriting_decision',
    label: 'Possible underwriting or approval decision language',
    pattern: /\b(approved\s*for|guaranteed\s*approval|guaranteed\s*funding|underwriting\s*decision|everyone\s*qualifies)\b/i
  }
];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function validateRequiredFields(input, requiredFields) {
  const fields = requiredFields || REQUIRED_PARTNER_FIELDS;
  const missing = fields.filter((field) => isBlank(input && input[field]));

  return {
    valid: missing.length === 0,
    missing
  };
}

function validateEmail(email) {
  if (isBlank(email)) {
    return { valid: false, reason: 'missing_email' };
  }

  const normalized = String(email).trim().toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);

  return {
    valid,
    normalized,
    ...(valid ? {} : { reason: 'invalid_email' })
  };
}

function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      field: fieldName,
      value,
      allowed: allowedValues
    };
  }

  return { valid: true };
}

function flattenStrings(value, path, output) {
  const currentPath = path || '$';
  const results = output || [];

  if (typeof value === 'string') {
    results.push({ path: currentPath, value });
    return results;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenStrings(item, `${currentPath}[${index}]`, results));
    return results;
  }

  if (isObject(value)) {
    Object.keys(value).forEach((key) => flattenStrings(value[key], `${currentPath}.${key}`, results));
  }

  return results;
}

function findSensitiveData(input) {
  const textFields = flattenStrings(input);
  const matches = [];

  textFields.forEach(({ path, value }) => {
    SENSITIVE_PATTERNS.forEach((rule) => {
      if (rule.pattern.test(value)) {
        matches.push({
          path,
          code: rule.code,
          label: rule.label
        });
      }
    });
  });

  return matches;
}

function validatePartnerForNotion(partner) {
  if (!isObject(partner)) {
    return {
      valid: false,
      errors: [{ code: 'invalid_partner_object', message: 'Partner payload must be an object.' }]
    };
  }

  const errors = [];
  const required = validateRequiredFields(partner);
  if (!required.valid) {
    errors.push({ code: 'missing_required_fields', fields: required.missing });
  }

  const emailResult = validateEmail(partner.email);
  if (!emailResult.valid) {
    errors.push({ code: emailResult.reason, field: 'email' });
  }

  [
    validateEnum(partner.status, PARTNER_STATUSES, 'status'),
    validateEnum(partner.partner_type, PARTNER_TYPES, 'partner_type'),
    validateEnum(partner.onboarding_path, ONBOARDING_PATHS, 'onboarding_path'),
    validateEnum(partner.tier, TIERS, 'tier')
  ].forEach((result) => {
    if (!result.valid) {
      errors.push({ code: 'invalid_enum', ...result });
    }
  });

  const sensitiveMatches = findSensitiveData(partner);
  if (sensitiveMatches.length > 0) {
    errors.push({ code: 'sensitive_data_detected', matches: sensitiveMatches });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function requireServerSide() {
  if (typeof window !== 'undefined') {
    throw new Error('This helper is server-side only. Do not import it into browser JavaScript.');
  }
}

module.exports = {
  REQUIRED_PARTNER_FIELDS,
  PARTNER_STATUSES,
  PARTNER_TYPES,
  ONBOARDING_PATHS,
  TIERS,
  SENSITIVE_PATTERNS,
  isObject,
  isBlank,
  validateRequiredFields,
  validateEmail,
  validateEnum,
  findSensitiveData,
  validatePartnerForNotion,
  requireServerSide
};
