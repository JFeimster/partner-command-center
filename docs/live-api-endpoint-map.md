# Live Dashboard Endpoint Map

## Implemented

| Method | Route | Request / response contract owner |
|---|---|---|
| GET | `/api/dashboard/bootstrap` | Query/cookie or bearer session contract and safe dashboard projection are implemented in [`api/dashboard/bootstrap.js`](../api/dashboard/bootstrap.js); session claims, not query `partner_id`, establish identity. |
| GET | `/api/dashboard/distribution` | Session-derived profile and distribution projection in [`api/dashboard/distribution.js`](../api/dashboard/distribution.js). |
| PATCH | `/api/dashboard/profile` | Allowlisted profile patch and response in [`api/dashboard/profile.js`](../api/dashboard/profile.js). |
| POST | `/api/lead-router` | Canonical lead payload, attribution, validation and response in [`api/lead-router.js`](../api/lead-router.js); regression coverage in `tests/funding-leads.test.js`. |
| POST | `/api/partner-signup` | Partner signup payload, classification and response in [`api/partner-signup.js`](../api/partner-signup.js); contract coverage in partner signup tests. |
| POST | `/api/partner-events` | Trusted normalized lifecycle-event payload, deduplication and response in [`api/partner-events.js`](../api/partner-events.js). |
| POST | `/api/partner-email-ingest` | Forwarded notification input, parser output and ingestion result in [`api/partner-email-ingest.js`](../api/partner-email-ingest.js). |
| POST | `/api/partner-upsert` | Partner create/patch projection and response in [`api/partner-upsert.js`](../api/partner-upsert.js). |
| GET, POST | `/api/partner-get` | GET query or POST JSON partner lookup; restricted profile projection in [`api/partner-get.js`](../api/partner-get.js). |
| POST | `/api/partner-sync` | Notion-first sync request and downstream outcome in [`api/partner-sync.js`](../api/partner-sync.js). |
| POST | `/api/partner-tasks` | Partner follow-up task payload and result in [`api/partner-tasks.js`](../api/partner-tasks.js). |
| POST | `/api/partner-events-log` | Explicit partner activity event and result in [`api/partner-events-log.js`](../api/partner-events-log.js). |
| POST | `/api/partner-resources` | Approved resource assignment payload and result in [`api/partner-resources.js`](../api/partner-resources.js). |
| POST | `/api/partner-links` | Trusted tracking-link request and result in [`api/partner-links.js`](../api/partner-links.js). |
| POST | `/api/intake-message` | Authenticated Worker message envelope and intake classification in [`api/intake-message.js`](../api/intake-message.js). |
| POST | `/api/applicant-email-ingest` | Applicant email intake, case identity and destination result in [`api/applicant-email-ingest.js`](../api/applicant-email-ingest.js); intake/reconciliation tests cover idempotency and case rules. |
| GET | `/api/intake-health` | Configuration/readiness projection in [`api/intake-health.js`](../api/intake-health.js); not proof of delivery or backlog closure. |
| GET, POST | `/api/cleanup-backfill-artifacts` | GET inspection or separately authorized POST cleanup contract in [`api/cleanup-backfill-artifacts.js`](../api/cleanup-backfill-artifacts.js). Not executed in this task. |
| GET, POST | `/api/reconcile-applicants` | Authenticated bounded reconciliation contract in [`api/reconcile-applicants.js`](../api/reconcile-applicants.js). No live reconciliation was run. |
| POST | `/api/router` | Tally/default signup and partner action contracts, including signature checks, in [`api/router.js`](../api/router.js) and [`api/README.md`](../api/README.md). |

The repository also contains five scaffold functions named `*.example.js`. Their actual file-derived paths and methods are `POST /api/external-lead-webhook.example`, `GET /api/lead-status.example`, `POST /api/leads-submit.example`, `GET /api/partner-stats.example`, and `POST /api/tally-signup-webhook.example`; the `lead_id` for the scaffold status lookup is read from its query contract. Their purpose, intended future endpoints and limitations are documented in [`api/README.md`](../api/README.md) and the corresponding source files. These files are not the active contracts for partner workflows; confirm their deployed Preview behavior before removing or relocating them.

Each active handler is the exact request/response contract because request fields and response shapes are route-specific; `api/README.md` documents the shared response envelope where applicable. Keep handler and associated regression-test behavior unchanged while pages migrate. No separate generated OpenAPI schema currently exists.

The Next.js foundation keeps these root Vercel functions in place. Vercel documents root `api/` functions as supported with framework projects, while the App Router can also define functions under `app/api/`; do not duplicate an existing endpoint in `app/api/` during this batch.

## Planned partner-session routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/dashboard/leads` | Paginated partner-owned lead list |
| GET | `/api/dashboard/leads/:lead_id` | Public-safe partner-owned lead detail |
| GET | `/api/dashboard/events` | Partner-visible activity |
| GET | `/api/dashboard/tracking-links` | Tracking links and safe performance counts |
| GET | `/api/dashboard/resources` | Assigned and available resources |
| GET | `/api/dashboard/widgets` | Approved presets and partner assignments |
| GET | `/api/dashboard/commissions` | Estimated, verified, and paid projections |
| GET | `/api/dashboard/profile` | Editable and read-only profile fields |
| PATCH | `/api/dashboard/profile` | Update approved profile preferences |

## Route boundaries

```text
/api/router           partner intake orchestration
/api/partner-signup   partner signup
/api/partner-events   partner lifecycle/event ingestion
/api/lead-router      funding-readiness and partner-attributed leads
/api/dashboard/*      authenticated partner-safe projections
/admin/*              internal operator workflows
```

Dashboard routes derive partner identity from the authenticated session. They do not use a browser-selected partner ID as authorization.
