/*
  Moonshine Partner Command Center
  Batch 03 — Affiliate / Partner Attribution Tracking

  Captures URL attribution into localStorage for static demo flows.
*/

(function initMoonshineAffiliateTracking(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  var getConfig = window.MoonshineOS.getConfig || function fallbackConfig(path, fallback) {
    if (path === "attribution.acceptedParams") return ["partner_id", "ref", "affiliate", "source"];
    if (path === "attribution.defaultPartnerId") return "MOONSHINE-DEMO";
    return fallback;
  };

  var storage = window.MoonshineOS.storage;
  var routes = window.MoonshineOS.routes;
  var ui = window.MoonshineOS.ui;

  var storageKey = "affiliateAttribution";

  function acceptedParams() {
    return getConfig("attribution.acceptedParams", [
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
    ]);
  }

  function captureFromUrl(search) {
    var params = new URLSearchParams(search == null ? window.location.search : search);
    var accepted = acceptedParams();
    var found = {};

    accepted.forEach(function captureKey(key) {
      var value = params.get(key);
      if (value) {
        found[key] = value;
      }
    });

    if (Object.keys(found).length === 0) {
      return getStoredAttribution();
    }

    var existing = getStoredAttribution();
    var attribution = Object.assign({}, existing, found, {
      capturedAt: new Date().toISOString(),
      landingPath: existing.landingPath || window.location.pathname,
      latestPath: window.location.pathname,
      userAgent: navigator.userAgent
    });

    if (storage) {
      storage.set(storageKey, attribution);
    }

    return attribution;
  }

  function getStoredAttribution() {
    return storage ? storage.get(storageKey, {}) : {};
  }

  function clearAttribution() {
    if (storage) {
      storage.remove(storageKey);
    }
  }

  function getPartnerId(fallback) {
    var attribution = getStoredAttribution();

    return (
      attribution.partner_id ||
      attribution.partner ||
      attribution.ref ||
      attribution.affiliate_id ||
      attribution.affiliate ||
      fallback ||
      getConfig("attribution.defaultPartnerId", "MOONSHINE-DEMO")
    );
  }

  function getAttributionParams() {
    var attribution = getStoredAttribution();
    var params = {};

    acceptedParams().forEach(function addParam(key) {
      if (attribution[key]) {
        params[key] = attribution[key];
      }
    });

    return params;
  }

  function buildPartnerLink(destination, partnerId, extraParams) {
    var base = destination || getConfig("urls.defaultFundingLink", "./index.html");
    var params = Object.assign({}, extraParams || {}, {
      partner_id: partnerId || getPartnerId()
    });

    if (routes && routes.buildUrl) {
      return routes.buildUrl(base, params);
    }

    var url = new URL(base, window.location.href);

    Object.keys(params).forEach(function setParam(key) {
      if (params[key] != null && params[key] !== "") {
        url.searchParams.set(key, params[key]);
      }
    });

    return url.toString();
  }

  function applyAttributionToLinks(selector) {
    var links = Array.prototype.slice.call(document.querySelectorAll(selector || "[data-preserve-attribution]"));
    var params = getAttributionParams();

    if (Object.keys(params).length === 0) {
      return links;
    }

    links.forEach(function updateLink(link) {
      var href = link.getAttribute("href");
      if (!href || href.indexOf("#") === 0 || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) {
        return;
      }

      if (routes && routes.buildUrl) {
        link.setAttribute("href", routes.buildUrl(href, params));
      }
    });

    return links;
  }

  function hydratePartnerFields(root) {
    var scope = root || document;
    var partnerId = getPartnerId();

    Array.prototype.slice.call(scope.querySelectorAll("[data-partner-id]")).forEach(function setPartnerText(element) {
      element.textContent = partnerId;
    });

    Array.prototype.slice.call(scope.querySelectorAll("[data-partner-link]")).forEach(function setPartnerLink(element) {
      var destination = element.dataset.partnerLink || getConfig("urls.defaultFundingLink", "./index.html");
      var link = buildPartnerLink(destination, partnerId);

      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        element.value = link;
      } else if (element.tagName === "A") {
        element.href = link;
        if (!element.textContent.trim()) element.textContent = link;
      } else {
        element.textContent = link;
      }
    });

    return partnerId;
  }

  function bindCopyButtons(root) {
    var scope = root || document;

    Array.prototype.slice.call(scope.querySelectorAll("[data-copy-partner-link]")).forEach(function bindButton(button) {
      if (button.dataset.copyBound === "true") return;

      button.dataset.copyBound = "true";

      button.addEventListener("click", function handleCopyClick() {
        var destination = button.dataset.copyPartnerLink || getConfig("urls.defaultFundingLink", "./index.html");
        var link = buildPartnerLink(destination, getPartnerId());

        if (ui && ui.copyText) {
          ui.copyText(link).then(function copied() {
            if (ui.toast) {
              ui.toast(copied ? "Partner link copied." : "Copy may not be available in this browser.", {
                tone: copied ? "success" : "warning"
              });
            }
          });
        }
      });
    });
  }

  function init() {
    captureFromUrl();
    applyAttributionToLinks();
    hydratePartnerFields();
    bindCopyButtons();
  }

  document.addEventListener("DOMContentLoaded", init);

  window.MoonshineOS.affiliateTracking = {
    captureFromUrl: captureFromUrl,
    getStoredAttribution: getStoredAttribution,
    clearAttribution: clearAttribution,
    getPartnerId: getPartnerId,
    getAttributionParams: getAttributionParams,
    buildPartnerLink: buildPartnerLink,
    applyAttributionToLinks: applyAttributionToLinks,
    hydratePartnerFields: hydratePartnerFields,
    bindCopyButtons: bindCopyButtons,
    init: init
  };
})(window, document);
