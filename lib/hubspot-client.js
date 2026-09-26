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


function applicantContactProperties(applicant) {
  const names = splitName(applicant.name);
  const props = {
    email: clean(applicant.email).toLowerCase(),
    firstname: names.firstname,
    lastname: names.lastname,
    phone: clean(applicant.phone),
    company: clean(applicant.business_name),
    city: clean(applicant.city),
    state: clean(applicant.state)
  };
  Object.keys(props).forEach((key) => { if (!props[key]) delete props[key]; });
  return props;
}

async function upsertApplicantContact(applicant) {
  const email = clean(applicant && applicant.email).toLowerCase();
  if (!email) return { configured: isConfigured(), status: 'skipped', reason: 'missing_email' };
  if (!isConfigured()) return { configured: false, status: 'not_configured' };

  const existing = await findContactByEmail(email);
  const properties = applicantContactProperties(applicant);
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

async function findApplicantDeal(applicant) {
  if (!isConfigured()) return null;
  const email = clean(applicant.email).toLowerCase();
  const name = clean(applicant.name);
  const filters = [];
  if (email) filters.push({
    filters: [{ propertyName: 'description', operator: 'CONTAINS_TOKEN', value: email }]
  });
  if (name) filters.push({
    filters: [{ propertyName: 'dealname', operator: 'CONTAINS_TOKEN', value: name }]
  });
  if (!filters.length) return null;

  const result = await hubspotRequest('/crm/v3/objects/deals/search', {
    method: 'POST',
    body: {
      filterGroups: filters,
      properties: ['dealname', 'dealstage', 'pipeline', 'description', 'hs_next_step', 'hs_priority'],
      limit: 5
    }
  });
  return result && result.results && result.results[0] ? result.results[0] : null;
}

function applicantDealStage(status) {
  const value = clean(status).toLowerCase();
  if (/funded/.test(value)) return 'closedwon';
  if (/declin|closed|lost|withdrawn|not qualified/.test(value)) return 'closedlost';
  if (/review|underwriting/.test(value)) return 'decisionmakerboughtin';
  if (/incomplete|missing|waiting/.test(value)) return 'presentationscheduled';
  return 'qualifiedtobuy';
}

async function upsertApplicantDeal(applicant, contactId) {
  if (!isConfigured()) return { configured: false, status: 'not_configured' };
  const existing = await findApplicantDeal(applicant);
  const dealName = (clean(applicant.name) || clean(applicant.email)) + ' | Funding Applicant | ' + clean(applicant.route_detected || 'Unknown');
  const description = [
    'Source: ' + clean(applicant.source || 'forwarded_email'),
    'Original email subject: ' + clean(applicant.email_subject),
    'Applicant email: ' + clean(applicant.email),
    'Phone: ' + clean(applicant.phone),
    'Business name: ' + clean(applicant.business_name || 'Not yet confirmed'),
    'Route detected: ' + clean(applicant.route_detected || 'Unknown'),
    'Monthly revenue: ' + clean(applicant.monthly_revenue || 'Unknown'),
    'Desired funding: ' + clean(applicant.desired_funding_amount || 'Unknown'),
    'City/State: ' + [clean(applicant.city), clean(applicant.state)].filter(Boolean).join(', '),
    'Current status: ' + clean(applicant.status || 'Unknown'),
    'External event ID: ' + clean(applicant.external_event_id)
  ].join('\n');

  const properties = {
    dealname: dealName,
    dealstage: applicantDealStage(applicant.status),
    pipeline: 'default',
    dealtype: 'newbusiness',
    description,
    hs_next_step: /funded|closed/i.test(clean(applicant.status)) ? 'None' : 'Review latest applicant notification'
  };

  let deal;
  let status;
  let writeMode = 'full';
  try {
    if (existing) {
      deal = await hubspotRequest('/crm/v3/objects/deals/' + existing.id, {
        method: 'PATCH',
        body: { properties }
      });
      status = 'updated';
    } else {
      deal = await hubspotRequest('/crm/v3/objects/deals', {
        method: 'POST',
        body: { properties }
      });
      status = 'created';
    }
  } catch (error) {
    if (error && error.code === 'hubspot_error' && error.status === 400) {
      const minimalProperties = {
        dealname: properties.dealname,
        dealstage: properties.dealstage,
        pipeline: properties.pipeline,
        description: properties.description
      };
      writeMode = 'minimal_fallback';
      if (existing) {
        deal = await hubspotRequest('/crm/v3/objects/deals/' + existing.id, {
          method: 'PATCH',
          body: { properties: minimalProperties }
        });
        status = 'updated';
      } else {
        deal = await hubspotRequest('/crm/v3/objects/deals', {
          method: 'POST',
          body: { properties: minimalProperties }
        });
        status = 'created';
      }
    } else {
      throw error;
    }
  }

  let association = 'not_requested';
  if (contactId && deal && deal.id) {
    try {
      await hubspotRequest('/crm/v3/objects/deals/' + deal.id + '/associations/contacts/' + contactId + '/deal_to_contact', {
        method: 'PUT'
      });
      association = 'created';
    } catch (_) {
      association = 'failed';
    }
  }

  return {
    configured: true,
    status,
    deal_id: deal.id || (existing && existing.id),
    contact_association: association,
    write_mode: writeMode
  };
}

module.exports = {
  isConfigured,
  hubspotRequest,
  findContactByEmail,
  upsertContact,
  createTask,
  upsertApplicantContact,
  upsertApplicantDeal
};
