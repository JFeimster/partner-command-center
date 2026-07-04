/*
  Moonshine Partner Command Center
  Batch 08 — Partner Store

  Local demo partner profile management.
*/

(function initPartnerStore(window) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var dashboard = window.MoonshineOS.dashboard;
  var storage = window.MoonshineOS.storage;
  var ui = window.MoonshineOS.ui;
  var config = dashboard.config || {};
  var key = config.storageKeys && config.storageKeys.partnerProfile || "partnerProfile";

  function now() {
    return new Date().toISOString();
  }

  function getDefaultProfile() {
    var seed = dashboard.seedData && dashboard.seedData.partnerProfile;
    return Object.assign({}, config.defaultPartnerProfile || {}, seed || {});
  }

  function generatePartnerId(profile) {
    var typeMap = {
      "funding-broker": "FB",
      "referral-partner": "RP",
      "affiliate-partner": "AF",
      "center-of-influence": "COI",
      "operator": "OPS"
    };

    var type = profile && profile.partnerType || "partner";
    var prefix = typeMap[type] || "PT";
    var source = [profile && profile.company, profile && profile.contactName, profile && profile.email].join("-");
    var slug = ui && ui.slugify ? ui.slugify(source) : String(Date.now());
    var checksum = 0;

    for (var i = 0; i < slug.length; i += 1) {
      checksum = (checksum + slug.charCodeAt(i) * (i + 1)) % 9999;
    }

    return "MS-" + prefix + "-" + String(checksum || Date.now() % 9999).padStart(4, "0");
  }

  function getProfile() {
    var profile = storage && storage.get ? storage.get(key, null) : null;
    return profile || getDefaultProfile();
  }

  function saveProfile(profile) {
    var existing = getProfile();
    var saved = Object.assign({}, existing, profile || {}, {
      id: existing.id || "partner_" + Date.now().toString(36),
      partnerId: (profile && profile.partnerId) || existing.partnerId || generatePartnerId(profile || existing),
      updatedAt: now(),
      createdAt: existing.createdAt || now(),
      localDemo: true
    });

    if (storage && storage.set) {
      storage.set(key, saved);
    }

    if (dashboard.state) {
      dashboard.state.setState({
        partnerProfile: saved
      }, {
        type: "partner.saveProfile"
      });
    }

    return saved;
  }

  function updateProfile(patch) {
    return saveProfile(Object.assign({}, getProfile(), patch || {}));
  }

  function resetProfile() {
    var profile = getDefaultProfile();

    if (storage && storage.set) {
      storage.set(key, profile);
    }

    if (dashboard.state) {
      dashboard.state.setState({
        partnerProfile: profile
      }, {
        type: "partner.resetProfile"
      });
    }

    return profile;
  }

  function getPartnerLink(destination, params) {
    var profile = getProfile();
    var affiliate = window.MoonshineOS.affiliateTracking;

    if (affiliate && affiliate.buildPartnerLink) {
      return affiliate.buildPartnerLink(destination || "./index.html", profile.partnerId, params || {});
    }

    var url = new URL(destination || "./index.html", window.location.href);
    url.searchParams.set("partner_id", profile.partnerId);
    Object.keys(params || {}).forEach(function setParam(keyName) {
      if (params[keyName] != null && params[keyName] !== "") {
        url.searchParams.set(keyName, params[keyName]);
      }
    });

    return url.toString();
  }

  dashboard.partnerStore = {
    getDefaultProfile: getDefaultProfile,
    generatePartnerId: generatePartnerId,
    getProfile: getProfile,
    saveProfile: saveProfile,
    updateProfile: updateProfile,
    resetProfile: resetProfile,
    getPartnerLink: getPartnerLink
  };
})(window);
