/*
  Moonshine Partner Command Center
  Batch 08 — Dashboard Seed Data

  Normalizes data from window.MoonshineData and provides fallbacks.
*/

(function initDashboardSeedData(window) {
  "use strict";

  window.MoonshineOS = window.MoonshineOS || {};
  window.MoonshineOS.dashboard = window.MoonshineOS.dashboard || {};

  var data = window.MoonshineData || {};
  var config = window.MoonshineOS.dashboard.config || {};

  function clone(value) {
    return JSON.parse(JSON.stringify(value == null ? null : value));
  }

  function fallbackEvents() {
    return [
      {
        id: "event_local_seed",
        type: "dashboard.seeded",
        label: "Dashboard seeded",
        actor: "Moonshine Demo",
        partnerId: "MS-DEMO-0000",
        target: "Local dashboard",
        message: "Loaded local demo dashboard seed data.",
        createdAt: new Date().toISOString(),
        tone: "success"
      }
    ];
  }

  var seed = {
    partnerProfile: clone(config.defaultPartnerProfile || {}),
    leads: clone(data.sampleLeads || []),
    partners: clone(data.samplePartners || []),
    marketplaceOffers: clone(data.marketplaceOffers || []),
    resources: clone(data.resources || []),
    trainingModules: clone(data.trainingModules || []),
    commissions: clone(data.sampleCommissions || { rows: [], summary: {} }),
    events: clone(data.sampleEvents || fallbackEvents()),
    complianceCopy: clone(data.complianceCopy || {}),
    dashboardNav: clone(data.dashboardNav || []),
    partnerPaths: clone(data.partnerPaths || [])
  };

  window.MoonshineOS.dashboard.seedData = seed;

  window.MoonshineOS.dashboard.getSeed = function getSeed(key, fallback) {
    if (!key) return clone(seed);
    return clone(Object.prototype.hasOwnProperty.call(seed, key) ? seed[key] : fallback);
  };
})(window);
