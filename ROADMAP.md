# Moonshine Partner Command Center Roadmap

This roadmap turns the Partner Command Center from a compact static dashboard into a complete static-first Funding Partners OS.

The roadmap is intentionally batch-based. Each batch should produce repo-ready files that can be reviewed, committed, and deployed without waiting for a backend.

## Product North Star

Build a partner operating layer that helps Moonshine Capital:

- Acquire partners.
- Educate partners.
- Give partners a useful dashboard.
- Route partners to offers, tools, and resources.
- Capture demo leads locally.
- Preview future lead workflows.
- Support partner ID tracking.
- Prepare the repo for CRM, GPT, widget, webhook, and API integrations.

The first version should be useful as a static product demo and partner enablement site. The second version can connect to real systems after the workflows prove themselves.

## Roadmap Principles

1. **Static first, integration ready.**
   Build the front-end system before locking into backend infrastructure.

2. **Partner action beats pretty decoration.**
   Every page should help a partner join, learn, submit, track, share, or operate.

3. **Mock data is allowed. Fake claims are not.**
   Use realistic sample data, but do not imply live funding decisions, real commissions, or guaranteed outcomes.

4. **Local demo state is acceptable.**
   Use `localStorage` until a backend exists.

5. **Clear upgrade seams matter.**
   Keep mock data, scripts, dashboard state, API examples, and docs organized so future backend work is obvious.

6. **Compliance is part of the product.**
   Funding copy must stay useful without promising approvals, income, or outcomes.

## Build Phases

## Phase 1 — Foundation

Goal: Establish the repo map, deployment files, design system, shared scripts, and data layer.

Includes:

- Batch 00 — Repo Build Map and Implementation Rules
- Batch 01 — Deployment and Root Utility Files
- Batch 02 — Global Design System
- Batch 03 — Shared Script Layer
- Batch 04 — Data Layer

Acceptance criteria:

- Root docs explain the product and architecture.
- Static deployment config exists.
- Shared CSS foundation exists.
- Shared JavaScript helpers exist.
- Mock data is available under `/data/`.
- No backend dependency is introduced.

## Phase 2 — Public Partner Acquisition

Goal: Turn the root site into a conversion-oriented partner acquisition layer.

Includes:

- Batch 05 — Public Acquisition Pages
- Batch 06 — Compliance and Legal Pages
- Batch 07 — Partner Access and Welcome Flow

Acceptance criteria:

- Homepage explains the partner program.
- Marketplace and resources have useful previews.
- Pricing explains tiers/options without misleading claims.
- About page positions the ecosystem.
- Compliance, privacy, terms, and affiliate disclosure pages exist.
- Partner access form stores local demo partner profile.
- Welcome flow routes partner toward the dashboard.

## Phase 3 — Partner Dashboard OS

Goal: Upgrade the current dashboard into a modular partner command center.

Includes:

- Batch 08 — Dashboard Modular Support Files
- Batch 09 — Dashboard Main File Upgrade

Acceptance criteria:

- Dashboard uses namespaced support files.
- Dashboard can read/write local demo state.
- Partner profile is visible.
- Lead submission works locally.
- Lead tracker displays and updates demo leads.
- Marketplace offer cards are available.
- Partner links can be copied.
- Partner ID/referral link builder exists.
- Resource cards and training checklist exist.
- Commission snapshot is educational and clearly non-guaranteed.
- Integration readiness cards exist.
- Notes/CRM Lite exists.
- Theme toggle exists.
- Export/import local JSON exists.
- Compliance disclaimer block is visible.
- Empty states are handled.

## Phase 4 — Partner Utility Tools

Goal: Add practical standalone tools that partners can use outside the dashboard.

Includes:

- Batch 10 — Tools Layer
- Batch 11 — Embeddable Widget Layer

Acceptance criteria:

- Commission simulator produces educational projections.
- Funding readiness checklist scores preparedness without promising approval.
- Sales script generator creates compliance-safe scripts.
- Embeddable widget supports partner ID config.
- Widget works without a backend.
- Widget docs explain static limitations and future integration path.

## Phase 5 — Operator and Developer Enablement

Goal: Prepare operator workflows and future technical integration docs.

Includes:

- Batch 12 — Admin / Ops Static Prototype
- Batch 13 — Developer Documentation Pages
- Batch 14 — Integration Blueprints
- Batch 15 — API Example Layer

Acceptance criteria:

- Admin prototype is clearly labeled as static/demo.
- Operator views include partner overview, lead queue, offer manager mockup, resources manager mockup, commission placeholder, activity log, and compliance reminders.
- Developer docs explain widget, CRM, AI agent, webhook, API, and security concepts.
- Integration blueprints exist for Tally, Google Sheets, CRM, Zapier, Make, GPT actions, OpenAPI, Postman, and Notion.
- API examples are clearly marked as not live in the static version.

## Phase 6 — Asset Pass and QA

Goal: Add placeholder assets and run final repo-readiness review.

Includes:

- Batch 16 — Asset Placeholders and Final QA

Acceptance criteria:

- SVG logo placeholder exists.
- SVG logo mark placeholder exists.
- SVG favicon exists.
- Recommended future asset folders are documented.
- Navigation links are reviewed.
- Script dependencies are reviewed.
- localStorage keys are reviewed.
- Compliance language is reviewed.
- Responsive behavior is reviewed.
- Static deployment readiness is reviewed.

## Full Batch Index

| Batch | Name | Files |
|---|---|---|
| 00 | Repo Build Map and Implementation Rules | `README.md`, `ROADMAP.md`, `CHANGELOG.md`, `CONTRIBUTING.md` |
| 01 | Deployment and Root Utility Files | `vercel.json`, `robots.txt`, `sitemap.xml`, `404.html` |
| 02 | Global Design System | `/styles/tokens.css`, `/styles/base.css`, `/styles/components.css`, `/styles/utilities.css`, `/styles/public.css`, `/styles/dashboard-extensions.css` |
| 03 | Shared Script Layer | `/scripts/config.js`, `/scripts/storage.js`, `/scripts/ui-utils.js`, `/scripts/form-utils.js`, `/scripts/route-utils.js`, `/scripts/affiliate-tracking.js`, `/scripts/analytics-lite.js` |
| 04 | Data Layer | `/data/compliance-copy.js`, `/data/partner-paths.js`, `/data/dashboard-nav.js`, `/data/marketplace-offers.js`, `/data/resources.js`, `/data/training-modules.js`, `/data/sample-leads.js`, `/data/sample-partners.js`, `/data/sample-commissions.js`, `/data/sample-events.js` |
| 05 | Public Acquisition Pages | `index.html`, `marketplace.html`, `resources.html`, `pricing.html`, `about.html` |
| 06 | Compliance and Legal Pages | `compliance.html`, `affiliate-disclosure.html`, `privacy.html`, `terms.html` |
| 07 | Partner Access and Welcome Flow | `partner-access.html`, `/welcome/index.html`, `/welcome/welcome.css`, `/welcome/welcome.js` |
| 08 | Dashboard Modular Support Files | `/dashboard/dashboard-config.js`, `/dashboard/dashboard-state.js`, `/dashboard/partner-store.js`, `/dashboard/lead-store.js`, `/dashboard/resource-store.js`, `/dashboard/affiliate-store.js`, `/dashboard/dashboard-seed-data.js`, `/dashboard/dashboard-renderers.js`, `/dashboard/dashboard-actions.js` |
| 09 | Dashboard Main File Upgrade | `dashboard.html`, `dashboard.css`, `dashboard.js` |
| 10 | Tools Layer | `/tools/commission-simulator.html`, `/tools/commission-simulator.css`, `/tools/commission-simulator.js`, `/tools/funding-readiness-checklist.html`, `/tools/funding-readiness-checklist.css`, `/tools/funding-readiness-checklist.js`, `/tools/sales-script-generator.html`, `/tools/sales-script-generator.css`, `/tools/sales-script-generator.js` |
| 11 | Embeddable Widget Layer | `/widgets/widget-config.js`, `/widgets/funding-widget.html`, `/widgets/funding-widget.css`, `/widgets/funding-widget.js`, `/widgets/embed.js`, `/widgets/README.md` |
| 12 | Admin / Ops Static Prototype | `/admin/mock-admin-data.js`, `/admin/admin-config.js`, `/admin/index.html`, `/admin/admin.css`, `/admin/admin.js` |
| 13 | Developer Documentation Pages | `/developers/index.html`, `/developers/quickstart.html`, `/developers/widget-docs.html`, `/developers/crm-integrations.html`, `/developers/ai-agents.html`, `/developers/webhooks.html`, `/developers/api-docs.html`, `/developers/security.html` |
| 14 | Integration Blueprints | `/integrations/tally-partner-signup.md`, `/integrations/google-sheets-template.md`, `/integrations/crm-mapping.md`, `/integrations/zapier-notes.md`, `/integrations/make-scenario-blueprint.json`, `/integrations/gpt-schema.json`, `/integrations/openapi.json`, `/integrations/postman-collection.json`, `/integrations/notion-database-template.md` |
| 15 | API Example Layer | `/api/README.md`, `/api/leads-submit.example.js`, `/api/lead-status.example.js`, `/api/partner-stats.example.js`, `/api/external-lead-webhook.example.js`, `/api/tally-signup-webhook.example.js` |
| 16 | Asset Placeholders and Final QA | `/assets/logo.svg`, `/assets/logo-mark.svg`, `/assets/favicon.svg` |

## Priority Order

The order matters.

Do not build admin, API, widgets, or developer docs before the global design system, shared scripts, and data layer exist. Otherwise, the repo becomes a junk drawer with JavaScript in a trench coat.

Recommended order:

1. Documentation.
2. Deployment shell.
3. CSS design system.
4. Shared JS utilities.
5. Mock data.
6. Public pages.
7. Legal/compliance pages.
8. Access and welcome flow.
9. Dashboard support layer.
10. Dashboard upgrade.
11. Tools.
12. Widgets.
13. Admin prototype.
14. Developer docs.
15. Integration blueprints.
16. API examples.
17. Assets and QA.

## Future Backend Milestones

The static version should prepare for these future milestones without requiring them now.

### Milestone A — Real Partner Accounts

Possible work:

- Auth provider.
- Partner profile database.
- Partner onboarding status.
- Partner type permissions.
- Partner agreement storage.
- Partner ID persistence.

### Milestone B — Real Lead Intake

Possible work:

- Lead submission API.
- Required consent fields.
- Duplicate detection.
- Lead source attribution.
- Lead status model.
- CRM routing.
- Email notifications.

### Milestone C — CRM and Automation

Possible work:

- HubSpot, GoHighLevel, Airtable, Notion, or Google Sheets integration.
- Tally webhook ingestion.
- Zapier and Make scenarios.
- Admin status updates.
- Partner lead notifications.
- Activity logging.

### Milestone D — Partner Marketplace

Possible work:

- Offer database.
- Offer eligibility tags.
- Partner-specific recommendations.
- Favorite offers.
- Offer conversion tracking.
- Operator offer management.

### Milestone E — Commission Reporting

Possible work:

- Commission rules engine.
- Closed/funded lead reconciliation.
- Partner payout status.
- Exportable reports.
- Operator review workflow.

### Milestone F — Embeddable Partner Widget

Possible work:

- Signed partner IDs.
- Hosted widget config.
- Lead capture API.
- Event tracking.
- Partner website embeds.
- Origin/domain validation.

### Milestone G — GPT and Agent Integrations

Possible work:

- GPT action schemas.
- AI lead intake helper.
- Partner coaching agent.
- CRM summary agent.
- Follow-up script generator.
- Compliance review helper.

## Compliance Roadmap

Compliance should improve as functionality expands.

Static version:

- Clear disclaimers.
- No guarantees.
- Local demo labels.
- Educational language.
- Partner responsibility reminders.

Backend version:

- Consent records.
- Privacy policy alignment.
- Audit logs.
- Partner terms acceptance.
- Lead source tracking.
- Data retention policies.
- Role-based access controls.

## Done Means

A batch is considered done when:

- Every listed file exists.
- File paths match the roadmap.
- Code is complete, not pseudo-code.
- Static-first assumptions remain intact.
- No backend dependency is introduced unless explicitly marked example-only.
- Compliance-safe language is included where relevant.
- Responsive/mobile behavior is considered.
- Naming is repo-ready.
- Links are relative and predictable.
