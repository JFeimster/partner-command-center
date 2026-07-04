/*
  Moonshine Partner Command Center
  Batch 03 — Analytics Lite

  Local browser analytics only. No external tracking provider.
*/

(function initMoonshineAnalyticsLite(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  var getConfig = window.MoonshineOS.getConfig || function fallbackConfig(path, fallback) {
    if (path === "analytics.enabled") return true;
    if (path === "analytics.maxEvents") return 250;
    if (path === "analytics.storageKey") return "analytics";
    if (path === "analytics.autoTrackPageViews") return true;
    return fallback;
  };

  var storage = window.MoonshineOS.storage;
  var attribution = window.MoonshineOS.affiliateTracking;

  function enabled() {
    return Boolean(getConfig("analytics.enabled", true)) && Boolean(storage);
  }

  function storageKey() {
    return getConfig("analytics.storageKey", "analytics");
  }

  function readEvents() {
    if (!enabled()) return [];

    var events = storage.get(storageKey(), []);
    return Array.isArray(events) ? events : [];
  }

  function writeEvents(events) {
    if (!enabled()) return false;

    var maxEvents = getConfig("analytics.maxEvents", 250);
    var list = Array.isArray(events) ? events : [];

    if (list.length > maxEvents) {
      list = list.slice(list.length - maxEvents);
    }

    storage.set(storageKey(), list);
    return true;
  }

  function makeEvent(name, properties) {
    var event = {
      id: "evt_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
      name: name,
      properties: properties || {},
      path: window.location.pathname,
      title: document.title,
      timestamp: new Date().toISOString(),
      environment: getConfig("environment", "static-demo")
    };

    if (attribution && attribution.getPartnerId) {
      event.partnerId = attribution.getPartnerId();
    }

    return event;
  }

  function track(name, properties) {
    if (!enabled() || !name) {
      return null;
    }

    var event = makeEvent(name, properties);
    var events = readEvents();

    events.push(event);
    writeEvents(events);

    document.dispatchEvent(new CustomEvent("moonshine:analytics", {
      detail: event
    }));

    return event;
  }

  function pageView(properties) {
    return track("page_view", Object.assign({
      href: window.location.href,
      referrer: document.referrer || ""
    }, properties || {}));
  }

  function trackClick(eventName, element, properties) {
    if (!element) return null;

    return track(eventName || "click", Object.assign({
      text: (element.textContent || "").trim().slice(0, 160),
      href: element.getAttribute ? element.getAttribute("href") : "",
      id: element.id || "",
      classes: element.className || ""
    }, properties || {}));
  }

  function bindClickTracking(root) {
    var scope = root || document;

    Array.prototype.slice.call(scope.querySelectorAll("[data-track]")).forEach(function bindElement(element) {
      if (element.dataset.trackBound === "true") return;

      element.dataset.trackBound = "true";

      element.addEventListener("click", function handleTrackedClick() {
        trackClick(element.dataset.track || "tracked_click", element, {
          trackLabel: element.dataset.trackLabel || "",
          trackGroup: element.dataset.trackGroup || ""
        });
      });
    });
  }

  function summary() {
    var events = readEvents();
    var counts = {};

    events.forEach(function countEvent(event) {
      counts[event.name] = (counts[event.name] || 0) + 1;
    });

    return {
      total: events.length,
      counts: counts,
      firstEventAt: events[0] ? events[0].timestamp : null,
      latestEventAt: events[events.length - 1] ? events[events.length - 1].timestamp : null
    };
  }

  function clear() {
    return writeEvents([]);
  }

  function exportEvents() {
    return {
      app: "Moonshine Partner Command Center",
      type: "local-analytics-export",
      exportedAt: new Date().toISOString(),
      events: readEvents(),
      disclaimer: "Local browser analytics only. This is not a server analytics export."
    };
  }

  function downloadEvents(filename) {
    var data = exportEvents();
    var blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename || "moonshine-partner-command-center-local-analytics.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    return data;
  }

  function init() {
    bindClickTracking();

    if (getConfig("analytics.autoTrackPageViews", true)) {
      pageView();
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  window.MoonshineOS.analytics = {
    enabled: enabled,
    readEvents: readEvents,
    writeEvents: writeEvents,
    track: track,
    pageView: pageView,
    trackClick: trackClick,
    bindClickTracking: bindClickTracking,
    summary: summary,
    clear: clear,
    exportEvents: exportEvents,
    downloadEvents: downloadEvents,
    init: init
  };
})(window, document);
