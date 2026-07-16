/* Canonical Partner Command Center dashboard configuration. */
(function initDashboardConfig(window) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var appConfig = window.MoonshineOS.config || {};
  var storageNamespace = appConfig.localStorage && appConfig.localStorage.namespace
    ? appConfig.localStorage.namespace
    : "moonshine.partnerOS.";

  window.MoonshineOS.dashboard.config = {
    version: "0.3.0-fpos-shell",
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
      profileCard: "[data-render-profile]",
      metrics: "[data-render-metrics]",
      leadForm: "[data-lead-form]",
      leadList: "[data-render-leads]",
      partnerLinks: "[data-render-partner-links]",
      resources: "[data-render-resources]",
      widgets: "[data-render-widgets]",
      commissions: "[data-render-commissions]",
      events: "[data-render-events]",
      integrationStatus: "[data-render-integration-status]"
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
    disclaimers: {
      dashboard: "Demo mode stores fictional workspace data locally. Live mode loads a partner-isolated projection from Partner Command Center APIs.",
      leads: "Lead status is a partner-visible workflow projection, not a lender decision, approval, or funding guarantee.",
      commissions: "Commission estimates are planning values only and do not represent guaranteed earnings, payable balances, or payout obligations.",
      privacy: "Do not enter Social Security numbers, bank logins, tax IDs, account numbers, credentials, private documents, or other sensitive applicant data."
    }
  };
})(window);
