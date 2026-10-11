'use strict';

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function token() {
  return clean(process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN);
}

function isConfigured() {
  return Boolean(token());
}

async function hubspotRequest(path, options) {
  if (!isConfigured()) {
    const error = new Error('HubSpot access token is not configured. Set HUBSPOT_PRIVATE_APP_TOKEN or HUBSPOT_ACCESS_TOKEN.');
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

  try {
    const created = await hubspotRequest('/crm/v3/objects/contacts', {
      method: 'POST',
      body: { properties }
    });
    return { configured: true, status: 'created', contact_id: created.id };
  } catch (error) {
    if (error && error.code === 'hubspot_error' && error.status === 409) {
      const raced = await findContactByEmail(email);
      if (raced) {
        const safeProperties = safeApplicantContactUpdateProperties(raced, properties);
        if (Object.keys(safeProperties).length) {
          const updated = await hubspotRequest('/crm/v3/objects/contacts/' + raced.id, {
            method: 'PATCH',
            body: { properties: safeProperties }
          });
          return { configured: true, status: 'updated_after_conflict', contact_id: updated.id || raced.id, stale_safe: true };
        }
        return { configured: true, status: 'preserved_after_conflict', contact_id: raced.id, stale_safe: true };
      }
    }
    throw error;
  }
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

function safeApplicantContactUpdateProperties(existing, incoming) {
  const current = existing && existing.properties ? existing.properties : {};
  const safe = {};
  Object.entries(incoming || {}).forEach(([key, value]) => {
    if (key === 'email') return;
    if (!clean(current[key]) && clean(value)) safe[key] = value;
  });
  return safe;
}

async function upsertApplicantContact(applicant) {
  const email = clean(applicant && applicant.email).toLowerCase();
  if (!email) return { configured: isConfigured(), status: 'skipped', reason: 'missing_email' };
  if (!isConfigured()) return { configured: false, status: 'not_configured' };

  const existing = await findContactByEmail(email);
  const properties = applicantContactProperties(applicant);
  if (existing) {
    const safeProperties = safeApplicantContactUpdateProperties(existing, properties);
    if (!Object.keys(safeProperties).length) {
      return { configured: true, status: 'preserved', contact_id: existing.id, stale_safe: true };
    }
    const updated = await hubspotRequest('/crm/v3/objects/contacts/' + existing.id, {
      method: 'PATCH',
      body: { properties: safeProperties }
    });
    return { configured: true, status: 'updated', contact_id: updated.id || existing.id, stale_safe: true };
  }

  try {
    const created = await hubspotRequest('/crm/v3/objects/contacts', {
      method: 'POST',
      body: { properties }
    });
    return { configured: true, status: 'created', contact_id: created.id };
  } catch (error) {
    if (!error || error.code !== 'hubspot_error' || error.status !== 409) throw error;
    const raced = await findContactByEmail(email);
    if (!raced) throw error;
    const safeProperties = safeApplicantContactUpdateProperties(raced, properties);
    if (!Object.keys(safeProperties).length) {
      return { configured: true, status: 'preserved_after_conflict', contact_id: raced.id, stale_safe: true };
    }
    const updated = await hubspotRequest('/crm/v3/objects/contacts/' + raced.id, {
      method: 'PATCH',
      body: { properties: safeProperties }
    });
    return { configured: true, status: 'updated_after_conflict', contact_id: updated.id || raced.id, stale_safe: true };
  }
}

async function archiveCrmObject(objectType, objectId) {
  const type = clean(objectType);
  const id = clean(objectId);
  if (!type || !id || !isConfigured()) return { configured: isConfigured(), status: 'skipped' };
  await hubspotRequest('/crm/v3/objects/' + encodeURIComponent(type) + '/' + encodeURIComponent(id), {
    method: 'DELETE'
  });
  return { configured: true, status: 'archived', object_type: type, object_id: id };
}

async function getDealById(dealId) {
  const id = clean(dealId);
  if (!id || !isConfigured()) return null;
  try {
    return await hubspotRequest('/crm/v3/objects/deals/' + encodeURIComponent(id) + '?properties=dealname,dealstage,pipeline,description,hs_next_step,hs_priority');
  } catch (error) {
    if (error && error.code === 'hubspot_error' && error.status === 404) return null;
    throw error;
  }
}

function parseDealEventTimestamp(deal) {
  const description = clean(deal && deal.properties && deal.properties.description);
  const match = description.match(/Original email date:\s*([^\n]+)/i);
  if (!match || !match[1]) return null;
  const parsed = Date.parse(match[1].replace(/\s+at\s+/i, ' '));
  return Number.isFinite(parsed) ? parsed : null;
}

async function findApplicantDeals(applicant) {
  if (!isConfigured()) return [];
  const email = clean(applicant.email).toLowerCase();
  const name = clean(applicant.name);
  const filters = [];
  if (email) filters.push({ filters: [{ propertyName: 'description', operator: 'CONTAINS_TOKEN', value: email }] });
  if (!email && name) filters.push({ filters: [{ propertyName: 'dealname', operator: 'CONTAINS_TOKEN', value: name }] });
  if (!filters.length) return [];

  const result = await hubspotRequest('/crm/v3/objects/deals/search', {
    method: 'POST',
    body: {
      filterGroups: filters,
      properties: ['dealname', 'dealstage', 'pipeline', 'description', 'hs_next_step', 'hs_priority'],
      limit: 100
    }
  });
  return result && Array.isArray(result.results) ? result.results : [];
}

async function findApplicantDeal(applicant, options) {
  if (!isConfigured()) return null;
  const email = clean(applicant && applicant.email).toLowerCase();

  const preferredDealId = clean(options && options.preferred_deal_id);
  if (preferredDealId) {
    const preferred = await getDealById(preferredDealId);
    if (preferred) return { ...preferred, _match_strategy: 'preferred_deal_id' };
  }

  const candidates = await findApplicantDeals(applicant);
  if (!candidates.length) return null;

  const eventId = clean(applicant.external_event_id);
  if (eventId) {
    const exact = candidates.filter((deal) => clean(deal.properties && deal.properties.description).includes('External event ID: ' + eventId));
    if (exact.length === 1) return { ...exact[0], _match_strategy: 'external_event_id' };
    if (exact.length > 1) {
      const error = new Error('Multiple HubSpot deals match the same source email event.');
      error.code = 'hubspot_applicant_deal_ambiguous';
      error.status = 409;
      throw error;
    }
  }

  const eventTime = Date.parse(clean(applicant && applicant.email_date).replace(/\s+at\s+/i, ' '));
  if (options && options.case_start && Number.isFinite(eventTime)) {
    const mergeWindow = 36 * 60 * 60 * 1000;
    const sameCase = candidates
      .map((deal) => ({ deal, ts: parseDealEventTimestamp(deal) }))
      .filter((item) => item.ts !== null && Math.abs(item.ts - eventTime) <= mergeWindow)
      .sort((a, b) => Math.abs(a.ts - eventTime) - Math.abs(b.ts - eventTime));
    if (sameCase.length === 1) return { ...sameCase[0].deal, _match_strategy: 'case_start_window' };
    if (sameCase.length > 1) {
      const error = new Error('Multiple HubSpot deals match the applicant case start; an exact event match is required before updating.');
      error.code = 'hubspot_applicant_deal_ambiguous';
      error.status = 409;
      throw error;
    }
    return null;
  }

  if (candidates.length === 1) return { ...candidates[0], _match_strategy: email ? 'unique_applicant_email' : 'unique_applicant_name' };
  const error = new Error('Multiple HubSpot deals match this applicant; an exact source event match is required before updating.');
  error.code = 'hubspot_applicant_deal_ambiguous';
  error.status = 409;
  throw error;
}

function applicantDealStage(status) {
  const value = clean(status).toLowerCase();
  if (/funded/.test(value)) return 'closedwon';
  if (/declin|closed|lost|withdrawn|not qualified/.test(value)) return 'closedlost';
  if (/review|underwriting/.test(value)) return 'decisionmakerboughtin';
  if (/incomplete|missing|waiting/.test(value)) return 'presentationscheduled';
  return 'qualifiedtobuy';
}

async function upsertApplicantDeal(applicant, contactId, options) {
  if (!isConfigured()) return { configured: false, status: 'not_configured' };
  const existing = await findApplicantDeal(applicant, options || {});
  const dealName = (clean(applicant.name) || clean(applicant.email)) + ' | Funding Applicant | ' + clean(applicant.route_detected || 'Unknown');
  const description = [
    'Source: ' + clean(applicant.source || 'forwarded_email'),
    'Original email subject: ' + clean(applicant.email_subject),
    'Original email date: ' + clean(applicant.email_date),
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
  let updateProperties = properties;
  if (existing) {
    const incomingEventTime = Date.parse(clean(applicant.email_date).replace(/\s+at\s+/i, ' '));
    const existingEventTime = parseDealEventTimestamp(existing);
    const canAdvanceStage = Number.isFinite(incomingEventTime) &&
      (existingEventTime === null || incomingEventTime >= existingEventTime);
    updateProperties = {
      description: properties.description,
      hs_next_step: properties.hs_next_step,
      ...(canAdvanceStage ? { dealstage: properties.dealstage } : {})
    };
  }

  let deal;
  let status;
  let writeMode = 'full';
  try {
    if (existing) {
      deal = await hubspotRequest('/crm/v3/objects/deals/' + existing.id, {
        method: 'PATCH',
        body: { properties: updateProperties }
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
    if (error && error.code === 'hubspot_error' && error.status === 409 && !existing) {
      const raced = await findApplicantDeal(applicant, options || {});
      if (!raced) throw error;
      const incomingEventTime = Date.parse(clean(applicant.email_date).replace(/\s+at\s+/i, ' '));
      const racedEventTime = parseDealEventTimestamp(raced);
      const canAdvanceStage = Number.isFinite(incomingEventTime) &&
        (racedEventTime === null || incomingEventTime >= racedEventTime);
      const conflictProperties = {
        description: properties.description,
        hs_next_step: properties.hs_next_step,
        ...(canAdvanceStage ? { dealstage: properties.dealstage } : {})
      };
      deal = await hubspotRequest('/crm/v3/objects/deals/' + raced.id, {
        method: 'PATCH',
        body: { properties: conflictProperties }
      });
      status = 'updated_after_conflict';
    } else if (error && error.code === 'hubspot_error' && error.status === 400) {
      const minimalProperties = existing
        ? {
            description: properties.description,
            ...(updateProperties.dealstage ? { dealstage: updateProperties.dealstage } : {})
          }
        : {
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
    } catch (error) {
      throw error;
    }
  }

  return {
    configured: true,
    status,
    deal_id: deal.id || (existing && existing.id),
    contact_association: association,
    write_mode: writeMode,
    match_strategy: existing && existing._match_strategy ? existing._match_strategy : 'created_new'
  };
}

module.exports = {
  isConfigured,
  hubspotRequest,
  findContactByEmail,
  upsertContact,
  createTask,
  safeApplicantContactUpdateProperties,
  upsertApplicantContact,
  archiveCrmObject,
  getDealById,
  parseDealEventTimestamp,
  findApplicantDeals,
  findApplicantDeal,
  upsertApplicantDeal
};
