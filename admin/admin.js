/*
  Moonshine Partner Command Center
  Batch 12 — Admin Prototype Logic

  Static admin rendering and local notes/export.
*/

(function initMoonshineAdmin(window, document) {
  "use strict";

  var admin = window.MoonshineAdmin || {};
  var config = admin.config || {};
  var data = admin.mockData || {};
  var os = window.MoonshineOS || {};
  var ui = os.ui;
  var forms = os.forms;
  var storage = os.storage;

  var notesKey = "adminOpsNotes";

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

  function money(value) {
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
    if (tone === "success" || label === "Low" || label === "active" || label === "Approved demo") cls += " mpc-badge-success";
    if (tone === "warning" || label === "Medium" || label === "pending" || label === "Needs review" || label === "Blueprint") cls += " mpc-badge-warning";
    if (tone === "danger" || label === "High" || label === "needs-review" || label === "Open") cls += " mpc-badge-danger";
    if (tone === "info" || label === "submitted" || label === "reviewing") cls += " mpc-badge-info";
    return '<span class="' + cls + '">' + esc(label) + '</span>';
  }

  function getNotes() {
    var notes = storage && storage.get ? storage.get(notesKey, []) : [];
    return Array.isArray(notes) ? notes : [];
  }

  function saveNotes(notes) {
    if (storage && storage.set) {
      storage.set(notesKey, Array.isArray(notes) ? notes : []);
    }
  }

  function renderNav() {
    var nav = document.querySelector("[data-admin-nav]");
    if (!nav || !Array.isArray(config.views)) return;

    nav.innerHTML = config.views.map(function view(item) {
      return '<a href="#' + esc(item.id) + '" title="' + esc(item.description) + '">' + esc(item.label) + '</a>';
    }).join("");
  }

  function renderMetrics() {
    var target = document.querySelector("[data-render-admin-metrics]");
    if (!target) return;

    target.innerHTML = (data.metrics || []).map(function metric(item) {
      return [
        '<article class="admin-metric">',
        '<span>' + esc(item.label) + '</span>',
        '<strong>' + esc(item.value) + '</strong>',
        '<small>' + esc(item.note) + '</small>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderPriority() {
    var target = document.querySelector("[data-render-priority]");
    if (!target) return;

    var partnerItems = (data.partnerQueue || []).filter(function filterPartner(item) {
      return item.priority === "High" || item.risk === "High";
    });

    var integrationItems = (data.integrationReadiness || []).filter(function filterIntegration(item) {
      return item.readiness < 50;
    });

    var items = partnerItems.map(function toPriority(item) {
      return {
        title: item.company,
        body: item.nextAction,
        meta: [item.type, item.status, item.risk]
      };
    }).concat(integrationItems.map(function toIntegration(item) {
      return {
        title: item.title,
        body: item.nextAction,
        meta: [item.status, item.readiness + "% ready"]
      };
    })).slice(0, 6);

    target.innerHTML = renderList(items);
  }

  function renderRecentActivity() {
    var target = document.querySelector("[data-render-recent-activity]");
    if (!target) return;

    var items = (data.activity || []).slice(0, 5).map(function mapEvent(item) {
      return {
        title: item.label,
        body: item.message,
        meta: [item.target, date(item.createdAt), item.tone]
      };
    });

    target.innerHTML = renderList(items);
  }

  function renderList(items) {
    if (!items.length) {
      return '<div class="mpc-empty"><div><strong>No records.</strong><p>Nothing needs attention in this static view.</p></div></div>';
    }

    return [
      '<ol class="admin-list">',
      items.map(function listItem(item) {
        return [
          '<li class="admin-list-item">',
          '<strong>' + esc(item.title) + '</strong>',
          '<p>' + esc(item.body) + '</p>',
          '<div class="admin-list-meta">',
          (item.meta || []).map(function metaItem(meta) { return badge(meta); }).join(""),
          '</div>',
          '</li>'
        ].join("");
      }).join(""),
      '</ol>'
    ].join("");
  }

  function renderPartners() {
    var target = document.querySelector("[data-render-partners]");
    var filter = document.querySelector("[data-filter-partners]");
    if (!target) return;

    var status = filter ? filter.value : "all";
    var rows = (data.partnerQueue || []).filter(function filterRow(item) {
      return status === "all" || item.status === status;
    });

    target.innerHTML = renderTable(
      ["Partner", "Type", "Status", "Priority", "Risk", "Next Action"],
      rows.map(function row(item) {
        return [
          '<strong>' + esc(item.company) + '</strong><br><small>' + esc(item.partnerId) + ' · ' + esc(item.contactName) + '</small>',
          titleCase(item.type),
          badge(item.status),
          badge(item.priority),
          badge(item.risk),
          esc(item.nextAction)
        ];
      })
    );
  }

  function renderLeads() {
    var target = document.querySelector("[data-render-leads]");
    var filter = document.querySelector("[data-filter-leads]");
    if (!target) return;

    var status = filter ? filter.value : "all";
    var rows = (data.leadQueue || []).filter(function filterRow(item) {
      return status === "all" || item.status === status;
    });

    target.innerHTML = renderTable(
      ["Business", "Partner", "Source", "Status", "Need", "Next Action"],
      rows.map(function row(item) {
        return [
          '<strong>' + esc(item.businessName) + '</strong><br><small>' + esc(item.leadId) + '</small>',
          esc(item.partnerId),
          esc(item.source),
          badge(item.status),
          money(item.fundingNeed),
          esc(item.nextAction)
        ];
      })
    );
  }

  function renderMarketplace() {
    var target = document.querySelector("[data-render-marketplace]");
    if (!target) return;

    target.innerHTML = renderTable(
      ["Offer", "Category", "Status", "Risk", "Review Notes", "Next Action"],
      (data.marketplaceReview || []).map(function row(item) {
        return [
          '<strong>' + esc(item.title) + '</strong><br><small>' + esc(item.owner) + '</small>',
          esc(item.category),
          badge(item.status),
          badge(item.risk),
          esc(item.reviewNotes),
          esc(item.nextAction)
        ];
      })
    );
  }

  function renderRules() {
    var target = document.querySelector("[data-render-rules]");
    if (!target) return;

    var items = (config.reviewRules || []).map(function mapRule(rule) {
      return {
        title: rule.title,
        body: rule.description,
        meta: [rule.id]
      };
    });

    target.innerHTML = renderList(items);
  }

  function renderCompliance() {
    var target = document.querySelector("[data-render-compliance]");
    if (!target) return;

    var items = (data.complianceQueue || []).map(function mapFlag(flag) {
      return {
        title: flag.phrase + " — " + flag.location,
        body: flag.recommendation,
        meta: [flag.severity, flag.status, flag.rule]
      };
    });

    target.innerHTML = renderList(items);
  }

  function renderIntegrations() {
    var target = document.querySelector("[data-render-integrations]");
    if (!target) return;

    target.innerHTML = [
      '<div class="admin-grid">',
      (data.integrationReadiness || []).map(function card(item) {
        return [
          '<article class="admin-card">',
          '<div class="admin-card-header">',
          '<div>',
          '<h3>' + esc(item.title) + '</h3>',
          '<p>' + esc(item.nextAction) + '</p>',
          '</div>',
          badge(item.status),
          '</div>',
          '<div class="admin-progress" aria-label="' + esc(item.title) + ' readiness">',
          '<span style="--progress:' + esc(item.readiness) + '%"></span>',
          '</div>',
          '<p class="mt-4"><strong>Readiness:</strong> ' + esc(item.readiness) + '%</p>',
          '<p><strong>Owner:</strong> ' + esc(item.owner) + '</p>',
          '<p><strong>Blockers:</strong> ' + esc((item.blockers || []).join(", ")) + '</p>',
          '</article>'
        ].join("");
      }).join(""),
      '</div>'
    ].join("");
  }

  function renderActivity() {
    var target = document.querySelector("[data-render-activity]");
    if (!target) return;

    var items = (data.activity || []).map(function mapEvent(item) {
      return {
        title: item.label,
        body: item.message,
        meta: [item.actor, item.target, date(item.createdAt), item.tone]
      };
    });

    target.innerHTML = renderList(items);
  }

  function renderSettings() {
    var target = document.querySelector("[data-render-settings]");
    if (!target) return;

    var settings = data.settings || {};

    target.innerHTML = [
      '<div class="admin-list">',
      '<div class="admin-list-item"><strong>Demo mode</strong><p>' + esc(settings.demoMode ? "Enabled" : "Disabled") + '</p></div>',
      '<div class="admin-list-item"><strong>Auth status</strong><p>' + esc(settings.authStatus) + '</p></div>',
      '<div class="admin-list-item"><strong>Data source</strong><p>' + esc(settings.dataSource) + '</p></div>',
      '<div class="admin-list-item"><strong>Production requirements</strong><p>' + esc((settings.productionRequirements || []).join(" · ")) + '</p></div>',
      '</div>'
    ].join("");
  }

  function renderNotes() {
    var target = document.querySelector("[data-render-admin-notes]");
    if (!target) return;

    var notes = getNotes();

    if (!notes.length) {
      target.innerHTML = '<div class="mpc-empty"><div><strong>No admin notes.</strong><p>Add one to store it locally in this browser.</p></div></div>';
      return;
    }

    target.innerHTML = notes.map(function noteCard(note) {
      return [
        '<article class="admin-note">',
        '<p>' + esc(note.body) + '</p>',
        '<time datetime="' + esc(note.createdAt) + '">' + esc(date(note.createdAt)) + '</time>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderTable(headings, rows) {
    if (!rows.length) {
      return '<div class="mpc-empty"><div><strong>No matching records.</strong><p>Try another filter.</p></div></div>';
    }

    return [
      '<div class="admin-table-card">',
      '<div class="admin-table-wrap">',
      '<table>',
      '<thead><tr>',
      headings.map(function heading(item) { return '<th>' + esc(item) + '</th>'; }).join(""),
      '</tr></thead>',
      '<tbody>',
      rows.map(function renderRow(row) {
        return '<tr>' + row.map(function renderCell(cell) {
          return '<td>' + cell + '</td>';
        }).join("") + '</tr>';
      }).join(""),
      '</tbody>',
      '</table>',
      '</div>',
      '</div>'
    ].join("");
  }

  function renderAll() {
    var disclaimer = document.querySelector("[data-admin-disclaimer]");
    if (disclaimer && config.disclaimers) {
      disclaimer.textContent = config.disclaimers.admin;
    }

    renderMetrics();
    renderPriority();
    renderRecentActivity();
    renderPartners();
    renderLeads();
    renderMarketplace();
    renderRules();
    renderCompliance();
    renderIntegrations();
    renderActivity();
    renderSettings();
    renderNotes();
  }

  function setActiveNav(id) {
    Array.prototype.slice.call(document.querySelectorAll(".admin-nav a[href^='#']")).forEach(function eachLink(link) {
      var active = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function bindNavigation() {
    document.addEventListener("click", function onClick(event) {
      var link = event.target.closest(".admin-nav a[href^='#']");
      if (!link) return;

      var id = link.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveNav(id);
      window.history.replaceState({}, "", "#" + id);
    });

    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-admin-view]"));

    if ("IntersectionObserver" in window && sections.length) {
      var observer = new IntersectionObserver(function onObserve(entries) {
        entries.forEach(function entryLoop(entry) {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        });
      }, {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0.01
      });

      sections.forEach(function observe(section) {
        observer.observe(section);
      });
    }
  }

  function bindFilters() {
    document.addEventListener("change", function onChange(event) {
      if (event.target.matches("[data-filter-partners]")) {
        renderPartners();
      }

      if (event.target.matches("[data-filter-leads]")) {
        renderLeads();
      }
    });
  }

  function bindExport() {
    document.addEventListener("click", function onClick(event) {
      var button = event.target.closest("[data-export-admin]");
      if (!button) return;

      var payload = {
        app: "Moonshine Partner Command Center",
        type: "admin-static-prototype-export",
        exportedAt: new Date().toISOString(),
        config: config,
        mockData: data,
        localNotes: getNotes(),
        disclaimer:
          "Static admin prototype export only. This is not a production admin, CRM, lender, underwriting, or payout record."
      };

      var blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
      });
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "moonshine-admin-ops-static-export.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      if (ui && ui.toast) {
        ui.toast("Admin prototype JSON exported.", { tone: "success" });
      }

      if (os.analytics) {
        os.analytics.track("admin_exported", { records: Object.keys(data).length });
      }
    });
  }

  function bindNotes() {
    var form = document.querySelector("[data-admin-note-form]");
    if (!form || !forms) return;

    forms.bindSubmit(form, function onSubmit(noteData) {
      if (!noteData.note) {
        if (ui && ui.toast) ui.toast("Add a note before saving.", { tone: "warning" });
        return;
      }

      var notes = getNotes();
      notes.unshift({
        id: "admin_note_" + Date.now().toString(36),
        body: noteData.note,
        createdAt: new Date().toISOString()
      });

      saveNotes(notes);
      form.reset();
      renderNotes();

      if (ui && ui.toast) {
        ui.toast("Admin note saved locally.", { tone: "success" });
      }
    }, {
      validate: false
    });
  }

  function init() {
    renderNav();
    renderAll();
    bindNavigation();
    bindFilters();
    bindExport();
    bindNotes();

    var start = window.location.hash ? window.location.hash.slice(1) : config.defaultView || "overview";
    setActiveNav(document.getElementById(start) ? start : "overview");

    if (os.analytics) {
      os.analytics.track("admin_prototype_viewed", {
        mode: "static"
      });
    }
  }

  ready(init);
})(window, document);
