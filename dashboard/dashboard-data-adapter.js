/* Unified Partner Command Center dashboard data adapter. */
(function initDashboardDataAdapter(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var dashboard = window.MoonshineOS.dashboard;
  var MODE_KEY = "pccDashboardMode";
  var TOKEN_KEY = "pccDashboardToken";
  var mode = "demo";
  var status = "idle";
  var livePayload = null;

  function clean(value) { return value === undefined || value === null ? "" : String(value).trim(); }
  function query(name) { return new URLSearchParams(window.location.search).get(name); }

  function getMode() {
    var requested = clean(query("dashboard_mode")).toLowerCase();
    if (requested === "live" || requested === "demo") {
      window.localStorage.setItem(MODE_KEY, requested);
      return requested;
    }
    return clean(window.localStorage.getItem(MODE_KEY)).toLowerCase() === "live" ? "live" : "demo";
  }

  function captureToken() {
    var token = clean(query("dashboard_token"));
    if (token) {
      window.sessionStorage.setItem(TOKEN_KEY, token);
      var url = new URL(window.location.href);
      url.searchParams.delete("dashboard_token");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
    return token || clean(window.sessionStorage.getItem(TOKEN_KEY));
  }

  function setStatus(nextStatus, message, tone) {
    status = nextStatus;
    var badge = document.querySelector("[data-dashboard-mode-status]");
    var alert = document.querySelector("[data-dashboard-mode-alert]");
    if (badge) {
      badge.textContent = mode === "live" ? (nextStatus === "ready" ? "Live API" : nextStatus === "loading" ? "Connecting" : "Live unavailable") : "Demo / localStorage";
      badge.className = "mpc-badge " + (nextStatus === "ready" ? "mpc-badge-success" : nextStatus === "error" ? "mpc-badge-warning" : "mpc-badge-info");
    }
    if (alert) {
      alert.hidden = !message;
      alert.textContent = message || "";
      alert.className = "mpc-disclaimer dashboard-mode-alert" + (tone === "danger" ? " mpc-toast-danger" : tone === "warning" ? " mpc-toast-warning" : "");
    }
  }

  function money(value) { return value && Number.isFinite(Number(value.amount)) ? Number(value.amount) : 0; }

  function mapStatus(value) {
    var map = {
      new: "new",
      readiness_complete: "reviewing",
      awaiting_documents: "needsInfo",
      in_review: "reviewing",
      partner_action_needed: "needsInfo",
      reviewed: "submitted",
      nurture: "archived",
      closed: "archived"
    };
    return map[clean(value)] || "new";
  }

  function mapPartner(partner) {
    return {
      partnerId: partner.partner_id,
      contactName: partner.display_name,
      company: partner.company_name || partner.display_name,
      email: partner.contact_email || "",
      phone: partner.contact_phone || "",
      website: partner.website_url || "",
      logoUrl: partner.logo_url || "",
      status: partner.status,
      tier: partner.tier,
      verificationStatus: partner.verification_status,
      onboardingCompletionPercent: partner.onboarding_completion_percent,
      partnerType: partner.partner_type || "partner",
      primaryAudience: partner.primary_audience || "Small business owners",
      localDemo: false
    };
  }

  function mapLead(item, partnerId) {
    return {
      id: item.lead_id,
      businessName: item.business_display_name,
      contactName: "Protected contact",
      industry: item.primary_funding_family || item.source_system || "Funding readiness",
      fundingNeed: item.requested_amount || 0,
      monthlyRevenue: 0,
      source: item.source_system || "partner_command_center",
      useOfFunds: item.primary_funding_family || item.source_system,
      nextStep: item.next_action || "Review the latest lead status.",
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
      id: item.event_id || item.notification_id,
      type: item.event_type || item.type,
      label: item.title || item.event_type || item.type || "Partner activity",
      message: item.message || "",
      partnerId: partnerId,
      createdAt: item.created_at,
      tone: item.severity === "action_required" || item.severity === "warning" ? "warning" : "success"
    };
  }

  function mapResource(item) {
    return {
      id: item.resource_id,
      title: item.name,
      summary: item.description || "Partner resource",
      type: item.format || item.category,
      category: item.category,
      href: item.download_url || item.resource_url || "./resources.html",
      complianceNote: item.compliance_status || "",
      status: item.status
    };
  }

  function mapCommissions(item) {
    return {
      disclaimer: item.calculation_disclaimer,
      summary: {
        estimatedPending: money(item.pending_verification),
        demoPaid: money(item.paid),
        verified: money(item.verified)
      },
      rows: []
    };
  }

  function applyLivePayload(payload) {
    livePayload = payload;
    var current = dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
    var partner = mapPartner(payload.partner);
    var leads = (payload.leads || []).map(function (item) { return mapLead(item, payload.partner.partner_id); });
    var events = (payload.events || []).map(function (item) { return mapEvent(item, payload.partner.partner_id); });
    var notifications = (payload.notifications || []).map(function (item) { return mapEvent(item, payload.partner.partner_id); });
    var resources = (payload.resources || []).map(mapResource);

    dashboard.seedData = dashboard.seedData || {};
    dashboard.seedData.resources = resources;
    dashboard.seedData.commissions = mapCommissions(payload.commissions || {});

    if (dashboard.state && dashboard.state.setState) {
      dashboard.state.setState({
        partnerProfile: partner,
        leads: leads,
        events: notifications.concat(events),
        resources: resources,
        trackingLinks: payload.tracking_links || [],
        widgets: payload.widgets || [],
        commissions: payload.commissions || {},
        notifications: payload.notifications || [],
        onboarding: {
          percent: payload.partner.onboarding_completion_percent,
          status: payload.partner.onboarding_completion_percent >= 100 ? "complete" : "in_progress"
        },
        dashboardData: {
          mode: "live",
          generatedAt: payload.generated_at,
          summary: payload.summary,
          permissions: payload.permissions
        },
        settings: Object.assign({}, current.settings || {}, { dataMode: "live" })
      }, { type: "dashboard.live_data_loaded" });
    }
  }

  function currentState() {
    return dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
  }

  function getDashboardPayload() {
    if (mode === "live" && livePayload) return Promise.resolve(livePayload);
    if (mode === "live" && dashboard.apiClient) return dashboard.apiClient.getDashboardPayload(captureToken(), 25);
    var state = currentState();
    return Promise.resolve({
      mode: "demo",
      partner: state.partnerProfile || {},
      onboarding: state.onboarding || {},
      tracking_links: state.trackingLinks || [],
      lead_summaries: state.leads || [],
      resources: dashboard.seedData && dashboard.seedData.resources || [],
      widgets: state.widgets || [],
      events: state.events || [],
      alerts: state.notifications || [],
      integration_status: { mode: "demo", connected: false }
    });
  }

  function renderAlerts() {
    var target = document.querySelector("[data-render-alerts]");
    if (!target) return;
    var state = currentState();
    var alerts = Array.isArray(state.notifications) ? state.notifications : [];
    if (mode !== "live") {
      target.innerHTML = '<div class="mpc-disclaimer">Demo mode is active. Fictional workspace data stays in this browser.</div>';
      return;
    }
    if (!alerts.length) {
      target.innerHTML = '<div class="mpc-disclaimer">No active partner alerts.</div>';
      return;
    }
    target.innerHTML = alerts.slice(0, 4).map(function (item) {
      return '<article class="dashboard-note"><strong>' + escapeHtml(item.title || item.label || "Alert") + '</strong><p>' + escapeHtml(item.message || "") + '</p></article>';
    }).join("");
  }

  function decorateLiveMode() {
    renderAlerts();
    if (mode !== "live" || status !== "ready") return;
    Array.prototype.slice.call(document.querySelectorAll("[data-lead-status]")).forEach(function (element) {
      element.disabled = true;
      element.title = "Lead statuses are read-only in partner live mode.";
    });
    Array.prototype.slice.call(document.querySelectorAll("[data-remove-lead]")).forEach(function (element) { element.hidden = true; });
    var profileForm = document.querySelector("[data-profile-form]");
    if (profileForm) {
      Array.prototype.slice.call(profileForm.elements || []).forEach(function (element) { element.disabled = true; });
      profileForm.title = "Live profile identity is server-controlled.";
    }
    var sidebar = document.querySelector(".dashboard-sidebar-note");
    if (sidebar) sidebar.textContent = "Live partner workspace connected to Partner Command Center APIs.";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (character) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character];
    });
  }

  function initialize() {
    mode = getMode();
    var select = document.querySelector("[data-dashboard-mode]");
    if (select) select.value = mode;
    var publicLinks = dashboard.apiClient ? dashboard.apiClient.applyPublicLinks() : Promise.resolve();

    if (mode === "demo") {
      return publicLinks.then(function () {
        setStatus("ready", "Demo mode is active. Use fictional, non-sensitive data only.", "info");
        renderAlerts();
        return { mode: mode, status: "ready" };
      });
    }

    setStatus("loading", "Loading the partner-isolated live dashboard projection…", "info");
    return publicLinks.then(function () {
      if (!dashboard.apiClient) throw new Error("Dashboard API client is unavailable.");
      return dashboard.apiClient.getDashboardPayload(captureToken(), 25);
    }).then(function (payload) {
      applyLivePayload(payload);
      setStatus("ready", "Live API mode is active. Partner data is loaded from Partner Command Center.", "success");
      if (dashboard.controller && dashboard.controller.renderAll) dashboard.controller.renderAll();
      decorateLiveMode();
      return { mode: mode, status: "ready", payload: payload };
    }).catch(function (error) {
      setStatus("error", error.message + " Demo mode remains available.", "warning");
      renderAlerts();
      return { mode: mode, status: "error", error: error };
    });
  }

  function bindModeControl() {
    var select = document.querySelector("[data-dashboard-mode]");
    if (!select || select.dataset.bound === "true") return;
    select.dataset.bound = "true";
    select.addEventListener("change", function () {
      window.localStorage.setItem(MODE_KEY, select.value === "live" ? "live" : "demo");
      window.location.reload();
    });
  }

  function openReadiness(data) {
    var state = currentState();
    var partner = state.partnerProfile || {};
    var params = {
      partner_id: partner.partnerId || "",
      source: "partner_dashboard",
      utm_source: "partner_dashboard",
      utm_medium: "dashboard_referral",
      utm_campaign: "partner_lead_submission"
    };
    if (data && data.businessName) params.business_name = data.businessName;
    if (dashboard.apiClient) {
      dashboard.apiClient.getUrl("LEAD_SUBMISSION_URL", params).then(function (url) { window.location.href = url; });
    }
  }

  dashboard.dataAdapter = {
    initialize: initialize,
    bindModeControl: bindModeControl,
    isLive: function () { return mode === "live" && status === "ready"; },
    getMode: function () { return mode; },
    getStatus: function () { return status; },
    decorateLiveMode: decorateLiveMode,
    openReadiness: openReadiness,
    applyLivePayload: applyLivePayload,
    getDashboardPayload: getDashboardPayload,
    getPartnerProfile: function () { return Promise.resolve(currentState().partnerProfile || {}); },
    getTrackingLinks: function () { return Promise.resolve(currentState().trackingLinks || []); },
    getLeadSummaries: function () { return Promise.resolve(currentState().leads || []); },
    getFundingReadinessLeads: function () { return Promise.resolve((currentState().leads || []).filter(function (lead) { return lead.readinessScore != null; })); },
    getReviewQueue: function () { return Promise.resolve([]); },
    getResources: function () { return Promise.resolve(dashboard.seedData && dashboard.seedData.resources || []); },
    getWidgets: function () { return Promise.resolve(currentState().widgets || []); },
    getEvents: function () { return Promise.resolve(currentState().events || []); },
    getAlerts: function () { return Promise.resolve(currentState().notifications || []); },
    getRecommendedNextActions: function () { return Promise.resolve([]); }
  };
})(window, document);
