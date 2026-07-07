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

## Required live sequence

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

## Module files

| File | Purpose |
|---|---|
| `README.md` | Defines module purpose and source-of-truth relationship. |
| `workflow.md` | Defines the partner signup/activation workflow. |
| `data-contract.md` | Defines the partner data object. |
| `dashboard-spec.md` | Defines dashboard surfaces affected by activation. |

## Design principle

The partner record is the operating object. Not the form submission. Not the lead. Not the dashboard card. The partner record is the spine.