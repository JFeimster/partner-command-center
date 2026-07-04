/*
  Moonshine Partner Command Center
  Batch 11 — Widget Config

  Static embeddable widget configuration.
  No backend. No live submission.
*/

(function initMoonshineWidgetConfig(window) {
  "use strict";

  window.MoonshineWidget = window.MoonshineWidget || {};

  window.MoonshineWidget.config = {
    version: "0.1.0-static",
    widgetName: "Moonshine Funding Readiness Widget",
    brandName: "Moonshine Capital",
    storageKey: "moonshine.widget.demoLeads",
    eventPrefix: "moonshine.widget",

    defaults: {
      partnerId: "MS-WIDGET-DEMO",
      source: "embedded-widget",
      theme: "dark",
      title: "Check funding readiness",
      subtitle:
        "Share basic business context and organize the next step. This is not a funding application or approval decision.",
      ctaLabel: "Save Demo Inquiry",
      successTitle: "Demo inquiry saved",
      successMessage:
        "This static widget saved the inquiry locally in this browser. A live backend is required for real lead routing."
    },

    fields: {
      businessName: {
        label: "Business name",
        required: true,
        placeholder: "Example: Harbor Street HVAC"
      },
      contactName: {
        label: "Contact name",
        required: true,
        placeholder: "Owner or decision maker"
      },
      email: {
        label: "Email",
        required: false,
        placeholder: "owner@example.com"
      },
      phone: {
        label: "Phone",
        required: false,
        placeholder: "(555) 010-0000"
      },
      monthlyRevenue: {
        label: "Monthly revenue estimate",
        required: false,
        placeholder: "$50,000"
      },
      fundingNeed: {
        label: "Funding need estimate",
        required: false,
        placeholder: "$75,000"
      },
      useOfFunds: {
        label: "Use of funds",
        required: false,
        placeholder: "Inventory, payroll bridge, equipment, marketing, expansion..."
      },
      timeline: {
        label: "Timeline",
        required: false,
        options: [
          "Immediate",
          "2 weeks",
          "30 days",
          "60–90 days",
          "Planning ahead"
        ]
      }
    },

    disclaimers: {
      noGuarantee:
        "Funding options may vary. Submitting information does not guarantee approval, funding, rates, terms, timelines, lender review, or commissions.",
      staticDemo:
        "This static widget stores demo inquiries locally in the browser. It is not connected to a live CRM, lender system, underwriting process, or partner payout system.",
      privacy:
        "Do not enter Social Security numbers, bank logins, tax IDs, account numbers, private documents, or sensitive borrower data."
    },

    postMessageEvents: {
      ready: "moonshine.widget.ready",
      submitted: "moonshine.widget.submitted",
      error: "moonshine.widget.error",
      resized: "moonshine.widget.resized"
    }
  };

  window.MoonshineWidget.getConfig = function getConfig(path, fallback) {
    if (!path) return window.MoonshineWidget.config;

    var parts = String(path).split(".");
    var cursor = window.MoonshineWidget.config;

    for (var i = 0; i < parts.length; i += 1) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) {
        return fallback;
      }
      cursor = cursor[parts[i]];
    }

    return cursor == null ? fallback : cursor;
  };
})(window);
