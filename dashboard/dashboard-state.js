/*
  Moonshine Partner Command Center
  Batch 08 — Dashboard State

  Lightweight observable state for static dashboard rendering.
*/

(function initDashboardState(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var dashboard = window.MoonshineOS.dashboard;
  var storage = window.MoonshineOS.storage;
  var config = dashboard.config || {};
  var seed = dashboard.seedData || {};
  var subscribers = [];
  var state = {};

  function clone(value) {
    return JSON.parse(JSON.stringify(value == null ? null : value));
  }

  function now() {
    return new Date().toISOString();
  }

  function readStored(key, fallback) {
    return storage && storage.get ? storage.get(key, fallback) : fallback;
  }

  function writeStored(key, value) {
    if (storage && storage.set) {
      storage.set(key, value);
    }
  }

  function defaultState() {
    return {
      hydratedAt: now(),
      activeSection: config.defaultSection || "overview",
      partnerProfile: readStored(config.storageKeys && config.storageKeys.partnerProfile || "partnerProfile", seed.partnerProfile || config.defaultPartnerProfile || {}),
      leads: readStored(config.storageKeys && config.storageKeys.leads || "leads", seed.leads || []),
      marketplaceFavorites: readStored(config.storageKeys && config.storageKeys.marketplaceFavorites || "marketplaceFavorites", []),
      resourceFavorites: readStored(config.storageKeys && config.storageKeys.resourceFavorites || "resourceFavorites", []),
      trainingProgress: readStored(config.storageKeys && config.storageKeys.trainingProgress || "trainingProgress", {}),
      notes: readStored(config.storageKeys && config.storageKeys.notes || "notes", []),
      events: readStored(config.storageKeys && config.storageKeys.events || "events", seed.events || []),
      attribution: readStored(config.storageKeys && config.storageKeys.affiliateAttribution || "affiliateAttribution", {}),
      theme: readStored(config.storageKeys && config.storageKeys.theme || "theme", "dark"),
      settings: readStored(config.storageKeys && config.storageKeys.settings || "settings", {
        compactMode: false,
        showSeedData: true
      })
    };
  }

  function getState(path, fallback) {
    if (!path) return clone(state);

    var parts = String(path).split(".");
    var cursor = state;

    for (var i = 0; i < parts.length; i += 1) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) {
        return fallback;
      }
      cursor = cursor[parts[i]];
    }

    return clone(cursor);
  }

  function notify(change) {
    var snapshot = getState();

    subscribers.forEach(function notifySubscriber(callback) {
      callback(snapshot, change || {});
    });

    document.dispatchEvent(new CustomEvent("moonshine:dashboard-state", {
      detail: {
        state: snapshot,
        change: change || {}
      }
    }));
  }

  function setState(patch, meta) {
    var next = typeof patch === "function" ? patch(clone(state)) : patch;

    if (!next || typeof next !== "object") {
      return getState();
    }

    state = Object.assign({}, state, next, {
      updatedAt: now()
    });

    var keys = config.storageKeys || {};

    if (Object.prototype.hasOwnProperty.call(next, "partnerProfile")) writeStored(keys.partnerProfile || "partnerProfile", state.partnerProfile);
    if (Object.prototype.hasOwnProperty.call(next, "leads")) writeStored(keys.leads || "leads", state.leads);
    if (Object.prototype.hasOwnProperty.call(next, "marketplaceFavorites")) writeStored(keys.marketplaceFavorites || "marketplaceFavorites", state.marketplaceFavorites);
    if (Object.prototype.hasOwnProperty.call(next, "resourceFavorites")) writeStored(keys.resourceFavorites || "resourceFavorites", state.resourceFavorites);
    if (Object.prototype.hasOwnProperty.call(next, "trainingProgress")) writeStored(keys.trainingProgress || "trainingProgress", state.trainingProgress);
    if (Object.prototype.hasOwnProperty.call(next, "notes")) writeStored(keys.notes || "notes", state.notes);
    if (Object.prototype.hasOwnProperty.call(next, "events")) writeStored(keys.events || "events", state.events);
    if (Object.prototype.hasOwnProperty.call(next, "theme")) writeStored(keys.theme || "theme", state.theme);
    if (Object.prototype.hasOwnProperty.call(next, "settings")) writeStored(keys.settings || "settings", state.settings);

    notify(Object.assign({
      type: "setState",
      keys: Object.keys(next)
    }, meta || {}));

    return getState();
  }

  function subscribe(callback) {
    if (typeof callback !== "function") return function noop() {};

    subscribers.push(callback);

    return function unsubscribe() {
      subscribers = subscribers.filter(function filterSubscriber(item) {
        return item !== callback;
      });
    };
  }

  function hydrate() {
    state = defaultState();

    if (state.theme) {
      document.documentElement.setAttribute("data-theme", state.theme);
    }

    notify({
      type: "hydrate"
    });

    return getState();
  }

  function reset(options) {
    var settings = options || {};
    var keys = config.storageKeys || {};

    if (storage && settings.clearStorage !== false) {
      [
        keys.partnerProfile || "partnerProfile",
        keys.leads || "leads",
        keys.marketplaceFavorites || "marketplaceFavorites",
        keys.resourceFavorites || "resourceFavorites",
        keys.trainingProgress || "trainingProgress",
        keys.notes || "notes",
        keys.events || "events",
        keys.theme || "theme",
        keys.settings || "settings"
      ].forEach(function removeKey(key) {
        storage.remove(key);
      });
    }

    state = defaultState();
    notify({
      type: "reset"
    });

    return getState();
  }

  function exportState() {
    return {
      app: "Moonshine Partner Command Center",
      type: "dashboard-local-demo-export",
      exportedAt: now(),
      state: getState(),
      disclaimer: "Local demo export only. This is not a CRM export, funding application, underwriting record, or commission report."
    };
  }

  function importState(payload) {
    var parsed = typeof payload === "string" && storage && storage.safeParse
      ? storage.safeParse(payload, null)
      : payload;

    if (!parsed || typeof parsed !== "object") {
      return {
        ok: false,
        error: "Invalid dashboard import payload."
      };
    }

    var imported = parsed.state || parsed.data || parsed;

    setState(imported, {
      type: "import"
    });

    return {
      ok: true,
      keys: Object.keys(imported)
    };
  }

  dashboard.state = {
    hydrate: hydrate,
    getState: getState,
    setState: setState,
    subscribe: subscribe,
    reset: reset,
    exportState: exportState,
    importState: importState
  };
})(window, document);
