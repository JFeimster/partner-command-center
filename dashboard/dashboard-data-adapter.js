/* Partner Command Center dashboard data-mode adapter. */
(function initDashboardDataAdapter(window, document) {
  'use strict';

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};
  var dashboard = window.MoonshineOS.dashboard;
  var MODE_KEY = 'pccDashboardMode';
  var TOKEN_KEY = 'pccDashboardToken';
  var mode = 'demo';
  var status = 'idle';

  function clean(value) {
    return value === undefined || value === null ? '' : String(value).trim();
  }

  function query(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getMode() {
    var requested = clean(query('dashboard_mode')).toLowerCase();
    if (requested === 'live' || requested === 'demo') {
      window.localStorage.setItem(MODE_KEY, requested);
      return requested;
    }
    var stored = clean(window.localStorage.getItem(MODE_KEY)).toLowerCase();
    return stored === 'live' ? 'live' : 'demo';
  }

  function captureToken() {
    var token = clean(query('dashboard_token'));
    if (token) {
      window.sessionStorage.setItem(TOKEN_KEY, token);
      var url = new URL(window.location.href);
      url.searchParams.delete('dashboard_token');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
    return token || clean(window.sessionStorage.getItem(TOKEN_KEY));
  }

  function modeElements() {
    return {
      select: document.querySelector('[data-dashboard-mode]'),
      badge: document.querySelector('[data-dashboard-mode-status]'),
      alert: document.querySelector('[data-dashboard-mode-alert]')
    };
  }

  function setStatus(nextStatus, message, tone) {
    status = nextStatus;
    var elements = modeElements();
    if (elements.badge) {
      elements.badge.textContent = mode === 'live' ? (nextStatus === 'ready' ? 'Live API' : 'Live unavailable') : 'Demo / localStorage';
      elements.badge.className = 'mpc-badge ' + (nextStatus === 'ready' ? 'mpc-badge-success' : nextStatus === 'error' ? 'mpc-badge-warning' : 'mpc-badge-info');
    }
    if (elements.alert) {
      elements.alert.hidden = !message;
      elements.alert.textContent = message || '';
      elements.alert.className = 'mpc-disclaimer' + (tone === 'danger' ? ' mpc-toast-danger' : tone === 'warning' ? ' mpc-toast-warning' : '');
    }
  }

  function money(value) {
    return value && Number.isFinite(Number(value.amount)) ? Number(value.amount) : 0;
  }

  function mapStatus(value) {
    var statusValue = clean(value);
    var map = {
      new: 'new',
      readiness_complete: 'reviewing',
      awaiting_documents: 'needsInfo',
      in_review: 'reviewing',
      partner_action_needed: 'needsInfo',
      reviewed: 'submitted',
      nurture: 'archived',
      closed: 'archived'
    };
    return map[statusValue] || 'new';
  }

  function mapPartner(partner) {
    return {
      partnerId: partner.partner_id,
      contactName: partner.display_name,
      company: partner.company_name || partner.display_name,
      email: partner.contact_email || '',
      phone: partner.contact_phone || '',
      website: partner.website_url || '',
      logoUrl: partner.logo_url || '',
      status: partner.status,
      tier: partner.tier,
      verificationStatus: partner.verification_status,
      onboardingCompletionPercent: partner.onboarding_completion_percent,
      partnerType: 'partner',
      primaryAudience: 'Small business owners'
    };
  }

  function mapLead(item, partnerId) {
    return {
      id: item.lead_id,
      businessName: item.business_display_name,
      contactName: 'Protected contact',
      industry: item.primary_funding_family || item.source_system,
      fundingNeed: item.requested_amount || 0,
      monthlyRevenue: 0,
      useOfFunds: item.source_system,
      nextStep: item.next_action || 'Review the latest lead status.',
      status: mapStatus(item.public_status),
      partnerId: partnerId,
      createdAt: item.submitted_at,
      updatedAt: item.updated_at,
      readinessScore: item.readiness_score,
      readinessTier: item.readiness_tier,
      campaignId: item.campaign_id,
      trackingLinkId: item.tracking_link_id,
      widgetId: item.widget_id,
      estimatedCommission: item.estimated_commission ? item.estimated_commission.amount : null,
      liveReadOnly: true
    };
  }

  function mapEvent(item, partnerId) {
    return {
      id: item.event_id,
      type: item.event_type,
      label: item.title,
      message: item.message || '',
      partnerId: partnerId,
      createdAt: item.created_at,
      tone: /action|document|warning/i.test((item.title || '') + ' ' + (item.message || '')) ? 'warning' : 'success'
    };
  }

  function mapResource(item) {
    return {
      id: item.resource_id,
      title: item.name,
      summary: item.description || 'Partner resource',
      type: item.format || item.category,
      category: item.category,
      href: item.download_url || item.resource_url || './resources.html',
      complianceNote: item.compliance_status || '',
      status: item.status
    };
  }

  function mapCommissions(item) {
    return {
      disclaimer: item.calculation_disclaimer,
      summary: {
        estimatedPending: money(item.pending_verification),
        demoPaid: money(item.paid),
        demoFundedDeals: 0,
        verified: money(item.verified)
      },
      rows: []
    };
  }

  function applyLivePayload(payload) {
    var state = dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
    var partnerProfile = mapPartner(payload.partner);
    var leads = (payload.leads || []).map(function (item) { return mapLead(item, payload.partner.partner_id); });
    var events = (payload.events || []).map(function (item) { return mapEvent(item, payload.partner.partner_id); });
    var notifications = (payload.notifications || []).map(function (item) {
      return {
        id: item.notification_id,
        type: item.type,
        label: item.title,
        message: item.message || '',
        partnerId: payload.partner.partner_id,
        createdAt: item.created_at,
        tone: item.severity === 'action_required' || item.severity === 'warning' ? 'warning' : 'success'
      };
    });

    dashboard.seedData = dashboard.seedData || {};
    dashboard.seedData.resources = (payload.resources || []).map(mapResource);
    dashboard.seedData.commissions = mapCommissions(payload.commissions || {});

    if (dashboard.state && dashboard.state.setState) {
      dashboard.state.setState({
        partnerProfile: partnerProfile,
        leads: leads,
        events: notifications.concat(events),
        resources: payload.resources || [],
        trackingLinks: payload.tracking_links || [],
        widgets: payload.widgets || [],
        commissions: payload.commissions || {},
        notifications: payload.notifications || [],
        onboarding: {
          percent: payload.partner.onboarding_completion_percent,
          status: payload.partner.onboarding_completion_percent >= 100 ? 'complete' : 'in_progress'
        },
        dashboardData: {
          mode: 'live',
          generatedAt: payload.generated_at,
          summary: payload.summary,
          permissions: payload.permissions
        },
        settings: Object.assign({}, state.settings || {}, { dataMode: 'live' })
      }, { type: 'dashboard.live_data_loaded' });
    }
  }

  function renderAlerts() {
    var target = document.querySelector('[data-render-alerts]');
    if (!target) return;
    var state = dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
    var alerts = Array.isArray(state.notifications) ? state.notifications : [];
    if (mode !== 'live') {
      target.innerHTML = '<div class="mpc-disclaimer">Demo mode stores workspace data only in this browser. Switch to Live API after receiving a signed partner dashboard session.</div>';
      return;
    }
    if (!alerts.length) {
      target.innerHTML = '<div class="mpc-disclaimer">No active partner alerts.</div>';
      return;
    }
    target.innerHTML = alerts.slice(0, 4).map(function (item) {
      return '<article class="dashboard-note"><strong>' + escapeHtml(item.title || 'Alert') + '</strong><p>' + escapeHtml(item.message || '') + '</p></article>';
    }).join('');
  }

  function renderTrackingLinks() {
    var state = dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
    var links = Array.isArray(state.trackingLinks) ? state.trackingLinks : [];
    var target = document.querySelector('[data-render-partner-links]');
    if (!target || mode !== 'live' || !links.length) return;
    target.innerHTML = links.map(function (item) {
      return [
        '<article class="dashboard-link-builder">',
        '<div class="split"><div><h3 class="dashboard-card-title">' + escapeHtml(item.name) + '</h3><p class="dashboard-card-subtitle">' + escapeHtml(item.tracking_link_id) + '</p></div><span class="mpc-badge mpc-badge-success">' + escapeHtml(item.status) + '</span></div>',
        '<div class="dashboard-copy-row"><input type="text" value="' + escapeHtml(item.tracking_url) + '" readonly><button class="mpc-button mpc-button-outline" type="button" data-copy-text="' + escapeHtml(item.tracking_url) + '">Copy</button></div>',
        '<small class="mpc-muted">' + Number(item.clicks || 0) + ' clicks · ' + Number(item.lead_submissions || 0) + ' lead submissions</small>',
        '</article>'
      ].join('');
    }).join('');
  }

  function decorateLiveMode() {
    renderAlerts();
    renderTrackingLinks();
    if (mode !== 'live' || status !== 'ready') return;
    Array.prototype.slice.call(document.querySelectorAll('[data-lead-status]')).forEach(function (element) {
      element.disabled = true;
      element.title = 'Lead statuses are read-only in partner live mode.';
    });
    Array.prototype.slice.call(document.querySelectorAll('[data-remove-lead]')).forEach(function (element) {
      element.hidden = true;
    });
    var sidebarNote = document.querySelector('.dashboard-sidebar-note');
    if (sidebarNote) sidebarNote.textContent = 'Live partner workspace connected to Partner Command Center APIs.';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character];
    });
  }

  async function loadLive() {
    var token = captureToken();
    var headers = { Accept: 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var response = await window.fetch('/api/dashboard/bootstrap?limit=25', {
      method: 'GET',
      credentials: 'include',
      headers: headers
    });
    var data = await response.json().catch(function () { return null; });
    if (!response.ok || !data || data.ok === false) {
      var error = new Error(data && data.error && data.error.message || 'Live dashboard data is unavailable.');
      error.code = data && data.error && data.error.code || 'dashboard_live_unavailable';
      throw error;
    }
    return data;
  }

  async function initialize() {
    mode = getMode();
    var elements = modeElements();
    if (elements.select) elements.select.value = mode;

    if (mode === 'demo') {
      setStatus('ready', 'Demo mode is active. Data stays in localStorage and is not written to Notion.', 'info');
      renderAlerts();
      return { mode: mode, status: 'ready' };
    }

    setStatus('loading', 'Loading live partner data…', 'info');
    try {
      var payload = await loadLive();
      applyLivePayload(payload);
      setStatus('ready', 'Live API mode is active. Partner data is loaded from Partner Command Center.', 'success');
      if (dashboard.controller && dashboard.controller.renderAll) dashboard.controller.renderAll();
      decorateLiveMode();
      return { mode: mode, status: 'ready', payload: payload };
    } catch (error) {
      setStatus('error', error.message + ' Demo data remains available; switch back to Demo mode to continue.', 'warning');
      renderAlerts();
      return { mode: mode, status: 'error', error: error };
    }
  }

  function bindModeControl() {
    var elements = modeElements();
    if (!elements.select || elements.select.dataset.bound === 'true') return;
    elements.select.dataset.bound = 'true';
    elements.select.addEventListener('change', function () {
      window.localStorage.setItem(MODE_KEY, elements.select.value === 'live' ? 'live' : 'demo');
      window.location.reload();
    });
  }

  function isLive() {
    return mode === 'live' && status === 'ready';
  }

  function openReadiness(data) {
    var state = dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
    var partner = state.partnerProfile || {};
    var params = new URLSearchParams({
      partner_id: partner.partnerId || '',
      source: 'partner_dashboard',
      utm_source: 'partner_dashboard',
      utm_medium: 'dashboard_referral',
      utm_campaign: 'partner_lead_submission'
    });
    if (data && data.businessName) params.set('business_name', data.businessName);
    window.location.href = 'https://am-i-fundable.vercel.app/?' + params.toString();
  }

  dashboard.dataAdapter = {
    initialize: initialize,
    bindModeControl: bindModeControl,
    isLive: isLive,
    getMode: function () { return mode; },
    getStatus: function () { return status; },
    decorateLiveMode: decorateLiveMode,
    openReadiness: openReadiness,
    applyLivePayload: applyLivePayload
  };
})(window, document);
