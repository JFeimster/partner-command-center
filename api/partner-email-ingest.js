// GPT/API Action: ingestPartnerEmail
// Converts forwarded/provider notification email payloads into the canonical partner event flow.

'use strict';

const crypto = require('crypto');
const partnerEvents = require('./partner-events');
const { validationError, unauthorized, methodNotAllowed, sendJson } = require('../lib/response');
const { clean, isAuthorized, parseBody } = require('../lib/action-auth');

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|td|table|section|article|blockquote|h[1-6])\s*>/gi, '\n')
    .replace(/<(?:p|div|li|tr|td|table|section|article|blockquote|h[1-6])(?:\s[^>]*)?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function allEmails(text) {
  return Array.from(new Set((String(text || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig) || [])
    .map((value) => value.toLowerCase())));
}

function firstEmail(text) {
  return allEmails(text)[0] || '';
}

function firstNonProviderEmail(text, inputFrom) {
  const sender = clean(inputFrom).toLowerCase();
  return allEmails(text).find((value) =>
    value !== sender &&
    !/@(?:davidallencapital\.com|sendgrid\.net)$/i.test(value)
  ) || '';
}

function firstPhone(text) {
  const match = clean(text).match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/);
  return match ? match[0].trim() : '';
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function extractLabeled(text, labels, stopLabels) {
  const source = String(text || '').replace(/\r/g, '');
  const allStops = Array.from(new Set([...(stopLabels || []), ...(labels || [])]))
    .map(escapeRegex)
    .sort((a, b) => b.length - a.length);

  for (const label of labels || []) {
    const escaped = escapeRegex(label);
    const stopPattern = allStops.length
      ? '(?=\\s*(?:' + allStops.join('|') + ')\\s*[:\\-]|\\n|$)'
      : '(?=\\n|$)';
    const re = new RegExp('(?:^|\\n|\\s)' + escaped + '\\s*[:\\-]\\s*(.+?)' + stopPattern, 'i');
    const match = source.match(re);
    if (match && match[1]) return match[1].trim();
  }
  return '';
}

function providerFromEmail(from, subject, body) {
  const haystack = [from, subject, body].join(' ').toLowerCase();
  if (/david\s*allen\s*capital|davidallencapital\.com|dac broker/.test(haystack)) return 'david_allen_capital';
  if (/tally\.so|tally form/.test(haystack)) return 'tally';
  return 'email_provider';
}

function parsePartnerNotification(input) {
  const rawText = [input.text, input.body_text, input.body, stripHtml(input.html)].filter(Boolean).join('\n');
  const provider = providerFromEmail(input.from, input.subject, rawText);

  const identityLabels = [
    'broker name', 'agent name', 'full name', 'name',
    'broker phone', 'agent phone', 'phone number', 'phone', 'mobile',
    'broker e-mail', 'broker email', 'agent e-mail', 'agent email', 'email address', 'email'
  ];

  let name = extractLabeled(rawText, ['broker name', 'agent name', 'full name', 'name'], identityLabels);
  const labeledEmail = extractLabeled(
    rawText,
    ['broker e-mail', 'broker email', 'agent e-mail', 'agent email', 'email address', 'email'],
    identityLabels
  );
  const email = labeledEmail || (provider === 'david_allen_capital'
    ? firstNonProviderEmail(rawText, input.from)
    : firstEmail(rawText));
  const phone = extractLabeled(
    rawText,
    ['broker phone', 'agent phone', 'phone number', 'phone', 'mobile'],
    identityLabels
  ) || firstPhone(rawText);


  return {
    provider,
    partner: { name, email, phone },
    raw_text: rawText
  };
}

function externalId(input) {
  const supplied = clean(input.message_id || input.external_event_id || input.internet_message_id);
  if (supplied) return supplied;
  return 'email_' + crypto.createHash('sha256')
    .update([clean(input.from), clean(input.subject), clean(input.date), clean(input.text || input.body || input.html)].join('|'))
    .digest('hex').slice(0, 24);
}

module.exports = async function partnerEmailIngest(req, res) {
  if (!req || req.method !== 'POST') return sendJson(res, methodNotAllowed(req && req.method, ['POST']));
  if (!isAuthorized(req)) return sendJson(res, unauthorized('Trusted API key is required.'));

  let body;
  try { body = parseBody(req); } catch (error) { return sendJson(res, validationError('Invalid JSON request body.')); }

  const parsed = parsePartnerNotification(body || {});
  if (!parsed.partner.email) {
    return sendJson(res, validationError('Could not extract a partner email from the forwarded notification.', {
      supported: ['structured email payload with from/subject/text/html', 'DAC enrollment-style notifications']
    }));
  }

  req.body = {
    event_type: clean(body.event_type || 'partner_enrollment_notification'),
    source: 'email',
    provider: parsed.provider,
    external_event_id: externalId(body),
    partner: {
      name: parsed.partner.name || parsed.partner.email,
      email: parsed.partner.email,
      phone: parsed.partner.phone
    },
    summary: clean(body.summary || ('Partner notification ingested from ' + parsed.provider + '.')),
    metadata: {
      email_from: clean(body.from),
      email_subject: clean(body.subject),
      email_date: clean(body.date),
      notification_type: clean(body.notification_type || 'enrollment_or_update_notification')
    }
  };

  return partnerEvents(req, res);
};

module.exports._private = { stripHtml, allEmails, firstEmail, firstNonProviderEmail, firstPhone, escapeRegex, extractLabeled, providerFromEmail, parsePartnerNotification, externalId };
