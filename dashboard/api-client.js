/* Client-safe Partner Command Center dashboard API client. */
(function initDashboardApiClient(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var dashboard = window.MoonshineOS.dashboard;
  var configPromise = null;
  var defaults = {
    PARTNER_COMMAND_CENTER_URL: window.location.origin + "/",
    AM_I_FUNDABLE_URL: "https://am-i-fundable.vercel.app/",
    EMBED_WIDGETS_URL: "https://embed-widgets-kappa.vercel.app/",
    FUNDSTACK_AI_URL: "https://fund-stack-ai.vercel.app/",
    PARTNER_SIGNUP_URL: "/partner-access",
    LEAD_SUBMISSION_URL: "https://am-i-fundable.vercel.app/",
    DASHBOARD_BOOTSTRAP_PATH: "/api/dashboard/bootstrap"
  };

  function loadConfig() {
    if (!configPromise) {
      configPromise = window.fetch("./data/app-config.json", { cache: "no-store" })
        .then(function (response) { return response.ok ? response.json() : {}; })
        .catch(function () { return {}; })
        .then(function (remote) { return Object.assign({}, defaults, remote || {}); });
    }
    return configPromise;
  }

  function buildUrl(base, params) {
    var url = new URL(base, window.location.origin);
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
    return url.toString();
  }

  function request(path, options) {
    return window.fetch(path, Object.assign({ credentials: "include", headers: { Accept: "application/json" } }, options || {}))
      .then(function (response) {
        return response.json().catch(function () { return null; }).then(function (body) {
          if (!response.ok || !body || body.ok === false) {
            var error = new Error(body && body.error && body.error.message || "Dashboard request failed.");
            error.code = body && body.error && body.error.code || "dashboard_request_failed";
            error.status = response.status;
            throw error;
          }
          return body;
        });
      });
  }

  function getDashboardPayload(token, limit) {
    return loadConfig().then(function (config) {
      var path = config.DASHBOARD_BOOTSTRAP_PATH || defaults.DASHBOARD_BOOTSTRAP_PATH;
      var url = buildUrl(path, { limit: limit || 25 });
      var headers = { Accept: "application/json" };
      if (token) headers.Authorization = "Bearer " + token;
      return request(url, { method: "GET", headers: headers });
    });
  }

  function applyPublicLinks() {
    return loadConfig().then(function (config) {
      Array.prototype.slice.call(document.querySelectorAll("[data-app-link]")).forEach(function (link) {
        var key = link.getAttribute("data-app-link");
        if (config[key]) link.href = config[key];
      });
      return config;
    });
  }

  dashboard.apiClient = {
    loadConfig: loadConfig,
    getDashboardPayload: getDashboardPayload,
    buildUrl: buildUrl,
    applyPublicLinks: applyPublicLinks,
    getUrl: function (key, params) { return loadConfig().then(function (config) { return buildUrl(config[key] || defaults[key] || "#", params); }); }
  };
})(window, document);
