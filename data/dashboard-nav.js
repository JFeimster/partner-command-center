/* Partner Command navigation — only implemented routes are rendered. */
(function initDashboardNav(window) {
  "use strict";
  window.MoonshineData = window.MoonshineData || {};
  window.MoonshineData.dashboardNav = [
    { id: "overview", group: "COMMAND", label: "Command", href: "#overview", icon: "grid", description: "Attention, activity, activation, and the next move." },
    { id: "leads", group: "PIPELINE", label: "Leads", href: "#leads", icon: "pipeline", description: "Submit and track partner-attributed funding leads." },
    { id: "growth", group: "GROWTH", label: "My Funding Page", href: "./growth.html", icon: "link", description: "Public funding page, referral URL, QR, lead form, widgets, assets, and campaigns." },
    { id: "links", group: "GROWTH", label: "Referral Links", href: "#links", icon: "link", description: "Create attribution-safe partner and campaign links." },
    { id: "resources", group: "BUILD", label: "Resources", href: "#resources", icon: "library", description: "Assigned scripts, education, and marketing assets." },
    { id: "widgets", group: "GROWTH", label: "Widgets", href: "#widgets", icon: "widgets", description: "Deploy approved partner-attributed widgets." },
    { id: "commissions", group: "EARN", label: "Commissions", href: "#commissions", icon: "wallet", description: "Estimated, verified, and paid production values." },
    { id: "settings", group: "ACCOUNT", label: "Settings", href: "#settings", icon: "settings", description: "Profile, workspace, compliance, and integration state." }
  ];
})(window);
