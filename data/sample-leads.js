/*
  Moonshine Partner Command Center
  Batch 04 — Sample Leads

  Fictional demo leads only.
*/

(function initSampleLeads(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};

  window.MoonshineData.sampleLeads = [
    {
      id: "lead_demo_001",
      businessName: "Harbor Street HVAC",
      contactName: "Marcus Reed",
      email: "marcus@example.com",
      phone: "(555) 014-1101",
      industry: "Contractor / HVAC",
      monthlyRevenue: 78000,
      timeInBusiness: "4 years",
      fundingNeed: 85000,
      useOfFunds: "Equipment replacement and payroll bridge",
      urgency: "2–4 weeks",
      status: "reviewing",
      source: "Partner referral",
      partnerId: "MS-FB-1024",
      assignedTo: "Moonshine Ops",
      createdAt: "2026-07-01T14:20:00.000Z",
      updatedAt: "2026-07-02T10:15:00.000Z",
      nextStep: "Request recent bank statements and equipment quote.",
      notes:
        "Owner has seasonal revenue swings. Position as review only; do not discuss approval expectations.",
      tags: ["equipment", "contractor", "documents-needed"]
    },
    {
      id: "lead_demo_002",
      businessName: "Luna & Co. Catering",
      contactName: "Elena Vargas",
      email: "elena@example.com",
      phone: "(555) 014-2202",
      industry: "Food Service",
      monthlyRevenue: 42000,
      timeInBusiness: "2 years",
      fundingNeed: 35000,
      useOfFunds: "Inventory and event season working capital",
      urgency: "This month",
      status: "needsInfo",
      source: "Affiliate content",
      partnerId: "MS-AF-2048",
      assignedTo: "Partner Follow-Up",
      createdAt: "2026-06-29T18:45:00.000Z",
      updatedAt: "2026-07-01T09:10:00.000Z",
      nextStep: "Clarify current deposits, event contracts, and revenue consistency.",
      notes:
        "Interested but not ready with documents. Send readiness checklist and schedule follow-up.",
      tags: ["working-capital", "food-service", "readiness"]
    },
    {
      id: "lead_demo_003",
      businessName: "Keystone Mobile Detailing",
      contactName: "Dante Brooks",
      email: "dante@example.com",
      phone: "(555) 014-3303",
      industry: "Automotive Services",
      monthlyRevenue: 26000,
      timeInBusiness: "18 months",
      fundingNeed: 22000,
      useOfFunds: "Second van buildout and marketing",
      urgency: "30 days",
      status: "new",
      source: "Partner widget",
      partnerId: "MS-RP-3110",
      assignedTo: "Unassigned",
      createdAt: "2026-07-03T11:05:00.000Z",
      updatedAt: "2026-07-03T11:05:00.000Z",
      nextStep: "Confirm business bank account, revenue documentation, and use-of-funds details.",
      notes:
        "New demo lead from widget. Needs initial review and readiness conversation.",
      tags: ["vehicle", "marketing", "new"]
    },
    {
      id: "lead_demo_004",
      businessName: "Northline Freight Repair",
      contactName: "Simone Carter",
      email: "simone@example.com",
      phone: "(555) 014-4404",
      industry: "Trucking / Repair",
      monthlyRevenue: 115000,
      timeInBusiness: "6 years",
      fundingNeed: 120000,
      useOfFunds: "Parts inventory and shop expansion",
      urgency: "2 months",
      status: "submitted",
      source: "COI intro",
      partnerId: "MS-COI-7331",
      assignedTo: "Funding Desk",
      createdAt: "2026-06-25T16:30:00.000Z",
      updatedAt: "2026-06-30T13:25:00.000Z",
      nextStep: "Awaiting provider review update.",
      notes:
        "Strong revenue profile in demo data. Continue avoiding outcome guarantees.",
      tags: ["trucking", "inventory", "submitted"]
    },
    {
      id: "lead_demo_005",
      businessName: "Brightside Dental Lab",
      contactName: "Nora Patel",
      email: "nora@example.com",
      phone: "(555) 014-5505",
      industry: "Healthcare Services",
      monthlyRevenue: 96000,
      timeInBusiness: "8 years",
      fundingNeed: 65000,
      useOfFunds: "Equipment upgrade and software implementation",
      urgency: "60–90 days",
      status: "funded",
      source: "Broker referral",
      partnerId: "MS-FB-1024",
      assignedTo: "Moonshine Ops",
      createdAt: "2026-05-20T12:00:00.000Z",
      updatedAt: "2026-06-15T12:20:00.000Z",
      nextStep: "Demo funded status for commission snapshot example.",
      notes:
        "Fictional funded lead used for dashboard examples. Not a real payout record.",
      tags: ["healthcare", "equipment", "demo-funded"]
    },
    {
      id: "lead_demo_006",
      businessName: "Atlas Creative Print Co.",
      contactName: "Theo Kim",
      email: "theo@example.com",
      phone: "(555) 014-6606",
      industry: "Printing / Manufacturing",
      monthlyRevenue: 39000,
      timeInBusiness: "3 years",
      fundingNeed: 40000,
      useOfFunds: "Receivables timing gap and materials purchase",
      urgency: "2 weeks",
      status: "declined",
      source: "Resource download",
      partnerId: "MS-AF-2048",
      assignedTo: "Funding Desk",
      createdAt: "2026-05-28T09:12:00.000Z",
      updatedAt: "2026-06-05T15:40:00.000Z",
      nextStep: "Send educational next-step checklist.",
      notes:
        "Fictional declined status. Use for showing non-funded outcomes and expectation setting.",
      tags: ["receivables", "materials", "declined"]
    }
  ];
})(window);
