/*
  Moonshine Partner Command Center
  Sprint 04 — Browser-safe live operations

  Uses /api/router public partner-scoped actions only.
  No API keys. No Notion secrets. No raw CRM pages.
*/

(function initLiveOps(window) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  var os = window.MoonshineOS;

  function now() {
    return new Date().toISOString();
  }

  function getMode() {
    return os.apiClient && os.apiClient.getMode ? os.apiClient.getMode() : "local";
  }

  function isLiveProfile(profile) {
    return Boolean(profile && profile.liveMode && profile.partnerId);
  }

  function getProfile() {
    if (os.dashboard && os.dashboard.partnerStore && os.dashboard.partnerStore.getProfile) {
      return os.dashboard.partnerStore.getProfile();
    }
    if (os.storage && os.storage.get) {
      return os.storage.get("partnerProfile", null);
    }
    return null;
  }

  function isLiveReady(profile) {
    return getMode() === "live" && isLiveProfile(profile || getProfile()) && os.apiClient && os.apiClient.requestRouter;
  }

  function buildTrackingLinkPayload(input) {
    var profile = input.profile || getProfile() || {};
    var destinationUrl = input.destinationUrl || input.destination || "./index.html";
    var trackingUrl = input.trackingUrl || input.tracking_url || destinationUrl;
    var nowIso = now();

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
      created_at: nowIso,
      updated_at: nowIso
    };
  }

  function createTrackingLink(input) {
    var profile = input && input.profile || getProfile();

    if (!isLiveReady(profile)) {
      return Promise.resolve({
        ok: false,
        skipped: true,
        reason: "live_mode_not_enabled",
        message: "Tracking link stored locally only. Live mode is not enabled or partner is not activated."
      });
    }

    return os.apiClient.requestRouter("createTrackingLink", buildTrackingLinkPayload(Object.assign({}, input || {}, { profile: profile })));
  }

  function assignPartnerResources(input) {
    var profile = input && input.profile || getProfile();

    if (!isLiveReady(profile)) {
      return Promise.resolve({
        ok: false,
        skipped: true,
        reason: "live_mode_not_enabled",
        message: "Resources remain local recommendations. Live mode is not enabled or partner is not activated."
      });
    }

    return os.apiClient.requestRouter("assignPartnerResources", {
      partner: {
        partner_id: profile.partnerId,
        partner_type: profile.partnerType || "unknown",
        onboarding_path: profile.onboardingPath || "manual_review_path"
      },
      resources: input && input.resources || profile.resourceRecommendations || []
    });
  }

  function saveLocalTrackingLink(record) {
    if (!os.storage || !os.storage.pushToArray) return record;

    os.storage.pushToArray("trackingLinks", Object.assign({
      id: "tracking_" + Date.now().toString(36),
      createdAt: now(),
      localOnly: getMode() !== "live"
    }, record || {}), 80);

    return record;
  }

  os.liveOps = {
    getMode: getMode,
    getProfile: getProfile,
    isLiveReady: isLiveReady,
    buildTrackingLinkPayload: buildTrackingLinkPayload,
    createTrackingLink: createTrackingLink,
    assignPartnerResources: assignPartnerResources,
    saveLocalTrackingLink: saveLocalTrackingLink
  };
})(window);
