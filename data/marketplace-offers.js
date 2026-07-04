/*
  Moonshine Partner Command Center
  Batch 04 — Marketplace Offers

  Static marketplace data. Examples only.
*/

(function initMarketplaceOffers(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};

  window.MoonshineData.marketplaceOffers = [
    {
      id: "working-capital-review",
      title: "Working Capital Review",
      category: "Funding",
      partnerTypes: ["funding-broker", "referral-partner", "center-of-influence"],
      summary:
        "Route business owners into a general working capital readiness conversation and document review path.",
      description:
        "Designed for business owners who need operating capital, inventory support, marketing runway, payroll bridge planning, or short-term cash-flow review. Availability and terms depend on business profile and review.",
      audience: "Established small businesses with active revenue and a defined capital use case.",
      tags: ["working capital", "cash flow", "documentation", "funding"],
      payoutModel: "Example referral/partner compensation may vary by program and funded outcome.",
      exampleCommissionRange: "$250–$2,500+ example range",
      status: "demo-offer",
      ctaLabel: "Review funding path",
      ctaUrl: "./partner-access.html?source=marketplace&offer=working-capital-review",
      featured: true,
      complianceNote:
        "Do not promise approval, funding amount, rates, or timing. Present as a review path only."
    },
    {
      id: "equipment-finance-path",
      title: "Equipment Finance Path",
      category: "Funding",
      partnerTypes: ["funding-broker", "center-of-influence"],
      summary:
        "Help equipment-heavy businesses organize a potential equipment finance conversation.",
      description:
        "Useful for contractors, logistics companies, restaurants, medical practices, and operators considering equipment acquisition or replacement.",
      audience: "Businesses evaluating equipment purchases, repairs, upgrades, or replacements.",
      tags: ["equipment", "contractors", "trucking", "restaurants"],
      payoutModel: "Example partner compensation may vary.",
      exampleCommissionRange: "$300–$3,000+ example range",
      status: "demo-offer",
      ctaLabel: "Explore equipment path",
      ctaUrl: "./partner-access.html?source=marketplace&offer=equipment-finance-path",
      featured: false,
      complianceNote:
        "Financing availability depends on business, equipment, credit, documentation, and provider review."
    },
    {
      id: "invoice-cash-flow-review",
      title: "Invoice Cash Flow Review",
      category: "Funding",
      partnerTypes: ["funding-broker", "center-of-influence"],
      summary:
        "Position unpaid invoices as a cash-flow planning conversation for eligible businesses.",
      description:
        "For B2B businesses with outstanding invoices that need to evaluate whether invoice-based options may fit their cash-flow cycle.",
      audience: "B2B businesses with receivables, slow-paying customers, or invoice timing gaps.",
      tags: ["invoices", "receivables", "cash flow", "B2B"],
      payoutModel: "Example referral compensation may vary.",
      exampleCommissionRange: "$200–$2,000+ example range",
      status: "demo-offer",
      ctaLabel: "Review invoice path",
      ctaUrl: "./partner-access.html?source=marketplace&offer=invoice-cash-flow-review",
      featured: false,
      complianceNote:
        "Do not claim invoices guarantee funding. Eligibility and terms require review."
    },
    {
      id: "business-credit-readiness",
      title: "Business Credit Readiness Toolkit",
      category: "Education",
      partnerTypes: ["affiliate-partner", "referral-partner", "center-of-influence"],
      summary:
        "Give business owners a setup/readiness checklist before they chase funding like a raccoon chasing a shiny hubcap.",
      description:
        "Education-first resource for business owners who need to understand entity setup, documentation hygiene, banking consistency, vendor readiness, and common fundability gaps.",
      audience: "Newer LLC owners, solopreneurs, and small business operators preparing for future funding conversations.",
      tags: ["business credit", "readiness", "checklist", "education"],
      payoutModel: "Educational resource; compensation depends on future program configuration.",
      exampleCommissionRange: "No guaranteed payout",
      status: "demo-resource",
      ctaLabel: "Open checklist",
      ctaUrl: "./tools/funding-readiness-checklist.html",
      featured: true,
      complianceNote:
        "Do not present this as credit repair, score improvement, or approval advice."
    },
    {
      id: "broker-follow-up-machine",
      title: "Broker Follow-Up Machine",
      category: "Automation",
      partnerTypes: ["funding-broker", "operator"],
      summary:
        "Organize follow-up scripts, stalled deal recovery, missing docs nudges, and referral nurture workflows.",
      description:
        "A workflow concept for brokers who need better persistence without sounding like a desperate voicemail goblin.",
      audience: "Loan brokers and funding teams managing lead follow-up across stages.",
      tags: ["follow-up", "CRM", "scripts", "automation"],
      payoutModel: "Internal enablement / future service package.",
      exampleCommissionRange: "Not a commission product",
      status: "demo-tool",
      ctaLabel: "View resource",
      ctaUrl: "./resources.html?resource=broker-follow-up-machine",
      featured: false,
      complianceNote:
        "Follow-up language should remain truthful, permission-based, and free of funding guarantees."
    },
    {
      id: "partner-widget",
      title: "Embeddable Partner Widget",
      category: "Widget",
      partnerTypes: ["affiliate-partner", "referral-partner", "funding-broker"],
      summary:
        "Future-ready website widget for capturing basic funding readiness interest with partner ID attribution.",
      description:
        "Static prototype for partners who want to embed a simple readiness/referral widget on a website. Not connected to a backend in the first version.",
      audience: "Partners with websites, blogs, communities, newsletters, or client portals.",
      tags: ["widget", "partner ID", "embed", "lead capture"],
      payoutModel: "Future backend required for real tracking.",
      exampleCommissionRange: "Example only",
      status: "planned-static-prototype",
      ctaLabel: "Preview widget docs",
      ctaUrl: "./widgets/README.md",
      featured: true,
      complianceNote:
        "Widget submissions are local/static until connected to a real API and consent workflow."
    },
    {
      id: "crm-mapping-blueprint",
      title: "CRM Mapping Blueprint",
      category: "Integration",
      partnerTypes: ["operator", "funding-broker"],
      summary:
        "Map static lead fields into future CRM properties before automation gets drunk on assumptions.",
      description:
        "Blueprint for routing partner leads into a future CRM using clean field names, stages, source attribution, and compliance metadata.",
      audience: "Operators, automation builders, and funding teams preparing CRM integration.",
      tags: ["CRM", "integration", "fields", "ops"],
      payoutModel: "Internal operations asset.",
      exampleCommissionRange: "Not a commission product",
      status: "blueprint",
      ctaLabel: "View CRM mapping",
      ctaUrl: "./developers/crm-integrations.html",
      featured: false,
      complianceNote:
        "Real CRM integration must include access controls, consent capture, validation, and audit logging."
    },
    {
      id: "content-swipe-file",
      title: "Partner Content Swipe File",
      category: "Marketing",
      partnerTypes: ["affiliate-partner", "referral-partner", "center-of-influence"],
      summary:
        "Compliance-safe post ideas, captions, email snippets, and intro language for partner promotion.",
      description:
        "Starter copy angles for partners who want to promote funding readiness without promising magic money from a fintech vending machine.",
      audience: "Affiliates, creators, newsletter operators, coaches, and local business connectors.",
      tags: ["content", "affiliate", "social", "email"],
      payoutModel: "Marketing enablement; payouts depend on partner program terms.",
      exampleCommissionRange: "No guaranteed payout",
      status: "demo-resource",
      ctaLabel: "Open resources",
      ctaUrl: "./resources.html?category=marketing",
      featured: false,
      complianceNote:
        "Partners should include appropriate disclosures and avoid promises of approval, funding, or income."
    }
  ];
})(window);
