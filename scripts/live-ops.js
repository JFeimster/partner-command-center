/*
  Moonshine Partner Command Center
  Sprints 04-05 — Browser-safe live operations

  Browser actions queue link/resource/lead-router intent locally.
  Trusted server/API calls write to Notion or route funding fit. No browser API keys.
*/

(function initLiveOps(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  var os = window.MoonshineOS;

  function now() { return new Date().toISOString(); }
  function ready(callback) { if (!document) return; if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback); else callback(); }
  function toast(message, tone) { if (os.ui && os.ui.toast) os.ui.toast(message, { tone: tone || "success" }); }
  function getMode() { return os.apiClient && os.apiClient.getMode ? os.apiClient.getMode() : "local"; }
  function getProfile() { if (os.dashboard && os.dashboard.partnerStore && os.dashboard.partnerStore.getProfile) return os.dashboard.partnerStore.getProfile(); if (os.storage && os.storage.get) return os.storage.get("partnerProfile", null); return null; }
  function isLiveProfile(profile) { return Boolean(profile && profile.liveMode && profile.partnerId); }
  function isLiveReady(profile) { return getMode() === "live" && isLiveProfile(profile || getProfile()); }

  function pushQueue(key, item, limit) {
    if (!os.storage || !os.storage.pushToArray) return item;
    os.storage.pushToArray(key, Object.assign({ id: key + "_" + Date.now().toString(36), createdAt: now() }, item || {}), limit || 80);
    return item;
  }

  function buildTrackingLinkPayload(input) {
    input = input || {};
    var profile = input.profile || getProfile() || {};
    var destinationUrl = input.destinationUrl || input.destination || "./index.html";
    var trackingUrl = input.trackingUrl || input.tracking_url || destinationUrl;

    return {
      partner_id: profile.partnerId,
      destination_url: destinationUrl,
      tracking_url: trackingUrl,
      source: input.source || input.utm_source || "dashboard",
      campaign: input.campaign || input.utm_campaign || "",
      medium: input.medium || input.utm_medium || "partner_dashboard",
      utm_source: input.utm_source || input.source || "dashboard",
      utm_medium: input.utm_medium || input.medium || "partner_dashboard",
      utm_campaign: input.utm_campaign || input.campaign || "",
      status: input.status || "active",
      created_at: now(),
      updated_at: now()
    };
  }

  function createTrackingLink(input) {
    var profile = input && input.profile || getProfile();
    var payload = buildTrackingLinkPayload(Object.assign({}, input || {}, { profile: profile }));

    pushQueue("trackingLinks", Object.assign({}, payload, {
      localOnly: !isLiveReady(profile),
      trustedWriteRequired: true,
      trustedEndpoint: "/api/partner-links"
    }), 80);

    return Promise.resolve({ ok: false, queued: true, reason: "trusted_write_required", message: "Tracking link intent queued locally. Trusted server-side call is required to write Notion tracking records.", payload: payload });
  }

  function assignPartnerResources(input) {
    var profile = input && input.profile || getProfile();
    var payload = {
      partner: {
        partner_id: profile && profile.partnerId,
        partner_type: profile && profile.partnerType || "unknown",
        onboarding_path: profile && profile.onboardingPath || "manual_review_path"
      },
      resources: input && input.resources || profile && profile.resourceRecommendations || []
    };

    pushQueue("resourceAssignments", Object.assign({}, payload, { localOnly: !isLiveReady(profile), trustedWriteRequired: true, trustedAction: "assignPartnerResources" }), 80);
    return Promise.resolve({ ok: false, queued: true, reason: "trusted_write_required", message: "Resource assignment intent queued locally. Trusted router call is required to write Notion resource records.", payload: payload });
  }

  function buildLeadPayload(input) {
    var profile = getProfile() || {};
    input = input || {};
    return {
      partner_id: profile.partnerId,
      business_name: input.businessName || input.business_name || "",
      contact_name: input.contactName || input.contact_name || "",
      email: input.email || "",
      phone: input.phone || "",
      industry: input.industry || "",
      monthly_revenue: input.monthlyRevenue || input.monthly_revenue || 0,
      time_in_business: input.timeInBusiness || input.time_in_business || "",
      funding_need: input.fundingNeed || input.funding_need || 0,
      use_of_funds: input.useOfFunds || input.use_of_funds || "",
      urgency: input.urgency || "",
      source: input.source || "partner_dashboard",
      notes: input.notes || "",
      created_at: now()
    };
  }

  function queueLeadRouterIntent(input) {
    var profile = getProfile() || {};
    var payload = buildLeadPayload(input || {});

    pushQueue("leadRouterQueue", Object.assign({}, payload, {
      localOnly: !isLiveReady(profile),
      trustedWriteRequired: true,
      trustedEndpoint: "/api/lead-router"
    }), 80);

    return Promise.resolve({ ok: false, queued: true, reason: "trusted_write_required", message: "Lead routing intent queued locally. Trusted server-side call is required to route and log lead submissions.", payload: payload });
  }

  function recordBuiltLinkFromForm(form) {
    if (!form) return Promise.resolve({ skipped: true });
    var output = document.querySelector("[data-built-link]");
    var data = os.forms && os.forms.serializeForm ? os.forms.serializeForm(form) : {};
    var trackingUrl = output && output.value ? output.value : data.destination || "./index.html";

    return createTrackingLink({ destinationUrl: data.destination || "./index.html", trackingUrl: trackingUrl, source: data.source || "dashboard", campaign: data.campaign || "", medium: "partner_dashboard" });
  }

  function bindDashboardActions() {
    document.addEventListener("submit", function onSubmit(event) {
      var linkForm = event.target && event.target.closest ? event.target.closest("[data-link-builder-form]") : null;
      if (linkForm) {
        window.setTimeout(function afterLocalBuild() {
          recordBuiltLinkFromForm(linkForm).then(function done(result) { if (result && result.queued) toast("Partner link queued for trusted tracking sync.", "success"); });
        }, 50);
        return;
      }

      var leadForm = event.target && event.target.closest ? event.target.closest("[data-lead-form]") : null;
      if (leadForm) {
        window.setTimeout(function afterLocalLeadSave() {
          var data = os.forms && os.forms.serializeForm ? os.forms.serializeForm(leadForm) : {};
          queueLeadRouterIntent(data).then(function done(result) { if (result && result.queued) toast("Lead queued for trusted funding-fit routing.", "success"); });
        }, 50);
      }
    }, true);

    document.addEventListener("click", function onClick(event) {
      var syncResources = event.target && event.target.closest ? event.target.closest("[data-sync-partner-resources]") : null;
      if (syncResources) {
        assignPartnerResources({}).then(function done(result) { if (result && result.queued) toast("Resource assignment queued for trusted sync.", "success"); });
        return;
      }

      var copyOffer = event.target && event.target.closest ? event.target.closest("[data-copy-offer-link]") : null;
      if (copyOffer) {
        var destination = copyOffer.getAttribute("data-copy-offer-link") || "./marketplace.html";
        window.setTimeout(function afterCopyOffer() {
          var link = os.dashboard && os.dashboard.affiliateStore && os.dashboard.affiliateStore.buildLink ? os.dashboard.affiliateStore.buildLink(destination, { source: "dashboard_marketplace" }) : destination;
          createTrackingLink({ destinationUrl: destination, trackingUrl: link, source: "dashboard_marketplace", campaign: "marketplace_offer", medium: "partner_dashboard" });
        }, 50);
      }
    }, true);
  }

  os.liveOps = {
    getMode: getMode,
    getProfile: getProfile,
    isLiveReady: isLiveReady,
    buildTrackingLinkPayload: buildTrackingLinkPayload,
    createTrackingLink: createTrackingLink,
    assignPartnerResources: assignPartnerResources,
    buildLeadPayload: buildLeadPayload,
    queueLeadRouterIntent: queueLeadRouterIntent,
    recordBuiltLinkFromForm: recordBuiltLinkFromForm
  };

  ready(bindDashboardActions);
})(window, document);
