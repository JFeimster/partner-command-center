# Partner Command Center

Moonshine Partner Command Center is a Funding Partners OS for partner acquisition, referrals, attribution, onboarding, and operator follow-up. The deployed application uses Next.js App Router, TypeScript, React, and Tailwind CSS while retaining the working Vercel API functions and legacy HTML routes during migration.

Funding information is advisory and subject to human review. The product does not make credit decisions, guarantee funding, or calculate payable commissions from sample data.

## Run locally

Use Node.js 24 and npm from the repository root:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Run the release checks before pushing:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

`npm run test` includes the existing API, integration, and legacy UI contract tests. Some integration tests use synthetic fixtures; passing them does not establish that an external service or authenticated production workflow is healthy.

## Code map

- `app/`: Next.js public, partner, and operator routes, layouts, and route boundaries.
- `components/`: shared React interface components.
- `lib/`: server-side services, validation, database access, and existing integration clients.
- `api/`: existing Vercel functions and webhook consumers retained for compatibility.
- `dashboard/`, `scripts/`, `styles/`, root `*.html`: legacy experience and standalone assets being migrated route by route.
- `widgets/`: embeddable surfaces that must keep their existing consumer contracts.
- `tests/`: Node regression and contract tests.
- `.github/workflows/`: CI and focused integration validation.

Prefer the existing `platform-core` Supabase project (`loaowmappekunngjknnx`) and its organization, membership, partner, referral, link, and activity contracts. Check the current schema and policies before adding migrations. Authenticated partner or operator actions must use organization-scoped permissions. Privileged credentials and integration tokens remain server-side; only public Supabase connection values may enter browser code.

Partner access uses a verified email sign-in and an active partner record in the same organization. A partner claims the matching record, completes `/dashboard/onboarding`, and can update business context in `/dashboard/profile`. Operators use `/operator/applications`, `/operator/tasks`, and `/operator/partners` to review canonical records. `tests/supabase-activation-smoke.sql` exercises partner isolation and operator actions with synthetic identities inside a rolled-back transaction.

## Routes and compatibility

The App Router is the target for public pages, partner workspace, and operator workspace. Keep existing deep links, Vercel API consumers, webhooks, and embeddable widgets working while their implementation moves. Do not import sample partner records, leads, or earnings into production tables. Browser storage is for display preferences, temporary state, and clearly labeled demos; durable business actions belong in authenticated server APIs and canonical database tables.

## Deployment

The existing Vercel project deploys through its GitHub integration. `vercel.json` keeps `git.deploymentEnabled: true`. CI runs on pull requests and `main` pushes with Node.js 24, `npm ci`, typecheck, lint, test, and build. A successful local build or CI run is separate from production verification; confirm the deployment and relevant authenticated and API flows after merge.

Configure environment variables in the existing Vercel project for the environment that needs them. Do not commit `.env` files or print tokens in logs. Existing Tally, Notion, HubSpot, Google Sheets, Cloudflare Worker, and BrokerFlow pathways should continue using their established server-side credentials and endpoint contracts.

The existing verified Tally join webhook forwards form `mOe658` to the canonical `partner-crm-ingest` Edge Function when **both** server-only `PARTNER_CRM_INGEST_URL` and `PARTNER_CRM_INGEST_TOKEN` are configured. The URL must be `https://loaowmappekunngjknnx.supabase.co/functions/v1/partner-crm-ingest`. Set the matching token and `PARTNER_CRM_ORG_ID` in Supabase Edge Function secrets. Without these settings the legacy Notion intake path remains active. A configured relay fails closed on an upstream error so Tally can retry the same submission id; the Edge Function deduplicates it. Funding applicant forms are excluded.

## Partner CRM activation — operator handoff (2026-10-22)

**Operating decision:** Tally form `mOe658` and its webhook are accepted as working based on the owner's confirmation. Do not block partner operations or require another synthetic Tally submission solely to reproduce an already working form. This is an **operator acceptance**, not a claim that a fresh signed Tally-to-Supabase end-to-end replay was independently witnessed by the activation thread.

**Verified production evidence:**

- Tally form `mOe658` has an enabled webhook pointing to `https://partner-command-center-rho.vercel.app/api/router` (owner-supplied UI evidence); a prior delivery returned HTTP 201 on October 18, before the canonical relay deployment.
- `PARTNER_CRM_INGEST_URL` and `PARTNER_CRM_INGEST_TOKEN` are present for **Vercel Production** (owner-supplied UI evidence). Production `GET /api/intake-health` responded HTTP 200 with `partner_crm: { configured: true, endpoint_matches_canonical: true }`. This indicates configuration, **not delivery or token equivalence**.
- The `partner-crm-ingest` Supabase Edge Function is deployed and active. An invalid bearer token was rejected with 401 rather than reporting missing integration configuration; the router also rejected unsigned requests with 401. No production credential values were read or logged.
- The PostgreSQL `public.ingest_partner_application` RPC is callable by `service_role`, not `anon` or `authenticated`. A synthetic same-ID test verified duplicate detection and application/event atomicity within a **rolled-back transaction**, without leaving synthetic application rows.
- The new canonical relay and safe reporting behavior shipped in [PR #91](https://github.com/JFeimster/partner-command-center/pull/91); the secret-free readiness check shipped in [PR #97](https://github.com/JFeimster/partner-command-center/pull/97).

**Known boundaries:** No fresh signed webhook delivery from the public Tally form was independently observed in that thread (automated submission encountered CAPTCHA). Do not label this an independently proven end-to-end acceptance test. Do not replay historical applications to manufacture evidence. Two other canonical application records observed on October 22 originated from a separate Tally form and an `activation_test` source; they are not evidence of the `mOe658` path.

**Operating policy:** Handle the next genuine new `mOe658` application through the live workflow. On a reported delivery issue, correlate the **submission ID** across the Tally webhook event, Vercel router response/logs, Supabase `partner_applications` and `partner_intake_events`, and the Notion event before taking a retry or recovery action. An exact replay should leave one canonical application and one canonical intake event, but the Notion event lookup is a sequential retry guard, not a distributed concurrency lock. Do not count `metadata.fictional = true` QA partners as real active partners, and do not create duplicate HubSpot/Notion records.

The next focus is real-applicant reconciliation, idempotent downstream projection and operational monitoring—not another manual Tally acceptance gate.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for implementation and release rules and [ROADMAP.md](ROADMAP.md) for the migration sequence.
