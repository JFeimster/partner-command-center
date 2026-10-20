# Partner Command Center

Moonshine Partner Command Center is a Funding Partners OS for partner acquisition, referrals, attribution, onboarding, and operator follow-up. The application is moving to Next.js App Router, TypeScript, React, and Tailwind CSS while retaining the working Vercel API functions and legacy HTML routes during migration.

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

## Routes and compatibility

The App Router is the target for public pages, partner workspace, and operator workspace. Keep existing deep links, Vercel API consumers, webhooks, and embeddable widgets working while their implementation moves. Do not import sample partner records, leads, or earnings into production tables. Browser storage is for display preferences, temporary state, and clearly labeled demos; durable business actions belong in authenticated server APIs and canonical database tables.

## Deployment

The existing Vercel project deploys through its GitHub integration. `vercel.json` keeps `git.deploymentEnabled: true`. CI runs on pull requests and `main` pushes with Node.js 24, `npm ci`, typecheck, lint, test, and build. A successful local build or CI run is separate from production verification; confirm the deployment and relevant authenticated and API flows after merge.

Configure environment variables in the existing Vercel project for the environment that needs them. Do not commit `.env` files or print tokens in logs. Existing Tally, Notion, HubSpot, Google Sheets, Cloudflare Worker, and BrokerFlow pathways should continue using their established server-side credentials and endpoint contracts.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for implementation and release rules and [ROADMAP.md](ROADMAP.md) for the migration sequence.
