/*
  Moonshine Partner Command Center
  Batch 11 — Embed Loader

  Usage:
    <script
      src="https://your-domain.com/widgets/embed.js"
      data-moonshine-partner-id="MS-DEMO-0000"
      data-moonshine-source="partner-site"
      data-moonshine-theme="dark">
    </script>

  This creates an iframe pointing to funding-widget.html.
  Static demo only. No backend submission.
*/

(function initMoonshineWidgetEmbed(window, document) {
  "use strict";

  var currentScript = document.currentScript;

  function getScriptBase(script) {
    if (!script || !script.src) {
      return "./";
    }

    return script.src.replace(/embed\.js(?:\?.*)?$/, "");
  }

  function getAttr(script, name, fallback) {
    if (!script) return fallback;

    var value = script.getAttribute(name);
    return value == null || value === "" ? fallback : value;
  }

  function buildWidgetUrl(base, settings) {
    var url = new URL("funding-widget.html", base);

    Object.keys(settings).forEach(function setParam(key) {
      if (settings[key] != null && settings[key] !== "") {
        url.searchParams.set(key, settings[key]);
      }
    });

    return url.toString();
  }

  function createContainer(settings) {
    var container = document.createElement("div");
    container.className = "moonshine-widget-embed";
    container.setAttribute("data-moonshine-widget-container", "");

    if (settings.containerId) {
      container.id = settings.containerId;
    }

    container.style.width = "100%";
    container.style.maxWidth = settings.maxWidth || "560px";
    container.style.margin = settings.margin || "0 auto";

    return container;
  }

  function createIframe(src, settings) {
    var iframe = document.createElement("iframe");

    iframe.src = src;
    iframe.title = settings.title || "Moonshine Funding Readiness Widget";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("data-moonshine-widget-frame", "");
    iframe.setAttribute("scrolling", "no");

    iframe.style.width = "100%";
    iframe.style.minHeight = settings.height || "760px";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.overflow = "hidden";
    iframe.style.borderRadius = settings.radius || "24px";
    iframe.style.background = "transparent";

    return iframe;
  }

  function mount(container, script, targetSelector) {
    if (targetSelector) {
      var target = document.querySelector(targetSelector);
      if (target) {
        target.appendChild(container);
        return;
      }
    }

    if (script && script.parentNode) {
      script.parentNode.insertBefore(container, script.nextSibling);
      return;
    }

    document.body.appendChild(container);
  }

  function init(script) {
    script = script || currentScript;

    var base = getScriptBase(script);

    var settings = {
      partner_id: getAttr(script, "data-moonshine-partner-id", getAttr(script, "data-partner-id", "MS-WIDGET-DEMO")),
      source: getAttr(script, "data-moonshine-source", "embedded-widget"),
      theme: getAttr(script, "data-moonshine-theme", "dark"),
      title: getAttr(script, "data-moonshine-title", ""),
      subtitle: getAttr(script, "data-moonshine-subtitle", ""),
      brand: getAttr(script, "data-moonshine-brand", ""),
      cta: getAttr(script, "data-moonshine-cta", "")
    };

    var mountTarget = getAttr(script, "data-moonshine-target", "");
    var displaySettings = {
      containerId: getAttr(script, "data-moonshine-container-id", ""),
      maxWidth: getAttr(script, "data-moonshine-max-width", "560px"),
      margin: getAttr(script, "data-moonshine-margin", "0 auto"),
      height: getAttr(script, "data-moonshine-height", "760px"),
      radius: getAttr(script, "data-moonshine-radius", "24px"),
      title: settings.title || "Moonshine Funding Readiness Widget"
    };

    var widgetUrl = buildWidgetUrl(base, settings);
    var container = createContainer(displaySettings);
    var iframe = createIframe(widgetUrl, displaySettings);

    container.appendChild(iframe);
    mount(container, script, mountTarget);

    function handleMessage(event) {
      var data = event.data || {};

      if (!data || data.source !== "moonshine-funding-widget") {
        return;
      }

      if (data.type === "moonshine.widget.resized" && data.payload && data.payload.height) {
        iframe.style.minHeight = Math.max(420, Number(data.payload.height || 0)) + "px";
      }

      document.dispatchEvent(new CustomEvent(data.type || "moonshine.widget.message", {
        detail: {
          originalEvent: event,
          message: data,
          iframe: iframe,
          container: container
        }
      }));
    }

    window.addEventListener("message", handleMessage);

    return {
      iframe: iframe,
      container: container,
      url: widgetUrl,
      destroy: function destroy() {
        window.removeEventListener("message", handleMessage);
        container.remove();
      }
    };
  }

  window.MoonshineFundingWidget = window.MoonshineFundingWidget || {};
  window.MoonshineFundingWidget.mount = init;

  if (currentScript && currentScript.getAttribute("data-moonshine-manual") !== "true") {
    init(currentScript);
  }
})(window, document);
