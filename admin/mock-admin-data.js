/*
  Moonshine Partner Command Center
  Batch 12 — Mock Admin Data

  Fictional admin/ops data for static prototype.
*/

(function initMockAdminData(window) {
  "use strict";

  window.MoonshineAdmin = window.MoonshineAdmin || {};

  window.MoonshineAdmin.mockData = {
    updatedAt: "2026-07-04T12:00:00.000Z",

    metrics: [
      {
        id: "partners-active",
        label: "Active demo partners",
        value: 4,
        note: "Fictional sample partners",
        tone: "success"
      },
      {
        id: "partners-review",
        label: "Needs review",
        value: 3,
        note: "Copy, profile, or routing checks",
        tone: "warning"
      },
      {
        id: "leads-open",
        label: "Open demo leads",
        value: 4,
        note: "Local/static status only",
        tone: "info"
      },
      {
        id: "flagged-copy",
        label: "Flagged copy items",
        value: 5,
        note: "Restricted-phrase review",
        tone: "danger"
      },
      {
        id: "integrations",
        label: "Integration blueprints",
        value: 8,
        note: "Not live APIs",
        tone: "warning"
      }
    ],

    partnerQueue: [
      {
        id: "admin_partner_001",
        partnerId: "MS-FB-1024",
        company: "Marcus Funding Desk",
        contactName: "Jordan Ellis",
        email: "jordan@example.com",
        type: "funding-broker",
        status: "active",
        source: "Partner access",
        priority: "Medium",
        risk: "Low",
        nextAction: "Confirm approved scripts and first lead path.",
        createdAt: "2026-07-01T13:00:00.000Z"
      },
      {
        id: "admin_partner_002",
        partnerId: "MS-AF-2048",
        company: "Fintech Field Notes",
        contactName: "Avery Stone",
        email: "avery@example.com",
        type: "affiliate-partner",
        status: "needs-review",
        source: "Newsletter promotion",
        priority: "High",
        risk: "Medium",
        nextAction: "Review affiliate disclosure placement before campaign launch.",
        createdAt: "2026-07-02T10:15:00.000Z"
      },
      {
        id: "admin_partner_003",
        partnerId: "MS-RP-3110",
        company: "Local Growth Loop",
        contactName: "Mina Howard",
        email: "mina@example.com",
        type: "referral-partner",
        status: "pending",
        source: "Warm intro",
        priority: "Medium",
        risk: "Low",
        nextAction: "Send referral partner orientation and safe intro template.",
        createdAt: "2026-07-03T08:45:00.000Z"
      },
      {
        id: "admin_partner_004",
        partnerId: "MS-COI-7331",
        company: "LedgerBridge Advisors",
        contactName: "Priya Shah",
        email: "priya@example.com",
        type: "center-of-influence",
        status: "active",
        source: "COI outreach",
        priority: "High",
        risk: "Low",
        nextAction: "Map client referral workflow and monthly review cadence.",
        createdAt: "2026-06-24T15:00:00.000Z"
      },
      {
        id: "admin_partner_005",
        partnerId: "MS-AF-8802",
        company: "Builder Cashflow Weekly",
        contactName: "Chris Nolan",
        email: "chris@example.com",
        type: "affiliate-partner",
        status: "needs-review",
        source: "Content creator",
        priority: "High",
        risk: "High",
        nextAction: "Remove restricted funding claims from draft content before approval.",
        createdAt: "2026-07-04T09:05:00.000Z"
      }
    ],

    leadQueue: [
      {
        id: "admin_lead_001",
        leadId: "lead_demo_001",
        businessName: "Harbor Street HVAC",
        partnerId: "MS-FB-1024",
        source: "Broker referral",
        status: "reviewing",
        fundingNeed: 85000,
        risk: "Medium",
        nextAction: "Request documents; remind partner not to quote approval odds.",
        createdAt: "2026-07-01T14:20:00.000Z"
      },
      {
        id: "admin_lead_002",
        leadId: "lead_demo_002",
        businessName: "Luna & Co. Catering",
        partnerId: "MS-AF-2048",
        source: "Affiliate content",
        status: "needsInfo",
        fundingNeed: 35000,
        risk: "Medium",
        nextAction: "Clarify revenue consistency and event contract context.",
        createdAt: "2026-06-29T18:45:00.000Z"
      },
      {
        id: "admin_lead_003",
        leadId: "lead_demo_003",
        businessName: "Keystone Mobile Detailing",
        partnerId: "MS-RP-3110",
        source: "Widget demo",
        status: "new",
        fundingNeed: 22000,
        risk: "Low",
        nextAction: "Confirm permission-based referral and readiness basics.",
        createdAt: "2026-07-03T11:05:00.000Z"
      },
      {
        id: "admin_lead_004",
        leadId: "lead_demo_004",
        businessName: "Northline Freight Repair",
        partnerId: "MS-COI-7331",
        source: "COI intro",
        status: "submitted",
        fundingNeed: 120000,
        risk: "Low",
        nextAction: "Await fictional provider review update.",
        createdAt: "2026-06-25T16:30:00.000Z"
      }
    ],

    marketplaceReview: [
      {
        id: "offer_working_capital",
        title: "Working Capital Review",
        category: "Funding",
        status: "Approved demo",
        owner: "Moonshine Ops",
        risk: "Medium",
        reviewNotes: "Offer copy uses review-path language and avoids guarantees.",
        nextAction: "Verify CTA route after backend lead endpoint is defined."
      },
      {
        id: "offer_partner_widget",
        title: "Embeddable Partner Widget",
        category: "Widget",
        status: "Static prototype",
        owner: "Automation Ops",
        risk: "High",
        reviewNotes: "Must not be promoted as live lead capture until API and consent workflow exist.",
        nextAction: "Add backend submission plan and partner ID validation."
      },
      {
        id: "offer_content_swipe",
        title: "Partner Content Swipe File",
        category: "Marketing",
        status: "Needs review",
        owner: "Content Ops",
        risk: "High",
        reviewNotes: "Review all social and email copy for affiliate disclosure placement.",
        nextAction: "Flag restricted phrases before publishing."
      },
      {
        id: "offer_crm_mapping",
        title: "CRM Mapping Blueprint",
        category: "Integration",
        status: "Blueprint",
        owner: "Ops / CRM",
        risk: "Medium",
        reviewNotes: "Useful for implementation planning, but not a live integration.",
        nextAction: "Map required fields to future CRM object schema."
      }
    ],

    complianceQueue: [
      {
        id: "copy_flag_001",
        location: "Partner social draft",
        phrase: "guaranteed funding",
        severity: "High",
        rule: "No guaranteed outcomes",
        recommendation: "Replace with “explore funding options” or “review funding readiness.”",
        status: "Open"
      },
      {
        id: "copy_flag_002",
        location: "Affiliate email CTA",
        phrase: "everyone qualifies",
        severity: "High",
        rule: "No eligibility promise",
        recommendation: "Replace with “eligibility and options may vary by business profile.”",
        status: "Open"
      },
      {
        id: "copy_flag_003",
        location: "Commission training slide",
        phrase: "guaranteed commissions",
        severity: "High",
        rule: "No income or payout guarantee",
        recommendation: "Use “example commission scenarios” and include partner terms caveat.",
        status: "Open"
      },
      {
        id: "copy_flag_004",
        location: "Widget copy",
        phrase: "application submitted",
        severity: "Medium",
        rule: "Static demo labeling",
        recommendation: "Use “demo inquiry saved locally” until backend submission exists.",
        status: "In review"
      },
      {
        id: "copy_flag_005",
        location: "Lead tracker label",
        phrase: "approved",
        severity: "Medium",
        rule: "No underwriting decision",
        recommendation: "Use workflow statuses like “reviewing,” “submitted,” or “funded example.”",
        status: "In review"
      }
    ],

    integrationReadiness: [
      {
        id: "tally-signup",
        title: "Tally Partner Signup",
        status: "Blueprint",
        owner: "Partner Ops",
        readiness: 55,
        blockers: ["Webhook target not live", "Partner approval rules not finalized"],
        nextAction: "Create webhook handler contract and CRM field map."
      },
      {
        id: "crm-sync",
        title: "CRM Lead + Partner Sync",
        status: "Needs backend",
        owner: "CRM Ops",
        readiness: 35,
        blockers: ["CRM not selected in repo", "Auth and field validation missing"],
        nextAction: "Finalize CRM object model and API auth approach."
      },
      {
        id: "widget-api",
        title: "Widget Lead Submission API",
        status: "Static prototype",
        owner: "Automation Ops",
        readiness: 45,
        blockers: ["No server endpoint", "Consent and spam protection required"],
        nextAction: "Define `/api/leads-submit` request/response contract."
      },
      {
        id: "openapi",
        title: "OpenAPI + GPT Actions",
        status: "Blueprint",
        owner: "Developer Ops",
        readiness: 40,
        blockers: ["Example schema only", "No real endpoints"],
        nextAction: "Keep schema example-only until backend is deployed."
      },
      {
        id: "admin-auth",
        title: "Admin Authentication",
        status: "Not started",
        owner: "Security Ops",
        readiness: 10,
        blockers: ["Static prototype has no auth", "Role model undefined"],
        nextAction: "Define admin, operator, partner, and read-only roles."
      }
    ],

    activity: [
      {
        id: "admin_event_001",
        type: "partner.review",
        label: "Partner review queued",
        actor: "Admin Ops",
        target: "Builder Cashflow Weekly",
        message: "Affiliate partner draft content needs restricted-phrase review.",
        createdAt: "2026-07-04T09:10:00.000Z",
        tone: "warning"
      },
      {
        id: "admin_event_002",
        type: "integration.review",
        label: "Widget API blocker logged",
        actor: "Automation Ops",
        target: "Widget Lead Submission API",
        message: "Static widget cannot be promoted as live capture until backend endpoint exists.",
        createdAt: "2026-07-04T08:45:00.000Z",
        tone: "danger"
      },
      {
        id: "admin_event_003",
        type: "lead.review",
        label: "Lead review updated",
        actor: "Funding Desk",
        target: "Harbor Street HVAC",
        message: "Set demo next action to document request.",
        createdAt: "2026-07-03T16:00:00.000Z",
        tone: "info"
      },
      {
        id: "admin_event_004",
        type: "marketplace.review",
        label: "Marketplace offer approved",
        actor: "Moonshine Ops",
        target: "Working Capital Review",
        message: "Approved demo offer copy with review-path language.",
        createdAt: "2026-07-03T14:20:00.000Z",
        tone: "success"
      },
      {
        id: "admin_event_005",
        type: "compliance.review",
        label: "Restricted phrase detected",
        actor: "Compliance Review",
        target: "Affiliate email CTA",
        message: "Flagged “everyone qualifies” in partner copy draft.",
        createdAt: "2026-07-03T11:30:00.000Z",
        tone: "danger"
      }
    ],

    settings: {
      demoMode: true,
      authStatus: "not implemented",
      dataSource: "static mock data + optional browser localStorage",
      productionRequirements: [
        "Authentication and role-based access control",
        "Server-side validation",
        "CRM or database storage",
        "Audit logs",
        "Secure handling of lead and partner data",
        "Consent capture",
        "Provider/lender integration boundaries",
        "Commission terms and payout review workflow",
        "Legal/privacy review"
      ]
    }
  };
})(window);
