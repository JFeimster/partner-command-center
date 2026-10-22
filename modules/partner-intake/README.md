# Partner Intake Module

## Purpose

This module defines how Partner Command Center consumes partner signup and activation logic from `partner-intake-os` without turning the live product shell into a spaghetti cannon.

Sprint 00 is documentation only. It creates the local module contract for the first live workflow:

```text
partner signup -> activation -> dashboard access -> tracking links -> lead submission later
```

## Source-of-truth relationship

| Repo | Role |
|---|---|
| `partner-command-center` | Live product shell and dashboard destination. |
| `partner-intake-os` | Reference library for intake workflow, schemas, Tally fields, classification, onboarding, resources, and GPT/action docs. |

Partner Command Center should not duplicate the entire Partner Intake OS library. It should import the concepts that matter for the live product experience.

## What this module owns

This module defines:

- The Partner Command Center partner signup workflow.
- The partner data object expected by future live API and dashboard surfaces.
- Dashboard surfaces affected by partner activation.
- Boundaries between partner activation and downstream lead routing.

## What this module does not own yet

This module does not create:

- `/api/router.js`
- Notion client code
- Tally webhook code
- Live dashboard JavaScript
- Lead router logic
- OpenAPI actions

Those arrive in later sprints.

## First live workflow

The first live workflow is **partner signup and activation**.

Lead submission depends on partner identity and activation state. It must wait until `partner_id` exists.

## Current live intake sequence

```text
Tally partner signup (mOe658)
  -> Vercel /api/router (verified webhook signature)
     -> Supabase partner-crm-ingest
        -> atomic partner_applications + partner_intake_events
     -> existing Notion Partner CRM upsert + deterministic Notion intake event
  -> operator review and onboarding
  -> activated partner identity and portal access
  -> tracking links
  -> future attributed lead submission
```

The Supabase partner application is an intake object, not an automatically approved or activated partner. The separate Notion workflow is retained while canonical downstream projection is reconciled. Do not treat legacy synthetic partner records as real onboarded accounts. Funding-applicant forms must not enter this partner join relay.

**Activation handoff, October 22, 2026:** the user attested that the Tally form works and waived repeated signed Tally replay in this thread. Production configuration was verified via secret-free health endpoint and 401 authentication rejection tests. This is operator-accepted readiness, **not** evidence of a freshly observed signed end-to-end Tally delivery. Future live submission failures should be traced by the exact Tally submission ID before any recovery replay.

## Module files

| File | Purpose |
|---|---|
| `README.md` | Defines module purpose and source-of-truth relationship. |
| `workflow.md` | Defines the partner signup/activation workflow. |
| `data-contract.md` | Defines the partner data object. |
| `dashboard-spec.md` | Defines dashboard surfaces affected by activation. |

## Design principle

The partner record is the operating object. Not the form submission. Not the lead. Not the dashboard card. The partner record is the spine.