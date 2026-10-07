import PostalMime from 'postal-mime';

function headerValue(headers, name) {
  const target = String(name || '').toLowerCase();
  const item = (headers || []).find((header) => String(header.key || '').toLowerCase() === target);
  return item ? item.value : '';
}

function apiConfig(env) {
  const base = String(env.INTAKE_API_BASE_URL || '').replace(/\/$/, '');
  if (!base || !env.PARTNER_COMMAND_API_KEY) {
    throw new Error('INTAKE_API_BASE_URL and PARTNER_COMMAND_API_KEY are required.');
  }
  return { base, key: env.PARTNER_COMMAND_API_KEY };
}

async function postAuthorized(env, path, payload) {
  const config = apiConfig(env);
  const response = await fetch(config.base + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + config.key
    },
    body: JSON.stringify(payload || {})
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error('Partner Command API returned ' + response.status + ': ' + body.slice(0, 500));
  }
  return body;
}

export default {
  async email(message, env) {
    const raw = await new Response(message.raw).arrayBuffer();
    const parsed = await PostalMime.parse(raw);
    const from = parsed.from?.address || message.from || '';
    const subject = parsed.subject || '';

    // Owner-only operational trigger used for immediate/manual reconciliation runs.
    // Normal forwarded emails continue through /api/intake-message.
    if (
      String(from).toLowerCase() === 'jasonfeimster@gmail.com' &&
      /^system:\s*reconcile applicants$/i.test(String(subject).trim())
    ) {
      await postAuthorized(env, '/api/reconcile-applicants?limit=500', {});
      return;
    }

    const payload = {
      source: 'cloudflare_email_worker',
      from,
      to: message.to || parsed.to?.map((entry) => entry.address).join(', ') || '',
      subject,
      text: parsed.text || '',
      html: parsed.html || '',
      message_id: parsed.messageId || headerValue(parsed.headers, 'message-id') || '',
      date: parsed.date || headerValue(parsed.headers, 'date') || '',
      reply_to: parsed.replyTo?.map((entry) => entry.address).join(', ') || '',
      in_reply_to: headerValue(parsed.headers, 'in-reply-to') || '',
      references: headerValue(parsed.headers, 'references') || '',
      attachments: (parsed.attachments || []).map((item) => ({
        filename: item.filename || '',
        mime_type: item.mimeType || '',
        disposition: item.disposition || '',
        content_id: item.contentId || '',
        size: item.content ? item.content.byteLength || item.content.length || null : null
      }))
    };

    await postAuthorized(env, '/api/intake-message', payload);
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(postAuthorized(env, '/api/reconcile-applicants?limit=500', {}));
  }
};
