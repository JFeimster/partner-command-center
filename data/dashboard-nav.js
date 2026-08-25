/* Partner Command navigation — only implemented routes are rendered. */
(function initDashboardNav(window, document) {
  "use strict";
  window.MoonshineData = window.MoonshineData || {};
  window.MoonshineData.dashboardNav = [
    { id: "overview", group: "COMMAND", label: "Command", href: "#overview", icon: "grid", description: "Attention, activity, activation, and the next move." },
    { id: "leads", group: "PIPELINE", label: "Leads", href: "#leads", icon: "pipeline", description: "Submit and track partner-attributed funding leads." },
    { id: "growth", group: "GROWTH", label: "My Funding Page", href: "./growth.html", icon: "link", description: "Publish, preview, and share the canonical funding page." },
    { id: "links", group: "GROWTH", label: "Referral Links", href: "./growth.html#referral-link", icon: "link", description: "Copy the canonical partner link and preserve attribution." },
    { id: "campaigns", group: "GROWTH", label: "Campaigns", href: "./growth.html#campaigns", icon: "link", description: "Build stateless campaign-tagged share URLs." },
    { id: "assets", group: "GROWTH", label: "Marketing Assets", href: "./growth.html#assets", icon: "library", description: "Open the assigned marketing-asset inventory." },
    { id: "widgets", group: "GROWTH", label: "Widgets", href: "./growth.html#widgets", icon: "widgets", description: "Launch and embed federated canonical widgets." },
    { id: "capital", group: "CAPITAL", label: "Product Desk", href: "./capital.html#product-desk", icon: "pipeline", description: "Filter product paths from a client need." },
    { id: "providers", group: "CAPITAL", label: "Providers", href: "./capital.html#providers", icon: "building", description: "Review verified provider availability and submission paths." },
    { id: "marketplace", group: "CAPITAL", label: "Marketplace", href: "./marketplace.html", icon: "grid", description: "Browse the normalized capital discovery inventory." },
    { id: "build", group: "BUILD", label: "Tool Bench", href: "./build.html", icon: "library", description: "Find the right operator tool, assistant, resource, or calculator." },
    { id: "tools", group: "BUILD", label: "Tools", href: "./build.html#tools", icon: "widgets", description: "Open qualification, explanation, and workflow utilities." },
    { id: "ai", group: "BUILD", label: "AI", href: "./build.html#ai", icon: "sparkles", description: "Open published assistants with clear input boundaries." },
    { id: "resources", group: "BUILD", label: "Resources", href: "./resources.html", icon: "library", description: "Use the existing partner resource inventory." },
    { id: "calculators", group: "BUILD", label: "Calculators", href: "./build.html#calculators", icon: "calculator", description: "Open existing educational numeric tools." },
    { id: "learn", group: "LEARN", label: "Training", href: "./learn.html", icon: "academy", description: "Turn partner knowledge into the next operating action." },
    { id: "sprint", group: "LEARN", label: "30-Day Sprint", href: "./learn.html#sprint", icon: "pipeline", description: "Work through the first operating pathway in practical phases." },
    { id: "scripts", group: "LEARN", label: "Scripts", href: "./learn.html#scripts", icon: "message", description: "Find conversation resources for the next outreach or follow-up." },
    { id: "events", group: "LEARN", label: "Events", href: "./learn.html#events", icon: "calendar", description: "Review connected live learning events when available." },
    { id: "earn", group: "EARN", label: "Revenue Plan", href: "./earn.html", icon: "wallet", description: "Connect income goals to editable production assumptions." },
    { id: "commissions", group: "EARN", label: "Commissions", href: "./earn.html#commissions", icon: "wallet", description: "Review clearly labeled demo and live compensation values." },
    { id: "production", group: "EARN", label: "Production", href: "./earn.html#production", icon: "pipeline", description: "Review lead-stage movement and funded volume." },
    { id: "team", group: "TEAM", label: "My Team", href: "./team.html", icon: "users", description: "Review connected agents and coaching attention when team context exists." },
    { id: "game-plans", group: "TEAM", label: "Game Plans", href: "./team.html#game-plans", icon: "clipboard", description: "Turn a goal into local activity and accountability commitments." },
    { id: "leadership", group: "TEAM", label: "Leadership", href: "./team.html#leadership", icon: "award", description: "Review qualitative duplication and leadership progression." },
    { id: "account", group: "ACCOUNT", label: "Profile", href: "./account.html", icon: "user", description: "Manage public profile data while system identity remains locked." },
    { id: "compliance", group: "ACCOUNT", label: "Compliance", href: "./account.html#compliance", icon: "shield", description: "Review disclosures, agreements, terms, and privacy boundaries." },
    { id: "settings", group: "ACCOUNT", label: "Settings", href: "./account.html#settings", icon: "settings", description: "Control genuine Partner Command display and workspace preferences." }
  ];

  if (document && document.addEventListener) {
    document.addEventListener("click", function openClientWorkspace(event) {
      var button = event.target.closest && event.target.closest("[data-open-client]");
      if (!button) return;
      var clientId = button.getAttribute("data-open-client");
      var leadsSection = document.getElementById("leads");
      var leadRow = document.querySelector("[data-lead-card='" + clientId + "']");
      if (leadsSection) {
        event.preventDefault();
        leadsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (leadRow) {
        leadRow.setAttribute("tabindex", "-1");
        leadRow.classList.add("is-highlighted");
        leadRow.focus();
        window.setTimeout(function clearLeadHighlight() { leadRow.classList.remove("is-highlighted"); }, 1800);
      }
    });
  }
})(window, document);
