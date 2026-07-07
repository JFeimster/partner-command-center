/*
  Moonshine Partner Command Center
  Batch 04 — Dashboard Navigation

  Data-driven dashboard sections.
*/

(function initDashboardNav(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};

  window.MoonshineData.dashboardNav = [
    {
      id: "overview",
      label: "Overview",
      href: "#overview",
      icon: "grid",
      description: "Partner snapshot, next actions, activity, and core metrics."
    },
    {
      id: "onboarding",
      label: "Onboarding",
      href: "#onboarding",
      icon: "check-circle",
      description: "Complete partner setup and training basics."
    },
    {
      id: "submit-lead",
      label: "Submit Lead",
      href: "#submit-lead",
      icon: "send",
      description: "Enter demo referral details into local browser storage."
    },
    {
      id: "lead-tracker",
      label: "Lead Tracker",
      href: "#lead-tracker",
      icon: "pipeline",
      description: "Review and update referral lead status."
    },
    {
      id: "marketplace",
      label: "Marketplace",
      href: "#marketplace",
      icon: "store",
      description: "Browse partner offers, tools, and resource inventory."
    },
    {
      id: "partner-links",
      label: "Partner Links",
      href: "#partner-links",
      icon: "link",
      description: "Build and copy trackable partner/referral links."
    },
    {
      id: "resources",
      label: "Resources",
      href: "#resources",
      icon: "library",
      description: "Find scripts, checklists, lead magnets, and guides."
    },
    {
      id: "training",
      label: "Training Hub",
      href: "#training",
      icon: "academy",
      description: "Complete modules and track local progress."
    },
    {
      id: "commissions",
      label: "Commissions",
      href: "#commissions",
      icon: "wallet",
      description: "View educational commission snapshots and examples."
    },
    {
      id: "partner-id",
      label: "Partner ID",
      href: "#partner-id",
      icon: "fingerprint",
      description: "View and manage partner workspace partner identity."
    },
    {
      id: "integrations",
      label: "Integrations",
      href: "#integrations",
      icon: "plug",
      description: "Review future CRM, GPT, widget, and webhook readiness."
    },
    {
      id: "notes",
      label: "Notes",
      href: "#notes",
      icon: "notes",
      description: "Keep local CRM-lite notes and follow-up reminders."
    },
    {
      id: "settings",
      label: "Settings",
      href: "#settings",
      icon: "settings",
      description: "Theme, export/import, reset, and partner workspace controls."
    }
  ];
})(window);

