# Site Integration Map

## Decision

Use the strongest existing deployed surfaces as the Partner Command Center acquisition, workflow, and dashboard stack instead of forcing one weak frontend to do every job.

```text
External site / form / scorecard
→ Partner Command Center workflow module
→ router/API/action layer
→ Notion, Sheets, CRM, or future database
→ FPOS-style dashboard surface
```

Project architecture standard:

```text
Workflow Spec Pack → Custom GPT → OpenAPI Action Pack → Dashboard Module
```

## Site roles

| Site | Role | Modules | Priority |
|---|---|---|---|
| Funding Partners OS | Primary partner acquisition / direct-response sales page | Partner Intake, Campaign Builder, Partner Links | 1 |
| FundStack AI | Public ecosystem hub / tools / education | Resource Router, Funding Readiness, Partner Intake | 4 |
| FPOS | Dashboard shell / backend workspace style | All dashboard modules | 2 |
| Am I Fundable | Borrower readiness scorecard / lead magnet | Lead Router, Funding Readiness | 3 |
| BrokerFlow AI | Broker automation / follow-up page | Follow-Up Queue, Lead Router | 5 |
| PartnerLaunch | Widget suite / launch assets | Link Builder, Campaign Builder | 6 |

## Funding Partners OS

URL: `https://funding-partners-os.vercel.app/index.html`

Use as the primary partner acquisition page. Strong sales copy is allowed when true, sourced, partner-provided, or operationally accurate.

Keep strong claims when accurate:

- high-ticket commissions
- funding partner network
- 0% interest product references
- up to 4–6% on applicable products
- weekly payouts
- no license required for applicable commercial/referral role
- white-label portal
- strong CTA language

Only fix invented testimonials, fake scarcity, unsupported guarantees, claims implying every referred business gets funded, or anything materially false.

Flow:

```text
Funding Partners OS CTA
→ Tally partner intake mOe658
→ /api/router
→ Partner Intake workflow
→ Notion partner record/event
→ FPOS-style dashboard
```

## FundStack AI

URL: `https://fund-stack-ai.vercel.app/`

Use as the broader ecosystem hub for tools, resources, vertical pages, partner education, and funding path education.

Flow:

```text
FundStack AI tools/resources
→ Resource Router / Funding Readiness workflow
→ Tally, scorecard, or lead form
→ Partner Command Center module registry
```

## FPOS

URL: `https://fpos-blond.vercel.app/`

Use as the preferred dashboard shell reference. It already has stronger command-center utility: sidebar, overview, pipeline, marketing kits, configuration, localStorage, draggable cards, and widget tooling.

Flow:

```text
FPOS shell
→ replace deal objects with Partner Command Center module objects
→ connect module registry
→ connect router/API as workflows mature
```

## Am I Fundable

URL: `https://am-i-fundable.vercel.app/`

Use as the borrower-facing readiness scorecard and Lead Router feeder.

Flow:

```text
Am I Fundable scorecard
→ Lead Submission + Funding Router
→ partner attribution
→ funding path recommendation
→ admin review queue
→ partner lead status
```

## BrokerFlow AI

URL: `https://brokerflow-ai.vercel.app/`

Use as the broker automation and follow-up module surface.

Flow:

```text
BrokerFlow AI CTA
→ Broker Follow-Up GPT or workflow
→ Follow-Up Queue dashboard module
→ CRM note / task / draft message layer
```

## PartnerLaunch

URL: `https://partner-launch.vercel.app/`

Use later for partner widgets, launch pages, campaign kits, link builders, and co-branded tools.

Flow:

```text
PartnerLaunch widget tooling
→ Campaign / Tracking Link Builder
→ partner-specific embeds
→ tracking link records
→ dashboard activity
```

## Priority order

1. Funding Partners OS → Tally partner intake
2. FPOS → Partner Command Center dashboard v2 shell
3. Am I Fundable → Lead Router feeder
4. FundStack AI → ecosystem/resource hub alignment
5. BrokerFlow AI → Follow-Up module surface
6. PartnerLaunch → widget suite later

## Do not do

- Do not force the existing Partner Command Center frontend to become the only acquisition page.
- Do not water down strong partner sales copy unless a claim is false, invented, or operationally unsupported.
- Do not build every workflow into every site.
- Do not create new API endpoints for every surface before the module registry and router contract are clear.
