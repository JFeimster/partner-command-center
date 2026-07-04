/*
  Moonshine Partner Command Center
  Batch 12 — Admin Config

  Static admin/ops prototype configuration.
  No authentication, authorization, CRM, lender, payout, or backend behavior.
*/

(function initMoonshineAdminConfig(window) {
  "use strict";

  window.MoonshineAdmin = window.MoonshineAdmin || {};

  window.MoonshineAdmin.config = {
    version: "0.1.0-static",
    appName: "Moonshine Admin Ops",
    rootSelector: "[data-admin-root]",
    storageNamespace: "moonshine.adminOps.",
    defaultView: "overview",

    views: [
      {
        id: "overview",
        label: "Overview",
        description: "Ops snapshot, review queues, risk signals, and recent activity."
      },
      {
        id: "partners",
        label: "Partners",
        description: "Review demo partner profiles, partner type, source, and status."
      },
      {
        id: "leads",
        label: "Leads",
        description: "Review fictional lead records, status, source, and next step."
      },
      {
        id: "marketplace",
        label: "Marketplace",
        description: "Audit example offers, categories, partner fit, and compliance notes."
      },
      {
        id: "compliance",
        label: "Compliance",
        description: "Review static copy guardrails and flagged language."
      },
      {
        id: "integrations",
        label: "Integrations",
        description: "Track future Tally, CRM, widget, API, webhook, and GPT readiness."
      },
      {
        id: "activity",
        label: "Activity",
        description: "Fictional admin and dashboard activity timeline."
      },
      {
        id: "settings",
        label: "Settings",
        description: "Static admin controls, export, and reset."
      }
    ],

    partnerStatuses: [
      "active",
      "pending",
      "paused",
      "needs-review",
      "archived"
    ],

    leadStatuses: [
      "new",
      "reviewing",
      "needsInfo",
      "submitted",
      "funded",
      "declined",
      "archived"
    ],

    integrationStatuses: [
      "Not started",
      "Blueprint",
      "Static prototype",
      "Needs backend",
      "Ready for review"
    ],

    reviewRules: [
      {
        id: "no-guarantees",
        title: "No guaranteed outcomes",
        description: "Copy must not promise approval, funding, rates, terms, timelines, income, or commissions."
      },
      {
        id: "permission-based",
        title: "Permission-based referrals",
        description: "Partner flows should remind users to submit only information they have permission to share."
      },
      {
        id: "sensitive-data",
        title: "No sensitive data in static demo",
        description: "Static forms should not request SSNs, bank logins, full tax IDs, account numbers, or private documents."
      },
      {
        id: "example-labeling",
        title: "Example-only labeling",
        description: "Mock leads, commissions, APIs, widgets, and integrations must be clearly labeled as examples."
      }
    ],

    disclaimers: {
      admin:
        "This admin area is a static prototype. It does not provide authentication, role-based access control, CRM updates, lender routing, underwriting review, payout approvals, or secure data storage.",
      data:
        "All admin records shown here are fictional demo records or browser-local state. Do not treat them as production records.",
      compliance:
        "This page supports operational review only and is not legal, tax, lending, underwriting, credit repair, accounting, or financial advice."
    }
  };

  window.MoonshineAdmin.getConfig = function getConfig(path, fallback) {
    if (!path) return window.MoonshineAdmin.config;

    var parts = String(path).split(".");
    var cursor = window.MoonshineAdmin.config;

    for (var i = 0; i < parts.length; i += 1) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) {
        return fallback;
      }
      cursor = cursor[parts[i]];
    }

    return cursor == null ? fallback : cursor;
  };
})(window);
