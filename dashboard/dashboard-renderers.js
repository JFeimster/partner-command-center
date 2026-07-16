/* Canonical dashboard renderers for demo and live API modes. */
(function initDashboardRenderers(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var dashboard = window.MoonshineOS.dashboard;
  var ui = window.MoonshineOS.ui;
  var config = dashboard.config || {};

  function esc(value) {
    return ui && ui.escapeHTML ? ui.escapeHTML(value) : String(value == null ? "" : value);
  }

  function currency(value) {
    return ui && ui.formatCurrency ? ui.formatCurrency(value) : "$" + Number(value || 0).toLocaleString();
  }

  function date(value) {
    return ui && ui.formatDate ? ui.formatDate(value) : String(value || "");
  }

  function titleCase(value) {
    return String(value || "").replace(/[-_]+/g, " ").replace(/\b\w/g, function (match) { return match.toUpperCase(); });
  }

  function badge(label, tone) {
    var cls = "mpc-badge";
    if (tone === "success") cls += " mpc-badge-success";
    if (tone === "warning") cls += " mpc-badge-warning";
    if (tone === "danger") cls += " mpc-badge-danger";
    if (tone === "info") cls += " mpc-badge-info";
    return '<span class="' + cls + '">' + esc(label) + '</span>';
  }

  function statusTone(status) {
    var item = (config.leadStatuses || []).find(function (entry) { return entry.id === status; });
    return item ? item.tone : "default";
  }

  function empty(title, body) {
    return '<div class="mpc-empty"><div><strong>' + esc(title || "Nothing here yet.") + '</strong><p>' + esc(body || "Add data to start using this section.") + '</p></div></div>';
  }

  function renderProfileCard(profile) {
    var item = profile || {};
    var initials = ui && ui.getInitials ? ui.getInitials(item.contactName, item.company) : "FP";
    var live = item.localDemo !== true && item.status !== "active-demo";
    return [
      '<article class="dashboard-card dashboard-card-pad dashboard-profile-card">',
      '<div class="cluster"><div class="dashboard-avatar" aria-hidden="true">' + esc(initials) + '</div><div>',
      badge(live ? (item.status || "pending") : "Demo partner", live && item.status === "active" ? "success" : "info"),
      '<h2 class="dashboard-card-title mt-3">' + esc(item.contactName || "Demo Partner") + '</h2>',
      '<p class="dashboard-card-subtitle">' + esc(item.company || "Moonshine Partner") + '</p>',
      '</div></div>',
      '<div class="mpc-grid">',
      '<div class="dashboard-note"><strong>Partner ID</strong><br><span data-partner-id>' + esc(item.partnerId || "MS-DEMO-0000") + '</span></div>',
      '<div class="dashboard-note"><strong>Partner type</strong><br>' + esc(titleCase(item.partnerType || "partner")) + '</div>',
      '<div class="dashboard-note"><strong>Audience</strong><br>' + esc(item.primaryAudience || "Small business owners") + '</div>',
      '</div></article>'
    ].join("");
  }

  function renderMetrics(state) {
    var current = state || {};
    var liveSummary = current.dashboardData && current.dashboardData.summary;
    if (liveSummary) {
      var submitted = liveSummary.submitted_volume && liveSummary.submitted_volume.amount;
      var estimated = liveSummary.estimated_commissions && liveSummary.estimated_commissions.amount;
      return [
        ["Total leads", liveSummary.total_leads || 0, "Partner-attributed records"],
        ["Active leads", liveSummary.active_leads || 0, (liveSummary.action_needed_leads || 0) + " need action"],
        ["Submitted volume", currency(submitted || 0), "Not an approval amount"],
        ["Estimated commissions", currency(estimated || 0), "Planning estimate only"],
        ["Link clicks", liveSummary.tracking_link_clicks || 0, (liveSummary.lead_submissions_from_links || 0) + " attributed submissions"]
      ].map(renderMetric).join("");
    }

    var leadSummary = dashboard.leadStore ? dashboard.leadStore.summarizeLeads(current.leads) : { total: 0, reviewing: 0, submitted: 0, needsInfo: 0, requestedFunding: 0 };
    var commissions = dashboard.seedData && dashboard.seedData.commissions && dashboard.seedData.commissions.summary || {};
    return [
      ["Demo leads", leadSummary.total || 0, "Stored in this browser"],
      ["In motion", (leadSummary.reviewing || 0) + (leadSummary.submitted || 0) + (leadSummary.needsInfo || 0), "Fictional workflow states"],
      ["Requested funding", currency(leadSummary.requestedFunding || 0), "Not an approval amount"],
      ["Assigned resources", (dashboard.seedData && dashboard.seedData.resources || []).length, "Demo resource library"],
      ["Example pending", currency(commissions.estimatedPending || 0), "Not a payable balance"]
    ].map(renderMetric).join("");
  }

  function renderMetric(item) {
    return '<article class="dashboard-metric"><span class="dashboard-metric-label">' + esc(item[0]) + '</span><span class="dashboard-metric-value">' + esc(item[1]) + '</span><span class="dashboard-metric-note">' + esc(item[2]) + '</span></article>';
  }

  function renderLeadCards(leads) {
    var list = Array.isArray(leads) ? leads : [];
    if (!list.length) return empty("No leads yet.", "Submit a demo lead or connect a live partner session.");

    return list.map(function (lead) {
      var live = Boolean(lead.liveReadOnly);
      var readiness = lead.readinessScore == null ? "Not available" : lead.readinessScore + (lead.readinessTier ? " · " + lead.readinessTier : "");
      return [
        '<article class="dashboard-card dashboard-card-pad" data-lead-card="' + esc(lead.id) + '">',
        '<div class="dashboard-card-header"><div><h3 class="dashboard-card-title">' + esc(lead.businessName) + '</h3><p class="dashboard-card-subtitle">' + esc(live ? "Protected contact" : (lead.contactName || "Demo contact")) + ' · ' + esc(lead.industry || "Funding readiness") + '</p></div>',
        badge(titleCase(lead.status), statusTone(lead.status)), '</div>',
        '<div class="mpc-grid mpc-grid-2">',
        '<p><strong>Funding need:</strong><br>' + currency(lead.fundingNeed || 0) + '</p>',
        '<p><strong>Readiness:</strong><br>' + esc(readiness) + '</p>',
        '<p><strong>Source:</strong><br>' + esc(lead.source || lead.useOfFunds || "Partner dashboard") + '</p>',
        '<p><strong>Next step:</strong><br>' + esc(lead.nextStep || "Review the latest status") + '</p>',
        '</div>',
        '<div class="cluster mt-4">',
        '<select data-lead-status="' + esc(lead.id) + '" aria-label="Status for ' + esc(lead.businessName) + '"' + (live ? ' disabled title="Live lead statuses are read-only."' : "") + '>',
        (config.leadStatuses || []).map(function (status) { return '<option value="' + esc(status.id) + '"' + (lead.status === status.id ? " selected" : "") + '>' + esc(status.label) + '</option>'; }).join(""),
        '</select>',
        live ? '' : '<button class="mpc-button mpc-button-outline" type="button" data-remove-lead="' + esc(lead.id) + '">Remove</button>',
        '<button class="mpc-button mpc-button-ghost" type="button" data-copy-text="' + esc(lead.id) + '">Copy Lead ID</button>',
        '</div>',
        '<small class="mpc-muted">Updated ' + esc(date(lead.updatedAt || lead.createdAt)) + ' · ' + (live ? "Live partner-safe projection" : "Local demo record") + '</small>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderPartnerLinks(profile, links) {
    var liveLinks = Array.isArray(links) ? links : [];
    if (liveLinks.length) {
      return liveLinks.map(function (item) {
        return '<article class="dashboard-link-builder"><div class="split"><div><h3 class="dashboard-card-title">' + esc(item.name || "Tracking link") + '</h3><p class="dashboard-card-subtitle">' + esc(item.tracking_link_id || "") + '</p></div>' + badge(item.status || "active", item.status === "active" ? "success" : "warning") + '</div><div class="dashboard-copy-row"><input type="text" value="' + esc(item.tracking_url || "") + '" readonly><button class="mpc-button mpc-button-outline" type="button" data-copy-text="' + esc(item.tracking_url || "") + '">Copy</button></div><small class="mpc-muted">' + Number(item.clicks || 0) + ' clicks · ' + Number(item.lead_submissions || 0) + ' lead submissions</small></article>';
      }).join("");
    }

    var partner = profile || {};
    var destinations = [
      { label: "Am I Fundable", url: "https://am-i-fundable.vercel.app/" },
      { label: "FundStack AI", url: "https://fund-stack-ai.vercel.app/" },
      { label: "Partner resources", url: "./resources.html" }
    ];
    return destinations.map(function (item) {
      var link = dashboard.affiliateStore && dashboard.affiliateStore.buildLink ? dashboard.affiliateStore.buildLink(item.url, { source: "partner_dashboard" }) : item.url;
      return '<article class="dashboard-link-builder"><div class="split"><div><h3 class="dashboard-card-title">' + esc(item.label) + '</h3><p class="dashboard-card-subtitle">Partner ID: ' + esc(partner.partnerId || "MS-DEMO-0000") + '</p></div>' + badge("Demo link", "info") + '</div><div class="dashboard-copy-row"><input type="text" value="' + esc(link) + '" readonly><button class="mpc-button mpc-button-outline" type="button" data-copy-text="' + esc(link) + '">Copy</button></div></article>';
    }).join("");
  }

  function renderResources(resources, favorites) {
    var list = Array.isArray(resources) ? resources : [];
    var favs = Array.isArray(favorites) ? favorites : [];
    if (!list.length) return empty("No resources assigned.", "Assigned scripts, checklists, and campaign assets will appear here.");
    return list.map(function (resource) {
      var id = resource.id || resource.resource_id;
      var title = resource.title || resource.name;
      var summary = resource.summary || resource.description || "Partner resource";
      var href = resource.href || resource.download_url || resource.resource_url || "./resources.html";
      var active = favs.indexOf(id) >= 0;
      return '<article class="dashboard-card dashboard-card-pad"><div class="dashboard-card-header"><div>' + badge(resource.type || resource.format || resource.category || "Resource", "info") + '<h3 class="dashboard-card-title mt-3">' + esc(title) + '</h3></div><button class="mpc-button mpc-button-ghost" type="button" data-toggle-resource-favorite="' + esc(id) + '" aria-pressed="' + (active ? "true" : "false") + '">' + (active ? "Saved" : "Save") + '</button></div><p>' + esc(summary) + '</p><small class="mpc-muted">' + esc(resource.complianceNote || resource.compliance_status || "") + '</small><a class="mpc-button mpc-button-outline mt-4" href="' + esc(href) + '">Open resource</a></article>';
    }).join("");
  }

  function renderWidgets(widgets) {
    var list = Array.isArray(widgets) ? widgets : [];
    if (!list.length) {
      list = [{ preset_id: "funding-readiness-scorecard-widget", name: "Funding Readiness Scorecard", description: "Partner-attributed readiness widget connected to the Am I Fundable flow.", status: "available", preview_url: "https://embed-widgets-kappa.vercel.app/", embed_url: "https://am-i-fundable.vercel.app/embed.html" }];
    }
    return list.map(function (widget) {
      var name = widget.name || widget.preset_id || "Partner widget";
      var status = widget.status || "available";
      var preview = widget.preview_url || widget.embed_url || "https://embed-widgets-kappa.vercel.app/";
      var embed = widget.embed_url || preview;
      var iframe = '<iframe src="' + embed + '" title="' + name + '" loading="lazy" width="100%" height="640" style="border:0"></iframe>';
      return '<article class="dashboard-card dashboard-card-pad"><div class="dashboard-card-header"><div>' + badge(status, status === "active" || status === "available" ? "success" : "warning") + '<h3 class="dashboard-card-title mt-3">' + esc(name) + '</h3><p class="dashboard-card-subtitle">' + esc(widget.description || "Approved partner-attributed widget preset.") + '</p></div></div><div class="mpc-actions"><a class="mpc-button mpc-button-outline" href="' + esc(preview) + '" target="_blank" rel="noopener">Preview</a><button class="mpc-button mpc-button-primary" type="button" data-copy-text="' + esc(iframe) + '">Copy iframe</button></div></article>';
    }).join("");
  }

  function renderCommissions(commissions) {
    var data = commissions || {};
    var summary = data.summary || data;
    var estimated = summary.estimatedPending != null ? summary.estimatedPending : summary.pending_verification && summary.pending_verification.amount;
    var verified = summary.verified != null ? summary.verified : summary.verified && summary.verified.amount;
    var paid = summary.demoPaid != null ? summary.demoPaid : summary.paid && summary.paid.amount;
    return '<div class="mpc-disclaimer">' + esc(data.disclaimer || data.calculation_disclaimer || config.disclaimers && config.disclaimers.commissions || "") + '</div><div class="dashboard-grid mt-5">' + [
      ["Estimated", currency(estimated || 0), "Planning value only"],
      ["Verified", currency(typeof verified === "object" ? verified.amount : verified || 0), "Authorized records only"],
      ["Paid", currency(paid || 0), "Posted payout records only"]
    ].map(renderMetric).join("") + '</div>';
  }

  function renderEvents(events) {
    var list = Array.isArray(events) ? events : [];
    if (!list.length) return empty("No activity yet.", "Partner-visible events will appear here.");
    return '<ol class="dashboard-activity-list">' + list.slice(0, 10).map(function (item) {
      return '<li class="dashboard-activity-item"><span class="dashboard-activity-icon" aria-hidden="true">•</span><div><strong>' + esc(item.label || item.title || item.type) + '</strong><p>' + esc(item.message || "") + '</p><small>' + esc(date(item.createdAt || item.created_at)) + '</small></div></li>';
    }).join("") + '</ol>';
  }

  function renderIntegrationStatus(state) {
    var current = state || {};
    var mode = current.dashboardData && current.dashboardData.mode || "demo";
    var generated = current.dashboardData && current.dashboardData.generatedAt;
    var rows = [
      ["Dashboard mode", mode === "live" ? "Live API" : "Demo / localStorage", mode === "live" ? "success" : "info"],
      ["Partner isolation", mode === "live" ? "Session-derived" : "Demo only", mode === "live" ? "success" : "info"],
      ["Lead write path", mode === "live" ? "Am I Fundable → /api/lead-router" : "Local demo store", "info"],
      ["Last generated", generated ? date(generated) : "Local session", "info"]
    ];
    return rows.map(function (row) { return '<div class="dashboard-note split"><strong>' + esc(row[0]) + '</strong>' + badge(row[1], row[2]) + '</div>'; }).join("");
  }

  function renderAll(root, state) {
    if (!ui) return;
    var scope = root || document;
    var current = state || dashboard.state && dashboard.state.getState() || {};
    var seed = dashboard.seedData || {};
    var targets = [
      [config.selectors && config.selectors.profileCard, renderProfileCard(current.partnerProfile)],
      [config.selectors && config.selectors.metrics, renderMetrics(current)],
      [config.selectors && config.selectors.leadList, renderLeadCards(current.leads)],
      [config.selectors && config.selectors.partnerLinks, renderPartnerLinks(current.partnerProfile, current.trackingLinks)],
      [config.selectors && config.selectors.resources, renderResources(seed.resources || current.resources, current.resourceFavorites)],
      [config.selectors && config.selectors.widgets, renderWidgets(current.widgets)],
      [config.selectors && config.selectors.commissions, renderCommissions(current.commissions || seed.commissions)],
      [config.selectors && config.selectors.events, renderEvents(current.events)],
      [config.selectors && config.selectors.integrationStatus, renderIntegrationStatus(current)]
    ];
    targets.forEach(function (pair) { var element = pair[0] && scope.querySelector(pair[0]); if (element) element.innerHTML = pair[1]; });
  }

  dashboard.renderers = {
    badge: badge,
    empty: empty,
    renderProfileCard: renderProfileCard,
    renderMetrics: renderMetrics,
    renderLeadCards: renderLeadCards,
    renderPartnerLinks: renderPartnerLinks,
    renderResources: renderResources,
    renderWidgets: renderWidgets,
    renderCommissions: renderCommissions,
    renderEvents: renderEvents,
    renderIntegrationStatus: renderIntegrationStatus,
    renderAll: renderAll
  };
})(window, document);
