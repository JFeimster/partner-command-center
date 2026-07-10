'use strict';

const { findPartnerByPartnerId, queryDatabase } = require('./notion-client');

function clean(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function firstProperty(page, names) {
  const properties = page && page.properties ? page.properties : {};
  for (const name of names) {
    if (properties[name]) return properties[name];
  }
  return null;
}

function plain(property) {
  if (!property) return null;
  if (Array.isArray(property.title)) return property.title.map((item) => item.plain_text || item.text && item.text.content || '').join('').trim() || null;
  if (Array.isArray(property.rich_text)) return property.rich_text.map((item) => item.plain_text || item.text && item.text.content || '').join('').trim() || null;
  if (property.select) return property.select.name || null;
  if (property.status) return property.status.name || null;
  if (property.email !== undefined) return property.email || null;
  if (property.phone_number !== undefined) return property.phone_number || null;
  if (property.url !== undefined) return property.url || null;
  if (property.number !== undefined) return Number.isFinite(property.number) ? property.number : null;
  if (property.checkbox !== undefined) return Boolean(property.checkbox);
  if (property.date) return property.date.start || null;
  if (property.unique_id) return `${property.unique_id.prefix || ''}${property.unique_id.number || ''}` || null;
  if (property.formula) return plain(property.formula);
  if (property.rollup) return plain(property.rollup);
  return null;
}

function text(page, names, fallback) {
  const value = plain(firstProperty(page, names));
  return value === null || value === '' ? (fallback === undefined ? null : fallback) : String(value);
}

function numberValue(page, names, fallback) {
  const value = plain(firstProperty(page, names));
  if (value === null || value === undefined || value === '') {
    return fallback === undefined ? null : fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : (fallback === undefined ? null : fallback);
}

function checkbox(page, names) {
  return plain(firstProperty(page, names)) === true;
}

function relationIds(page, names) {
  const property = firstProperty(page, names);
  return property && Array.isArray(property.relation) ? property.relation.map((item) => item.id) : [];
}

function listValues(page, names) {
  const property = firstProperty(page, names);
  if (!property) return [];
  if (Array.isArray(property.multi_select)) return property.multi_select.map((item) => item.name).filter(Boolean);
  const value = plain(property);
  return value ? [String(value)] : [];
}

function normalizePartnerStatus(value) {
  const status = clean(value).toLowerCase();
  if (['active', 'approved', 'enabled', 'live'].includes(status)) return 'active';
  if (['paused', 'hold', 'on hold'].includes(status)) return 'paused';
  if (['inactive', 'archived', 'closed'].includes(status)) return 'inactive';
  if (['rejected', 'declined'].includes(status)) return 'rejected';
  return 'pending';
}

function normalizeVerification(value, active) {
  const status = clean(value).toLowerCase();
  if (['verified', 'approved', 'complete'].includes(status)) return 'verified';
  if (['unverified', 'not verified'].includes(status)) return 'unverified';
  return active ? 'verified' : 'pending';
}

function normalizeLeadStatus(value) {
  const status = clean(value).toLowerCase().replace(/[_-]+/g, ' ');
  if (status.includes('await') || status.includes('document')) return 'awaiting_documents';
  if (status.includes('action')) return 'partner_action_needed';
  if (status.includes('reviewing') || status.includes('underwriting') || status.includes('human review')) return 'in_review';
  if (status.includes('reviewed') || status.includes('approved')) return 'reviewed';
  if (status.includes('score') || status.includes('readiness')) return 'readiness_complete';
  if (status.includes('nurture')) return 'nurture';
  if (status.includes('funded') || status.includes('closed') || status.includes('declined') || status.includes('rejected')) return 'closed';
  return 'new';
}

function normalizePriority(value) {
  const priority = clean(value).toLowerCase().replace(/\s+/g, '_');
  if (['hot', 'warm', 'nurture', 'education', 'manual_review'].includes(priority)) return priority;
  if (priority === 'low') return 'education';
  return null;
}

function amountBand(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (amount < 25000) return 'Under $25K';
  if (amount < 50000) return '$25K–$49K';
  if (amount < 100000) return '$50K–$99K';
  if (amount < 250000) return '$100K–$249K';
  return '$250K+';
}

function parseAudit(page) {
  const raw = text(page, ['API Payload', 'Metadata JSON'], '');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (_) { return {}; }
}

function matchesPartner(page, partnerId, partnerPageId) {
  const explicit = text(page, ['Partner ID', 'Partner Code'], '');
  if (explicit && explicit === partnerId) return true;
  const relations = relationIds(page, ['Partner', 'Partners']);
  return Boolean(partnerPageId && relations.includes(partnerPageId));
}

function onboardingPercent(page) {
  const checks = [
    Boolean(text(page, ['Partner ID'], '')),
    normalizePartnerStatus(text(page, ['Status'], '')) === 'active',
    Boolean(text(page, ['Tier'], '')),
    checkbox(page, ['Consent to Contact']),
    checkbox(page, ['Community Joined']),
    checkbox(page, ['First Deal Submitted'])
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function mapPartner(page, partnerId) {
  const status = normalizePartnerStatus(text(page, ['Status'], 'pending'));
  return {
    partner_id: partnerId,
    display_name: text(page, ['Name'], 'Partner'),
    company_name: text(page, ['Company'], null),
    contact_email: text(page, ['Email'], null),
    contact_phone: text(page, ['Phone'], null),
    website_url: text(page, ['Website URL', 'Website'], null),
    logo_url: text(page, ['Logo URL', 'Logo'], null),
    status,
    tier: text(page, ['Tier'], 'Standard'),
    verification_status: normalizeVerification(text(page, ['Verification Status'], ''), status === 'active'),
    onboarding_completion_percent: onboardingPercent(page),
    default_campaign_id: text(page, ['Default Campaign ID', 'Campaign ID'], null),
    default_destination_url: text(page, ['Default Destination URL'], null),
    created_at: page.created_time || new Date().toISOString(),
    updated_at: page.last_edited_time || null
  };
}

function mapFundingLead(page, commissionRate) {
  const audit = parseAudit(page);
  const amount = numberValue(page, ['Desired Funding Amount', 'Requested Amount', 'Funding Amount'], null);
  const explicitEstimate = numberValue(page, ['Estimated Commission'], null);
  const estimated = explicitEstimate !== null ? explicitEstimate : (amount !== null && commissionRate > 0 ? Math.round(amount * commissionRate * 100) / 100 : null);
  const status = normalizeLeadStatus(text(page, ['Lead Status', 'Review Status', 'Status'], 'new'));
  return {
    lead_id: text(page, ['External Lead ID', 'Lead ID'], page.id),
    business_display_name: text(page, ['Business Name', 'Name', 'Lead Name'], 'Funding lead'),
    public_status: status,
    requested_amount: amount,
    requested_amount_range: text(page, ['Desired Amount Band', 'Requested Amount Range'], amountBand(amount)),
    readiness_score: numberValue(page, ['Funding Readiness Score', 'Readiness Score'], null),
    readiness_tier: text(page, ['Funding Readiness Tier', 'Readiness Tier'], null),
    primary_funding_family: text(page, ['Primary Funding Family'], null),
    lead_priority: normalizePriority(text(page, ['Lead Priority'], '')),
    source_system: text(page, ['Source System'], audit.source_system || 'partner_command_center'),
    source_url: text(page, ['Source URL'], null),
    tracking_link_id: text(page, ['Tracking Link ID'], null),
    campaign_id: text(page, ['Campaign ID'], null),
    widget_id: text(page, ['Widget ID'], null),
    next_action: text(page, ['Next Action'], status === 'awaiting_documents' ? 'Collect the requested readiness documents.' : 'Review the latest lead status.'),
    document_status: status === 'awaiting_documents' ? 'requested' : null,
    estimated_commission: estimated === null ? null : { amount: estimated, currency: 'USD' },
    commission_status: estimated === null ? 'not_available' : 'estimated',
    submitted_at: text(page, ['Consent Timestamp', 'Created At'], page.created_time || new Date().toISOString()),
    updated_at: text(page, ['Updated At'], page.last_edited_time || page.created_time || new Date().toISOString()),
    _verified_commission: numberValue(page, ['Verified Commission'], 0),
    _paid_commission: numberValue(page, ['Paid Commission'], 0)
  };
}

function mapTrackingLink(page) {
  const statusRaw = clean(text(page, ['Status'], 'active')).toLowerCase();
  const status = statusRaw.includes('pause') ? 'paused' : statusRaw.includes('archive') ? 'archived' : 'active';
  return {
    tracking_link_id: text(page, ['Tracking Link Key', 'Referral Token', 'Tracking Link ID'], page.id),
    name: text(page, ['Link Name', 'Name', 'Campaign Name'], 'Partner tracking link'),
    destination_url: text(page, ['Destination URL'], '#'),
    tracking_url: text(page, ['Tracking URL', 'Short URL'], '#'),
    campaign_id: text(page, ['Campaign ID', 'Campaign Name'], null),
    widget_id: text(page, ['Widget ID'], null),
    status,
    utm_source: text(page, ['UTM Source'], null),
    utm_medium: text(page, ['UTM Medium'], null),
    utm_campaign: text(page, ['UTM Campaign'], null),
    utm_content: text(page, ['UTM Content'], null),
    utm_term: text(page, ['UTM Term'], null),
    clicks: Math.max(0, Math.round(numberValue(page, ['Clicks'], 0))),
    lead_submissions: Math.max(0, Math.round(numberValue(page, ['Conversions', 'Lead Submissions'], 0))),
    created_at: page.created_time || null
  };
}

function mapResource(page) {
  const statusRaw = clean(text(page, ['Status'], 'available')).toLowerCase();
  const status = statusRaw.includes('assign') ? 'assigned' : statusRaw.includes('pause') ? 'paused' : statusRaw.includes('archive') ? 'archived' : 'available';
  return {
    resource_id: text(page, ['Resource ID', 'Partner Resource ID'], page.id),
    name: text(page, ['Resource Name', 'Name', 'Title'], 'Partner resource'),
    description: text(page, ['Description', 'Summary'], null),
    category: text(page, ['Category', 'Resource Type'], 'Resource'),
    format: text(page, ['Format', 'Asset Type'], 'Link'),
    resource_url: text(page, ['Resource URL', 'URL', 'Link'], null),
    download_url: text(page, ['Download URL'], null),
    status,
    verticals: listValues(page, ['Verticals', 'Audience', 'Tags']),
    campaign_ids: listValues(page, ['Campaign IDs', 'Campaigns']),
    compliance_status: text(page, ['Compliance Status'], null),
    updated_at: page.last_edited_time || null
  };
}

function mapEvent(page) {
  const audit = parseAudit(page);
  return {
    event_id: text(page, ['Event ID'], page.id),
    event_type: text(page, ['Event Type'], audit.event_type || 'partner.activity'),
    title: text(page, ['Event Name', 'Name', 'Summary'], 'Partner activity'),
    message: text(page, ['Event Summary', 'Summary', 'Next Action'], null),
    lead_id: text(page, ['Lead ID'], audit.lead_id || null),
    tracking_link_id: text(page, ['Tracking Link ID'], audit.tracking_link_id || null),
    visibility: 'partner',
    created_at: text(page, ['Occurred At'], page.created_time || new Date().toISOString())
  };
}

async function safeQuery(databaseId, label, limit) {
  if (!clean(databaseId)) return { label, pages: [], error: `${label}_not_configured` };
  try {
    const result = await queryDatabase(databaseId, { page_size: Math.min(Math.max(limit || 50, 1), 100) });
    return { label, pages: result && Array.isArray(result.results) ? result.results : [], error: null };
  } catch (error) {
    return { label, pages: [], error: error && error.code ? error.code : `${label}_unavailable` };
  }
}

function publicLead(lead) {
  const copy = { ...lead };
  delete copy._verified_commission;
  delete copy._paid_commission;
  return copy;
}

function money(amount) {
  return { amount: Math.round((Number(amount) || 0) * 100) / 100, currency: 'USD' };
}

function buildNotifications(partner, events, failures) {
  const notifications = [];
  if (partner.onboarding_completion_percent < 100) {
    notifications.push({
      notification_id: 'onboarding-incomplete',
      type: 'onboarding',
      title: 'Finish partner onboarding',
      message: `${partner.onboarding_completion_percent}% complete. Finish the remaining setup steps before scaling campaigns.`,
      severity: 'action_required',
      target_url: '#onboarding',
      is_read: false,
      created_at: new Date().toISOString(),
      read_at: null
    });
  }
  events.filter((item) => clean(item.message)).slice(0, 3).forEach((item) => {
    notifications.push({
      notification_id: `event-${item.event_id}`,
      type: item.event_type,
      title: item.title,
      message: item.message,
      severity: /action|document|review/i.test(`${item.title} ${item.message}`) ? 'action_required' : 'info',
      target_url: item.lead_id ? '#lead-tracker' : '#overview',
      is_read: false,
      created_at: item.created_at,
      read_at: null
    });
  });
  failures.forEach((failure) => {
    notifications.push({
      notification_id: `source-${failure}`,
      type: 'data_source',
      title: 'Dashboard data source temporarily unavailable',
      message: `The ${failure.replace(/_/g, ' ')} module could not be loaded. Other modules remain available.`,
      severity: 'warning',
      target_url: '#overview',
      is_read: false,
      created_at: new Date().toISOString(),
      read_at: null
    });
  });
  return notifications.slice(0, 12);
}

async function buildDashboardBootstrap(partnerId, options) {
  const limit = Math.min(Math.max(Number(options && options.limit) || 25, 1), 50);
  const partnerPage = await findPartnerByPartnerId(partnerId);
  if (!partnerPage) {
    const error = new Error('The partner session is not associated with a Partner record.');
    error.status = 404;
    error.code = 'partner_not_found';
    throw error;
  }

  const partner = mapPartner(partnerPage, partnerId);
  if (['inactive', 'rejected'].includes(partner.status)) {
    const error = new Error('This partner workspace is not active.');
    error.status = 403;
    error.code = 'partner_not_active';
    throw error;
  }

  const sources = await Promise.all([
    safeQuery(process.env.NOTION_FUNDING_LEADS_DB_ID, 'funding_leads', limit),
    safeQuery(process.env.NOTION_PARTNER_EVENTS_DB_ID, 'partner_events', limit),
    safeQuery(process.env.NOTION_TRACKING_LINKS_DB_ID, 'tracking_links', limit),
    safeQuery(process.env.NOTION_PARTNER_RESOURCES_DB_ID, 'partner_resources', limit)
  ]);

  const source = Object.fromEntries(sources.map((item) => [item.label, item]));
  const commissionRate = Math.max(0, Number(process.env.DASHBOARD_COMMISSION_ESTIMATE_RATE) || 0);
  const leads = source.funding_leads.pages.filter((page) => matchesPartner(page, partnerId, partnerPage.id)).map((page) => mapFundingLead(page, commissionRate)).slice(0, limit);
  const events = source.partner_events.pages.filter((page) => matchesPartner(page, partnerId, partnerPage.id)).map(mapEvent).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, limit);
  const trackingLinks = source.tracking_links.pages.filter((page) => matchesPartner(page, partnerId, partnerPage.id)).map(mapTrackingLink).slice(0, limit);
  const resources = source.partner_resources.pages.filter((page) => {
    const explicit = text(page, ['Partner ID', 'Partner Code'], '');
    const relations = relationIds(page, ['Partner', 'Partners']);
    return (!explicit && relations.length === 0) || matchesPartner(page, partnerId, partnerPage.id);
  }).map(mapResource).filter((item) => item.status !== 'archived').slice(0, limit);

  const estimated = leads.reduce((sum, item) => sum + (item.estimated_commission && item.estimated_commission.amount || 0), 0);
  const verified = leads.reduce((sum, item) => sum + item._verified_commission, 0);
  const paid = leads.reduce((sum, item) => sum + item._paid_commission, 0);
  const submittedVolume = leads.reduce((sum, item) => sum + (item.requested_amount || 0), 0);
  const failures = sources.filter((item) => item.error).map((item) => item.label);
  const notifications = buildNotifications(partner, events, failures);
  const active = partner.status === 'active';

  return {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    partner,
    summary: {
      total_leads: leads.length,
      active_leads: leads.filter((item) => !['closed', 'nurture'].includes(item.public_status)).length,
      action_needed_leads: leads.filter((item) => ['awaiting_documents', 'partner_action_needed'].includes(item.public_status)).length,
      funded_leads: leads.filter((item) => item.public_status === 'closed' && item._paid_commission > 0).length,
      submitted_volume: money(submittedVolume),
      estimated_commissions: money(estimated),
      verified_commissions: money(verified),
      paid_commissions: money(paid),
      tracking_link_clicks: trackingLinks.reduce((sum, item) => sum + item.clicks, 0),
      lead_submissions_from_links: trackingLinks.reduce((sum, item) => sum + item.lead_submissions, 0),
      unread_notifications: notifications.filter((item) => !item.is_read).length,
      next_action: notifications.find((item) => item.severity === 'action_required')?.title || null
    },
    leads: leads.map(publicLead),
    events,
    tracking_links: trackingLinks,
    resources,
    widgets: [{
      preset_id: 'funding-readiness-scorecard-widget',
      widget_id: `funding-readiness-scorecard-widget-${partnerId}`,
      name: 'Funding Readiness Scorecard',
      description: 'White-label readiness scorecard powered by Am I Fundable.',
      status: active ? 'available' : 'paused',
      preview_url: `https://embed-widgets-kappa.vercel.app/funding-readiness-scorecard-widget.html?partner_id=${encodeURIComponent(partnerId)}`,
      embed_url: `https://embed-widgets-kappa.vercel.app/funding-readiness-scorecard-widget.html?partner_id=${encodeURIComponent(partnerId)}`,
      campaign_id: partner.default_campaign_id,
      tracking_link_id: trackingLinks[0] ? trackingLinks[0].tracking_link_id : null,
      theme: null,
      consent_version: '2026-07-10'
    }],
    commissions: {
      estimated: money(estimated),
      pending_verification: money(Math.max(estimated - verified, 0)),
      verified: money(verified),
      paid: money(paid),
      calculation_disclaimer: commissionRate > 0
        ? `Estimates use the configured ${(commissionRate * 100).toFixed(2)}% planning rate and are not payable balances.`
        : 'Commission estimates appear only when an explicit estimate exists or DASHBOARD_COMMISSION_ESTIMATE_RATE is configured. Estimates are not payable balances.',
      last_verified_at: null
    },
    notifications,
    permissions: {
      can_submit_leads: active,
      can_view_leads: true,
      can_create_tracking_links: active,
      can_view_resources: true,
      can_configure_widgets: active,
      can_view_commission_estimates: true,
      can_view_verified_commissions: verified > 0,
      can_edit_profile: active,
      can_manage_team: false
    },
    pagination: {
      leads_next_cursor: null,
      events_next_cursor: null,
      notifications_next_cursor: null
    }
  };
}

module.exports = {
  buildDashboardBootstrap,
  mapPartner,
  mapFundingLead,
  mapTrackingLink,
  mapResource,
  mapEvent,
  normalizePartnerStatus,
  normalizeLeadStatus,
  amountBand,
  matchesPartner
};
