/*
  Moonshine Partner Command Center
  Batch 08 — Dashboard Renderers

  HTML render helpers for Batch 09 dashboard shell.
*/

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
    return String(value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function upper(match) {
        return match.toUpperCase();
      });
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
    var statusConfig = (config.leadStatuses || []).find(function findStatus(item) {
      return item.id === status;
    });

    return statusConfig ? statusConfig.tone : "default";
  }

  function empty(title, body) {
    return [
      '<div class="mpc-empty">',
      '<div>',
      '<strong>' + esc(title || "Nothing here yet.") + '</strong>',
      '<p>' + esc(body || "Add data to start using this section.") + '</p>',
      '</div>',
      '</div>'
    ].join("");
  }

  function renderProfileCard(profile) {
    var item = profile || {};
    var initials = ui && ui.getInitials ? ui.getInitials(item.contactName, item.company) : "MS";

    return [
      '<article class="dashboard-card dashboard-card-pad dashboard-profile-card">',
      '<div class="cluster">',
      '<div class="dashboard-avatar" aria-hidden="true">' + esc(initials) + '</div>',
      '<div>',
      badge(item.status || "active-demo", "success"),
      '<h2 class="dashboard-card-title mt-3">' + esc(item.contactName || "Demo Partner") + '</h2>',
      '<p class="dashboard-card-subtitle">' + esc(item.company || "Moonshine Partner") + '</p>',
      '</div>',
      '</div>',
      '<div class="mpc-grid">',
      '<div class="dashboard-note"><strong>Partner ID</strong><br><span data-partner-id>' + esc(item.partnerId || "MS-DEMO-0000") + '</span></div>',
      '<div class="dashboard-note"><strong>Partner type</strong><br>' + esc(titleCase(item.partnerType || "partner")) + '</div>',
      '<div class="dashboard-note"><strong>Audience</strong><br>' + esc(item.primaryAudience || "Small business owners") + '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderMetrics(state) {
    var leadSummary = dashboard.leadStore ? dashboard.leadStore.summarizeLeads(state && state.leads) : { total: 0, reviewing: 0, funded: 0, requestedFunding: 0 };
    var training = dashboard.resourceStore ? dashboard.resourceStore.summarizeTraining() : { completed: 0, total: 0, percent: 0 };
    var commissions = dashboard.seedData && dashboard.seedData.commissions && dashboard.seedData.commissions.summary || {};

    var metrics = [
      { label: "Demo leads", value: leadSummary.total, note: "Stored locally" },
      { label: "In review", value: leadSummary.reviewing + leadSummary.submitted + leadSummary.needsInfo, note: "Example workflow states" },
      { label: "Requested funding", value: currency(leadSummary.requestedFunding), note: "Not an approval amount" },
      { label: "Training", value: training.percent + "%", note: training.completed + " of " + training.total + " modules" },
      { label: "Example pending", value: currency(commissions.estimatedPending || 0), note: "Not payable balance" }
    ];

    return metrics.map(function metricCard(metric) {
      return [
        '<article class="dashboard-metric">',
        '<span class="dashboard-metric-label">' + esc(metric.label) + '</span>',
        '<span class="dashboard-metric-value">' + esc(metric.value) + '</span>',
        '<span class="dashboard-metric-note">' + esc(metric.note) + '</span>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderLeadCards(leads) {
    var list = Array.isArray(leads) ? leads : [];
    if (!list.length) return empty("No leads yet.", "Submit a demo lead to populate the tracker.");

    return list.map(function leadCard(lead) {
      return [
        '<article class="dashboard-card dashboard-card-pad" data-lead-card="' + esc(lead.id) + '">',
        '<div class="dashboard-card-header">',
        '<div>',
        '<h3 class="dashboard-card-title">' + esc(lead.businessName) + '</h3>',
        '<p class="dashboard-card-subtitle">' + esc(lead.contactName) + ' · ' + esc(lead.industry || "Industry not set") + '</p>',
        '</div>',
        badge(titleCase(lead.status), statusTone(lead.status)),
        '</div>',
        '<div class="mpc-grid mpc-grid-2">',
        '<p><strong>Funding need:</strong><br>' + currency(lead.fundingNeed) + '</p>',
        '<p><strong>Monthly revenue:</strong><br>' + currency(lead.monthlyRevenue) + '</p>',
        '<p><strong>Use of funds:</strong><br>' + esc(lead.useOfFunds || "Not provided") + '</p>',
        '<p><strong>Next step:</strong><br>' + esc(lead.nextStep || "Review details") + '</p>',
        '</div>',
        '<div class="cluster mt-4">',
        '<select data-lead-status="' + esc(lead.id) + '" aria-label="Update status for ' + esc(lead.businessName) + '">',
        (config.leadStatuses || []).map(function statusOption(status) {
          return '<option value="' + esc(status.id) + '"' + (lead.status === status.id ? " selected" : "") + '>' + esc(status.label) + '</option>';
        }).join(""),
        '</select>',
        '<button class="mpc-button mpc-button-outline" type="button" data-remove-lead="' + esc(lead.id) + '">Remove</button>',
        '</div>',
        '<small class="mpc-muted">Created ' + esc(date(lead.createdAt)) + ' · Partner ' + esc(lead.partnerId) + '</small>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderMarketplace(offers, favorites) {
    var list = Array.isArray(offers) ? offers : [];
    var favs = Array.isArray(favorites) ? favorites : [];

    if (!list.length) return empty("No marketplace offers.", "Add marketplace data to /data/marketplace-offers.js.");

    return list.map(function offerCard(offer) {
      var active = favs.indexOf(offer.id) >= 0;

      return [
        '<article class="dashboard-card dashboard-card-pad" id="market-' + esc(offer.id) + '">',
        '<div class="dashboard-card-header">',
        '<div>',
        badge(offer.category, offer.featured ? "success" : "default"),
        '<h3 class="dashboard-card-title mt-3">' + esc(offer.title) + '</h3>',
        '</div>',
        '<button class="mpc-button mpc-button-ghost" type="button" data-toggle-offer-favorite="' + esc(offer.id) + '" aria-pressed="' + (active ? "true" : "false") + '">' + (active ? "Saved" : "Save") + '</button>',
        '</div>',
        '<p>' + esc(offer.summary) + '</p>',
        '<small class="mpc-muted">' + esc(offer.complianceNote || "") + '</small>',
        '<div class="mpc-actions mt-4">',
        '<a class="mpc-button mpc-button-outline" href="' + esc(offer.ctaUrl || "./marketplace.html") + '">Open</a>',
        '<button class="mpc-button mpc-button-ghost" type="button" data-copy-offer-link="' + esc(offer.ctaUrl || "./marketplace.html") + '">Copy Link</button>',
        '</div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderPartnerLinks(profile) {
    var partner = profile || {};
    var destinations = [
      { label: "Partner homepage", url: "./index.html" },
      { label: "Partner access", url: "./partner-access.html" },
      { label: "Marketplace", url: "./marketplace.html" },
      { label: "Resources", url: "./resources.html" },
      { label: "Funding readiness checklist", url: "./tools/funding-readiness-checklist.html" }
    ];

    return destinations.map(function linkRow(item) {
      var link = dashboard.affiliateStore && dashboard.affiliateStore.buildLink
        ? dashboard.affiliateStore.buildLink(item.url, { source: "dashboard" })
        : item.url;

      return [
        '<article class="dashboard-link-builder">',
        '<div class="split">',
        '<div>',
        '<h3 class="dashboard-card-title">' + esc(item.label) + '</h3>',
        '<p class="dashboard-card-subtitle">Partner ID: ' + esc(partner.partnerId || "MS-DEMO-0000") + '</p>',
        '</div>',
        badge("Trackable demo", "success"),
        '</div>',
        '<div class="dashboard-copy-row">',
        '<input type="text" value="' + esc(link) + '" readonly aria-label="' + esc(item.label) + ' link">',
        '<button class="mpc-button mpc-button-outline" type="button" data-copy-text="' + esc(link) + '">Copy</button>',
        '</div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderResources(resources, favorites) {
    var list = Array.isArray(resources) ? resources : [];
    var favs = Array.isArray(favorites) ? favorites : [];

    if (!list.length) return empty("No resources yet.", "Add resources to the data layer.");

    return list.map(function resourceCard(resource) {
      var active = favs.indexOf(resource.id) >= 0;

      return [
        '<article class="dashboard-card dashboard-card-pad">',
        '<div class="dashboard-card-header">',
        '<div>',
        badge(resource.type || "Resource", "info"),
        '<h3 class="dashboard-card-title mt-3">' + esc(resource.title) + '</h3>',
        '</div>',
        '<button class="mpc-button mpc-button-ghost" type="button" data-toggle-resource-favorite="' + esc(resource.id) + '" aria-pressed="' + (active ? "true" : "false") + '">' + (active ? "Saved" : "Save") + '</button>',
        '</div>',
        '<p>' + esc(resource.summary) + '</p>',
        '<small class="mpc-muted">' + esc(resource.complianceNote || "") + '</small>',
        '<a class="mpc-button mpc-button-outline mt-4" href="' + esc(resource.href || "./resources.html") + '">Open resource</a>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderTraining(modules, progress) {
    var list = Array.isArray(modules) ? modules : [];
    var done = progress || {};

    if (!list.length) return empty("No training modules yet.", "Add training modules to the data layer.");

    return list.map(function moduleCard(moduleItem) {
      var complete = Boolean(done[moduleItem.id]);

      return [
        '<article class="dashboard-card dashboard-card-pad">',
        '<div class="dashboard-card-header">',
        '<div>',
        badge(moduleItem.level || "Recommended", moduleItem.level === "Required" ? "warning" : "success"),
        '<h3 class="dashboard-card-title mt-3">' + esc(moduleItem.title) + '</h3>',
        '<p class="dashboard-card-subtitle">' + esc(moduleItem.track) + ' · ' + esc(moduleItem.durationMinutes) + ' min</p>',
        '</div>',
        '<button class="mpc-button ' + (complete ? 'mpc-button-primary' : 'mpc-button-outline') + '" type="button" data-toggle-training="' + esc(moduleItem.id) + '">' + (complete ? "Done" : "Mark done") + '</button>',
        '</div>',
        '<p>' + esc(moduleItem.summary) + '</p>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderCommissions(commissions) {
    var data = commissions || {};
    var rows = data.rows || [];
    var summary = data.summary || {};

    return [
      '<div class="mpc-disclaimer">' + esc(data.disclaimer || config.disclaimers && config.disclaimers.commissions || "") + '</div>',
      '<div class="dashboard-grid mt-5">',
      '<article class="dashboard-metric"><span class="dashboard-metric-label">Example pending</span><span class="dashboard-metric-value">' + currency(summary.estimatedPending || 0) + '</span><span class="dashboard-metric-note">Not payable balance</span></article>',
      '<article class="dashboard-metric"><span class="dashboard-metric-label">Demo paid</span><span class="dashboard-metric-value">' + currency(summary.demoPaid || 0) + '</span><span class="dashboard-metric-note">Fictional example</span></article>',
      '<article class="dashboard-metric"><span class="dashboard-metric-label">Demo funded deals</span><span class="dashboard-metric-value">' + esc(summary.demoFundedDeals || 0) + '</span><span class="dashboard-metric-note">Sample data</span></article>',
      '</div>',
      '<div class="mpc-table-wrap mt-5">',
      '<table>',
      '<thead><tr><th>Partner</th><th>Business</th><th>Status</th><th>Example Amount</th></tr></thead>',
      '<tbody>',
      rows.map(function row(item) {
        return '<tr><td>' + esc(item.partnerName) + '</td><td>' + esc(item.businessName) + '</td><td>' + esc(titleCase(item.status)) + '</td><td>' + currency(item.commissionAmount || 0) + '</td></tr>';
      }).join(""),
      '</tbody>',
      '</table>',
      '</div>'
    ].join("");
  }

  function renderIntegrations(cards) {
    var list = Array.isArray(cards) ? cards : config.integrationCards || [];

    return list.map(function integrationCard(card) {
      return [
        '<article class="dashboard-card dashboard-card-pad">',
        badge(card.status || "Blueprint", "warning"),
        '<h3 class="dashboard-card-title mt-3">' + esc(card.title) + '</h3>',
        '<p>' + esc(card.summary) + '</p>',
        '<a class="mpc-button mpc-button-outline mt-4" href="' + esc(card.href) + '">Open docs</a>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderNotes(notes) {
    var list = Array.isArray(notes) ? notes : [];

    if (!list.length) return empty("No notes yet.", "Add a local CRM-lite note to track follow-up context.");

    return list.map(function noteCard(note) {
      return [
        '<article class="dashboard-note">',
        '<div class="split">',
        '<strong>' + esc(note.title || "Partner note") + '</strong>',
        '<button class="mpc-button mpc-button-ghost mpc-button-sm" type="button" data-remove-note="' + esc(note.id) + '">Remove</button>',
        '</div>',
        '<p>' + esc(note.body || "") + '</p>',
        '<time datetime="' + esc(note.createdAt) + '">' + esc(date(note.createdAt)) + '</time>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderEvents(events) {
    var list = Array.isArray(events) ? events : [];

    if (!list.length) return empty("No activity yet.", "Dashboard events will appear here.");

    return [
      '<ol class="dashboard-activity-list">',
      list.slice(0, 12).map(function eventItem) {
        return [
          '<li class="dashboard-activity-item">',
          '<span class="dashboard-activity-icon" aria-hidden="true">•</span>',
          '<div>',
          '<strong>' + esc(eventItem.label || eventItem.type) + '</strong>',
          '<p>' + esc(eventItem.message || "") + '</p>',
          '<small>' + esc(date(eventItem.createdAt)) + ' · ' + esc(eventItem.partnerId || "") + '</small>',
          '</div>',
          '</li>'
        ].join("");
      }).join(""),
      '</ol>'
    ].join("");
  }

  function renderAll(root, state) {
    if (!ui) return;

    var scope = root || document;
    var current = state || (dashboard.state && dashboard.state.getState()) || {};
    var seed = dashboard.seedData || {};

    var targets = [
      [config.selectors && config.selectors.profileCard, renderProfileCard(current.partnerProfile)],
      [config.selectors && config.selectors.metrics, renderMetrics(current)],
      [config.selectors && config.selectors.leadList, renderLeadCards(current.leads)],
      [config.selectors && config.selectors.marketplace, renderMarketplace(seed.marketplaceOffers, current.marketplaceFavorites)],
      [config.selectors && config.selectors.partnerLinks, renderPartnerLinks(current.partnerProfile)],
      [config.selectors && config.selectors.resources, renderResources(seed.resources, current.resourceFavorites)],
      [config.selectors && config.selectors.training, renderTraining(seed.trainingModules, current.trainingProgress)],
      [config.selectors && config.selectors.commissions, renderCommissions(seed.commissions)],
      [config.selectors && config.selectors.integrations, renderIntegrations(config.integrationCards)],
      [config.selectors && config.selectors.notes, renderNotes(current.notes)],
      [config.selectors && config.selectors.events, renderEvents(current.events)]
    ];

    targets.forEach(function renderTarget(pair) {
      var selector = pair[0];
      var html = pair[1];
      if (!selector) return;

      var element = scope.querySelector(selector);
      if (element) element.innerHTML = html;
    });
  }

  dashboard.renderers = {
    badge: badge,
    empty: empty,
    renderProfileCard: renderProfileCard,
    renderMetrics: renderMetrics,
    renderLeadCards: renderLeadCards,
    renderMarketplace: renderMarketplace,
    renderPartnerLinks: renderPartnerLinks,
    renderResources: renderResources,
    renderTraining: renderTraining,
    renderCommissions: renderCommissions,
    renderIntegrations: renderIntegrations,
    renderNotes: renderNotes,
    renderEvents: renderEvents,
    renderAll: renderAll
  };
})(window, document);
