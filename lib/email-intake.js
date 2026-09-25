'use strict';

const crypto = require('crypto');

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function stripHtml(value) {
  return clean(value)
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function messageText(input) {
  return [
    clean(input.text),
    clean(input.body_text),
    clean(input.body),
    stripHtml(input.html),
    clean(input.raw_text)
  ].filter(Boolean).join('\n');
}

function firstEmail(text) {
  const matches = clean(text).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig) || [];
  return matches.map((value) => value.toLowerCase()).find((value) =>
    !/davidallencapital\.com|tally\.so|hubspot\.com|postmarkapp\.com|cloudflare\.com/.test(value)
  ) || '';
}

function firstPhone(text) {
  const match = clean(text).match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/);
  return match ? match[0].trim() : '';
}

function extractLabeled(text, labels) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    for (const label of labels) {
      const match = line.match(new RegExp('^' + label + '\\s*[:\\-]\\s*(.+)$', 'i'));
      if (match) return match[1].trim();
    }
  }
  return '';
}

function classify(input) {
  const recipient = clean(input.to || input.recipient || input.envelope_to).toLowerCase();
  const haystack = [recipient, input.from, input.subject, messageText(input)].join(' ').toLowerCase();

  if (/applicant|funding@|funding applicant|application incomplete|submission started|client file closed|bankbreezy|giggle finance|funded|under review/.test(haystack)) {
    return { type: 'applicant', confidence: 'high', reason: 'applicant_signal' };
  }

  if (/partner|affiliate|broker|agent enrollment|enrolled a dac broker|david allen capital|referral partner|partner signup/.test(haystack)) {
    return { type: 'partner', confidence: 'high', reason: 'partner_signal' };
  }

  return { type: 'unknown', confidence: 'low', reason: 'no_confident_signal' };
}

function externalId(input) {
  const supplied = clean(input.message_id || input.internet_message_id || input.external_event_id);
  if (supplied) return supplied.slice(0, 200);
  return 'mail_' + crypto.createHash('sha256')
    .update([clean(input.from), clean(input.to), clean(input.subject), clean(input.date), messageText(input)].join('|'))
    .digest('hex').slice(0, 24);
}

function parseApplicant(input) {
  const text = messageText(input);
  const lower = [input.subject, text].join(' ').toLowerCase();
  let status = 'Unknown';
  if (/submission started/.test(lower)) status = 'Submission started';
  else if (/application incomplete|incomplete application/.test(lower)) status = 'Application incomplete';
  else if (/client file closed/.test(lower)) status = 'Client file closed';
  else if (/funded/.test(lower)) status = 'Funded';
  else if (/approved/.test(lower)) status = 'Approved';
  else if (/under review|in review|underwriting/.test(lower)) status = 'Under review';

  let routeDetected = 'Unknown';
  if (/giggle/.test(lower)) routeDetected = 'Giggle Finance';
  else if (/bankbreezy/.test(lower)) routeDetected = 'BankBreezy';

  const name = extractLabeled(text, ['name', 'applicant', 'customer', 'full name']);
  const email = extractLabeled(text, ['email', 'email address']) || firstEmail(text);
  const phone = extractLabeled(text, ['phone', 'phone number', 'mobile']) || firstPhone(text);
  const businessName = extractLabeled(text, ['business name', 'company', 'business']);
  const revenue = extractLabeled(text, ['monthly revenue', 'revenue']);

  return { name, email, phone, businessName, revenue, status, routeDetected, raw_text: text };
}

module.exports = {
  clean, stripHtml, messageText, firstEmail, firstPhone, extractLabeled,
  classify, externalId, parseApplicant
};
