# Partner Command Center

Static-first Funding Partners OS for Moonshine Capital partner acquisition, partner onboarding, lead submission, partner tracking, marketplace offers, training resources, lightweight admin workflows, and future integration examples.

This repository is intentionally built as plain HTML, CSS, and vanilla JavaScript. No backend, database, auth provider, build tool, package manager, framework, or payment processor is required for the initial version.

## Project Identity

- **Repo:** `partner-command-center`
- **Product name:** Moonshine Partner Command Center
- **System name:** Funding Partners OS
- **Primary architecture:** Static HTML, CSS, and vanilla JavaScript
- **Primary users:** Funding partners, referral partners, affiliate partners, business funding brokers, small business growth partners, and Moonshine Capital operators
- **Primary business purpose:** Convert public visitors into partners, give partners a dashboard to submit and track leads, provide marketplace offers, resources, and training, support partner ID tracking, and prepare for future integrations, widgets, API examples, and admin workflows.

## What This Repo Is

This repo is the front-end operating layer for a partner-powered funding ecosystem.

It should support:

1. Public visitors discovering the partner program.
2. New partners joining through an access/signup flow.
3. Partners landing in a welcome/onboarding path.
4. Partners using a command center dashboard.
5. Partners submitting and tracking demo leads locally.
6. Partners browsing offers, resources, training, and tools.
7. Operators previewing admin workflows before backend buildout.
8. Developers reviewing static examples for future API, webhook, CRM, GPT, widget, and automation integrations.

## What This Repo Is Not Yet

This repo does **not** currently provide:

- Real authentication.
- Real user accounts.
- Real database persistence.
- Real underwriting.
- Real loan decisions.
- Real API endpoints.
- Real webhook processing.
- Real commission accounting.
- Real CRM synchronization.
- Real payment processing.

Any API, webhook, integration, or admin behavior included in this static version is a prototype, blueprint, local demo, or example-only implementation.

## Static-First Rules

The repo must remain deployable as a static site.

Baseline rules:

- Use plain `.html`, `.css`, and `.js` files.
- Use relative links wherever practical.
- Avoid framework-specific imports.
- Avoid build steps.
- Avoid backend assumptions.
- Use `localStorage` for local demo state.
- Use mock data files under `/data/` for examples.
- Use safe global namespaces:
  - `window.MoonshineOS`
  - `window.MoonshineData`
- Keep every page usable on static hosts like Vercel, Netlify, GitHub Pages, or local file review.

## Recommended Local Review

From the repo root:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

Primary routes after all batches:

```text
/
/dashboard.html
/partner-access.html
/marketplace.html
/resources.html
/pricing.html
/about.html
/compliance.html
/developers/
/admin/
/widgets/funding-widget.html
/tools/commission-simulator.html
```

## Existing Seed App

The current compact dashboard seed concept is expected to begin from:

```text
index.html
dashboard.html
dashboard.css
dashboard.js
README.md
```

Future batches should expand the seed app without turning it into bloated demo theater. Keep the dashboard practical, partner-facing, and conversion-aware.

## Final Target Repo Structure

```text
moonshine-partner-command-center/
  index.html
  dashboard.html
  dashboard.css
  dashboard.js
  partner-access.html
  marketplace.html
  resources.html
  pricing.html
  about.html
  compliance.html
  affiliate-disclosure.html
  privacy.html
  terms.html
  404.html

  /welcome/
    index.html
    welcome.css
    welcome.js

  /dashboard/
    dashboard-config.js
    dashboard-state.js
    partner-store.js
    lead-store.js
    resource-store.js
    affiliate-store.js
    dashboard-seed-data.js
    dashboard-renderers.js
    dashboard-actions.js

  /admin/
    index.html
    admin.css
    admin.js
    admin-config.js
    mock-admin-data.js

  /developers/
    index.html
    quickstart.html
    widget-docs.html
    crm-integrations.html
    ai-agents.html
    webhooks.html
    api-docs.html
    security.html

  /integrations/
    tally-partner-signup.md
    google-sheets-template.md
    crm-mapping.md
    zapier-notes.md
    make-scenario-blueprint.json
    gpt-schema.json
    openapi.json
    postman-collection.json
    notion-database-template.md

  /widgets/
    widget-config.js
    funding-widget.html
    funding-widget.css
    funding-widget.js
    embed.js
    README.md

  /tools/
    commission-simulator.html
    commission-simulator.css
    commission-simulator.js
    funding-readiness-checklist.html
    funding-readiness-checklist.css
    funding-readiness-checklist.js
    sales-script-generator.html
    sales-script-generator.css
    sales-script-generator.js

  /data/
    compliance-copy.js
    partner-paths.js
    dashboard-nav.js
    marketplace-offers.js
    resources.js
    training-modules.js
    sample-leads.js
    sample-partners.js
    sample-commissions.js
    sample-events.js

  /styles/
    tokens.css
    base.css
    components.css
    utilities.css
    public.css
    dashboard-extensions.css

  /scripts/
    config.js
    storage.js
    ui-utils.js
    form-utils.js
    route-utils.js
    affiliate-tracking.js
    analytics-lite.js

  /assets/
    logo.svg
    logo-mark.svg
    favicon.svg
    og-image.png
    /icons/
    /screenshots/
    /illustrations/

  /api/
    README.md
    leads-submit.example.js
    lead-status.example.js
    partner-stats.example.js
    external-lead-webhook.example.js
    tally-signup-webhook.example.js

  README.md
  ROADMAP.md
  CHANGELOG.md
  CONTRIBUTING.md
  vercel.json
  robots.txt
  sitemap.xml
```

## Batch Build Sequence

Build in controlled batches. Do not create the whole repo in one pass.

| Batch | Name | Output |
|---|---|---|
| 00 | Repo Build Map and Implementation Rules | Root documentation |
| 01 | Deployment and Root Utility Files | Vercel config, robots, sitemap, 404 |
| 02 | Global Design System | Shared CSS system |
| 03 | Shared Script Layer | Shared vanilla JS utilities |
| 04 | Data Layer | Mock data and reusable copy |
| 05 | Public Acquisition Pages | Homepage, marketplace, resources, pricing, about |
| 06 | Compliance and Legal Pages | Compliance, affiliate disclosure, privacy, terms |
| 07 | Partner Access and Welcome Flow | Signup/access flow and welcome screen |
| 08 | Dashboard Modular Support Files | Dashboard state, stores, renderers, actions |
| 09 | Dashboard Main File Upgrade | Upgraded partner dashboard |
| 10 | Tools Layer | Commission simulator, readiness checklist, script generator |
| 11 | Embeddable Widget Layer | Funding referral/readiness widget |
| 12 | Admin / Ops Static Prototype | Static operator dashboard |
| 13 | Developer Documentation Pages | Future integration docs |
| 14 | Integration Blueprints | Tally, Sheets, CRM, Zapier, Make, GPT, OpenAPI, Postman, Notion |
| 15 | API Example Layer | Example-only serverless/API files |
| 16 | Asset Placeholders and Final QA | SVG assets and QA checklist |

## LocalStorage Behavior

Static demo state may use browser `localStorage`.

Recommended key prefix:

```text
moonshine.partnerOS.
```

Suggested keys:

```text
moonshine.partnerOS.partnerProfile
moonshine.partnerOS.leads
moonshine.partnerOS.resources
moonshine.partnerOS.marketplaceFavorites
moonshine.partnerOS.affiliateAttribution
moonshine.partnerOS.trainingProgress
moonshine.partnerOS.notes
moonshine.partnerOS.events
moonshine.partnerOS.theme
moonshine.partnerOS.analytics
```

Rules:

- Never store sensitive borrower data in this demo version.
- Use fake/sample data for demos.
- Make export/import clearly labeled as local demo JSON.
- Include reset controls where useful.
- Do not imply data is synced with Moonshine Capital unless a real backend is later connected.

## Compliance Guardrails

All partner-facing and public copy must avoid promises or misleading claims.

Do not claim:

- Guaranteed funding.
- Guaranteed approval.
- Guaranteed income.
- Guaranteed commissions.
- Risk-free outcomes.
- That all applicants qualify.
- That partner activity creates automatic revenue.
- That demo lead submission is a real funding application.

Use language like:

- “Funding options may vary.”
- “Submission does not guarantee approval or funding.”
- “This static demo stores information locally in your browser.”
- “Partners are responsible for truthful, permission-based referrals.”
- “Projected commissions are examples only and are not guarantees.”
- “Educational and operational guidance only.”

## Accessibility Standards

Every build batch should consider:

- Semantic HTML landmarks.
- Proper form labels.
- Keyboard-friendly buttons and links.
- Visible focus states.
- Sufficient color contrast.
- Responsive layouts.
- Tables with useful headings.
- No interaction that requires hover-only behavior.

## Design Direction

Visual style:

- Premium dark-mode fintech/SaaS.
- Navy and charcoal foundation.
- Emerald and amber accents.
- Sharp typography.
- High-contrast CTA buttons.
- Subtle gradients.
- Clean dashboard cards.
- Practical partner workflows.
- Trust-building compliance blocks.

Avoid:

- Random neon soup.
- Bloated animation junk.
- Fake enterprise claims.
- Generic template sludge.
- Pretty nonsense that does not help the partner take action.

## Future Backend Upgrade Path

When the static version is validated, future backend work may include:

1. Partner authentication.
2. Real partner profile persistence.
3. Lead submission API.
4. Lead status tracking.
5. CRM integration.
6. Tally webhook ingestion.
7. Partner ID attribution service.
8. Marketplace offer management.
9. Commission reporting.
10. Admin moderation and compliance review.
11. GPT action integration.
12. Embeddable partner widgets with signed partner IDs.
13. Audit logging.
14. Consent and privacy workflows.

Until then, keep backend examples isolated under `/api/` and `/integrations/` as examples only.

## Primary Partner Flow

Recommended demo flow:

```text
index.html
  -> partner-access.html
    -> /welcome/index.html
      -> dashboard.html
```

Secondary routes:

```text
index.html
  -> marketplace.html
  -> resources.html
  -> pricing.html
  -> about.html
  -> compliance.html
```

## Primary CTAs

Public pages should generally use:

- **Primary CTA:** Join the Partner Program
- **Secondary CTA:** View Partner Dashboard

Dashboard pages should generally use:

- Submit Lead
- Copy Partner Link
- View Marketplace
- Continue Training
- Export Demo Data

## Deployment Notes

The repo should deploy as a static site. Vercel does not require a framework or build command.

Expected default settings:

- Framework preset: Other / Static
- Build command: none
- Output directory: repo root
- Install command: none

`vercel.json` in Batch 01 should preserve static routes and avoid implying real API availability.

## Maintainer Notes

This repo should be useful in three modes:

1. **As a live partner acquisition site.**
2. **As a partner-facing static command center demo.**
3. **As a blueprint for future backend/API/CRM automation.**

Keep it sharp, honest, and deployable. The mission is not to build a museum. The mission is to turn partner attention into partner action.
