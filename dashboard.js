/* Partner Command Center dashboard controller. */
(function initPartnerDashboard(window, document) {
  "use strict";

  var os = window.MoonshineOS || {};
  var dashboard = os.dashboard || {};
  var ui = os.ui;
  var forms = os.forms;
  var storage = os.storage;

  function ready(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  }

  function esc(value) {
    return ui && ui.escapeHTML ? ui.escapeHTML(value) : String(value == null ? "" : value);
  }

  function titleCase(value) {
    return String(value || "").replace(/[-_]+/g, " ").replace(/\b\w/g, function (match) { return match.toUpperCase(); });
  }

  function getState() {
    return dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
  }

  function setState(patch, meta) {
    return dashboard.state && dashboard.state.setState ? dashboard.state.setState(patch, meta) : {};
  }

  function getProfile() {
    return dashboard.partnerStore && dashboard.partnerStore.getProfile ? dashboard.partnerStore.getProfile() : getState().partnerProfile || {};
  }

  function toast(message, tone) {
    if (ui && ui.toast) ui.toast(message, { tone: tone || "success" });
  }

  function logEvent(event) {
    if (dashboard.eventStore && dashboard.eventStore.addEvent) dashboard.eventStore.addEvent(event);
  }

  function renderNav() {
    var nav = document.querySelector("[data-dashboard-nav]");
    var items = window.MoonshineData && window.MoonshineData.dashboardNav;
    if (!nav || !Array.isArray(items)) return;
    nav.innerHTML = items.map(function (item) {
      return '<a href="' + esc(item.href) + '" title="' + esc(item.description) + '">' + esc(item.label) + '</a>';
    }).join("");
  }

  function setActiveNav(id) {
    Array.prototype.slice.call(document.querySelectorAll(".dashboard-nav a[href^='#']")).forEach(function (link) {
      var active = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
  }

  function renderOnboarding() {
    var state = getState();
    var profile = getProfile();
    var live = state.dashboardData && state.dashboardData.mode === "live";
    var percent = live && state.onboarding ? Number(state.onboarding.percent || 0) : null;
    var steps = live ? [
      ["Partner profile", Boolean(profile.partnerId)],
      ["Partner status active", profile.status === "active"],
      ["Tracking link assigned", Boolean(state.trackingLinks && state.trackingLinks.length)],
      ["First lead submitted", Boolean(state.leads && state.leads.length)]
    ] : [
      ["Create partner profile", Boolean(profile.partnerId)],
      ["Review privacy boundaries", true],
      ["Submit first demo lead", Boolean(state.leads && state.leads.length)],
      ["Copy a partner link", Boolean(storage && storage.get && storage.get("copiedPartnerLink", false))]
    ];
    if (percent === null) percent = Math.round((steps.filter(function (step) { return step[1]; }).length / steps.length) * 100);
    var progress = document.querySelector("[data-onboarding-progress]");
    var target = document.querySelector("[data-render-onboarding]");
    if (progress) progress.style.setProperty("--progress", percent + "%");
    if (target) target.innerHTML = steps.map(function (step) {
      return '<label class="dashboard-check-item"><input type="checkbox" disabled ' + (step[1] ? "checked" : "") + '><span><strong>' + esc(step[0]) + '</strong><span>' + (step[1] ? "Complete" : "Action still needed") + '</span></span></label>';
    }).join("");
  }

  function getCommandPriority() {
    var state = getState();
    var leads = Array.isArray(state.leads) ? state.leads : [];
    var items = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    leads.forEach(function addLeadSignal(lead) {
      if (["new", "reviewing", "needsInfo", "submitted"].indexOf(lead.status) < 0) return;
      var due = lead.followUpAt ? new Date(lead.followUpAt) : null;
      if (due && due < today) {
        items.push({ priority: 10, label: "Overdue follow-up: " + (lead.businessName || "Client"), detail: lead.nextStep || "Review the latest client status.", href: "#leads", tone: "danger" });
        return;
      }
      if (lead.status === "needsInfo" || lead.documentStatus === "requested") {
        items.push({ priority: 20, label: "Waiting on client: " + (lead.businessName || "Client"), detail: lead.nextStep || "Request the missing readiness information.", href: "#leads", tone: "warning" });
        return;
      }
      if (lead.status === "submitted") {
        items.push({ priority: 30, label: "Provider review: " + (lead.businessName || "Client"), detail: lead.nextStep || "Check the latest submission status.", href: "#leads", tone: "info" });
        return;
      }
      if (lead.status === "new") {
        items.push({ priority: 40, label: "Review new lead: " + (lead.businessName || "Client"), detail: lead.nextStep || "Review the lead and choose the next move.", href: "#leads", tone: "info" });
      }
    });
    var profile = getProfile();
    var missingProfile = !(state.dashboardData && state.dashboardData.mode === "live") && [profile.company, profile.contactName, profile.primaryAudience].some(function missing(value) { return !value; });
    if (missingProfile || state.dashboardData && state.dashboardData.mode === "live" && profile.profileCompleteness != null && profile.profileCompleteness < 100) {
      items.push({ priority: 50, label: "Complete Account profile", detail: "Add the public profile information needed for Growth.", href: "./account.html#profile", tone: "warning" });
    }
    var modules = dashboard.seedData && dashboard.seedData.trainingModules || [];
    var progress = state.trainingProgress || {};
    var nextTraining = modules.find(function incomplete(moduleItem) { return !progress[moduleItem.id]; });
    if (nextTraining) items.push({ priority: 60, label: "Next training: " + nextTraining.title, detail: nextTraining.summary, href: "./learn.html#training", tone: "info" });
    if (Array.isArray(state.teamMembers) && state.teamMembers.length) items.push({ priority: 70, label: "Review team coaching", detail: "Open connected team attention and Game Plans.", href: "./team.html#my-team", tone: "info" });
    if (leads.some(function funded(lead) { return lead.status === "funded"; })) items.push({ priority: 80, label: "Review production", detail: "Funded activity is available in the Earn scorecard.", href: "./earn.html#production", tone: "success" });
    return items.sort(function sortPriority(a, b) { return a.priority - b.priority; }).slice(0, 5);
  }

  function renderCommandPriority() {
    var target = document.querySelector("[data-render-command-priority]");
    if (!target) return;
    var items = getCommandPriority();
    if (!items.length) {
      target.innerHTML = '<div class="mpc-empty"><strong>No immediate attention signals.</strong><p>Command is clear. Open Pipeline, Growth, or Learn when you are ready for the next operating move.</p><div class="dashboard-row-actions"><a class="mpc-button mpc-button-outline mpc-button-sm" href="#leads">Open Pipeline</a><a class="mpc-button mpc-button-outline mpc-button-sm" href="./learn.html">Open Learn</a></div></div>';
      return;
    }
    target.innerHTML = '<div class="dashboard-command-primary"><span class="mpc-eyebrow">Next move</span><strong>' + esc(items[0].label) + '</strong><p>' + esc(items[0].detail) + '</p><a class="mpc-button mpc-button-primary mpc-button-sm" href="' + esc(items[0].href) + '">Open Next Move</a></div><ol class="dashboard-priority-list">' + items.slice(1).map(function renderSignal(item) { return '<li><span class="mpc-badge mpc-badge-' + esc(item.tone === "danger" ? "danger" : item.tone === "warning" ? "warning" : item.tone === "success" ? "success" : "info") + '">' + esc(item.label) + '</span><div><strong>' + esc(item.detail) + '</strong><a href="' + esc(item.href) + '">Open</a></div></li>'; }).join("") + '</ol>';
  }

  function renderPartnerId() {
    var target = document.querySelector("[data-render-partner-id]");
    if (!target) return;
    var state = getState();
    var profile = getProfile();
    var live = state.dashboardData && state.dashboardData.mode === "live";
    var link = dashboard.affiliateStore && dashboard.affiliateStore.buildLink
      ? dashboard.affiliateStore.buildLink("https://am-i-fundable.vercel.app/", { source: "partner_dashboard" })
      : "https://am-i-fundable.vercel.app/?partner_id=" + encodeURIComponent(profile.partnerId || "MS-DEMO-0000");
    target.innerHTML = [
      '<div class="dashboard-id-block">',
      '<span class="mpc-badge ' + (live ? "mpc-badge-success" : "mpc-badge-info") + '">' + (live ? "Server-controlled identity" : "Demo identity") + '</span>',
      '<h3 class="dashboard-card-title">Partner ID</h3>',
      '<div class="dashboard-id-value">' + esc(profile.partnerId || "MS-DEMO-0000") + '</div>',
      '<div class="dashboard-mini-grid">',
      '<div class="dashboard-mini-item"><strong>Name</strong><span>' + esc(profile.contactName || "Demo Partner") + '</span></div>',
      '<div class="dashboard-mini-item"><strong>Company</strong><span>' + esc(profile.company || "Moonshine Partner") + '</span></div>',
      '<div class="dashboard-mini-item"><strong>Type</strong><span>' + esc(titleCase(profile.partnerType || "partner")) + '</span></div>',
      '<div class="dashboard-mini-item"><strong>Status</strong><span>' + esc(profile.status || "active-demo") + '</span></div>',
      '</div>',
      '<div class="dashboard-copy-row"><input type="text" value="' + esc(link) + '" readonly><button class="mpc-button mpc-button-outline" type="button" data-copy-text="' + esc(link) + '">Copy Referral Link</button></div>',
      '</div>'
    ].join("");
  }

  function renderAll() {
    var root = document.querySelector("[data-dashboard-root]") || document;
    var state = getState();
    if (dashboard.renderers && dashboard.renderers.renderAll) dashboard.renderers.renderAll(root, state);
    renderOnboarding();
    renderCommandPriority();
    renderPartnerId();
    var theme = document.querySelector("[data-theme-select]");
    if (theme) theme.value = state.theme || document.documentElement.getAttribute("data-theme") || "dark";
    var notice = document.querySelector("[data-compliance-notice]");
    if (notice && dashboard.config && dashboard.config.disclaimers) notice.textContent = dashboard.config.disclaimers.privacy + " " + dashboard.config.disclaimers.commissions;
    if (os.affiliateTracking) {
      os.affiliateTracking.hydratePartnerFields(root);
      os.affiliateTracking.bindCopyButtons(root);
    }
  }

  function bindNavigation() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest('.dashboard-nav a[href^="#"], a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveNav(id);
      setState({ activeSection: id }, { type: "dashboard.nav" });
      window.history.replaceState({}, "", "#" + id);
      closeMobileMenu();
    });

    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-dashboard-section]"));
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) setActiveNav(entry.target.id); });
      }, { rootMargin: "-25% 0px -65% 0px", threshold: 0.01 });
      sections.forEach(function (section) { observer.observe(section); });
    }
  }

  function closeMobileMenu() {
    var panel = document.querySelector("[data-mobile-menu-panel]");
    var toggle = document.querySelector("[data-mobile-menu-toggle]");
    var backdrop = document.querySelector("[data-mobile-menu-backdrop]");
    if (panel) panel.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (backdrop) backdrop.hidden = true;
  }

  function bindMobileMenu() {
    var panel = document.querySelector("[data-mobile-menu-panel]");
    var toggle = document.querySelector("[data-mobile-menu-toggle]");
    var backdrop = document.querySelector("[data-mobile-menu-backdrop]");
    if (!panel || !toggle) return;
    toggle.addEventListener("click", function () {
      var open = !panel.classList.contains("is-open");
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (backdrop) backdrop.hidden = !open;
    });
    if (backdrop) backdrop.addEventListener("click", closeMobileMenu);
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeMobileMenu(); });
  }

  function bindLeadForm() {
    var form = document.querySelector("[data-lead-form]");
    if (!form || !forms || !dashboard.leadStore) return;
    forms.bindSubmit(form, function (data) {
      var lead = dashboard.leadStore.createLead({
        businessName: data.businessName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        industry: data.industry,
        monthlyRevenue: forms.toNumber(data.monthlyRevenue, 0),
        timeInBusiness: data.timeInBusiness,
        fundingNeed: forms.toNumber(data.fundingNeed, 0),
        useOfFunds: data.useOfFunds,
        urgency: data.urgency,
        source: data.source || "Dashboard demo",
        notes: data.notes,
        nextStep: "Review the fictional demo lead and practice the readiness workflow.",
        tags: [data.industry, data.urgency].filter(Boolean)
      });
      toast("Demo lead saved: " + lead.businessName, "success");
      form.reset();
      renderAll();
    });

    var fill = document.querySelector("[data-fill-demo-lead]");
    if (fill) fill.addEventListener("click", function () {
      forms.hydrateForm(form, {
        businessName: "Demo Main Street Services",
        contactName: "Casey Morgan",
        email: "demo@example.com",
        phone: "(555) 010-2424",
        industry: "Local services",
        timeInBusiness: "3 years",
        monthlyRevenue: "$62,000",
        fundingNeed: "$48,000",
        urgency: "30 days",
        source: "Dashboard demo",
        useOfFunds: "Inventory, payroll bridge, and marketing runway.",
        notes: "Fictional demo data only."
      });
      toast("Sample lead filled.", "success");
    });
  }

  function bindProfileForm() {
    var form = document.querySelector("[data-profile-form]");
    if (!form || !forms || !dashboard.partnerStore) return;
    forms.hydrateForm(form, getProfile());
    forms.bindSubmit(form, function (data) {
      var state = getState();
      if (state.dashboardData && state.dashboardData.mode === "live") {
        toast("Live identity fields are server-controlled.", "warning");
        return;
      }
      dashboard.partnerStore.updateProfile(data);
      toast("Demo partner profile updated.", "success");
      renderAll();
      forms.hydrateForm(form, getProfile());
    }, { validate: false });
  }

  function bindLinkBuilder() {
    var form = document.querySelector("[data-link-builder-form]");
    var output = document.querySelector("[data-built-link]");
    var copy = document.querySelector("[data-copy-built-link]");
    if (!form || !forms || !output) return;
    function buildLink() {
      var data = forms.serializeForm(form);
      var params = { source: data.source || "partner_dashboard", utm_source: data.source || "partner_dashboard", utm_medium: "dashboard_referral", utm_campaign: data.campaign || "" };
      var link = dashboard.affiliateStore && dashboard.affiliateStore.buildLink ? dashboard.affiliateStore.buildLink(data.destination || "https://am-i-fundable.vercel.app/", params) : data.destination;
      output.value = link;
      return link;
    }
    form.addEventListener("submit", function (event) { event.preventDefault(); buildLink(); toast("Attribution link created.", "success"); });
    form.addEventListener("input", buildLink);
    form.addEventListener("change", buildLink);
    if (copy && ui) copy.addEventListener("click", function () {
      ui.copyText(output.value || buildLink()).then(function (copied) {
        if (copied && storage) storage.set("copiedPartnerLink", true);
        toast(copied ? "Tracking link copied." : "Copy is unavailable.", copied ? "success" : "warning");
        renderOnboarding();
      });
    });
    buildLink();
  }

  function bindGlobalActions() {
    document.addEventListener("change", function (event) {
      var leadStatus = event.target.closest("[data-lead-status]");
      if (leadStatus && dashboard.leadStore && !leadStatus.disabled) {
        dashboard.leadStore.updateStatus(leadStatus.getAttribute("data-lead-status"), leadStatus.value);
        toast("Demo lead status updated.", "success");
        renderAll();
        return;
      }
      if (event.target.closest("[data-lead-filter]")) {
        var filter = event.target.value;
        var leads = dashboard.leadStore ? dashboard.leadStore.filterLeads({ status: filter }) : getState().leads || [];
        var target = document.querySelector("[data-render-leads]");
        if (target && dashboard.renderers) target.innerHTML = dashboard.renderers.renderLeadCards(leads);
        return;
      }
      var theme = event.target.closest("[data-theme-select]");
      if (theme) {
        document.documentElement.setAttribute("data-theme", theme.value);
        setState({ theme: theme.value }, { type: "settings.theme" });
        return;
      }
      var input = event.target.closest("[data-import-dashboard]");
      if (input && input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function () {
          var result = dashboard.state.importState(reader.result);
          toast(result.ok ? "Demo JSON imported." : result.error, result.ok ? "success" : "danger");
          renderAll();
        };
        reader.readAsText(input.files[0]);
      }
    });

    document.addEventListener("click", function (event) {
      var copy = event.target.closest("[data-copy-text]");
      if (copy && ui) {
        ui.copyText(copy.getAttribute("data-copy-text")).then(function (copied) { toast(copied ? "Copied." : "Copy is unavailable.", copied ? "success" : "warning"); });
        return;
      }
      var resource = event.target.closest("[data-toggle-resource-favorite]");
      if (resource && dashboard.resourceStore) {
        dashboard.resourceStore.toggleResourceFavorite(resource.getAttribute("data-toggle-resource-favorite"));
        renderAll();
        return;
      }
      var removeLead = event.target.closest("[data-remove-lead]");
      if (removeLead && dashboard.leadStore) {
        dashboard.leadStore.removeLead(removeLead.getAttribute("data-remove-lead"));
        toast("Demo lead removed.", "warning");
        renderAll();
        return;
      }
      var exportButton = event.target.closest("[data-export-dashboard]");
      if (exportButton && dashboard.state) {
        var blob = new Blob([JSON.stringify(dashboard.state.exportState(), null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "partner-command-center-demo.json";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        toast("Demo JSON exported.", "success");
        return;
      }
      var reset = event.target.closest("[data-reset-dashboard]");
      if (reset && dashboard.state && window.confirm("Reset all local dashboard demo state?")) {
        dashboard.state.reset({ clearStorage: true });
        toast("Demo state reset.", "warning");
        renderAll();
      }
    });
  }

  function init() {
    if (!ui || !storage) return;
    renderNav();
    if (dashboard.state && dashboard.state.hydrate) dashboard.state.hydrate();
    var state = getState();
    if (state.theme) document.documentElement.setAttribute("data-theme", state.theme);
    bindNavigation();
    bindMobileMenu();
    bindLeadForm();
    bindProfileForm();
    bindLinkBuilder();
    bindGlobalActions();
    renderAll();
    var hash = window.location.hash ? window.location.hash.slice(1) : "overview";
    setActiveNav(document.getElementById(hash) ? hash : "overview");
    logEvent({ type: "dashboard.viewed", label: "Dashboard viewed", target: "Partner Command Center", message: "Opened the partner operations dashboard.", tone: "success" });
  }

  dashboard.controller = { renderAll: renderAll, renderOnboarding: renderOnboarding, getCommandPriority: getCommandPriority, renderCommandPriority: renderCommandPriority };
  ready(init);
})(window, document);
