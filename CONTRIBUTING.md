# Contributing to Partner Command Center

Build production-capable partner and operator workflows in the existing Next.js repository. Preserve the current Vercel APIs, webhooks, widgets, and legacy links while routes migrate.

## Before editing

- Confirm the repository root, branch, remote, and working tree. Keep unrelated changes intact.
- Inspect the relevant existing route, service, database contract, and tests before adding another implementation.
- Use the existing `platform-core` Supabase project. Check schema and Row Level Security before proposing migrations.

## Implementation

- Use TypeScript in `app/` and React components; keep server secrets in server-only modules and Vercel environment variables.
- Validate inputs at API and action boundaries. Enforce authenticated organization membership and operator permissions on the server and in database policies.
- Keep writes idempotent where webhooks or retries can repeat them. Record meaningful operational events without exposing borrower data in logs.
- Preserve public routes, API response contracts, attribution parameters, and standalone widgets during migration.
- Use localStorage only for preferences, disposable drafts, and explicitly labeled demos. Persist real referrals, links, profiles, and tasks through authenticated services.
- Show verified funding and commission facts only. Use advisory language and human review for partner or funding decisions.
- Make controls keyboard accessible, responsive, and functional; provide loading, empty, error, and success states for data workflows.

## Validate and release

Use Node.js 24:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

Add focused tests for security boundaries, intake and referral writes, route compatibility, and changed UI behavior. Do not replace meaningful checks with snapshots that only repeat implementation details.

Commit focused changes on a branch and use the repository's pull request workflow. CI runs the commands above on pull requests and `main` pushes; Vercel automatic deployments remain enabled. After merge, inspect the actual deployment and smoke test affected production routes, authenticated flows, and integrations. A green build alone does not prove a live external integration.
