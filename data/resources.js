/*
  Moonshine Partner Command Center
  Batch 04 — Resources

  Resource library data for cards, dashboard, and public resources pages.
*/

(function initResources(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};

  window.MoonshineData.resources = [
    {
      id: "funding-product-matrix",
      title: "Funding Product Matrix for Brokers",
      type: "Guide",
      category: "Funding Education",
      summary:
        "Plain-English matrix for helping partners understand common funding paths and when they may fit.",
      description:
        "Use this to frame funding conversations by business need, documentation readiness, revenue pattern, and timing. It is not a lender decision engine.",
      partnerTypes: ["funding-broker", "center-of-influence", "operator"],
      format: "Markdown / Article",
      estimatedTime: "12 min",
      href: "./resources.html#funding-product-matrix",
      tags: ["funding", "matrix", "broker", "education"],
      featured: true,
      complianceNote:
        "Use as education only. Do not represent any product as guaranteed or universally available."
    },
    {
      id: "broker-follow-up-scripts",
      title: "Broker Follow-Up Scripts",
      type: "Template",
      category: "Sales Enablement",
      summary:
        "Email, SMS, voicemail, and call prompts for new leads, missing docs, stalled deals, and reactivation.",
      description:
        "Designed to help partners stay persistent without sounding like a caffeinated collections department.",
      partnerTypes: ["funding-broker", "operator"],
      format: "Template Pack",
      estimatedTime: "8 min",
      href: "./resources.html#broker-follow-up-scripts",
      tags: ["scripts", "follow-up", "sales", "CRM"],
      featured: true,
      complianceNote:
        "Messages must remain truthful and should not promise approval, funding, terms, or timing."
    },
    {
      id: "document-checklist",
      title: "Funding Document Checklist",
      type: "Checklist",
      category: "Readiness",
      summary:
        "Common documents business owners may need to organize before a funding review.",
      description:
        "Helps partners ask cleaner intake questions and reduce the chaos tax caused by missing paperwork.",
      partnerTypes: ["funding-broker", "referral-partner", "center-of-influence"],
      format: "Checklist",
      estimatedTime: "6 min",
      href: "./tools/funding-readiness-checklist.html",
      tags: ["documents", "readiness", "checklist"],
      featured: true,
      complianceNote:
        "Document collection does not guarantee approval or funding."
    },
    {
      id: "lead-intake-scorecard",
      title: "Lead Intake Scorecard",
      type: "Scorecard",
      category: "Lead Quality",
      summary:
        "Simple intake rubric for evaluating whether a lead is ready for a funding conversation.",
      description:
        "Scores basic readiness signals like time in business, monthly revenue, urgency, documentation, and use of funds.",
      partnerTypes: ["funding-broker", "operator"],
      format: "Interactive / Static",
      estimatedTime: "7 min",
      href: "./tools/funding-readiness-checklist.html",
      tags: ["lead quality", "intake", "scorecard"],
      featured: false,
      complianceNote:
        "Readiness scoring is educational and not an underwriting or approval decision."
    },
    {
      id: "referral-intro-template",
      title: "Referral Intro Template",
      type: "Template",
      category: "Referral Partner",
      summary:
        "Short warm-intro scripts for referral partners and centers of influence.",
      description:
        "Useful for accountants, business brokers, attorneys, consultants, and operators introducing clients to a funding review path.",
      partnerTypes: ["referral-partner", "center-of-influence"],
      format: "Email / DM Template",
      estimatedTime: "4 min",
      href: "./resources.html#referral-intro-template",
      tags: ["referral", "intro", "COI"],
      featured: false,
      complianceNote:
        "Get permission before sharing contact information. Avoid making claims about approval or availability."
    },
    {
      id: "permission-based-referrals",
      title: "Permission-Based Referral Rules",
      type: "Guide",
      category: "Compliance",
      summary:
        "Simple operating rules for referring business owners without creating trust landmines.",
      description:
        "Covers consent, truthful positioning, safe phrasing, privacy basics, and when to hand off to operators.",
      partnerTypes: ["funding-broker", "referral-partner", "affiliate-partner", "center-of-influence"],
      format: "Guide",
      estimatedTime: "9 min",
      href: "./compliance.html",
      tags: ["compliance", "consent", "privacy", "referrals"],
      featured: true,
      complianceNote:
        "This is general operational guidance and not legal advice."
    },
    {
      id: "affiliate-disclosure-guide",
      title: "Affiliate Disclosure Guide",
      type: "Guide",
      category: "Affiliate Marketing",
      summary:
        "Disclosure language partners can adapt when publishing content or links.",
      description:
        "Helps affiliates stay upfront about compensation relationships without turning the CTA into legal oatmeal.",
      partnerTypes: ["affiliate-partner"],
      format: "Guide",
      estimatedTime: "5 min",
      href: "./affiliate-disclosure.html",
      tags: ["affiliate", "disclosure", "content"],
      featured: false,
      complianceNote:
        "Partners are responsible for following disclosure rules that apply to their channels and jurisdictions."
    },
    {
      id: "content-swipe-file",
      title: "Funding Partner Content Swipe File",
      type: "Swipe File",
      category: "Marketing",
      summary:
        "Post, email, short video, and group-share prompts for promoting funding readiness resources.",
      description:
        "Conversion-focused but compliance-safe prompts for creators, newsletter operators, and partner communities.",
      partnerTypes: ["affiliate-partner", "referral-partner", "center-of-influence"],
      format: "Swipe File",
      estimatedTime: "10 min",
      href: "./resources.html#content-swipe-file",
      tags: ["content", "social", "email", "affiliate"],
      featured: true,
      complianceNote:
        "Do not use copy that promises funding, approval, income, or guaranteed results."
    },
    {
      id: "crm-mapping-template",
      title: "CRM Mapping Template",
      type: "Blueprint",
      category: "Integration",
      summary:
        "Field map for routing partner leads into a future CRM or automation workflow.",
      description:
        "Covers partner ID, source, lead stage, business basics, funding need, notes, compliance flags, and follow-up owner.",
      partnerTypes: ["operator", "funding-broker"],
      format: "Integration Blueprint",
      estimatedTime: "11 min",
      href: "./developers/crm-integrations.html",
      tags: ["CRM", "integration", "fields"],
      featured: false,
      complianceNote:
        "Future CRM workflows must validate data, protect sensitive information, and preserve consent/audit records."
    },
    {
      id: "small-business-funding-primer",
      title: "Small Business Funding Primer",
      type: "Guide",
      category: "Funding Education",
      summary:
        "Beginner-friendly overview partners can share with business owners who are not ready for a sales call yet.",
      description:
        "Explains readiness, documents, cash-flow use cases, review factors, and expectation setting.",
      partnerTypes: ["referral-partner", "affiliate-partner", "center-of-influence"],
      format: "Guide",
      estimatedTime: "8 min",
      href: "./resources.html#small-business-funding-primer",
      tags: ["education", "small business", "readiness"],
      featured: false,
      complianceNote:
        "Educational overview only. Not lender, legal, tax, or financial advice."
    }
  ];
})(window);
