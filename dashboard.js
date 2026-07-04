/*
  Moonshine Partner Command Center
  Batch 09 — Dashboard Main Controller

  Static dashboard shell behavior.
  Uses localStorage and mock data only.
*/

(function initPartnerDashboard(window, document) {
  "use strict";

  var os = window.MoonshineOS || {};
  var dashboard = os.dashboard || {};
  var ui = os.ui;
  var forms = os.forms;
  var storage = os.storage;

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function esc(value) {
    return ui && ui.escapeHTML ? ui.escapeHTML(value) : String(value == null ? "" : value);
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function upper(match) {
        return match.toUpperCase();
      });
  }

  function money(value) {
    return ui && ui.formatCurrency ? ui.formatCurrency(value) : "$" + Number(value || 0).toLocaleString();
  }

  function getState() {
    return dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
  }

  function setState(patch, meta) {
    if (dashboard.state && dashboard.state.setState) {
      return dashboard.state.setState(patch, meta);
    }
    return {};
  }

  function getProfile() {
    return dashboard.partnerStore && dashboard.partnerStore.getProfile
      ? dashboard.partnerStore.getProfile()
      : (getState().partnerProfile || {});
  }

  function logEvent(event) {
    if (dashboard.eventStore && dashboard.eventStore.addEvent) {
      dashboard.eventStore.addEvent(event);
    }
  }

  function toast(message, tone) {
    if (ui && ui.toast) {
      ui.toast(message, { tone: tone || "success" });
    }
  }

  function sectionLink(id) {
    return document.querySelector('.dashboard-nav a[href="#' + id + '"]');
  }

  function setActiveNav(id) {
    Array.prototype.slice.call(document.querySelectorAll(".dashboard-nav a[href^='#']")).forEach(function eachLink(link) {
      var isActive = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderNav() {
    var nav = document.querySelector("[data-dashboard-nav]");
    var items = window.MoonshineData && window.MoonshineData.dashboardNav;

    if (!nav || !Array.isArray(items) || !items.length) return;

    nav.innerHTML = items.map(function navItem(item) {
      return '<a href="' + esc(item.href) + '" title="' + esc(item.description) + '">' + esc(item.label) + '</a>';
    }).join("");
  }

  function renderOnboarding() {
    var profile = getProfile();
    var progress = dashboard.resourceStore ? dashboard.resourceStore.getTrainingProgress() : {};
    var steps = [
      {
        id: "profile-created",
        title: "Create partner profile",
        body: profile && profile.partnerId ? "Partner profile exists locally." : "Create your profile through partner access.",
        complete: Boolean(profile && profile.partnerId)
      },
      {
        id: "compliance-review",
        title: "Review compliance",
        body: "No guaranteed funding, approval, rates, income, or commissions.",
        complete: Boolean(progress["compliance-basics"])
      },
      {
        id: "submit-demo-lead",
        title: "Submit first demo lead",
        body: "Practice the workflow without sensitive data.",
        complete: (dashboard.leadStore ? dashboard.leadStore.getLeads() : []).length > 0
      },
      {
        id: "save-resource",
        title: "Save one resource",
        body: "Bookmark scripts, checklists, or blueprints.",
        complete: (dashboard.resourceStore ? dashboard.resourceStore.getResourceFavorites() : []).length > 0
      },
      {
        id: "copy-partner-link",
        title: "Copy partner link",
        body: "Use the partner link builder for attribution-ready links.",
        complete: Boolean(storage && storage.get && storage.get("copiedPartnerLink", false))
      },
      {
        id: "export-demo-data",
        title: "Export local data",
        body: "Download a JSON copy of local demo state.",
        complete: Boolean(storage && storage.get && storage.get("dashboardExported", false))
      }
    ];

    var completed = steps.filter(function done(step) { return step.complete; }).length;
    var percent = steps.length ? Math.round((completed / steps.length) * 100) : 0;
    var progressBar = document.querySelector("[data-onboarding-progress]");
    var target = document.querySelector("[data-render-onboarding]");

    if (progressBar) progressBar.style.setProperty("--progress", percent + "%");

    if (target) {
      target.innerHTML = steps.map(function stepCard(step) {
        return [
          '<label class="dashboard-check-item">',
          '<input type="checkbox" disabled ' + (step.complete ? "checked" : "") + '>',
          '<span>',
          '<strong>' + esc(step.title) + '</strong>',
          '<span>' + esc(step.body) + '</span>',
          '</span>',
          '</label>'
        ].join("");
      }).join("");
    }
  }

  function renderNextActions() {
    var target = document.querySelector("[data-render-next-actions]");
    if (!target) return;

    var leadSummary = dashboard.leadStore ? dashboard.leadStore.summarizeLeads() : { total: 0 };
    var training = dashboard.resourceStore ? dashboard.resourceStore.summarizeTraining() : { percent: 0 };
    var actions = [];

    if (!getProfile().partnerId) {
      actions.push(["01", "Create your partner profile", "./partner-access.html"]);
    }

    if (leadSummary.total < 1) {
      actions.push(["02", "Submit one clean demo lead", "#submit-lead"]);
    }

    if (training.percent < 50) {
      actions.push(["03", "Complete compliance and orientation training", "#training"]);
    }

    actions.push(["04", "Build and copy a partner link", "#partner-links"]);
    actions.push(["05", "Review integration blueprints", "#integrations"]);

    target.innerHTML = [
      '<ol class="dashboard-next-list">',
      actions.slice(0, 5).map(function action(item) {
        return '<li><span>' + esc(item[0]) + '</span><div><strong>' + esc(item[1]) + '</strong><br><a href="' + esc(item[2]) + '">Open step</a></div></li>';
      }).join(""),
      '</ol>'
    ].join("");
  }

  function renderPartnerId() {
    var target = document.querySelector("[data-render-partner-id]");
    if (!target) return;

    var profile = getProfile();
    var link = dashboard.affiliateStore
      ? dashboard.affiliateStore.buildLink("./index.html", { source: "dashboard_partner_id" })
      : "./index.html?partner_id=" + encodeURIComponent(profile.partnerId || "MS-DEMO-0000");

    target.innerHTML = [
      '<div class="dashboard-id-block">',
      '<span class="mpc-badge mpc-badge-success">Local identity</span>',
      '<h3 class="dashboard-card-title">Partner ID</h3>',
      '<div class="dashboard-id-value">' + esc(profile.partnerId || "MS-DEMO-0000") + '</div>',
      '<div class="dashboard-mini-grid">',
      '<div class="dashboard-mini-item"><strong>Name</strong><span>' + esc(profile.contactName || "Demo Partner") + '</span></div>',
      '<div class="dashboard-mini-item"><strong>Company</strong><span>' + esc(profile.company || "Moonshine Partner") + '</span></div>',
      '<div class="dashboard-mini-item"><strong>Type</strong><span>' + esc(titleCase(profile.partnerType || "partner")) + '</span></div>',
      '<div class="dashboard-mini-item"><strong>Status</strong><span>' + esc(profile.status || "active-demo") + '</span></div>',
      '</div>',
      '<div class="dashboard-copy-row">',
      '<input type="text" value="' + esc(link) + '" readonly aria-label="Partner ID link">',
      '<button class="mpc-button mpc-button-outline" type="button" data-copy-text="' + esc(link) + '">Copy Link</button>',
      '</div>',
      '<p class="mpc-muted">This ID is generated for the static demo. Production partner IDs require authentication and backend validation.</p>',
      '</div>'
    ].join("");
  }

  function renderSettings() {
    var themeSelect = document.querySelector("[data-theme-select]");
    var state = getState();

    if (themeSelect) {
      themeSelect.value = state.theme || document.documentElement.getAttribute("data-theme") || "dark";
    }
  }

  function renderLeadList() {
    var state = getState();
    var status = document.querySelector("[data-lead-filter]");
    var leads = dashboard.leadStore
      ? dashboard.leadStore.filterLeads({ status: status ? status.value : "all" })
      : (state.leads || []);

    var target = document.querySelector("[data-render-leads]");
    if (target && dashboard.renderers) {
      target.innerHTML = dashboard.renderers.renderLeadCards(leads);
    }
  }

  function renderAll() {
    var root = document.querySelector("[data-dashboard-root]") || document;
    var state = getState();

    if (dashboard.renderers && dashboard.renderers.renderAll) {
      dashboard.renderers.renderAll(root, state);
    }

    renderLeadList();
    renderOnboarding();
    renderNextActions();
    renderPartnerId();
    renderSettings();

    var notice = document.querySelector("[data-compliance-notice]");
    var compliance = window.MoonshineData && window.MoonshineData.complianceCopy;
    if (notice && compliance && compliance.notices) {
      notice.textContent = compliance.notices.fundingNoGuarantee + " " + compliance.notices.partnerResponsibility;
    }

    if (os.affiliateTracking) {
      os.affiliateTracking.hydratePartnerFields(root);
      os.affiliateTracking.bindCopyButtons(root);
    }
  }

  function bindNavigation() {
    document.addEventListener("click", function onNavClick(event) {
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
    });

    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-dashboard-section]"));
    if ("IntersectionObserver" in window && sections.length) {
      var observer = new IntersectionObserver(function observe(entries) {
        entries.forEach(function entryLoop(entry) {
          if (entry.isIntersecting) setActiveNav(entry.target.id);
        });
      }, {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0.01
      });

      sections.forEach(function observeSection(section) {
        observer.observe(section);
      });
    }
  }

  function bindLeadForm() {
    var form = document.querySelector("[data-lead-form]");
    if (!form || !forms || !dashboard.leadStore) return;

    forms.bindSubmit(form, function onLeadSubmit(data) {
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
        nextStep: "Review demo lead details and request readiness documents if appropriate.",
        tags: [data.industry, data.urgency].filter(Boolean)
      });

      toast("Demo lead saved: " + lead.businessName, "success");
      form.reset();
      renderAll();
      document.getElementById("lead-tracker").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    var fill = document.querySelector("[data-fill-demo-lead]");
    if (fill) {
      fill.addEventListener("click", function fillDemoLead() {
        forms.hydrateForm(form, {
          businessName: "Demo Main Street Services",
          contactName: "Casey Morgan",
          email: "owner@example.com",
          phone: "(555) 010-2424",
          industry: "Local services",
          timeInBusiness: "3 years",
          monthlyRevenue: "$62,000",
          fundingNeed: "$48,000",
          urgency: "30 days",
          source: "Dashboard demo",
          useOfFunds: "Inventory, payroll bridge, and marketing runway.",
          notes: "Demo only. Do not enter sensitive borrower data."
        });
        toast("Demo lead filled.", "success");
      });
    }
  }

  function bindProfileForm() {
    var form = document.querySelector("[data-profile-form]");
    if (!form || !forms || !dashboard.partnerStore) return;

    forms.hydrateForm(form, getProfile());

    forms.bindSubmit(form, function onProfileSubmit(data) {
      dashboard.partnerStore.updateProfile(data);
      toast("Partner profile updated.", "success");
      logEvent({
        type: "partner.profile_updated",
        label: "Profile updated",
        target: data.company,
        message: "Updated local dashboard partner profile.",
        tone: "success"
      });
      renderAll();
      forms.hydrateForm(form, getProfile());
    }, {
      validate: false
    });
  }

  function bindNoteForm() {
    var form = document.querySelector("[data-note-form]");
    if (!form || !forms || !dashboard.noteStore) return;

    forms.bindSubmit(form, function onNoteSubmit(data) {
      dashboard.noteStore.addNote({
        title: data.title || "Partner note",
        relatedTo: data.relatedTo || "",
        body: data.body || ""
      });
      toast("Note saved.", "success");
      form.reset();
      renderAll();
    }, {
      validate: false
    });
  }

  function bindLinkBuilder() {
    var form = document.querySelector("[data-link-builder-form]");
    var output = document.querySelector("[data-built-link]");
    var copy = document.querySelector("[data-copy-built-link]");

    if (!form || !forms || !output) return;

    function buildLink() {
      var data = forms.serializeForm(form);
      var params = {
        source: data.source || "dashboard",
        utm_source: data.source || "dashboard",
        utm_campaign: data.campaign || ""
      };

      var link = dashboard.affiliateStore
        ? dashboard.affiliateStore.buildLink(data.destination || "./index.html", params)
        : data.destination || "./index.html";

      output.value = link;
      return link;
    }

    form.addEventListener("submit", function onSubmit(event) {
      event.preventDefault();
      buildLink();
      toast("Partner link built.", "success");
    });

    form.addEventListener("input", buildLink);
    form.addEventListener("change", buildLink);

    if (copy && ui) {
      copy.addEventListener("click", function copyBuiltLink() {
        var link = output.value || buildLink();
        ui.copyText(link).then(function copied() {
          if (copied && storage) storage.set("copiedPartnerLink", true);
          toast(copied ? "Partner link copied." : "Copy may not be available.", copied ? "success" : "warning");
          renderOnboarding();
        });
      });
    }

    buildLink();
  }

  function bindGlobalActions() {
    document.addEventListener("change", function onChange(event) {
      var status = event.target.closest("[data-lead-status]");
      if (status && dashboard.leadStore) {
        dashboard.leadStore.updateStatus(status.getAttribute("data-lead-status"), status.value);
        toast("Lead status updated.", "success");
        renderAll();
        return;
      }

      var leadFilter = event.target.closest("[data-lead-filter]");
      if (leadFilter) {
        renderLeadList();
        return;
      }

      var theme = event.target.closest("[data-theme-select]");
      if (theme) {
        document.documentElement.setAttribute("data-theme", theme.value);
        setState({ theme: theme.value }, { type: "settings.theme" });
        toast("Theme updated.", "success");
        return;
      }

      var importInput = event.target.closest("[data-import-dashboard]");
      if (importInput && importInput.files && importInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function onLoad() {
          var result = dashboard.state.importState(reader.result);
          toast(result.ok ? "Dashboard JSON imported." : result.error, result.ok ? "success" : "danger");
          renderAll();
        };
        reader.readAsText(importInput.files[0]);
      }
    });

    document.addEventListener("click", function onClick(event) {
      var copyText = event.target.closest("[data-copy-text]");
      if (copyText && ui) {
        ui.copyText(copyText.getAttribute("data-copy-text")).then(function copied() {
          if (copied && storage) storage.set("copiedPartnerLink", true);
          toast(copied ? "Copied." : "Copy may not be available.", copied ? "success" : "warning");
          renderOnboarding();
        });
        return;
      }

      var offerFavorite = event.target.closest("[data-toggle-offer-favorite]");
      if (offerFavorite && dashboard.resourceStore) {
        var offerResult = dashboard.resourceStore.toggleMarketplaceFavorite(offerFavorite.getAttribute("data-toggle-offer-favorite"));
        toast(offerResult.active ? "Offer saved." : "Offer removed.", "success");
        renderAll();
        return;
      }

      var resourceFavorite = event.target.closest("[data-toggle-resource-favorite]");
      if (resourceFavorite && dashboard.resourceStore) {
        var resourceResult = dashboard.resourceStore.toggleResourceFavorite(resourceFavorite.getAttribute("data-toggle-resource-favorite"));
        toast(resourceResult.active ? "Resource saved." : "Resource removed.", "success");
        renderAll();
        return;
      }

      var training = event.target.closest("[data-toggle-training]");
      if (training && dashboard.resourceStore) {
        var trainingResult = dashboard.resourceStore.toggleTrainingModule(training.getAttribute("data-toggle-training"));
        toast(trainingResult.completed ? "Training marked complete." : "Training marked incomplete.", "success");
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

      var removeNote = event.target.closest("[data-remove-note]");
      if (removeNote && dashboard.noteStore) {
        dashboard.noteStore.removeNote(removeNote.getAttribute("data-remove-note"));
        toast("Note removed.", "warning");
        renderAll();
        return;
      }

      var copyOffer = event.target.closest("[data-copy-offer-link]");
      if (copyOffer && ui) {
        var link = dashboard.affiliateStore
          ? dashboard.affiliateStore.buildLink(copyOffer.getAttribute("data-copy-offer-link"), { source: "dashboard_marketplace" })
          : copyOffer.getAttribute("data-copy-offer-link");

        ui.copyText(link).then(function copied() {
          if (copied && storage) storage.set("copiedPartnerLink", true);
          toast(copied ? "Partner offer link copied." : "Copy may not be available.", copied ? "success" : "warning");
          renderOnboarding();
        });
        return;
      }

      var exportButton = event.target.closest("[data-export-dashboard]");
      if (exportButton && dashboard.state) {
        var exported = dashboard.state.exportState();
        var blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "moonshine-partner-command-center-dashboard-export.json";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        if (storage) storage.set("dashboardExported", true);
        toast("Dashboard JSON exported.", "success");
        renderOnboarding();
        return;
      }

      var resetButton = event.target.closest("[data-reset-dashboard]");
      if (resetButton && dashboard.state) {
        var ok = window.confirm("Reset all local dashboard demo state? This clears local profile, leads, notes, favorites, training progress, and events.");
        if (!ok) return;
        dashboard.state.reset({ clearStorage: true });
        toast("Local demo state reset.", "warning");
        renderAll();
      }
    });
  }

  function init() {
    if (!ui || !storage) {
      console.warn("Moonshine dashboard requires shared scripts from Batch 03.");
      return;
    }

    renderNav();

    if (dashboard.state && dashboard.state.hydrate) {
      dashboard.state.hydrate();
    }

    var state = getState();
    if (state.theme) {
      document.documentElement.setAttribute("data-theme", state.theme);
    }

    bindNavigation();
    bindLeadForm();
    bindProfileForm();
    bindNoteForm();
    bindLinkBuilder();
    bindGlobalActions();

    renderAll();

    var hashId = window.location.hash ? window.location.hash.slice(1) : "overview";
    if (document.getElementById(hashId)) {
      setActiveNav(hashId);
    } else {
      setActiveNav("overview");
    }

    logEvent({
      type: "dashboard.viewed",
      label: "Dashboard viewed",
      target: "Partner Command Center",
      message: "Viewed static partner dashboard.",
      tone: "success"
    });

    if (os.analytics) {
      os.analytics.track("dashboard_viewed", {
        partnerType: getProfile().partnerType,
        partnerId: getProfile().partnerId
      });
    }
  }

  ready(init);
})(window, document);
