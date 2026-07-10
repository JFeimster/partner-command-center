# Dashboard Selection Report

## Decision

Use the **FPOS dashboard shell** from `JFeimster/fpos` as the visual and interaction foundation for live partners.

Keep **Partner Command Center** as the product owner, authentication boundary, API owner, data contract owner, deployment target, and system-of-record integration layer.

This is a shell migration, not a new standalone platform:

```text
FPOS visual shell and interaction model
        ↓
Partner Command Center dashboard runtime
        ↓
Partner Command Center APIs and Notion-backed records
```

Do not make FPOS a separate source of truth. Its localStorage records, simulated statuses, commission math, and placeholder telemetry must be replaced by Partner Command Center data.

## Why FPOS wins

FPOS is the strongest foundation for the first live partner dashboard because it has the best combination of:

- simple four-section navigation
- clear dark fintech presentation
- responsive mobile header and menu
- useful overview metrics
- understandable pipeline board
- commission-estimate visibility
- built-in referral/widget configuration concepts
- static-first implementation compatible with Partner Command Center
- low migration cost compared with introducing a second React application

Its weakness is not the shell. Its weakness is the data layer: the current implementation persists deals and settings in localStorage and displays simulated telemetry. That layer should be removed during integration.

## Candidate comparison

Scores use a 1–5 scale. A higher implementation-effort score means easier and faster to integrate.

| Candidate | Visual | Simplicity | Mobile | Overview | Deals / leads | Commissions | Links / assets | Data readiness | Integration speed | White-label | Overall role |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **FPOS** | 5 | 5 | 4 | 4 | 5 | 5 | 4 | 1 | 5 | 4 | **Selected shell** |
| Partner Command Center dashboard | 3 | 2 | 4 | 4 | 4 | 3 | 5 | 3 | 5 | 4 | Data and module source |
| Funding Partners OS – Agent Dashboard | 4 | 4 | 2 | 4 | 4 | 2 | 2 | 4 | 3 | Auth/data-pattern source |
| PartnerLaunch | 4 | 2 | 4 | 4 | 3 | 2 | 4 | 3 | 2 | Later growth-suite integration |
| Embed Widgets | 4 | 3 | 4 | 2 | 2 | 1 | 5 | 3 | 3 | Widget module source only |
| EliteBroker AI | 4 | 1 | 3 | 4 | 4 | 3 | 3 | 1 | 1 | Inspiration only; too broad |
| Funding Partners OS public site | 4 | 4 | 4 | 1 | 1 | 1 | 2 | 1 | 3 | Marketing site, not dashboard |

`funding-partners-os-dashboard` is the repository whose package identifies it as the “Funding Partners OS — Agent Dashboard”; it is not counted twice.

## Candidate findings

### 1. FPOS

**Strengths**

- Best visual hierarchy and fastest partner comprehension.
- Four primary areas: Overview, Pipeline, Marketing, Configuration.
- Responsive mobile header and collapsible navigation.
- Overview already emphasizes pipeline count, volume, and projected commissions.
- Pipeline uses a compact Kanban model.
- Marketing section already introduces referral identity and widget-code distribution.
- Static HTML/JavaScript fits the existing Partner Command Center architecture.

**Weaknesses to remove**

- localStorage-only deals and settings.
- invented underwriting and system telemetry language.
- locally editable commission percentages treated as if authoritative.
- simulated deal statuses and volume.
- placeholder referral URLs and widget scripts.

### 2. Partner Command Center dashboard

**Strengths**

- Already located in the correct owner repository.
- Broadest ecosystem coverage: onboarding, lead submission, lead tracker, marketplace, partner links, resources, training, commissions, partner identity, integrations, notes, and settings.
- Existing partner-attributed lead router and Notion adapters are already in the same repository.
- Strong public-safe and privacy-aware copy.
- Responsive card and form styles already exist.

**Weaknesses**

- Too many sections for a first live-partner release.
- Current screen reads like a module catalog rather than a focused daily workspace.
- localStorage language and demo behavior remain visible.
- Partner workflows, operator/admin workflows, and future modules are mixed together.

**Use in selected design**

Reuse its APIs, field maps, partner profile logic, links, resources, event model, compliance boundaries, and dashboard actions. Do not preserve the current 13-item navigation.

### 3. Funding Partners OS – Agent Dashboard

**Strengths**

- React Router and Supabase authentication patterns.
- Protected dashboard route.
- Clean Overview, Deals, and Marketing separation.
- Current production deployment is READY.

**Weaknesses**

- Fixed desktop sidebar and `ml-64` main layout are weaker on mobile.
- Limited modules compared with the required Partner Command Center scope.
- Introducing it as the primary shell would create a second React/Vite application and duplicate routing, styling, and deployment concerns.

**Reuse**

Use its authenticated-session pattern, route guards, and data-loading concepts where useful. Do not adopt the full shell.

### 4. PartnerLaunch

**Strengths**

- Strong growth-suite modules: partner network, leads, tracking, toolkit, content, academy, billing, and AI tools.
- Better fit for agencies and partner-network operators than a funding-only dashboard.

**Weaknesses**

- Too broad for the first live funding-partner MVP.
- Current connected production build is failing because `MarketingToolkit.tsx` imports a non-existent `Facebook` icon from `lucide-react`.
- Its product role is now broader agency growth, not the canonical funding-partner operating dashboard.

**Reuse later**

Campaign assets, content tools, academy modules, and partner-network views can be linked or selectively ported after the core dashboard is live.

### 5. Embed Widgets

Embed Widgets is not a dashboard foundation. It is the funding-specific white-label widget product. Reuse its widget preset cards, embed-code examples, configuration fields, and activation status in a dedicated Widgets module.

### 6. EliteBroker AI

EliteBroker AI has broad visual and module inspiration, including pipeline, qualifier, resources, marketing, academy, settings, and network concepts. It is too large and AI-Studio-oriented for the partner MVP, uses localStorage-oriented configuration patterns, and has no confirmed connected Vercel project in the current project list. Reuse ideas only.

## Primary dashboard shell

### Selected shell

**FPOS visual shell implemented inside `JFeimster/partner-command-center`.**

Recommended route:

```text
/dashboard/
```

Recommended initial navigation:

1. Overview
2. Leads
3. Links
4. Resources
5. Widgets
6. Commissions
7. Settings

On mobile, expose Overview, Leads, and Submit Lead as the first-level actions; place the remaining modules in the menu.

## Components to reuse

| Source | Reuse |
|---|---|
| FPOS | dark shell, mobile navigation, metric cards, compact pipeline, commission estimate card, settings layout |
| Partner Command Center | partner profile, lead router, event feed, attribution links, resources, compliance copy, Notion adapters |
| Funding Partners OS Agent Dashboard | protected-session and authenticated data-fetch patterns |
| Embed Widgets | widget preset cards, configuration summary, iframe/JavaScript embed code |
| PartnerLaunch | campaign/content/academy modules after MVP |
| EliteBroker AI | notification density and resource-vault inspiration only |

## Ownership rules

- Partner Command Center owns the dashboard runtime and API.
- Partner Command Center owns partner identity and access authorization.
- Am I Fundable owns readiness scoring.
- Embed Widgets owns widget preset definitions and embed surfaces.
- Notion remains the operational persistence layer until replaced by a dedicated database.
- Dashboard users may view safe lead progress; they may not directly modify underwriting decisions, provider matches, or internal review notes.
- Commission values are estimates until explicitly verified and posted by an authorized operator.

## Deployment findings

- FPOS production deployment is READY at `fpos-blond.vercel.app`.
- Funding Partners OS Agent Dashboard production deployment is READY.
- Partner Command Center production deployment is READY.
- Embed Widgets production deployment is READY.
- PartnerLaunch has an older accessible deployment, but its current connected production build is in ERROR.

## Final recommendation

Build the live partner MVP by **transplanting the FPOS shell into Partner Command Center and replacing every localStorage or simulated value with the dashboard data contract**. This delivers the visual quality the partner experience needs without creating another backend, another auth system, or another competing dashboard repository.
