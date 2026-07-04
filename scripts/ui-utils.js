/*
  Moonshine Partner Command Center
  Batch 03 — UI Utilities

  DOM helpers, formatting, toasts, copy helpers, focus helpers.
*/

(function initMoonshineUIUtils(window, document) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};

  var getConfig = window.MoonshineOS.getConfig || function fallbackConfig(path, fallback) {
    if (path === "ui.toastDuration") return 3600;
    return fallback;
  };

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function on(target, eventName, selectorOrHandler, handler, options) {
    if (!target) return function noop() {};

    if (typeof selectorOrHandler === "function") {
      target.addEventListener(eventName, selectorOrHandler, options || false);
      return function off() {
        target.removeEventListener(eventName, selectorOrHandler, options || false);
      };
    }

    var selector = selectorOrHandler;

    function delegated(event) {
      var match = event.target.closest(selector);
      if (match && target.contains(match)) {
        handler.call(match, event, match);
      }
    }

    target.addEventListener(eventName, delegated, options || false);

    return function offDelegated() {
      target.removeEventListener(eventName, delegated, options || false);
    };
  }

  function create(tagName, attributes, children) {
    var element = document.createElement(tagName);
    var attrs = attributes || {};

    Object.keys(attrs).forEach(function setAttribute(key) {
      var value = attrs[key];

      if (value == null || value === false) return;

      if (key === "className") {
        element.className = value;
        return;
      }

      if (key === "dataset" && typeof value === "object") {
        Object.keys(value).forEach(function setData(dataKey) {
          element.dataset[dataKey] = value[dataKey];
        });
        return;
      }

      if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
        return;
      }

      if (key.indexOf("on") === 0 && typeof value === "function") {
        element.addEventListener(key.slice(2).toLowerCase(), value);
        return;
      }

      element.setAttribute(key, value === true ? "" : String(value));
    });

    if (children != null) {
      append(element, children);
    }

    return element;
  }

  function append(parent, children) {
    if (!Array.isArray(children)) {
      children = [children];
    }

    children.forEach(function appendChild(child) {
      if (child == null || child === false) return;

      if (child instanceof Node) {
        parent.appendChild(child);
      } else {
        parent.appendChild(document.createTextNode(String(child)));
      }
    });

    return parent;
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setText(selectorOrElement, value, root) {
    var element = typeof selectorOrElement === "string" ? qs(selectorOrElement, root) : selectorOrElement;

    if (element) {
      element.textContent = value == null ? "" : String(value);
    }

    return element;
  }

  function setHTML(selectorOrElement, value, root) {
    var element = typeof selectorOrElement === "string" ? qs(selectorOrElement, root) : selectorOrElement;

    if (element) {
      element.innerHTML = value == null ? "" : String(value);
    }

    return element;
  }

  function show(element) {
    if (element) {
      element.hidden = false;
      element.classList.remove("hidden");
    }
    return element;
  }

  function hide(element) {
    if (element) {
      element.hidden = true;
      element.classList.add("hidden");
    }
    return element;
  }

  function toggle(element, force) {
    if (!element) return element;

    var shouldShow = typeof force === "boolean" ? force : element.hidden || element.classList.contains("hidden");

    if (shouldShow) {
      show(element);
    } else {
      hide(element);
    }

    return element;
  }

  function formatCurrency(value, options) {
    var settings = Object.assign({
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }, options || {});

    var number = Number(value);

    if (!Number.isFinite(number)) {
      number = 0;
    }

    return new Intl.NumberFormat("en-US", settings).format(number);
  }

  function formatNumber(value, options) {
    var number = Number(value);

    if (!Number.isFinite(number)) {
      number = 0;
    }

    return new Intl.NumberFormat("en-US", options || {}).format(number);
  }

  function formatPercent(value, options) {
    var number = Number(value);

    if (!Number.isFinite(number)) {
      number = 0;
    }

    return new Intl.NumberFormat("en-US", Object.assign({
      style: "percent",
      maximumFractionDigits: 1
    }, options || {})).format(number);
  }

  function formatDate(value, options) {
    if (!value) return "";

    var date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-US", Object.assign({
      month: "short",
      day: "numeric",
      year: "numeric"
    }, options || {})).format(date);
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getInitials(value, fallback) {
    var words = String(value || fallback || "MS")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return words
      .slice(0, 2)
      .map(function getFirst(word) {
        return word.charAt(0).toUpperCase();
      })
      .join("") || "MS";
  }

  function copyText(text) {
    var value = String(text || "");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value).then(function copied() {
        return true;
      });
    }

    var textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-999px";
    document.body.appendChild(textarea);
    textarea.select();

    var ok = false;

    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }

    textarea.remove();
    return Promise.resolve(ok);
  }

  function ensureToastRegion() {
    var region = qs("[data-toast-region]");

    if (region) return region;

    region = create("div", {
      className: "mpc-toast-region",
      "data-toast-region": "",
      "aria-live": "polite",
      "aria-relevant": "additions"
    });

    document.body.appendChild(region);
    return region;
  }

  function toast(message, options) {
    var settings = Object.assign({
      tone: "default",
      duration: getConfig("ui.toastDuration", 3600)
    }, options || {});

    var region = ensureToastRegion();
    var toastElement = create("div", {
      className: "mpc-toast",
      role: settings.tone === "danger" ? "alert" : "status"
    });

    if (settings.tone && settings.tone !== "default") {
      toastElement.classList.add("mpc-toast-" + settings.tone);
    }

    append(toastElement, message);
    region.appendChild(toastElement);

    window.setTimeout(function removeToast() {
      toastElement.remove();
    }, settings.duration);

    return toastElement;
  }

  function debounce(callback, wait) {
    var timeoutId;

    return function debounced() {
      var context = this;
      var args = arguments;

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(function invoke() {
        callback.apply(context, args);
      }, wait || 200);
    };
  }

  function throttle(callback, wait) {
    var isWaiting = false;
    var lastArgs;
    var lastContext;

    return function throttled() {
      if (isWaiting) {
        lastArgs = arguments;
        lastContext = this;
        return;
      }

      callback.apply(this, arguments);
      isWaiting = true;

      window.setTimeout(function release() {
        isWaiting = false;
        if (lastArgs) {
          callback.apply(lastContext, lastArgs);
          lastArgs = null;
          lastContext = null;
        }
      }, wait || 200);
    };
  }

  function setBusy(element, isBusy, label) {
    if (!element) return element;

    element.classList.toggle("is-busy", Boolean(isBusy));
    element.setAttribute("aria-busy", isBusy ? "true" : "false");

    if (label) {
      if (isBusy) {
        element.dataset.originalText = element.textContent;
        element.textContent = label;
      } else if (element.dataset.originalText) {
        element.textContent = element.dataset.originalText;
        delete element.dataset.originalText;
      }
    }

    return element;
  }

  function lockBody(force) {
    var shouldLock = typeof force === "boolean" ? force : document.body.style.overflow !== "hidden";
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return shouldLock;
  }

  function focusFirst(root) {
    var scope = root || document;
    var focusable = qs('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', scope);

    if (focusable) {
      focusable.focus();
    }

    return focusable;
  }

  function parseJSONScript(selector, fallback) {
    var script = qs(selector);
    if (!script) return fallback;

    try {
      return JSON.parse(script.textContent);
    } catch (error) {
      return fallback;
    }
  }

  window.MoonshineOS.ui = {
    qs: qs,
    qsa: qsa,
    on: on,
    create: create,
    append: append,
    escapeHTML: escapeHTML,
    setText: setText,
    setHTML: setHTML,
    show: show,
    hide: hide,
    toggle: toggle,
    formatCurrency: formatCurrency,
    formatNumber: formatNumber,
    formatPercent: formatPercent,
    formatDate: formatDate,
    slugify: slugify,
    getInitials: getInitials,
    copyText: copyText,
    toast: toast,
    debounce: debounce,
    throttle: throttle,
    setBusy: setBusy,
    lockBody: lockBody,
    focusFirst: focusFirst,
    parseJSONScript: parseJSONScript
  };
})(window, document);
