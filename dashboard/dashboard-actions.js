/*
  Moonshine Partner Command Center
  Batch 08 — Dashboard Actions

  Binds dashboard UI actions used by Batch 09 shell.
*/

(function initDashboardActions(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var dashboard = window.MoonshineOS.dashboard;
  var ui = window.MoonshineOS.ui;
  var forms = window.MoonshineOS.forms;
  var storage = window.MoonshineOS.storage;
  var config = dashboard.config || {};

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function render() {
    var root = document.querySelector(config.rootSelector || "[data-dashboard-root]") || document;
    var state = dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
    if (dashboard.renderers && dashboard.renderers.renderAll) {
      dashboard.renderers.renderAll(root, state);
    }
  }

  function logEvent(event) {
    if (dashboard.eventStore && dashboard.eventStore.addEvent) {
      return dashboard.eventStore.addEvent(event);
    }
    return null;
  }

  function bindNavigation(root) {
    if (!ui) return;

    ui.qsa("[data-dashboard-nav] a[href^='#']", root).forEach(function bindNav(link) {
      if (link.dataset.boundDashboardNav === "true") return;
      link.dataset.boundDashboardNav = "true";

      link.addEventListener("click", function handleNavClick(event) {
        var targetId = link.getAttribute("href").slice(1);
        var section = document.getElementById(targetId);

        if (!section) return;

        event.preventDefault();

        section.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        if (dashboard.state) {
          dashboard.state.setState({
            activeSection: targetId
          }, {
            type: "nav.section"
          });
        }
      });
    });
  }

  function bindLeadForm(root) {
    if (!forms || !dashboard.leadStore) return;

    var form = root.querySelector(config.selectors && config.selectors.leadForm || "[data-lead-form]");
    if (!form || form.dataset.boundLeadForm === "true") return;

    form.dataset.boundLeadForm = "true";

    forms.bindSubmit(form, function submitLead(data) {
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
        nextStep: "Review demo lead details and request documentation if appropriate.",
        tags: [data.industry, data.urgency].filter(Boolean)
      });

      if (ui && ui.toast) ui.toast("Demo lead saved: " + lead.businessName, { tone: "success" });
      form.reset();
      render();
    });
  }

  function bindClickActions(root) {
    if (!ui) return;

    root.addEventListener("click", function handleDashboardClick(event) {
      var copyButton = event.target.closest("[data-copy-text]");
      if (copyButton) {
        var text = copyButton.getAttribute("data-copy-text");
        ui.copyText(text).then(function copied() {
          ui.toast(copied ? "Copied." : "Copy may not be available.", {
            tone: copied ? "success" : "warning"
          });
          logEvent({
            type: "link.copied",
            label: "Link copied",
            target: text,
            message: "Copied local dashboard link.",
            tone: "success"
          });
        });
        return;
      }

      var offerCopyButton = event.target.closest("[data-copy-offer-link]");
      if (offerCopyButton && dashboard.affiliateStore) {
        var offerHref = offerCopyButton.getAttribute("data-copy-offer-link");
        var partnerLink = dashboard.affiliateStore.buildLink(offerHref, { source: "dashboard_marketplace" });
        ui.copyText(partnerLink).then(function copied) {
          ui.toast(copied ? "Partner offer link copied." : "Copy may not be available.", {
            tone: copied ? "success" : "warning"
          });
        });
        return;
      }

      var offerFavoriteButton = event.target.closest("[data-toggle-offer-favorite]");
      if (offerFavoriteButton && dashboard.resourceStore) {
        var offerId = offerFavoriteButton.getAttribute("data-toggle-offer-favorite");
        var result = dashboard.resourceStore.toggleMarketplaceFavorite(offerId);
        ui.toast(result.active ? "Marketplace offer saved." : "Marketplace offer removed.", {
          tone: "success"
        });
        render();
        return;
      }

      var resourceFavoriteButton = event.target.closest("[data-toggle-resource-favorite]");
      if (resourceFavoriteButton && dashboard.resourceStore) {
        var resourceId = resourceFavoriteButton.getAttribute("data-toggle-resource-favorite");
        var resourceResult = dashboard.resourceStore.toggleResourceFavorite(resourceId);
        ui.toast(resourceResult.active ? "Resource saved." : "Resource removed.", {
          tone: "success"
        });
        render();
        return;
      }

      var trainingButton = event.target.closest("[data-toggle-training]");
      if (trainingButton && dashboard.resourceStore) {
        var moduleId = trainingButton.getAttribute("data-toggle-training");
        var trainingResult = dashboard.resourceStore.toggleTrainingModule(moduleId);
        ui.toast(trainingResult.completed ? "Training marked complete." : "Training marked incomplete.", {
          tone: "success"
        });
        logEvent({
          type: "training.toggled",
          label: "Training updated",
          target: moduleId,
          message: "Updated local training progress.",
          tone: "success"
        });
        render();
        return;
      }

      var removeLeadButton = event.target.closest("[data-remove-lead]");
      if (removeLeadButton && dashboard.leadStore) {
        var leadId = removeLeadButton.getAttribute("data-remove-lead");
        dashboard.leadStore.removeLead(leadId);
        ui.toast("Demo lead removed.", { tone: "warning" });
        render();
        return;
      }

      var removeNoteButton = event.target.closest("[data-remove-note]");
      if (removeNoteButton && dashboard.noteStore) {
        var noteId = removeNoteButton.getAttribute("data-remove-note");
        dashboard.noteStore.removeNote(noteId);
        ui.toast("Note removed.", { tone: "warning" });
        render();
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
        ui.toast("Dashboard demo data exported.", { tone: "success" });
        return;
      }

      var resetButton = event.target.closest("[data-reset-dashboard]");
      if (resetButton && dashboard.state) {
        var confirmed = window.confirm("Reset local dashboard demo state? This clears local demo profile, leads, notes, favorites, events, and settings.");
        if (!confirmed) return;
        dashboard.state.reset({ clearStorage: true });
        ui.toast("Dashboard demo state reset.", { tone: "warning" });
        render();
      }
    });
  }

  function bindChangeActions(root) {
    root.addEventListener("change", function handleDashboardChange(event) {
      var statusSelect = event.target.closest("[data-lead-status]");
      if (statusSelect && dashboard.leadStore) {
        var leadId = statusSelect.getAttribute("data-lead-status");
        dashboard.leadStore.updateStatus(leadId, statusSelect.value);
        if (ui && ui.toast) ui.toast("Lead status updated.", { tone: "success" });
        render();
        return;
      }

      var themeSelect = event.target.closest("[data-theme-select]");
      if (themeSelect && dashboard.state) {
        document.documentElement.setAttribute("data-theme", themeSelect.value);
        dashboard.state.setState({
          theme: themeSelect.value
        }, {
          type: "settings.theme"
        });
        if (ui && ui.toast) ui.toast("Theme updated.", { tone: "success" });
      }
    });
  }

  function bindNoteForm(root) {
    if (!forms || !dashboard.noteStore) return;

    var form = root.querySelector("[data-note-form]");
    if (!form || form.dataset.boundNoteForm === "true") return;

    form.dataset.boundNoteForm = "true";

    forms.bindSubmit(form, function submitNote(data) {
      dashboard.noteStore.addNote({
        title: data.title || "Partner note",
        body: data.body || "",
        relatedTo: data.relatedTo || ""
      });

      if (ui && ui.toast) ui.toast("Note saved.", { tone: "success" });
      form.reset();
      render();
    }, {
      validate: false
    });
  }

  function bindImport(root) {
    var input = root.querySelector("[data-import-dashboard]");
    if (!input || input.dataset.boundImport === "true") return;

    input.dataset.boundImport = "true";

    input.addEventListener("change", function handleImport() {
      var file = input.files && input.files[0];
      if (!file || !dashboard.state) return;

      var reader = new FileReader();

      reader.onload = function onLoad() {
        var result = dashboard.state.importState(reader.result);
        if (ui && ui.toast) {
          ui.toast(result.ok ? "Dashboard import complete." : result.error, {
            tone: result.ok ? "success" : "danger"
          });
        }
        render();
      };

      reader.readAsText(file);
    });
  }

  function init(root) {
    var scope = root || document.querySelector(config.rootSelector || "[data-dashboard-root]") || document;

    if (dashboard.state && dashboard.state.hydrate) {
      dashboard.state.hydrate();
    }

    render();

    if (dashboard.state && dashboard.state.subscribe) {
      dashboard.state.subscribe(function onStateChange() {
        /* Reserved for future incremental rendering. Full render happens after actions. */
      });
    }

    bindNavigation(scope);
    bindLeadForm(scope);
    bindClickActions(scope);
    bindChangeActions(scope);
    bindNoteForm(scope);
    bindImport(scope);

    if (window.MoonshineOS.affiliateTracking) {
      window.MoonshineOS.affiliateTracking.hydratePartnerFields(scope);
      window.MoonshineOS.affiliateTracking.bindCopyButtons(scope);
    }

    logEvent({
      type: "dashboard.initialized",
      label: "Dashboard initialized",
      target: "Partner Command Center",
      message: "Initialized static dashboard support modules.",
      tone: "success"
    });

    return scope;
  }

  ready(function autoInitIfRequested() {
    var root = document.querySelector("[data-dashboard-auto-init='true']");
    if (root) {
      init(root);
    }
  });

  dashboard.actions = {
    render: render,
    logEvent: logEvent,
    bindNavigation: bindNavigation,
    bindLeadForm: bindLeadForm,
    bindClickActions: bindClickActions,
    bindChangeActions: bindChangeActions,
    bindNoteForm: bindNoteForm,
    bindImport: bindImport,
    init: init
  };
})(window, document);
