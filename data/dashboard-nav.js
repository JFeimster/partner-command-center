/* Canonical seven-module Partner Command Center navigation. */
(function initDashboardNav(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};
  window.MoonshineData.dashboardNav = [
    { id: "overview", label: "Overview", href: "#overview", icon: "grid", description: "Partner status, metrics, onboarding, alerts, and activity." },
    { id: "leads", label: "Leads", href: "#leads", icon: "pipeline", description: "Submit and track partner-attributed funding leads." },
    { id: "links", label: "Tracking Links", href: "#links", icon: "link", description: "Create and copy attribution-safe campaign links." },
    { id: "resources", label: "Resources", href: "#resources", icon: "library", description: "Access assigned marketing and education assets." },
    { id: "widgets", label: "Widgets", href: "#widgets", icon: "widgets", description: "Deploy approved partner-attributed widget presets." },
    { id: "commissions", label: "Commissions", href: "#commissions", icon: "wallet", description: "Review estimated, verified, and paid values." },
    { id: "settings", label: "Settings", href: "#settings", icon: "settings", description: "Manage profile, workspace, and integration status." }
  ];
})(window);
