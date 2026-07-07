/*
  Moonshine Partner Command Center
  Sprint 04 — Browser-safe live operations

  Uses /api/router partner-scoped actions only.
  No API keys. No Notion secrets. No raw CRM pages.
*/

(function initLiveOps(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  var os = window.MoonshineOS;

  function now() {
    return new Date().toISOString();
  }

  function ready(callback) {
    if (!document) return;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  }

  function toast(message, tone) {
    if (os.ui && os.ui.toast) os.ui.toast(message, { tone: tone || "success" });
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
    input = input || {};
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
    var payload = buildTrackingLinkPayload(Object.assign({}, input || {}, { profile: profile }));

    saveLocalTrackingLink({
      partnerId: payload.partner_id,
      destinationUrl: payload.destination_url,
      trackingUrl: payload.tracking_url,
      source: payload.source,
      campaign: payload.campaign,
      medium: payload.medium
    });

    if (!isLiveReady(profile)) {
      return Promise.resolve({
        ok: false,
        skipped: true,
        reason: "live_mode_not_enabled",
        message: "Tracking link stored locally only. Live mode is not enabled or partner is not activated."
      });
    }

    return os.apiClient.requestRouter("createTrackingLink", payload);
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

  function recordBuiltLinkFromForm(form) {
    if (!form) return Promise.resolve({ skipped: true });
    var output = document.querySelector("[data-built-link]");
    var data = os.forms && os.forms.serializeForm ? os.forms.serializeForm(form) : {};
    var trackingUrl = output && output.value ? output.value : data.destination || "./index.html";

    return createTrackingLink({
      destinationUrl: data.destination || "./index.html",
      trackingUrl: trackingUrl,
      source: data.source || "dashboard",
      campaign: data.campaign || "",
      medium: "partner_dashboard"
    });
  }

  function bindDashboardActions() {
    document.addEventListener("submit", function onSubmit(event) {
      var form = event.target && event.target.closest ? event.target.closest("[data-link-builder-form]") : null;
      if (!form) return;

      window.setTimeout(function afterLocalBuild() {
        recordBuiltLinkFromForm(form).then(function done(result) {
          if (result && result.ok) toast("Tracking link recorded in Notion.", "success");
          else if (result && result.skipped) toast("Partner link saved locally. Live tracking record skipped.", "warning");
          else toast("Partner link built. Tracking record may need review.", "warning");
        });
      }, 50);
    }, true);

    document.addEventListener("click", function onClick(event) {
      var syncResources = event.target && event.target.closest ? event.target.closest("[data-sync-partner-resources]") : null;
      if (syncResources) {
        assignPartnerResources({}).then(function done(result) {
          if (result && result.ok) toast("Partner resources assigned in Notion.", "success");
          else if (result && result.skipped) toast("Live resource assignment skipped. Activate live mode first.", "warning");
          else toast("Resource assignment failed or needs review.", "danger");
        });
        return;
      }

      var copyOffer = event.target && event.target.closest ? event.target.closest("[data-copy-offer-link]") : null;
      if (copyOffer) {
        var destination = copyOffer.getAttribute("data-copy-offer-link") || "./marketplace.html";
        window.setTimeout(function afterCopyOffer() {
          var link = os.dashboard && os.dashboard.affiliateStore && os.dashboard.affiliateStore.buildLink
            ? os.dashboard.affiliateStore.buildLink(destination, { source: "dashboard_marketplace" })
            : destination;
          createTrackingLink({
            destinationUrl: destination,
            trackingUrl: link,
            source: "dashboard_marketplace",
            campaign: "marketplace_offer",
            medium: "partner_dashboard"
          });
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
    saveLocalTrackingLink: saveLocalTrackingLink,
    recordBuiltLinkFromForm: recordBuiltLinkFromForm
  };

  ready(bindDashboardActions);
})(window, document);
