# Partner Command Center roadmap

The current work moves the existing partner experience into a production Next.js application on the existing repository, Vercel project, and `platform-core` Supabase project. Each milestone should deliver a working route or workflow and preserve live integrations.

## Delivery order

1. **Foundation:** App Router, TypeScript, Tailwind, shared design tokens and components, strict checks, and a deployable build.
2. **Identity and data:** Supabase Auth, secure sessions, organization membership checks, typed database access, Row Level Security, and retry-safe actions using canonical tables.
3. **Partner workspace:** live profile, onboarding, referrals, tracking links, resources, and a dashboard with verified operational metrics.
4. **Operator workspace:** applications, partner directory, review actions, follow-up tasks, activity history, and integration status under operator permissions.
5. **Compatibility:** migrate public pages and legacy deep links without breaking Vercel APIs, Tally/webhook intake, Cloudflare Worker paths, widgets, or existing HubSpot, Notion, and Sheets adapters.
6. **Release:** CI and deployment checks, production route and API smoke checks, authenticated workflow verification, and clear separation of real data from demo data.
7. **Further utility:** search, filters, exports, training progress, partner program discovery, and commission reporting only where a verified accounting source supports it.

## Product rules

- Reuse the existing partner, membership, referral, tracking, activity, and intake contracts; migrate data only when a specific workflow requires it.
- Keep funding readiness and routing subject to human review. Do not automate approvals, lender submissions, pricing, or payable commission claims from estimates.
- Keep API keys and third-party credentials server-side. Audit meaningful operational writes and enforce organization scope in both server code and database policies.
- Treat sample data as sample data. A production dashboard must show honest empty and error states when verified records are unavailable.

Milestones are complete only when the corresponding code passes its checks and the deployed behavior has been observed. See the repository history and CI runs for implementation status.
