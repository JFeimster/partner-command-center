/*
  Moonshine Partner Command Center
  Batch 11 — Funding Widget Logic

  Static localStorage demo. Emits postMessage events for parent pages.
*/

(function initFundingWidget(window, document) {
  "use strict";

  var widget = window.MoonshineWidget || {};
  var config = widget.config || {};
  var defaults = config.defaults || {};
  var disclaimers = config.disclaimers || {};

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getParams() {
    var params = new URLSearchParams(window.location.search);
    var data = {};

    params.forEach(function eachParam(value, key) {
      data[key] = value;
    });

    return data;
  }

  function getSetting(params, key, fallback) {
    return params[key] || params[key.replace(/[A-Z]/g, function hyphen(match) {
      return "-" + match.toLowerCase();
    })] || fallback;
  }

  function storageKey() {
    return config.storageKey || "moonshine.widget.demoLeads";
  }

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function getSavedInquiries() {
    var saved = safeParse(window.localStorage.getItem(storageKey()), []);
    return Array.isArray(saved) ? saved : [];
  }

  function saveInquiry(inquiry) {
    var list = getSavedInquiries();
    list.unshift(inquiry);

    if (list.length > 50) {
      list = list.slice(0, 50);
    }

    window.localStorage.setItem(storageKey(), JSON.stringify(list));
    return list;
  }

  function post(type, payload) {
    var eventName = type;

    if (config.postMessageEvents && config.postMessageEvents[type]) {
      eventName = config.postMessageEvents[type];
    }

    var message = {
      source: "moonshine-funding-widget",
      type: eventName,
      payload: payload || {},
      timestamp: new Date().toISOString()
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, "*");
    }

    document.dispatchEvent(new CustomEvent(eventName, {
      detail: message
    }));

    return message;
  }

  function resize() {
    var height = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0
    );

    post("resized", {
      height: height
    });
  }

  function serialize(form) {
    var data = {};

    qsa("input, select, textarea", form).forEach(function eachField(field) {
      if (!field.name || field.disabled) return;

      if (field.type === "checkbox") {
        data[field.name] = field.checked;
      } else {
        data[field.name] = field.value.trim();
      }
    });

    return data;
  }

  function validate(form) {
    var errors = [];

    qsa("[required]", form).forEach(function eachRequired(field) {
      var empty = field.type === "checkbox" ? !field.checked : !field.value.trim();

      if (empty) {
        errors.push(field.name || "field");
        field.setAttribute("aria-invalid", "true");
      } else {
        field.removeAttribute("aria-invalid");
      }
    });

    return errors;
  }

  function setStatus(message, tone) {
    var status = qs("[data-widget-status]");
    if (!status) return;

    status.textContent = message || "";
    status.classList.remove("is-success", "is-error");

    if (tone) {
      status.classList.add("is-" + tone);
    }

    resize();
  }

  function hydrateText(params) {
    var partnerId = getSetting(params, "partnerId", getSetting(params, "partner_id", defaults.partnerId || "MS-WIDGET-DEMO"));
    var theme = getSetting(params, "theme", defaults.theme || "dark");
    var title = getSetting(params, "title", defaults.title || "Check funding readiness");
    var subtitle = getSetting(params, "subtitle", defaults.subtitle || "");
    var brand = getSetting(params, "brand", defaults.brandName || config.brandName || "Moonshine Capital");
    var cta = getSetting(params, "cta", defaults.ctaLabel || "Save Demo Inquiry");

    document.documentElement.setAttribute("data-theme", theme);

    var brandNode = qs("[data-widget-brand]");
    var partnerNode = qs("[data-widget-partner-id]");
    var titleNode = qs("[data-widget-title]");
    var subtitleNode = qs("[data-widget-subtitle]");
    var disclaimerNode = qs("[data-widget-disclaimer]");
    var submit = qs("[data-widget-submit]");

    if (brandNode) brandNode.textContent = brand;
    if (partnerNode) partnerNode.textContent = partnerId;
    if (titleNode) titleNode.textContent = title;
    if (subtitleNode) subtitleNode.textContent = subtitle;
    if (submit) submit.textContent = cta;
    if (disclaimerNode) disclaimerNode.textContent = (disclaimers.noGuarantee || "") + " " + (disclaimers.staticDemo || "");

    return {
      partnerId: partnerId,
      theme: theme,
      title: title,
      subtitle: subtitle,
      brand: brand,
      cta: cta,
      source: getSetting(params, "source", defaults.source || "embedded-widget")
    };
  }

  function makeInquiry(data, settings, params) {
    return {
      id: "widget_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
      partnerId: settings.partnerId,
      source: settings.source,
      businessName: data.businessName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      monthlyRevenue: data.monthlyRevenue,
      fundingNeed: data.fundingNeed,
      timeline: data.timeline,
      useOfFunds: data.useOfFunds,
      consent: Boolean(data.consent),
      createdAt: new Date().toISOString(),
      urlParams: params,
      localDemo: true,
      disclaimer:
        "Static widget demo only. Not a live application, underwriting record, CRM record, lender submission, or commission event."
    };
  }

  function clearForm(form) {
    form.reset();
    qsa("[aria-invalid='true']", form).forEach(function clearInvalid(field) {
      field.removeAttribute("aria-invalid");
    });
  }

  function init() {
    var params = getParams();
    var settings = hydrateText(params);
    var form = qs("[data-widget-form]");

    post("ready", {
      partnerId: settings.partnerId,
      source: settings.source
    });

    resize();

    if (!form) return;

    form.addEventListener("submit", function handleSubmit(event) {
      event.preventDefault();

      var errors = validate(form);

      if (errors.length) {
        setStatus("Please complete the required fields and consent checkbox.", "error");
        post("error", {
          errors: errors
        });
        return;
      }

      var data = serialize(form);
      var inquiry = makeInquiry(data, settings, params);

      saveInquiry(inquiry);
      clearForm(form);

      setStatus(defaults.successMessage || "Demo inquiry saved locally.", "success");

      post("submitted", {
        inquiry: inquiry,
        savedCount: getSavedInquiries().length
      });
    });

    window.addEventListener("resize", resize);
    window.setTimeout(resize, 100);
    window.setTimeout(resize, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
