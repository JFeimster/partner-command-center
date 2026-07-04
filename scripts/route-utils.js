/*
  Moonshine Partner Command Center
  Batch 03 — Route Utilities

  Query parsing, URL building, current nav state, safe redirects.
*/

(function initMoonshineRouteUtils(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  function getSearchParams(search) {
    return new URLSearchParams(search == null ? window.location.search : search);
  }

  function getQueryObject(search) {
    var params = getSearchParams(search);
    var object = {};

    params.forEach(function assignParam(value, key) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        if (!Array.isArray(object[key])) {
          object[key] = [object[key]];
        }
        object[key].push(value);
      } else {
        object[key] = value;
      }
    });

    return object;
  }

  function getQueryParam(name, fallback) {
    var value = getSearchParams().get(name);
    return value == null || value === "" ? fallback : value;
  }

  function buildUrl(path, params) {
    var base = path || window.location.pathname;
    var hash = "";
    var hashIndex = base.indexOf("#");

    if (hashIndex >= 0) {
      hash = base.slice(hashIndex);
      base = base.slice(0, hashIndex);
    }

    var queryIndex = base.indexOf("?");
    var existingQuery = queryIndex >= 0 ? base.slice(queryIndex + 1) : "";
    var cleanPath = queryIndex >= 0 ? base.slice(0, queryIndex) : base;
    var searchParams = new URLSearchParams(existingQuery);

    Object.keys(params || {}).forEach(function setParam(key) {
      var value = params[key];

      if (value == null || value === "") {
        searchParams.delete(key);
        return;
      }

      if (Array.isArray(value)) {
        searchParams.delete(key);
        value.forEach(function appendValue(item) {
          searchParams.append(key, item);
        });
        return;
      }

      searchParams.set(key, value);
    });

    var query = searchParams.toString();
    return cleanPath + (query ? "?" + query : "") + hash;
  }

  function currentPath() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    return path;
  }

  function normalizeHref(href) {
    if (!href) return "";

    try {
      var url = new URL(href, window.location.href);
      return url.pathname.split("/").pop() || "index.html";
    } catch (error) {
      return href.split("?")[0].split("#")[0].split("/").pop() || "index.html";
    }
  }

  function markCurrentNav(selector, options) {
    var settings = Object.assign({
      currentClass: "is-active",
      currentAttribute: "aria-current",
      currentAttributeValue: "page"
    }, options || {});

    var current = currentPath();
    var links = Array.prototype.slice.call(document.querySelectorAll(selector || "nav a[href]"));

    links.forEach(function markLink(link) {
      var hrefPath = normalizeHref(link.getAttribute("href"));
      var isCurrent = hrefPath === current;

      link.classList.toggle(settings.currentClass, isCurrent);

      if (isCurrent) {
        link.setAttribute(settings.currentAttribute, settings.currentAttributeValue);
      } else {
        link.removeAttribute(settings.currentAttribute);
      }
    });

    return links;
  }

  function redirectTo(path, params) {
    window.location.href = buildUrl(path, params || {});
  }

  function replaceTo(path, params) {
    window.location.replace(buildUrl(path, params || {}));
  }

  function updateQuery(params, options) {
    var settings = Object.assign({
      replace: true
    }, options || {});

    var url = buildUrl(window.location.pathname + window.location.search + window.location.hash, params);

    if (settings.replace) {
      window.history.replaceState({}, "", url);
    } else {
      window.history.pushState({}, "", url);
    }

    return url;
  }

  function preserveAttribution(path) {
    var attribution = window.MoonshineOS.affiliateTracking;
    var params = attribution && attribution.getAttributionParams ? attribution.getAttributionParams() : {};
    return buildUrl(path, params);
  }

  function isExternalUrl(url) {
    if (!url) return false;

    try {
      var parsed = new URL(url, window.location.href);
      return parsed.origin !== window.location.origin;
    } catch (error) {
      return false;
    }
  }

  function safeBack(fallback) {
    if (document.referrer && !isExternalUrl(document.referrer)) {
      window.history.back();
      return;
    }

    redirectTo(fallback || "./index.html");
  }

  document.addEventListener("DOMContentLoaded", function initRouteHelpers() {
    markCurrentNav("[data-nav] a[href], .public-nav a[href], .dashboard-nav a[href]");
  });

  window.MoonshineOS.routes = {
    getSearchParams: getSearchParams,
    getQueryObject: getQueryObject,
    getQueryParam: getQueryParam,
    buildUrl: buildUrl,
    currentPath: currentPath,
    normalizeHref: normalizeHref,
    markCurrentNav: markCurrentNav,
    redirectTo: redirectTo,
    replaceTo: replaceTo,
    updateQuery: updateQuery,
    preserveAttribution: preserveAttribution,
    isExternalUrl: isExternalUrl,
    safeBack: safeBack
  };
})(window, document);
