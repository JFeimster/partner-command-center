/*
  Moonshine Partner Command Center
  Batch 03 + Sprint 03 — Shared Config and Activation Client
*/

(function initMoonshineConfig(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  var existingConfig = window.MoonshineOS.config || {};

  var config = {
    appName: "Moonshine Partner Command Center",
    systemName: "Funding Partners OS",
    brandName: "Moonshine Capital",
    version: "0.3.0-sprint-03",
    environment: "static-demo",

    api: {
      mode: "local",
      routerPath: "/api/router",
      supportedModes: ["local", "live"],
      liveModeParams: ["api_mode", "mode", "live"],
      activationLookupAction: "getPartnerActivation",
      timeoutMs: 12000,
      noSecretsInBrowser: true
    },

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
      publicPages: ["index.html", "marketplace.html", "resources.html", "pricing.html", "about.html", "compliance.html", "affiliate-disclosure.html", "privacy.html", "terms.html"],
      dashboardPages: ["dashboard.html"],
      toolPages: ["tools/commission-simulator.html", "tools/funding-readiness-checklist.html", "tools/sales-script-generator.html"]
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
        settings: "settings",
        apiMode: "apiMode",
        activationContext: "activationContext"
      }
    },

    attribution: {
      acceptedParams: ["partner_id", "partner", "ref", "affiliate", "affiliate_id", "source", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"],
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
        archived: "Archived",
        intake_received: "Intake Received",
        needs_review: "Needs Review",
        approved: "Approved",
        active_live: "Active"
      }
    }
  };

  function mergeDeep(target, source) {
    if (!source || typeof source !== "object") return target;
    Object.keys(source).forEach(function mergeKey(key) {
      var sourceValue = source[key];
      var targetValue = target[key];
      if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue) && targetValue && typeof targetValue === "object" && !Array.isArray(targetValue)) {
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
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) return fallback;
      cursor = cursor[parts[i]];
    }
    return cursor == null ? fallback : cursor;
  };

  function ready(callback) {
    if (!document) return;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  }

  function getNamespace() {
    return window.MoonshineOS.getConfig("localStorage.namespace", "moonshine.partnerOS.");
  }

  function getStorageKey(key) {
    return getNamespace() + key;
  }

  function safeParse(value, fallback) {
    if (value == null || value === "") return fallback;
    try { return JSON.parse(value); } catch (error) { return fallback; }
  }

  function readLocal(key, fallback) {
    try { return safeParse(window.localStorage.getItem(getStorageKey(key)), fallback); } catch (error) { return fallback; }
  }

  function writeLocal(key, value) {
    try { window.localStorage.setItem(getStorageKey(key), JSON.stringify(value)); return true; } catch (error) { return false; }
  }

  function getQueryObject() {
    var params = new URLSearchParams(window.location.search || "");
    var query = {};
    params.forEach(function eachParam(value, key) { query[key] = value; });
    return query;
  }

  function resolveApiMode() {
    var query = getQueryObject();
    var configured = window.MoonshineOS.getConfig("api.mode", "local");
    var stored = readLocal(window.MoonshineOS.getConfig("localStorage.keys.apiMode", "apiMode"), null);
    var requested = null;

    window.MoonshineOS.getConfig("api.liveModeParams", []).forEach(function eachParam(param) {
      if (requested) return;
      if (query[param] === "live" || query[param] === "1" || query[param] === "true") requested = "live";
      if (query[param] === "local" || query[param] === "0" || query[param] === "false") requested = "local";
    });

    if (requested) {
      writeLocal(window.MoonshineOS.getConfig("localStorage.keys.apiMode", "apiMode"), requested);
      return requested;
    }

    return stored || configured || "local";
  }

  function setApiMode(mode) {
    var cleanMode = mode === "live" ? "live" : "local";
    writeLocal(window.MoonshineOS.getConfig("localStorage.keys.apiMode", "apiMode"), cleanMode);
    window.MoonshineOS.config.api.mode = cleanMode;
    return cleanMode;
  }

  function requestRouter(action, payload) {
    var routerPath = window.MoonshineOS.getConfig("api.routerPath", "/api/router");
    var timeoutMs = window.MoonshineOS.getConfig("api.timeoutMs", 12000);
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function abortRequest() { controller.abort(); }, timeoutMs) : null;

    return window.fetch(routerPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ action: action }, payload || {})),
      signal: controller ? controller.signal : undefined
    }).then(function parseResponse(response) {
      if (timer) window.clearTimeout(timer);
      return response.json().catch(function jsonFailed() {
        return { ok: false, error: { code: "invalid_json", message: "Router returned non-JSON response." } };
      }).then(function withStatus(body) {
        if (!response.ok && body && body.ok !== false) {
          body.ok = false;
          body.error = body.error || { code: "http_error", message: "Router request failed.", status: response.status };
        }
        return body;
      });
    }).catch(function catchRequest(error) {
      if (timer) window.clearTimeout(timer);
      return { ok: false, error: { code: error && error.name === "AbortError" ? "timeout" : "request_failed", message: error && error.message ? error.message : "Router request failed." } };
    });
  }

  function normalizePartnerProfile(partner) {
    partner = partner || {};
    return {
      id: partner.id || "partner_" + Date.now().toString(36),
      partnerId: partner.partnerId || partner.partner_id || partner.partnerID || "",
      contactName: partner.contactName || partner.name || "Partner",
      email: partner.email || "",
      phone: partner.phone || "",
      company: partner.company || "",
      website: partner.website || "",
      partnerType: partner.partnerType || partner.partner_type || "unknown",
      primaryAudience: partner.primaryAudience || partner.audience || "",
      status: partner.status || "needs_review",
      tier: partner.tier || "manual_review",
      onboardingPath: partner.onboardingPath || partner.onboarding_path || "manual_review_path",
      resourceRecommendations: partner.resourceRecommendations || partner.resource_recommendations || [],
      campaignRecommendations: partner.campaignRecommendations || partner.campaign_recommendations || [],
      createdAt: partner.createdAt || partner.created_at || new Date().toISOString(),
      updatedAt: partner.updatedAt || partner.updated_at || new Date().toISOString(),
      dashboardUrl: "./dashboard.html",
      welcomeUrl: "./welcome/index.html",
      localDemo: false,
      liveMode: true,
      activationSource: "api-router"
    };
  }

  function saveActivatedProfile(profile, meta) {
    var keys = window.MoonshineOS.getConfig("localStorage.keys", {});
    var saved = Object.assign({}, profile || {}, { updatedAt: new Date().toISOString(), liveMode: profile && profile.liveMode !== false, activationMeta: meta || {} });
    writeLocal(keys.partnerProfile || "partnerProfile", saved);
    writeLocal(keys.activationContext || "activationContext", {
      partnerId: saved.partnerId,
      email: saved.email,
      status: saved.status,
      tier: saved.tier,
      onboardingPath: saved.onboardingPath,
      liveMode: saved.liveMode,
      updatedAt: saved.updatedAt
    });
    return saved;
  }

  function lookupActivation(params) {
    var payload = {};
    if (params && params.partner_id) payload.partner_id = params.partner_id;
    if (params && params.partnerId) payload.partner_id = params.partnerId;
    if (params && params.email) payload.email = params.email;

    return requestRouter(window.MoonshineOS.getConfig("api.activationLookupAction", "getPartnerActivation"), payload).then(function handleLookup(response) {
      if (!response || !response.ok) return response;
      var data = response.data || {};
      var profile = normalizePartnerProfile(data.partner || data);
      var saved = saveActivatedProfile(profile, { action: "lookupActivation", responseAction: data.action || "getPartnerActivation" });
      return Object.assign({}, response, { profile: saved });
    });
  }

  function renderActivationBanner(mode) {
    if (!document || document.querySelector("[data-activation-banner]")) return;
    var banner = document.createElement("div");
    banner.setAttribute("data-activation-banner", "");
    banner.style.cssText = "position:sticky;top:0;z-index:9999;padding:.65rem 1rem;background:#101820;color:#fff;border-bottom:1px solid rgba(255,255,255,.16);font:600 14px/1.4 system-ui, sans-serif;";
    banner.textContent = mode === "live" ? "Live activation mode: dashboard surfaces use /api/router when available. No browser secrets are stored." : "Local demo mode: profile and dashboard state are browser-local only.";
    document.body.insertBefore(banner, document.body.firstChild);
  }

  function bindPartnerAccessLiveMode(mode) {
    if (mode !== "live") return;
    var form = document.querySelector("[data-partner-access-form]");
    if (!form) return;

    form.addEventListener("submit", function interceptLiveAccess(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      var formData = new FormData(form);
      var email = String(formData.get("email") || "").trim().toLowerCase();
      var stored = readLocal(window.MoonshineOS.getConfig("localStorage.keys.partnerProfile", "partnerProfile"), {}) || {};
      var partnerId = String(stored.partnerId || formData.get("partnerId") || "").trim();
      var ui = window.MoonshineOS.ui;
      if (!email && !partnerId) {
        if (ui && ui.toast) ui.toast("Enter an email or existing partner ID for live activation lookup.", { tone: "warning" });
        return;
      }
      if (ui && ui.toast) ui.toast("Checking live partner activation status...", { tone: "success" });
      lookupActivation({ email: email, partner_id: partnerId }).then(function onLookup(result) {
        if (!result || !result.ok) {
          var message = result && result.error && result.error.message ? result.error.message : "Live activation lookup failed.";
          if (ui && ui.toast) ui.toast(message, { tone: "danger" });
          return;
        }
        if (ui && ui.toast) ui.toast("Live partner profile activated. Routing to welcome.", { tone: "success" });
        window.setTimeout(function goWelcome() { window.location.href = "./welcome/index.html?api_mode=live"; }, 500);
      });
    }, true);
  }

  function hydrateFromQuery(mode) {
    if (mode !== "live") return;
    var query = getQueryObject();
    var partnerId = query.partner_id || query.partnerId || query.partner || "";
    var email = query.email || "";
    if (!partnerId && !email) return;
    lookupActivation({ partner_id: partnerId, email: email }).then(function onQueryActivation(result) {
      var ui = window.MoonshineOS.ui;
      if (result && result.ok && ui && ui.toast) ui.toast("Live partner context loaded.", { tone: "success" });
    });
  }

  window.MoonshineOS.apiClient = {
    getMode: resolveApiMode,
    setMode: setApiMode,
    requestRouter: requestRouter,
    lookupActivation: lookupActivation,
    normalizePartnerProfile: normalizePartnerProfile,
    saveActivatedProfile: saveActivatedProfile
  };

  window.MoonshineOS.activation = {
    getMode: resolveApiMode,
    lookup: lookupActivation,
    saveProfile: saveActivatedProfile,
    normalizeProfile: normalizePartnerProfile
  };

  ready(function initSprint03Activation() {
    var mode = resolveApiMode();
    window.MoonshineOS.config.api.mode = mode;
    renderActivationBanner(mode);
    hydrateFromQuery(mode);
    bindPartnerAccessLiveMode(mode);
  });
})(window, document);
