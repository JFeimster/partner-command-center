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

## Wix bridge

`distilledfunding.com/brokers` owns SEO/informational acquisition only. It should ultimately route qualified opportunity traffic to `agency.distilledfunding.com`; it must not become another Partner Command or Capital profile system.

## Tools

`tools.distilledfunding.com` owns public canonical tool/resource discovery. `/tools` inside Agency is a preview and tools inside Partner Command are authenticated/federated operational surfaces, not competing source-of-truth catalogs.
