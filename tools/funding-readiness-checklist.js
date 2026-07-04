/*
  Batch 10 — Funding Readiness Checklist

  Static educational checklist. LocalStorage only.
*/

(function initFundingReadinessChecklist(window, document) {
  "use strict";

  var storageKey = "fundingReadinessChecklist";

  var categories = [
    {
      id: "business-basics",
      title: "Business basics",
      description: "Basic operating signals partners can ask about before a funding conversation.",
      items: [
        ["entity-active", "Active business entity", "Business is formed and operating under a consistent legal/business name."],
        ["business-bank", "Business bank account", "Business uses a business bank account instead of only personal accounts."],
        ["time-in-business", "Time in business known", "Owner can clearly state operating history and launch date."],
        ["industry-use-case", "Industry and use case clear", "Business can explain what the funding would support."]
      ]
    },
    {
      id: "revenue-cash-flow",
      title: "Revenue and cash-flow clarity",
      description: "Revenue signals are not approval decisions, but they help shape the conversation.",
      items: [
        ["monthly-revenue", "Monthly revenue estimate", "Business can estimate current monthly revenue."],
        ["deposit-pattern", "Deposit pattern understood", "Owner can explain seasonality, spikes, slow periods, or timing gaps."],
        ["existing-obligations", "Existing obligations listed", "Owner knows major current payments, advances, or debt obligations."],
        ["cash-flow-gap", "Cash-flow gap defined", "The timing problem or growth need is clear."]
      ]
    },
    {
      id: "documents",
      title: "Document readiness",
      description: "Documents vary by provider and funding path. This is a basic organization checklist.",
      items: [
        ["bank-statements", "Recent bank statements organized", "Recent statements are available if requested."],
        ["tax-docs", "Tax or financial records located", "Relevant tax returns, P&L, or financial summaries can be found if needed."],
        ["owner-id", "Owner identity documents available", "Decision maker knows what identity or ownership documents may be requested."],
        ["use-of-funds-docs", "Use-of-funds support", "Quotes, invoices, purchase orders, or plans are available when relevant."]
      ]
    },
    {
      id: "partner-safe",
      title: "Partner-safe handoff",
      description: "Keep referrals clean, permission-based, and properly framed.",
      items: [
        ["permission", "Permission received", "Business owner gave permission to share contact or business details."],
        ["no-guarantee", "No guarantees made", "Partner did not promise approval, funding, rates, terms, or timelines."],
        ["sensitive-data", "Sensitive data avoided", "No bank logins, SSNs, full tax IDs, or private documents entered into static tools."],
        ["next-step", "Next step defined", "Partner can explain the next review or readiness action."]
      ]
    }
  ];

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function getStorage() {
    return window.MoonshineOS && window.MoonshineOS.storage;
  }

  function getUI() {
    return window.MoonshineOS && window.MoonshineOS.ui;
  }

  function getProgress() {
    var storage = getStorage();
    return storage ? storage.get(storageKey, {}) : {};
  }

  function saveProgress(progress) {
    var storage = getStorage();
    if (storage) storage.set(storageKey, progress);
  }

  function allItems() {
    return categories.reduce(function collect(list, category) {
      return list.concat(category.items.map(function mapItem(item) {
        return {
          id: item[0],
          title: item[1],
          body: item[2],
          category: category.title
        };
      }));
    }, []);
  }

  function score(progress) {
    var items = allItems();
    var complete = items.filter(function done(item) {
      return progress[item.id];
    }).length;
    return {
      total: items.length,
      complete: complete,
      percent: items.length ? Math.round((complete / items.length) * 100) : 0
    };
  }

  function labelFor(percentValue) {
    if (percentValue >= 85) return "Strong organization";
    if (percentValue >= 60) return "Good starting point";
    if (percentValue >= 35) return "Needs preparation";
    return "Start checklist";
  }

  function render() {
    var ui = getUI();
    var progress = getProgress();
    var target = document.getElementById("readiness-list");

    if (!ui || !target) return;

    target.innerHTML = categories.map(function categoryCard(category) {
      var categoryComplete = category.items.filter(function done(item) {
        return progress[item[0]];
      }).length;

      return [
        '<section class="readiness-category">',
        '<div class="readiness-category-header">',
        '<div>',
        '<span class="mpc-eyebrow">' + ui.escapeHTML(category.id.replace(/-/g, " ")) + '</span>',
        '<h2>' + ui.escapeHTML(category.title) + '</h2>',
        '<p>' + ui.escapeHTML(category.description) + '</p>',
        '</div>',
        '<span class="mpc-badge mpc-badge-success">' + categoryComplete + '/' + category.items.length + ' ready</span>',
        '</div>',
        '<div class="readiness-items">',
        category.items.map(function itemRow(item) {
          var id = item[0];
          return [
            '<label class="readiness-item">',
            '<input type="checkbox" data-readiness-item="' + ui.escapeHTML(id) + '" ' + (progress[id] ? "checked" : "") + '>',
            '<span>',
            '<strong>' + ui.escapeHTML(item[1]) + '</strong>',
            '<span>' + ui.escapeHTML(item[2]) + '</span>',
            '</span>',
            '</label>'
          ].join("");
        }).join(""),
        '</div>',
        '</section>'
      ].join("");
    }).join("");

    updateScore();
  }

  function updateScore() {
    var progress = getProgress();
    var result = score(progress);
    var scoreNode = document.querySelector("[data-readiness-score]");
    var labelNode = document.querySelector("[data-readiness-label]");
    var bar = document.querySelector("[data-readiness-progress]");

    if (scoreNode) scoreNode.textContent = result.percent + "%";
    if (labelNode) labelNode.textContent = labelFor(result.percent);
    if (bar) bar.style.setProperty("--progress", result.percent + "%");
  }

  function exportChecklist() {
    var progress = getProgress();
    var result = score(progress);
    var data = {
      app: "Moonshine Partner Command Center",
      type: "funding-readiness-checklist-export",
      exportedAt: new Date().toISOString(),
      score: result,
      completedItems: allItems().filter(function complete(item) {
        return progress[item.id];
      }),
      remainingItems: allItems().filter(function remaining(item) {
        return !progress[item.id];
      }),
      disclaimer: "Educational checklist only. Not an underwriting decision, credit decision, approval, or funding guarantee."
    };

    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "funding-readiness-checklist-export.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  ready(function onReady() {
    var ui = getUI();

    render();

    document.addEventListener("change", function onChange(event) {
      var input = event.target.closest("[data-readiness-item]");
      if (!input) return;

      var progress = getProgress();
      progress[input.getAttribute("data-readiness-item")] = input.checked;
      saveProgress(progress);
      render();

      if (window.MoonshineOS && window.MoonshineOS.analytics) {
        window.MoonshineOS.analytics.track("readiness_item_toggled", {
          id: input.getAttribute("data-readiness-item"),
          checked: input.checked
        });
      }
    });

    var exportButton = document.querySelector("[data-export-readiness]");
    if (exportButton) {
      exportButton.addEventListener("click", function onExport() {
        exportChecklist();
        if (ui && ui.toast) ui.toast("Checklist exported.", { tone: "success" });
      });
    }

    var fillButton = document.querySelector("[data-fill-readiness]");
    if (fillButton) {
      fillButton.addEventListener("click", function onFill() {
        var progress = getProgress();
        ["entity-active", "business-bank", "time-in-business", "monthly-revenue", "permission", "no-guarantee", "sensitive-data"].forEach(function setItem(id) {
          progress[id] = true;
        });
        saveProgress(progress);
        render();
        if (ui && ui.toast) ui.toast("Common readiness items marked.", { tone: "success" });
      });
    }

    var resetButton = document.querySelector("[data-reset-readiness]");
    if (resetButton) {
      resetButton.addEventListener("click", function onReset() {
        var ok = window.confirm("Reset funding readiness checklist progress?");
        if (!ok) return;
        saveProgress({});
        render();
        if (ui && ui.toast) ui.toast("Checklist reset.", { tone: "warning" });
      });
    }
  });
})(window, document);
