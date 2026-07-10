# Dashboard Module Map

## Product boundary

The dashboard is the authenticated partner workspace for Partner Command Center. It is not an underwriting console, lender portal, CRM replacement, or internal operator queue.

The FPOS shell supplies the presentation and navigation model. Partner Command Center supplies the data, permissions, APIs, and workflow rules.

## MVP navigation

| Order | Module | Primary purpose | MVP |
|---:|---|---|---|
| 1 | Overview | Show the partner what happened and what to do next | Yes |
| 2 | Leads | Submit and track partner-attributed funding leads | Yes |
| 3 | Links | Create and copy attribution-safe campaign links | Yes |
| 4 | Resources | Access assigned marketing and education assets | Yes |
| 5 | Widgets | Deploy approved Embed Widgets presets | Yes |
| 6 | Commissions | Show clearly labeled estimates and verified payouts | Yes, limited |
| 7 | Settings | Manage profile, brand, notification, and destination preferences | Yes |
| 8 | Campaigns | Group links, widgets, resources, and performance | Later |
| 9 | Academy | Training and certification content | Later |
| 10 | Network | Sub-partner or agency-team management | Later |
| 11 | Integrations | CRM/webhook/provider configuration | Later |

## Module specifications

### Overview

**Source inspiration:** FPOS overview cards and Partner Command Center event feed.

**Required components**

- partner welcome and status
- onboarding completion
- total submitted leads
- active leads
- leads needing partner action
- funded count
- submitted funding volume
- estimated commissions
- verified commissions, when available
- tracked-link clicks
- recent activity
- unread notifications
- primary next action

**Data sources**

- Partner record
- Funding Leads
- Partner Events
- Tracking Links
- commission projection service

**Safety rules**

- Do not display lender/provider identities unless explicitly authorized.
- Do not display internal notes, exact underwriting reasoning, raw documents, or sensitive applicant fields.
- Label commission numbers as `Estimated` or `Verified`; never blend them.

### Leads

**Source inspiration:** FPOS compact pipeline and Partner Command Center lead form/router.

**Views**

- list/table on mobile and desktop
- optional Kanban on desktop
- lead detail drawer/page
- submit-lead action
- filters for status, source, campaign, and date

**Partner-visible statuses**

- new
- readiness_complete
- awaiting_documents
- in_review
- partner_action_needed
- reviewed
- nurture
- closed

Internal routing and underwriting statuses must map into these public-safe values.

**Lead card fields**

- lead ID
- business display name
- submitted date
- public status
- requested amount range or submitted amount
- readiness tier
- primary funding family
- source
- campaign
- widget
- next action
- last updated
- estimated commission, when permitted

**Actions**

- submit lead
- open safe detail
- copy lead ID
- supply requested non-sensitive information through an approved route
- open Am I Fundable result, where permitted

Partners must not directly set funded, approved, declined, provider match, or verified commission status.

### Links

**Source inspiration:** Partner Command Center link builder and FPOS marketing kit.

**Required components**

- approved destination selector
- partner ID applied server-side
- tracking-link key
- campaign ID
- optional widget ID
- UTM builder
- copy link
- QR code later
- status: active, paused, archived
- clicks and lead submissions

**Data source**

Tracking Links database.

**Rules**

- Use stable external tracking keys, not Notion auto-increment row numbers.
- Preserve first-touch and latest-touch attribution.
- Direct traffic must not be assigned a fake partner.

### Resources

**Source inspiration:** Partner Command Center Resources and EliteBroker resource-vault layout.

**Required components**

- assigned resources
- resource category
- file or destination URL
- format
- campaign/vertical tags
- compliance status
- last updated
- copy/download/open action

**MVP categories**

- email
- social
- landing pages
- funding education
- readiness tools
- vertical campaigns
- partner recruitment
- disclosures

**Data source**

Partner Resources database plus partner-resource assignment relation.

### Widgets

**Source inspiration:** Embed Widgets.

**Required components**

- approved widget presets
- activation status
- partner/campaign attribution summary
- preview
- iframe code
- JavaScript embed code
- destination URL
- theme/brand summary
- consent configuration summary

**First preset**

`funding-readiness-scorecard-widget`

**Rules**

- Widget definitions remain owned by Embed Widgets.
- Dashboard stores assignments and configuration references, not forked scoring logic.
- Browser code must never contain the Partner Command Center API key.

### Commissions

**Source inspiration:** FPOS overview and commission estimator.

**MVP components**

- estimated commission total
- verified commission total
- paid total
- pending verification total
- per-lead estimate
- calculation basis label
- disclaimer

**Rules**

- Estimates are projections only.
- Verified and paid values require an authorized internal source.
- Partners may not edit commission rate, points, status, or payout values from the dashboard.
- Do not promise payout timing.

### Settings

**Source inspiration:** FPOS configuration and Partner Command Center partner profile.

**Sections**

- partner profile
- company/brand name
- logo
- website
- contact email and phone
- notification preferences
- default campaign
- default destination
- default widget theme
- webhook destination request, later
- privacy and consent links

**Read-only identity fields**

- partner ID
- tier
- partner status
- verification status
- created date

### Notifications

Notifications appear in Overview and as a top-bar drawer rather than a separate MVP navigation item.

**Types**

- lead status changed
- partner action requested
- resource assigned
- tracking link paused
- widget update available
- commission verified
- onboarding action due

**Fields**

- notification ID
- type
- title
- safe message
- severity
- target URL
- created date
- read date

## Component reuse map

| Component | Source | Integration approach |
|---|---|---|
| responsive shell/sidebar | FPOS | port markup and styling into Partner Command Center |
| mobile menu | FPOS | preserve static JavaScript interaction |
| metric cards | FPOS | bind to `/api/dashboard/bootstrap` summary |
| pipeline | FPOS | replace localStorage with API-loaded lead collection |
| activity feed | Partner Command Center | bind to safe Partner Events projection |
| submit-lead form | Partner Command Center | post canonical payload to `/api/lead-router` |
| tracking-link builder | Partner Command Center | use `/api/partner-links` and Tracking Links |
| resource cards | Partner Command Center | use Partner Resources projection |
| authenticated route guard | Funding Partners OS Agent Dashboard | adapt pattern; do not copy the React shell |
| widget cards/embed code | Embed Widgets | consume preset registry and assignment data |
| campaign/content cards | PartnerLaunch | phase-two reuse |
| academy/resource visual patterns | PartnerLaunch / EliteBroker | phase-two inspiration |

## Excluded from MVP

- lender directory
- provider-level matching
- underwriting notes
- raw bank or tax information
- document upload storage
- AI chat
- content generation
- team/sub-partner hierarchy
- billing/subscriptions
- white-label domain provisioning
- editable commission rates
- arbitrary webhook configuration

These can be added only after the dashboard contract, authentication, and public/private boundaries are stable.
