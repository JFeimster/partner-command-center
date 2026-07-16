# Live Dashboard Endpoint Map

## Implemented

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/dashboard/bootstrap` | Return the authenticated partner dashboard projection |
| POST | `/api/lead-router` | Receive canonical direct or partner-attributed funding-readiness leads |
| POST | `/api/partner-signup` | Create and classify a partner signup |
| POST | `/api/partner-links` | Create a trusted partner tracking link |

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
/api/lead-router      funding-readiness and partner-attributed leads
/api/dashboard/*      authenticated partner-safe projections
/admin/*              internal operator workflows
```

Dashboard routes derive partner identity from the authenticated session. They do not use a browser-selected partner ID as authorization.
