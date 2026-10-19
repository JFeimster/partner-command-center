# Source-of-Truth Map

## Sprint 00 correction

The first live workflow for Partner Command Center is **partner signup and activation**.

The first live workflow is **not lead routing**. Lead Submission + Funding Router depends on a known `partner_id`, partner profile context, partner status, and activation state. Leads come after partner identity exists. No partner identity, no live lead workflow. That is the seatbelt before the rocket. 

## System ownership

| System | Role | Source-of-truth boundary |
|---|---|---|
| `partner-command-center` | Live product shell | Public partner acquisition, partner access, welcome, dashboard, resources, tracking links, future live API router, and Notion-backed activation surfaces. |
| `partner-intake-os` | Intake/reference library | Partner intake workflow, schemas, classification logic, onboarding logic, GPT/action docs, Tally intake references, and dashboard data-contract guidance. |
| Tally | Signup form source | Captures partner signup intent and sends the raw signup payload. |
| `/api/router.js` | Implemented Vercel partner-action router | Routes the current partner signup, activation, lifecycle, classification, assignment, and event actions to existing server-side Notion helpers. Other Vercel APIs remain distinct where they own separate workflows. |
| Notion | Existing partner and funding workflow records | Stores the partner and funding records currently assigned to it; it is not replaced by a new CRM. |

## Live workflow order

```text
Tally partner signup
  -> API/router
  -> Notion Partner record
  -> partner_id
  -> onboarding path
  -> assigned resources
  -> dashboard access
  -> tracking links
  -> lead submission
```

## Workflow dependency rule

Live lead routing is blocked until all of the following exist:

1. `partner_id`
2. Partner status
3. Partner type
4. Partner tier or manual-review status
5. Onboarding path
6. Assigned resource/campaign context
7. Partner dashboard access path

If a lead submission lacks `partner_id`, the future live router must reject it instead of guessing attribution.

## Repo interpretation

The existing static Partner Command Center remains useful as the product shell and demo surface. Sprint 00 changes the **live integration order**, not the static-first design principle.

The new source-of-truth hierarchy is:

1. This file for repo/product ownership and sequencing.
2. `/docs/partner-signup-flow.md` for the first live workflow.
3. `/docs/live-system-roadmap.md` for sprint order and dependency gates.
4. `/modules/partner-intake/*` for Partner Command Center's local intake module contract.
5. `partner-intake-os` repo for deeper intake reference material.

## Non-goals in Sprint 00

Sprint 00 does not create:

- Live API routes.
- Notion client code.
- Tally webhook handlers.
- Browser-side Notion access.
- Lead routing logic.
- Authentication.
- Partner dashboard live mode.

Those belong to later sprints.

## Current implementation reconciliation — 2026-10-19

The sprint descriptions above retain the original sequencing decision; their statements that the router and live dashboard are future work are historical. Current `main` includes Vercel partner signup, partner lifecycle/event, dashboard bootstrap/profile/distribution, link/task/resource, lead, and applicant intake/reconciliation handlers. `/api/router` exists and serves the documented partner actions. The current route and method inventory is maintained in [`live-api-endpoint-map.md`](live-api-endpoint-map.md).

The canonical data owners remain unchanged: Cloudflare owns inbound email receipt/queue/retry; Vercel APIs orchestrate authenticated partner and applicant workflows; Notion owns the assigned partner/funding workflow records; HubSpot owns its existing CRM records; and the existing Master Applicants workbook remains the applicant spreadsheet. The frontend migration adds no data store and does not move any API or Worker handler in its first batch.

The frontend is currently static HTML/CSS/JavaScript with live Vercel API functions and an independent Cloudflare Worker. The measured Next.js migration begins with `/` and `/dashboard`; remaining legacy routes and public assets must continue to resolve from their current source files while each route batch is migrated.
