'use strict';

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function token() {
  return clean(process.env.HUBSPOT_PRIVATE_APP_TOKEN);
}

function isConfigured() {
  return Boolean(token());
}

async function hubspotRequest(path, options) {
  if (!isConfigured()) {
    const error = new Error('HUBSPOT_PRIVATE_APP_TOKEN is not configured.');
    error.code = 'hubspot_not_configured';
    throw error;
  }

  const response = await fetch('https://api.hubapi.com' + path, {
    method: (options && options.method) || 'GET',
    headers: {
      Authorization: 'Bearer ' + token(),
      'Content-Type': 'application/json'
    },
    ...(options && options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
  });

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (error) { data = { raw: text }; }

  if (!response.ok) {
    const error = new Error(data && data.message ? data.message : 'HubSpot request failed.');
    error.code = 'hubspot_error';
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

async function findContactByEmail(email) {
  const normalized = clean(email).toLowerCase();
  if (!normalized) return null;

  const result = await hubspotRequest('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: {
      filterGroups: [{
        filters: [{ propertyName: 'email', operator: 'EQ', value: normalized }]
      }],
      properties: ['email', 'firstname', 'lastname', 'phone', 'company', 'partnercode', 'partnerstatus', 'referralsource'],
      limit: 1
    }
  });

  return result && result.results && result.results[0] ? result.results[0] : null;
}

function splitName(name) {
  const parts = clean(name).split(/\s+/).filter(Boolean);
  return {
    firstname: parts.shift() || '',
    lastname: parts.join(' ')
  };
}

function contactProperties(partner) {
  const names = splitName(partner.name);
  const props = {
    email: clean(partner.email).toLowerCase(),
    firstname: clean(partner.first_name || names.firstname),
    lastname: clean(partner.last_name || names.lastname),
    phone: clean(partner.phone),
    company: clean(partner.company),
    partnercode: clean(partner.partner_id || partner.referral_code),
    partnerstatus: clean(partner.status || 'Active'),
    referralsource: clean(partner.referral_source || partner.source || '')
  };

  Object.keys(props).forEach((key) => {
    if (!props[key]) delete props[key];
  });
  return props;
}

async function upsertContact(partner) {
  const email = clean(partner && partner.email).toLowerCase();
  if (!email) {
    return { configured: isConfigured(), status: 'skipped', reason: 'missing_email' };
  }
  if (!isConfigured()) return { configured: false, status: 'not_configured' };

  const existing = await findContactByEmail(email);
  const properties = contactProperties(partner);

  if (existing) {
    const updated = await hubspotRequest('/crm/v3/objects/contacts/' + existing.id, {
      method: 'PATCH',
      body: { properties }
    });
    return { configured: true, status: 'updated', contact_id: updated.id || existing.id };
  }

  const created = await hubspotRequest('/crm/v3/objects/contacts', {
    method: 'POST',
    body: { properties }
  });
  return { configured: true, status: 'created', contact_id: created.id };
}

async function createTask(task, contactId) {
  if (!isConfigured()) return { configured: false, status: 'not_configured' };

  const due = clean(task.due_at) || new Date(Date.now() + 86400000).toISOString();
  const created = await hubspotRequest('/crm/v3/objects/tasks', {
    method: 'POST',
    body: {
      properties: {
        hs_task_subject: clean(task.subject || 'Partner follow-up'),
        hs_task_body: clean(task.body || task.notes || ''),
        hs_timestamp: due,
        hs_task_status: clean(task.status || 'NOT_STARTED'),
        hs_task_priority: clean(task.priority || 'MEDIUM'),
        hs_task_type: clean(task.type || 'TODO')
      }
    }
  });

  let association = 'not_requested';
  if (contactId && created && created.id) {
    try {
      await hubspotRequest('/crm/v3/objects/tasks/' + created.id + '/associations/contacts/' + contactId + '/task_to_contact', {
        method: 'PUT'
      });
      association = 'created';
    } catch (error) {
      association = 'failed';
    }
  }

  return {
    configured: true,
    status: 'created',
    task_id: created.id,
    contact_association: association
  };
}

module.exports = {
  isConfigured,
  hubspotRequest,
  findContactByEmail,
  upsertContact,
  createTask
};
