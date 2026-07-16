/* Initialize Partner Command Center demo/live dashboard modes. */
(function initDashboardDataMode(window, document) {
  "use strict";

  function bindLiveLeadRoute(adapter) {
    var form = document.querySelector("[data-lead-form]");
    if (!form || form.dataset.dataModeBound === "true") return;
    form.dataset.dataModeBound = "true";
    form.addEventListener("submit", function (event) {
      if (adapter.getMode() !== "live") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var formData = new FormData(form);
      adapter.openReadiness({ businessName: formData.get("businessName") || "" });
    }, true);
  }

  async function start() {
    var dashboard = window.MoonshineOS && window.MoonshineOS.dashboard;
    var adapter = dashboard && dashboard.dataAdapter;
    if (!adapter) return;

    adapter.bindModeControl();
    bindLiveLeadRoute(adapter);
    await adapter.initialize();

    if (dashboard.controller && dashboard.controller.renderAll) dashboard.controller.renderAll();
    else if (dashboard.renderers && dashboard.renderers.renderAll) {
      var state = dashboard.state && dashboard.state.getState ? dashboard.state.getState() : {};
      dashboard.renderers.renderAll(document, state);
    }

    adapter.decorateLiveMode();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { window.setTimeout(start, 0); });
  else window.setTimeout(start, 0);
})(window, document);
