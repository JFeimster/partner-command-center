/*
  Moonshine Partner Command Center
  Batch 04 — Sample Partners

  Fictional partner profiles only.
*/

(function initSamplePartners(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};

  window.MoonshineData.samplePartners = [
    {
      id: "partner_demo_001",
      partnerId: "MS-FB-1024",
      name: "Marcus Funding Desk",
      contactName: "Jordan Ellis",
      email: "jordan@example.com",
      phone: "(555) 019-1024",
      type: "funding-broker",
      company: "Marcus Funding Desk",
      city: "Washington",
      state: "DC",
      primaryAudience: "Contractors, service businesses, and established local operators",
      channels: ["direct outreach", "referrals", "LinkedIn"],
      status: "active",
      joinedAt: "2026-05-04T13:00:00.000Z",
      lastActiveAt: "2026-07-03T19:35:00.000Z",
      leadCount: 12,
      demoFundedCount: 2,
      tags: ["broker", "contractors", "DC"],
      notes:
        "Fictional sample funding broker. Used for dashboard profile and commission examples."
    },
    {
      id: "partner_demo_002",
      partnerId: "MS-AF-2048",
      name: "Fintech Field Notes",
      contactName: "Avery Stone",
      email: "avery@example.com",
      phone: "(555) 019-2048",
      type: "affiliate-partner",
      company: "Fintech Field Notes",
      city: "Austin",
      state: "TX",
      primaryAudience: "Creators, gig operators, ecommerce sellers, and indie founders",
      channels: ["newsletter", "YouTube", "community posts"],
      status: "active",
      joinedAt: "2026-05-18T15:45:00.000Z",
      lastActiveAt: "2026-07-02T18:00:00.000Z",
      leadCount: 28,
      demoFundedCount: 1,
      tags: ["affiliate", "content", "newsletter"],
      notes:
        "Fictional affiliate partner. Good for content swipe and link builder examples."
    },
    {
      id: "partner_demo_003",
      partnerId: "MS-RP-3110",
      name: "Local Growth Loop",
      contactName: "Mina Howard",
      email: "mina@example.com",
      phone: "(555) 019-3110",
      type: "referral-partner",
      company: "Local Growth Loop",
      city: "Charlotte",
      state: "NC",
      primaryAudience: "Small local businesses and service providers",
      channels: ["warm intros", "events", "local groups"],
      status: "pending",
      joinedAt: "2026-06-10T10:25:00.000Z",
      lastActiveAt: "2026-07-01T16:20:00.000Z",
      leadCount: 4,
      demoFundedCount: 0,
      tags: ["referral", "local", "events"],
      notes:
        "Fictional referral partner. Use for onboarding and partner path examples."
    },
    {
      id: "partner_demo_004",
      partnerId: "MS-COI-7331",
      name: "LedgerBridge Advisors",
      contactName: "Priya Shah",
      email: "priya@example.com",
      phone: "(555) 019-7331",
      type: "center-of-influence",
      company: "LedgerBridge Advisors",
      city: "Philadelphia",
      state: "PA",
      primaryAudience: "Bookkeeping clients, agency owners, and business buyers",
      channels: ["client advisory", "email intros", "workshops"],
      status: "active",
      joinedAt: "2026-04-21T09:40:00.000Z",
      lastActiveAt: "2026-07-03T13:10:00.000Z",
      leadCount: 9,
      demoFundedCount: 1,
      tags: ["COI", "bookkeeping", "advisory"],
      notes:
        "Fictional center of influence. Used for warm referral and professional services workflows."
    },
    {
      id: "partner_demo_005",
      partnerId: "MS-OPS-0001",
      name: "Moonshine Ops",
      contactName: "Moonshine Operator",
      email: "ops@example.com",
      phone: "(555) 019-0001",
      type: "operator",
      company: "Moonshine Capital",
      city: "Remote",
      state: "US",
      primaryAudience: "Internal partner operations",
      channels: ["admin", "CRM", "automation"],
      status: "active",
      joinedAt: "2026-01-01T00:00:00.000Z",
      lastActiveAt: "2026-07-04T12:00:00.000Z",
      leadCount: 53,
      demoFundedCount: 7,
      tags: ["operator", "admin", "internal"],
      notes:
        "Internal fictional operator profile for static admin and dashboard demos."
    }
  ];
})(window);
