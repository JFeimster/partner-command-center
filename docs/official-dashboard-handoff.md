# Official Dashboard Handoff

## Canonical ownership

- `JFeimster/partner-command-center` owns the partner dashboard runtime, authentication boundary, APIs, contracts, persistence adapters, deployment, and release process.
- `JFeimster/fpos` remains the visual prototype and interaction reference.
- `JFeimster/am-i-fundable` owns funding-readiness scoring and result logic.
- `JFeimster/Embed-Widgets` owns widget preset definitions and embed surfaces.
- `JFeimster/partner-intake-os` owns partner intake and classification reference assets.
- `JFeimster/FundStack-AI` owns the public ecosystem and tool-routing surface.

## Runtime route

```text
/dashboard
```

## Partner modules

1. Overview
2. Leads
3. Tracking Links
4. Resources
5. Widgets
6. Commissions
7. Settings

## Operator boundary

Internal review queues, provider routing, internal notes, partner approval, commission verification, and data repair belong under `/admin/` or protected server routes. They are not partner dashboard modules.

## Data modes

- Demo mode uses fictional localStorage records and safe seed data.
- Live mode uses a signed partner session and `GET /api/dashboard/bootstrap`.
- Partner identity is derived server-side.
- Live lead status is read-only for partners.

## Standalone FPOS disposition

After the Partner Command Center release is verified, retain `fpos` as a visual reference or redirect its production domain to the canonical Partner Command Center dashboard. Do not add a second authentication, API, or persistence layer to `fpos`.
