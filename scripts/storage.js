/*
  Moonshine Partner Command Center
  Batch 03 — Storage Helpers

  Partner workspace persistence only. Do not store sensitive borrower data.
*/

(function initMoonshineStorage(window) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  var getConfig = window.MoonshineOS.getConfig || function fallbackConfig(path, fallback) {
    if (path === "localStorage.namespace") return "moonshine.partnerOS.";
    return fallback;
  };

  var namespace = getConfig("localStorage.namespace", "moonshine.partnerOS.");

  function isAvailable() {
    try {
      var testKey = namespace + "__test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function normalizeKey(key) {
    var cleanKey = String(key || "").trim();

    if (!cleanKey) {
      throw new Error("Moonshine storage key is required.");
    }

    return cleanKey.indexOf(namespace) === 0 ? cleanKey : namespace + cleanKey;
  }

  function safeParse(value, fallback) {
    if (value == null || value === "") return fallback;

    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function get(key, fallback) {
    if (!isAvailable()) return fallback;

    var stored = window.localStorage.getItem(normalizeKey(key));
    return safeParse(stored, fallback);
  }

  function set(key, value) {
    if (!isAvailable()) return false;

    window.localStorage.setItem(normalizeKey(key), JSON.stringify(value));
    return true;
  }

  function getRaw(key, fallback) {
    if (!isAvailable()) return fallback;

    var stored = window.localStorage.getItem(normalizeKey(key));
    return stored == null ? fallback : stored;
  }

  function setRaw(key, value) {
    if (!isAvailable()) return false;

    window.localStorage.setItem(normalizeKey(key), String(value));
    return true;
  }

  function remove(key) {
    if (!isAvailable()) return false;

    window.localStorage.removeItem(normalizeKey(key));
    return true;
  }

  function has(key) {
    if (!isAvailable()) return false;

    return window.localStorage.getItem(normalizeKey(key)) != null;
  }

  function keys() {
    if (!isAvailable()) return [];

    var found = [];

    for (var i = 0; i < window.localStorage.length; i += 1) {
      var key = window.localStorage.key(i);
      if (key && key.indexOf(namespace) === 0) {
        found.push(key.replace(namespace, ""));
      }
    }

    return found.sort();
  }

  function entries() {
    var state = {};

    keys().forEach(function addEntry(key) {
      state[key] = get(key, null);
    });

    return state;
  }

  function clearNamespace() {
    if (!isAvailable()) return false;

    keys().forEach(function removeKey(key) {
      remove(key);
    });

    return true;
  }

  function exportState() {
    return {
      app: "Moonshine Partner Command Center",
      type: "local-demo-export",
      exportedAt: new Date().toISOString(),
      namespace: namespace,
      data: entries(),
      disclaimer: "Partner workspace export only. This file is not a live CRM, underwriting record, application record, or commission report."
    };
  }

  function downloadState(filename) {
    var state = exportState();
    var blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json"
    });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename || "moonshine-partner-command-center-demo-export.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    return state;
  }

  function importState(payload, options) {
    var settings = options || {};
    var parsed = typeof payload === "string" ? safeParse(payload, null) : payload;

    if (!parsed || typeof parsed !== "object") {
      return {
        ok: false,
        error: "Import payload must be a JSON object."
      };
    }

    var data = parsed.data && typeof parsed.data === "object" ? parsed.data : parsed;

    if (settings.clearFirst) {
      clearNamespace();
    }

    Object.keys(data).forEach(function importKey(key) {
      set(key, data[key]);
    });

    return {
      ok: true,
      importedKeys: Object.keys(data)
    };
  }

  function pushToArray(key, item, limit) {
    var list = get(key, []);

    if (!Array.isArray(list)) {
      list = [];
    }

    list.push(item);

    if (limit && list.length > limit) {
      list = list.slice(list.length - limit);
    }

    set(key, list);
    return list;
  }

  function upsertById(key, item, idField) {
    var field = idField || "id";
    var list = get(key, []);

    if (!Array.isArray(list)) {
      list = [];
    }

    var itemId = item && item[field];

    if (!itemId) {
      throw new Error("Cannot upsert item without an id field.");
    }

    var index = list.findIndex(function findExisting(entry) {
      return entry && entry[field] === itemId;
    });

    if (index >= 0) {
      list[index] = Object.assign({}, list[index], item);
    } else {
      list.push(item);
    }

    set(key, list);
    return list;
  }

  window.MoonshineOS.storage = {
    namespace: namespace,
    isAvailable: isAvailable,
    normalizeKey: normalizeKey,
    safeParse: safeParse,
    get: get,
    set: set,
    getRaw: getRaw,
    setRaw: setRaw,
    remove: remove,
    has: has,
    keys: keys,
    entries: entries,
    clearNamespace: clearNamespace,
    exportState: exportState,
    downloadState: downloadState,
    importState: importState,
    pushToArray: pushToArray,
    upsertById: upsertById
  };
})(window);

