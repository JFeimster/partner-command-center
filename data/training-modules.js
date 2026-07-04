/*
  Moonshine Partner Command Center
  Batch 04 — Training Modules

  Training checklist data for partner onboarding and dashboard progress.
*/

(function initTrainingModules(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};

  window.MoonshineData.trainingModules = [
    {
      id: "partner-orientation",
      title: "Partner Orientation",
      track: "Core",
      level: "Required",
      durationMinutes: 8,
      summary:
        "Understand what the Partner Command Center is, what it is not, and how to use the static demo responsibly.",
      objectives: [
        "Identify the primary partner workflow",
        "Understand local demo storage",
        "Know where to submit and track demo leads"
      ],
      checklist: [
        "Review partner program overview",
        "Save dashboard link",
        "Confirm local demo disclaimer"
      ],
      resourceIds: ["permission-based-referrals"],
      order: 1
    },
    {
      id: "compliance-basics",
      title: "Compliance Basics",
      track: "Core",
      level: "Required",
      durationMinutes: 12,
      summary:
        "Learn the language rules that keep partner referrals clean, honest, and not legally radioactive.",
      objectives: [
        "Avoid funding and income guarantees",
        "Use permission-based referral practices",
        "Know what not to enter into the static demo"
      ],
      checklist: [
        "Read no-guarantee language",
        "Review restricted phrases",
        "Accept partner responsibility reminders"
      ],
      resourceIds: ["permission-based-referrals", "affiliate-disclosure-guide"],
      order: 2
    },
    {
      id: "lead-intake-workflow",
      title: "Lead Intake Workflow",
      track: "Broker",
      level: "Recommended",
      durationMinutes: 15,
      summary:
        "Use a simple intake structure to understand the business, funding need, timeline, and documentation readiness.",
      objectives: [
        "Capture business basics",
        "Ask about use of funds",
        "Document next steps without promising approval"
      ],
      checklist: [
        "Open submit lead section",
        "Review required fields",
        "Create one demo lead",
        "Update lead status"
      ],
      resourceIds: ["lead-intake-scorecard", "document-checklist"],
      order: 3
    },
    {
      id: "marketplace-navigation",
      title: "Marketplace Navigation",
      track: "Core",
      level: "Recommended",
      durationMinutes: 9,
      summary:
        "Understand how marketplace offers are organized and how to position them without overselling.",
      objectives: [
        "Filter offers by partner type",
        "Read offer compliance notes",
        "Favorite relevant offers"
      ],
      checklist: [
        "Review featured offers",
        "Open one offer detail",
        "Save one favorite",
        "Read marketplace disclosure"
      ],
      resourceIds: ["funding-product-matrix"],
      order: 4
    },
    {
      id: "partner-link-playbook",
      title: "Partner Link Playbook",
      track: "Affiliate",
      level: "Recommended",
      durationMinutes: 10,
      summary:
        "Build and use partner links with attribution parameters and proper disclosure language.",
      objectives: [
        "Understand partner IDs",
        "Build a trackable link",
        "Use channel-specific UTM parameters"
      ],
      checklist: [
        "Find partner ID",
        "Build default funding link",
        "Copy marketplace link",
        "Review affiliate disclosure"
      ],
      resourceIds: ["affiliate-disclosure-guide", "content-swipe-file"],
      order: 5
    },
    {
      id: "coi-referral-conversations",
      title: "COI Referral Conversations",
      track: "Referral / COI",
      level: "Recommended",
      durationMinutes: 11,
      summary:
        "Position funding readiness conversations for clients without becoming the lender, broker, attorney, accountant, and therapist at the same time.",
      objectives: [
        "Start a safe funding readiness conversation",
        "Use warm intro language",
        "Know when to hand off"
      ],
      checklist: [
        "Read referral intro template",
        "Review client readiness questions",
        "Create one sample note",
        "Copy warm intro language"
      ],
      resourceIds: ["referral-intro-template", "small-business-funding-primer"],
      order: 6
    },
    {
      id: "dashboard-ops",
      title: "Dashboard Ops and Local Data",
      track: "Operator",
      level: "Advanced",
      durationMinutes: 14,
      summary:
        "Understand how localStorage, mock data, export/import, and future backend seams fit together.",
      objectives: [
        "Understand local data keys",
        "Export local demo data",
        "Reset demo state safely"
      ],
      checklist: [
        "Review settings section",
        "Export local JSON",
        "Import sample JSON",
        "Reset demo state"
      ],
      resourceIds: ["crm-mapping-template"],
      order: 7
    },
    {
      id: "future-integrations",
      title: "Future Integrations Overview",
      track: "Developer / Operator",
      level: "Advanced",
      durationMinutes: 16,
      summary:
        "Preview how Tally, CRM, GPT actions, widgets, webhooks, and API examples will connect after static validation.",
      objectives: [
        "Identify integration boundaries",
        "Understand example-only API files",
        "Map static fields to future systems"
      ],
      checklist: [
        "Review developer docs",
        "Open CRM mapping",
        "Review widget docs",
        "Review API example disclaimers"
      ],
      resourceIds: ["crm-mapping-template"],
      order: 8
    }
  ];
})(window);
