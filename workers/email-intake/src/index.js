import PostalMime from 'postal-mime';

function headerValue(headers, name) {
  const target = String(name || '').toLowerCase();
  const item = (headers || []).find((header) => String(header.key || '').toLowerCase() === target);
  return item ? item.value : '';
}

export default {
  async email(message, env) {
    const raw = await new Response(message.raw).arrayBuffer();
    const parsed = await PostalMime.parse(raw);

    const payload = {
      source: 'cloudflare_email_worker',
      from: parsed.from?.address || message.from || '',
      to: message.to || parsed.to?.map((entry) => entry.address).join(', ') || '',
      subject: parsed.subject || '',
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

    const base = String(env.INTAKE_API_BASE_URL || '').replace(/\/$/, '');
    if (!base || !env.PARTNER_COMMAND_API_KEY) {
      throw new Error('INTAKE_API_BASE_URL and PARTNER_COMMAND_API_KEY are required.');
    }

    const response = await fetch(base + '/api/intake-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.PARTNER_COMMAND_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error('Intake API returned ' + response.status + ': ' + body.slice(0, 500));
    }
  }
};
