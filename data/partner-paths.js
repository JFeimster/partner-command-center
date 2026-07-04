/*
  Moonshine Partner Command Center
  Batch 04 — Partner Paths

  Partner segments and recommended onboarding journeys.
*/

(function initPartnerPaths(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};

  window.MoonshineData.partnerPaths = [
    {
      id: "funding-broker",
      label: "Funding Broker",
      headline: "Turn funding conversations into a cleaner partner pipeline.",
      audience:
        "Independent business funding brokers, ISOs, consultants, and funding agency operators who already speak with business owners seeking capital.",
      bestFor: [
        "Submitting qualified business funding leads",
        "Tracking deal movement",
        "Using marketplace offers as solution inventory",
        "Organizing partner links and scripts"
      ],
      onboardingSteps: [
        "Create partner profile",
        "Save partner ID",
        "Review compliance rules",
        "Submit first demo lead",
        "Explore marketplace offers",
        "Complete broker training checklist"
      ],
      recommendedResources: [
        "funding-product-matrix",
        "broker-follow-up-scripts",
        "document-checklist",
        "lead-intake-scorecard"
      ],
      dashboardFocus: [
        "Submit Lead",
        "Lead Tracker",
        "Marketplace",
        "Partner Links",
        "Commission Snapshot"
      ],
      defaultCta: "Submit your first lead"
    },
    {
      id: "referral-partner",
      label: "Referral Partner",
      headline: "Refer business owners without pretending to be a lender.",
      audience:
        "Professionals who know business owners but do not want to manage funding workflows end-to-end.",
      bestFor: [
        "Making warm introductions",
        "Sharing partner links",
        "Using simple education resources",
        "Tracking referral activity"
      ],
      onboardingSteps: [
        "Create partner profile",
        "Choose referral audience",
        "Copy partner link",
        "Review no-promise language",
        "Share readiness resources",
        "Track introductions"
      ],
      recommendedResources: [
        "referral-intro-template",
        "funding-readiness-checklist",
        "permission-based-referrals",
        "small-business-funding-primer"
      ],
      dashboardFocus: [
        "Partner ID",
        "Partner Links",
        "Resources",
        "Training Hub",
        "Notes"
      ],
      defaultCta: "Copy referral link"
    },
    {
      id: "affiliate-partner",
      label: "Affiliate Partner",
      headline: "Promote partner-friendly funding resources with trackable links.",
      audience:
        "Creators, newsletter operators, community owners, fintech affiliates, educators, and niche media publishers.",
      bestFor: [
        "Publishing resources",
        "Driving traffic with attribution",
        "Sharing lead magnets",
        "Testing offers and content angles"
      ],
      onboardingSteps: [
        "Create partner profile",
        "Choose promotion channels",
        "Save affiliate disclosure",
        "Generate partner links",
        "Review approved copy angles",
        "Track demo clicks and notes"
      ],
      recommendedResources: [
        "affiliate-disclosure-guide",
        "content-swipe-file",
        "funding-lead-magnet-kit",
        "partner-link-playbook"
      ],
      dashboardFocus: [
        "Partner Links",
        "Marketplace",
        "Resources",
        "Training Hub",
        "Commission Snapshot"
      ],
      defaultCta: "Build promotion link"
    },
    {
      id: "center-of-influence",
      label: "Center of Influence",
      headline: "Help clients find funding paths without becoming the funding department.",
      audience:
        "Bookkeepers, accountants, small business attorneys, business brokers, consultants, real estate pros, merchant services reps, and local business community leaders.",
      bestFor: [
        "Introducing funding readiness conversations",
        "Routing clients to the right intake path",
        "Using education-first resources",
        "Documenting client referral notes"
      ],
      onboardingSteps: [
        "Create partner profile",
        "Select primary client type",
        "Review referral responsibilities",
        "Use readiness checklist",
        "Share education resource",
        "Submit warm referral"
      ],
      recommendedResources: [
        "coi-conversation-guide",
        "client-funding-readiness-questions",
        "safe-referral-language",
        "documentation-primer"
      ],
      dashboardFocus: [
        "Resources",
        "Funding Readiness",
        "Submit Lead",
        "Notes",
        "Training Hub"
      ],
      defaultCta: "Start readiness conversation"
    },
    {
      id: "operator",
      label: "Moonshine Operator",
      headline: "Use the static OS to preview partner workflows before backend buildout.",
      audience:
        "Moonshine Capital operators, admins, automation builders, and internal reviewers.",
      bestFor: [
        "Reviewing demo partner flow",
        "Testing lead states",
        "Auditing compliance copy",
        "Planning CRM and automation upgrades"
      ],
      onboardingSteps: [
        "Review public pages",
        "Check partner access flow",
        "Seed demo dashboard state",
        "Review admin prototype",
        "Map future CRM fields",
        "Document required backend seams"
      ],
      recommendedResources: [
        "admin-ops-checklist",
        "crm-mapping-template",
        "api-example-guide",
        "compliance-review-rules"
      ],
      dashboardFocus: [
        "Dashboard Overview",
        "Lead Tracker",
        "Integrations",
        "Settings",
        "Admin Prototype"
      ],
      defaultCta: "Review static workflow"
    }
  ];
})(window);
