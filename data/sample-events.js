/*
  Moonshine Partner Command Center
  Batch 04 — Sample Events

  Fictional local activity feed and admin timeline.
*/

(function initSampleEvents(window) {
  "use strict";

  window.MoonshineData = window.MoonshineData || {};

  window.MoonshineData.sampleEvents = [
    {
      id: "event_demo_001",
      type: "partner.created",
      label: "Partner profile created",
      actor: "Jordan Ellis",
      actorRole: "Funding Broker",
      partnerId: "MS-FB-1024",
      target: "Marcus Funding Desk",
      message: "Created a demo funding broker profile.",
      createdAt: "2026-07-01T13:00:00.000Z",
      icon: "user-plus",
      tone: "success"
    },
    {
      id: "event_demo_002",
      type: "lead.created",
      label: "New demo lead submitted",
      actor: "Jordan Ellis",
      actorRole: "Funding Broker",
      partnerId: "MS-FB-1024",
      target: "Harbor Street HVAC",
      message: "Submitted a demo lead for local browser tracking.",
      createdAt: "2026-07-01T14:20:00.000Z",
      icon: "send",
      tone: "info"
    },
    {
      id: "event_demo_003",
      type: "lead.status_updated",
      label: "Lead moved to reviewing",
      actor: "Moonshine Ops",
      actorRole: "Operator",
      partnerId: "MS-OPS-0001",
      target: "Harbor Street HVAC",
      message: "Updated fictional lead status from New to Reviewing.",
      createdAt: "2026-07-02T10:15:00.000Z",
      icon: "pipeline",
      tone: "success"
    },
    {
      id: "event_demo_004",
      type: "resource.saved",
      label: "Resource saved",
      actor: "Avery Stone",
      actorRole: "Affiliate Partner",
      partnerId: "MS-AF-2048",
      target: "Funding Partner Content Swipe File",
      message: "Saved a marketing resource for future promotion planning.",
      createdAt: "2026-07-02T18:00:00.000Z",
      icon: "bookmark",
      tone: "info"
    },
    {
      id: "event_demo_005",
      type: "link.copied",
      label: "Partner link copied",
      actor: "Mina Howard",
      actorRole: "Referral Partner",
      partnerId: "MS-RP-3110",
      target: "Default funding link",
      message: "Copied a demo partner link with local attribution.",
      createdAt: "2026-07-03T08:45:00.000Z",
      icon: "link",
      tone: "success"
    },
    {
      id: "event_demo_006",
      type: "lead.created",
      label: "Widget demo lead captured",
      actor: "Static Widget",
      actorRole: "Widget Prototype",
      partnerId: "MS-RP-3110",
      target: "Keystone Mobile Detailing",
      message: "Captured a fictional widget lead. Static demo only; no backend was called.",
      createdAt: "2026-07-03T11:05:00.000Z",
      icon: "widget",
      tone: "warning"
    },
    {
      id: "event_demo_007",
      type: "training.completed",
      label: "Training module completed",
      actor: "Priya Shah",
      actorRole: "Center of Influence",
      partnerId: "MS-COI-7331",
      target: "Compliance Basics",
      message: "Completed a required compliance training module in local demo progress.",
      createdAt: "2026-07-03T13:10:00.000Z",
      icon: "academy",
      tone: "success"
    },
    {
      id: "event_demo_008",
      type: "marketplace.favorite",
      label: "Marketplace offer favorited",
      actor: "Moonshine Operator",
      actorRole: "Operator",
      partnerId: "MS-OPS-0001",
      target: "CRM Mapping Blueprint",
      message: "Favorited an integration blueprint for future backend planning.",
      createdAt: "2026-07-03T16:30:00.000Z",
      icon: "star",
      tone: "info"
    },
    {
      id: "event_demo_009",
      type: "settings.exported",
      label: "Local demo data exported",
      actor: "Moonshine Operator",
      actorRole: "Operator",
      partnerId: "MS-OPS-0001",
      target: "Local JSON export",
      message: "Exported demo state from browser localStorage.",
      createdAt: "2026-07-04T08:00:00.000Z",
      icon: "download",
      tone: "warning"
    }
  ];
})(window);
