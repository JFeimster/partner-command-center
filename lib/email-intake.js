'use strict';

const crypto = require('crypto');

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|td|table|section|article|blockquote|h[1-6])\s*>/gi, '\n')
    .replace(/<(?:p|div|li|tr|td|table|section|article|blockquote|h[1-6])(?:\s[^>]*)?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
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
  const matches = String(text || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig) || [];
  return matches.map((value) => value.toLowerCase()).find((value) =>
    value !== 'intake@myfunding.site' &&
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
      const match = line.match(new RegExp('^' + label + '\\s*[:\\-]\\s*(.+)
function classify(input) {
  const recipient = clean(input.to || input.recipient || input.envelope_to).toLowerCase();
  const haystack = [recipient, input.from, input.subject, messageText(input)].join(' ').toLowerCase();

  if (/applicant|funding@|funding applicant|application incomplete|submission started|client file closed|bankbreezy|giggle finance|funded|under review|funding for any reason|desired amount of funding|primary email/.test(haystack)) {
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
  const qa = extractQuestionAnswerPairs(text);

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
  else if (/tally\.so|new tally form submission/.test(lower)) routeDetected = 'Tally Funding Intake';

  const firstName = cleanLinkedAnswer(answerFor(qa, [/what is your first name/]));
  const lastName = cleanLinkedAnswer(answerFor(qa, [/what is your last name/]));
  const qaName = [firstName, lastName].filter(Boolean).join(' ');
  const name = extractLabeled(text, ['name', 'applicant', 'customer', 'full name']) || qaName;

  const qaEmail = cleanLinkedAnswer(answerFor(qa, [/primary email/, /^email$/, /email address/]));
  const email = extractLabeled(text, ['email', 'email address']) || qaEmail || firstEmail(text);

  const qaPhone = cleanLinkedAnswer(answerFor(qa, [/phone number/, /^phone$/, /mobile/]));
  const phone = extractLabeled(text, ['phone', 'phone number', 'mobile']) || qaPhone || firstPhone(text);

  const businessName = extractLabeled(text, ['business name', 'company', 'business']);
  const revenue = extractLabeled(text, ['monthly revenue', 'revenue']);
  const desiredFunding = cleanLinkedAnswer(answerFor(qa, [/desired amount of funding/, /funding amount/]));
  const city = cleanLinkedAnswer(answerFor(qa, [/^city$/]));
  const state = cleanLinkedAnswer(answerFor(qa, [/^state$/]));

  return {
    name, email, phone, businessName, revenue, desiredFunding, city, state,
    status, routeDetected, question_answers: qa, raw_text: text
  };
}

module.exports = {
  clean, stripHtml, messageText, firstEmail, firstPhone, extractLabeled,
  normalizeWhitespace, looksLikeQuestion, extractQuestionAnswerPairs, answerFor, cleanLinkedAnswer,
  classify, externalId, parseApplicant
};
, 'i'));
      if (match) return match[1].trim();
    }
  }
  return '';
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

function looksLikeQuestion(line) {
  const value = normalizeWhitespace(line);
  return Boolean(value && (/[?]$/.test(value) || /^(?:desired amount of funding|phone number|primary email|birth date|address|city|state|zip code)$/i.test(value)));
}

function extractQuestionAnswerPairs(text) {
  const lines = String(text || '').split(/\r?\n/).map(normalizeWhitespace).filter(Boolean);
  const pairs = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!looksLikeQuestion(lines[i])) continue;
    const answer = lines[i + 1] && !looksLikeQuestion(lines[i + 1]) ? lines[i + 1] : '';
    if (!answer) continue;
    pairs.push({ question: lines[i], answer });
    i += 1;
  }
  return pairs;
}

function answerFor(pairs, patterns) {
  for (const pair of pairs || []) {
    const q = normalizeWhitespace(pair.question).toLowerCase();
    if ((patterns || []).some((pattern) => pattern.test(q))) return normalizeWhitespace(pair.answer);
  }
  return '';
}

function cleanLinkedAnswer(value) {
  const text = normalizeWhitespace(value);
  const markdown = text.match(/^\[([^\]]+)\]\([^)]*\)$/);
  return markdown ? markdown[1].trim() : text;
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
