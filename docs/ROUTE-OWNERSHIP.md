# Route Ownership

Issue #25 canonical route ownership matrix.

Legend: **CURRENT** = represented by the current implementation; **PLANNED** = target route/property; **OWNER** = canonical responsibility.

## Agency — public opportunity

| Route | State | Canonical owner |
|---|---|---|
| `/` | PLANNED | Agency |
| `/start` | PLANNED | Agency |
| `/how-it-works` | PLANNED | Agency |
| `/client-acquisition` | PLANNED | Agency |
| `/compensation` | PLANNED | Agency |
| `/tools` | PLANNED preview | Agency |
| `/training` | PLANNED preview | Agency |
| `/product-desk` | PLANNED preview | Agency |
| `/build-an-agency` | PLANNED | Agency |
| `/referral-partners` | PLANNED | Agency |
| `/leadership` | PLANNED preview | Agency |
| `/apply` | PLANNED | Agency |

Canonical host: `agency.distilledfunding.com`.

## Capital — public partner identity / conversion

| Route | State | Canonical owner |
|---|---|---|
| `/<partner-slug>` | PLANNED canonical share route | `moonshine-capital-portal` |
| `/directory` | CURRENT | `moonshine-capital-portal` |
| `/directory/[slug]` | CURRENT | `moonshine-capital-portal` |
| `/industries` | CURRENT/target discovery | `moonshine-capital-portal` |
| `/industries/[slug]` | CURRENT/target discovery | `moonshine-capital-portal` |
| `/funding-types` | CURRENT/target discovery | `moonshine-capital-portal` |
| `/funding-types/[slug]` | CURRENT/target discovery | `moonshine-capital-portal` |
| `/out` | CURRENT tracked routing | `moonshine-capital-portal` |
| `/api/intake/*` | CURRENT intake family | `moonshine-capital-portal` |

Canonical host: `capital.distilledfunding.com` when production readiness is established. Pending/unapproved profiles must never be publicly routable.

## App — authenticated Partner Command

The current repository exposes a dashboard shell, partner/lead APIs, resources, marketplace, tools, widgets, onboarding and related modules. The following are the canonical application route targets as the app is productionized:

| Route | State | Canonical owner |
|---|---|---|
| `/` | CURRENT | `partner-command-center` on its existing host; separate from Agency's planned `/` |
| `/dashboard` | CURRENT concept / target | `partner-command-center` |
| `/leads` | PLANNED canonical app route | `partner-command-center` |
| `/clients` | PLANNED | `partner-command-center` |
| `/links` | PLANNED | `partner-command-center` |
| `/campaigns` | PLANNED | `partner-command-center` |
| `/widgets` | CURRENT capability / target | `partner-command-center` |
| `/products` | PLANNED | `partner-command-center` |
| `/providers` | PLANNED | `partner-command-center` |
| `/marketplace` | CURRENT capability / target | `partner-command-center` |
| `/resources` | CURRENT capability / target | `partner-command-center` |
| `/training` | CURRENT capability / target | `partner-command-center` |
| `/commissions` | PLANNED | `partner-command-center` |
| `/team` | PLANNED | `partner-command-center` |
| `/leadership` | PLANNED | `partner-command-center` |
| `/settings` | PLANNED | `partner-command-center` |

Canonical host target: `app.distilledfunding.com`, **not assigned in Batches 1–2**.

### Existing Partner Command URL migration map

The source of truth for unmigrated pages remains the current HTML, CSS, JavaScript, and static assets. A route stays at its current path while its implementation moves in batches.

| Existing URL | Current implementation | Migration owner / state |
|---|---|---|
| `/` | `index.html`, public styles, tracking and analytics scripts | Partner Command; App Router homepage in batch 1 |
| `/about` | `about.html` and shared styles | Partner Command; legacy file retained |
| `/pricing` | `pricing.html` and shared styles | Partner Command; legacy file retained |
| `/marketplace` | `marketplace.html`, canonical offer data and scripts | Partner Command runtime; public catalog ownership remains Tools |
| `/resources` | `resources.html`, resource data and scripts | Partner Command runtime; public catalog ownership remains Tools |
| `/compliance` | `compliance.html` and compliance copy | Partner Command; legacy file retained |
| `/privacy` | `privacy.html` | Partner Command; legacy file retained |
| `/terms` | `terms.html` | Partner Command; legacy file retained |
| `/affiliate-disclosure` | `affiliate-disclosure.html` | Partner Command; legacy file retained |
| `/partner-access` | `partner-access.html`, signup/access scripts | Partner Command; keep signup and access contracts |
| `/welcome` | `welcome/index.html` and onboarding scripts | Partner Command; keep onboarding contract |
| `/dashboard` | `dashboard.html`, dashboard styles/scripts, `/api/dashboard/*` | Partner Command; dynamic App Router shell in batch 1 reuses existing markup and browser behavior |
| `/account` | `account.html` and account modules | Partner Command; legacy file retained |
| `/capital` | `capital.html` and marketplace/router modules | Partner Command; legacy file retained |
| `/growth` | `growth.html` and growth modules | Partner Command; legacy file retained |
| `/earn` | `earn.html` and production/commission modules | Partner Command; legacy file retained |
| `/team` | `team.html` and team modules | Partner Command; legacy file retained |
| `/learn` | `learn.html` and training/resource modules | Partner Command; legacy file retained |
| `/admin` | `admin/index.html` and admin modules | Partner Command; verify server authorization before adding intake visibility |
| `/admin/campaigns` | Campaign Studio in PR #82 (`admin/campaigns.html`) | Partner Command; continue that implementation, keep MC-001 a draft |
| `/admin/intake` | No equivalent page or authorized status API found | Partner Command Admin; proposed read-only page after operator access is confirmed |
| `/tools/commission-simulator` | `tools/commission-simulator.html` and scripts | Tools owns public discovery; preserve existing tool URL |
| `/tools/funding-readiness-checklist` | `tools/funding-readiness-checklist.html` and scripts | Tools owns public discovery; preserve existing tool URL |
| `/tools/sales-script-generator` | `tools/sales-script-generator.html` and scripts | Tools owns public discovery; preserve existing tool URL |
| `/developers/*` | Existing developer guide HTML files | Partner Command runtime; retain paths while content ownership is reviewed |
| `/widgets/funding-widget` | `widgets/funding-widget.html` and embed scripts | Partner Command runtime; preserve embed contract and URL |
| `/api/*` | Existing Vercel functions under `api/` | Vercel APIs; preserve handlers and request/response contracts during the frontend migration |

The Next.js foundation materializes only `/` and `/dashboard`; the build copies the remaining existing public static routes and assets into Next.js's `public/` output. The generated mirror is ignored and rebuilt from the existing source files. Vercel's `cleanUrls`/rewrite behavior owns extensionless legacy static URL resolution; local Next.js `start` does not model Vercel's clean URL routing, so those paths require Preview checks. Do not add a duplicate static content source.

## Wix bridge

`distilledfunding.com/brokers` owns SEO/informational acquisition only. It should ultimately route qualified opportunity traffic to `agency.distilledfunding.com`; it must not become another Partner Command or Capital profile system.

## Tools

`tools.distilledfunding.com` owns public canonical tool/resource discovery. `/tools` inside Agency is a preview and tools inside Partner Command are authenticated/federated operational surfaces, not competing source-of-truth catalogs.
