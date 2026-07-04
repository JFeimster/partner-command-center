/*
  Moonshine Partner Command Center
  Batch 08 — Dashboard Config

  Dashboard-specific settings and constants.
*/

(function initDashboardConfig(window) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var appConfig = window.MoonshineOS.config || {};
  var storageNamespace = appConfig.localStorage && appConfig.localStorage.namespace
    ? appConfig.localStorage.namespace
    : "moonshine.partnerOS.";

  var config = {
    version: "0.1.0-static",
    rootSelector: "[data-dashboard-root]",
    defaultSection: "overview",
    storageNamespace: storageNamespace,

    storageKeys: {
      partnerProfile: "partnerProfile",
      leads: "leads",
      resources: "resources",
      marketplaceFavorites: "marketplaceFavorites",
      resourceFavorites: "resourceFavorites",
      trainingProgress: "trainingProgress",
      notes: "notes",
      events: "events",
      affiliateAttribution: "affiliateAttribution",
      theme: "theme",
      settings: "settings"
    },

    selectors: {
      nav: "[data-dashboard-nav]",
      section: "[data-dashboard-section]",
      sectionTarget: "[data-section-target]",
      profileCard: "[data-render-profile]",
      metrics: "[data-render-metrics]",
      leadForm: "[data-lead-form]",
      leadList: "[data-render-leads]",
      marketplace: "[data-render-marketplace]",
      partnerLinks: "[data-render-partner-links]",
      resources: "[data-render-resources]",
      training: "[data-render-training]",
      commissions: "[data-render-commissions]",
      integrations: "[data-render-integrations]",
      notes: "[data-render-notes]",
      events: "[data-render-events]",
      settings: "[data-render-settings]"
    },

    leadStatuses: [
      { id: "new", label: "New", tone: "info" },
      { id: "reviewing", label: "Reviewing", tone: "success" },
      { id: "needsInfo", label: "Needs Info", tone: "warning" },
      { id: "submitted", label: "Submitted", tone: "success" },
      { id: "funded", label: "Funded", tone: "success" },
      { id: "declined", label: "Declined", tone: "danger" },
      { id: "archived", label: "Archived", tone: "default" }
    ],

    defaultPartnerProfile: {
      id: "partner_demo_local",
      partnerId: "MS-DEMO-0000",
      contactName: "Demo Partner",
      email: "partner@example.com",
      phone: "",
      company: "Moonshine Demo Partner",
      partnerType: "funding-broker",
      partnerPath: "submit-leads",
      primaryAudience: "Small business owners seeking funding readiness",
      channels: ["referrals", "direct-outreach"],
      city: "Washington",
      state: "DC",
      status: "active-demo",
      localDemo: true
    },

    integrationCards: [
      {
        id: "tally",
        title: "Tally Partner Signup",
        status: "Blueprint",
        summary: "Route partner applications from Tally into future partner profile creation.",
        href: "./integrations/tally-partner-signup.md"
      },
      {
        id: "crm",
        title: "CRM Mapping",
        status: "Blueprint",
        summary: "Map leads, partners, statuses, source tags, and compliance fields into a CRM.",
        href: "./developers/crm-integrations.html"
      },
      {
        id: "widget",
        title: "Embeddable Widget",
        status: "Static prototype",
        summary: "Capture basic funding readiness interest with partner ID attribution.",
        href: "./widgets/funding-widget.html"
      },
      {
        id: "gpt-actions",
        title: "GPT Actions",
        status: "Example schema",
        summary: "Prepare GPT action examples for future lead and partner workflows.",
        href: "./integrations/gpt-schema.json"
      },
      {
        id: "webhooks",
        title: "Webhooks",
        status: "Example only",
        summary: "Document future inbound lead, status, and signup webhook workflows.",
        href: "./developers/webhooks.html"
      },
      {
        id: "api",
        title: "API Examples",
        status: "Not live",
        summary: "Review example-only serverless/API files for future backend work.",
        href: "./api/README.md"
      }
    ],

    disclaimers: {
      dashboard:
        "This dashboard is a static demo. Data may be stored locally in your browser. It is not connected to a live CRM, lender system, underwriting process, partner portal, or commission reporting system.",
      leads:
        "Lead records in this static dashboard are demo workflow records only. Submission does not guarantee approval, funding, lender review, or commissions.",
      commissions:
        "Commission snapshots are educational examples only and do not represent guaranteed earnings, payable balances, or real payout obligations.",
      privacy:
        "Do not enter Social Security numbers, bank logins, tax IDs, account numbers, full loan applications, private documents, or other sensitive borrower data."
    }
  };

  window.MoonshineOS.dashboard.config = Object.assign(
    {},
    window.MoonshineOS.dashboard.config || {},
    config
  );
})(window);
