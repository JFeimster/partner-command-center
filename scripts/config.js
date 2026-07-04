/*
  Moonshine Partner Command Center
  Batch 03 — Shared Config

  Static-first configuration object.
  Safe global namespace:
    window.MoonshineOS
*/

(function initMoonshineConfig(window) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  var existingConfig = window.MoonshineOS.config || {};

  var config = {
    appName: "Moonshine Partner Command Center",
    systemName: "Funding Partners OS",
    brandName: "Moonshine Capital",
    version: "0.1.0-static",
    environment: "static-demo",

    urls: {
      home: "./index.html",
      dashboard: "./dashboard.html",
      partnerAccess: "./partner-access.html",
      welcome: "./welcome/index.html",
      marketplace: "./marketplace.html",
      resources: "./resources.html",
      pricing: "./pricing.html",
      about: "./about.html",
      compliance: "./compliance.html",
      affiliateDisclosure: "./affiliate-disclosure.html",
      privacy: "./privacy.html",
      terms: "./terms.html",
      fallback404: "./404.html",
      primaryPartnerSignup: "https://tally.so/r/mOe658",
      partnerProgram: "https://www.distilledfunding.com/partners",
      defaultFundingLink: "https://www.distilledfunding.com/"
    },

    routes: {
      publicPages: [
        "index.html",
        "marketplace.html",
        "resources.html",
        "pricing.html",
        "about.html",
        "compliance.html",
        "affiliate-disclosure.html",
        "privacy.html",
        "terms.html"
      ],
      dashboardPages: [
        "dashboard.html"
      ],
      toolPages: [
        "tools/commission-simulator.html",
        "tools/funding-readiness-checklist.html",
        "tools/sales-script-generator.html"
      ]
    },

    localStorage: {
      namespace: "moonshine.partnerOS.",
      keys: {
        partnerProfile: "partnerProfile",
        leads: "leads",
        resources: "resources",
        marketplaceFavorites: "marketplaceFavorites",
        affiliateAttribution: "affiliateAttribution",
        trainingProgress: "trainingProgress",
        notes: "notes",
        events: "events",
        theme: "theme",
        analytics: "analytics",
        settings: "settings"
      }
    },

    attribution: {
      acceptedParams: [
        "partner_id",
        "partner",
        "ref",
        "affiliate",
        "affiliate_id",
        "source",
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_content",
        "utm_term"
      ],
      defaultPartnerId: "MOONSHINE-DEMO",
      cookieDays: 30
    },

    analytics: {
      enabled: true,
      maxEvents: 250,
      autoTrackPageViews: true,
      storageKey: "analytics"
    },

    ui: {
      toastDuration: 3600,
      themeAttribute: "data-theme",
      defaultTheme: "dark",
      activeClass: "is-active",
      hiddenClass: "hidden",
      busyClass: "is-busy"
    },

    compliance: {
      staticDemoNotice: "This static demo stores information locally in your browser. It is not connected to a live CRM, lender system, underwriting process, or partner payout system.",
      fundingNotice: "Funding options may vary. Submission does not guarantee approval, funding, commissions, or any specific outcome.",
      partnerNotice: "Partners are responsible for accurate, permission-based referrals and should not promise approval, funding, rates, terms, income, or commissions."
    },

    statusLabels: {
      lead: {
        new: "New",
        reviewing: "Reviewing",
        needsInfo: "Needs Info",
        submitted: "Submitted",
        funded: "Funded",
        declined: "Declined",
        archived: "Archived"
      },
      partner: {
        draft: "Draft",
        active: "Active Demo",
        pending: "Pending Review",
        paused: "Paused",
        archived: "Archived"
      }
    }
  };

  function mergeDeep(target, source) {
    if (!source || typeof source !== "object") return target;

    Object.keys(source).forEach(function mergeKey(key) {
      var sourceValue = source[key];
      var targetValue = target[key];

      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        mergeDeep(targetValue, sourceValue);
        return;
      }

      target[key] = sourceValue;
    });

    return target;
  }

  window.MoonshineOS.config = mergeDeep(config, existingConfig);

  window.MoonshineOS.getConfig = function getConfig(path, fallback) {
    if (!path) return window.MoonshineOS.config;

    var parts = String(path).split(".");
    var cursor = window.MoonshineOS.config;

    for (var i = 0; i < parts.length; i += 1) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) {
        return fallback;
      }
      cursor = cursor[parts[i]];
    }

    return cursor == null ? fallback : cursor;
  };
})(window);
