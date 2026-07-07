/*
  Moonshine Partner Command Center
  Batch 04 — Compliance Copy

  Reusable compliance-safe copy snippets.
  Static educational/demo content only.
*/

(function initComplianceCopy(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};

  window.MoonshineData.complianceCopy = {
    version: "0.1.0-static",
    updatedAt: "2026-07-04",

    notices: {
      staticDemo:
        "This partner workspace stores information locally in your browser. It is not connected to a live CRM, lender system, underwriting process, partner portal, or commission reporting system.",

      fundingNoGuarantee:
        "Funding options may vary. Submitting information does not guarantee approval, funding, specific rates, terms, timelines, or lender matches.",

      commissionNoGuarantee:
        "Commission examples, projections, and snapshots are for planning and education only. They do not guarantee partner earnings, payout amounts, payout timing, or funded outcomes.",

      partnerResponsibility:
        "Partners are responsible for truthful, permission-based referrals. Do not promise approval, funding, rates, terms, commissions, or specific outcomes to any business owner.",

      educationalOnly:
        "This content is for general educational and workflow planning purposes. It is not legal, tax, accounting, lending, underwriting, credit repair, or financial advice.",

      privacyReminder:
        "Only submit information you have permission to share. Do not enter Social Security numbers, bank logins, tax IDs, account numbers, full loan applications, or sensitive documents into this partner workspace.",

      affiliateDisclosure:
        "Moonshine Capital may receive referral, affiliate, marketing, or partner compensation from some products, providers, platforms, or funding relationships. Compensation does not guarantee availability, suitability, approval, or results.",

      marketplaceDisclosure:
        "Marketplace listings are examples of partner resources and offers. Availability, eligibility, pricing, payouts, and terms may change and must be verified before use.",

      dashboardStatusDisclosure:
        "Lead statuses shown in the dashboard are sample workflow states only. They are not live underwriting, application, lender, or funding statuses.",

      localStorageDisclosure:
        "Data entered here may be stored in your browser using localStorage. Clearing browser storage may delete this workspace data."
    },

    shortDisclaimers: [
      "Funding outcomes and compensation depend on review, eligibility, and program rules.",
      "Funding options, terms, and eligibility may vary.",
      "This is a partner workspace using local browser storage.",
      "Partners must use accurate, permission-based referral practices.",
      "Do not enter sensitive borrower or banking data into this demo."
    ],

    dashboardDisclaimers: [
      {
        id: "dashboard-local-demo",
        title: "Partner workspace dashboard",
        body:
          "This dashboard is a partner command center workspace. Leads, notes, favorites, training progress, and partner settings may be saved locally in your browser only."
      },
      {
        id: "dashboard-no-guarantees",
        title: "No guaranteed outcomes",
        body:
          "Lead submission, qualification notes, projected commissions, and marketplace resources do not guarantee approval, funding, payout, or any specific result."
      },
      {
        id: "dashboard-permission",
        title: "Permission-based referrals",
        body:
          "Only submit information from businesses that gave you permission to share their details. Do not submit sensitive financial credentials or private documents here."
      }
    ],

    publicPageDisclaimers: [
      {
        id: "public-partner-program",
        title: "Partner program expectations",
        body:
          "The Moonshine Partner Command Center is designed to help partners organize referrals, education, resources, and future integrations. Participation does not guarantee commissions, deal flow, funding approvals, or revenue."
      },
      {
        id: "public-funding-language",
        title: "Funding language",
        body:
          "Funding is subject to review, lender criteria, business profile, documentation, market conditions, and other factors. Avoid making promises to prospects."
      }
    ],

    partnerAgreementAcknowledgments: [
      "I understand this static experience is a demo and does not create a live funding application.",
      "I will only submit referral information I have permission to share.",
      "I will not promise approval, funding, rates, terms, income, or commissions.",
      "I understand marketplace offers and example payouts may change and require verification.",
      "I understand information stored in this static version may remain only in my browser."
    ],

    safePhrases: [
      "Explore funding options",
      "Review readiness",
      "Prepare documentation",
      "Submit for review",
      "Funding options may vary",
      "Subject to eligibility and review",
      "Educational projection",
      "Example workflow",
      "Partner resources",
      "Referral tracking demo"
    ],

    restrictedPhrases: [
      "guaranteed funding",
      "guaranteed approval",
      "everyone qualifies",
      "risk-free funding",
      "guaranteed commissions",
      "automatic approval",
      "instant approval for all",
      "no one gets denied",
      "approval guaranteed",
      "earn guaranteed income"
    ],

    footerNotice:
      "Moonshine Partner Command Center is a partner-first partner workflow demo. Funding outcomes, terms, timelines, and partner compensation depend on real review and program rules."
  };
})(window);

