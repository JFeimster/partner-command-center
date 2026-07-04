/*
  Moonshine Partner Command Center
  Batch 04 — Sample Commissions

  Educational fictional commission data only.
*/

(function initSampleCommissions(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};

  window.MoonshineData.sampleCommissions = {
    disclaimer:
      "Commission data is fictional and for static dashboard planning only. It does not represent actual earnings, payout obligations, approval outcomes, or funded transactions.",

    summary: {
      periodLabel: "Demo Month",
      estimatedPending: 1850,
      demoPaid: 2750,
      projectedRangeLow: 750,
      projectedRangeHigh: 5200,
      demoFundedDeals: 3,
      pendingReviewDeals: 4,
      notes:
        "Values are sample projections and status placeholders. Actual commission programs require signed terms, verified funded outcomes, and operator review."
    },

    rows: [
      {
        id: "comm_demo_001",
        partnerId: "MS-FB-1024",
        partnerName: "Marcus Funding Desk",
        leadId: "lead_demo_005",
        businessName: "Brightside Dental Lab",
        status: "demo-paid",
        productType: "Equipment / Working Capital",
        fundedAmount: 65000,
        commissionAmount: 1750,
        estimatedPayoutDate: "2026-06-30",
        createdAt: "2026-06-15T12:20:00.000Z",
        notes: "Fictional paid example for dashboard display."
      },
      {
        id: "comm_demo_002",
        partnerId: "MS-COI-7331",
        partnerName: "LedgerBridge Advisors",
        leadId: "lead_demo_004",
        businessName: "Northline Freight Repair",
        status: "pending-review",
        productType: "Working Capital",
        fundedAmount: null,
        commissionAmount: 1200,
        estimatedPayoutDate: null,
        createdAt: "2026-06-30T13:25:00.000Z",
        notes: "Fictional pending review example. Not payable unless verified in a real system."
      },
      {
        id: "comm_demo_003",
        partnerId: "MS-AF-2048",
        partnerName: "Fintech Field Notes",
        leadId: "lead_demo_002",
        businessName: "Luna & Co. Catering",
        status: "needs-info",
        productType: "Working Capital",
        fundedAmount: null,
        commissionAmount: 350,
        estimatedPayoutDate: null,
        createdAt: "2026-07-01T09:10:00.000Z",
        notes: "Fictional example of a lead not ready for payout."
      },
      {
        id: "comm_demo_004",
        partnerId: "MS-FB-1024",
        partnerName: "Marcus Funding Desk",
        leadId: "lead_demo_001",
        businessName: "Harbor Street HVAC",
        status: "pending-review",
        productType: "Equipment",
        fundedAmount: null,
        commissionAmount: 650,
        estimatedPayoutDate: null,
        createdAt: "2026-07-02T10:15:00.000Z",
        notes: "Fictional estimate only. Terms and payout rules require real backend."
      },
      {
        id: "comm_demo_005",
        partnerId: "MS-RP-3110",
        partnerName: "Local Growth Loop",
        leadId: "lead_demo_003",
        businessName: "Keystone Mobile Detailing",
        status: "not-eligible-yet",
        productType: "Readiness",
        fundedAmount: null,
        commissionAmount: 0,
        estimatedPayoutDate: null,
        createdAt: "2026-07-03T11:05:00.000Z",
        notes: "Fictional not-eligible-yet example for expectation setting."
      }
    ],

    statusDefinitions: [
      {
        id: "demo-paid",
        label: "Demo Paid",
        description: "Fictional paid status for UI examples only."
      },
      {
        id: "pending-review",
        label: "Pending Review",
        description: "Potential commission placeholder; not earned or payable in the static demo."
      },
      {
        id: "needs-info",
        label: "Needs Info",
        description: "Lead requires more information before any funding or payout status could be evaluated."
      },
      {
        id: "not-eligible-yet",
        label: "Not Eligible Yet",
        description: "No commission projection should be treated as payable."
      }
    ]
  };
})(window);
